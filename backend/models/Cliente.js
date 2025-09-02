const mongoose = require('mongoose');

const clienteSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  cnpj: {
    type: String,
    required: [true, 'CNPJ é obrigatório'],
    unique: true,
    trim: true
  },
  tipo: {
    type: String,
    enum: ['Hospital', 'Clínica', 'Outro'],
    required: [true, 'Tipo é obrigatório']
  },
  endereco: {
    rua: String,
    numero: String,
    complemento: String,
    bairro: String,
    cidade: {
      type: String,
      required: [true, 'Cidade é obrigatória']
    },
    estado: {
      type: String,
      required: [true, 'Estado é obrigatório']
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
clienteSchema.index({ 'endereco.cidade': 1, 'endereco.estado': 1 });
clienteSchema.index({ tipo: 1 });

const Cliente = mongoose.model('Cliente', clienteSchema);

module.exports = Cliente;