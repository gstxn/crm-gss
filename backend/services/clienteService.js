/**
 * Serviço para operações de clientes, incluindo upsert com deduplicação
 */
const Cliente = require('../models/Cliente');
const { validarCliente } = require('./mapeamentoService');

/**
 * Busca um cliente existente com base nas chaves de deduplicação
 * @param {Object} cliente - Dados do cliente
 * @returns {Promise<Object|null>} - Cliente encontrado ou null
 */
const buscarClienteExistente = async (cliente) => {
  // Chave de deduplicação: email > documento > (nome + telefone)
  let clienteExistente = null;
  
  // 1. Buscar por email (se presente)
  if (cliente.email && cliente.email.trim() !== '') {
    clienteExistente = await Cliente.findOne({ email: cliente.email });
    if (clienteExistente) return clienteExistente;
  }
  
  // 2. Buscar por documento (se presente)
  if (cliente.documento && cliente.documento.trim() !== '') {
    clienteExistente = await Cliente.findOne({ documento: cliente.documento });
    if (clienteExistente) return clienteExistente;
  }
  
  // 3. Buscar por nome + telefone (se ambos presentes)
  if (cliente.nome && cliente.telefone && 
      cliente.nome.trim() !== '' && 
      cliente.telefone.trim() !== '') {
    clienteExistente = await Cliente.findOne({
      nome: cliente.nome,
      telefone: cliente.telefone
    });
    if (clienteExistente) return clienteExistente;
  }
  
  return null;
};

/**
 * Realiza upsert de um único cliente
 * @param {Object} cliente - Dados do cliente
 * @param {Object} options - Opções adicionais
 * @returns {Promise<Object>} - Resultado da operação
 */
const upsertCliente = async (cliente, options = {}) => {
  try {
    // Validar cliente
    const validacao = validarCliente(cliente);
    if (!validacao.valido) {
      return { 
        status: 'erro', 
        motivo: validacao.motivo,
        cliente: cliente
      };
    }
    
    // Buscar cliente existente
    const clienteExistente = await buscarClienteExistente(cliente);
    
    if (clienteExistente) {
      // Atualizar cliente existente
      Object.keys(cliente).forEach(key => {
        // Não sobrescrever campos existentes com valores vazios
        if (cliente[key] !== undefined && cliente[key] !== null && cliente[key] !== '') {
          // Caso especial para tags (mesclar arrays)
          if (key === 'tags' && Array.isArray(cliente.tags)) {
            // Mesclar tags sem duplicatas
            const tagsExistentes = clienteExistente.tags || [];
            const novasTags = [...new Set([...tagsExistentes, ...cliente.tags])];
            clienteExistente.tags = novasTags;
          } else {
            clienteExistente[key] = cliente[key];
          }
        }
      });
      
      // Atualizar metadados
      clienteExistente.atualizadoEm = new Date();
      if (options.userId) {
        clienteExistente.atualizadoPor = options.userId;
      }
      
      // Registrar fonte da atualização
      if (options.fonte) {
        clienteExistente.fonte = options.fonte;
      }
      
      // Adicionar ao histórico
      if (options.userId) {
        clienteExistente.historico.push({
          tipo: 'Atualização',
          descricao: `Cliente atualizado via ${options.fonte || 'importação'}`,
          usuario: options.userId
        });
      }
      
      await clienteExistente.save();
      
      return { 
        status: 'atualizado', 
        cliente: clienteExistente 
      };
    } else {
      // Criar novo cliente
      const novoCliente = new Cliente({
        ...cliente,
        criadoEm: new Date(),
        fonte: options.fonte || 'importacao-manual'
      });
      
      // Adicionar metadados
      if (options.userId) {
        novoCliente.criadoPor = options.userId;
        
        // Adicionar ao histórico
        novoCliente.historico = [{
          tipo: 'Criação',
          descricao: `Cliente criado via ${options.fonte || 'importação'}`,
          usuario: options.userId
        }];
      }
      
      await novoCliente.save();
      
      return { 
        status: 'criado', 
        cliente: novoCliente 
      };
    }
  } catch (error) {
    console.error('Erro ao realizar upsert de cliente:', error);
    return { 
      status: 'erro', 
      motivo: error.message,
      cliente: cliente
    };
  }
};

/**
 * Realiza upsert de múltiplos clientes em lote
 * @param {Array} clientes - Array de dados de clientes
 * @param {Object} options - Opções adicionais
 * @returns {Promise<Object>} - Resultado da operação em lote
 */
const upsertClientes = async (clientes, options = {}) => {
  const resultado = {
    total: clientes.length,
    criados: 0,
    atualizados: 0,
    ignorados: 0,
    erros: [],
    detalhes: []
  };
  
  // Processar em lotes para melhor performance
  const tamanhoBatch = options.batchSize || 500;
  
  for (let i = 0; i < clientes.length; i += tamanhoBatch) {
    const batch = clientes.slice(i, i + tamanhoBatch);
    
    // Usar Promise.all para processar o lote em paralelo
    const resultadosBatch = await Promise.all(
      batch.map(async (cliente, index) => {
        const resultadoUpsert = await upsertCliente(cliente, options);
        
        // Registrar resultado
        switch (resultadoUpsert.status) {
          case 'criado':
            resultado.criados++;
            break;
          case 'atualizado':
            resultado.atualizados++;
            break;
          case 'erro':
            resultado.erros.push({
              linha: i + index + 1, // +1 para considerar cabeçalho
              motivo: resultadoUpsert.motivo,
              dados: cliente
            });
            break;
          default:
            resultado.ignorados++;
        }
        
        return resultadoUpsert;
      })
    );
    
    resultado.detalhes = [...resultado.detalhes, ...resultadosBatch];
  }
  
  return resultado;
};

module.exports = {
  upsertCliente,
  upsertClientes,
  buscarClienteExistente
};