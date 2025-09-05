/**
 * Serviço para mapeamento de colunas e normalização de dados
 */

/**
 * Calcula a similaridade entre duas strings (para sugestão automática de mapeamento)
 * @param {string} str1 - Primeira string
 * @param {string} str2 - Segunda string
 * @returns {number} - Pontuação de similaridade (0-1)
 */
const calcularSimilaridade = (str1, str2) => {
  if (!str1 || !str2) return 0;
  
  // Normalizar strings para comparação
  const normalizar = (str) => {
    return str.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9]/g, ''); // Manter apenas letras e números
  };
  
  const s1 = normalizar(str1);
  const s2 = normalizar(str2);
  
  // Correspondência exata
  if (s1 === s2) return 1;
  
  // Verificar se uma string contém a outra
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8;
  }
  
  // Calcular similaridade baseada em caracteres comuns
  let matches = 0;
  const maxLength = Math.max(s1.length, s2.length);
  
  for (let i = 0; i < s1.length; i++) {
    if (s2.includes(s1[i])) matches++;
  }
  
  return matches / maxLength;
};

/**
 * Gera sugestões automáticas de mapeamento com base nos cabeçalhos da planilha
 * @param {Array} headers - Cabeçalhos da planilha
 * @returns {Object} - Mapeamento sugerido
 */
const gerarSugestoesMapeamento = (headers) => {
  const camposModelo = [
    { campo: 'nome', aliases: ['nome', 'name', 'cliente', 'razao', 'razão', 'razão social'] },
    { campo: 'email', aliases: ['email', 'e-mail', 'correio', 'correio eletrônico'] },
    { campo: 'telefone', aliases: ['telefone', 'phone', 'tel', 'celular', 'contato', 'fone'] },
    { campo: 'documento', aliases: ['documento', 'cpf', 'cnpj', 'cpf/cnpj', 'doc'] },
    { campo: 'empresa', aliases: ['empresa', 'company', 'organização', 'organization'] },
    { campo: 'cargo', aliases: ['cargo', 'position', 'função', 'role'] },
    { campo: 'cidade', aliases: ['cidade', 'city', 'municipio', 'município'] },
    { campo: 'uf', aliases: ['uf', 'estado', 'state', 'província', 'province'] },
    { campo: 'tags', aliases: ['tags', 'etiquetas', 'categorias', 'labels'] }
  ];
  
  const mapeamento = {};
  
  // Para cada cabeçalho da planilha
  headers.forEach(header => {
    let melhorCampo = null;
    let melhorPontuacao = 0;
    
    // Verificar contra cada campo do modelo
    camposModelo.forEach(({ campo, aliases }) => {
      // Verificar similaridade com o campo principal
      let pontuacao = calcularSimilaridade(header, campo);
      
      // Verificar similaridade com aliases
      aliases.forEach(alias => {
        const similaridade = calcularSimilaridade(header, alias);
        if (similaridade > pontuacao) {
          pontuacao = similaridade;
        }
      });
      
      // Se encontrou uma correspondência melhor
      if (pontuacao > melhorPontuacao && pontuacao > 0.6) {
        melhorCampo = campo;
        melhorPontuacao = pontuacao;
      }
    });
    
    // Se encontrou uma correspondência acima do limiar
    if (melhorCampo) {
      mapeamento[header] = melhorCampo;
    }
  });
  
  return mapeamento;
};

/**
 * Mapeia as colunas da planilha para os campos do modelo Cliente
 * @param {Array} rows - Linhas da planilha
 * @param {Object} mapeamento - Mapeamento de colunas
 * @returns {Array} - Objetos Cliente normalizados
 */
const mapColumns = (rows, mapeamento) => {
  return rows.map(row => {
    const cliente = {};
    
    // Aplicar mapeamento
    Object.entries(mapeamento).forEach(([colunaOriginal, campoModelo]) => {
      if (row[colunaOriginal] !== undefined) {
        cliente[campoModelo] = row[colunaOriginal];
      }
    });
    
    // Normalizar dados
    return normalizarDadosCliente(cliente);
  });
};

/**
 * Normaliza os dados de um cliente conforme regras de negócio
 * @param {Object} cliente - Dados do cliente
 * @returns {Object} - Cliente com dados normalizados
 */
const normalizarDadosCliente = (cliente) => {
  const clienteNormalizado = { ...cliente };
  
  // Email em minúsculas e trim
  if (clienteNormalizado.email) {
    clienteNormalizado.email = clienteNormalizado.email.toLowerCase().trim();
  }
  
  // Telefone somente dígitos
  if (clienteNormalizado.telefone) {
    clienteNormalizado.telefone = clienteNormalizado.telefone.replace(/\D/g, '');
    
    // Aplicar máscara E.164 se for um número brasileiro
    if (clienteNormalizado.telefone.length >= 10) {
      // Adicionar código do país se não tiver
      if (!clienteNormalizado.telefone.startsWith('55')) {
        clienteNormalizado.telefone = `55${clienteNormalizado.telefone}`;
      }
    }
  }
  
  // Documento limpar pontuação
  if (clienteNormalizado.documento) {
    clienteNormalizado.documento = clienteNormalizado.documento.replace(/\D/g, '');
  }
  
  // UF para upper-case
  if (clienteNormalizado.uf) {
    clienteNormalizado.uf = clienteNormalizado.uf.toUpperCase().trim();
  }
  
  // Processar tags
  if (clienteNormalizado.tags) {
    // Se for string, converter para array
    if (typeof clienteNormalizado.tags === 'string') {
      // Verificar se usa vírgula ou ponto-e-vírgula como separador
      const separador = clienteNormalizado.tags.includes(';') ? ';' : ',';
      clienteNormalizado.tags = clienteNormalizado.tags
        .split(separador)
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
    }
  } else {
    clienteNormalizado.tags = [];
  }
  
  return clienteNormalizado;
};

/**
 * Valida os dados de um cliente
 * @param {Object} cliente - Dados do cliente
 * @returns {Object} - { valido: boolean, motivo: string }
 */
const validarCliente = (cliente) => {
  // Nome é obrigatório
  if (!cliente.nome || cliente.nome.trim() === '') {
    return { valido: false, motivo: 'Nome é obrigatório' };
  }
  
  // Email deve ser válido quando presente
  if (cliente.email && cliente.email.trim() !== '') {
    const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(cliente.email)) {
      return { valido: false, motivo: 'Email inválido' };
    }
  }
  
  // Se não tem email nem documento, verificar se tem telefone
  if ((!cliente.email || cliente.email.trim() === '') && 
      (!cliente.documento || cliente.documento.trim() === '')) {
    if (!cliente.telefone || cliente.telefone.trim() === '') {
      return { 
        valido: false, 
        motivo: 'É necessário pelo menos um dos campos: email, documento ou telefone' 
      };
    }
  }
  
  return { valido: true };
};

module.exports = {
  gerarSugestoesMapeamento,
  mapColumns,
  normalizarDadosCliente,
  validarCliente
};