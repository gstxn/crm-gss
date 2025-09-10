const Medico = require('../models/Medico');
const Oportunidade = require('../models/Oportunidade');
const mongoose = require('mongoose');

// @desc    Obter todos os médicos com filtros e paginação
// @route   GET /api/medicos
// @access  Private
const getMedicos = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Construir filtros dinâmicos
    const filtro = {};
    
    if (req.query.nome) {
      filtro.nome = { $regex: req.query.nome, $options: 'i' };
    }
    
    if (req.query.especialidade) {
      filtro.especialidade = req.query.especialidade;
    }
    
    if (req.query.cidade) {
      filtro.cidade = { $regex: req.query.cidade, $options: 'i' };
    }
    
    if (req.query.estado) {
      filtro.estado = req.query.estado;
    }
    
    // Ordenação
    const sort = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      sort.criadoEm = -1; // Padrão: mais recentes primeiro
    }
    
    // Executar consulta com paginação
    const medicos = await Medico.find(filtro)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    // Contar total para paginação
    const total = await Medico.countDocuments(filtro);
    
    res.status(200).json({
      medicos,
      paginacao: {
        total,
        paginas: Math.ceil(total / limit),
        paginaAtual: page,
        porPagina: limit
      }
    });
  } catch (error) {
    console.error('Erro ao buscar médicos:', error);
    res.status(500).json({ message: 'Erro ao buscar médicos', error: error.message });
  }
};

// @desc    Obter médico por ID
// @route   GET /api/medicos/:id
// @access  Private
const getMedicoById = async (req, res) => {
  try {
    const medico = await Medico.findById(req.params.id)
      .populate({
        path: 'oportunidades',
        select: 'titulo especialidade cliente status dataInicio local',
        populate: {
          path: 'cliente',
          select: 'nome'
        }
      })
      .populate({
        path: 'historico.usuario',
        select: 'nome'
      });
    
    if (!medico) {
      return res.status(404).json({ message: 'Médico não encontrado' });
    }
    
    res.status(200).json(medico);
  } catch (error) {
    console.error('Erro ao buscar médico:', error);
    res.status(500).json({ message: 'Erro ao buscar médico', error: error.message });
  }
};

// @desc    Criar novo médico
// @route   POST /api/medicos
// @access  Private
const createMedico = async (req, res) => {
  try {
    const {
      nome,
      crm,
      especialidade,
      email,
      telefone,
      cidade,
      estado,
      observacoes,
      disponibilidade
    } = req.body;
    
    // Verificar se o CRM já existe
    const medicoExistente = await Medico.findOne({ crm });
    if (medicoExistente) {
      return res.status(400).json({ message: 'Já existe um médico cadastrado com este CRM' });
    }
    
    // Criar o médico
    const medico = await Medico.create({
      nome,
      crm,
      especialidade,
      email,
      telefone,
      cidade,
      estado,
      observacoes,
      disponibilidade,
      criadoPor: req.user.id,
      criadoEm: new Date()
    });
    
    // Adicionar entrada no histórico
    medico.historico.push({
      tipo: 'Cadastro',
      descricao: 'Médico cadastrado no sistema',
      data: new Date(),
      usuario: req.user.id
    });
    
    await medico.save();
    
    res.status(201).json(medico);
  } catch (error) {
    console.error('Erro ao criar médico:', error);
    res.status(500).json({ message: 'Erro ao criar médico', error: error.message });
  }
};

// @desc    Atualizar médico
// @route   PUT /api/medicos/:id
// @access  Private
const updateMedico = async (req, res) => {
  try {
    const medico = await Medico.findById(req.params.id);
    
    if (!medico) {
      return res.status(404).json({ message: 'Médico não encontrado' });
    }
    
    // Se o CRM foi alterado, verificar se já existe
    if (req.body.crm && req.body.crm !== medico.crm) {
      const medicoExistente = await Medico.findOne({ crm: req.body.crm });
      if (medicoExistente) {
        return res.status(400).json({ message: 'Já existe um médico cadastrado com este CRM' });
      }
    }
    
    // Atualizar campos
    const camposAtualizaveis = [
      'nome', 'crm', 'especialidade', 'email', 'telefone',
      'cidade', 'estado', 'observacoes', 'disponibilidade'
    ];
    
    camposAtualizaveis.forEach(campo => {
      if (req.body[campo] !== undefined) {
        medico[campo] = req.body[campo];
      }
    });
    
    // Registrar atualização
    medico.atualizadoPor = req.user.id;
    medico.atualizadoEm = new Date();
    
    // Adicionar entrada no histórico
    medico.historico.push({
      tipo: 'Atualização',
      descricao: 'Dados do médico atualizados',
      data: new Date(),
      usuario: req.user.id
    });
    
    const medicoAtualizado = await medico.save();
    
    res.status(200).json(medicoAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar médico:', error);
    res.status(500).json({ message: 'Erro ao atualizar médico', error: error.message });
  }
};

// @desc    Excluir médico
// @route   DELETE /api/medicos/:id
// @access  Private
const deleteMedico = async (req, res) => {
  try {
    const medico = await Medico.findById(req.params.id);
    
    if (!medico) {
      return res.status(404).json({ message: 'Médico não encontrado' });
    }
    
    // Remover referências do médico nas oportunidades
    if (medico.oportunidades && medico.oportunidades.length > 0) {
      for (const oportunidadeId of medico.oportunidades) {
        const oportunidade = await Oportunidade.findById(oportunidadeId);
        if (oportunidade) {
          // Remover médico da lista de médicos indicados
          oportunidade.medicosIndicados = oportunidade.medicosIndicados.filter(
            medico => !medico.medico.equals(req.params.id)
          );
          await oportunidade.save();
        }
      }
    }
    
    // Excluir o médico
    await Medico.findByIdAndDelete(req.params.id);
    
    res.status(200).json({ message: 'Médico excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir médico:', error);
    res.status(500).json({ message: 'Erro ao excluir médico', error: error.message });
  }
};

// @desc    Upload de documento para médico
// @route   POST /api/medicos/:id/documentos
// @access  Private
const uploadDocumentoMedico = async (req, res) => {
  try {
    const medico = await Medico.findById(req.params.id);
    
    if (!medico) {
      return res.status(404).json({ message: 'Médico não encontrado' });
    }
    
    // Verificar se o arquivo foi enviado
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhum arquivo enviado' });
    }
    
    // Adicionar documento
    const novoDocumento = {
      nome: req.body.nome || req.file.originalname,
      tipo: req.body.tipo || 'Outro',
      caminho: req.file.path,
      dataUpload: new Date()
    };
    
    medico.documentos.push(novoDocumento);
    
    // Adicionar entrada no histórico
    medico.historico.push({
      tipo: 'Documento',
      descricao: `Documento "${novoDocumento.nome}" adicionado`,
      data: new Date(),
      usuario: req.user.id
    });
    
    // Registrar atualização
    medico.atualizadoPor = req.user.id;
    medico.atualizadoEm = new Date();
    
    await medico.save();
    
    res.status(201).json({
      message: 'Documento adicionado com sucesso',
      documento: novoDocumento
    });
  } catch (error) {
    console.error('Erro ao adicionar documento:', error);
    res.status(500).json({ message: 'Erro ao adicionar documento', error: error.message });
  }
};

// @desc    Adicionar entrada no histórico do médico
// @route   POST /api/medicos/:id/historico
// @access  Private
const addHistoricoMedico = async (req, res) => {
  try {
    const { tipo, descricao } = req.body;
    
    if (!tipo || !descricao) {
      return res.status(400).json({ message: 'Tipo e descrição são obrigatórios' });
    }
    
    const medico = await Medico.findById(req.params.id);
    
    if (!medico) {
      return res.status(404).json({ message: 'Médico não encontrado' });
    }
    
    // Adicionar entrada no histórico
    const novaEntrada = {
      tipo,
      descricao,
      data: new Date(),
      usuario: req.user.id
    };
    
    medico.historico.push(novaEntrada);
    
    // Registrar atualização
    medico.atualizadoPor = req.user.id;
    medico.atualizadoEm = new Date();
    
    await medico.save();
    
    // Buscar a entrada com o usuário populado
    const entradaPopulada = await Medico.findOne(
      { _id: medico._id, 'historico._id': medico.historico[medico.historico.length - 1]._id },
      { 'historico.$': 1 }
    ).populate('historico.usuario', 'nome');
    
    res.status(201).json({
      message: 'Histórico adicionado com sucesso',
      entrada: entradaPopulada?.historico[0] || novaEntrada
    });
  } catch (error) {
    console.error('Erro ao adicionar histórico:', error);
    res.status(500).json({ message: 'Erro ao adicionar histórico', error: error.message });
  }
};

module.exports = {
  getMedicos,
  getMedicoById,
  createMedico,
  updateMedico,
  deleteMedico,
  uploadDocumentoMedico,
  addHistoricoMedico
};