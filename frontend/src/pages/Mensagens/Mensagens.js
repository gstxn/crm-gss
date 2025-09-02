import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaEnvelope, FaEnvelopeOpen, FaSearch, FaFilter, FaTrash, FaReply } from 'react-icons/fa';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import './Mensagens.css';

const Mensagens = () => {
  const [mensagens, setMensagens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tipoVisualizacao, setTipoVisualizacao] = useState('recebidas');
  const [busca, setBusca] = useState('');
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [mensagemSelecionada, setMensagemSelecionada] = useState(null);
  const [carregandoMensagem, setCarregandoMensagem] = useState(false);
  const [mostrarPainel, setMostrarPainel] = useState(false);

  // Carregar mensagens
  useEffect(() => {
    const fetchMensagens = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        const response = await axios.get(`/api/mensagens?tipo=${tipoVisualizacao}&pagina=${paginaAtual}&busca=${busca}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setMensagens(response.data.mensagens);
        setTotalPaginas(response.data.paginacao.paginas);
        setLoading(false);
      } catch (err) {
        setError('Erro ao carregar mensagens. Por favor, tente novamente.');
        setLoading(false);
        console.error('Erro ao carregar mensagens:', err);
      }
    };

    fetchMensagens();
  }, [tipoVisualizacao, paginaAtual, busca]);

  // Carregar detalhes de uma mensagem
  const carregarMensagem = async (id) => {
    try {
      setCarregandoMensagem(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`/api/mensagens/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setMensagemSelecionada(response.data);
      setCarregandoMensagem(false);
      
      // Se for uma mensagem recebida e não lida, marcar como lida
      if (tipoVisualizacao === 'recebidas') {
        const destinatario = response.data.destinatarios.find(
          dest => dest.usuario._id === getUserInfo().id
        );
        
        if (destinatario && !destinatario.lido) {
          await axios.put(`/api/mensagens/${id}/lida`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Atualizar o estado local para refletir que a mensagem foi lida
          setMensagens(mensagens.map(msg => {
            if (msg._id === id) {
              const updatedMsg = { ...msg };
              const userIndex = updatedMsg.destinatarios.findIndex(
                dest => dest.usuario._id === getUserInfo().id
              );
              
              if (userIndex !== -1) {
                updatedMsg.destinatarios[userIndex].lido = true;
              }
              
              return updatedMsg;
            }
            return msg;
          }));
        }
      }
    } catch (err) {
      console.error('Erro ao carregar mensagem:', err);
      setCarregandoMensagem(false);
    }
  };

  // Excluir mensagem
  const excluirMensagem = async (id) => {
    if (!window.confirm('Tem certeza que deseja excluir esta mensagem?')) {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      
      await axios.delete(`/api/mensagens/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Atualizar a lista de mensagens
      setMensagens(mensagens.filter(msg => msg._id !== id));
      
      // Se a mensagem excluída for a selecionada, limpar a seleção
      if (mensagemSelecionada && mensagemSelecionada._id === id) {
        setMensagemSelecionada(null);
      }
    } catch (err) {
      console.error('Erro ao excluir mensagem:', err);
      alert('Erro ao excluir mensagem. Por favor, tente novamente.');
    }
  };

  // Lidar com a mudança de página
  const mudarPagina = (novaPagina) => {
    if (novaPagina >= 1 && novaPagina <= totalPaginas) {
      setPaginaAtual(novaPagina);
    }
  };

  // Lidar com a pesquisa
  const handlePesquisa = (e) => {
    e.preventDefault();
    setPaginaAtual(1); // Voltar para a primeira página ao pesquisar
  };

  // Verificar se uma mensagem está lida
  const isMensagemLida = (mensagem) => {
    if (tipoVisualizacao === 'enviadas') return true;
    
    const userId = getUserInfo().id;
    const destinatario = mensagem.destinatarios.find(dest => dest.usuario._id === userId);
    
    return destinatario ? destinatario.lido : true;
  };

  // Formatar data
  const formatarData = (data) => {
    return format(new Date(data), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  };

  // Renderizar prioridade
  const renderizarPrioridade = (prioridade) => {
    switch (prioridade) {
      case 'Alta':
        return <span className="prioridade alta">Alta</span>;
      case 'Baixa':
        return <span className="prioridade baixa">Baixa</span>;
      default:
        return <span className="prioridade normal">Normal</span>;
    }
  };

  return (
    <div className="mensagens-container">
      <div className="mensagens-header">
        <h1>Mensagens</h1>
        <Link to="/mensagens/nova" className="btn-nova-mensagem">
          Nova Mensagem
        </Link>
      </div>

      <div className="mensagens-actions">
        <div className="tipo-visualizacao">
          <button 
            className={tipoVisualizacao === 'recebidas' ? 'active' : ''}
            onClick={() => {
              setTipoVisualizacao('recebidas');
              setPaginaAtual(1);
              setMensagemSelecionada(null);
            }}
          >
            <FaEnvelopeOpen /> Recebidas
          </button>
          <button 
            className={tipoVisualizacao === 'enviadas' ? 'active' : ''}
            onClick={() => {
              setTipoVisualizacao('enviadas');
              setPaginaAtual(1);
              setMensagemSelecionada(null);
            }}
          >
            <FaEnvelope /> Enviadas
          </button>
        </div>

        <div className="search-filter">
          <form onSubmit={handlePesquisa}>
            <div className="search-box">
              <input
                type="text"
                placeholder="Buscar mensagens..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
              <button type="submit">
                <FaSearch />
              </button>
            </div>
          </form>
          <button 
            className="filter-button"
            onClick={() => setMostrarPainel(!mostrarPainel)}
          >
            <FaFilter />
          </button>
        </div>
      </div>

      {mostrarPainel && (
        <div className="filter-panel">
          {/* Implementar filtros adicionais aqui */}
          <div className="filter-options">
            <div className="filter-group">
              <label>Período:</label>
              <select>
                <option value="">Todos</option>
                <option value="hoje">Hoje</option>
                <option value="semana">Esta semana</option>
                <option value="mes">Este mês</option>
              </select>
            </div>
            <div className="filter-group">
              <label>Prioridade:</label>
              <select>
                <option value="">Todas</option>
                <option value="Alta">Alta</option>
                <option value="Normal">Normal</option>
                <option value="Baixa">Baixa</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {error && <div className="error-message">{error}</div>}

      <div className="mensagens-content">
        <div className="mensagens-lista">
          {loading ? (
            <div className="loading">Carregando mensagens...</div>
          ) : mensagens.length === 0 ? (
            <div className="no-messages">
              {busca ? 'Nenhuma mensagem encontrada para esta busca.' : 'Nenhuma mensagem disponível.'}
            </div>
          ) : (
            <>
              <ul>
                {mensagens.map((mensagem) => (
                  <li 
                    key={mensagem._id} 
                    className={`mensagem-item ${!isMensagemLida(mensagem) ? 'nao-lida' : ''} ${mensagemSelecionada && mensagemSelecionada._id === mensagem._id ? 'selecionada' : ''}`}
                    onClick={() => carregarMensagem(mensagem._id)}
                  >
                    <div className="mensagem-icone">
                      {!isMensagemLida(mensagem) ? <FaEnvelope /> : <FaEnvelopeOpen />}
                    </div>
                    <div className="mensagem-info">
                      <div className="mensagem-cabecalho">
                        <span className="mensagem-remetente">
                          {tipoVisualizacao === 'recebidas' 
                            ? mensagem.remetente.nome 
                            : `Para: ${mensagem.destinatarios.map(d => d.usuario.nome).join(', ')}`}
                        </span>
                        <span className="mensagem-data">
                          {format(new Date(mensagem.criadoEm), "dd/MM/yyyy HH:mm")}
                        </span>
                      </div>
                      <div className="mensagem-assunto">{mensagem.assunto}</div>
                      <div className="mensagem-preview">
                        {mensagem.conteudo.substring(0, 100)}{mensagem.conteudo.length > 100 ? '...' : ''}
                      </div>
                      <div className="mensagem-footer">
                        {renderizarPrioridade(mensagem.prioridade)}
                        {mensagem.anexos && mensagem.anexos.length > 0 && (
                          <span className="anexos-badge">{mensagem.anexos.length} anexo(s)</span>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              
              {/* Paginação */}
              {totalPaginas > 1 && (
                <div className="paginacao">
                  <button 
                    onClick={() => mudarPagina(paginaAtual - 1)}
                    disabled={paginaAtual === 1}
                  >
                    Anterior
                  </button>
                  <span>
                    Página {paginaAtual} de {totalPaginas}
                  </span>
                  <button 
                    onClick={() => mudarPagina(paginaAtual + 1)}
                    disabled={paginaAtual === totalPaginas}
                  >
                    Próxima
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mensagem-detalhes">
          {carregandoMensagem ? (
            <div className="loading">Carregando mensagem...</div>
          ) : mensagemSelecionada ? (
            <div className="mensagem-completa">
              <div className="mensagem-header">
                <h2>{mensagemSelecionada.assunto}</h2>
                <div className="mensagem-acoes">
                  {tipoVisualizacao === 'recebidas' && (
                    <Link to={`/mensagens/responder/${mensagemSelecionada._id}`} className="btn-responder">
                      <FaReply /> Responder
                    </Link>
                  )}
                  <button 
                    className="btn-excluir"
                    onClick={() => excluirMensagem(mensagemSelecionada._id)}
                  >
                    <FaTrash /> Excluir
                  </button>
                </div>
              </div>
              
              <div className="mensagem-meta">
                <div>
                  <strong>De:</strong> {mensagemSelecionada.remetente.nome} ({mensagemSelecionada.remetente.email})
                </div>
                <div>
                  <strong>Para:</strong> {mensagemSelecionada.destinatarios.map(d => 
                    `${d.usuario.nome} (${d.usuario.email})`
                  ).join(', ')}
                </div>
                <div>
                  <strong>Data:</strong> {formatarData(mensagemSelecionada.criadoEm)}
                </div>
                <div>
                  <strong>Prioridade:</strong> {renderizarPrioridade(mensagemSelecionada.prioridade)}
                </div>
                {mensagemSelecionada.relacionado && mensagemSelecionada.relacionado.tipo !== 'Geral' && (
                  <div>
                    <strong>Relacionado a:</strong> {mensagemSelecionada.relacionado.tipo} 
                    {mensagemSelecionada.relacionado.id && (
                      <Link to={`/${mensagemSelecionada.relacionado.tipo.toLowerCase()}s/${mensagemSelecionada.relacionado.id}`}>
                        Ver {mensagemSelecionada.relacionado.tipo}
                      </Link>
                    )}
                  </div>
                )}
              </div>
              
              <div className="mensagem-corpo">
                {mensagemSelecionada.conteudo.split('\n').map((paragrafo, index) => (
                  <p key={index}>{paragrafo}</p>
                ))}
              </div>
              
              {mensagemSelecionada.anexos && mensagemSelecionada.anexos.length > 0 && (
                <div className="mensagem-anexos">
                  <h3>Anexos</h3>
                  <ul>
                    {mensagemSelecionada.anexos.map((anexo, index) => (
                      <li key={index}>
                        <a href={`/${anexo.caminho}`} target="_blank" rel="noopener noreferrer">
                          {anexo.nome} ({(anexo.tamanho / 1024).toFixed(2)} KB)
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="selecione-mensagem">
              <FaEnvelope className="icone-grande" />
              <p>Selecione uma mensagem para visualizar</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Mensagens;

const getUserInfo = () => {
  const raw = localStorage.getItem('userInfo');
  if (!raw || raw === 'undefined') return {};
  try {
    return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to parse userInfo:', e);
    return {};
  }
};
// Remove duplicate helper at the bottom and keep only single export default Mensagens;