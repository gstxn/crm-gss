import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { 
  FaArrowLeft, FaEdit, FaTrash, FaPlus, 
  FaBuilding, FaMapMarkerAlt, FaPhone, FaEnvelope, 
  FaUserTie, FaFileAlt, FaHistory, FaExclamationTriangle 
} from 'react-icons/fa';
import './ClienteDetalhes.css';

const ClienteDetalhes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [cliente, setCliente] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('detalhes');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [historicoForm, setHistoricoForm] = useState({
    tipo: 'Contato',
    descricao: ''
  });
  
  // Carregar dados do cliente
  useEffect(() => {
    const carregarCliente = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`/api/clientes/${id}`);
        setCliente(response.data);
      } catch (err) {
        console.error('Erro ao carregar cliente:', err);
        setError('Não foi possível carregar os dados do cliente.');
      } finally {
        setLoading(false);
      }
    };
    
    carregarCliente();
  }, [id]);
  
  // Função para excluir cliente
  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      
      await axios.delete(`/api/clientes/${id}`);
      
      // Redirecionar para a lista de clientes
      navigate('/clientes', { 
        state: { message: 'Cliente excluído com sucesso' } 
      });
    } catch (err) {
      console.error('Erro ao excluir cliente:', err);
      setError('Não foi possível excluir o cliente.');
      setShowDeleteModal(false);
    } finally {
      setDeleteLoading(false);
    }
  };
  
  // Função para adicionar histórico
  const handleAddHistorico = async (e) => {
    e.preventDefault();
    
    if (!historicoForm.descricao) {
      setError('A descrição é obrigatória');
      return;
    }
    
    try {
      const response = await axios.post(`/api/clientes/${id}/historico`, historicoForm);
      
      // Atualizar o cliente com o novo histórico
      setCliente({
        ...cliente,
        historico: [...cliente.historico, response.data.historicoItem]
      });
      
      // Limpar o formulário
      setHistoricoForm({
        tipo: 'Contato',
        descricao: ''
      });
    } catch (err) {
      console.error('Erro ao adicionar histórico:', err);
      setError('Não foi possível adicionar o histórico.');
    }
  };
  
  // Função para formatar data
  const formatarData = (data) => {
    if (!data) return '';
    return new Date(data).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  if (loading) {
    return <div className="loading-message">Carregando dados do cliente...</div>;
  }
  
  if (error) {
    return (
      <div className="error-container">
        <div className="error-message">{error}</div>
        <button 
          className="btn-voltar" 
          onClick={() => navigate('/clientes')}
        >
          <FaArrowLeft /> Voltar para Clientes
        </button>
      </div>
    );
  }
  
  if (!cliente) {
    return (
      <div className="error-container">
        <div className="error-message">Cliente não encontrado</div>
        <button 
          className="btn-voltar" 
          onClick={() => navigate('/clientes')}
        >
          <FaArrowLeft /> Voltar para Clientes
        </button>
      </div>
    );
  }
  
  return (
    <div className="cliente-detalhes-container">
      <div className="cliente-detalhes-header">
        <div className="header-left">
          <button 
            className="btn-voltar" 
            onClick={() => navigate('/clientes')}
          >
            <FaArrowLeft /> Voltar
          </button>
          <h1>{cliente.nome}</h1>
          <span className="cliente-tipo">{cliente.tipo}</span>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn-editar"
            onClick={() => navigate(`/clientes/${id}/editar`)}
          >
            <FaEdit /> Editar
          </button>
          
          <button 
            className="btn-excluir"
            onClick={() => setShowDeleteModal(true)}
          >
            <FaTrash /> Excluir
          </button>
        </div>
      </div>
      
      <div className="tabs">
        <button 
          className={activeTab === 'detalhes' ? 'active' : ''}
          onClick={() => setActiveTab('detalhes')}
        >
          <FaBuilding /> Detalhes
        </button>
        
        <button 
          className={activeTab === 'oportunidades' ? 'active' : ''}
          onClick={() => setActiveTab('oportunidades')}
        >
          <FaFileAlt /> Oportunidades
        </button>
        
        <button 
          className={activeTab === 'historico' ? 'active' : ''}
          onClick={() => setActiveTab('historico')}
        >
          <FaHistory /> Histórico
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'detalhes' && (
          <div className="detalhes-tab">
            <div className="info-card">
              <h2>Informações Básicas</h2>
              <div className="info-row">
                <div className="info-label">Nome:</div>
                <div className="info-value">{cliente.nome}</div>
              </div>
              
              <div className="info-row">
                <div className="info-label">CNPJ:</div>
                <div className="info-value">{cliente.cnpj}</div>
              </div>
              
              <div className="info-row">
                <div className="info-label">Tipo:</div>
                <div className="info-value">{cliente.tipo}</div>
              </div>
            </div>
            
            <div className="info-card">
              <h2>Endereço</h2>
              <div className="info-row">
                <div className="info-label">Endereço Completo:</div>
                <div className="info-value">
                  {cliente.endereco.rua && `${cliente.endereco.rua}, `}
                  {cliente.endereco.numero && `${cliente.endereco.numero}`}
                  {cliente.endereco.complemento && `, ${cliente.endereco.complemento}`}
                  {cliente.endereco.bairro && `, ${cliente.endereco.bairro}`}
                </div>
              </div>
              
              <div className="info-row">
                <div className="info-label">Cidade/Estado:</div>
                <div className="info-value">
                  <FaMapMarkerAlt /> {cliente.endereco.cidade}/{cliente.endereco.estado}
                </div>
              </div>
              
              {cliente.endereco.cep && (
                <div className="info-row">
                  <div className="info-label">CEP:</div>
                  <div className="info-value">{cliente.endereco.cep}</div>
                </div>
              )}
            </div>
            
            <div className="info-card">
              <h2>Contatos</h2>
              {cliente.contatos && cliente.contatos.length > 0 ? (
                cliente.contatos.map((contato, index) => (
                  <div key={index} className="contato-item">
                    <div className="contato-header">
                      <h3>{contato.nome}</h3>
                      {contato.principal && <span className="tag-principal">Principal</span>}
                    </div>
                    
                    {contato.cargo && (
                      <div className="contato-info">
                        <FaUserTie /> {contato.cargo}
                      </div>
                    )}
                    
                    {contato.telefone && (
                      <div className="contato-info">
                        <FaPhone /> {contato.telefone}
                      </div>
                    )}
                    
                    {contato.email && (
                      <div className="contato-info">
                        <FaEnvelope /> {contato.email}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-message">Nenhum contato cadastrado</div>
              )}
            </div>
            
            {cliente.observacoes && (
              <div className="info-card">
                <h2>Observações</h2>
                <div className="observacoes">{cliente.observacoes}</div>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'oportunidades' && (
          <div className="oportunidades-tab">
            <div className="tab-header">
              <h2>Oportunidades</h2>
              <Link to={`/oportunidades/nova?cliente=${cliente._id}`} className="btn-nova-oportunidade">
                <FaPlus /> Nova Oportunidade
              </Link>
            </div>
            
            {cliente.oportunidades && cliente.oportunidades.length > 0 ? (
              <div className="oportunidades-list">
                {cliente.oportunidades.map(oportunidade => (
                  <Link 
                    key={oportunidade._id} 
                    to={`/oportunidades/${oportunidade._id}`}
                    className="oportunidade-card"
                  >
                    <div className="oportunidade-titulo">{oportunidade.titulo}</div>
                    <div className="oportunidade-info">
                      <div className={`oportunidade-status status-${oportunidade.status.toLowerCase()}`}>
                        {oportunidade.status}
                      </div>
                      <div className="oportunidade-valor">
                        {new Intl.NumberFormat('pt-BR', { 
                          style: 'currency', 
                          currency: 'BRL' 
                        }).format(oportunidade.valor)}
                      </div>
                    </div>
                    <div className="oportunidade-data">
                      Fechamento previsto: {formatarData(oportunidade.dataFechamentoPrevista)}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-message">
                Nenhuma oportunidade cadastrada para este cliente.
                <Link to={`/oportunidades/nova?cliente=${cliente._id}`} className="link-nova-oportunidade">
                  Criar nova oportunidade
                </Link>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'historico' && (
          <div className="historico-tab">
            <div className="tab-header">
              <h2>Histórico</h2>
            </div>
            
            <div className="adicionar-historico">
              <h3>Adicionar Registro</h3>
              <form onSubmit={handleAddHistorico}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="tipo">Tipo</label>
                    <select
                      id="tipo"
                      value={historicoForm.tipo}
                      onChange={(e) => setHistoricoForm({...historicoForm, tipo: e.target.value})}
                    >
                      <option value="Contato">Contato</option>
                      <option value="Reunião">Reunião</option>
                      <option value="Proposta">Proposta</option>
                      <option value="Visita">Visita</option>
                      <option value="Outro">Outro</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-group">
                  <label htmlFor="descricao">Descrição</label>
                  <textarea
                    id="descricao"
                    value={historicoForm.descricao}
                    onChange={(e) => setHistoricoForm({...historicoForm, descricao: e.target.value})}
                    rows="3"
                    required
                  ></textarea>
                </div>
                
                <button type="submit" className="btn-adicionar">
                  <FaPlus /> Adicionar
                </button>
              </form>
            </div>
            
            <div className="historico-timeline">
              {cliente.historico && cliente.historico.length > 0 ? (
                cliente.historico.slice().reverse().map((item, index) => (
                  <div key={index} className="historico-item">
                    <div className="historico-data">{formatarData(item.data)}</div>
                    <div className="historico-conteudo">
                      <div className="historico-tipo">{item.tipo}</div>
                      <div className="historico-descricao">{item.descricao}</div>
                      {item.usuario && (
                        <div className="historico-usuario">
                          Por: {item.usuario.nome || 'Usuário'}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-message">Nenhum registro no histórico</div>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Modal de confirmação de exclusão */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <FaExclamationTriangle className="warning-icon" />
              <h2>Confirmar Exclusão</h2>
            </div>
            
            <div className="modal-body">
              <p>Tem certeza que deseja excluir o cliente <strong>{cliente.nome}</strong>?</p>
              <p className="warning-text">Esta ação não poderá ser desfeita.</p>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn-cancelar"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
              >
                Cancelar
              </button>
              
              <button 
                className="btn-confirmar"
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClienteDetalhes;