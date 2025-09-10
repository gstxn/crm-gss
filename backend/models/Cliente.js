const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true,
    validate: {
      validator: function(v) {
        return v === null || v === '' || /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: props => `${props.value} não é um email válido!`
    }
  },
  telefone: {
    type: String,
    trim: true
  },
  documento: {
    type: String,
    trim: true,
    unique: true,
    sparse: true
  },
  empresa: {
    type: String,
    trim: true
  },
  cargo: {
    type: String,
    trim: true
  },
  tipo: {
    type: String,
    enum: ['Hospital', 'Clínica', 'Outro'],
    default: 'Outro'
  },
  endereco: {
    rua: String,
    numero: String,
    complemento: String,
    bairro: String,
    cidade: {
      type: String,
      trim: true
    },
    estado: {
      type: String,
      trim: true,
      uppercase: true
    },
    cep: String
  },
  contatos: [
    {
      nome: String,
      cargo: String,
      telefone: String,
      email: String,
      principal: Boolean
    }
  ],
  oportunidades: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Oportunidade'
    }
  ],
  historico: [
    {
      tipo: String,
      descricao: String,
      data: {
        type: Date,
        default: Date.now
      },
      usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    }
  ],
  observacoes: String,
  tags: [{
    type: String,
    trim: true
  }],
  fonte: {
    type: String,
    enum: ['manual', 'importacao-manual', 'google-sheets'],
    default: 'manual'
  },
  criadoEm: {
    type: Date,
    default: Date.now
  },
  criadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  atualizadoEm: Date,
  atualizadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  ativo: {
    type: Boolean,
    default: true
  }
});

// Índices para melhorar a performance das consultas
clienteSchema.index({ nome: 1 });
clienteSchema.index({ email: 1 });
clienteSchema.index({ documento: 1 });
clienteSchema.index({ telefone: 1 });
clienteSchema.index({ 'endereco.cidade': 1, 'endereco.estado': 1 });
clienteSchema.index({ tipo: 1 });
clienteSchema.index({ tags: 1 });

const Cliente = mongoose.model('Cliente', clienteSchema);

module.exports = Cliente;