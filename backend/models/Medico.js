const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const medicoSchema = new mongoose.Schema({
  id: {
    type: String,
    default: uuidv4,
    unique: true
  },
  nome: {
    type: String,
    required: [true, 'Nome é obrigatório'],
    trim: true
  },
  email: {
    type: String,
    lowercase: true,
    trim: true,
    sparse: true, // Permite valores únicos ou null
    validate: {
      validator: function(v) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Email deve ter um formato válido'
    }
  },
  telefone: {
    type: String,
    trim: true
  },
  crm: {
    type: String,
    required: [true, 'CRM é obrigatório'],
    trim: true
  },
  uf_crm: {
    type: String,
    required: [true, 'UF do CRM é obrigatória'],
    uppercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^[A-Z]{2}$/.test(v);
      },
      message: 'UF do CRM deve ter exatamente 2 letras'
    }
  },
  rqe: [{
    type: String,
    trim: true
  }],
  cpf: {
    type: String,
    trim: true,
    sparse: true, // Permite valores únicos ou null
    validate: {
      validator: function(v) {
        return !v || /^\d{11}$/.test(v.replace(/\D/g, ''));
      },
      message: 'CPF deve conter 11 dígitos'
    }
  },
  cnpj: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^\d{14}$/.test(v.replace(/\D/g, ''));
      },
      message: 'CNPJ deve conter 14 dígitos'
    }
  },
  especialidade_principal: {
    type: String,
    trim: true
  },
  subespecialidades: [{
    type: String,
    trim: true
  }],
  cidade: {
    type: String,
    trim: true
  },
  uf: {
    type: String,
    uppercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || /^[A-Z]{2}$/.test(v);
      },
      message: 'UF deve ter exatamente 2 letras'
    }
  },
  hospitais_vinculo: [{
    type: String,
    trim: true
  }],
  disponibilidade: {
    type: String,
    trim: true
  },
  valor_hora: {
    type: Number,
    min: 0
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['ativo', 'inativo', 'prospect'],
    default: 'ativo'
  },
  fonte: {
    type: String,
    enum: ['manual', 'importacao-manual', 'google-sheets'],
    default: 'manual'
  },
  // Campos legados mantidos para compatibilidade
  especialidade: {
    type: String,
    trim: true
  },
  estado: {
    type: String,
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

// Índices para melhorar a performance das consultas e deduplicação
medicoSchema.index({ crm: 1, uf_crm: 1 }, { unique: true }); // Chave primária de deduplicação
medicoSchema.index({ cpf: 1 }, { unique: true, sparse: true }); // Segunda chave de deduplicação
medicoSchema.index({ email: 1 }, { unique: true, sparse: true }); // Terceira chave de deduplicação
medicoSchema.index({ nome: 1, telefone: 1 }); // Quarta chave de deduplicação
medicoSchema.index({ nome: 1 });
medicoSchema.index({ especialidade_principal: 1 });
medicoSchema.index({ especialidade: 1 }); // Compatibilidade
medicoSchema.index({ cidade: 1, uf: 1 });
medicoSchema.index({ cidade: 1, estado: 1 }); // Compatibilidade
medicoSchema.index({ status: 1 });
medicoSchema.index({ fonte: 1 });
medicoSchema.index({ tags: 1 });
medicoSchema.index({ createdAt: 1 });
medicoSchema.index({ updatedAt: 1 });

const Medico = mongoose.model('Medico', medicoSchema);

module.exports = Medico;