const Medico = require('../models/Medico');
const mongoose = require('mongoose');
const mapeamentoMedicoService = require('./mapeamentoMedicoService');

class UpsertMedicoService {
  /**
   * Executa upsert em lotes com deduplicação
   * @param {Array} medicos - Array de médicos normalizados
   * @param {Object} opcoes - Opções de processamento
   * @returns {Object} Resultado do processamento
   */
  async executarUpsert(medicos, opcoes = {}) {
    const {
      tamanhoBatch = 500,
      fonte = 'importacao-manual',
      jobId = null
    } = opcoes;

    const resultado = {
      criados: 0,
      atualizados: 0,
      ignorados: 0,
      erros: [],
      processados: 0,
      total: medicos.length
    };

    // Processar em lotes
    for (let i = 0; i < medicos.length; i += tamanhoBatch) {
      const lote = medicos.slice(i, i + tamanhoBatch);
      
      try {
        const resultadoLote = await this.processarLote(lote, fonte, jobId);
        
        resultado.criados += resultadoLote.criados;
        resultado.atualizados += resultadoLote.atualizados;
        resultado.ignorados += resultadoLote.ignorados;
        resultado.erros.push(...resultadoLote.erros);
        resultado.processados += resultadoLote.processados;
        
        // Log de progresso
        console.log(`[${jobId}] Lote ${Math.floor(i / tamanhoBatch) + 1}: ${resultadoLote.processados} processados`);
        
      } catch (error) {
        console.error(`[${jobId}] Erro no lote ${Math.floor(i / tamanhoBatch) + 1}:`, error);
        
        // Adicionar erro para cada médico do lote
        lote.forEach(medico => {
          resultado.erros.push({
            linha: medico._numeroLinha,
            motivo: `Erro no lote: ${error.message}`,
            dados: medico
          });
        });
      }
    }

    return resultado;
  }

  /**
   * Processa um lote de médicos
   * @param {Array} lote - Lote de médicos
   * @param {string} fonte - Fonte da importação
   * @param {string} jobId - ID do job
   * @returns {Object} Resultado do lote
   */
  async processarLote(lote, fonte, jobId) {
    const session = await mongoose.startSession();
    
    try {
      return await session.withTransaction(async () => {
        const resultado = {
          criados: 0,
          atualizados: 0,
          ignorados: 0,
          erros: [],
          processados: 0
        };

        for (const medico of lote) {
          try {
            const resultadoMedico = await this.processarMedicoIndividual(medico, fonte, session);
            
            if (resultadoMedico.acao === 'criado') {
              resultado.criados++;
            } else if (resultadoMedico.acao === 'atualizado') {
              resultado.atualizados++;
            } else if (resultadoMedico.acao === 'ignorado') {
              resultado.ignorados++;
            }
            
            resultado.processados++;
            
          } catch (error) {
            console.error(`[${jobId}] Erro ao processar médico linha ${medico._numeroLinha}:`, error);
            
            resultado.erros.push({
              linha: medico._numeroLinha,
              motivo: error.message,
              dados: medico
            });
          }
        }

        return resultado;
      });
      
    } finally {
      await session.endSession();
    }
  }

  /**
   * Processa um médico individual
   * @param {Object} medico - Dados do médico
   * @param {string} fonte - Fonte da importação
   * @param {Object} session - Sessão do MongoDB
   * @returns {Object} Resultado do processamento
   */
  async processarMedicoIndividual(medico, fonte, session) {
    // Gerar chave de deduplicação
    const chaveDedup = mapeamentoMedicoService.gerarChaveDeduplicacao(medico);
    
    if (!chaveDedup) {
      throw new Error('Não foi possível gerar chave de deduplicação');
    }

    // Buscar médico existente
    const medicoExistente = await this.buscarMedicoExistente(chaveDedup, session);
    
    // Preparar dados para salvar
    const dadosParaSalvar = { ...medico };
    delete dadosParaSalvar._numeroLinha;
    dadosParaSalvar.fonte = fonte;
    dadosParaSalvar.updatedAt = new Date();

    if (medicoExistente) {
      // Atualizar médico existente
      const dadosAtualizados = this.mesclarDados(medicoExistente, dadosParaSalvar);
      
      await Medico.findByIdAndUpdate(
        medicoExistente._id,
        dadosAtualizados,
        { session, new: true }
      );
      
      return { acao: 'atualizado', medico: medicoExistente };
      
    } else {
      // Criar novo médico
      dadosParaSalvar.createdAt = new Date();
      
      const novoMedico = new Medico(dadosParaSalvar);
      await novoMedico.save({ session });
      
      return { acao: 'criado', medico: novoMedico };
    }
  }

  /**
   * Busca médico existente baseado na chave de deduplicação
   * @param {Object} chaveDedup - Chave de deduplicação
   * @param {Object} session - Sessão do MongoDB
   * @returns {Object|null} Médico encontrado ou null
   */
  async buscarMedicoExistente(chaveDedup, session) {
    let query = {};
    
    switch (chaveDedup.tipo) {
      case 'crm_uf':
        const [crm, uf_crm] = chaveDedup.chave.split('_');
        query = { crm, uf_crm };
        break;
        
      case 'cpf':
        query = { cpf: chaveDedup.chave };
        break;
        
      case 'email':
        query = { email: chaveDedup.chave };
        break;
        
      case 'nome_telefone':
        const [nome, telefone] = chaveDedup.chave.split('_');
        query = { 
          nome: new RegExp(`^${nome}$`, 'i'),
          telefone
        };
        break;
        
      default:
        return null;
    }
    
    return await Medico.findOne(query).session(session);
  }

  /**
   * Mescla dados existentes com novos dados
   * @param {Object} medicoExistente - Médico existente
   * @param {Object} novosDados - Novos dados
   * @returns {Object} Dados mesclados
   */
  mesclarDados(medicoExistente, novosDados) {
    const dadosMesclados = { ...medicoExistente.toObject() };
    
    // Campos que sempre são atualizados se presentes
    const camposAtualizaveis = [
      'nome', 'email', 'telefone', 'crm', 'uf_crm', 'cpf', 'cnpj',
      'especialidade_principal', 'cidade', 'uf', 'disponibilidade',
      'valor_hora', 'status', 'fonte', 'updatedAt'
    ];
    
    camposAtualizaveis.forEach(campo => {
      if (novosDados[campo] !== undefined && novosDados[campo] !== null && novosDados[campo] !== '') {
        dadosMesclados[campo] = novosDados[campo];
      }
    });
    
    // Arrays são mesclados (união sem duplicatas)
    const camposArray = ['rqe', 'subespecialidades', 'hospitais_vinculo', 'tags'];
    
    camposArray.forEach(campo => {
      if (novosDados[campo] && Array.isArray(novosDados[campo])) {
        const arrayExistente = dadosMesclados[campo] || [];
        const arrayNovo = novosDados[campo];
        
        // União sem duplicatas (case-insensitive)
        const uniao = [...arrayExistente];
        
        arrayNovo.forEach(item => {
          const itemLower = item.toLowerCase();
          const jaExiste = uniao.some(existente => 
            existente.toLowerCase() === itemLower
          );
          
          if (!jaExiste) {
            uniao.push(item);
          }
        });
        
        dadosMesclados[campo] = uniao;
      }
    });
    
    return dadosMesclados;
  }

  /**
   * Valida se médico pode ser processado
   * @param {Object} medico - Dados do médico
   * @returns {Object} { valido, motivo }
   */
  validarMedico(medico) {
    // Validações básicas
    if (!medico.nome || medico.nome.trim() === '') {
      return { valido: false, motivo: 'Nome é obrigatório' };
    }
    
    if (!medico.crm) {
      return { valido: false, motivo: 'CRM é obrigatório' };
    }
    
    if (!medico.uf_crm) {
      return { valido: false, motivo: 'UF do CRM é obrigatória' };
    }
    
    // Verificar chave de deduplicação
    const chaveDedup = mapeamentoMedicoService.gerarChaveDeduplicacao(medico);
    if (!chaveDedup) {
      return { 
        valido: false, 
        motivo: 'Dados insuficientes para deduplicação (necessário CRM+UF, CPF, Email ou Nome+Telefone)' 
      };
    }
    
    return { valido: true };
  }

  /**
   * Gera relatório de importação
   * @param {Object} resultado - Resultado do processamento
   * @param {string} jobId - ID do job
   * @returns {Object} Relatório formatado
   */
  gerarRelatorio(resultado, jobId) {
    const { criados, atualizados, ignorados, erros, processados, total } = resultado;
    
    const relatorio = {
      jobId,
      timestamp: new Date(),
      resumo: {
        total,
        processados,
        criados,
        atualizados,
        ignorados,
        erros: erros.length
      },
      detalhes: {
        taxaSucesso: ((processados - erros.length) / total * 100).toFixed(2) + '%',
        taxaErro: (erros.length / total * 100).toFixed(2) + '%'
      },
      erros: erros.map(erro => ({
        linha: erro.linha,
        motivo: erro.motivo,
        dados: erro.dados ? {
          nome: erro.dados.nome,
          crm: erro.dados.crm,
          email: erro.dados.email
        } : null
      }))
    };
    
    return relatorio;
  }

  /**
   * Gera CSV de erros
   * @param {Array} erros - Lista de erros
   * @returns {string} CSV formatado
   */
  gerarCSVErros(erros) {
    if (erros.length === 0) {
      return 'Nenhum erro encontrado';
    }
    
    const cabecalho = 'Linha,Motivo,Nome,CRM,Email\n';
    
    const linhas = erros.map(erro => {
      const linha = erro.linha || 'N/A';
      const motivo = (erro.motivo || '').replace(/,/g, ';');
      const nome = (erro.dados?.nome || '').replace(/,/g, ';');
      const crm = erro.dados?.crm || '';
      const email = erro.dados?.email || '';
      
      return `${linha},"${motivo}","${nome}",${crm},${email}`;
    }).join('\n');
    
    return cabecalho + linhas;
  }

  /**
   * Limpa dados temporários de processamento
   * @param {Array} medicos - Array de médicos
   * @returns {Array} Médicos limpos
   */
  limparDadosTemporarios(medicos) {
    return medicos.map(medico => {
      const medicoLimpo = { ...medico };
      delete medicoLimpo._numeroLinha;
      return medicoLimpo;
    });
  }

  /**
   * Estatísticas de performance
   * @param {Date} inicio - Timestamp de início
   * @param {Object} resultado - Resultado do processamento
   * @returns {Object} Estatísticas
   */
  calcularEstatisticas(inicio, resultado) {
    const fim = new Date();
    const tempoTotal = fim - inicio;
    const { processados, total } = resultado;
    
    return {
      tempoTotal: `${(tempoTotal / 1000).toFixed(2)}s`,
      registrosPorSegundo: processados > 0 ? (processados / (tempoTotal / 1000)).toFixed(2) : '0',
      eficiencia: `${((processados / total) * 100).toFixed(2)}%`
    };
  }
}

module.exports = new UpsertMedicoService();