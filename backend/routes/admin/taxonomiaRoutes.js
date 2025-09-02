const express = require('express');
const router = express.Router();
const taxonomiaController = require('../../controllers/admin/taxonomiaController');
const { requireAdmin } = require('../../middleware/admin/requireAdmin');

// Todas as rotas usam o middleware de autenticação
router.use(requireAdmin());

// Rotas para taxonomias
router.get('/', taxonomiaController.getAllTaxonomias);
router.get('/:id', taxonomiaController.getTaxonomiaById);
router.post('/', taxonomiaController.createTaxonomia);
router.put('/:id', taxonomiaController.updateTaxonomia);
router.delete('/:id', taxonomiaController.deleteTaxonomia);
router.get('/tipo/:tipo', taxonomiaController.getTaxonomiasByTipo);

module.exports = router;