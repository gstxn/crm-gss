const validator = require('validator');
const { v4: uuidv4 } = require('uuid');

class MapeamentoMedicoService {
  /**
   * Mapeia e normaliza dados da planilha para o modelo Médico
   * @param {Array} linhas - Linhas da planilha
   * @param {Object} mapeamento - Mapeamento de colunas
   * @returns {Object} { medicosValidos, erros }
   */
  async mapearENormalizar(linhas, mapeamento) {
    const medicosValidos = [];
    const erros = [];
    
    for (let i = 0; i < linhas.length; i++) {
      const linha = linhas[i];
      const numeroLinha = linha._numeroLinha || i + 2;
      
      try {
        const medicoNormalizado = await this.normalizarMedico(linha, mapeamento, numeroLinha);
        
        // Validar dados obrigatórios
        const validacao = this.validarDadosObrigatorios(medicoNormalizado, numeroLinha);
        
        if (validacao.valido) {
          medicosValidos.push(medicoNormalizado);
        } else {
          erros.push(...validacao.erros);
        }
      } catch (error) {
        erros.push({
          linha: numeroLinha,
          motivo: `Erro ao processar linha: ${error.message}`,
          dados: linha
        });
      }
    }
    
    return { medicosValidos, erros };
  }

  /**
   * Normaliza um médico individual
   * @param {Object} linha - Dados da linha
   * @param {Object} mapeamento - Mapeamento de colunas
   * @param {number} numeroLinha - Número da linha para referência
   * @returns {Object} Médico normalizado
   */
  async normalizarMedico(linha, mapeamento, numeroLinha) {
    const medico = {
      id: uuidv4(),
      _numeroLinha: numeroLinha
    };

    // Mapear campos básicos
    for (const [coluna, campo] of Object.entries(mapeamento)) {
      const valor = linha[coluna];
      
      if (valor && valor.trim() !== '') {
        medico[campo] = await this.normalizarCampo(campo, valor.trim());
      }
    }

    // Aplicar valores padrão
    this.aplicarValoresPadrao(medico);
    
    return medico;
  }

  /**
   * Normaliza um campo específico baseado no tipo
   * @param {string} campo - Nome do campo
   * @param {string} valor - Valor a ser normalizado
   * @returns {*} Valor normalizado
   */
  async normalizarCampo(campo, valor) {
    switch (campo) {
      case 'email':
        return this.normalizarEmail(valor);
      
      case 'telefone':
        return this.normalizarTelefone(valor);
      
      case 'cpf':
        return this.normalizarCPF(valor);
      
      case 'cnpj':
        return this.normalizarCNPJ(valor);
      
      case 'crm':
        return this.normalizarCRM(valor);
      
      case 'uf_crm':
      case 'uf':
        return this.normalizarUF(valor);
      
      case 'rqe':
        return this.normalizarArray(valor);
      
      case 'subespecialidades':
      case 'tags':
      case 'hospitais_vinculo':
        return this.normalizarArray(valor);
      
      case 'valor_hora':
        return this.normalizarValorNumerico(valor);
      
      case 'status':
        return this.normalizarStatus(valor);
      
      case 'nome':
      case 'especialidade_principal':
      case 'cidade':
      case 'disponibilidade':
        return this.normalizarTexto(valor);
      
      default:
        return valor;
    }
  }

  /**
   * Normaliza email
   * @param {string} email
   * @returns {string|null}
   */
  normalizarEmail(email) {
    if (!email) return null;
    
    const emailLimpo = email.toLowerCase().trim();
    
    if (validator.isEmail(emailLimpo)) {
      return emailLimpo;
    }
    
    return null;
  }

  /**
   * Normaliza telefone
   * @param {string} telefone
   * @returns {string|null}
   */
  normalizarTelefone(telefone) {
    if (!telefone) return null;
    
    // Remove tudo exceto dígitos
    const apenasDigitos = telefone.replace(/\D/g, '');
    
    if (apenasDigitos.length >= 10 && apenasDigitos.length <= 11) {
      return apenasDigitos;
    }
    
    return null;
  }

