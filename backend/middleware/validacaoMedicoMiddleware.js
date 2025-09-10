const ValidacaoMedicoService = require('../services/validacaoMedicoService');
const { AppError } = require('../utils/errorHandler');

class ValidacaoMedicoMiddleware {
  constructor() {
    this.validacaoService = new ValidacaoMedicoService();
  }

  /**
   * Middleware para validar dados de médico único
   */
  validarMedicoUnico = (options = {}) => {
    return async (req, res, next) => {
      try {
        const { body } = req;
        const { isUpdate = false } = options;

        // Validar estrutura básica
        if (!body || typeof body !== 'object') {
          return res.status(400).json({
            success: false,
            error: 'Dados do médico são obrigatórios',
            code: 'INVALID_PAYLOAD'
          });
        }

        // Executar validação
        const resultado = this.validacaoService.validarMedico(body, { isUpdate });

        if (!resultado.valido) {
          return res.status(400).json({
            success: false,
            error: 'Dados do médico inválidos',
            code: 'VALIDATION_ERROR',
            details: {
              erros: resultado.erros,
              avisos: resultado.avisos,
              score: resultado.score
            }
          });
        }

        // Adicionar resultado da validação ao request
        req.validacao = resultado;
        next();

      } catch (error) {
        console.error('Erro no middleware de validação:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro interno na validação',
          code: 'VALIDATION_INTERNAL_ERROR'
        });
      }
    };
  };

  /**
   * Middleware para validar lote de médicos
   */
  validarLoteMedicos = (options = {}) => {
    return async (req, res, next) => {
      try {
        const { body } = req;
        const { maxLote = 1000, skipOptional = false } = options;

        // Validar estrutura do lote
        if (!body || !Array.isArray(body.medicos)) {
          return res.status(400).json({
            success: false,
            error: 'Array de médicos é obrigatório',
            code: 'INVALID_BATCH_PAYLOAD'
          });
        }

        // Validar tamanho do lote
        if (body.medicos.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Lote não pode estar vazio',
            code: 'EMPTY_BATCH'
          });
        }

        if (body.medicos.length > maxLote) {
          return res.status(400).json({
            success: false,
            error: `Lote muito grande. Máximo permitido: ${maxLote}`,
            code: 'BATCH_TOO_LARGE'
          });
        }

        // Executar validação do lote
        const resultado = this.validacaoService.validarLote(body.medicos, { skipOptional });

        // Se há muitos erros, rejeitar o lote
        const percentualErros = (resultado.resumo.invalidos / resultado.resumo.total) * 100;
        if (percentualErros > 50) {
          return res.status(400).json({
            success: false,
            error: 'Muitos registros inválidos no lote',
            code: 'BATCH_QUALITY_TOO_LOW',
            details: {
              resumo: resultado.resumo,
              percentualErros: Math.round(percentualErros),
              relatorio: this.validacaoService.gerarRelatorio(resultado)
            }
          });
        }

        // Adicionar resultado da validação ao request
        req.validacaoLote = resultado;
        next();

      } catch (error) {
        console.error('Erro no middleware de validação de lote:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro interno na validação do lote',
          code: 'BATCH_VALIDATION_INTERNAL_ERROR'
        });
      }
    };
  };

  /**
   * Middleware para validar arquivo de importação
   */
  validarArquivoImportacao = (options = {}) => {
    return async (req, res, next) => {
      try {
        const { file } = req;
        const { 
          maxSize = 10 * 1024 * 1024, // 10MB
          allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv', 'application/vnd.ms-excel']
        } = options;

        // Verificar se arquivo foi enviado
        if (!file) {
          return res.status(400).json({
            success: false,
            error: 'Arquivo é obrigatório',
            code: 'FILE_REQUIRED'
          });
        }

        // Validar tamanho do arquivo
        if (file.size > maxSize) {
          return res.status(400).json({
            success: false,
            error: `Arquivo muito grande. Tamanho máximo: ${Math.round(maxSize / 1024 / 1024)}MB`,
            code: 'FILE_TOO_LARGE'
          });
        }

        // Validar tipo do arquivo
        if (!allowedTypes.includes(file.mimetype)) {
          return res.status(400).json({
            success: false,
            error: 'Tipo de arquivo não permitido. Use Excel (.xlsx) ou CSV (.csv)',
            code: 'INVALID_FILE_TYPE',
            details: {
              tipoRecebido: file.mimetype,
              tiposPermitidos: allowedTypes
            }
          });
        }

        // Validar nome do arquivo
        if (!file.originalname || file.originalname.length > 255) {
          return res.status(400).json({
            success: false,
            error: 'Nome do arquivo inválido',
            code: 'INVALID_FILENAME'
          });
        }

        next();

      } catch (error) {
        console.error('Erro no middleware de validação de arquivo:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro interno na validação do arquivo',
          code: 'FILE_VALIDATION_INTERNAL_ERROR'
        });
      }
    };
  };

  /**
   * Middleware para validar parâmetros de sincronização Google Sheets
   */
  validarSincronizacaoSheets = () => {
    return async (req, res, next) => {
      try {
        const { body } = req;

        // Validar URL do Google Sheets
        if (!body.sheetUrl) {
          return res.status(400).json({
            success: false,
            error: 'URL do Google Sheets é obrigatória',
            code: 'SHEET_URL_REQUIRED'
          });
        }

        // Validar formato da URL
        const urlRegex = /^https:\/\/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/;
        if (!urlRegex.test(body.sheetUrl)) {
          return res.status(400).json({
            success: false,
            error: 'URL do Google Sheets inválida',
            code: 'INVALID_SHEET_URL'
          });
        }

        // Extrair ID da planilha
        const match = body.sheetUrl.match(urlRegex);
        req.sheetId = match[1];

        // Validar nome da aba (opcional)
        if (body.sheetName && (typeof body.sheetName !== 'string' || body.sheetName.length > 100)) {
          return res.status(400).json({
            success: false,
            error: 'Nome da aba inválido',
            code: 'INVALID_SHEET_NAME'
          });
        }

        // Validar configurações de sincronização
        if (body.syncConfig) {
          const { autoSync, syncInterval } = body.syncConfig;
          
          if (autoSync && typeof autoSync !== 'boolean') {
            return res.status(400).json({
              success: false,
              error: 'Configuração de sincronização automática inválida',
              code: 'INVALID_AUTO_SYNC_CONFIG'
            });
          }

          if (syncInterval && (typeof syncInterval !== 'number' || syncInterval < 300 || syncInterval > 86400)) {
            return res.status(400).json({
              success: false,
              error: 'Intervalo de sincronização deve estar entre 5 minutos e 24 horas',
              code: 'INVALID_SYNC_INTERVAL'
            });
          }
        }

        next();

      } catch (error) {
        console.error('Erro no middleware de validação de sincronização:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro interno na validação de sincronização',
          code: 'SYNC_VALIDATION_INTERNAL_ERROR'
        });
      }
    };
  };

  /**
   * Middleware para validar mapeamento de colunas
   */
  validarMapeamentoColunas = () => {
    return async (req, res, next) => {
      try {
        const { body } = req;

        // Parse do mapeamento se vier como string (FormData)
        let mapeamento;
        if (typeof body.mapeamento === 'string') {
          try {
            mapeamento = JSON.parse(body.mapeamento);
          } catch (e) {
            return res.status(400).json({
              success: false,
              error: 'Formato de mapeamento inválido',
              code: 'INVALID_MAPPING_FORMAT'
            });
          }
        } else {
          mapeamento = body.mapeamento;
        }

        // Validar estrutura do mapeamento
        if (!mapeamento || typeof mapeamento !== 'object') {
          return res.status(400).json({
            success: false,
            error: 'Mapeamento de colunas é obrigatório',
            code: 'MAPPING_REQUIRED'
          });
        }
        const camposObrigatorios = ['nome', 'crm', 'uf_crm'];
        const camposFaltando = [];

        // Verificar campos obrigatórios
        camposObrigatorios.forEach(campo => {
          if (!mapeamento[campo]) {
            camposFaltando.push(campo);
          }
        });

        if (camposFaltando.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Campos obrigatórios não mapeados',
            code: 'REQUIRED_FIELDS_NOT_MAPPED',
            details: {
              camposFaltando
            }
          });
        }

        // Validar valores do mapeamento
        Object.entries(mapeamento).forEach(([campo, coluna]) => {
          if (typeof coluna !== 'string' && typeof coluna !== 'number') {
            return res.status(400).json({
              success: false,
              error: `Mapeamento inválido para o campo '${campo}'`,
              code: 'INVALID_MAPPING_VALUE'
            });
          }
        });

        next();

      } catch (error) {
        console.error('Erro no middleware de validação de mapeamento:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro interno na validação de mapeamento',
          code: 'MAPPING_VALIDATION_INTERNAL_ERROR'
        });
      }
    };
  };

  /**
   * Middleware para tratamento de erros específicos de médicos
   */
  tratarErrosMedicos = () => {
    return (error, req, res, next) => {
      console.error('Erro no processamento de médicos:', error);

      // Erros de validação do Mongoose
      if (error.name === 'ValidationError') {
        const erros = Object.values(error.errors).map(err => err.message);
        return res.status(400).json({
          success: false,
          error: 'Erro de validação do banco de dados',
          code: 'DATABASE_VALIDATION_ERROR',
          details: { erros }
        });
      }

      // Erros de duplicação
      if (error.code === 11000) {
        const campo = Object.keys(error.keyPattern)[0];
        return res.status(409).json({
          success: false,
          error: `Médico já existe com este ${campo}`,
          code: 'DUPLICATE_MEDICO',
          details: { campo, valor: error.keyValue[campo] }
        });
      }

      // Erros de conexão com Google Sheets
      if (error.message && error.message.includes('Google Sheets')) {
        return res.status(503).json({
          success: false,
          error: 'Erro na conexão com Google Sheets',
          code: 'GOOGLE_SHEETS_ERROR',
          details: { message: error.message }
        });
      }

      // Erros de processamento de arquivo
      if (error.message && error.message.includes('arquivo')) {
        return res.status(400).json({
          success: false,
          error: 'Erro no processamento do arquivo',
          code: 'FILE_PROCESSING_ERROR',
          details: { message: error.message }
        });
      }

      // Erro genérico
      return res.status(500).json({
        success: false,
        error: 'Erro interno do servidor',
        code: 'INTERNAL_SERVER_ERROR',
        details: process.env.NODE_ENV === 'development' ? { message: error.message, stack: error.stack } : {}
      });
    };
  };
}

module.exports = new ValidacaoMedicoMiddleware();