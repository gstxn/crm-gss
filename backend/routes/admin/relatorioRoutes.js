const express = require('express');
const router = express.Router();
const relatorioController = require('../../controllers/admin/relatorioController');

// Todas as rotas aqui já estão protegidas pelo middleware requireAdmin no arquivo server.js

// Rotas para relatórios
router.get('/oportunidades-por-status', relatorioController.getOportunidadesPorStatus);
router.get('/medicos-por-especialidade', relatorioController.getMedicosPorEspecialidade);
router.get('/clientes-por-segmento', relatorioController.getClientesPorSegmento);
router.get('/faturamento-por-periodo', relatorioController.getFaturamentoPorPeriodo);
router.get('/conversao-oportunidades', relatorioController.getConversaoOportunidades);

module.exports = router;