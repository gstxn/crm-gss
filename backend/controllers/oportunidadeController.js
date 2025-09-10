const Oportunidade = require('../models/Oportunidade');
const Cliente = require('../models/Cliente');
const Medico = require('../models/Medico');
const mongoose = require('mongoose');

// @desc    Obter todas as oportunidades
// @route   GET /api/oportunidades
// @access  Private
const getOportunidades = async (req, res) => {
  try {
    const filtro = {};
    
    // Filtros dinâmicos
    if (req.query.status) filtro.status = req.query.status;
    if (req.query.especialidade) filtro.especialidade = req.query.especialidade;
    if (req.query.cidade) filtro['local.cidade'] = req.query.cidade;
    if (req.query.estado) filtro['local.estado'] = req.query.estado;
    
    // Paginação
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Ordenação
    const sort = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      sort.criadoEm = -1; // Padrão: mais recentes primeiro
    }
    
    const oportunidades = await Oportunidade.find(filtro)
      .populate('cliente', 'nome tipo')
      .populate('criadoPor', 'nome')
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    const total = await Oportunidade.countDocuments(filtro);
    
    res.status(200).json({
      oportunidades,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Erro ao buscar oportunidades:', error);
    res.status(500).json({ message: 'Erro ao buscar oportunidades' });
  }
};

// @desc    Obter uma oportunidade por ID
// @route   GET /api/oportunidades/:id
// @access  Private
const getOportunidadeById = async (req, res) => {
  try {
    const oportunidade = await Oportunidade.findById(req.params.id)
      .populate('cliente', 'nome tipo endereco contatos')
      .populate('medicosIndicados.medico', 'nome crm especialidade telefone email')
      .populate('historico.usuario', 'nome')
      .populate('comentarios.usuario', 'nome')
      .populate('criadoPor', 'nome');
    
    if (!oportunidade) {
      return res.status(404).json({ message: 'Oportunidade não encontrada' });
    }
    
    res.status(200).json(oportunidade);
  } catch (error) {
    console.error('Erro ao buscar oportunidade:', error);
    res.status(500).json({ message: 'Erro ao buscar oportunidade' });
  }
};

// @desc    Criar uma nova oportunidade
// @route   POST /api/oportunidades
// @access  Private
const createOportunidade = async (req, res) => {
  try {
    const {
      titulo,
      especialidade,
      cliente: clienteId,
      local,
      dataInicio,
      dataFim,
      cargaHoraria,
      remuneracao,
      descricao,
      requisitos,
      status
    } = req.body;
    
    // Verificar se o cliente existe
    const cliente = await Cliente.findById(clienteId);
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    
    // Criar a oportunidade
    const oportunidade = new Oportunidade({
      titulo,
      especialidade,
      cliente: clienteId,
      local,
      dataInicio,
      dataFim,
      cargaHoraria,
      remuneracao,
      descricao,
      requisitos,
      status: status || 'Aberta',
      criadoPor: req.user.id,
      historico: [
        {
          tipo: 'Criação',
          descricao: 'Oportunidade criada',
          usuario: req.user.id
        }
      ]
    });
    
    // Salvar a oportunidade
    const savedOportunidade = await oportunidade.save();
    
    // Adicionar a oportunidade ao cliente
    cliente.oportunidades.push(savedOportunidade._id);
    await cliente.save();
    
    res.status(201).json(savedOportunidade);
  } catch (error) {
    console.error('Erro ao criar oportunidade:', error);
    
    // Tratamento de erros mais específico
    if (error.name === 'ValidationError') {
      // Erro de validação do Mongoose
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Erro de validação', 
        error: 'ValidationError', 
        details: errors.join(', ') 
      });
    } else if (error.name === 'CastError' && error.path === 'cliente') {
      // Erro de ID de cliente inválido
      return res.status(400).json({ 
        message: 'Cliente inválido', 
        error: 'ID de cliente inválido ou mal formatado' 
      });
    } else {
      // Outros erros
      res.status(500).json({ 
        message: 'Erro ao criar oportunidade', 
        error: error.message 
      });
    }
  }
};

