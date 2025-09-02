
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para proteger rotas
const protect = async (req, res, next) => {
  let token;

  // Verificar se o token existe no header Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Obter o token do header
      token = req.headers.authorization.split(' ')[1];

      // Verificar o token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Obter o usuário do token (sem a senha)
      req.user = await User.findById(decoded.id).select('-senha');

      next();
    } catch (error) {
      console.error(error);
      res.status(401);
      throw new Error('Não autorizado, token inválido');
    }
  }

  if (!token) {
    res.status(401);
    throw new Error('Não autorizado, token não encontrado');
  }
};

module.exports = { protect };