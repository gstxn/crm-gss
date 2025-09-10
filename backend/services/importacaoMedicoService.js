const XLSX = require('xlsx');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const Medico = require('../models/Medico');
const ValidacaoMedicoService = require('./validacaoMedicoService');
const { AppError } = require('../utils/errorHandler');

class ImportacaoMedicoService {
  constructor() {
    this.validacaoService = new ValidacaoMedicoService();
  }

  /**
   * Processa arquivo de importação (Excel ou CSV)
   */
  async processarArquivo(arquivo, opcoes = {}) {
    try {
      const { mapeamento = {}, validarDados = true } = opcoes;
      
      let dados = [];
      const extensao = path.extname(arquivo.originalname).toLowerCase();
      
      if (extensao === '.xlsx' || extensao === '.xls') {
        dados = await this.lerArquivoExcel(arquivo.path);
      } else if (extensao === '.csv') {
        dados = await this.lerArquivoCSV(arquivo.path);
      } else {
        throw new AppError('Formato de arquivo não suportado. Use Excel (.xlsx, .xls) ou CSV (.csv)', 400);
      }
      
      // Aplicar mapeamento de colunas se fornecido
      if (Object.keys(mapeamento).length > 0) {
        dados = this.aplicarMapeamento(dados, mapeamento);
      }
      
      // Normalizar dados
      dados = dados.map(item => this.validacaoService.normalizarDadosMedico(item));
      
      // Validar dados se solicitado
      let resultadoValidacao = null;
      if (validarDados) {
        resultadoValidacao = await this.validacaoService.validarLoteMedicos(dados);
      }
      
      return {
        dados,
        total: dados.length,
        validacao: resultadoValidacao
      };
      
    } catch (error) {
      throw new AppError(`Erro ao processar arquivo: ${error.message}`, 500);
    }
  }

  /**
   * Lê arquivo Excel
   */
  async lerArquivoExcel(caminhoArquivo) {
    try {
      const workbook = XLSX.readFile(caminhoArquivo);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      
      const dados = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: ''
      });
      
      if (dados.length === 0) {
        throw new AppError('Arquivo Excel está vazio', 400);
      }
      
      // Primeira linha como cabeçalho
      const cabecalho = dados[0];
      const linhas = dados.slice(1);
      
      return linhas.map(linha => {
        const objeto = {};
        cabecalho.forEach((coluna, index) => {
          if (coluna && linha[index] !== undefined) {
            objeto[coluna.toString().toLowerCase().trim()] = linha[index];
          }
        });
        return objeto;
      });
      
    } catch (error) {
      throw new AppError(`Erro ao ler arquivo Excel: ${error.message}`, 500);
    }
  }

  /**
   * Lê arquivo CSV
   */
  async lerArquivoCSV(caminhoArquivo) {
    return new Promise((resolve, reject) => {
      const dados = [];
      
      fs.createReadStream(caminhoArquivo)
        .pipe(csv())
        .on('data', (linha) => {
          // Normalizar chaves para lowercase
          const linhaNormalizada = {};
          Object.keys(linha).forEach(chave => {
            linhaNormalizada[chave.toLowerCase().trim()] = linha[chave];
          });
          dados.push(linhaNormalizada);
        })
        .on('end', () => {
          resolve(dados);
        })
        .on('error', (error) => {
          reject(new AppError(`Erro ao ler arquivo CSV: ${error.message}`, 500));
        });
    });
  }

  /**
   * Aplica mapeamento de colunas
   */
  aplicarMapeamento(dados, mapeamento) {
    return dados.map(item => {
      const itemMapeado = {};
      
      Object.keys(mapeamento).forEach(chaveOriginal => {
        const chaveDestino = mapeamento[chaveOriginal];
        if (item[chaveOriginal] !== undefined) {
          itemMapeado[chaveDestino] = item[chaveOriginal];
        }
      });
      
      return itemMapeado;
    });
  }

  /**
   * Importa médicos para o banco de dados
   */
  async importarMedicos(dados, opcoes = {}) {
    try {
      const { 
        atualizarExistentes = true, 
        validarAntes = true,
        loteSize = 100 
      } = opcoes;
      
      let dadosParaImportar = dados;
      
      // Validar dados antes da importação se solicitado
      if (validarAntes) {
        const validacao = await this.validacaoService.validarLoteMedicos(dados);
        dadosParaImportar = validacao.resultados
          .filter(r => r.valido)
          .map(r => r.medico);
      }
      
      const resultados = {
        total: dados.length,
        processados: 0,
        inseridos: 0,
        atualizados: 0,
        erros: []
      };
      
      // Processar em lotes
      for (let i = 0; i < dadosParaImportar.length; i += loteSize) {
        const lote = dadosParaImportar.slice(i, i + loteSize);
        
        for (const dadosMedico of lote) {
          try {
            const resultado = await this.upsertMedico(dadosMedico, atualizarExistentes);
            
            if (resultado.inserido) {
              resultados.inseridos++;
            } else if (resultado.atualizado) {
              resultados.atualizados++;
            }
            
            resultados.processados++;
            
          } catch (error) {
            resultados.erros.push({
              linha: i + 1,
              dados: dadosMedico,
              erro: error.message
            });
          }
        }
      }
      
      return resultados;
      
    } catch (error) {
      throw new AppError(`Erro na importação: ${error.message}`, 500);
    }
  }

  /**
   * Insere ou atualiza médico (upsert)
   */
  async upsertMedico(dadosMedico, permitirAtualizacao = true) {
    try {
      // Buscar médico existente por critérios de deduplicação
      let medicoExistente = null;
      
      // 1. Buscar por CRM + UF
      if (dadosMedico.crm && dadosMedico.uf_crm) {
        medicoExistente = await Medico.findOne({
          crm: dadosMedico.crm,
          uf_crm: dadosMedico.uf_crm
        });
      }
      
      // 2. Se não encontrou, buscar por CPF
      if (!medicoExistente && dadosMedico.cpf) {
        medicoExistente = await Medico.findOne({ cpf: dadosMedico.cpf });
      }
      
      // 3. Se não encontrou, buscar por email
      if (!medicoExistente && dadosMedico.email) {
        medicoExistente = await Medico.findOne({ email: dadosMedico.email });
      }
      
      // 4. Se não encontrou, buscar por nome + telefone
      if (!medicoExistente && dadosMedico.nome && dadosMedico.telefone) {
        medicoExistente = await Medico.findOne({
          nome: dadosMedico.nome,
          telefone: dadosMedico.telefone
        });
      }
      
      if (medicoExistente) {
        if (permitirAtualizacao) {
          // Atualizar médico existente
          Object.assign(medicoExistente, dadosMedico);
          await medicoExistente.save();
          
          return {
            medico: medicoExistente,
            inserido: false,
            atualizado: true
          };
        } else {
          return {
            medico: medicoExistente,
            inserido: false,
            atualizado: false
          };
        }
      } else {
        // Criar novo médico
        const novoMedico = new Medico(dadosMedico);
        await novoMedico.save();
        
        return {
          medico: novoMedico,
          inserido: true,
          atualizado: false
        };
      }
      
    } catch (error) {
      throw new AppError(`Erro ao salvar médico: ${error.message}`, 500);
    }
  }

  /**
   * Obtém preview dos dados do arquivo
   */
  async obterPreview(arquivo, linhas = 5) {
    try {
      const resultado = await this.processarArquivo(arquivo, { validarDados: false });
      
      return {
        colunas: resultado.dados.length > 0 ? Object.keys(resultado.dados[0]) : [],
        preview: resultado.dados.slice(0, linhas),
        total: resultado.total
      };
      
    } catch (error) {
      throw new AppError(`Erro ao gerar preview: ${error.message}`, 500);
    }
  }
}

module.exports = ImportacaoMedicoService;