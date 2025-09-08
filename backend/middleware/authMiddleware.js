
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

      if (!req.user) {
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }

      next();
    } catch (error) {
      console.error('Erro na autenticação:', error);
      return res.status(401).json({ error: 'Não autorizado, token inválido' });
    }
  } else {
    return res.status(401).json({ error: 'Não autorizado, token não encontrado' });
  }
};

module.exports = { protect };