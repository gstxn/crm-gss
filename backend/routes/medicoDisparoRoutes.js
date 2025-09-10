const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { body, query, param } = require('express-validator');
const MedicoDisparoController = require('../controllers/medicoDisparoController');
const { protect: authMiddleware } = require('../middleware/authMiddleware');
const { asyncHandler } = require('../utils/errorHandler');

const router = express.Router();

// Configuração do multer para upload de arquivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
      'text/csv' // .csv
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não suportado. Use XLSX, XLS ou CSV.'), false);
    }
  }
});

// Rate limiting para importações
const importRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 importações por 15 minutos
  message: {
    success: false,
    message: 'Muitas tentativas de importação. Tente novamente em 15 minutos.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting para API de disparo
const disparoRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuto
  max: 100, // máximo 100 requests por minuto
  message: {
    success: false,
    message: 'Muitas requisições. Tente novamente em 1 minuto.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Validações para criação/atualização
const validacoesMedico = [
  body('telefone')
    .notEmpty()
    .withMessage('Telefone é obrigatório')
    .isLength({ min: 10, max: 15 })
    .withMessage('Telefone deve ter entre 10 e 15 caracteres'),
  
  body('nome')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Nome deve ter no máximo 200 caracteres'),
  
  body('email')
    .optional()
    .isEmail()
    .withMessage('Email deve ter formato válido'),
  
  body('especialidades')
    .optional()
    .custom((value) => {
      if (Array.isArray(value)) {
        return value.every(esp => typeof esp === 'string' && esp.trim().length > 0);
      }
      return typeof value === 'string';
    })
    .withMessage('Especialidades devem ser um array de strings ou string'),
  
  body('canal')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Canal deve ter no máximo 100 caracteres'),
  
  body('codigo_origem')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Código de origem deve ter no máximo 50 caracteres'),
  
  body('observacoes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Observações devem ter no máximo 1000 caracteres'),
  
  body('permitido_envio')
    .optional()
    .isBoolean()
    .withMessage('Permitido envio deve ser boolean'),
  
  body('status_contato')
    .optional()
    .isIn(['novo', 'fila', 'enviado', 'falha', 'opt_out'])
    .withMessage('Status de contato inválido')
];

// Validações para listagem
const validacoesListagem = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página deve ser um número inteiro positivo'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limite deve ser entre 1 e 100'),
  
  query('status_contato')
    .optional()
    .isIn(['novo', 'fila', 'enviado', 'falha', 'opt_out'])
    .withMessage('Status de contato inválido'),
  
  query('permitido_envio')
    .optional()
    .isBoolean()
    .withMessage('Permitido envio deve ser boolean')
];

// Validações para ações em massa
const validacoesAcoesMassa = [
  body('ids')
    .isArray({ min: 1 })
    .withMessage('IDs devem ser um array com pelo menos 1 item')
    .custom((ids) => {
      return ids.every(id => typeof id === 'string' && id.length === 24);
    })
    .withMessage('Todos os IDs devem ser ObjectIds válidos'),
  
  body('acao')
    .isIn(['adicionar_fila', 'marcar_enviado', 'marcar_opt_out', 'excluir'])
    .withMessage('Ação inválida')
];

// Validações para sincronização Google Sheets
const validacoesSincronizacao = [
  body('spreadsheetId')
    .notEmpty()
    .withMessage('ID da planilha é obrigatório'),
  
  body('range')
    .notEmpty()
    .withMessage('Range da planilha é obrigatório')
];

// Middleware para verificar permissões
const verificarPermissaoOperador = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
  }
  
  // Permitir acesso se o usuário não tem role definido (compatibilidade)
  if (!req.user.role) {
    next();
    return;
  }
  
  const rolesPermitidas = ['admin', 'operador_disparo'];
  if (!rolesPermitidas.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Permissão insuficiente para esta operação'
    });
  }
  
  next();
};

const verificarPermissaoLeitura = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado'
    });
  }
  
  // Permitir acesso se o usuário não tem role definido (compatibilidade)
  if (!req.user.role) {
    next();
    return;
  }
  
  const rolesPermitidas = ['admin', 'operador_disparo', 'leitura'];
  if (!rolesPermitidas.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Permissão insuficiente para esta operação'
    });
  }
  
  next();
};

