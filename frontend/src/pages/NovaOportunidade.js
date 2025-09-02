import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaSave, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import './NovaOportunidade.css';

// Lista completa de estados brasileiros (UF)
const LOCAL_ESTADOS = [
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

// Lista completa de especialidades médicas (LOCAL)
const LOCAL_ESPECIALIDADES = [
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
  { id: '35', nome: 'Medicina Preventiva e Social' },
  { id: '36', nome: 'Nefrologia' },
  { id: '37', nome: 'Neurocirurgia' },
  { id: '38', nome: 'Neurologia' },
  { id: '39', nome: 'Nutrologia' },
  { id: '40', nome: 'Oftalmologia' },
  { id: '41', nome: 'Oncologia Clínica' },
  { id: '42', nome: 'Ortopedia e Traumatologia' },
  { id: '43', nome: 'Otorrinolaringologia' },
  { id: '44', nome: 'Patologia' },
  { id: '45', nome: 'Patologia Clínica / Medicina Laboratorial' },
  { id: '46', nome: 'Pediatria' },
  { id: '47', nome: 'Pneumologia' },
  { id: '48', nome: 'Psiquiatria' },
  { id: '49', nome: 'Radiologia e Diagnóstico por Imagem' },
  { id: '50', nome: 'Radioterapia' },
  { id: '51', nome: 'Reumatologia' }
];

const NovaOportunidade = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [especialidades, setEspecialidades] = useState(LOCAL_ESPECIALIDADES);
  const [estados, setEstados] = useState(LOCAL_ESTADOS);
  const [cidades, setCidades] = useState([]);
  const [loadingCidades, setLoadingCidades] = useState(false);

  const [formData, setFormData] = useState({
    titulo: '',
    especialidade: '',
    cliente: '',
    local: {
      cidade: '',
      estado: '',
      endereco: ''
    },
    dataInicio: '',
    dataFim: '',
    cargaHoraria: '',
    remuneracao: '',
    descricao: '',
    requisitos: '',
    status: 'Aberta'
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        // Buscar clientes
        const clientesResponse = await axios.get('/api/clientes');
        setClientes(clientesResponse.data.clientes || []);

        // Buscar especialidades
        const especialidadesResponse = await axios.get('/api/especialidades');
        setEspecialidades(
          especialidadesResponse.data?.length ? especialidadesResponse.data : LOCAL_ESPECIALIDADES
        );

        // Estados carregados localmente via LOCAL_ESTADOS
      } catch (err) {
        setError('Erro ao carregar dados iniciais. Por favor, tente novamente.');
        console.error('Erro ao carregar dados iniciais:', err);
      }
    };

    fetchInitialData();
  }, []);

  useEffect(() => {
    const fetchCidades = async () => {
      if (!formData.local.estado) {
        setCidades([]);
        return;
      }

      setLoadingCidades(true);
      try {
        const response = await axios.get(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.local.estado}/municipios?orderBy=nome`);
        setCidades(response.data || []);
      } catch (err) {
        console.error('Erro ao carregar cidades:', err);
      } finally {
        setLoadingCidades(false);
      }
    };

    fetchCidades();
  }, [formData.local.estado]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/oportunidades', formData);
      navigate(`/oportunidades/${response.data._id}`);
    } catch (err) {
      const serverMessage = err.response?.data?.message;
      const serverDetail = err.response?.data?.error || err.message;
      const serverDetails = err.response?.data?.details;
      
      // Mensagem de erro mais amigável e detalhada
      if (serverDetail === 'ValidationError') {
        if (serverDetails) {
          setError(`Erro de validação: ${serverDetails}`);
        } else {
          setError('Erro de validação: Por favor, verifique se todos os campos obrigatórios foram preenchidos corretamente.');
        }
      } else if (serverMessage === 'Cliente inválido') {
        setError('Cliente inválido: Por favor, selecione um cliente válido.');
      } else if (serverDetail && serverDetail.includes('Cliente não encontrado')) {
        setError('Cliente não encontrado: Por favor, selecione um cliente válido.');
      } else if (err.response?.status === 400) {
        // Outros erros de validação
        const details = serverMessage ? `${serverMessage}: ${serverDetail}` : serverDetail;
        setError(`Erro de validação: ${details}`);
      } else {
        // Erros de servidor ou outros erros
        const details = serverMessage ? `${serverMessage}: ${serverDetail}` : serverDetail;
        setError(`Erro ao criar oportunidade: ${details}`);
      }
      
      console.error('Erro ao criar oportunidade:', err);
      setLoading(false);
    }
  };

  return (
    <div className="nova-oportunidade-container">
      <div className="nova-oportunidade-header">
        <div className="header-left">
          <button 
            className="btn-voltar" 
            onClick={() => navigate('/oportunidades')}
          >
            <FaArrowLeft /> Voltar
          </button>
          <h1>Nova Oportunidade</h1>
        </div>
      </div>

      {error && (
        <div className="error-container">
          <div className="error-content">
            <FaExclamationTriangle className="error-icon" />
            <p>{error}</p>
          </div>
          <button onClick={() => setError(null)}>
            <FaTimes /> Fechar
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="oportunidade-form">
        <div className="form-section">
          <h2>Informações Básicas</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="titulo">Título*</label>
              <input
                type="text"
                id="titulo"
                name="titulo"
                value={formData.titulo}
                onChange={handleChange}
                required
                placeholder="Ex: Médico Cardiologista para Hospital"
              />
            </div>

            <div className="form-group">
              <label htmlFor="especialidade">Especialidade*</label>
              <select
                id="especialidade"
                name="especialidade"
                value={formData.especialidade}
                onChange={handleChange}
                required
              >
                <option value="">Selecione uma especialidade</option>
                {especialidades.map((esp) => (
                  <option key={esp._id || esp} value={esp.nome || esp}>
                    {esp.nome || esp}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cliente">Cliente*</label>
              <select
                id="cliente"
                name="cliente"
                value={formData.cliente}
                onChange={handleChange}
                required
              >
                <option value="">Selecione um cliente</option>
                {clientes.map((cliente) => (
                  <option key={cliente._id} value={cliente._id}>
                    {cliente.nome}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="status">Status*</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="Aberta">Aberta</option>
                <option value="Em andamento">Em andamento</option>
                <option value="Preenchida">Preenchida</option>
                <option value="Cancelada">Cancelada</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Localização</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="local.estado">Estado*</label>
              <select
                id="local.estado"
                name="local.estado"
                value={formData.local.estado}
                onChange={handleChange}
                required
              >
                <option value="">Selecione um estado</option>
                {estados.map((estado) => (
                  <option key={estado.sigla || estado} value={estado.sigla || estado}>
                    {estado.nome || estado}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="local.cidade">Cidade*</label>
              <select
                id="local.cidade"
                name="local.cidade"
                value={formData.local.cidade}
                onChange={handleChange}
                required
                disabled={loadingCidades || !formData.local.estado}
              >
                <option value="">
                  {loadingCidades
                    ? 'Carregando cidades...'
                    : !formData.local.estado
                    ? 'Selecione um estado primeiro'
                    : 'Selecione uma cidade'}
                </option>
                {cidades.map((cidade) => (
                  <option key={cidade.nome || cidade} value={cidade.nome || cidade}>
                    {cidade.nome || cidade}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="local.endereco">Endereço</label>
            <input
              type="text"
              id="local.endereco"
              name="local.endereco"
              value={formData.local.endereco}
              onChange={handleChange}
              placeholder="Ex: Av. Principal, 1000 - Centro"
            />
          </div>
        </div>

        <div className="form-section">
          <h2>Período e Remuneração</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dataInicio">Data de Início*</label>
              <input
                type="date"
                id="dataInicio"
                name="dataInicio"
                value={formData.dataInicio}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="dataFim">Data de Término</label>
              <input
                type="date"
                id="dataFim"
                name="dataFim"
                value={formData.dataFim}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="cargaHoraria">Carga Horária*</label>
              <input
                type="text"
                id="cargaHoraria"
                name="cargaHoraria"
                value={formData.cargaHoraria}
                onChange={handleChange}
                required
                placeholder="Ex: 20h semanais"
              />
            </div>

            <div className="form-group">
              <label htmlFor="remuneracao">Remuneração*</label>
              <input
                type="text"
                id="remuneracao"
                name="remuneracao"
                value={formData.remuneracao}
                onChange={handleChange}
                required
                placeholder="Ex: R$ 15.000,00"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h2>Detalhes da Vaga</h2>
          <div className="form-group">
            <label htmlFor="descricao">Descrição*</label>
            <textarea
              id="descricao"
              name="descricao"
              value={formData.descricao}
              onChange={handleChange}
              required
              placeholder="Descreva detalhadamente a oportunidade..."
              rows="5"
            />
          </div>

          <div className="form-group">
            <label htmlFor="requisitos">Requisitos</label>
            <textarea
              id="requisitos"
              name="requisitos"
              value={formData.requisitos}
              onChange={handleChange}
              placeholder="Liste os requisitos necessários para a vaga..."
              rows="5"
            />
          </div>
        </div>

        <div className="form-actions">
          <button 
            type="button" 
            className="btn-cancelar" 
            onClick={() => navigate('/oportunidades')}
          >
            <FaTimes /> Cancelar
          </button>
          <button 
            type="submit" 
            className="btn-salvar" 
            disabled={loading}
          >
            <FaSave /> {loading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NovaOportunidade;