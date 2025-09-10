import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import './NovoCliente.css'; // Reutilizando o CSS do NovoCliente

const EditarCliente = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [estados, setEstados] = useState([]);
  
  // Estado para armazenar os dados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    tipo: '',
    endereco: {
      rua: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: ''
    },
    contatos: [],
    observacoes: ''
  });
  
  // Carregar dados do cliente e lista de estados
  useEffect(() => {
    const carregarDados = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Carregar dados do cliente
        const response = await axios.get(`/api/clientes/${id}`);
        
        // Formatar os dados para o formulário
        setFormData({
          nome: response.data.nome || '',
          cnpj: response.data.cnpj || '',
          tipo: response.data.tipo || 'Hospital',
          endereco: {
            rua: response.data.endereco?.rua || '',
            numero: response.data.endereco?.numero || '',
            complemento: response.data.endereco?.complemento || '',
            bairro: response.data.endereco?.bairro || '',
            cidade: response.data.endereco?.cidade || '',
            estado: response.data.endereco?.estado || '',
            cep: response.data.endereco?.cep || ''
          },
          contatos: response.data.contatos?.length > 0 
            ? response.data.contatos 
            : [{
                nome: '',
                cargo: '',
                telefone: '',
                email: '',
                principal: true
              }],
          observacoes: response.data.observacoes || ''
        });
        
        // Lista de estados brasileiros
        const listaEstados = [
          'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
          'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
          'SP', 'SE', 'TO'
        ];
        setEstados(listaEstados);
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        setError('Não foi possível carregar os dados do cliente.');
      } finally {
        setLoading(false);
      }
    };
    
    carregarDados();
  }, [id]);
  
  // Função para lidar com mudanças nos campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Verificar se é um campo aninhado (endereco.campo)
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
  
  // Função para lidar com mudanças nos campos de contato
  const handleContatoChange = (index, e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;
    
    const updatedContatos = formData.contatos.map((contato, i) => {
      if (i === index) {
        return { ...contato, [name]: newValue };
      }
      // Se estiver marcando um contato como principal, desmarcar os outros
      if (name === 'principal' && newValue === true) {
        return { ...contato, principal: i === index };
      }
      return contato;
    });
    
    setFormData({
      ...formData,
      contatos: updatedContatos
    });
  };
  
  // Função para adicionar um novo contato
  const adicionarContato = () => {
    setFormData({
      ...formData,
      contatos: [
        ...formData.contatos,
        {
          nome: '',
          cargo: '',
          telefone: '',
          email: '',
          principal: false
        }
      ]
    });
  };
  
  // Função para remover um contato
  const removerContato = (index) => {
    // Não permitir remover se for o único contato
    if (formData.contatos.length === 1) {
      return;
    }
    
    const updatedContatos = formData.contatos.filter((_, i) => i !== index);
    
    // Se remover o contato principal, definir o primeiro como principal
    if (formData.contatos[index].principal && updatedContatos.length > 0) {
      updatedContatos[0].principal = true;
    }
    
    setFormData({
      ...formData,
      contatos: updatedContatos
    });
  };
  
  // Função para validar o formulário
  const validarFormulario = () => {
    // Validar campos obrigatórios
    if (!formData.nome) {
      setError('Nome do cliente é obrigatório');
      return false;
    }
    
    if (!formData.cnpj) {
      setError('CNPJ é obrigatório');
      return false;
    }
    
    if (!formData.tipo) {
      setError('Tipo de cliente é obrigatório');
      return false;
    }
    
    if (!formData.endereco.cidade) {
      setError('Cidade é obrigatória');
      return false;
    }
    
    if (!formData.endereco.estado) {
      setError('Estado é obrigatório');
      return false;
    }
    
    // Validar se pelo menos um contato tem nome
    if (!formData.contatos.some(contato => contato.nome)) {
      setError('Pelo menos um contato com nome é obrigatório');
      return false;
    }
    
    // Validar formato de email dos contatos
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    for (const contato of formData.contatos) {
      if (contato.email && !emailRegex.test(contato.email)) {
        setError(`Email inválido para o contato ${contato.nome || 'sem nome'}`);
        return false;
      }
    }
    
    return true;
  };
  
  // Função para enviar o formulário
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      
      await axios.put(`/api/clientes/${id}`, formData);
      
      // Redirecionar para a página de detalhes do cliente
      navigate(`/clientes/${id}`);
    } catch (err) {
      console.error('Erro ao atualizar cliente:', err);
      
      if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Não foi possível atualizar o cliente. Por favor, tente novamente.');
      }
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return <div className="loading-message">Carregando dados do cliente...</div>;
  }
  
  return (
    <div className="novo-cliente-container">
      <div className="novo-cliente-header">
        <button 
          className="btn-voltar" 
          onClick={() => navigate(`/clientes/${id}`)}
        >
          <FaArrowLeft /> Voltar
        </button>
        <h1>Editar Cliente</h1>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-section">
          <h2>Informações Básicas</h2>
          
          <div className="form-group">
            <label htmlFor="nome">Nome *</label>
            <input
              type="text"
              id="nome"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="cnpj">CNPJ *</label>
            <input
              type="text"
              id="cnpj"
              name="cnpj"
              value={formData.cnpj}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="tipo">Tipo *</label>
            <select
              id="tipo"
              name="tipo"
              value={formData.tipo}
              onChange={handleChange}
              required
            >
              <option value="Hospital">Hospital</option>
              <option value="Clínica">Clínica</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
        </div>
        
        <div className="form-section">
          <h2>Endereço</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="endereco.rua">Rua</label>
              <input
                type="text"
                id="endereco.rua"
                name="endereco.rua"
                value={formData.endereco.rua}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group small">
              <label htmlFor="endereco.numero">Número</label>
              <input
                type="text"
                id="endereco.numero"
                name="endereco.numero"
                value={formData.endereco.numero}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="endereco.complemento">Complemento</label>
              <input
                type="text"
                id="endereco.complemento"
                name="endereco.complemento"
                value={formData.endereco.complemento}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="endereco.bairro">Bairro</label>
              <input
                type="text"
                id="endereco.bairro"
                name="endereco.bairro"
                value={formData.endereco.bairro}
                onChange={handleChange}
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="endereco.estado">Estado *</label>
              <select
                id="endereco.estado"
                name="endereco.estado"
                value={formData.endereco.estado}
                onChange={handleChange}
                required
              >
                <option value="">Selecione um estado</option>
                {estados.map(estado => (
                  <option key={estado} value={estado}>{estado}</option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label htmlFor="endereco.cidade">Cidade *</label>
              <input
                type="text"
                id="endereco.cidade"
                name="endereco.cidade"
                value={formData.endereco.cidade}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="form-group small">
              <label htmlFor="endereco.cep">CEP</label>
              <input
                type="text"
                id="endereco.cep"
                name="endereco.cep"
                value={formData.endereco.cep}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
        
        <div className="form-section">
          <h2>Contatos</h2>
          
          {formData.contatos.map((contato, index) => (
            <div key={index} className="contato-container">
              <div className="contato-header">
                <h3>Contato {index + 1}</h3>
                {formData.contatos.length > 1 && (
                  <button 
                    type="button" 
                    className="btn-remover-contato"
                    onClick={() => removerContato(index)}
                  >
                    Remover
                  </button>
                )}
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={`contato-nome-${index}`}>Nome</label>
                  <input
                    type="text"
                    id={`contato-nome-${index}`}
                    name="nome"
                    value={contato.nome || ''}
                    onChange={(e) => handleContatoChange(index, e)}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor={`contato-cargo-${index}`}>Cargo</label>
                  <input
                    type="text"
                    id={`contato-cargo-${index}`}
                    name="cargo"
                    value={contato.cargo || ''}
                    onChange={(e) => handleContatoChange(index, e)}
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor={`contato-telefone-${index}`}>Telefone</label>
                  <input
                    type="text"
                    id={`contato-telefone-${index}`}
                    name="telefone"
                    value={contato.telefone || ''}
                    onChange={(e) => handleContatoChange(index, e)}
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor={`contato-email-${index}`}>Email</label>
                  <input
                    type="email"
                    id={`contato-email-${index}`}
                    name="email"
                    value={contato.email || ''}
                    onChange={(e) => handleContatoChange(index, e)}
                  />
                </div>
              </div>
              
              <div className="form-group checkbox">
                <input
                  type="checkbox"
                  id={`contato-principal-${index}`}
                  name="principal"
                  checked={contato.principal || false}
                  onChange={(e) => handleContatoChange(index, e)}
                />
                <label htmlFor={`contato-principal-${index}`}>Contato Principal</label>
              </div>
            </div>
          ))}
          
          <button 
            type="button" 
            className="btn-adicionar-contato"
            onClick={adicionarContato}
          >
            Adicionar Contato
          </button>
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
              placeholder="Observações adicionais sobre o cliente..."
            ></textarea>
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="button" 
            className="btn-cancelar"
            onClick={() => navigate(`/clientes/${id}`)}
            disabled={saving}
          >
            Cancelar
          </button>
          
          <button 
            type="submit" 
            className="btn-salvar"
            disabled={saving}
          >
            {saving ? 'Salvando...' : (
              <>
                <FaSave /> Salvar
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditarCliente;