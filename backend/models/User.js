const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  nome: {
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
  cpf: {
    type: String,
    required: [true, 'CPF é obrigatório'],
    unique: true,
    trim: true
  },
  senha: {
    type: String,
    required: [true, 'Senha é obrigatória'],
    minlength: [6, 'A senha deve ter pelo menos 6 caracteres'],
    select: false
  },
  cargo: {
    type: String,
    required: [true, 'Cargo é obrigatório'],
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'operador_disparo', 'leitura', 'user'],
    default: 'user',
    required: true
  },
  telefone: {
    type: String,
    trim: true
  },
  resetSenhaToken: String,
  resetSenhaExpira: Date,
  criadoEm: {
    type: Date,
    default: Date.now
  },
  ultimoAcesso: Date
});

// Criptografar senha antes de salvar
userSchema.pre('save', async function(next) {
  // Só executa se a senha foi modificada
  if (!this.isModified('senha')) return next();
  
  // Criptografar a senha
  this.senha = await bcrypt.hash(this.senha, 12);
  next();
});

// Método para verificar se a senha está correta
userSchema.methods.verificarSenha = async function(senhaInformada, senhaArmazenada) {
  return await bcrypt.compare(senhaInformada, senhaArmazenada);
};

const User = mongoose.model('User', userSchema);

module.exports = User;