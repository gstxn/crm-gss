import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { 
  FaArrowLeft, FaEdit, FaTrash, FaUserMd, FaBuilding, 
  FaCalendarAlt, FaMapMarkerAlt, FaMoneyBillAlt, FaClock,
  FaPlus, FaCommentAlt, FaHistory, FaCheck, FaTimes
} from 'react-icons/fa';
import './OportunidadeDetalhes.css';

const OportunidadeDetalhes = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [oportunidade, setOportunidade] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('detalhes');
  const [novoComentario, setNovoComentario] = useState('');
  const [novoMedico, setNovoMedico] = useState({
    medicoId: '',
    status: 'Indicado',
    observacao: ''
  });
  const [medicos, setMedicos] = useState([]);
  const [loadingMedicos, setLoadingMedicos] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Buscar detalhes da oportunidade
  const buscarOportunidade = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/oportunidades/${id}`);
      setOportunidade(response.data);
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar oportunidade:', err);
      setError('Falha ao carregar detalhes da oportunidade. Por favor, tente novamente.');
      toast.error('Erro ao carregar detalhes da oportunidade');
    } finally {
      setLoading(false);
    }
  };

  // Buscar médicos disponíveis
  const buscarMedicos = async () => {
    setLoadingMedicos(true);
    try {
      const response = await axios.get('/api/medicos');
      
      // Filtrar médicos que já estão indicados
      const medicosIndicadosIds = oportunidade?.medicosIndicados.map(m => m.medico._id) || [];
      const medicosDisponiveis = response.data.medicos.filter(
        medico => !medicosIndicadosIds.includes(medico._id)
      );
      
      setMedicos(medicosDisponiveis);
    } catch (err) {
      console.error('Erro ao buscar médicos:', err);
      toast.error('Erro ao carregar lista de médicos');
    } finally {
      setLoadingMedicos(false);
    }
  };

  useEffect(() => {
    buscarOportunidade();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'medicos' && oportunidade) {
      buscarMedicos();
    }
  }, [activeTab, oportunidade]);

  // Adicionar comentário
  const adicionarComentario = async (e) => {
    e.preventDefault();
    if (!novoComentario.trim()) return;

    try {
      await axios.post(`/api/oportunidades/${id}/comentarios`, { texto: novoComentario });
      setNovoComentario('');
      toast.success('Comentário adicionado com sucesso');
      buscarOportunidade();
    } catch (err) {
      console.error('Erro ao adicionar comentário:', err);
      toast.error('Erro ao adicionar comentário');
    }
  };

  // Adicionar médico
  const adicionarMedico = async (e) => {
    e.preventDefault();
    if (!novoMedico.medicoId) {
      toast.warning('Selecione um médico');
      return;
    }

    try {
      await axios.post(`/api/oportunidades/${id}/medicos`, novoMedico);
      setNovoMedico({
        medicoId: '',
        status: 'Indicado',
        observacao: ''
      });
      toast.success('Médico indicado com sucesso');
      buscarOportunidade();
    } catch (err) {
      console.error('Erro ao indicar médico:', err);
      toast.error('Erro ao indicar médico');
    }
  };

  // Atualizar status do médico
  const atualizarStatusMedico = async (medicoId, novoStatus) => {
    try {
      await axios.put(`/api/oportunidades/${id}/medicos/${medicoId}`, {
        status: novoStatus
      });
      toast.success('Status atualizado com sucesso');
      buscarOportunidade();
    } catch (err) {
      console.error('Erro ao atualizar status:', err);
      toast.error('Erro ao atualizar status');
    }
  };

  // Excluir oportunidade
  const excluirOportunidade = async () => {
    try {
      await axios.delete(`/api/oportunidades/${id}`);
      toast.success('Oportunidade excluída com sucesso');
      navigate('/oportunidades');
    } catch (err) {
      console.error('Erro ao excluir oportunidade:', err);
      toast.error('Erro ao excluir oportunidade');
      setConfirmDelete(false);
    }
  };

  // Formatar data
  const formatarData = (data) => {
    if (!data) return 'N/A';
    return new Date(data).toLocaleDateString('pt-BR');
  };

  // Formatar data e hora
  const formatarDataHora = (data) => {
    if (!data) return 'N/A';
    return new Date(data).toLocaleString('pt-BR');
  };

  // Obter classe CSS baseada no status
  const getStatusClass = (status) => {
    switch (status) {
      case 'Aberta': return 'status-aberta';
      case 'Em andamento': return 'status-andamento';
      case 'Preenchida': return 'status-preenchida';
      case 'Cancelada': return 'status-cancelada';
      default: return '';
    }
  };

  // Obter classe CSS baseada no status do médico
  const getStatusMedicoClass = (status) => {
    switch (status) {
      case 'Indicado': return 'status-indicado';
      case 'Interessado': return 'status-interessado';
      case 'Em processo': return 'status-processo';
      case 'Contratado': return 'status-contratado';
      case 'Recusado': return 'status-recusado';
      default: return '';
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <p>Carregando detalhes da oportunidade...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={buscarOportunidade}>Tentar novamente</button>
        <Link to="/oportunidades" className="btn-voltar">
          <FaArrowLeft /> Voltar para Oportunidades
        </Link>
      </div>
    );
  }

  if (!oportunidade) {
    return (
      <div className="error-container">
        <p>Oportunidade não encontrada</p>
        <Link to="/oportunidades" className="btn-voltar">
          <FaArrowLeft /> Voltar para Oportunidades
        </Link>
      </div>
    );
  }

  return (
    <div className="oportunidade-detalhes-container">
      <div className="oportunidade-detalhes-header">
        <div className="header-left">
          <Link to="/oportunidades" className="btn-voltar">
            <FaArrowLeft /> Voltar
          </Link>
          <h1>{oportunidade.titulo}</h1>
          <div className={`oportunidade-status ${getStatusClass(oportunidade.status)}`}>
            {oportunidade.status}
          </div>
        </div>
        <div className="header-actions">
          <Link to={`/oportunidades/${id}/editar`} className="btn-editar">
            <FaEdit /> Editar
          </Link>
          <button 
            className="btn-excluir" 
            onClick={() => setConfirmDelete(true)}
          >
            <FaTrash /> Excluir
          </button>
        </div>
      </div>

      {confirmDelete && (
        <div className="confirm-delete-modal">
          <div className="confirm-delete-content">
            <h3>Confirmar exclusão</h3>
            <p>Tem certeza que deseja excluir esta oportunidade? Esta ação não pode ser desfeita.</p>
            <div className="confirm-delete-actions">
              <button onClick={() => setConfirmDelete(false)} className="btn-cancelar">
                <FaTimes /> Cancelar
              </button>
              <button onClick={excluirOportunidade} className="btn-confirmar">
                <FaCheck /> Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="oportunidade-tabs">
        <button 
          className={activeTab === 'detalhes' ? 'active' : ''}
          onClick={() => setActiveTab('detalhes')}
        >
          Detalhes
        </button>
        <button 
          className={activeTab === 'medicos' ? 'active' : ''}
          onClick={() => setActiveTab('medicos')}
        >
          Médicos Indicados ({oportunidade.medicosIndicados?.length || 0})
        </button>
        <button 
          className={activeTab === 'comentarios' ? 'active' : ''}
          onClick={() => setActiveTab('comentarios')}
        >
          Comentários ({oportunidade.comentarios?.length || 0})
        </button>
        <button 
          className={activeTab === 'historico' ? 'active' : ''}
          onClick={() => setActiveTab('historico')}
        >
          Histórico
        </button>
      </div>

      <div className="oportunidade-content">
        {activeTab === 'detalhes' && (
          <div className="oportunidade-detalhes">
            <div className="detalhes-grid">
              <div className="detalhes-grupo">
                <h3>Informações Gerais</h3>
                <div className="detalhes-item">
                  <FaUserMd className="icon" />
                  <div>
                    <span className="label">Especialidade</span>
                    <span className="valor">{oportunidade.especialidade}</span>
                  </div>
                </div>
                <div className="detalhes-item">
                  <FaBuilding className="icon" />
                  <div>
                    <span className="label">Cliente</span>
                    <span className="valor">{oportunidade.cliente?.nome}</span>
                  </div>
                </div>
                <div className="detalhes-item">
                  <FaMapMarkerAlt className="icon" />
                  <div>
                    <span className="label">Local</span>
                    <span className="valor">
                      {oportunidade.local?.cidade}, {oportunidade.local?.estado}
                      {oportunidade.local?.endereco && (
                        <span className="endereco">{oportunidade.local.endereco}</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detalhes-grupo">
                <h3>Período e Carga Horária</h3>
                <div className="detalhes-item">
                  <FaCalendarAlt className="icon" />
                  <div>
                    <span className="label">Data de Início</span>
                    <span className="valor">{formatarData(oportunidade.dataInicio)}</span>
                  </div>
                </div>
                {oportunidade.dataFim && (
                  <div className="detalhes-item">
                    <FaCalendarAlt className="icon" />
                    <div>
                      <span className="label">Data de Término</span>
                      <span className="valor">{formatarData(oportunidade.dataFim)}</span>
                    </div>
                  </div>
                )}
                <div className="detalhes-item">
                  <FaClock className="icon" />
                  <div>
                    <span className="label">Carga Horária</span>
                    <span className="valor">{oportunidade.cargaHoraria || 'Não especificada'}</span>
                  </div>
                </div>
              </div>

              <div className="detalhes-grupo">
                <h3>Remuneração</h3>
                <div className="detalhes-item">
                  <FaMoneyBillAlt className="icon" />
                  <div>
                    <span className="label">Valor</span>
                    <span className="valor">
                      {oportunidade.remuneracao?.valor 
                        ? `R$ ${oportunidade.remuneracao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                        : 'Não especificado'}
                    </span>
                  </div>
                </div>
                <div className="detalhes-item">
                  <FaMoneyBillAlt className="icon" />
                  <div>
                    <span className="label">Tipo</span>
                    <span className="valor">{oportunidade.remuneracao?.tipo || 'Não especificado'}</span>
                  </div>
                </div>
              </div>
            </div>

            {(oportunidade.descricao || oportunidade.requisitos) && (
              <div className="detalhes-descricao">
                {oportunidade.descricao && (
                  <div className="descricao-grupo">
                    <h3>Descrição</h3>
                    <p>{oportunidade.descricao}</p>
                  </div>
                )}
                {oportunidade.requisitos && (
                  <div className="descricao-grupo">
                    <h3>Requisitos</h3>
                    <p>{oportunidade.requisitos}</p>
                  </div>
                )}
              </div>
            )}

            <div className="detalhes-footer">
              <div className="detalhes-criacao">
                <p>Criado por {oportunidade.criadoPor?.nome} em {formatarData(oportunidade.criadoEm)}</p>
                {oportunidade.atualizadoEm && (
                  <p>Última atualização em {formatarData(oportunidade.atualizadoEm)}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'medicos' && (
          <div className="oportunidade-medicos">
            <div className="medicos-form">
              <h3>Indicar Médico</h3>
              <form onSubmit={adicionarMedico}>
                <div className="form-grupo">
                  <label>Médico</label>
                  <select 
                    value={novoMedico.medicoId} 
                    onChange={(e) => setNovoMedico({...novoMedico, medicoId: e.target.value})}
                    required
                  >
                    <option value="">Selecione um médico</option>
                    {loadingMedicos ? (
                      <option disabled>Carregando médicos...</option>
                    ) : (
                      medicos.map(medico => (
                        <option key={medico._id} value={medico._id}>
                          {medico.nome} - {medico.especialidade} (CRM: {medico.crm})
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div className="form-grupo">
                  <label>Status</label>
                  <select 
                    value={novoMedico.status} 
                    onChange={(e) => setNovoMedico({...novoMedico, status: e.target.value})}
                  >
                    <option value="Indicado">Indicado</option>
                    <option value="Interessado">Interessado</option>
                    <option value="Em processo">Em processo</option>
                    <option value="Contratado">Contratado</option>
                    <option value="Recusado">Recusado</option>
                  </select>
                </div>
                <div className="form-grupo">
                  <label>Observação</label>
                  <textarea 
                    value={novoMedico.observacao} 
                    onChange={(e) => setNovoMedico({...novoMedico, observacao: e.target.value})}
                    placeholder="Observações sobre a indicação"
                  />
                </div>
                <button type="submit" className="btn-adicionar">
                  <FaPlus /> Indicar Médico
                </button>
              </form>
            </div>

            <div className="medicos-lista">
              <h3>Médicos Indicados</h3>
              {oportunidade.medicosIndicados?.length === 0 ? (
                <p className="no-data-message">Nenhum médico indicado para esta oportunidade.</p>
              ) : (
                oportunidade.medicosIndicados?.map((item) => (
                  <div key={item._id} className="medico-card">
                    <div className="medico-header">
                      <h4>{item.medico.nome}</h4>
                      <div className={`medico-status ${getStatusMedicoClass(item.status)}`}>
                        {item.status}
                      </div>
                    </div>
                    <div className="medico-info">
                      <p><strong>CRM:</strong> {item.medico.crm}</p>
                      <p><strong>Especialidade:</strong> {item.medico.especialidade}</p>
                      <p><strong>Contato:</strong> {item.medico.telefone} | {item.medico.email}</p>
                      <p><strong>Data de Indicação:</strong> {formatarData(item.dataIndicacao)}</p>
                      {item.observacao && (
                        <p><strong>Observação:</strong> {item.observacao}</p>
                      )}
                    </div>
                    <div className="medico-actions">
                      <select 
                        value={item.status}
                        onChange={(e) => atualizarStatusMedico(item.medico._id, e.target.value)}
                      >
                        <option value="Indicado">Indicado</option>
                        <option value="Interessado">Interessado</option>
                        <option value="Em processo">Em processo</option>
                        <option value="Contratado">Contratado</option>
                        <option value="Recusado">Recusado</option>
                      </select>
                      <Link to={`/medicos/${item.medico._id}`} className="btn-ver-medico">
                        Ver Perfil
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'comentarios' && (
          <div className="oportunidade-comentarios">
            <div className="comentarios-form">
              <h3>Adicionar Comentário</h3>
              <form onSubmit={adicionarComentario}>
                <textarea 
                  value={novoComentario} 
                  onChange={(e) => setNovoComentario(e.target.value)}
                  placeholder="Digite seu comentário..."
                  required
                />
                <button type="submit" className="btn-adicionar">
                  <FaCommentAlt /> Adicionar Comentário
                </button>
              </form>
            </div>

            <div className="comentarios-lista">
              <h3>Comentários</h3>
              {oportunidade.comentarios?.length === 0 ? (
                <p className="no-data-message">Nenhum comentário para esta oportunidade.</p>
              ) : (
                oportunidade.comentarios?.map((comentario) => (
                  <div key={comentario._id} className="comentario-item">
                    <div className="comentario-header">
                      <span className="comentario-autor">{comentario.usuario.nome}</span>
                      <span className="comentario-data">{formatarDataHora(comentario.data)}</span>
                    </div>
                    <div className="comentario-texto">
                      {comentario.texto}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === 'historico' && (
          <div className="oportunidade-historico">
            <h3>Histórico de Atividades</h3>
            {oportunidade.historico?.length === 0 ? (
              <p className="no-data-message">Nenhum registro no histórico.</p>
            ) : (
              <div className="historico-timeline">
                {oportunidade.historico?.map((evento) => (
                  <div key={evento._id} className="historico-item">
                    <div className="historico-marcador"></div>
                    <div className="historico-conteudo">
                      <div className="historico-header">
                        <span className="historico-tipo">{evento.tipo}</span>
                        <span className="historico-data">{formatarDataHora(evento.data)}</span>
                      </div>
                      <div className="historico-descricao">
                        {evento.descricao}
                      </div>
                      <div className="historico-usuario">
                        Por: {evento.usuario.nome}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OportunidadeDetalhes;