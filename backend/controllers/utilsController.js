// Lista completa de especialidades médicas
const especialidades = [
  { id: '1', nome: 'Alergia e Imunologia' },
  { id: '2', nome: 'Anestesiologia' },
  { id: '3', nome: 'Angiologia' },
  { id: '4', nome: 'Cardiologia' },
  { id: '5', nome: 'Cirurgia Cardiovascular' },
  { id: '6', nome: 'Cirurgia da Mão' },
  { id: '7', nome: 'Cirurgia de Cabeça e Pescoço' },
  { id: '8', nome: 'Cirurgia do Aparelho Digestivo' },
  { id: '9', nome: 'Cirurgia Geral' },
  { id: '10', nome: 'Cirurgia Oncológica' },
  { id: '11', nome: 'Cirurgia Pediátrica' },
  { id: '12', nome: 'Cirurgia Plástica' },
  { id: '13', nome: 'Cirurgia Torácica' },
  { id: '14', nome: 'Cirurgia Vascular' },
  { id: '15', nome: 'Clínica Médica' },
  { id: '16', nome: 'Coloproctologia' },
  { id: '17', nome: 'Dermatologia' },
  { id: '18', nome: 'Endocrinologia e Metabologia' },
  { id: '19', nome: 'Endoscopia' },
  { id: '20', nome: 'Gastroenterologia' },
  { id: '21', nome: 'Genética Médica' },
  { id: '22', nome: 'Geriatria' },
  { id: '23', nome: 'Ginecologia e Obstetrícia' },
  { id: '24', nome: 'Hematologia e Hemoterapia' },
  { id: '25', nome: 'Homeopatia' },
  { id: '26', nome: 'Infectologia' },
  { id: '27', nome: 'Medicina de Emergência' },
  { id: '28', nome: 'Medicina de Família e Comunidade' },
  { id: '29', nome: 'Medicina do Trabalho' },
  { id: '30', nome: 'Medicina Esportiva' },
  { id: '31', nome: 'Medicina Física e Reabilitação' },
  { id: '32', nome: 'Medicina Intensiva' },
  { id: '33', nome: 'Medicina Legal e Perícia Médica' },
  { id: '34', nome: 'Medicina Nuclear' },
  { id: '35', nome: 'Nefrologia' },
  { id: '36', nome: 'Neurocirurgia' },
  { id: '37', nome: 'Neurologia' },
  { id: '38', nome: 'Nutrologia' },
  { id: '39', nome: 'Oftalmologia' },
  { id: '40', nome: 'Oncologia Clínica' },
  { id: '41', nome: 'Ortopedia e Traumatologia' },
  { id: '42', nome: 'Otorrinolaringologia' },
  { id: '43', nome: 'Patologia' },
  { id: '44', nome: 'Patologia Clínica / Medicina Laboratorial' },
  { id: '45', nome: 'Pediatria' },
  { id: '46', nome: 'Pneumologia' },
  { id: '47', nome: 'Psiquiatria' },
  { id: '48', nome: 'Radiologia e Diagnóstico por Imagem' },
  { id: '49', nome: 'Radioterapia' },
  { id: '50', nome: 'Reumatologia' },
  { id: '51', nome: 'Urologia' }
];

// Lista completa de estados brasileiros
const estados = [
  { sigla: 'AC', nome: 'Acre' },
  { sigla: 'AL', nome: 'Alagoas' },
  { sigla: 'AP', nome: 'Amapá' },
  { sigla: 'AM', nome: 'Amazonas' },
  { sigla: 'BA', nome: 'Bahia' },
  { sigla: 'CE', nome: 'Ceará' },
  { sigla: 'DF', nome: 'Distrito Federal' },
  { sigla: 'ES', nome: 'Espírito Santo' },
  { sigla: 'GO', nome: 'Goiás' },
  { sigla: 'MA', nome: 'Maranhão' },
  { sigla: 'MT', nome: 'Mato Grosso' },
  { sigla: 'MS', nome: 'Mato Grosso do Sul' },
  { sigla: 'MG', nome: 'Minas Gerais' },
  { sigla: 'PA', nome: 'Pará' },
  { sigla: 'PB', nome: 'Paraíba' },
  { sigla: 'PR', nome: 'Paraná' },
  { sigla: 'PE', nome: 'Pernambuco' },
  { sigla: 'PI', nome: 'Piauí' },
  { sigla: 'RJ', nome: 'Rio de Janeiro' },
  { sigla: 'RN', nome: 'Rio Grande do Norte' },
  { sigla: 'RS', nome: 'Rio Grande do Sul' },
  { sigla: 'RO', nome: 'Rondônia' },
  { sigla: 'RR', nome: 'Roraima' },
  { sigla: 'SC', nome: 'Santa Catarina' },
  { sigla: 'SP', nome: 'São Paulo' },
  { sigla: 'SE', nome: 'Sergipe' },
  { sigla: 'TO', nome: 'Tocantins' },
];

