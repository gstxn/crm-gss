import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaSave, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import './NovaOportunidade.css'; // Reutilizando o mesmo CSS

const EditarOportunidade = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [clientes, setClientes] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [estados, setEstados] = useState([]);
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
    const fetchData = async () => {
      try {
        // Buscar dados da oportunidade
        const oportunidadeResponse = await axios.get(`/api/oportunidades/${id}`);
        const oportunidade = oportunidadeResponse.data;
        
        // Formatar datas para o formato esperado pelo input type="date"
        const formatDate = (dateString) => {
          if (!dateString) return '';
          const date = new Date(dateString);
          return date.toISOString().split('T')[0];
        };
        
        setFormData({
          ...oportunidade,
          dataInicio: formatDate(oportunidade.dataInicio),
          dataFim: formatDate(oportunidade.dataFim),
          // Garantir que cliente seja o ID e não o objeto completo
          cliente: oportunidade.cliente._id || oportunidade.cliente
        });

        // Buscar clientes
        const clientesResponse = await axios.get('/api/clientes');
        setClientes(clientesResponse.data.clientes || []);

        // Buscar especialidades
        const especialidadesResponse = await axios.get('/api/especialidades');
        setEspecialidades(especialidadesResponse.data || []);

        // Buscar estados
        const estadosResponse = await axios.get('/api/estados');
        setEstados(estadosResponse.data || []);

        // Buscar cidades do estado selecionado
        if (oportunidade.local && oportunidade.local.estado) {
          const cidadesResponse = await axios.get(`/api/cidades/${oportunidade.local.estado}`);
          setCidades(cidadesResponse.data || []);
        }

        setLoading(false);
      } catch (err) {
        setError('Erro ao carregar dados da oportunidade. Por favor, tente novamente.');
        console.error('Erro ao carregar dados:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchCidades = async () => {
      if (!formData.local.estado) {
        setCidades([]);
        return;
      }

      setLoadingCidades(true);
      try {
        const response = await axios.get(`/api/cidades/${formData.local.estado}`);
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
    setSaving(true);
    setError(null);

    try {
      await axios.put(`/api/oportunidades/${id}`, formData);
      setSaving(false);
      navigate(`/oportunidades/${id}`);
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
        setError(`Erro ao atualizar oportunidade: ${details}`);
      }
      
      console.error('Erro ao atualizar oportunidade:', err);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Carregando dados da oportunidade...</p>
      </div>
    );
  }

  return (
    <div className="nova-oportunidade-container">
      <div className="nova-oportunidade-header">
        <div className="header-left">
          <button 
            className="btn-voltar" 
            onClick={() => navigate(`/oportunidades/${id}`)}
          >
            <FaArrowLeft /> Voltar
          </button>
          <h1>Editar Oportunidade</h1>
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
                <option value="Em Andamento">Em Andamento</option>
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
            onClick={() => navigate(`/oportunidades/${id}`)}
          >
            <FaTimes /> Cancelar
          </button>
          <button 
            type="submit" 
            className="btn-salvar" 
            disabled={saving}
          >
            <FaSave /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarOportunidade;