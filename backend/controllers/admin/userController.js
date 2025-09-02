const AdminUser = require('../../models/admin/AdminUser');
const audit = require('../../utils/admin/audit');

// @desc    Obter todos os usuários administrativos
// @route   GET /api/admin/users
// @access  Privado (Admin)
const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = {};
    
    // Filtros opcionais
    if (req.query.role) filter.role = req.query.role;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const users = await AdminUser.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await AdminUser.countDocuments(filter);

    // Registrar na auditoria
    await audit.read(req.adminUser, 'AdminUser', null, { filter, page, limit }, req);

    res.status(200).json({
      success: true,
      count: users.length,
      total,
      pages: Math.ceil(total / limit),
      page,
      data: users
    });
  } catch (error) {
    console.error('Erro ao listar usuários admin:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// @desc    Obter um usuário administrativo por ID
// @route   GET /api/admin/users/:id
// @access  Privado (Admin)
const getUserById = async (req, res) => {
  try {
    const user = await AdminUser.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Registrar na auditoria
    await audit.read(req.adminUser, 'AdminUser', user._id, {}, req);

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erro ao buscar usuário admin:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// @desc    Criar um novo usuário administrativo
// @route   POST /api/admin/users
// @access  Privado (Admin)
const createUser = async (req, res) => {
  try {
    const { name, email, password, role, status } = req.body;

    // Verificar se o email já existe
    const userExists = await AdminUser.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'Email já está em uso' });
    }

    // Verificar permissões para criar usuários com determinados roles
    if (role === 'SUPERADMIN' && req.adminUser.role !== 'SUPERADMIN') {
      return res.status(403).json({ 
        message: 'Apenas SUPERADMIN pode criar outros usuários SUPERADMIN' 
      });
    }

    // Criar o usuário
    const user = await AdminUser.create({
      name,
      email,
      password,
      role,
      status: status || 'ativo'
    });

    // Registrar na auditoria
    await audit.create(
      req.adminUser, 
      'AdminUser', 
      user._id, 
      { name, email, role, status }, 
      req
    );

    res.status(201).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Erro ao criar usuário admin:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// @desc    Atualizar um usuário administrativo
// @route   PUT /api/admin/users/:id
// @access  Privado (Admin)
const updateUser = async (req, res) => {
  try {
    const { name, email, role, status } = req.body;
    const userId = req.params.id;

    // Verificar se o usuário existe
    let user = await AdminUser.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar permissões
    if (user.role === 'SUPERADMIN' && req.adminUser.role !== 'SUPERADMIN') {
      return res.status(403).json({ 
        message: 'Apenas SUPERADMIN pode modificar outros usuários SUPERADMIN' 
      });
    }

    if (role === 'SUPERADMIN' && req.adminUser.role !== 'SUPERADMIN') {
      return res.status(403).json({ 
        message: 'Apenas SUPERADMIN pode promover usuários para SUPERADMIN' 
      });
    }

    // Verificar se o email já está em uso por outro usuário
    if (email && email !== user.email) {
      const emailExists = await AdminUser.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'Email já está em uso' });
      }
    }

    // Preparar dados para atualização
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (status) updateData.status = status;

    // Atualizar o usuário
    user = await AdminUser.findByIdAndUpdate(
      userId,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    // Registrar na auditoria
    await audit.update(
      req.adminUser, 
      'AdminUser', 
      user._id, 
      updateData, 
      req
    );

    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Erro ao atualizar usuário admin:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// @desc    Alterar senha de um usuário administrativo
// @route   PUT /api/admin/users/:id/password
// @access  Privado (Admin)
const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.params.id;

    // Verificar se o usuário existe
    const user = await AdminUser.findById(userId).select('+password');

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar permissões
    const isSelfUpdate = req.adminUser._id.toString() === userId;
    const isSuperAdmin = req.adminUser.role === 'SUPERADMIN';

    // Se for alteração da própria senha, verificar senha atual
    if (isSelfUpdate) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Senha atual é obrigatória' });
      }

      const isPasswordCorrect = await user.checkPassword(currentPassword);
      if (!isPasswordCorrect) {
        return res.status(401).json({ message: 'Senha atual incorreta' });
      }
    } else if (!isSuperAdmin) {
      // Se não for o próprio usuário e não for SUPERADMIN, negar acesso
      return res.status(403).json({ 
        message: 'Você não tem permissão para alterar a senha de outro usuário' 
      });
    }

    // Atualizar a senha
    user.password = newPassword;
    await user.save();

    // Registrar na auditoria (sem incluir a senha nos detalhes)
    await audit.update(
      req.adminUser, 
      'AdminUser', 
      user._id, 
      { passwordChanged: true }, 
      req
    );

    res.status(200).json({
      success: true,
      message: 'Senha atualizada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao atualizar senha:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

// @desc    Excluir um usuário administrativo
// @route   DELETE /api/admin/users/:id
// @access  Privado (Admin)
const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;

    // Verificar se o usuário existe
    const user = await AdminUser.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Usuário não encontrado' });
    }

    // Verificar permissões
    if (user.role === 'SUPERADMIN' && req.adminUser.role !== 'SUPERADMIN') {
      return res.status(403).json({ 
        message: 'Apenas SUPERADMIN pode excluir outros usuários SUPERADMIN' 
      });
    }

    // Impedir exclusão do próprio usuário
    if (req.adminUser._id.toString() === userId) {
      return res.status(400).json({ message: 'Você não pode excluir sua própria conta' });
    }

    // Excluir o usuário
    await user.remove();

    // Registrar na auditoria
    await audit.delete(req.adminUser, 'AdminUser', userId, { name: user.name }, req);

    res.status(200).json({
      success: true,
      message: 'Usuário excluído com sucesso'
    });
  } catch (error) {
    console.error('Erro ao excluir usuário admin:', error);
    res.status(500).json({ message: 'Erro no servidor' });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updatePassword,
  deleteUser
};