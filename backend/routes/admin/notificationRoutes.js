const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/admin/notificationController');
const { requireAdmin } = require('../../middleware/admin/requireAdmin');

// Todas as rotas requerem autenticação admin
router.use(requireAdmin());

// Rotas para notificações
router.get('/', notificationController.getAllNotificacoes);
router.get('/unread', notificationController.getUnreadNotificacoes);
router.get('/:id', notificationController.getNotificacaoById);
router.post('/', notificationController.createNotificacao);
router.put('/:id', notificationController.updateNotificacao);
router.put('/:id/read', notificationController.markAsRead);
router.delete('/:id', notificationController.deleteNotificacao);

module.exports = router;