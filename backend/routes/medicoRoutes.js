const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Controladores (serão implementados posteriormente)
const {
  getMedicos,
  getMedicoById,
  createMedico,
  updateMedico,
  deleteMedico,
  uploadDocumentoMedico,
  addHistoricoMedico
} = require('../controllers/medicoController');

// Rotas protegidas
router.route('/')
  .get(protect, getMedicos)
  .post(protect, createMedico);

router.route('/:id')
  .get(protect, getMedicoById)
  .put(protect, updateMedico)
  .delete(protect, deleteMedico);

router.route('/:id/documentos')
  .post(protect, uploadDocumentoMedico);

router.route('/:id/historico')
  .post(protect, addHistoricoMedico);

module.exports = router;