  /**
   * Normaliza CPF
   * @param {string} cpf
   * @returns {string|null}
   */
  normalizarCPF(cpf) {
    if (!cpf) return null;
    
    // Remove pontuação
    const cpfLimpo = cpf.replace(/\D/g, '');
    
    if (cpfLimpo.length === 11 && this.validarCPF(cpfLimpo)) {
      return cpfLimpo;
    }
    
    return null;
  }

  /**
   * Normaliza CNPJ
   * @param {string} cnpj
   * @returns {string|null}
   */
  normalizarCNPJ(cnpj) {
    if (!cnpj) return null;
    
    // Remove pontuação
    const cnpjLimpo = cnpj.replace(/\D/g, '');
    
    if (cnpjLimpo.length === 14 && this.validarCNPJ(cnpjLimpo)) {
      return cnpjLimpo;
    }
    
    return null;
  }

  /**
   * Normaliza CRM
   * @param {string} crm
   * @returns {string|null}
   */
  normalizarCRM(crm) {
    if (!crm) return null;
    
    // Remove espaços e pontuação redundante, mantém dígitos e letras
    const crmLimpo = crm.replace(/[^\w-]/g, '').toUpperCase();
    
    if (crmLimpo.length >= 3 && crmLimpo.length <= 10) {
      return crmLimpo;
    }
    
    return null;
  }

  /**
   * Normaliza UF
   * @param {string} uf
   * @returns {string|null}
   */
  normalizarUF(uf) {
    if (!uf) return null;
    
    const ufLimpa = uf.toUpperCase().trim();
    const ufsValidas = [
      'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
      'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
      'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
    ];
    
    if (ufsValidas.includes(ufLimpa)) {
      return ufLimpa;
    }
    
    return null;
  }

  /**
   * Normaliza arrays (RQE, subespecialidades, etc.)
   * @param {string} valor
   * @returns {Array}
   */
  normalizarArray(valor) {
    if (!valor) return [];
    
    // Divide por ; ou , e limpa cada item
    return valor
      .split(/[;,]/)
      .map(item => item.trim())
      .filter(item => item !== '');
  }

  /**
   * Normaliza valor numérico
   * @param {string} valor
   * @returns {number|null}
   */
  normalizarValorNumerico(valor) {
    if (!valor) return null;
    
    // Substitui vírgula por ponto e remove espaços
    const valorLimpo = valor.replace(',', '.').replace(/\s/g, '');
    const numero = parseFloat(valorLimpo);
    
    return isNaN(numero) ? null : numero;
  }

  /**
   * Normaliza status
   * @param {string} status
   * @returns {string}
   */
  normalizarStatus(status) {
    if (!status) return 'prospect';
    
    const statusLimpo = status.toLowerCase().trim();
    const statusValidos = ['ativo', 'inativo', 'prospect'];
    
    // Mapeamento de sinônimos
    const sinonimos = {
      'ativo': ['ativo', 'active', 'sim', 'yes', '1', 'true'],
      'inativo': ['inativo', 'inactive', 'não', 'no', '0', 'false'],
      'prospect': ['prospect', 'prospecto', 'potencial', 'lead']
    };
    
    for (const [statusValido, lista] of Object.entries(sinonimos)) {
      if (lista.includes(statusLimpo)) {
        return statusValido;
      }
    }
    
    return 'prospect';
  }

  /**
   * Normaliza texto simples
   * @param {string} texto
   * @returns {string}
   */
  normalizarTexto(texto) {
    if (!texto) return '';
    
    return texto.trim().replace(/\s+/g, ' ');
  }

  /**
   * Aplica valores padrão
   * @param {Object} medico
   */
  aplicarValoresPadrao(medico) {
    if (!medico.status) {
      medico.status = 'prospect';
    }
    
    if (!medico.rqe) {
      medico.rqe = [];
    }
    
    if (!medico.subespecialidades) {
      medico.subespecialidades = [];
    }
    
    if (!medico.hospitais_vinculo) {
      medico.hospitais_vinculo = [];
    }
    
    if (!medico.tags) {
      medico.tags = [];
    }
    
    // Adicionar fonte da importação
    medico.fonte = 'importacao-manual';
    
    // Timestamps
    const agora = new Date();
    medico.createdAt = agora;
    medico.updatedAt = agora;
  }

  /**
   * Valida dados obrigatórios
   * @param {Object} medico
   * @param {number} numeroLinha
   * @returns {Object} { valido, erros }
   */
  validarDadosObrigatorios(medico, numeroLinha) {
    const erros = [];
    
    // Campos obrigatórios
    if (!medico.nome || medico.nome.trim() === '') {
      erros.push({
        linha: numeroLinha,
        motivo: 'Nome é obrigatório',
        campo: 'nome'
      });
    }
    
    if (!medico.crm) {
      erros.push({
        linha: numeroLinha,
        motivo: 'CRM é obrigatório',
        campo: 'crm'
      });
    }
    
    if (!medico.uf_crm) {
      erros.push({
        linha: numeroLinha,
        motivo: 'UF do CRM é obrigatória',
        campo: 'uf_crm'
      });
    }
    
    // Verificar se há pelo menos uma forma de deduplicação válida
    const temChaveDedup = this.temChaveDeduplicacao(medico);
    if (!temChaveDedup) {
      erros.push({
        linha: numeroLinha,
        motivo: 'Linha não possui dados suficientes para deduplicação (CRM+UF, CPF, Email ou Nome+Telefone)',
        campo: 'deduplicacao'
      });
    }
    
    return {
      valido: erros.length === 0,
      erros
    };
  }

  /**
   * Verifica se o médico tem chave de deduplicação válida
   * @param {Object} medico
   * @returns {boolean}
   */
  temChaveDeduplicacao(medico) {
    // Prioridade: (crm + uf_crm) > cpf > email > (nome + telefone)
    
    // 1. CRM + UF_CRM
    if (medico.crm && medico.uf_crm) {
      return true;
    }
    
    // 2. CPF
    if (medico.cpf) {
      return true;
    }
    
    // 3. Email
    if (medico.email) {
      return true;
    }
    
    // 4. Nome + Telefone
    if (medico.nome && medico.telefone) {
      return true;
    }
    
    return false;
  }

  /**
   * Gera chave de deduplicação
   * @param {Object} medico
   * @returns {Object} { tipo, chave }
   */
  gerarChaveDeduplicacao(medico) {
    // Prioridade: (crm + uf_crm) > cpf > email > (nome + telefone)
    
    if (medico.crm && medico.uf_crm) {
      return {
        tipo: 'crm_uf',
        chave: `${medico.crm}_${medico.uf_crm}`
      };
    }
    
    if (medico.cpf) {
      return {
        tipo: 'cpf',
        chave: medico.cpf
      };
    }
    
    if (medico.email) {
      return {
        tipo: 'email',
        chave: medico.email
      };
    }
    
    if (medico.nome && medico.telefone) {
      return {
        tipo: 'nome_telefone',
        chave: `${medico.nome.toLowerCase()}_${medico.telefone}`
      };
    }
    
    return null;
  }

  /**
   * Valida CPF
   * @param {string} cpf
   * @returns {boolean}
   */
  validarCPF(cpf) {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
      return false;
    }
    
    let soma = 0;
    for (let i = 0; i < 9; i++) {
      soma += parseInt(cpf.charAt(i)) * (10 - i);
    }
    
    let resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpf.charAt(9))) return false;
    
    soma = 0;
    for (let i = 0; i < 10; i++) {
      soma += parseInt(cpf.charAt(i)) * (11 - i);
    }
    
    resto = 11 - (soma % 11);
    if (resto === 10 || resto === 11) resto = 0;
    
    return resto === parseInt(cpf.charAt(10));
  }

  /**
   * Valida CNPJ
   * @param {string} cnpj
   * @returns {boolean}
   */
  validarCNPJ(cnpj) {
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) {
      return false;
    }
    
    const pesos1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const pesos2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    
    let soma = 0;
    for (let i = 0; i < 12; i++) {
      soma += parseInt(cnpj.charAt(i)) * pesos1[i];
    }
    
    let resto = soma % 11;
    const digito1 = resto < 2 ? 0 : 11 - resto;
    
    if (digito1 !== parseInt(cnpj.charAt(12))) return false;
    
    soma = 0;
    for (let i = 0; i < 13; i++) {
      soma += parseInt(cnpj.charAt(i)) * pesos2[i];
    }
    
    resto = soma % 11;
    const digito2 = resto < 2 ? 0 : 11 - resto;
    
    return digito2 === parseInt(cnpj.charAt(13));
  }
}

module.exports = new MapeamentoMedicoService();