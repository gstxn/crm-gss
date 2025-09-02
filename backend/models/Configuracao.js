const mongoose = require('mongoose');

const configuracaoSchema = new mongoose.Schema({
  chave: {
    type: String,
    required: [true, 'Chave é obrigatória'],
    unique: true,
    trim: true
  },
  valor: {
    type: mongoose.Schema.Types.Mixed,
    required: [true, 'Valor é obrigatório']
  },
  tipo: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    default: 'string'
  },
  descricao: {
    type: String,
    trim: true
  },
  categoria: {
    type: String,
    default: 'geral',
    trim: true
  },
  publico: {
    type: Boolean,
    default: false
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
configuracaoSchema.pre('save', function(next) {
  this.atualizadoEm = Date.now();
  next();
});

// Índice para melhorar a performance
configuracaoSchema.index({ chave: 1 }, { unique: true });
configuracaoSchema.index({ categoria: 1 });

const Configuracao = mongoose.model('Configuracao', configuracaoSchema);

module.exports = Configuracao;