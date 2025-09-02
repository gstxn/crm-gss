const express = require('express');
const router = express.Router();
const configuracaoController = require('../../controllers/admin/configuracaoController');
const { requireAdmin } = require('../../middleware/admin/requireAdmin');

// Todas as rotas usam o middleware de autenticação
router.use(requireAdmin());

// Rotas para configurações
router.get('/', configuracaoController.getAllConfiguracoes);
router.get('/:id', configuracaoController.getConfiguracaoById);
router.get('/chave/:chave', configuracaoController.getConfiguracaoByChave);
router.post('/', configuracaoController.createConfiguracao);
router.put('/:id', configuracaoController.updateConfiguracao);
router.delete('/:id', configuracaoController.deleteConfiguracao);
router.get('/public', configuracaoController.getPublicConfiguracoes);

module.exports = router;