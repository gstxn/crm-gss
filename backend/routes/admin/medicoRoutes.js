const express = require('express');
const router = express.Router();
const medicoController = require('../../controllers/admin/medicoController');
const requireAdmin = require('../../middleware/admin/requireAdmin');

// Todas as rotas aqui já estão protegidas pelo middleware requireAdmin no arquivo server.js
// Aplicar middleware requireAdmin com permissão específica para operações sensíveis

// Rotas para médicos
router.get('/', medicoController.getAllMedicos);
router.get('/stats', medicoController.getMedicoStats);
router.get('/:id', medicoController.getMedicoById);
router.post('/', requireAdmin('manage_medicos'), medicoController.createMedico);
router.put('/:id', requireAdmin('manage_medicos'), medicoController.updateMedico);
router.delete('/:id', requireAdmin('manage_medicos'), medicoController.deleteMedico);

module.exports = router;