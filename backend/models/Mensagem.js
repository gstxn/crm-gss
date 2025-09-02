const mongoose = require('mongoose');

const mensagemSchema = new mongoose.Schema({
  assunto: {
    type: String,
    required: [true, 'Assunto é obrigatório'],
    trim: true
  },
  conteudo: {
    type: String,
    required: [true, 'Conteúdo é obrigatório']
  },
  remetente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Remetente é obrigatório']
  },
  destinatarios: [
    {
      usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Destinatário é obrigatório']
      },
      lido: {
        type: Boolean,
        default: false
      },
      dataLeitura: Date,
      excluido: {
        type: Boolean,
        default: false
      }
    }
  ],
  anexos: [
    {
      nome: String,
      tipo: String,
      caminho: String,
      tamanho: Number,
      dataUpload: {
        type: Date,
        default: Date.now
      }
    }
  ],
  criadoEm: {
    type: Date,
    default: Date.now
  },
  prioridade: {
    type: String,
    enum: ['Baixa', 'Normal', 'Alta'],
    default: 'Normal'
  },
  relacionado: {
    tipo: {
      type: String,
      enum: ['Oportunidade', 'Médico', 'Cliente', 'Geral'],
      default: 'Geral'
    },
    id: mongoose.Schema.Types.ObjectId
  }
});

// Índices para melhorar a performance das consultas
mensagemSchema.index({ remetente: 1 });
mensagemSchema.index({ 'destinatarios.usuario': 1 });
mensagemSchema.index({ criadoEm: -1 });
mensagemSchema.index({ 'relacionado.tipo': 1, 'relacionado.id': 1 });

const Mensagem = mongoose.model('Mensagem', mensagemSchema);

module.exports = Mensagem;