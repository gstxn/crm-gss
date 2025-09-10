const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Controladores (serão implementados posteriormente)
const {
  getOportunidades,
  getOportunidadeById,
  createOportunidade,
  updateOportunidade,
  deleteOportunidade,
  addMedicoOportunidade,
  updateStatusMedicoOportunidade,
  addComentarioOportunidade,
  addHistoricoOportunidade
} = require('../controllers/oportunidadeController');

// Rotas protegidas
router.route('/')
  .get(protect, getOportunidades)
  .post(protect, createOportunidade);

router.route('/:id')
  .get(protect, getOportunidadeById)
  .put(protect, updateOportunidade)
  .delete(protect, deleteOportunidade);

router.route('/:id/medicos')
  .post(protect, addMedicoOportunidade);

router.route('/:id/medicos/:medicoId')
  .put(protect, updateStatusMedicoOportunidade);

router.route('/:id/comentarios')
  .post(protect, addComentarioOportunidade);

router.route('/:id/historico')
  .post(protect, addHistoricoOportunidade);

module.exports = router;