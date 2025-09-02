const mongoose = require('mongoose');

const taxonomiaSchema = new mongoose.Schema({
  tipo: {
    type: String,
    required: [true, 'Tipo é obrigatório'],
    enum: ['especialidade', 'estado', 'cidade', 'status_oportunidade', 'categoria'],
    trim: true
  },
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  descricao: {
    type: String,
    trim: true
  },
  ativo: {
    type: Boolean,
    default: true
  },
  ordem: {
    type: Number,
    default: 0
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Taxonomia',
    default: null
  },
  criadoEm: {
    type: Date,
    default: Date.now
  },
  atualizadoEm: {
    type: Date,
    default: Date.now
  }
});

// Middleware para atualizar a data de atualização
taxonomiaSchema.pre('save', function(next) {
  this.atualizadoEm = Date.now();
  next();
});

// Índices para melhorar a performance
taxonomiaSchema.index({ tipo: 1, nome: 1 }, { unique: true });
taxonomiaSchema.index({ parent: 1 });

const Taxonomia = mongoose.model('Taxonomia', taxonomiaSchema);

module.exports = Taxonomia;