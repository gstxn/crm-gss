import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import Filters from '../components/Filters';
import { FaPlus, FaSearch, FaFilter, FaEllipsisV, FaUserMd, FaBuilding, FaCalendarAlt, FaMapMarkerAlt } from 'react-icons/fa';
import './Oportunidades.css';

const Oportunidades = () => {
  const handleApplyFilters = (f) => {
    setFiltros({
      status: f.status,
      especialidade: f.especialidade,
      cidade: f.cidade,
      estado: f.uf
    });
    setBusca(f.q);
    setPaginacao(prev => ({ ...prev, currentPage: 1 }));
  };

  const handleResetFilters = () => {
    setFiltros({ status: 'todos', especialidade: 'todas', cidade: 'todas', estado: 'todas' });
    setBusca('');
    setPaginacao(prev => ({ ...prev, currentPage: 1 }));
  };
  const [oportunidades, setOportunidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filtros, setFiltros] = useState({
    status: '',
    especialidade: '',
    cidade: '',
    estado: ''
  });
  const [busca, setBusca] = useState('');
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [paginacao, setPaginacao] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0
  });
  const [especialidades, setEspecialidades] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [estados, setEstados] = useState([]);

  // Buscar oportunidades
  const buscarOportunidades = async () => {
    setLoading(true);
    try {
      let queryParams = `page=${paginacao.currentPage}&limit=10`;
      
      // Adicionar filtros à query
      if (filtros.status && filtros.status !== 'todos') queryParams += `&status=${filtros.status}`;
      if (filtros.especialidade && filtros.especialidade !== 'todas') queryParams += `&especialidade=${filtros.especialidade}`;
      if (filtros.cidade && filtros.cidade !== 'todas') queryParams += `&cidade=${filtros.cidade}`;
      if (filtros.estado && filtros.estado !== 'todas') queryParams += `&estado=${filtros.estado}`;
      
      // Adicionar busca à query se existir
      if (busca) queryParams += `&busca=${busca}`;
      
      const response = await axios.get(`/api/oportunidades?${queryParams}`);
      
      setOportunidades(response.data.oportunidades);
      setPaginacao({
        currentPage: response.data.currentPage,
        totalPages: response.data.totalPages,
        total: response.data.total
      });
      
      // Extrair listas únicas para os filtros
      if (response.data.oportunidades.length > 0) {
        const especialidadesUnicas = [...new Set(response.data.oportunidades.map(o => o.especialidade))];
        const cidadesUnicas = [...new Set(response.data.oportunidades.map(o => o.local.cidade))];
        const estadosUnicos = [...new Set(response.data.oportunidades.map(o => o.local.estado))];
        
        setEspecialidades(especialidadesUnicas);
        setCidades(cidadesUnicas);
        setEstados(estadosUnicos);
      }
      
      setError(null);
    } catch (err) {
      console.error('Erro ao buscar oportunidades:', err);
      setError('Falha ao carregar oportunidades. Por favor, tente novamente.');
      toast.error('Erro ao carregar oportunidades');
    } finally {
      setLoading(false);
    }
  };

  // Carregar oportunidades ao montar o componente ou quando os filtros/paginação mudarem
  useEffect(() => {
    buscarOportunidades();
  }, [paginacao.currentPage, filtros]);

  // Lidar com a mudança de página
  const mudarPagina = (pagina) => {
    if (pagina < 1 || pagina > paginacao.totalPages) return;
    setPaginacao(prev => ({ ...prev, currentPage: pagina }));
  };

  // Lidar com a aplicação de filtros
  const aplicarFiltros = (e) => {
    e.preventDefault();
    setPaginacao(prev => ({ ...prev, currentPage: 1 })); // Voltar para a primeira página
    setMostrarFiltros(false); // Fechar o painel de filtros
  };

  // Lidar com a busca
  const aplicarBusca = (e) => {
    e.preventDefault();
    buscarOportunidades();
  };

  // Formatar data
  const formatarData = (data) => {
    if (!data) return 'N/A';
    return new Date(data).toLocaleDateString('pt-BR');
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

  return (
    <div className="oportunidades-container">
      <div className="oportunidades-header">
        <h1>Oportunidades</h1>
        <Link to="/oportunidades/nova" className="btn-nova-oportunidade">
          <FaPlus /> Nova Oportunidade
        </Link>
      </div>

      <div className="oportunidades-actions">
        <form onSubmit={aplicarBusca} className="search-form">
          <div className="search-input">
            <input
              type="text"
              placeholder="Buscar oportunidades..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <button type="submit">
              <FaSearch />
            </button>
          </div>
        </form>

        <button 
          className="btn-filtrar" 
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
        >
          <FaFilter /> Filtrar
        </button>
      </div>

      {/* Filtros avançados */}
      <Filters onApply={handleApplyFilters} onReset={handleResetFilters} />

      {mostrarFiltros && (
        <div className="filtros-panel">
          <form onSubmit={aplicarFiltros}>
            <div className="filtros-grid">
              <div className="filtro-grupo">
                <label>Status</label>
                <select 
                  value={filtros.status} 
                  onChange={(e) => setFiltros({...filtros, status: e.target.value})}
                >
                  <option value="">Todos</option>
                  <option value="Aberta">Aberta</option>
                  <option value="Em andamento">Em andamento</option>
                  <option value="Preenchida">Preenchida</option>
                  <option value="Cancelada">Cancelada</option>
                </select>
              </div>

              <div className="filtro-grupo">
                <label>Especialidade</label>
                <select 
                  value={filtros.especialidade} 
                  onChange={(e) => setFiltros({...filtros, especialidade: e.target.value})}
                >
                  <option value="">Todas</option>
                  {especialidades.map((esp, index) => (
                    <option key={index} value={esp}>{esp}</option>
                  ))}
                </select>
              </div>

              <div className="filtro-grupo">
                <label>Estado</label>
                <select 
                  value={filtros.estado} 
                  onChange={(e) => setFiltros({...filtros, estado: e.target.value})}
                >
                  <option value="">Todos</option>
                  {estados.map((estado, index) => (
                    <option key={index} value={estado}>{estado}</option>
                  ))}
                </select>
              </div>

              <div className="filtro-grupo">
                <label>Cidade</label>
                <select 
                  value={filtros.cidade} 
                  onChange={(e) => setFiltros({...filtros, cidade: e.target.value})}
                >
                  <option value="">Todas</option>
                  {cidades.map((cidade, index) => (
                    <option key={index} value={cidade}>{cidade}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="filtros-actions">
              <button type="button" onClick={() => {
                setFiltros({
                  status: '',
                  especialidade: '',
                  cidade: '',
                  estado: ''
                });
                setPaginacao(prev => ({ ...prev, currentPage: 1 }));
              }}>
                Limpar
              </button>
              <button type="submit">Aplicar</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <p>Carregando oportunidades...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={buscarOportunidades}>Tentar novamente</button>
        </div>
      ) : oportunidades.length === 0 ? (
        <div className="no-data-container">
          <p>Nenhuma oportunidade encontrada.</p>
          {Object.values(filtros).some(f => f !== '') && (
            <p>Tente ajustar os filtros para ver mais resultados.</p>
          )}
        </div>
      ) : (
        <>
          <div className="oportunidades-list">
            {oportunidades.map((oportunidade) => (
              <div key={oportunidade._id} className="oportunidade-card">
                <div className="oportunidade-header">
                  <h3>{oportunidade.titulo}</h3>
                  <div className="oportunidade-actions">
                    <div className={`oportunidade-status ${getStatusClass(oportunidade.status)}`}>
                      {oportunidade.status}
                    </div>
                    <div className="oportunidade-menu">
                      <FaEllipsisV />
                      <div className="oportunidade-menu-dropdown">
                        <Link to={`/oportunidades/${oportunidade._id}`}>Ver detalhes</Link>
                        <Link to={`/oportunidades/${oportunidade._id}/editar`}>Editar</Link>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="oportunidade-info">
                  <div className="oportunidade-info-item">
                    <FaUserMd />
                    <span>{oportunidade.especialidade}</span>
                  </div>
                  <div className="oportunidade-info-item">
                    <FaBuilding />
                    <span>{oportunidade.cliente?.nome || 'Cliente não disponível'}</span>
                  </div>
                  <div className="oportunidade-info-item">
                    <FaCalendarAlt />
                    <span>Início: {formatarData(oportunidade.dataInicio)}</span>
                  </div>
                  <div className="oportunidade-info-item">
                    <FaMapMarkerAlt />
                    <span>{oportunidade.local?.cidade}, {oportunidade.local?.estado}</span>
                  </div>
                </div>
                
                <div className="oportunidade-footer">
                  <Link to={`/oportunidades/${oportunidade._id}`} className="btn-detalhes">
                    Ver detalhes
                  </Link>
                  <div className="oportunidade-medicos">
                    {oportunidade.medicosIndicados?.length > 0 ? (
                      <span>{oportunidade.medicosIndicados.length} médico(s) indicado(s)</span>
                    ) : (
                      <span>Nenhum médico indicado</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="paginacao">
            <button 
              onClick={() => mudarPagina(paginacao.currentPage - 1)}
              disabled={paginacao.currentPage === 1}
            >
              Anterior
            </button>
            <span>
              Página {paginacao.currentPage} de {paginacao.totalPages} ({paginacao.total} resultados)
            </span>
            <button 
              onClick={() => mudarPagina(paginacao.currentPage + 1)}
              disabled={paginacao.currentPage === paginacao.totalPages}
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Oportunidades;