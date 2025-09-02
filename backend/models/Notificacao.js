const mongoose = require('mongoose');

// Modelo para notificações/alertas do sistema
const notificacaoSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'Título é obrigatório'],
    trim: true
  },
  mensagem: {
    type: String,
    required: [true, 'Mensagem é obrigatória']
  },
  destinatario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AdminUser',
    required: [true, 'Destinatário é obrigatório']
  },
  tipo: {
    type: String,
    enum: ['INFO', 'WARNING', 'ERROR'],
    default: 'INFO'
  },
  lida: {
    type: Boolean,
    default: false
  },
  criadoEm: {
    type: Date,
    default: Date.now
  }
});

// Índices para desempenho
notificacaoSchema.index({ destinatario: 1 });
notificacaoSchema.index({ lida: 1 });
notificacaoSchema.index({ criadoEm: -1 });

const Notificacao = mongoose.model('Notificacao', notificacaoSchema);

module.exports = Notificacao;