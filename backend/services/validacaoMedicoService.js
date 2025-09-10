const { AppError } = require('../utils/errorHandler');

class ValidacaoMedicoService {
  constructor() {
    // Inicialização do serviço de validação
  }

  /**
   * Valida dados básicos de um médico
   */
  async validarDadosBasicos(dadosMedico) {
    const erros = [];

    // Validar nome
    if (!dadosMedico.nome || dadosMedico.nome.trim().length < 2) {
      erros.push('Nome é obrigatório e deve ter pelo menos 2 caracteres');
    }

    // Validar CRM
    if (!dadosMedico.crm || !/^\d{4,6}$/.test(dadosMedico.crm)) {
      erros.push('CRM deve conter entre 4 e 6 dígitos');
    }

    // Validar UF do CRM
    if (!dadosMedico.uf_crm || dadosMedico.uf_crm.length !== 2) {
      erros.push('UF do CRM deve ter 2 caracteres');
    }

    // Validar CPF se fornecido
    if (dadosMedico.cpf && !this.validarCPF(dadosMedico.cpf)) {
      erros.push('CPF inválido');
    }

    // Validar email se fornecido
    if (dadosMedico.email && !this.validarEmail(dadosMedico.email)) {
      erros.push('Email inválido');
    }

    // Validar telefone se fornecido
    if (dadosMedico.telefone && !this.validarTelefone(dadosMedico.telefone)) {
      erros.push('Telefone inválido');
    }

    return {
      valido: erros.length === 0,
      erros
    };
  }

  /**
   * Valida CPF
   */
  validarCPF(cpf) {
    if (!cpf) return false;
    
    // Remove caracteres não numéricos
    cpf = cpf.replace(/\D/g, '');
    
    // Verifica se tem 11 dígitos
    if (cpf.length !== 11) return false;
    
    // Verifica se todos os dígitos são iguais
    if (/^(\d)\1{10}$/.test(cpf)) return false;
    
    // Validação do algoritmo do CPF
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
    if (resto !== parseInt(cpf.charAt(10))) return false;
    
    return true;
  }

  /**
   * Valida email
   */
  validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  }

  /**
   * Valida telefone
   */
  validarTelefone(telefone) {
    if (!telefone) return false;
    
    // Remove caracteres não numéricos
    const numeros = telefone.replace(/\D/g, '');
    
    // Verifica se tem entre 10 e 11 dígitos
    return numeros.length >= 10 && numeros.length <= 11;
  }

  /**
   * Valida lote de médicos
   */
  async validarLoteMedicos(medicos) {
    const resultados = [];
    
    for (let i = 0; i < medicos.length; i++) {
      const medico = medicos[i];
      const validacao = await this.validarDadosBasicos(medico);
      
      resultados.push({
        linha: i + 1,
        medico,
        valido: validacao.valido,
        erros: validacao.erros
      });
    }
    
    return {
      total: medicos.length,
      validos: resultados.filter(r => r.valido).length,
      invalidos: resultados.filter(r => !r.valido).length,
      resultados
    };
  }

  /**
   * Normaliza dados do médico
   */
  normalizarDadosMedico(dadosMedico) {
    return {
      ...dadosMedico,
      nome: dadosMedico.nome?.trim(),
      crm: dadosMedico.crm?.replace(/\D/g, ''),
      uf_crm: dadosMedico.uf_crm?.toUpperCase(),
      cpf: dadosMedico.cpf?.replace(/\D/g, ''),
      email: dadosMedico.email?.toLowerCase().trim(),
      telefone: dadosMedico.telefone?.replace(/\D/g, '')
    };
  }
}

module.exports = ValidacaoMedicoService;