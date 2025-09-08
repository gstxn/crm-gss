const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Gerar token JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// @desc    Registrar um novo usuário
// @route   POST /api/users/register
// @access  Public
const registerUser = async (req, res) => {
  try {
    const { nome, email, cpf, senha, cargo, telefone } = req.body;

    // Verificar se o usuário já existe
    const userExists = await User.findOne({ $or: [{ email }, { cpf }] });

    if (userExists) {
      return res.status(400).json({ message: 'Usuário já cadastrado' });
    }

    // Criar o usuário
    const user = await User.create({
      nome,
      email,
      cpf,
      senha,
      cargo,
      telefone,
    });

    if (user) {
      res.status(201).json({
        _id: user._id,
        nome: user.nome,
        email: user.email,
        cpf: user.cpf,
        cargo: user.cargo,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ message: 'Dados de usuário inválidos' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Autenticar usuário e gerar token
// @route   POST /api/users/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar se username e password foram fornecidos
    if (!username || !password) {
      return res.status(400).json({ message: 'Username e password são obrigatórios' });
    }

    // Verificar se o username é email ou CPF
    const isEmail = username.includes('@');
    const query = isEmail ? { email: username } : { cpf: username };

    // Buscar o usuário
    const user = await User.findOne(query).select('+senha');

    if (!user) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Verificar se a senha está correta
    const isMatch = await user.verificarSenha(password, user.senha);

    if (!isMatch) {
      return res.status(401).json({ message: 'Credenciais inválidas' });
    }

    // Atualizar último acesso
    user.ultimoAcesso = Date.now();
    await user.save({ validateBeforeSave: false });

    res.json({
      _id: user._id,
      nome: user.nome,
      email: user.email,
      cpf: user.cpf,
      cargo: user.cargo,
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Solicitar recuperação de senha
// @route   POST /api/users/forgotpassword
// @access  Public
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Gerar token de reset
    const resetToken = crypto.randomBytes(20).toString('hex');

    // Hash do token e salvar no usuário
    user.resetSenhaToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    
    // Definir expiração do token (10 minutos)
    user.resetSenhaExpira = Date.now() + 10 * 60 * 1000;

    await user.save({ validateBeforeSave: false });

    // Criar URL de reset
    const resetUrl = `${req.protocol}://${req.get(
      'host'
    )}/resetpassword/${resetToken}`;

    const message = `Você solicitou a recuperação de senha. Por favor, acesse o link para definir uma nova senha: \n\n ${resetUrl} \n\n Se você não solicitou a recuperação, ignore este email.`;

    try {
      // Configurar o transporte de email
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        },
      });

      // Enviar o email
      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: 'Recuperação de Senha - GSS CRM',
        text: message,
      });

      res.json({ message: 'Email enviado com sucesso' });
    } catch (error) {
      user.resetSenhaToken = undefined;
      user.resetSenhaExpira = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({ message: 'Erro ao enviar email' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Redefinir senha
// @route   PUT /api/users/resetpassword/:resetToken
// @access  Public
const resetPassword = async (req, res) => {
  try {
    // Hash do token recebido
    const resetSenhaToken = crypto
      .createHash('sha256')
      .update(req.params.resetToken)
      .digest('hex');

    // Buscar usuário pelo token e verificar se não expirou
    const user = await User.findOne({
      resetSenhaToken,
      resetSenhaExpira: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ message: 'Token inválido ou expirado' });
    }

    // Definir nova senha
    user.senha = req.body.senha;
    user.resetSenhaToken = undefined;
    user.resetSenhaExpira = undefined;

    await user.save();

    res.json({ message: 'Senha alterada com sucesso' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Obter perfil do usuário
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      res.json({
        _id: user._id,
        nome: user.nome,
        email: user.email,
        cpf: user.cpf,
        cargo: user.cargo,
        telefone: user.telefone,
      });
    } else {
      res.status(404).json({ message: 'Usuário não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Atualizar perfil do usuário
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (user) {
      user.nome = req.body.nome || user.nome;
      user.email = req.body.email || user.email;
      user.telefone = req.body.telefone || user.telefone;

      if (req.body.senha) {
        user.senha = req.body.senha;
      }

      const updatedUser = await user.save();

      res.json({
        _id: updatedUser._id,
        nome: updatedUser.nome,
        email: updatedUser.email,
        cpf: updatedUser.cpf,
        cargo: updatedUser.cargo,
        telefone: updatedUser.telefone,
        token: generateToken(updatedUser._id),
      });
    } else {
      res.status(404).json({ message: 'Usuário não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  forgotPassword,
  resetPassword,
  getUserProfile,
  updateUserProfile,
};