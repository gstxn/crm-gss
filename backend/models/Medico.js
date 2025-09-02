const mongoose = require('mongoose');

const medicoSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  crm: {
    type: String,
    required: [true, 'CRM é obrigatório'],
    unique: true,
    trim: true
  },
  especialidade: {
    type: String,
    required: [true, 'Especialidade é obrigatória'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email é obrigatório'],
    lowercase: true,
    trim: true
  },
  telefone: {
    type: String,
    required: [true, 'Telefone é obrigatório'],
    trim: true
  },
  cidade: {
    type: String,
    required: [true, 'Cidade é obrigatória'],
    trim: true
  },
  estado: {
    type: String,
    required: [true, 'Estado é obrigatório'],
    trim: true
  },
  documentos: [
    {
      nome: String,
      tipo: String,
      caminho: String,
      dataUpload: {
        type: Date,
        default: Date.now
      }
    }
  ],
  observacoes: String,
  disponibilidade: {
    diasDisponiveis: [String],
    horarios: String,
    viaja: Boolean
  },
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
medicoSchema.index({ nome: 1 });
medicoSchema.index({ especialidade: 1 });
medicoSchema.index({ cidade: 1, estado: 1 });

const Medico = mongoose.model('Medico', medicoSchema);

module.exports = Medico;