// @desc    Atualizar uma oportunidade
// @route   PUT /api/oportunidades/:id
// @access  Private
const updateOportunidade = async (req, res) => {
  try {
    const oportunidade = await Oportunidade.findById(req.params.id);
    
    if (!oportunidade) {
      return res.status(404).json({ message: 'Oportunidade não encontrada' });
    }
    
    // Atualizar campos
    const camposAtualizaveis = [
      'titulo', 'especialidade', 'local', 'dataInicio', 'dataFim',
      'cargaHoraria', 'remuneracao', 'descricao', 'requisitos', 'status'
    ];
    
    camposAtualizaveis.forEach(campo => {
      if (req.body[campo] !== undefined) {
        oportunidade[campo] = req.body[campo];
      }
    });
    
    // Registrar atualização
    oportunidade.atualizadoEm = Date.now();
    oportunidade.atualizadoPor = req.user.id;
    
    // Adicionar ao histórico
    oportunidade.historico.push({
      tipo: 'Atualização',
      descricao: 'Oportunidade atualizada',
      usuario: req.user.id
    });
    
    await oportunidade.save();
    
    res.status(200).json(oportunidade);
  } catch (error) {
    console.error('Erro ao atualizar oportunidade:', error);
    res.status(500).json({ message: 'Erro ao atualizar oportunidade' });
  }
};