// Mapa de cidades por estado (simplificado para alguns estados)
const cidadesPorEstado = {
  'SP': [
    { id: '1', nome: 'São Paulo' },
    { id: '2', nome: 'Campinas' },
    { id: '3', nome: 'Santos' },
    { id: '4', nome: 'Ribeirão Preto' },
    { id: '5', nome: 'São José dos Campos' }
  ],
  'RJ': [
    { id: '6', nome: 'Rio de Janeiro' },
    { id: '7', nome: 'Niterói' },
    { id: '8', nome: 'Petrópolis' },
    { id: '9', nome: 'Volta Redonda' },
    { id: '10', nome: 'Duque de Caxias' }
  ],
  'MG': [
    { id: '11', nome: 'Belo Horizonte' },
    { id: '12', nome: 'Uberlândia' },
    { id: '13', nome: 'Contagem' },
    { id: '14', nome: 'Juiz de Fora' },
    { id: '15', nome: 'Betim' }
  ],
  'RS': [
    { id: '16', nome: 'Porto Alegre' },
    { id: '17', nome: 'Caxias do Sul' },
    { id: '18', nome: 'Pelotas' },
    { id: '19', nome: 'Canoas' },
    { id: '20', nome: 'Santa Maria' }
  ],
  'PR': [
    { id: '21', nome: 'Curitiba' },
    { id: '22', nome: 'Londrina' },
    { id: '23', nome: 'Maringá' },
    { id: '24', nome: 'Ponta Grossa' },
    { id: '25', nome: 'Cascavel' }
  ],
  'SC': [
    { id: '26', nome: 'Florianópolis' },
    { id: '27', nome: 'Joinville' },
    { id: '28', nome: 'Blumenau' },
    { id: '29', nome: 'São José' },
    { id: '30', nome: 'Criciúma' }
  ]
};

// @desc    Obter todas as especialidades médicas
// @route   GET /api/utils/especialidades
// @access  Public
const getEspecialidades = (req, res) => {
  try {
    res.status(200).json(especialidades);
  } catch (error) {
    console.error('Erro ao buscar especialidades:', error);
    res.status(500).json({ message: 'Erro ao buscar especialidades', error: error.message });
  }
};

// @desc    Obter todos os estados brasileiros
// @route   GET /api/utils/estados
// @access  Public
const getEstados = (req, res) => {
  try {
    res.status(200).json(estados);
  } catch (error) {
    console.error('Erro ao buscar estados:', error);
    res.status(500).json({ message: 'Erro ao buscar estados', error: error.message });
  }
};

// @desc    Obter cidades por estado
// @route   GET /api/utils/cidades/:estado
// @access  Public
const getCidadesPorEstado = (req, res) => {
  try {
    const { estado } = req.params;
    
    // Verificar se o estado existe no mapa de cidades
    if (cidadesPorEstado[estado]) {
      res.status(200).json(cidadesPorEstado[estado]);
    } else {
      // Se não tiver cidades cadastradas para o estado, retorna array vazio
      res.status(200).json([]);
    }
  } catch (error) {
    console.error('Erro ao buscar cidades:', error);
    res.status(500).json({ message: 'Erro ao buscar cidades', error: error.message });
  }
};

module.exports = {
  getEspecialidades,
  getEstados,
  getCidadesPorEstado
};