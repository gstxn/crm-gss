const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');
const fs = require('fs');
const path = require('path');
const loggingService = require('./loggingService');
const MapeamentoMedicoService = require('./mapeamentoMedicoService');
const ValidacaoMedicoService = require('./validacaoMedicoService');

class GoogleSheetsIntegrationService {
  constructor() {
    this.mapeamentoService = new MapeamentoMedicoService();
    this.validacaoService = new ValidacaoMedicoService();
    this.logger = loggingService.child({ service: 'google-sheets-integration' });
    this.serviceAccount = this.loadServiceAccount();
  }

  /**
   * Carrega as credenciais do Service Account
   */
  loadServiceAccount() {
    try {
      // Tentar carregar do arquivo de credenciais
      const credentialsPath = process.env.GOOGLE_SERVICE_ACCOUNT_PATH || 
                             path.join(__dirname, '../config/google-service-account.json');
      
      if (fs.existsSync(credentialsPath)) {
        const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
        this.logger.info('Service Account carregado do arquivo');
        return credentials;
      }

      // Tentar carregar das variáveis de ambiente
      if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
        const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
        this.logger.info('Service Account carregado das variáveis de ambiente');
        return credentials;
      }

      // Construir das variáveis individuais
      if (process.env.GOOGLE_CLIENT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
        const credentials = {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          project_id: process.env.GOOGLE_PROJECT_ID
        };
        this.logger.info('Service Account construído das variáveis individuais');
        return credentials;
      }

      throw new Error('Credenciais do Google Service Account não encontradas');
    } catch (error) {
      this.logger.error('Erro ao carregar Service Account', error);
      throw error;
    }
  }

  /**
   * Cria cliente JWT para autenticação
   */
  createJWTClient() {
    if (!this.serviceAccount) {
      throw new Error('Service Account não configurado');
    }

    return new JWT({
      email: this.serviceAccount.client_email,
      key: this.serviceAccount.private_key,
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly'
      ]
    });
  }

  /**
   * Conecta a uma planilha do Google Sheets
   */
  async conectarPlanilha(spreadsheetId) {
    try {
      const doc = new GoogleSpreadsheet(spreadsheetId, this.createJWTClient());
      await doc.loadInfo();
      
      this.logger.info('Conectado à planilha', {
        spreadsheetId,
        title: doc.title,
        sheetCount: doc.sheetCount
      });

      return doc;
    } catch (error) {
      this.logger.error('Erro ao conectar à planilha', error, { spreadsheetId });
      throw new Error(`Erro ao conectar à planilha: ${error.message}`);
    }
  }

  /**
   * Extrai ID da planilha da URL
   */
  extrairIdPlanilha(url) {
    const regex = /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
    const match = url.match(regex);
    
    if (!match) {
      throw new Error('URL da planilha inválida');
    }
    
    return match[1];
  }

  /**
   * Lista todas as abas da planilha
   */
  async listarAbas(spreadsheetId) {
    try {
      const doc = await this.conectarPlanilha(spreadsheetId);
      
      const abas = doc.sheetsByIndex.map(sheet => ({
        id: sheet.sheetId,
        title: sheet.title,
        index: sheet.index,
        rowCount: sheet.rowCount,
        columnCount: sheet.columnCount,
        gridProperties: sheet.gridProperties
      }));

      this.logger.info('Abas listadas', { spreadsheetId, count: abas.length });
      return abas;
    } catch (error) {
      this.logger.error('Erro ao listar abas', error, { spreadsheetId });
      throw error;
    }
  }

  /**
   * Lê dados de uma aba específica
   */
  async lerDadosAba(spreadsheetId, nomeAba = null, opcoes = {}) {
    try {
      const {
        incluirCabecalho = true,
        linhaInicio = 1,
        linhaFim = null,
        colunaInicio = 'A',
        colunaFim = null
      } = opcoes;

      const doc = await this.conectarPlanilha(spreadsheetId);
      
      // Selecionar aba
      let sheet;
      if (nomeAba) {
        sheet = doc.sheetsByTitle[nomeAba];
        if (!sheet) {
          throw new Error(`Aba '${nomeAba}' não encontrada`);
        }
      } else {
        sheet = doc.sheetsByIndex[0]; // Primeira aba
      }

      // Carregar dados
      await sheet.loadCells();
      
      const dados = [];
      const cabecalhos = [];
      
      // Ler cabeçalhos se solicitado
      if (incluirCabecalho) {
        for (let col = 0; col < sheet.columnCount; col++) {
          const cell = sheet.getCell(0, col);
          cabecalhos.push(cell.value || `Coluna_${col + 1}`);
        }
      }

      // Ler dados
      const startRow = incluirCabecalho ? 1 : 0;
      const endRow = linhaFim || sheet.rowCount;
      
      for (let row = startRow; row < endRow; row++) {
        const linha = {};
        let temDados = false;
        
        for (let col = 0; col < sheet.columnCount; col++) {
          const cell = sheet.getCell(row, col);
          const valor = cell.value;
          
          if (valor !== null && valor !== undefined && valor !== '') {
            temDados = true;
          }
          
          if (incluirCabecalho) {
            linha[cabecalhos[col]] = valor;
          } else {
            linha[`col_${col}`] = valor;
          }
        }
        
        // Só adicionar linhas que têm dados
        if (temDados) {
          dados.push(linha);
        }
      }

      this.logger.info('Dados lidos da aba', {
        spreadsheetId,
        nomeAba: sheet.title,
        linhas: dados.length,
        colunas: cabecalhos.length
      });

      return {
        cabecalhos,
        dados,
        metadados: {
          nomeAba: sheet.title,
          totalLinhas: sheet.rowCount,
          totalColunas: sheet.columnCount,
          linhasComDados: dados.length
        }
      };
    } catch (error) {
      this.logger.error('Erro ao ler dados da aba', error, { spreadsheetId, nomeAba });
      throw error;
    }
  }

  /**
   * Sincroniza dados de médicos de uma planilha
   */
  async sincronizarMedicos(spreadsheetId, opcoes = {}) {
    try {
      const {
        nomeAba = null,
        mapeamento = null,
        validarAntes = true,
        processarLotes = true,
        tamanhoLote = 100
      } = opcoes;

      this.logger.info('Iniciando sincronização de médicos', {
        spreadsheetId,
        nomeAba,
        validarAntes,
        processarLotes,
        tamanhoLote
      });

      // Ler dados da planilha
      const resultado = await this.lerDadosAba(spreadsheetId, nomeAba);
      const { cabecalhos, dados, metadados } = resultado;

      if (dados.length === 0) {
        throw new Error('Nenhum dado encontrado na planilha');
      }

      // Mapear dados se mapeamento fornecido
      let dadosMapeados = dados;
      if (mapeamento) {
        dadosMapeados = this.mapeamentoService.aplicarMapeamento(dados, mapeamento);
      } else {
        // Tentar mapeamento automático
        const mapeamentoAuto = this.mapeamentoService.detectarMapeamento(cabecalhos);
        if (mapeamentoAuto.confianca > 0.7) {
          dadosMapeados = this.mapeamentoService.aplicarMapeamento(dados, mapeamentoAuto.mapeamento);
          this.logger.info('Mapeamento automático aplicado', { confianca: mapeamentoAuto.confianca });
        }
      }

      // Normalizar dados
      const dadosNormalizados = dadosMapeados.map(medico => 
        this.mapeamentoService.normalizarDadosMedico(medico)
      );

      // Validar dados se solicitado
      let resultadoValidacao = null;
      if (validarAntes) {
        resultadoValidacao = this.validacaoService.validarLote(dadosNormalizados);
        
        this.logger.logValidation('google_sheets_sync', resultadoValidacao, {
          spreadsheetId,
          nomeAba: metadados.nomeAba
        });

        // Se muitos erros, interromper
        const percentualErros = (resultadoValidacao.resumo.invalidos / resultadoValidacao.resumo.total) * 100;
        if (percentualErros > 30) {
          throw new Error(`Muitos registros inválidos (${Math.round(percentualErros)}%). Verifique os dados.`);
        }
      }

      // Processar dados (aqui você integraria com o UpsertMedicoService)
      const resultadoProcessamento = {
        total: dadosNormalizados.length,
        processados: 0,
        criados: 0,
        atualizados: 0,
        erros: [],
        avisos: []
      };

      // Simular processamento por lotes
      if (processarLotes) {
        for (let i = 0; i < dadosNormalizados.length; i += tamanhoLote) {
          const lote = dadosNormalizados.slice(i, i + tamanhoLote);
          
          this.logger.info(`Processando lote ${Math.floor(i / tamanhoLote) + 1}`, {
            inicio: i,
            fim: Math.min(i + tamanhoLote, dadosNormalizados.length),
            total: dadosNormalizados.length
          });

          // Aqui você chamaria o UpsertMedicoService
          // const resultadoLote = await this.upsertService.processarLote(lote);
          
          resultadoProcessamento.processados += lote.length;
          // resultadoProcessamento.criados += resultadoLote.criados;
          // resultadoProcessamento.atualizados += resultadoLote.atualizados;
        }
      }

      const relatorio = {
        sincronizacao: {
          spreadsheetId,
          nomeAba: metadados.nomeAba,
          timestamp: new Date().toISOString(),
          duracao: null // Seria calculado
        },
        origem: {
          totalLinhas: metadados.totalLinhas,
          linhasComDados: metadados.linhasComDados,
          colunas: cabecalhos
        },
        processamento: resultadoProcessamento,
        validacao: resultadoValidacao,
        mapeamento: mapeamento || 'automático'
      };

      this.logger.logImport('google_sheets_sync_completed', relatorio);

      return relatorio;
    } catch (error) {
      this.logger.error('Erro na sincronização de médicos', error, { spreadsheetId });
      throw error;
    }
  }

  /**
   * Configura sincronização automática
   */
  async configurarSincronizacaoAutomatica(config) {
    try {
      const {
        spreadsheetId,
        nomeAba,
        intervalo = 3600, // 1 hora em segundos
        ativo = true,
        mapeamento = null,
        notificacoes = true
      } = config;

      // Validar configuração
      if (!spreadsheetId) {
        throw new Error('ID da planilha é obrigatório');
      }

      if (intervalo < 300) { // Mínimo 5 minutos
        throw new Error('Intervalo mínimo é de 5 minutos');
      }

      // Testar conexão
      await this.conectarPlanilha(spreadsheetId);

      // Salvar configuração (aqui você salvaria no banco de dados)
      const configuracao = {
        id: `sync_${spreadsheetId}_${Date.now()}`,
        spreadsheetId,
        nomeAba,
        intervalo,
        ativo,
        mapeamento,
        notificacoes,
        criadoEm: new Date(),
        ultimaExecucao: null,
        proximaExecucao: new Date(Date.now() + intervalo * 1000)
      };

      this.logger.info('Sincronização automática configurada', configuracao);

      return configuracao;
    } catch (error) {
      this.logger.error('Erro ao configurar sincronização automática', error);
      throw error;
    }
  }

  /**
   * Executa sincronizações automáticas pendentes
   */
  async executarSincronizacoesAutomaticas() {
    try {
      // Aqui você buscaria as configurações ativas do banco de dados
      const configuracoes = []; // await this.buscarConfiguracoesPendentes();

      const resultados = [];

      for (const config of configuracoes) {
        try {
          this.logger.info('Executando sincronização automática', {
            configId: config.id,
            spreadsheetId: config.spreadsheetId
          });

          const resultado = await this.sincronizarMedicos(config.spreadsheetId, {
            nomeAba: config.nomeAba,
            mapeamento: config.mapeamento
          });

          resultados.push({
            configId: config.id,
            sucesso: true,
            resultado
          });

          // Atualizar próxima execução
          // await this.atualizarProximaExecucao(config.id, config.intervalo);

        } catch (error) {
          this.logger.error('Erro na sincronização automática', error, {
            configId: config.id
          });

          resultados.push({
            configId: config.id,
            sucesso: false,
            erro: error.message
          });
        }
      }

      return resultados;
    } catch (error) {
      this.logger.error('Erro ao executar sincronizações automáticas', error);
      throw error;
    }
  }

  /**
   * Testa conectividade com Google Sheets
   */
  async testarConectividade() {
    try {
      const jwt = this.createJWTClient();
      await jwt.authorize();
      
      this.logger.info('Teste de conectividade bem-sucedido');
      return {
        sucesso: true,
        timestamp: new Date().toISOString(),
        serviceAccount: this.serviceAccount.client_email
      };
    } catch (error) {
      this.logger.error('Falha no teste de conectividade', error);
      return {
        sucesso: false,
        erro: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Obtém informações sobre uma planilha
   */
  async obterInfoPlanilha(spreadsheetId) {
    try {
      const doc = await this.conectarPlanilha(spreadsheetId);
      
      const info = {
        id: doc.spreadsheetId,
        title: doc.title,
        locale: doc.locale,
        timeZone: doc.timeZone,
        createdTime: doc.createdTime,
        modifiedTime: doc.modifiedTime,
        abas: doc.sheetsByIndex.map(sheet => ({
          id: sheet.sheetId,
          title: sheet.title,
          index: sheet.index,
          rowCount: sheet.rowCount,
          columnCount: sheet.columnCount
        }))
      };

      return info;
    } catch (error) {
      this.logger.error('Erro ao obter informações da planilha', error, { spreadsheetId });
      throw error;
    }
  }
}

module.exports = GoogleSheetsIntegrationService;