// @desc    Excluir uma oportunidade
// @route   DELETE /api/oportunidades/:id
// @access  Private
const deleteOportunidade = async (req, res) => {
  try {
    const oportunidade = await Oportunidade.findById(req.params.id);
    
    if (!oportunidade) {
      return res.status(404).json({ message: 'Oportunidade não encontrada' });
    }
    
    // Remover referência da oportunidade no cliente
    await Cliente.updateOne(
      { _id: oportunidade.cliente },
      { $pull: { oportunidades: oportunidade._id } }
    );
    
    // Remover referência da oportunidade nos médicos
    for (const medicoIndicado of oportunidade.medicosIndicados) {
      await Medico.updateOne(
        { _id: medicoIndicado.medico },
        { $pull: { oportunidades: oportunidade._id } }
      );
    }
    
    // Excluir a oportunidade
    await Oportunidade.deleteOne({ _id: req.params.id });
    
    res.status(200).json({ message: 'Oportunidade excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir oportunidade:', error);
    res.status(500).json({ message: 'Erro ao excluir oportunidade' });
  }
};

// @desc    Adicionar médico a uma oportunidade
// @route   POST /api/oportunidades/:id/medicos
// @access  Private
const addMedicoOportunidade = async (req, res) => {
  try {
    const { medicoId, status, observacao } = req.body;
    
    // Verificar se a oportunidade existe
    const oportunidade = await Oportunidade.findById(req.params.id);
    if (!oportunidade) {
      return res.status(404).json({ message: 'Oportunidade não encontrada' });
    }
    
    // Verificar se o médico existe
    const medico = await Medico.findById(medicoId);
    if (!medico) {
      return res.status(404).json({ message: 'Médico não encontrado' });
    }
    
    // Verificar se o médico já está indicado
    const medicoJaIndicado = oportunidade.medicosIndicados.find(
      m => m.medico.toString() === medicoId
    );
    
    if (medicoJaIndicado) {
      return res.status(400).json({ message: 'Médico já indicado para esta oportunidade' });
    }
    
    // Adicionar médico à oportunidade
    oportunidade.medicosIndicados.push({
      medico: medicoId,
      status: status || 'Indicado',
      observacao
    });
    
    // Adicionar ao histórico
    oportunidade.historico.push({
      tipo: 'Indicação',
      descricao: `Médico ${medico.nome} indicado para a oportunidade`,
      usuario: req.user.id
    });
    
    await oportunidade.save();
    
    // Adicionar oportunidade ao médico
    medico.oportunidades.push(oportunidade._id);
    await medico.save();
    
    res.status(200).json(oportunidade);
  } catch (error) {
    console.error('Erro ao adicionar médico à oportunidade:', error);
    res.status(500).json({ message: 'Erro ao adicionar médico à oportunidade' });
  }
};

// @desc    Atualizar status de um médico em uma oportunidade
// @route   PUT /api/oportunidades/:id/medicos/:medicoId
// @access  Private
const updateStatusMedicoOportunidade = async (req, res) => {
  try {
    const { status, observacao } = req.body;
    const { id, medicoId } = req.params;
    
    const oportunidade = await Oportunidade.findById(id);
    if (!oportunidade) {
      return res.status(404).json({ message: 'Oportunidade não encontrada' });
    }
    
    // Encontrar o médico na lista de indicados
    const medicoIndicado = oportunidade.medicosIndicados.find(
      m => m.medico.toString() === medicoId
    );
    
    if (!medicoIndicado) {
      return res.status(404).json({ message: 'Médico não encontrado nesta oportunidade' });
    }
    
    // Buscar informações do médico para o histórico
    const medico = await Medico.findById(medicoId, 'nome');
    
    // Atualizar status e observação
    const statusAntigo = medicoIndicado.status;
    medicoIndicado.status = status;
    
    if (observacao) {
      medicoIndicado.observacao = observacao;
    }
    
    // Adicionar ao histórico
    oportunidade.historico.push({
      tipo: 'Atualização de Status',
      descricao: `Status do médico ${medico.nome} alterado de ${statusAntigo} para ${status}`,
      usuario: req.user.id
    });
    
    // Se o status for 'Contratado', atualizar o status da oportunidade para 'Preenchida'
    if (status === 'Contratado' && oportunidade.status !== 'Preenchida') {
      oportunidade.status = 'Preenchida';
      oportunidade.historico.push({
        tipo: 'Atualização de Status',
        descricao: 'Oportunidade marcada como Preenchida',
        usuario: req.user.id
      });
    }
    
    await oportunidade.save();
    
    res.status(200).json(oportunidade);
  } catch (error) {
    console.error('Erro ao atualizar status do médico:', error);
    res.status(500).json({ message: 'Erro ao atualizar status do médico' });
  }
};

// @desc    Adicionar comentário a uma oportunidade
// @route   POST /api/oportunidades/:id/comentarios
// @access  Private
const addComentarioOportunidade = async (req, res) => {
  try {
    const { texto } = req.body;
    
    if (!texto) {
      return res.status(400).json({ message: 'Texto do comentário é obrigatório' });
    }
    
    const oportunidade = await Oportunidade.findById(req.params.id);
    if (!oportunidade) {
      return res.status(404).json({ message: 'Oportunidade não encontrada' });
    }
    
    // Adicionar comentário
    oportunidade.comentarios.push({
      texto,
      usuario: req.user.id
    });
    
    await oportunidade.save();
    
    // Retornar o comentário populado
    const oportunidadeAtualizada = await Oportunidade.findById(req.params.id)
      .populate('comentarios.usuario', 'nome');
    
    res.status(200).json(oportunidadeAtualizada.comentarios);
  } catch (error) {
    console.error('Erro ao adicionar comentário:', error);
    res.status(500).json({ message: 'Erro ao adicionar comentário' });
  }
};

// @desc    Adicionar evento ao histórico de uma oportunidade
// @route   POST /api/oportunidades/:id/historico
// @access  Private
const addHistoricoOportunidade = async (req, res) => {
  try {
    const { tipo, descricao } = req.body;
    
    if (!tipo || !descricao) {
      return res.status(400).json({ message: 'Tipo e descrição são obrigatórios' });
    }
    
    const oportunidade = await Oportunidade.findById(req.params.id);
    if (!oportunidade) {
      return res.status(404).json({ message: 'Oportunidade não encontrada' });
    }
    
    // Adicionar evento ao histórico
    oportunidade.historico.push({
      tipo,
      descricao,
      usuario: req.user.id
    });
    
    await oportunidade.save();
    
    // Retornar o histórico populado
    const oportunidadeAtualizada = await Oportunidade.findById(req.params.id)
      .populate('historico.usuario', 'nome');
    
    res.status(200).json(oportunidadeAtualizada.historico);
  } catch (error) {
    console.error('Erro ao adicionar evento ao histórico:', error);
    res.status(500).json({ message: 'Erro ao adicionar evento ao histórico' });
  }
};

module.exports = {
  getOportunidades,
  getOportunidadeById,
  createOportunidade,
  updateOportunidade,
  deleteOportunidade,
  addMedicoOportunidade,
  updateStatusMedicoOportunidade,
  addComentarioOportunidade,
  addHistoricoOportunidade
};