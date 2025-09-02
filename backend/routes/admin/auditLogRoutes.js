const express = require('express');
const router = express.Router();
const auditLogController = require('../../controllers/admin/auditLogController');
const { requireAdmin } = require('../../middleware/admin/requireAdmin');

// Todas as rotas usam o middleware de autenticação
router.use(requireAdmin());

// Rotas para logs de auditoria
router.get('/', auditLogController.getAllLogs);
router.get('/:id', auditLogController.getLogById);
router.get('/user/:userId', auditLogController.getLogsByUser);
router.get('/entity/:entity/:entityId?', auditLogController.getLogsByEntity);
router.get('/stats', auditLogController.getLogsStats);

module.exports = router;