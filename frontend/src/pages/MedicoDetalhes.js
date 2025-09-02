import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  FaArrowLeft, FaEdit, FaTrash, FaFilePdf, FaFileUpload, 
  FaPlus, FaDownload, FaEye, FaCalendarAlt, FaMapMarkerAlt, 
  FaEnvelope, FaPhone, FaUserMd, FaIdCard, FaHistory
} from 'react-icons/fa';
import './MedicoDetalhes.css';

const MedicoDetalhes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [medico, setMedico] = useState(null);
  const [activeTab, setActiveTab] = useState('detalhes');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [documentFile, setDocumentFile] = useState(null);
  const [documentName, setDocumentName] = useState('');
  const [documentType, setDocumentType] = useState('curriculo');
  const [documentError, setDocumentError] = useState(null);
  const [historicoTexto, setHistoricoTexto] = useState('');
  const [addingHistorico, setAddingHistorico] = useState(false);

  const documentTypes = [
    { id: 'curriculo', label: 'Currículo' },
    { id: 'diploma', label: 'Diploma' },
    { id: 'crm', label: 'Carteira do CRM' },
    { id: 'especializacao', label: 'Certificado de Especialização' },
    { id: 'outro', label: 'Outro Documento' }
  ];

  useEffect(() => {
    const fetchMedico = async () => {
      try {
        const response = await axios.get(`/api/medicos/${id}`);
        setMedico(response.data);
      } catch (err) {
        console.error('Erro ao buscar dados do médico:', err);
        setError('Não foi possível carregar os dados do médico. Por favor, tente novamente.');
      } finally {
        setLoading(false);
      }
    };

    fetchMedico();
  }, [id]);

  const handleDeleteConfirm = async () => {
    setLoading(true);
    try {
      await axios.delete(`/api/medicos/${id}`);
      navigate('/medicos');
    } catch (err) {
      console.error('Erro ao excluir médico:', err);
      setError('Não foi possível excluir o médico. Por favor, tente novamente.');
      setShowDeleteModal(false);
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setDocumentFile(file);
      if (!documentName) {
        setDocumentName(file.name.split('.')[0]);
      }
    }
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    
    if (!documentFile) {
      setDocumentError('Selecione um arquivo para upload');
      return;
    }
    
    if (!documentName.trim()) {
      setDocumentError('Digite um nome para o documento');
      return;
    }
    
    setUploadingDocument(true);
    setDocumentError(null);
    
    const formData = new FormData();
    formData.append('documento', documentFile);
    formData.append('nome', documentName);
    formData.append('tipo', documentType);
    
    try {
      const response = await axios.post(`/api/medicos/${id}/documentos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setMedico(response.data);
      setDocumentFile(null);
      setDocumentName('');
      setDocumentType('curriculo');
      
      // Fechar o formulário de upload
      document.getElementById('uploadForm').classList.remove('show');
    } catch (err) {
      console.error('Erro ao fazer upload do documento:', err);
      setDocumentError('Não foi possível fazer o upload do documento. Por favor, tente novamente.');
    } finally {
      setUploadingDocument(false);
    }
  };

  const handleAddHistorico = async (e) => {
    e.preventDefault();
    
    if (!historicoTexto.trim()) {
      return;
    }
    
    setAddingHistorico(true);
    
    try {
      const response = await axios.post(`/api/medicos/${id}/historico`, {
        texto: historicoTexto
      });
      
      setMedico(response.data);
      setHistoricoTexto('');
      
      // Fechar o formulário de histórico
      document.getElementById('historicoForm').classList.remove('show');
    } catch (err) {
      console.error('Erro ao adicionar histórico:', err);
      setError('Não foi possível adicionar o histórico. Por favor, tente novamente.');
    } finally {
      setAddingHistorico(false);
    }
  };

  const toggleUploadForm = () => {
    const form = document.getElementById('uploadForm');
    form.classList.toggle('show');
  };

  const toggleHistoricoForm = () => {
    const form = document.getElementById('historicoForm');
    form.classList.toggle('show');
  };

  if (loading) {
    return (
      <div className="medico-detalhes-container">
        <div className="loading-container">
          <p>Carregando dados do médico...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="medico-detalhes-container">
        <div className="error-container">
          <p>{error}</p>
          <button onClick={() => navigate('/medicos')}>Voltar para a lista de médicos</button>
        </div>
      </div>
    );
  }

  if (!medico) {
    return (
      <div className="medico-detalhes-container">
        <div className="error-container">
          <p>Médico não encontrado.</p>
          <button onClick={() => navigate('/medicos')}>Voltar para a lista de médicos</button>
        </div>
      </div>
    );
  }

  const formatarDisponibilidade = () => {
    const diasMap = {
      segunda: 'Segunda-feira',
      terca: 'Terça-feira',
      quarta: 'Quarta-feira',
      quinta: 'Quinta-feira',
      sexta: 'Sexta-feira',
      sabado: 'Sábado',
      domingo: 'Domingo'
    };
    
    const periodosMap = {
      manha: 'Manhã',
      tarde: 'Tarde',
      noite: 'Noite',
      madrugada: 'Madrugada'
    };
    
    const dias = medico.disponibilidade.diasDaSemana
      .map(dia => diasMap[dia] || dia)
      .join(', ');
      
    const periodos = medico.disponibilidade.periodos
      .map(periodo => periodosMap[periodo] || periodo)
      .join(', ');
      
    return `${dias} | ${periodos}`;
  };

  return (
    <div className="medico-detalhes-container">
      <div className="medico-detalhes-header">
        <div className="header-left">
          <Link to="/medicos" className="btn-voltar">
            <FaArrowLeft /> Voltar
          </Link>
          <h1>{medico.nome}</h1>
          <span className="medico-crm">{medico.crm}</span>
        </div>
        
        <div className="header-actions">
          <Link to={`/medicos/${id}/editar`} className="btn-editar">
            <FaEdit /> Editar
          </Link>
          <button 
            className="btn-excluir" 
            onClick={() => setShowDeleteModal(true)}
          >
            <FaTrash /> Excluir
          </button>
        </div>
      </div>
      
      <div className="medico-tabs">
        <button 
          className={activeTab === 'detalhes' ? 'active' : ''}
          onClick={() => setActiveTab('detalhes')}
        >
          Detalhes
        </button>
        <button 
          className={activeTab === 'documentos' ? 'active' : ''}
          onClick={() => setActiveTab('documentos')}
        >
          Documentos
        </button>
        <button 
          className={activeTab === 'oportunidades' ? 'active' : ''}
          onClick={() => setActiveTab('oportunidades')}
        >
          Oportunidades
        </button>
        <button 
          className={activeTab === 'historico' ? 'active' : ''}
          onClick={() => setActiveTab('historico')}
        >
          Histórico
        </button>
      </div>
      
      <div className="tab-content">
        {activeTab === 'detalhes' && (
          <div className="detalhes-tab">
            <div className="info-card">
              <div className="info-section">
                <h3>Informações Básicas</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label"><FaUserMd /> Especialidade</span>
                    <span className="info-value">{medico.especialidade?.nome || 'Não informada'}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label"><FaIdCard /> CRM</span>
                    <span className="info-value">{medico.crm}</span>
                  </div>
                </div>
              </div>
              
              <div className="info-section">
                <h3>Contato</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label"><FaEnvelope /> Email</span>
                    <span className="info-value">{medico.email}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label"><FaPhone /> Telefone</span>
                    <span className="info-value">{medico.telefone}</span>
                  </div>
                </div>
              </div>
              
              <div className="info-section">
                <h3>Localização</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label"><FaMapMarkerAlt /> Cidade/Estado</span>
                    <span className="info-value">
                      {medico.cidade?.nome || 'Não informada'}, {medico.estado || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="info-section">
                <h3>Disponibilidade</h3>
                <div className="info-grid">
                  <div className="info-item">
                    <span className="info-label"><FaCalendarAlt /> Disponível para oportunidades</span>
                    <span className="info-value">
                      {medico.disponibilidade.disponivel ? 'Sim' : 'Não'}
                    </span>
                  </div>
                  {medico.disponibilidade.disponivel && (
                    <div className="info-item">
                      <span className="info-label"><FaCalendarAlt /> Dias e Períodos</span>
                      <span className="info-value">{formatarDisponibilidade()}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {medico.observacoes && (
                <div className="info-section">
                  <h3>Observações</h3>
                  <p className="observacoes-text">{medico.observacoes}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'documentos' && (
          <div className="documentos-tab">
            <div className="documentos-header">
              <h3>Documentos do Médico</h3>
              <button className="btn-upload" onClick={toggleUploadForm}>
                <FaFileUpload /> Adicionar Documento
              </button>
            </div>
            
            <div id="uploadForm" className="upload-form">
              <h4>Upload de Documento</h4>
              <form onSubmit={handleDocumentUpload}>
                <div className="form-group">
                  <label htmlFor="documentName">Nome do Documento*</label>
                  <input
                    type="text"
                    id="documentName"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="documentType">Tipo de Documento*</label>
                  <select
                    id="documentType"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    required
                  >
                    {documentTypes.map(type => (
                      <option key={type.id} value={type.id}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="documentFile">Arquivo*</label>
                  <input
                    type="file"
                    id="documentFile"
                    onChange={handleFileChange}
                    required
                  />
                </div>
                
                {documentError && <div className="error-message">{documentError}</div>}
                
                <div className="form-actions">
                  <button type="button" onClick={toggleUploadForm} className="btn-cancelar">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-upload" disabled={uploadingDocument}>
                    {uploadingDocument ? 'Enviando...' : 'Enviar Documento'}
                  </button>
                </div>
              </form>
            </div>
            
            {medico.documentos && medico.documentos.length > 0 ? (
              <div className="documentos-list">
                {medico.documentos.map((doc, index) => {
                  const docTypeLabel = documentTypes.find(t => t.id === doc.tipo)?.label || doc.tipo;
                  
                  return (
                    <div key={index} className="documento-card">
                      <div className="documento-icon">
                        <FaFilePdf />
                      </div>
                      <div className="documento-info">
                        <h4>{doc.nome}</h4>
                        <p>{docTypeLabel}</p>
                        <p className="documento-data">
                          Adicionado em {new Date(doc.dataUpload).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="documento-actions">
                        <a 
                          href={`/api/medicos/${id}/documentos/${doc._id}`} 
                          className="btn-download"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <FaEye /> Visualizar
                        </a>
                        <a 
                          href={`/api/medicos/${id}/documentos/${doc._id}/download`} 
                          className="btn-download"
                          download
                        >
                          <FaDownload /> Download
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="no-data-message">
                <p>Nenhum documento cadastrado para este médico.</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'oportunidades' && (
          <div className="oportunidades-tab">
            <h3>Oportunidades Vinculadas</h3>
            
            {medico.oportunidades && medico.oportunidades.length > 0 ? (
              <div className="oportunidades-list">
                {medico.oportunidades.map(oportunidade => (
                  <div key={oportunidade._id} className="oportunidade-card">
                    <div className="oportunidade-info">
                      <h4>{oportunidade.titulo}</h4>
                      <div className="oportunidade-details">
                        <p><strong>Cliente:</strong> {oportunidade.cliente?.nome || 'Não informado'}</p>
                        <p><strong>Especialidade:</strong> {oportunidade.especialidade?.nome || 'Não informada'}</p>
                        <p><strong>Local:</strong> {oportunidade.cidade?.nome || 'Não informado'}, {oportunidade.estado || 'N/A'}</p>
                        <p><strong>Status:</strong> 
                          <span className={`status-badge status-${oportunidade.status.toLowerCase()}`}>
                            {oportunidade.status}
                          </span>
                        </p>
                        <p><strong>Status do Médico:</strong> 
                          <span className={`status-badge status-${oportunidade.medicoStatus?.toLowerCase() || 'pendente'}`}>
                            {oportunidade.medicoStatus || 'Pendente'}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="oportunidade-actions">
                      <Link to={`/oportunidades/${oportunidade._id}`} className="btn-ver">
                        <FaEye /> Ver Detalhes
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-message">
                <p>Este médico não está vinculado a nenhuma oportunidade.</p>
              </div>
            )}
          </div>
        )}
        
        {activeTab === 'historico' && (
          <div className="historico-tab">
            <div className="historico-header">
              <h3>Histórico de Atividades</h3>
              <button className="btn-add-historico" onClick={toggleHistoricoForm}>
                <FaPlus /> Adicionar Registro
              </button>
            </div>
            
            <div id="historicoForm" className="historico-form">
              <h4>Novo Registro de Histórico</h4>
              <form onSubmit={handleAddHistorico}>
                <div className="form-group">
                  <label htmlFor="historicoTexto">Descrição*</label>
                  <textarea
                    id="historicoTexto"
                    value={historicoTexto}
                    onChange={(e) => setHistoricoTexto(e.target.value)}
                    rows="3"
                    placeholder="Descreva a atividade ou observação..."
                    required
                  ></textarea>
                </div>
                
                <div className="form-actions">
                  <button type="button" onClick={toggleHistoricoForm} className="btn-cancelar">
                    Cancelar
                  </button>
                  <button type="submit" className="btn-add" disabled={addingHistorico}>
                    {addingHistorico ? 'Adicionando...' : 'Adicionar'}
                  </button>
                </div>
              </form>
            </div>
            
            {medico.historico && medico.historico.length > 0 ? (
              <div className="historico-timeline">
                {medico.historico.map((item, index) => (
                  <div key={index} className="historico-item">
                    <div className="historico-data">
                      <FaHistory className="historico-icon" />
                      <span>{new Date(item.data).toLocaleDateString()} às {new Date(item.data).toLocaleTimeString()}</span>
                    </div>
                    <div className="historico-conteudo">
                      <p>{item.texto}</p>
                      {item.usuario && (
                        <p className="historico-usuario">Por: {item.usuario.nome || 'Sistema'}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data-message">
                <p>Nenhum registro de histórico para este médico.</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirmar Exclusão</h3>
            <p>Tem certeza que deseja excluir o médico <strong>{medico.nome}</strong>?</p>
            <p className="modal-warning">Esta ação não pode ser desfeita.</p>
            
            <div className="modal-actions">
              <button 
                className="btn-cancelar" 
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
              >
                Cancelar
              </button>
              <button 
                className="btn-confirmar" 
                onClick={handleDeleteConfirm}
                disabled={loading}
              >
                {loading ? 'Excluindo...' : 'Confirmar Exclusão'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MedicoDetalhes;