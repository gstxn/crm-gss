const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware para autenticação
const authenticateToken = async (req, res, next) => {
  let token;

  // Verificar se o token existe no header Authorization ou cookies
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });
  }

  try {
    // Verificar o token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Obter o usuário do token (sem a senha)
    const user = await User.findById(decoded.id).select('-senha');
    
    if (!user) {
      return res.status(401).json({ error: 'Token inválido. Usuário não encontrado.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Erro na autenticação:', error);
    return res.status(401).json({ error: 'Token inválido.' });
  }
};

// Middleware para autorização baseada em roles
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    // Se não há roles especificadas, permitir acesso
    if (roles.length === 0) {
      return next();
    }

    // Verificar se o usuário tem uma das roles necessárias
    const userRole = req.user.role || 'user';
    
    // Admin sempre tem acesso
    if (userRole === 'admin') {
      return next();
    }

    // Verificar se a role do usuário está na lista de roles permitidas
    if (roles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({ 
      error: 'Acesso negado. Permissões insuficientes.',
      required_roles: roles,
      user_role: userRole
    });
  };
};

// Middleware específico para operações de disparo
const authorizeDisparo = (action = 'read') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Usuário não autenticado.' });
    }

    const userRole = req.user.role || 'user';
    
    // Admin sempre tem acesso
    if (userRole === 'admin') {
      return next();
    }

    // Definir permissões por ação
    const permissions = {
      read: ['admin', 'operador_disparo', 'leitura'],
      write: ['admin', 'operador_disparo'],
      import: ['admin', 'operador_disparo'],
      export: ['admin', 'operador_disparo', 'leitura'],
      mass_action: ['admin', 'operador_disparo']
    };

    const allowedRoles = permissions[action] || [];
    
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    return res.status(403).json({ 
      error: `Acesso negado para ação: ${action}`,
      required_roles: allowedRoles,
      user_role: userRole
    });
  };
};

// Middleware para verificar se o usuário é admin
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado. Apenas administradores.' });
  }

  next();
};

// Middleware para verificar se o usuário pode acessar recursos próprios ou é admin
const authorizeOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Usuário não autenticado.' });
  }

  const userId = req.params.userId || req.body.userId || req.query.userId;
  
  // Admin pode acessar qualquer recurso
  if (req.user.role === 'admin') {
    return next();
  }

  // Usuário pode acessar apenas seus próprios recursos
  if (req.user._id.toString() === userId) {
    return next();
  }

  return res.status(403).json({ 
    error: 'Acesso negado. Você só pode acessar seus próprios recursos.' 
  });
};

module.exports = {
  authenticateToken,
  authorize,
  authorizeDisparo,
  requireAdmin,
  authorizeOwnerOrAdmin,
  // Manter compatibilidade com o middleware antigo
  protect: authenticateToken
};