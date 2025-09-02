import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaSave, FaTimes } from 'react-icons/fa';
import './NovoMedico.css'; // Reutilizando o CSS do NovoMedico

const EditarMedico = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    nome: '',
    crm: '',
    especialidade: '',
    email: '',
    telefone: '',
    cidade: '',
    estado: '',
    observacoes: '',
    disponibilidade: {
      diasDaSemana: [],
      periodos: [],
      disponivel: true
    }
  });
  
  const [especialidades, setEspecialidades] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [formErrors, setFormErrors] = useState({});

  const diasDaSemana = [
    { id: 'segunda', label: 'Segunda-feira' },
    { id: 'terca', label: 'Terça-feira' },
    { id: 'quarta', label: 'Quarta-feira' },
    { id: 'quinta', label: 'Quinta-feira' },
    { id: 'sexta', label: 'Sexta-feira' },
    { id: 'sabado', label: 'Sábado' },
    { id: 'domingo', label: 'Domingo' }
  ];

  const periodos = [
    { id: 'manha', label: 'Manhã' },
    { id: 'tarde', label: 'Tarde' },
    { id: 'noite', label: 'Noite' },
    { id: 'madrugada', label: 'Madrugada' }
  ];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [medicoRes, especialidadesRes, estadosRes] = await Promise.all([
          axios.get(`/api/medicos/${id}`),
          axios.get('/api/especialidades'),
          axios.get('/api/estados')
        ]);
        
        const medico = medicoRes.data;
        
        // Carregar cidades do estado do médico
        let cidadesRes = { data: [] };
        if (medico.estado) {
          cidadesRes = await axios.get(`/api/cidades/${medico.estado}`);
        }
        
        setFormData({
          nome: medico.nome || '',
          crm: medico.crm || '',
          especialidade: medico.especialidade?._id || '',
          email: medico.email || '',
          telefone: medico.telefone || '',
          cidade: medico.cidade?._id || '',
          estado: medico.estado || '',
          observacoes: medico.observacoes || '',
          disponibilidade: {
            diasDaSemana: medico.disponibilidade?.diasDaSemana || [],
            periodos: medico.disponibilidade?.periodos || [],
            disponivel: medico.disponibilidade?.disponivel !== false
          }
        });
        
        setEspecialidades(especialidadesRes.data);
        setEstados(estadosRes.data);
        setCidades(cidadesRes.data);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Não foi possível carregar os dados do médico. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  useEffect(() => {
    const fetchCidades = async () => {
      if (formData.estado) {
        try {
          const response = await axios.get(`/api/cidades/${formData.estado}`);
          setCidades(response.data);
        } catch (err) {
          console.error('Erro ao carregar cidades:', err);
          setCidades([]);
        }
      } else {
        setCidades([]);
      }
    };

    fetchCidades();
  }, [formData.estado]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpar erro do campo quando o usuário começa a digitar
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleDisponibilidadeChange = (e) => {
    const { name, value, checked, type } = e.target;
    
    if (name === 'disponivel') {
      setFormData(prev => ({
        ...prev,
        disponibilidade: {
          ...prev.disponibilidade,
          disponivel: checked
        }
      }));
    } else if (type === 'checkbox') {
      const arrayName = name.split('.')[1]; // diasDaSemana ou periodos
      const currentArray = [...formData.disponibilidade[arrayName]];
      
      if (checked) {
        currentArray.push(value);
      } else {
        const index = currentArray.indexOf(value);
        if (index > -1) {
          currentArray.splice(index, 1);
        }
      }
      
      setFormData(prev => ({
        ...prev,
        disponibilidade: {
          ...prev.disponibilidade,
          [arrayName]: currentArray
        }
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.nome.trim()) errors.nome = 'Nome é obrigatório';
    if (!formData.crm.trim()) errors.crm = 'CRM é obrigatório';
    if (!formData.especialidade) errors.especialidade = 'Especialidade é obrigatória';
    if (!formData.email.trim()) {
      errors.email = 'Email é obrigatório';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Email inválido';
    }
    if (!formData.telefone.trim()) errors.telefone = 'Telefone é obrigatório';
    if (!formData.estado) errors.estado = 'Estado é obrigatório';
    if (!formData.cidade) errors.cidade = 'Cidade é obrigatória';
    
    if (formData.disponibilidade.diasDaSemana.length === 0) {
      errors.diasDaSemana = 'Selecione pelo menos um dia da semana';
    }
    
    if (formData.disponibilidade.periodos.length === 0) {
      errors.periodos = 'Selecione pelo menos um período';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setSaving(true);
    setError(null);
    
    try {
      await axios.put(`/api/medicos/${id}`, formData);
      navigate(`/medicos/${id}`);
    } catch (err) {
      console.error('Erro ao atualizar médico:', err);
      if (err.response && err.response.data && err.response.data.message) {
        if (err.response.data.message.includes('CRM já cadastrado')) {
          setFormErrors(prev => ({
            ...prev,
            crm: 'CRM já cadastrado para outro médico'
          }));
        } else {
          setError(err.response.data.message);
        }
      } else {
        setError('Ocorreu um erro ao atualizar o médico. Por favor, tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="novo-medico-container">
        <div className="loading-container">
          <p>Carregando dados do médico...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="novo-medico-container">
      <div className="novo-medico-header">
        <Link to={`/medicos/${id}`} className="btn-voltar">
          <FaArrowLeft /> Voltar
        </Link>
        <h1>Editar Médico</h1>
      </div>
      
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="medico-form">
        <div className="form-section">
          <h2>Informações Básicas</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nome">Nome Completo*</label>
              <input
                type="text"
                id="nome"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                className={formErrors.nome ? 'error' : ''}
              />
              {formErrors.nome && <span className="error-text">{formErrors.nome}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="crm">CRM*</label>
              <input
                type="text"
                id="crm"
                name="crm"
                value={formData.crm}
                onChange={handleChange}
                className={formErrors.crm ? 'error' : ''}
              />
              {formErrors.crm && <span className="error-text">{formErrors.crm}</span>}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="especialidade">Especialidade*</label>
              <select
                id="especialidade"
                name="especialidade"
                value={formData.especialidade}
                onChange={handleChange}
                className={formErrors.especialidade ? 'error' : ''}
              >
                <option value="">Selecione uma especialidade</option>
                {especialidades.map(esp => (
                  <option key={esp._id} value={esp._id}>
                    {esp.nome}
                  </option>
                ))}
              </select>
              {formErrors.especialidade && <span className="error-text">{formErrors.especialidade}</span>}
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h2>Contato</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="email">Email*</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={formErrors.email ? 'error' : ''}
              />
              {formErrors.email && <span className="error-text">{formErrors.email}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="telefone">Telefone*</label>
              <input
                type="tel"
                id="telefone"
                name="telefone"
                value={formData.telefone}
                onChange={handleChange}
                className={formErrors.telefone ? 'error' : ''}
              />
              {formErrors.telefone && <span className="error-text">{formErrors.telefone}</span>}
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h2>Localização</h2>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="estado">Estado*</label>
              <select
                id="estado"
                name="estado"
                value={formData.estado}
                onChange={handleChange}
                className={formErrors.estado ? 'error' : ''}
              >
                <option value="">Selecione um estado</option>
                {estados.map(estado => (
                  <option key={estado.sigla} value={estado.sigla}>
                    {estado.nome}
                  </option>
                ))}
              </select>
              {formErrors.estado && <span className="error-text">{formErrors.estado}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="cidade">Cidade*</label>
              <select
                id="cidade"
                name="cidade"
                value={formData.cidade}
                onChange={handleChange}
                disabled={!formData.estado}
                className={formErrors.cidade ? 'error' : ''}
              >
                <option value="">Selecione uma cidade</option>
                {cidades.map(cidade => (
                  <option key={cidade._id} value={cidade._id}>
                    {cidade.nome}
                  </option>
                ))}
              </select>
              {formErrors.cidade && <span className="error-text">{formErrors.cidade}</span>}
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h2>Disponibilidade</h2>
          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="disponivel"
                checked={formData.disponibilidade.disponivel}
                onChange={handleDisponibilidadeChange}
              />
              Disponível para novas oportunidades
            </label>
          </div>
          
          <div className="form-group">
            <label>Dias da Semana*</label>
            <div className="checkbox-container">
              {diasDaSemana.map(dia => (
                <label key={dia.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    name="disponibilidade.diasDaSemana"
                    value={dia.id}
                    checked={formData.disponibilidade.diasDaSemana.includes(dia.id)}
                    onChange={handleDisponibilidadeChange}
                  />
                  {dia.label}
                </label>
              ))}
            </div>
            {formErrors.diasDaSemana && <span className="error-text">{formErrors.diasDaSemana}</span>}
          </div>
          
          <div className="form-group">
            <label>Períodos*</label>
            <div className="checkbox-container">
              {periodos.map(periodo => (
                <label key={periodo.id} className="checkbox-label">
                  <input
                    type="checkbox"
                    name="disponibilidade.periodos"
                    value={periodo.id}
                    checked={formData.disponibilidade.periodos.includes(periodo.id)}
                    onChange={handleDisponibilidadeChange}
                  />
                  {periodo.label}
                </label>
              ))}
            </div>
            {formErrors.periodos && <span className="error-text">{formErrors.periodos}</span>}
          </div>
        </div>
        
        <div className="form-section">
          <h2>Observações</h2>
          <div className="form-group">
            <textarea
              id="observacoes"
              name="observacoes"
              value={formData.observacoes}
              onChange={handleChange}
              rows="4"
              placeholder="Informações adicionais sobre o médico..."
            ></textarea>
          </div>
        </div>
        
        <div className="form-actions">
          <Link to={`/medicos/${id}`} className="btn-cancelar">
            <FaTimes /> Cancelar
          </Link>
          <button type="submit" className="btn-salvar" disabled={saving}>
            <FaSave /> {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarMedico;