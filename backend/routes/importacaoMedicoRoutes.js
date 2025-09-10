const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const authMiddleware = require('../middleware/authMiddleware');
const validacaoMedicoMiddleware = require('../middleware/validacaoMedicoMiddleware');
const { asyncHandler, globalErrorHandler } = require('../utils/errorHandler');
const importacaoMedicoController = require('../controllers/importacaoMedicoController');

const router = express.Router();

// Rate limiting para importações
const importRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 importações por 15 minutos
  message: {
    error: 'Muitas tentativas de importação. Tente novamente em 15 minutos.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting para sincronização Google Sheets
const syncRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 3, // máximo 3 sincronizações por 5 minutos
  message: {
    error: 'Muitas tentativas de sincronização. Tente novamente em 5 minutos.',
    code: 'SYNC_RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configuração do multer para upload de arquivos
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Validar tipo de arquivo
  const allowedMimes = [
    'text/csv',
    'application/csv',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ];
  
  const allowedExtensions = ['.csv', '.xlsx'];
  const fileExtension = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));
  
  if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de arquivo não suportado. Use apenas .csv ou .xlsx'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB máximo
    files: 1 // apenas 1 arquivo por vez
  }
});

// Middleware para validar feature flag
const validateFeatureFlag = (req, res, next) => {
  const featureEnabled = process.env.FEATURE_MEDICOS_IMPORT_SYNC === 'true';
  
  if (!featureEnabled) {
    return res.status(503).json({
      error: 'Funcionalidade de importação de médicos está temporariamente desabilitada',
      code: 'FEATURE_DISABLED'
    });
  }
  
  next();
};

// Middleware para log de auditoria
const auditLog = (action) => {
  return (req, res, next) => {
    req.auditInfo = {
      action,
      userId: req.user?.id,
      userEmail: req.user?.email,
      timestamp: new Date(),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    };
    next();
  };
};

// Middleware para tratamento de erros do multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return res.status(400).json({
          error: 'Arquivo muito grande. Tamanho máximo: 20MB',
          code: 'FILE_TOO_LARGE'
        });
      case 'LIMIT_FILE_COUNT':
        return res.status(400).json({
          error: 'Muitos arquivos. Envie apenas 1 arquivo por vez',
          code: 'TOO_MANY_FILES'
        });
      case 'LIMIT_UNEXPECTED_FILE':
        return res.status(400).json({
          error: 'Campo de arquivo inesperado',
          code: 'UNEXPECTED_FILE_FIELD'
        });
      default:
        return res.status(400).json({
          error: 'Erro no upload do arquivo',
          code: 'UPLOAD_ERROR',
          details: error.message
        });
    }
  }
  
  if (error.message.includes('Tipo de arquivo não suportado')) {
    return res.status(400).json({
      error: error.message,
      code: 'INVALID_FILE_TYPE'
    });
  }
  
  next(error);
};

// Rotas

/**
 * @route POST /api/medicos/import
 * @desc Importar médicos via upload de planilha
 * @access Private
 */
router.post('/import',
  authMiddleware.protect,
  validateFeatureFlag,
  importRateLimit,
  auditLog('IMPORT_MEDICOS_UPLOAD'),
  upload.single('file'),
  handleMulterError,
  validacaoMedicoMiddleware.validarArquivoImportacao(),
  validacaoMedicoMiddleware.validarMapeamentoColunas(),
  asyncHandler(importacaoMedicoController.importarPlanilha)
);

/**
 * @route POST /api/medicos/import/preview
 * @desc Preview da planilha antes da importação
 * @access Private
 */
router.post('/import/preview',
  authMiddleware.protect,
  validateFeatureFlag,
  upload.single('file'),
  handleMulterError,
  asyncHandler(importacaoMedicoController.previewPlanilha)
);

/**
 * @route POST /api/medicos/sync-sheets
 * @desc Sincronizar médicos do Google Sheets
 * @access Private
 */
