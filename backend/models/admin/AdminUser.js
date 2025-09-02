const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminUserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Por favor, forneça um email válido']
  },
  password: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: [8, 'A senha deve ter pelo menos 8 caracteres'],
    select: false
  },
  role: {
    type: String,
    enum: ['SUPERADMIN', 'ADMIN', 'EDITOR'],
    default: 'EDITOR',
    required: true
  },
  status: {
    type: String,
    enum: ['ativo', 'inativo', 'bloqueado'],
    default: 'ativo'
  },
  lastLogin: {
    type: Date
  },
  passwordResetToken: String,
  passwordResetExpires: Date,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Atualizar o campo updatedAt antes de salvar
adminUserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Criptografar senha antes de salvar
adminUserSchema.pre('save', async function(next) {
  // Só executa se a senha foi modificada
  if (!this.isModified('password')) return next();
  
  // Criptografar a senha
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Método para verificar se a senha está correta
adminUserSchema.methods.checkPassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const AdminUser = mongoose.model('AdminUser', adminUserSchema);

module.exports = AdminUser;