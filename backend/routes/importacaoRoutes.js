/**
 * Rotas para importação e sincronização de clientes
 */
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { uploadPlanilha, handleUploadError } = require('../middleware/uploadMiddleware');
const {
  importarClientes,
  sincronizarGoogleSheets,
  verificarStatusImportacao,
  downloadErrosImportacao,
  exportarClientes
} = require('../controllers/importacaoController');

// Rotas protegidas
router.use(protect);

// Rota para importação de planilhas
router.post('/import', uploadPlanilha, handleUploadError, importarClientes);

// Rota para sincronização com Google Sheets
router.post('/sync-sheets', sincronizarGoogleSheets);

// Rota para verificar status de importação
router.get('/import/status/:jobId', verificarStatusImportacao);

// Rota para download de erros
router.get('/import/erros/:jobId', downloadErrosImportacao);

// Rota para exportação de clientes (nice-to-have)
router.get('/export', exportarClientes);

module.exports = router;