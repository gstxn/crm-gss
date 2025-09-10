const XLSX = require('xlsx');
const csv = require('csv-parser');
const { Readable } = require('stream');
const iconv = require('iconv-lite');

class PlanilhaMedicoService {
  /**
   * Processa arquivo de planilha (CSV ou XLSX) e retorna dados normalizados
   * @param {Buffer} buffer - Buffer do arquivo
   * @param {string} filename - Nome do arquivo
   * @param {string} mimeType - Tipo MIME do arquivo
   * @returns {Promise<Array>} Array de objetos com dados normalizados
   */
  async processarPlanilha(buffer, filename, mimeType) {
    try {
      const extensao = this.obterExtensao(filename);
      
      if (extensao === 'xlsx' || mimeType.includes('spreadsheet')) {
        return await this.processarXLSX(buffer);
      } else if (extensao === 'csv' || mimeType.includes('csv')) {
        return await this.processarCSV(buffer);
      } else {
        throw new Error('Formato de arquivo não suportado. Use .csv ou .xlsx');
      }
    } catch (error) {
      throw new Error(`Erro ao processar planilha: ${error.message}`);
    }
  }

  /**
   * Processa arquivo XLSX
   * @param {Buffer} buffer
   * @returns {Array} Dados da planilha
   */
  async processarXLSX(buffer) {
    try {
      const workbook = XLSX.read(buffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      
      if (!sheetName) {
        throw new Error('Planilha não contém abas');
      }

      const worksheet = workbook.Sheets[sheetName];
      const dados = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: false
      });

      if (dados.length === 0) {
        throw new Error('Planilha está vazia');
      }

      return this.processarDadosTabela(dados);
    } catch (error) {
      throw new Error(`Erro ao processar XLSX: ${error.message}`);
    }
  }

  /**
   * Processa arquivo CSV
   * @param {Buffer} buffer
   * @returns {Promise<Array>} Dados do CSV
   */
  async processarCSV(buffer) {
    try {
      // Detectar encoding
      const encoding = this.detectarEncoding(buffer);
      let csvText = iconv.decode(buffer, encoding);
      
      // Detectar separador
      const separador = this.detectarSeparador(csvText);
      
      return new Promise((resolve, reject) => {
        const resultados = [];
        const stream = Readable.from([csvText]);
        
        stream
          .pipe(csv({ 
            separator: separador,
            skipEmptyLines: true,
            headers: false
          }))
          .on('data', (data) => {
            const linha = Object.values(data).map(val => val?.toString().trim() || '');
            if (linha.some(cell => cell !== '')) {
              resultados.push(linha);
            }
          })
          .on('end', () => {
            if (resultados.length === 0) {
              reject(new Error('CSV está vazio'));
            } else {
              resolve(this.processarDadosTabela(resultados));
            }
          })
          .on('error', (error) => {
            reject(new Error(`Erro ao processar CSV: ${error.message}`));
          });
      });
    } catch (error) {
      throw new Error(`Erro ao processar CSV: ${error.message}`);
    }
  }

  /**
   * Processa dados tabulares (primeira linha como cabeçalho)
   * @param {Array} dados
   * @returns {Object} { cabecalhos, linhas, preview }
   */
  processarDadosTabela(dados) {
    if (dados.length < 2) {
      throw new Error('Planilha deve ter pelo menos cabeçalho e uma linha de dados');
    }

    const cabecalhos = dados[0].map(header => 
      header?.toString().trim() || `Coluna_${dados[0].indexOf(header) + 1}`
    );
    
    const linhas = dados.slice(1).map((linha, index) => {
      const obj = {};
      cabecalhos.forEach((header, colIndex) => {
        obj[header] = linha[colIndex]?.toString().trim() || '';
      });
      obj._numeroLinha = index + 2; // +2 porque começamos da linha 2 (após cabeçalho)
      return obj;
    });

    // Preview das primeiras 10 linhas
    const preview = linhas.slice(0, 10);

    return {
      cabecalhos,
      linhas,
      preview,
      totalLinhas: linhas.length
    };
  }

  /**
   * Detecta encoding do arquivo
   * @param {Buffer} buffer
   * @returns {string} Encoding detectado
   */
  detectarEncoding(buffer) {
    const sample = buffer.slice(0, 1024).toString('binary');
    
    // Verifica BOM UTF-8
    if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
      return 'utf8';
    }
    
    // Verifica caracteres especiais comuns em português
    if (sample.includes('ç') || sample.includes('ã') || sample.includes('õ')) {
      return 'utf8';
    }
    
    // Fallback para latin1 (comum em planilhas brasileiras)
    return 'latin1';
  }

  /**
   * Detecta separador do CSV
   * @param {string} csvText
   * @returns {string} Separador detectado
   */
  detectarSeparador(csvText) {
    const primeiraLinha = csvText.split('\n')[0];
    const separadores = [';', ',', '\t', '|'];
    
    let melhorSeparador = ',';
    let maiorContagem = 0;
    
    separadores.forEach(sep => {
      const contagem = (primeiraLinha.match(new RegExp(`\\${sep}`, 'g')) || []).length;
      if (contagem > maiorContagem) {
        maiorContagem = contagem;
        melhorSeparador = sep;
      }
    });
    
    return melhorSeparador;
  }

  /**
   * Obtém extensão do arquivo
   * @param {string} filename
   * @returns {string} Extensão em lowercase
   */
  obterExtensao(filename) {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  /**
   * Valida se o arquivo é suportado
   * @param {string} filename
   * @param {string} mimeType
   * @returns {boolean}
   */
  validarArquivo(filename, mimeType) {
    const extensao = this.obterExtensao(filename);
    const extensoesValidas = ['csv', 'xlsx'];
    const mimeTypesValidos = [
      'text/csv',
      'application/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    return extensoesValidas.includes(extensao) || 
           mimeTypesValidos.some(mime => mimeType.includes(mime));
  }

  /**
   * Gera sugestões de mapeamento baseado em similaridade de nomes
   * @param {Array} cabecalhos - Cabeçalhos da planilha
   * @returns {Object} Mapeamento sugerido
   */
  gerarSugestoesMapeamento(cabecalhos) {
    const camposMedico = {
      'nome': ['nome', 'name', 'medico', 'doutor', 'dr'],
      'email': ['email', 'e-mail', 'mail', 'correio'],
      'telefone': ['telefone', 'phone', 'tel', 'celular', 'fone'],
      'crm': ['crm', 'registro', 'numero_crm'],
      'uf_crm': ['uf_crm', 'uf crm', 'estado_crm', 'uf do crm', 'estado crm'],
      'rqe': ['rqe', 'registro qualificacao', 'qualificacao'],
      'cpf': ['cpf', 'documento', 'doc'],
      'cnpj': ['cnpj', 'empresa'],
      'especialidade_principal': ['especialidade', 'especialidade principal', 'area', 'specialty'],
      'subespecialidades': ['subespecialidades', 'sub especialidades', 'areas'],
      'cidade': ['cidade', 'city', 'municipio'],
      'uf': ['uf', 'estado', 'state'],
      'hospitais_vinculo': ['hospitais', 'hospital', 'vinculo', 'instituicoes'],
      'disponibilidade': ['disponibilidade', 'horario', 'plantao'],
      'valor_hora': ['valor', 'preco', 'hora', 'honorario'],
      'tags': ['tags', 'etiquetas', 'categorias'],
      'status': ['status', 'situacao', 'ativo']
    };

    const mapeamento = {};
    
    cabecalhos.forEach(cabecalho => {
      const cabecalhoLower = cabecalho.toLowerCase().trim();
      
      for (const [campo, sinonimos] of Object.entries(camposMedico)) {
        const encontrou = sinonimos.some(sinonimo => 
          cabecalhoLower.includes(sinonimo) || 
          sinonimo.includes(cabecalhoLower)
        );
        
        if (encontrou && !mapeamento[cabecalho]) {
          mapeamento[cabecalho] = campo;
          break;
        }
      }
    });
    
    return mapeamento;
  }

  /**
   * Valida estrutura mínima da planilha
   * @param {Array} cabecalhos
   * @param {Object} mapeamento
   * @returns {Object} { valido, erros }
   */
  validarEstrutura(cabecalhos, mapeamento) {
    const camposObrigatorios = ['nome', 'crm', 'uf_crm'];
    const erros = [];
    
    // Verifica se campos obrigatórios estão mapeados
    camposObrigatorios.forEach(campo => {
      const mapeado = Object.values(mapeamento).includes(campo);
      if (!mapeado) {
        erros.push(`Campo obrigatório '${campo}' não foi mapeado`);
      }
    });
    
    // Verifica se há pelo menos uma forma de deduplicação
    const formasDedup = ['crm', 'cpf', 'email'];
    const temDedup = formasDedup.some(campo => 
      Object.values(mapeamento).includes(campo)
    );
    
    if (!temDedup) {
      erros.push('É necessário mapear pelo menos um campo para deduplicação (CRM, CPF ou Email)');
    }
    
    return {
      valido: erros.length === 0,
      erros
    };
  }
}

module.exports = new PlanilhaMedicoService();