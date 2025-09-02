const jwt = require('jsonwebtoken');
const AdminUser = require('../../models/admin/AdminUser');
const audit = require('../../utils/admin/audit');

// Gerar token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET, {
    expiresIn: '8h'
  });
};

// Configurar cookie seguro
const setCookieOptions = (res, token) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 8 * 60 * 60 * 1000 // 8 horas
  };

  res.cookie('admin_token', token, cookieOptions);
};

// @desc    Autenticar admin e gerar token
// @route   POST /api/admin/auth/login
// @access  Público
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar entrada
    if (!email || !password) {
      return res.status(400).json({ message: 'Por favor, forneça email e senha' });
    }

    // Verificar se o usuário existe
    const adminUser = await AdminUser.findOne({ email }).select('+password');

    if (!adminUser) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Verificar se a conta está ativa
    if (adminUser.status !== 'ativo') {
      return res.status(403).json({ message: 'Conta inativa ou bloqueada' });
    }

    // Verificar se a senha está correta
    const isPasswordCorrect = await adminUser.checkPassword(password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Gerar token
    const token = generateToken(adminUser._id);

    // Configurar cookie
    setCookieOptions(res, token);

    // Atualizar último login
    adminUser.lastLogin = Date.now();
    await adminUser.save({ validateBeforeSave: false });

    // Registrar login na auditoria
    await audit.login(adminUser, { method: 'password' }, req);

    // Enviar resposta
    res.status(200).json({
      success: true,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      },
      token
    });
  } catch (error) {
    console.error('Erro no login admin:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// @desc    Obter dados do usuário atual
// @route   GET /api/admin/auth/me
// @access  Privado
const getMe = async (req, res) => {
  try {
    const adminUser = req.adminUser;

    res.status(200).json({
      success: true,
      user: {
        id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role
      }
    });
  } catch (error) {
    console.error('Erro ao obter dados do admin:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// @desc    Logout do usuário
// @route   POST /api/admin/auth/logout
// @access  Privado
const logout = async (req, res) => {
  try {
    // Registrar logout na auditoria
    if (req.adminUser) {
      await audit.logout(req.adminUser, {}, req);
    }

    // Limpar cookie
    res.clearCookie('admin_token');

    res.status(200).json({
      success: true,
      message: 'Logout realizado com sucesso'
    });
  } catch (error) {
    console.error('Erro no logout admin:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

module.exports = {
  login,
  getMe,
  logout
};