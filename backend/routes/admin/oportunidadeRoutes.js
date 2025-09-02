const express = require('express');
const router = express.Router();
const oportunidadeController = require('../../controllers/admin/oportunidadeController');
const requireAdmin = require('../../middleware/admin/requireAdmin');

// Todas as rotas aqui já estão protegidas pelo middleware requireAdmin no arquivo server.js
// Aplicar middleware requireAdmin com permissão específica para operações sensíveis

// Rotas para oportunidades
router.get('/', oportunidadeController.getAllOportunidades);
router.get('/stats', oportunidadeController.getOportunidadeStats);
router.get('/:id', oportunidadeController.getOportunidadeById);
router.post('/', requireAdmin('manage_oportunidades'), oportunidadeController.createOportunidade);
router.put('/:id', requireAdmin('manage_oportunidades'), oportunidadeController.updateOportunidade);
router.delete('/:id', requireAdmin('manage_oportunidades'), oportunidadeController.deleteOportunidade);

module.exports = router;