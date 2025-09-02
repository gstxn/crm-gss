const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const utilsController = require('../controllers/utilsController');

// Rotas para dados de utilidade (especialidades, estados, cidades)
router.get('/especialidades', utilsController.getEspecialidades);
router.get('/estados', utilsController.getEstados);
router.get('/cidades/:estado', utilsController.getCidadesPorEstado);

module.exports = router;