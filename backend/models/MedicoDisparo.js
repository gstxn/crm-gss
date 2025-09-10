const mongoose = require('mongoose');

// Enum para origem do registro
const OrigemRegistroEnum = {
  XLSX_UPLOAD: 'xlsx_upload',
  GOOGLE_SHEETS_SYNC: 'google_sheets_sync',
  MANUAL: 'manual'
};

// Enum para status de contato
const StatusContatoEnum = {
  NOVO: 'novo',
  FILA: 'fila',
  ENVIADO: 'enviado',
  FALHA: 'falha',
  OPT_OUT: 'opt_out'
};

// Schema para médicos de disparo
const medicoDisparoSchema = new mongoose.Schema({
  // Dados básicos
  nome: {
    type: String,
    trim: true,
    maxlength: 200
  },
  
  telefone: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        // Validar 10-13 dígitos após normalização
        const normalized = v.replace(/\D/g, '');
        return normalized.length >= 10 && normalized.length <= 13;
      },
      message: 'Telefone deve ter entre 10 e 13 dígitos'
    }
  },
  
  especialidades: {
    type: [String],
    default: [],
    validate: {
      validator: function(arr) {
        return arr.every(esp => esp && esp.trim().length > 0);
      },
      message: 'Especialidades não podem estar vazias'
    }
  },
  
  canal: {
    type: String,
    trim: true,
    maxlength: 100
  },
  
  email: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        if (!v) return true; // Email é opcional
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Email deve ter formato válido'
    }
  },
  
  codigo_origem: {
    type: String,
    trim: true,
    maxlength: 50
  },
  
  origem_registro: {
    type: String,
    enum: Object.values(OrigemRegistroEnum),
    default: OrigemRegistroEnum.XLSX_UPLOAD
  },
  
  // Campos operacionais para campanha
  permitido_envio: {
    type: Boolean,
    default: true
  },
  
  status_contato: {
    type: String,
    enum: Object.values(StatusContatoEnum),
    default: StatusContatoEnum.NOVO
  },
  
  ultima_interacao_em: {
    type: Date
  },
  
  total_envios: {
    type: Number,
    default: 0,
    min: 0
  },
  
  observacoes: {
    type: String,
    maxlength: 1000
  },
  
  // Campos de auditoria
  criado_por: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  atualizado_por: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  collection: 'medicos_disparo'
});

// Índices
medicoDisparoSchema.index({ telefone: 1 }, { unique: true });
medicoDisparoSchema.index({ status_contato: 1 });
medicoDisparoSchema.index({ especialidades: 1 });
medicoDisparoSchema.index({ permitido_envio: 1 });
medicoDisparoSchema.index({ origem_registro: 1 });
medicoDisparoSchema.index({ ultima_interacao_em: -1 });

// Middleware para normalizar telefone antes de salvar
medicoDisparoSchema.pre('save', function(next) {
  if (this.telefone) {
    // Normalizar telefone: manter apenas dígitos
    this.telefone = this.telefone.replace(/\D/g, '');
  }
  
  // Normalizar especialidades: remover espaços extras e filtrar vazias
  if (this.especialidades && Array.isArray(this.especialidades)) {
    this.especialidades = this.especialidades
      .map(esp => esp.trim())
      .filter(esp => esp.length > 0);
  }
  
  next();
});

// Middleware para normalizar telefone em queries de update
medicoDisparoSchema.pre(['updateOne', 'findOneAndUpdate'], function(next) {
  const update = this.getUpdate();
  
  if (update.telefone) {
    update.telefone = update.telefone.replace(/\D/g, '');
  }
  
  if (update.especialidades && Array.isArray(update.especialidades)) {
    update.especialidades = update.especialidades
      .map(esp => esp.trim())
      .filter(esp => esp.length > 0);
  }
  
  next();
});

// Métodos estáticos
medicoDisparoSchema.statics.normalizarTelefone = function(telefone) {
  if (!telefone) return '';
  return telefone.replace(/\D/g, '');
};

medicoDisparoSchema.statics.parseEspecialidades = function(especialidadesStr) {
  if (!especialidadesStr) return [];
  
  // Split por vírgula ou ponto e vírgula
  return especialidadesStr
    .split(/[,;]/) 
    .map(esp => esp.trim())
    .filter(esp => esp.length > 0);
};

// Método para merge de dados (usado na deduplicação)
medicoDisparoSchema.statics.mergeData = function(existente, novo) {
  const merged = { ...existente.toObject() };
  
  // Manter nome não vazio
  if (novo.nome && novo.nome.trim()) {
    merged.nome = novo.nome;
  }
  
  // Unir especialidades (sem duplicatas)
  if (novo.especialidades && novo.especialidades.length > 0) {
    const especialidadesSet = new Set([
      ...(existente.especialidades || []),
      ...novo.especialidades
    ]);
    merged.especialidades = Array.from(especialidadesSet);
  }
  
  // Atualizar outros campos se fornecidos
  ['canal', 'email', 'codigo_origem', 'observacoes'].forEach(campo => {
    if (novo[campo]) {
      merged[campo] = novo[campo];
    }
  });
  
  return merged;
};

// Método de instância para marcar como enviado
medicoDisparoSchema.methods.marcarEnviado = function() {
  this.status_contato = StatusContatoEnum.ENVIADO;
  this.ultima_interacao_em = new Date();
  this.total_envios += 1;
  return this.save();
};

// Método de instância para marcar opt-out
medicoDisparoSchema.methods.marcarOptOut = function() {
  this.permitido_envio = false;
  this.status_contato = StatusContatoEnum.OPT_OUT;
  this.ultima_interacao_em = new Date();
  return this.save();
};

// Método de instância para adicionar à fila
medicoDisparoSchema.methods.adicionarFila = function() {
  this.status_contato = StatusContatoEnum.FILA;
  return this.save();
};

// Virtual para verificar se pode receber envio
medicoDisparoSchema.virtual('podeReceberEnvio').get(function() {
  return this.permitido_envio && 
         [StatusContatoEnum.NOVO, StatusContatoEnum.FILA].includes(this.status_contato);
});

// Configurar virtuals no JSON
medicoDisparoSchema.set('toJSON', { virtuals: true });
medicoDisparoSchema.set('toObject', { virtuals: true });

// Exportar enums para uso em outros módulos
medicoDisparoSchema.statics.OrigemRegistroEnum = OrigemRegistroEnum;
medicoDisparoSchema.statics.StatusContatoEnum = StatusContatoEnum;

const MedicoDisparo = mongoose.model('MedicoDisparo', medicoDisparoSchema);

module.exports = MedicoDisparo;