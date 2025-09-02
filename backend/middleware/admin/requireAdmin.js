const jwt = require('jsonwebtoken');
const AdminUser = require('../../models/admin/AdminUser');

// Middleware para proteger rotas administrativas
const requireAdmin = (requiredRole) => async (req, res, next) => {
  try {
    let token;

    // Verificar se o token existe nos cookies
    if (req.cookies && req.cookies.admin_token) {
      token = req.cookies.admin_token;
    } else if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      // Alternativa: verificar no header Authorization
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Acesso negado. Autenticação necessária.' });
    }

    // Verificar o token
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET);

    // Obter o usuário admin do token
    const adminUser = await AdminUser.findById(decoded.id);

    if (!adminUser) {
      return res.status(401).json({ message: 'Usuário administrativo não encontrado.' });
    }

    if (adminUser.status !== 'ativo') {
      return res.status(403).json({ message: 'Conta de usuário inativa ou bloqueada.' });
    }

    // Verificar permissão baseada em role, se necessário
    if (requiredRole) {
      const roleHierarchy = {
        'SUPERADMIN': 3,
        'ADMIN': 2,
        'EDITOR': 1
      };

      const userRoleLevel = roleHierarchy[adminUser.role] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({ 
          message: `Acesso negado. Nível de permissão insuficiente. Requer: ${requiredRole}` 
        });
      }
    }

    // Adicionar o usuário admin ao objeto de requisição
    req.adminUser = adminUser;

    // Atualizar último login
    await AdminUser.findByIdAndUpdate(adminUser._id, { lastLogin: Date.now() });

    next();
  } catch (error) {
    console.error('Erro de autenticação admin:', error);
    return res.status(401).json({ message: 'Token inválido ou expirado.' });
  }
};

module.exports = { requireAdmin };