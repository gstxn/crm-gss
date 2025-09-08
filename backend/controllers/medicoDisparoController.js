const MedicoDisparo = require('../models/MedicoDisparo');
const XLSX = require('xlsx');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/medicos-disparo');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const timestamp = Date.now();
    cb(null, `import-${timestamp}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Apenas arquivos XLSX, XLS e CSV são permitidos'), false);
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  }
});

// Listar médicos de disparo com filtros
exports.listar = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 50, 
      especialidades, 
      status_contato, 
      tem_email,
      search 
    } = req.query;

    const filtros = {};

    // Filtro por especialidades (multiseleção)
    if (especialidades) {
      const especialidadesArray = Array.isArray(especialidades) ? especialidades : [especialidades];
      filtros.especialidades = { $in: especialidadesArray };
    }

    // Filtro por status
    if (status_contato) {
      filtros.status_contato = status_contato;
    }

    // Filtro por presença de email
    if (tem_email === 'true') {
      filtros.email = { $exists: true, $ne: null, $ne: '' };
    } else if (tem_email === 'false') {
      filtros.$or = [
        { email: { $exists: false } },
        { email: null },
        { email: '' }
      ];
    }

    // Busca por nome ou telefone
    if (search) {
      filtros.$or = [
        { nome: { $regex: search, $options: 'i' } },
        { telefone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const [medicos, total] = await Promise.all([
      MedicoDisparo.find(filtros)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('criado_por', 'nome')
        .populate('atualizado_por', 'nome'),
      MedicoDisparo.countDocuments(filtros)
    ]);

    res.json({
      medicos,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total
      }
    });
  } catch (error) {
    console.error('Erro ao listar médicos de disparo:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter médico por ID
exports.obterPorId = async (req, res) => {
  try {
    const medico = await MedicoDisparo.findById(req.params.id)
      .populate('criado_por', 'nome')
      .populate('atualizado_por', 'nome');
    
    if (!medico) {
      return res.status(404).json({ error: 'Médico não encontrado' });
    }

    res.json(medico);
  } catch (error) {
    console.error('Erro ao obter médico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Criar médico
exports.criar = async (req, res) => {
  try {
    const dadosMedico = {
      ...req.body,
      origem_registro: 'manual',
      criado_por: req.user.id
    };

    const medico = await MedicoDisparo.create(dadosMedico);
    res.status(201).json(medico);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'Telefone já cadastrado' });
    }
    console.error('Erro ao criar médico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Atualizar médico
exports.atualizar = async (req, res) => {
  try {
    const medico = await MedicoDisparo.findByIdAndUpdate(
      req.params.id,
      { ...req.body, atualizado_por: req.user.id },
      { new: true, runValidators: true }
    );

    if (!medico) {
      return res.status(404).json({ error: 'Médico não encontrado' });
    }

    res.json(medico);
  } catch (error) {
    console.error('Erro ao atualizar médico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Excluir médico
exports.excluir = async (req, res) => {
  try {
    const medico = await MedicoDisparo.findByIdAndDelete(req.params.id);
    
    if (!medico) {
      return res.status(404).json({ error: 'Médico não encontrado' });
    }

    res.json({ message: 'Médico excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir médico:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Ações em massa
exports.acaoEmMassa = async (req, res) => {
  try {
    const { acao, ids } = req.body;
    
    if (!acao || !ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'Ação e IDs são obrigatórios' });
    }

    let updateData = { atualizado_por: req.user.id };
    
    switch (acao) {
      case 'adicionar_fila':
        updateData.status_contato = 'fila';
        break;
      case 'marcar_enviado':
        updateData.status_contato = 'enviado';
        updateData.ultima_interacao_em = new Date();
        updateData.$inc = { total_envios: 1 };
        break;
      case 'marcar_opt_out':
        updateData.permitido_envio = false;
        updateData.status_contato = 'opt_out';
        break;
      case 'excluir':
        const resultado = await MedicoDisparo.deleteMany({ _id: { $in: ids } });
        return res.json({ 
          message: `${resultado.deletedCount} médicos excluídos com sucesso` 
        });
      default:
        return res.status(400).json({ error: 'Ação inválida' });
    }

    const resultado = await MedicoDisparo.updateMany(
      { _id: { $in: ids } },
      updateData
    );

    res.json({ 
      message: `${resultado.modifiedCount} médicos atualizados com sucesso` 
    });
  } catch (error) {
    console.error('Erro na ação em massa:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Upload e importação de arquivo
exports.uploadArquivo = upload.single('arquivo');

exports.importarArquivo = async (req, res) => {
  try {
    console.log('=== INÍCIO DA IMPORTAÇÃO ===');
    console.log('req.file:', req.file);
    console.log('req.user:', req.user);
    
    if (!req.file) {
      console.log('ERRO: Arquivo não encontrado');
      return res.status(400).json({ error: 'Arquivo é obrigatório' });
    }

    const caminhoArquivo = req.file.path;
    console.log('Caminho do arquivo:', caminhoArquivo);
    
    const workbook = XLSX.readFile(caminhoArquivo);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const dados = XLSX.utils.sheet_to_json(worksheet);
    
    console.log('Dados extraídos:', dados.length, 'linhas');
    console.log('Primeira linha:', dados[0]);

    let inseridos = 0;
    let atualizados = 0;
    let ignorados = 0;
    const erros = [];

    for (let i = 0; i < dados.length; i++) {
      const linha = dados[i];
      const numeroLinha = i + 2; // +2 porque começa na linha 1 e tem cabeçalho
      
      try {
        console.log(`Processando linha ${numeroLinha}:`, linha);
        const dadosProcessados = MedicoDisparo.processarDadosImportacao(linha);
        console.log('Dados processados:', dadosProcessados);
        
        // Validação de campos obrigatórios
        const errosValidacao = [];
        
        if (!dadosProcessados.nome || dadosProcessados.nome.trim() === '') {
          errosValidacao.push('Nome é obrigatório');
        }
        
        if (!dadosProcessados.telefone || dadosProcessados.telefone.trim() === '') {
          errosValidacao.push('Telefone é obrigatório');
        } else {
          // Validar formato do telefone
          const telefoneNormalizado = dadosProcessados.telefone.replace(/\D/g, '');
          if (telefoneNormalizado.length < 10 || telefoneNormalizado.length > 13) {
            errosValidacao.push('Telefone deve ter entre 10 e 13 dígitos');
          }
        }
        
        if (errosValidacao.length > 0) {
          console.log(`Linha ${numeroLinha} ignorada - erros de validação:`, errosValidacao);
          ignorados++;
          erros.push(`Linha ${numeroLinha}: ${errosValidacao.join(', ')}`);
          continue;
        }

        dadosProcessados.origem_registro = 'xlsx_upload';
        
        const telefoneNormalizado = dadosProcessados.telefone.replace(/\D/g, '');
        console.log('Telefone normalizado:', telefoneNormalizado);
        
        const existente = await MedicoDisparo.findOne({ telefone: telefoneNormalizado });
        console.log('Contato existente:', existente ? 'SIM' : 'NÃO');
        
        if (existente) {
          await MedicoDisparo.upsertPorTelefone(dadosProcessados, req.user.id);
          atualizados++;
          console.log(`Linha ${numeroLinha}: Contato atualizado`);
        } else {
          await MedicoDisparo.upsertPorTelefone(dadosProcessados, req.user.id);
          inseridos++;
          console.log(`Linha ${numeroLinha}: Contato inserido`);
        }
      } catch (error) {
        console.log(`ERRO no processamento da linha ${numeroLinha}:`, error.message);
        console.log('Stack trace:', error.stack);
        ignorados++;
        erros.push(`Linha ${numeroLinha}: ${error.message}`);
      }
    }

    // Salvar informações do último arquivo para sincronização
    const infoArquivo = {
      nomeOriginal: req.file.originalname,
      caminho: caminhoArquivo,
      dataImportacao: new Date(),
      usuario: req.user.id,
      resumo: { inseridos, atualizados, ignorados }
    };

    // Aqui você pode salvar em uma collection de auditoria se necessário

    res.json({
      message: 'Importação concluída',
      resumo: {
        total: dados.length,
        inseridos,
        atualizados,
        ignorados,
        erros: erros.slice(0, 10) // Limitar erros mostrados
      }
    });
  } catch (error) {
    console.error('Erro na importação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Sincronizar planilha (repetir último import)
exports.sincronizarPlanilha = async (req, res) => {
  try {
    // Implementar lógica para repetir último import ou sincronizar com Google Sheets
    // Por enquanto, retorna mensagem de não implementado
    res.status(501).json({ 
      message: 'Sincronização com Google Sheets será implementada em versão futura' 
    });
  } catch (error) {
    console.error('Erro na sincronização:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Exportar para disparo
exports.exportarParaDisparo = async (req, res) => {
  try {
    const { formato = 'json', especialidades, status = 'novo,fila' } = req.query;
    
    const filtros = {
      permitido_envio: true,
      status_contato: { $in: status.split(',') }
    };

    if (especialidades) {
      const especialidadesArray = especialidades.split(',');
      filtros.especialidades = { $in: especialidadesArray };
    }

    const contatos = await MedicoDisparo.find(filtros)
      .select('telefone especialidades')
      .lean();

    if (formato === 'csv') {
      const csv = contatos.map(c => 
        `${c.telefone},"${c.especialidades.join(';')}"`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=contatos-disparo.csv');
      res.send(`telefone,especialidades\n${csv}`);
    } else {
      res.json(contatos);
    }
  } catch (error) {
    console.error('Erro na exportação:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Obter estatísticas
exports.obterEstatisticas = async (req, res) => {
  try {
    const [totalContatos, porStatus, porEspecialidade] = await Promise.all([
      MedicoDisparo.countDocuments(),
      MedicoDisparo.aggregate([
        { $group: { _id: '$status_contato', count: { $sum: 1 } } }
      ]),
      MedicoDisparo.aggregate([
        { $unwind: '$especialidades' },
        { $group: { _id: '$especialidades', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    res.json({
      totalContatos,
      porStatus,
      topEspecialidades: porEspecialidade
    });
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

module.exports = exports;