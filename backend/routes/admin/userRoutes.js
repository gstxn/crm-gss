const express = require('express');
const {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updatePassword,
  deleteUser
} = require('../../controllers/admin/userController');
const { requireAdmin } = require('../../middleware/admin/requireAdmin');

const router = express.Router();

// Todas as rotas requerem autenticação admin
router.use(requireAdmin());

// Rotas para usuários administrativos
router.route('/')
  .get(getUsers)
  .post(requireAdmin('ADMIN'), createUser);

router.route('/:id')
  .get(getUserById)
  .put(requireAdmin('ADMIN'), updateUser)
  .delete(requireAdmin('ADMIN'), deleteUser);

router.put('/:id/password', updatePassword);

module.exports = router;