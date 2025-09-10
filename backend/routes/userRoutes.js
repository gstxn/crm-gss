const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

// Controladores (serão implementados posteriormente)
const { 
  registerUser, 
  loginUser, 
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile
} = require('../controllers/userController');

// Rotas públicas
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/forgotpassword', forgotPassword);
router.put('/resetpassword/:resetToken', resetPassword);

// Rotas protegidas
router.route('/profile')
  .get(protect, getUserProfile)
  .put(protect, updateUserProfile);

module.exports = router;