// ===== ROTAS PRINCIPAIS =====

// Listar médicos de disparo
router.get('/', 
  authMiddleware,
  verificarPermissaoLeitura,
  ...validacoesListagem,
  asyncHandler(MedicoDisparoController.listar)
);

// Obter estatísticas
router.get('/estatisticas',
  authMiddleware,
  verificarPermissaoLeitura,
  asyncHandler(MedicoDisparoController.obterEstatisticas)
);

// Obter especialidades únicas
router.get('/especialidades',
  authMiddleware,
  verificarPermissaoLeitura,
  asyncHandler(MedicoDisparoController.obterEspecialidades)
);

// Obter médico por ID
router.get('/:id',
  authMiddleware,
  verificarPermissaoLeitura,
  param('id').isMongoId().withMessage('ID inválido'),
  asyncHandler(MedicoDisparoController.obterPorId)
);

// Criar novo médico
router.post('/',
  authMiddleware,
  verificarPermissaoOperador,
  ...validacoesMedico,
  asyncHandler(MedicoDisparoController.criar)
);

// Atualizar médico
router.put('/:id',
  authMiddleware,
  verificarPermissaoOperador,
  param('id').isMongoId().withMessage('ID inválido'),
  ...validacoesMedico,
  asyncHandler(MedicoDisparoController.atualizar)
);

// Excluir médico
router.delete('/:id',
  authMiddleware,
  verificarPermissaoOperador,
  param('id').isMongoId().withMessage('ID inválido'),
  asyncHandler(MedicoDisparoController.excluir)
);

// ===== ROTAS DE IMPORTAÇÃO E SINCRONIZAÇÃO =====

// Preview de importação - obter cabeçalhos e primeiras linhas
router.post('/preview-import',
  authMiddleware,
  verificarPermissaoOperador,
  importRateLimit,
  upload.single('arquivo'),
  asyncHandler(MedicoDisparoController.previewImportacao)
);

// Importar arquivo com mapeamento personalizado
router.post('/import-with-mapping',
  authMiddleware,
  verificarPermissaoOperador,
  importRateLimit,
  upload.single('arquivo'),
  body('mapping')
    .isObject()
    .withMessage('Mapeamento deve ser um objeto'),
  asyncHandler(MedicoDisparoController.importarArquivoComMapeamento)
);

// Importar arquivo XLSX/CSV (método legado)
router.post('/import',
  authMiddleware,
  verificarPermissaoOperador,
  importRateLimit,
  upload.single('arquivo'),
  asyncHandler(MedicoDisparoController.importarArquivo)
);

// Sincronizar com Google Sheets
router.post('/sync-sheets',
  authMiddleware,
  verificarPermissaoOperador,
  importRateLimit,
  ...validacoesSincronizacao,
  asyncHandler(MedicoDisparoController.sincronizarGoogleSheets)
);

// ===== ROTAS DE AÇÕES EM MASSA =====

// Executar ações em massa
router.post('/acoes-massa',
  authMiddleware,
  verificarPermissaoOperador,
  ...validacoesAcoesMassa,
  asyncHandler(MedicoDisparoController.acoesMassa)
);

// ===== ROTAS DE EXPORTAÇÃO =====

// Exportar contatos para disparo
router.get('/export/disparo',
  authMiddleware,
  verificarPermissaoLeitura,
  query('formato').optional().isIn(['csv', 'json']).withMessage('Formato deve ser csv ou json'),
  asyncHandler(MedicoDisparoController.exportarDisparo)
);

// ===== API PÚBLICA PARA DISPARO =====

// Obter contatos para disparo (API externa)
router.get('/api/contatos',
  disparoRateLimit,
  query('page').optional().isInt({ min: 1 }).withMessage('Página inválida'),
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limite inválido'),
  asyncHandler(MedicoDisparoController.obterContatosDisparo)
);

// Middleware de tratamento de erros do multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Arquivo muito grande. Tamanho máximo: 10MB'
      });
    }
    
    return res.status(400).json({
      success: false,
      message: 'Erro no upload do arquivo',
      error: error.message
    });
  }
  
  if (error.message.includes('Tipo de arquivo não suportado')) {
    return res.status(400).json({
      success: false,
      message: error.message
    });
  }
  
  next(error);
});

module.exports = router;