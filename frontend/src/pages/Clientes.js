import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaSearch, FaFilter, FaEllipsisV, FaPlus, FaMapMarkerAlt, FaUserTie, FaFileAlt } from 'react-icons/fa';
import './Clientes.css';
import ImportacaoBotoes from '../components/ImportacaoBotoes';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filtroTipo, setFiltroTipo] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');
  const [filtroCidade, setFiltroCidade] = useState('');
  const [busca, setBusca] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });
  
  // Lista de estados brasileiros
  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS',
    'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC',
    'SP', 'SE', 'TO'
  ];
  
  // Tipos de cliente
  const tiposCliente = ['Hospital', 'Clínica', 'Outro'];
  
  // Função para carregar os clientes
  const carregarClientes = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Construir parâmetros de consulta
      const params = {
        page: pagination.page,
        limit: pagination.limit
      };
      
      if (busca) params.nome = busca;
      if (filtroTipo) params.tipo = filtroTipo;
      if (filtroEstado) params.estado = filtroEstado;
      if (filtroCidade) params.cidade = filtroCidade;
      
      const response = await axios.get('/api/clientes', { params });
      
      setClientes(response.data.clientes);
      setPagination(response.data.pagination);
    } catch (err) {
      console.error('Erro ao carregar clientes:', err);
      setError('Não foi possível carregar os clientes. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };
  
  // Carregar clientes na montagem do componente e quando os filtros mudarem
  useEffect(() => {
    carregarClientes();
  }, [pagination.page, filtroTipo, filtroEstado, filtroCidade]);
  
  // Função para lidar com a pesquisa
  const handlePesquisar = (e) => {
    e.preventDefault();
    setPagination(prev => ({ ...prev, page: 1 })); // Voltar para a primeira página
    carregarClientes();
  };
  
  // Função para limpar filtros
  const limparFiltros = () => {
    setFiltroTipo('');
    setFiltroEstado('');
    setFiltroCidade('');
    setBusca('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };
  
  // Função para mudar de página
  const mudarPagina = (novaPagina) => {
    if (novaPagina >= 1 && novaPagina <= pagination.pages) {
      setPagination(prev => ({ ...prev, page: novaPagina }));
    }
  };
  
  return (
    <div className="clientes-container">
      <div className="clientes-header">
        <h1>Clientes</h1>
        <div className="clientes-header-actions">
          <ImportacaoBotoes />
          <Link to="/clientes/novo" className="btn-novo-cliente">
            <FaPlus /> Novo Cliente
          </Link>
        </div>
      </div>
      
      <div className="acoes-container">
        <form onSubmit={handlePesquisar} className="busca-container">
          <input
            type="text"
            placeholder="Buscar por nome..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <button type="submit">
            <FaSearch />
          </button>
        </form>
        
        <button 
          className="btn-filtro" 
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter /> Filtros
        </button>
      </div>
      
      {showFilters && (
        <div className="filtros-panel">
          <div className="filtro-grupo">
            <label>Tipo:</label>
            <select 
              value={filtroTipo} 
              onChange={(e) => setFiltroTipo(e.target.value)}
            >
              <option value="">Todos</option>
              {tiposCliente.map(tipo => (
                <option key={tipo} value={tipo}>{tipo}</option>
              ))}
            </select>
          </div>
          
          <div className="filtro-grupo">
            <label>Estado:</label>
            <select 
              value={filtroEstado} 
              onChange={(e) => setFiltroEstado(e.target.value)}
            >
              <option value="">Todos</option>
              {estados.map(estado => (
                <option key={estado} value={estado}>{estado}</option>
              ))}
            </select>
          </div>
          
          <div className="filtro-grupo">
            <label>Cidade:</label>
            <input
              type="text"
              placeholder="Filtrar por cidade"
              value={filtroCidade}
              onChange={(e) => setFiltroCidade(e.target.value)}
            />
          </div>
          
          <button className="btn-limpar-filtros" onClick={limparFiltros}>
            Limpar Filtros
          </button>
        </div>
      )}
      
      {loading ? (
        <div className="loading-message">Carregando clientes...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : clientes.length === 0 ? (
        <div className="empty-message">
          Nenhum cliente encontrado. 
          {(filtroTipo || filtroEstado || filtroCidade || busca) && (
            <span> Tente remover alguns filtros.</span>
          )}
        </div>
      ) : (
        <div className="clientes-list">
          {clientes.map(cliente => (
            <div key={cliente._id} className="cliente-card">
              <div className="cliente-info">
                <h3>{cliente.nome}</h3>
                <div className="cliente-tipo">{cliente.tipo}</div>
                <div className="cliente-local">
                  <FaMapMarkerAlt />
                  {cliente.endereco.cidade}, {cliente.endereco.estado}
                </div>
                
                {cliente.contatos && cliente.contatos.length > 0 && (
                  <div className="cliente-contato">
                    <FaUserTie />
                    <span><strong>Contato:</strong> {cliente.contatos.find(c => c.principal)?.nome || cliente.contatos[0].nome}</span>
                  </div>
                )}
                
                <div className="cliente-oportunidades">
                  <FaFileAlt />
                  <span><strong>Oportunidades:</strong> {cliente.oportunidades?.length || 0}</span>
                </div>
              </div>
              
              <div className="cliente-actions">
                <div className="dropdown">
                  <button className="dropdown-toggle">
                    <FaEllipsisV />
                  </button>
                  <div className="dropdown-menu">
                    <Link to={`/clientes/${cliente._id}`}>Ver Detalhes</Link>
                    <Link to={`/clientes/${cliente._id}/editar`}>Editar</Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Paginação */}
      {!loading && !error && pagination.pages > 1 && (
        <div className="pagination">
          <button 
            onClick={() => mudarPagina(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            Anterior
          </button>
          
          <div className="page-info">
            Página {pagination.page} de {pagination.pages}
          </div>
          
          <button 
            onClick={() => mudarPagina(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
};

export default Clientes;