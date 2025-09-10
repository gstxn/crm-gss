const MedicoDisparo = require('../models/MedicoDisparo');
const xlsx = require('xlsx');
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class MedicoDisparoService {
  
  /**
   * Validar formato de telefone
   * @param {string} telefone 
   * @returns {boolean}
   */
  static validarTelefone(telefone) {
    if (!telefone) return false;
    
    const normalized = telefone.replace(/\D/g, '');
    return normalized.length >= 10 && normalized.length <= 13;
  }
  
  /**
   * Normalizar telefone (manter apenas dígitos)
   * @param {string} telefone 
   * @returns {string}
   */
  static normalizarTelefone(telefone) {
    if (!telefone) return '';
    return telefone.replace(/\D/g, '');
  }
  
  /**
   * Validar formato de email
   * @param {string} email 
   * @returns {boolean}
   */
  static validarEmail(email) {
    if (!email) return true; // Email é opcional
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
  
  /**
   * Parsear especialidades de string para array
   * @param {string} especialidadesStr 
   * @returns {Array<string>}
   */
  static parseEspecialidades(especialidadesStr) {
    if (!especialidadesStr) return [];
    
    return especialidadesStr
      .split(/[,;]/)
      .map(esp => esp.trim())
      .filter(esp => esp.length > 0);
  }
  
  /**
   * Processar dados de importação com mapeamento automático
   * @param {Object} dadosLinha 
   * @returns {Object}
   */
  static processarDadosImportacao(dadosLinha) {
    const dados = {};
    
    // Mapeamento automático de colunas
    const mapeamento = {
      'Cliente': 'nome',
      'cliente': 'nome',
      'Nome': 'nome',
      'nome': 'nome',
      'Contato': 'telefone',
      'contato': 'telefone',
      'Telefone': 'telefone',
      'telefone': 'telefone',
      'Tags': 'especialidades',
      'tags': 'especialidades',
      'Especialidades': 'especialidades',
      'especialidades': 'especialidades',
      'Canal': 'canal',
      'canal': 'canal',
      'E-mail': 'email',
      'email': 'email',
      'Email': 'email',
      'Código': 'codigo_origem',
      'codigo': 'codigo_origem',
      'Codigo': 'codigo_origem',
      'codigo_origem': 'codigo_origem'
    };
    
    // Aplicar mapeamento
    Object.keys(dadosLinha).forEach(coluna => {
      const campoDestino = mapeamento[coluna];
      if (campoDestino && dadosLinha[coluna]) {
        dados[campoDestino] = dadosLinha[coluna];
      }
    });
    
    // Processar campos específicos
    if (dados.telefone) {
      dados.telefone = this.normalizarTelefone(dados.telefone);
    }
    
    if (dados.especialidades && typeof dados.especialidades === 'string') {
      dados.especialidades = this.parseEspecialidades(dados.especialidades);
    }
    
    if (dados.email) {
      dados.email = dados.email.toLowerCase().trim();
    }
    
    if (dados.nome) {
      dados.nome = dados.nome.trim();
    }
    
    if (dados.canal) {
      dados.canal = dados.canal.trim();
    }
    
    if (dados.codigo_origem) {
      dados.codigo_origem = dados.codigo_origem.trim();
    }
    
    return dados;
  }
  
  /**
   * Validar dados processados
   * @param {Object} dados 
   * @returns {Object} { valido: boolean, erros: Array<string> }
   */
  static validarDados(dados) {
    const erros = [];
    
    // Telefone é obrigatório
    if (!dados.telefone) {
      erros.push('Telefone é obrigatório');
    } else if (!this.validarTelefone(dados.telefone)) {
      erros.push('Telefone deve ter entre 10 e 13 dígitos');
    }
    
    // Validar email se fornecido
    if (dados.email && !this.validarEmail(dados.email)) {
      erros.push('Email deve ter formato válido');
    }
    
    return {
      valido: erros.length === 0,
      erros
    };
  }
  
  /**
   * Fazer upsert com merge de dados por telefone
   * @param {Object} novosDados 
   * @param {string} origemRegistro 
   * @param {string} usuarioId 
   * @returns {Promise<Object>} { inserido: boolean, atualizado: boolean, medico: Object }
   */
  static async upsertPorTelefone(novosDados, origemRegistro = 'xlsx_upload', usuarioId = null) {
    const telefoneNormalizado = this.normalizarTelefone(novosDados.telefone);
    
    if (!telefoneNormalizado) {
      throw new Error('Telefone é obrigatório');
    }
    
    // Buscar médico existente por telefone
    const medicoExistente = await MedicoDisparo.findOne({ telefone: telefoneNormalizado });
    
    if (medicoExistente) {
      // Fazer merge dos dados
      const dadosMerged = MedicoDisparo.mergeData(medicoExistente, novosDados);
      
      // Atualizar campos de auditoria
      dadosMerged.atualizado_por = usuarioId;
      
      // Atualizar registro existente
      Object.assign(medicoExistente, dadosMerged);
      const medicoAtualizado = await medicoExistente.save();
      
      return {
        inserido: false,
        atualizado: true,
        medico: medicoAtualizado
      };
    } else {
      // Criar novo registro
      const dadosCompletos = {
        ...novosDados,
        telefone: telefoneNormalizado,
        origem_registro: origemRegistro,
        criado_por: usuarioId,
        atualizado_por: usuarioId
      };
      
      const novoMedico = new MedicoDisparo(dadosCompletos);
      const medicoSalvo = await novoMedico.save();
      
      return {
        inserido: true,
        atualizado: false,
        medico: medicoSalvo
      };
    }
  }
  
  /**
   * Processar arquivo XLSX/CSV para importação
   * @param {Buffer} bufferArquivo 
   * @param {string} nomeArquivo 
   * @param {string} usuarioId 
   * @returns {Promise<Object>} Resultado da importação
   */
  static async processarArquivoImportacao(bufferArquivo, nomeArquivo, usuarioId) {
    const resultado = {
      total_linhas: 0,
      inseridos: 0,
      atualizados: 0,
      ignorados: 0,
      erros: []
    };
    
    try {
      // Ler arquivo Excel/CSV
      const workbook = xlsx.read(bufferArquivo, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const dados = xlsx.utils.sheet_to_json(worksheet);
      
      resultado.total_linhas = dados.length;
      
      // Processar cada linha
      for (let i = 0; i < dados.length; i++) {
        const linha = dados[i];
        const numeroLinha = i + 2; // +2 porque começa na linha 2 (cabeçalho na 1)
        
        try {
          // Processar dados da linha
          const dadosProcessados = this.processarDadosImportacao(linha);
          
          // Validar dados
          const validacao = this.validarDados(dadosProcessados);
          
          if (!validacao.valido) {
            resultado.ignorados++;
            resultado.erros.push({
              linha: numeroLinha,
              erros: validacao.erros
            });
            continue;
          }
          
          // Fazer upsert
          const resultadoUpsert = await this.upsertPorTelefone(
            dadosProcessados,
            'xlsx_upload',
            usuarioId
          );
          
          if (resultadoUpsert.inserido) {
            resultado.inseridos++;
          } else if (resultadoUpsert.atualizado) {
            resultado.atualizados++;
          }
          
        } catch (error) {
          resultado.ignorados++;
          resultado.erros.push({
            linha: numeroLinha,
            erros: [error.message]
          });
        }
      }
      
    } catch (error) {
      throw new Error(`Erro ao processar arquivo: ${error.message}`);
    }
    
    return resultado;
  }
  
  /**
   * Sincronizar com Google Sheets
   * @param {string} spreadsheetId 
   * @param {string} range 
   * @param {string} usuarioId 
   * @returns {Promise<Object>} Resultado da sincronização
   */
  static async sincronizarGoogleSheets(spreadsheetId, range, usuarioId) {
    const resultado = {
      total_linhas: 0,
      inseridos: 0,
      atualizados: 0,
      ignorados: 0,
      erros: []
    };
    
    try {
      // Configurar cliente Google Sheets
      const serviceAccountPath = path.join(__dirname, '../config/service-account.json');
      
      if (!fs.existsSync(serviceAccountPath)) {
        throw new Error('Arquivo de credenciais do Google Sheets não encontrado');
      }
      
      const credentials = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
      
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly']
      });
      
      const sheets = google.sheets({ version: 'v4', auth });
      
      // Ler dados da planilha
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range
      });
      
      const rows = response.data.values;
      
      if (!rows || rows.length === 0) {
        throw new Error('Nenhum dado encontrado na planilha');
      }
      
      // Primeira linha são os cabeçalhos
      const headers = rows[0];
      const dataRows = rows.slice(1);
      
      resultado.total_linhas = dataRows.length;
      
      // Processar cada linha
      for (let i = 0; i < dataRows.length; i++) {
        const row = dataRows[i];
        const numeroLinha = i + 2;
        
        try {
          // Converter linha em objeto usando cabeçalhos
          const dadosLinha = {};
          headers.forEach((header, index) => {
            if (row[index]) {
              dadosLinha[header] = row[index];
            }
          });
          
          // Processar dados da linha
          const dadosProcessados = this.processarDadosImportacao(dadosLinha);
          
          // Validar dados
          const validacao = this.validarDados(dadosProcessados);
          
          if (!validacao.valido) {
            resultado.ignorados++;
            resultado.erros.push({
              linha: numeroLinha,
              erros: validacao.erros
            });
            continue;
          }
          
          // Fazer upsert
          const resultadoUpsert = await this.upsertPorTelefone(
            dadosProcessados,
            'google_sheets_sync',
            usuarioId
          );
          
          if (resultadoUpsert.inserido) {
            resultado.inseridos++;
          } else if (resultadoUpsert.atualizado) {
            resultado.atualizados++;
          }
          
        } catch (error) {
          resultado.ignorados++;
          resultado.erros.push({
            linha: numeroLinha,
            erros: [error.message]
          });
        }
      }
      
    } catch (error) {
      throw new Error(`Erro ao sincronizar com Google Sheets: ${error.message}`);
    }
    
    return resultado;
  }
  
  /**
   * Obter contatos para disparo com filtros
   * @param {Object} filtros 
   * @param {Object} paginacao 
   * @returns {Promise<Object>}
   */
  static async obterContatosDisparo(filtros = {}, paginacao = {}) {
    const query = {
      permitido_envio: true,
      status_contato: { $in: ['novo', 'fila'] }
    };
    
    // Aplicar filtros
    if (filtros.especialidade) {
      query.especialidades = { $in: [filtros.especialidade] };
    }
    
    if (filtros.especialidades && Array.isArray(filtros.especialidades)) {
      query.especialidades = { $in: filtros.especialidades };
    }
    
    if (filtros.status) {
      query.status_contato = filtros.status;
    }
    
    // Configurar paginação
    const page = parseInt(paginacao.page) || 1;
    const limit = parseInt(paginacao.limit) || 100;
    const skip = (page - 1) * limit;
    
    // Executar query
    const contatos = await MedicoDisparo.find(query)
      .select('telefone especialidades')
      .limit(limit)
      .skip(skip)
      .lean();
    
    const total = await MedicoDisparo.countDocuments(query);
    
    return {
      contatos,
      paginacao: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * Executar ações em massa
   * @param {Array<string>} ids 
   * @param {string} acao 
   * @param {string} usuarioId 
   * @returns {Promise<Object>}
   */
  static async executarAcaoMassa(ids, acao, usuarioId) {
    const resultado = {
      processados: 0,
      erros: []
    };
    
    try {
      switch (acao) {
        case 'adicionar_fila':
          await MedicoDisparo.updateMany(
            { _id: { $in: ids } },
            { 
              status_contato: 'fila',
              atualizado_por: usuarioId
            }
          );
          break;
          
        case 'marcar_enviado':
          await MedicoDisparo.updateMany(
            { _id: { $in: ids } },
            { 
              status_contato: 'enviado',
              ultima_interacao_em: new Date(),
              $inc: { total_envios: 1 },
              atualizado_por: usuarioId
            }
          );
          break;
          
        case 'marcar_opt_out':
          await MedicoDisparo.updateMany(
            { _id: { $in: ids } },
            { 
              permitido_envio: false,
              status_contato: 'opt_out',
              ultima_interacao_em: new Date(),
              atualizado_por: usuarioId
            }
          );
          break;
          
        case 'excluir':
          await MedicoDisparo.deleteMany({ _id: { $in: ids } });
          break;
          
        default:
          throw new Error(`Ação '${acao}' não reconhecida`);
      }
      
      resultado.processados = ids.length;
      
    } catch (error) {
      resultado.erros.push(error.message);
    }
    
    return resultado;
  }

  /**
   * Obter preview de importação - extrair cabeçalhos e primeiras linhas
   * @param {Buffer} bufferArquivo 
   * @param {string} nomeArquivo 
   * @returns {Promise<Object>} Preview dos dados
   */
  static async obterPreviewImportacao(bufferArquivo, nomeArquivo) {
    try {
      // Ler arquivo Excel/CSV
      const workbook = xlsx.read(bufferArquivo, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const dados = xlsx.utils.sheet_to_json(worksheet);
      
      if (dados.length === 0) {
        throw new Error('Arquivo não contém dados válidos');
      }
      
      // Extrair cabeçalhos
      const headers = Object.keys(dados[0]);
      
      // Retornar primeiras 5 linhas para preview
      const preview = dados.slice(0, 5);
      
      return {
        headers,
        data: preview,
        totalRows: dados.length
      };
      
    } catch (error) {
      throw new Error(`Erro ao processar arquivo para preview: ${error.message}`);
    }
  }

  /**
   * Processar arquivo com mapeamento personalizado
   * @param {Buffer} bufferArquivo 
   * @param {string} nomeArquivo 
   * @param {Object} mapping 
   * @param {string} usuarioId 
   * @returns {Promise<Object>} Resultado da importação
   */
  static async processarArquivoImportacaoComMapeamento(bufferArquivo, nomeArquivo, mapping, usuarioId) {
    const resultado = {
      processados: 0,
      novos: 0,
      atualizados: 0,
      erros: 0,
      detalhes: []
    };
    
    try {
      // Ler arquivo Excel/CSV
      const workbook = xlsx.read(bufferArquivo, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const dados = xlsx.utils.sheet_to_json(worksheet);
      
      resultado.processados = dados.length;
      
      // Processar cada linha
      for (let i = 0; i < dados.length; i++) {
        const linha = dados[i];
        const numeroLinha = i + 2; // +2 porque começa na linha 2 (cabeçalho na 1)
        
        try {
          // Aplicar mapeamento personalizado
          const dadosProcessados = this.aplicarMapeamento(linha, mapping);
          
          // Validar dados
          const validacao = this.validarDados(dadosProcessados);
          
          if (!validacao.valido) {
            resultado.erros++;
            resultado.detalhes.push({
              tipo: 'error',
              mensagem: `Linha ${numeroLinha}: ${validacao.erros.join(', ')}`
            });
            continue;
          }
          
          // Fazer upsert
          const resultadoUpsert = await this.upsertPorTelefone(
            dadosProcessados,
            'xlsx_upload_mapped',
            usuarioId
          );
          
          if (resultadoUpsert.inserido) {
            resultado.novos++;
            resultado.detalhes.push({
              tipo: 'success',
              mensagem: `Linha ${numeroLinha}: Novo médico adicionado - ${dadosProcessados.nome}`
            });
          } else if (resultadoUpsert.atualizado) {
            resultado.atualizados++;
            resultado.detalhes.push({
              tipo: 'warning',
              mensagem: `Linha ${numeroLinha}: Médico atualizado - ${dadosProcessados.nome}`
            });
          }
          
        } catch (error) {
          resultado.erros++;
          resultado.detalhes.push({
            tipo: 'error',
            mensagem: `Linha ${numeroLinha}: ${error.message}`
          });
        }
      }
      
    } catch (error) {
      throw new Error(`Erro ao processar arquivo: ${error.message}`);
    }
    
    return resultado;
  }

  /**
   * Aplicar mapeamento personalizado aos dados
   * @param {Object} linha 
   * @param {Object} mapping 
   * @returns {Object} Dados mapeados
   */
  static aplicarMapeamento(linha, mapping) {
    const dados = {};
    
    // Aplicar mapeamento
    Object.keys(mapping).forEach(campoDestino => {
      const colunaOrigem = mapping[campoDestino];
      if (colunaOrigem && linha[colunaOrigem]) {
        dados[campoDestino] = linha[colunaOrigem];
      }
    });
    
    // Processar campos específicos
    if (dados.telefone) {
      dados.telefone = this.normalizarTelefone(dados.telefone);
    }
    
    if (dados.especialidades && typeof dados.especialidades === 'string') {
      dados.especialidades = this.parseEspecialidades(dados.especialidades);
    }
    
    if (dados.email) {
      dados.email = dados.email.toLowerCase().trim();
    }
    
    // Definir valores padrão
    dados.canal = dados.canal || 'importacao';
    dados.status_contato = dados.status_contato || 'novo';
    dados.permitido_envio = dados.permitido_envio !== false;
    
    return dados;
  }
}

module.exports = MedicoDisparoService;