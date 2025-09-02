const mongoose = require('mongoose');

const oportunidadeSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: [true, 'Título é obrigatório'],
    trim: true
  },
  especialidade: {
    type: String,
    required: [true, 'Especialidade é obrigatória'],
    trim: true
  },
  cliente: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cliente',
    required: [true, 'Cliente é obrigatório']
  },
  local: {
    cidade: {
      type: String,
      required: [true, 'Cidade é obrigatória']
    },
    estado: {
      type: String,
      required: [true, 'Estado é obrigatório']
    },
    endereco: String
  },
  dataInicio: {
    type: Date,
    required: [true, 'Data de início é obrigatória']
  },
  dataFim: Date,
  cargaHoraria: String,
  remuneracao: {
    type: String,
    required: [true, 'Remuneração é obrigatória'],
    trim: true
  },
  descricao: String,
  requisitos: String,
  status: {
    type: String,
    enum: ['Aberta', 'Em andamento', 'Preenchida', 'Cancelada'],
    default: 'Aberta'
  },
  medicosIndicados: [
    {
      medico: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Medico'
      },
      status: {
        type: String,
        enum: ['Indicado', 'Interessado', 'Em processo', 'Contratado', 'Recusado'],
        default: 'Indicado'
      },
      dataIndicacao: {
        type: Date,
        default: Date.now
      },
      observacao: String
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
  comentarios: [
    {
      texto: String,
      usuario: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      data: {
        type: Date,
        default: Date.now
      }
    }
  ],
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
  }
});

// Índices para melhorar a performance das consultas
oportunidadeSchema.index({ especialidade: 1 });
oportunidadeSchema.index({ 'local.cidade': 1, 'local.estado': 1 });
oportunidadeSchema.index({ status: 1 });
oportunidadeSchema.index({ dataInicio: 1 });

const Oportunidade = mongoose.model('Oportunidade', oportunidadeSchema);

module.exports = Oportunidade;