router.post('/sync-sheets',
  authMiddleware.protect,
  validateFeatureFlag,
  syncRateLimit,
  auditLog('SYNC_MEDICOS_GSHEETS'),
  validacaoMedicoMiddleware.validarSincronizacaoSheets(),
  asyncHandler(importacaoMedicoController.sincronizarGoogleSheets)
);

/**
 * @route GET /api/medicos/import/status/:jobId
 * @desc Verificar status de importação
 * @access Private
 */
router.get('/import/status/:jobId',
  authMiddleware.protect,
  validateFeatureFlag,
  asyncHandler(importacaoMedicoController.verificarStatusImportacao)
);

/**
 * @route GET /api/medicos/import/download-errors/:jobId
 * @desc Download do CSV de erros
 * @access Private
 */
router.get('/import/download-errors/:jobId',
  authMiddleware.protect,
  validateFeatureFlag,
  asyncHandler(importacaoMedicoController.downloadErros)
);

/**
 * @route GET /api/medicos/import/mapping-suggestions
 * @desc Obter sugestões de mapeamento de colunas
 * @access Private
 */
router.post('/import/mapping-suggestions',
  authMiddleware.protect,
  validateFeatureFlag,
  asyncHandler(importacaoMedicoController.obterSugestoesMapeamento)
);

/**
 * @route POST /api/medicos/import/validate-mapping
 * @desc Validar mapeamento de colunas
 * @access Private
 */
router.post('/import/validate-mapping',
  authMiddleware.protect,
  validateFeatureFlag,
  validacaoMedicoMiddleware.validarLoteMedicos({ maxLote: 500, skipOptional: true }),
  asyncHandler(importacaoMedicoController.validarMapeamento)
);

/**
 * @route GET /api/medicos/export
 * @desc Exportar médicos para CSV
 * @access Private
 */
router.get('/export',
  authMiddleware.protect,
  validateFeatureFlag,
  asyncHandler(importacaoMedicoController.exportarMedicos)
);

/**
 * @route GET /api/medicos/import/presets
 * @desc Obter presets de mapeamento salvos
 * @access Private
 */
router.get('/import/presets',
  authMiddleware.protect,
  validateFeatureFlag,
  asyncHandler(importacaoMedicoController.obterPresets)
);

/**
 * @route POST /api/medicos/import/presets
 * @desc Salvar preset de mapeamento
 * @access Private
 */
router.post('/import/presets',
  authMiddleware.protect,
  validateFeatureFlag,
  asyncHandler(importacaoMedicoController.salvarPreset)
);

/**
 * @route DELETE /api/medicos/import/presets/:presetId
 * @desc Deletar preset de mapeamento
 * @access Private
 */
router.delete('/import/presets/:presetId',
  authMiddleware.protect,
  validateFeatureFlag,
  asyncHandler(importacaoMedicoController.deletarPreset)
);

// Middleware de tratamento de erros global para as rotas
router.use((error, req, res, next) => {
  console.error('Erro nas rotas de importação de médicos:', error);
  
  // Log de auditoria para erros
  if (req.auditInfo) {
    console.log('Audit Log - Error:', {
      ...req.auditInfo,
      error: error.message,
      stack: error.stack
    });
  }
  
  // Resposta de erro padronizada
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Dados inválidos',
      code: 'VALIDATION_ERROR',
      details: error.message
    });
  }
  
  if (error.name === 'MongoError' || error.name === 'MongooseError') {
    return res.status(500).json({
      error: 'Erro interno do banco de dados',
      code: 'DATABASE_ERROR'
    });
  }
  
  // Erro genérico
  res.status(500).json({
    error: 'Erro interno do servidor',
    code: 'INTERNAL_SERVER_ERROR',
    message: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Middleware de tratamento de erros específico para médicos
router.use(validacaoMedicoMiddleware.tratarErrosMedicos());

module.exports = router;