const Cliente = require('../models/Cliente');
const Oportunidade = require('../models/Oportunidade');
const mongoose = require('mongoose');

// @desc    Obter todos os clientes com filtros, paginação e ordenação
// @route   GET /api/clientes
// @access  Private
const getClientes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Construir query de filtros
    const query = { ativo: true };
    
    // Filtros
    if (req.query.nome) {
      query.nome = { $regex: req.query.nome, $options: 'i' };
    }
    
    if (req.query.tipo) {
      query.tipo = req.query.tipo;
    }
    
    if (req.query.cidade) {
      query['endereco.cidade'] = { $regex: req.query.cidade, $options: 'i' };
    }
    
    if (req.query.estado) {
      query['endereco.estado'] = req.query.estado;
    }
    
    // Ordenação
    const sort = {};
    if (req.query.sortBy) {
      const parts = req.query.sortBy.split(':');
      sort[parts[0]] = parts[1] === 'desc' ? -1 : 1;
    } else {
      sort.nome = 1; // Ordenação padrão por nome
    }
    
    // Executar query com paginação
    const clientes = await Cliente.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select('nome tipo endereco.cidade endereco.estado contatos oportunidades');
    
    // Contar total de documentos para paginação
    const total = await Cliente.countDocuments(query);
    
    res.status(200).json({
      clientes,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({ message: 'Erro ao buscar clientes', error: error.message });
  }
};

// @desc    Obter cliente por ID
// @route   GET /api/clientes/:id
// @access  Private
const getClienteById = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id)
      .populate({
        path: 'oportunidades',
        select: 'titulo status valor dataFechamentoPrevista'
      })
      .populate({
        path: 'historico.usuario',
        select: 'nome email'
      });
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    
    res.status(200).json(cliente);
  } catch (error) {
    console.error('Erro ao buscar cliente:', error);
    res.status(500).json({ message: 'Erro ao buscar cliente', error: error.message });
  }
};

// @desc    Criar novo cliente
// @route   POST /api/clientes
// @access  Private
const createCliente = async (req, res) => {
  try {
    // Verificar se já existe cliente com o mesmo CNPJ
    const clienteExistente = await Cliente.findOne({ cnpj: req.body.cnpj });
    if (clienteExistente) {
      return res.status(400).json({ message: 'Já existe um cliente com este CNPJ' });
    }
    
    // Criar o cliente
    const cliente = new Cliente({
      ...req.body,
      criadoPor: req.user.id,
      historico: [
        {
          tipo: 'Criação',
          descricao: 'Cliente cadastrado no sistema',
          usuario: req.user.id
        }
      ]
    });
    
    const clienteCriado = await cliente.save();
    
    res.status(201).json(clienteCriado);
  } catch (error) {
    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ message: 'Erro ao criar cliente', error: error.message });
  }
};

// @desc    Atualizar cliente
// @route   PUT /api/clientes/:id
// @access  Private
const updateCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    
    // Verificar se está tentando atualizar o CNPJ para um que já existe
    if (req.body.cnpj && req.body.cnpj !== cliente.cnpj) {
      const clienteExistente = await Cliente.findOne({ cnpj: req.body.cnpj });
      if (clienteExistente) {
        return res.status(400).json({ message: 'Já existe um cliente com este CNPJ' });
      }
    }
    
    // Atualizar campos
    const camposAtualizaveis = [
      'nome', 'cnpj', 'tipo', 'endereco', 'contatos', 'observacoes', 'ativo'
    ];
    
    camposAtualizaveis.forEach(campo => {
      if (req.body[campo] !== undefined) {
        cliente[campo] = req.body[campo];
      }
    });
    
    // Adicionar registro ao histórico
    cliente.historico.push({
      tipo: 'Atualização',
      descricao: 'Dados do cliente atualizados',
      usuario: req.user.id
    });
    
    cliente.atualizadoEm = Date.now();
    cliente.atualizadoPor = req.user.id;
    
    const clienteAtualizado = await cliente.save();
    
    res.status(200).json(clienteAtualizado);
  } catch (error) {
    console.error('Erro ao atualizar cliente:', error);
    res.status(500).json({ message: 'Erro ao atualizar cliente', error: error.message });
  }
};

// @desc    Excluir cliente
// @route   DELETE /api/clientes/:id
// @access  Private
const deleteCliente = async (req, res) => {
  try {
    const cliente = await Cliente.findById(req.params.id);

    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }

    // Verificar se há oportunidades associadas
    const oportunidadesAssociadas = await Oportunidade.countDocuments({ cliente: req.params.id });

    if (oportunidadesAssociadas > 0) {
      // Em vez de excluir, marcar como inativo
      cliente.ativo = false;
      cliente.atualizadoEm = Date.now();
      cliente.atualizadoPor = req.user.id;

      cliente.historico.push({
        tipo: 'Desativação',
        descricao: 'Cliente desativado no sistema',
        usuario: req.user.id
      });

      await cliente.save();

      return res.status(200).json({
        message: 'Cliente desativado com sucesso pois possui oportunidades associadas',
        desativado: true
      });
    }

    // Se não houver oportunidades, excluir completamente
    await cliente.deleteOne();

    return res.status(200).json({ message: 'Cliente excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir cliente:', error);
    res.status(500).json({ message: 'Erro ao excluir cliente', error: error.message });
  }
};

// @desc    Adicionar entrada ao histórico do cliente
// @route   POST /api/clientes/:id/historico
// @access  Private
const addHistoricoCliente = async (req, res) => {
  try {
    const { tipo, descricao } = req.body;
    
    if (!tipo || !descricao) {
      return res.status(400).json({ message: 'Tipo e descrição são obrigatórios' });
    }
    
    const cliente = await Cliente.findById(req.params.id);
    
    if (!cliente) {
      return res.status(404).json({ message: 'Cliente não encontrado' });
    }
    
    cliente.historico.push({
      tipo,
      descricao,
      usuario: req.user.id
    });
    
    cliente.atualizadoEm = Date.now();
    cliente.atualizadoPor = req.user.id;
    
    await cliente.save();
    
    res.status(201).json({
      message: 'Histórico adicionado com sucesso',
      historicoItem: cliente.historico[cliente.historico.length - 1]
    });
  } catch (error) {
    console.error('Erro ao adicionar histórico:', error);
    res.status(500).json({ message: 'Erro ao adicionar histórico', error: error.message });
  }
};

module.exports = {
  getClientes,
  getClienteById,
  createCliente,
  updateCliente,
  deleteCliente,
  addHistoricoCliente
};