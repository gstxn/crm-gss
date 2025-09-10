import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { FaUserMd, FaSearch, FaFilter, FaPlus, FaEye, FaEllipsisV, FaUpload, FaSync } from 'react-icons/fa';
import ImportacaoMedicoModal from '../components/ImportacaoMedicoModal';
import './Medicos.css';

const Medicos = () => {
  const [medicos, setMedicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filtros, setFiltros] = useState({
    especialidade: '',
    cidade: '',
    estado: ''
  });
  const [especialidades, setEspecialidades] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cidades, setCidades] = useState([]);
  const [paginacao, setPaginacao] = useState({
    total: 0,
    paginas: 0,
    paginaAtual: 1,
    porPagina: 10
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [syncingSheets, setSyncingSheets] = useState(false);

  // Buscar médicos com filtros e paginação
  const fetchMedicos = async () => {
    setLoading(true);
    setError(null);

    try {
      let queryParams = `page=${paginacao.paginaAtual}&limit=${paginacao.porPagina}`;
      
      // Adicionar termo de busca se existir
      if (searchTerm) {
        queryParams += `&nome=${searchTerm}`;
      }
      
      // Adicionar filtros se existirem
      if (filtros.especialidade) {
        queryParams += `&especialidade=${filtros.especialidade}`;
      }
      
      if (filtros.cidade) {
        queryParams += `&cidade=${filtros.cidade}`;
      }
      
      if (filtros.estado) {
        queryParams += `&estado=${filtros.estado}`;
      }
      
      const response = await axios.get(`/api/medicos?${queryParams}`);
      setMedicos(response.data.medicos);
      setPaginacao(response.data.paginacao);
    } catch (err) {
      setError('Erro ao carregar médicos. Por favor, tente novamente.');
      console.error('Erro ao carregar médicos:', err);
    } finally {
      setLoading(false);
    }
  };

  // Buscar dados iniciais
  useEffect(() => {
    const fetchDadosIniciais = async () => {
      try {
        // Buscar especialidades
        const especialidadesResponse = await axios.get('/api/especialidades');
        setEspecialidades(especialidadesResponse.data || []);

        // Buscar estados
        const estadosResponse = await axios.get('/api/estados');
        setEstados(estadosResponse.data || []);
      } catch (err) {
        console.error('Erro ao carregar dados iniciais:', err);
      }
    };

    fetchDadosIniciais();
  }, []);

  // Buscar cidades quando o estado for selecionado
  useEffect(() => {
    const fetchCidades = async () => {
      if (!filtros.estado) {
        setCidades([]);
        return;
      }

      try {
        const response = await axios.get(`/api/cidades/${filtros.estado}`);
        setCidades(response.data || []);
      } catch (err) {
        console.error('Erro ao carregar cidades:', err);
      }
    };

    fetchCidades();
  }, [filtros.estado]);

  // Buscar médicos quando os filtros ou paginação mudarem
  useEffect(() => {
    fetchMedicos();
  }, [paginacao.paginaAtual, filtros]);

  // Lidar com a pesquisa
  const handleSearch = (e) => {
    e.preventDefault();
    setPaginacao(prev => ({ ...prev, paginaAtual: 1 }));
    fetchMedicos();
  };

  // Lidar com mudanças nos filtros
  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({
      ...prev,
      [name]: value
    }));

    // Resetar cidade se o estado mudar
    if (name === 'estado') {
      setFiltros(prev => ({
        ...prev,
        cidade: ''
      }));
    }
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    setPaginacao(prev => ({ ...prev, paginaAtual: 1 }));
    fetchMedicos();
    setShowFilters(false);
  };

  // Limpar filtros
  const limparFiltros = () => {
    setFiltros({
      especialidade: '',
      cidade: '',
      estado: ''
    });
    setPaginacao(prev => ({ ...prev, paginaAtual: 1 }));
    fetchMedicos();
    setShowFilters(false);
  };

  // Mudar página
  const mudarPagina = (pagina) => {
    if (pagina < 1 || pagina > paginacao.paginas) return;
    setPaginacao(prev => ({ ...prev, paginaAtual: pagina }));
  };

  // Lidar com sucesso da importação
  const handleImportSuccess = (resultado) => {
    console.log('Importação concluída:', resultado);
    // Recarregar a lista de médicos
    fetchMedicos();
    // Mostrar notificação de sucesso
    alert(`Importação concluída! ${resultado.criados} médicos criados, ${resultado.atualizados} atualizados.`);
  };

  // Sincronizar com Google Sheets
  const handleSyncSheets = async () => {
    if (syncingSheets) return;
    
    setSyncingSheets(true);
    try {
      const response = await axios.post('/api/medicos/import/sync-sheets');
      
      if (response.data.success) {
        alert(`Sincronização concluída! ${response.data.criados} médicos criados, ${response.data.atualizados} atualizados.`);
        fetchMedicos(); // Recarregar lista
      } else {
        alert('Erro na sincronização: ' + (response.data.error || 'Erro desconhecido'));
      }
    } catch (error) {
      console.error('Erro na sincronização:', error);
      alert('Erro ao sincronizar com Google Sheets: ' + (error.response?.data?.error || error.message));
    } finally {
      setSyncingSheets(false);
    }
  };

  return (
    <div className="medicos-container">
      <div className="medicos-header">
        <h1><FaUserMd /> Médicos</h1>
        <div className="header-actions">
          <button 
            className="btn-import"
            onClick={() => setShowImportModal(true)}
            title="Importar médicos de planilha"
          >
            <FaUpload /> Importar Planilha
          </button>
          <button 
            className="btn-sync"
            onClick={handleSyncSheets}
            disabled={syncingSheets}
            title="Sincronizar com Google Sheets"
          >
            <FaSync className={syncingSheets ? 'spinning' : ''} /> 
            {syncingSheets ? 'Sincronizando...' : 'Sync Google Sheets'}
          </button>
          <Link to="/medicos/novo" className="btn-novo-medico">
            <FaPlus /> Novo Médico
          </Link>
        </div>
      </div>

      <div className="medicos-actions">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Buscar médicos por nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit" className="btn-search">
              <FaSearch />
            </button>
          </div>
        </form>

        <button 
          className="btn-filter" 
          onClick={() => setShowFilters(!showFilters)}
        >
          <FaFilter /> Filtros
        </button>
      </div>

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-row">
            <div className="filter-group">
              <label>Especialidade</label>
              <select 
                name="especialidade" 
                value={filtros.especialidade} 
                onChange={handleFiltroChange}
              >
                <option value="">Todas</option>
                {especialidades.map((esp) => (
                  <option key={esp._id || esp} value={esp.nome || esp}>
                    {esp.nome || esp}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Estado</label>
              <select 
                name="estado" 
                value={filtros.estado} 
                onChange={handleFiltroChange}
              >
                <option value="">Todos</option>
                {estados.map((estado) => (
                  <option key={estado.sigla || estado} value={estado.sigla || estado}>
                    {estado.nome || estado}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Cidade</label>
              <select 
                name="cidade" 
                value={filtros.cidade} 
                onChange={handleFiltroChange}
                disabled={!filtros.estado}
              >
                <option value="">
                  {!filtros.estado ? 'Selecione um estado primeiro' : 'Todas'}
                </option>
                {cidades.map((cidade) => (
                  <option key={cidade.nome || cidade} value={cidade.nome || cidade}>
                    {cidade.nome || cidade}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="filter-actions">
            <button onClick={limparFiltros} className="btn-limpar">
              Limpar Filtros
            </button>
            <button onClick={aplicarFiltros} className="btn-aplicar">
              Aplicar Filtros
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="loading-container">
          <p>Carregando médicos...</p>
        </div>
      ) : error ? (
        <div className="error-container">
          <p>{error}</p>
          <button onClick={fetchMedicos}>Tentar Novamente</button>
        </div>
      ) : medicos.length === 0 ? (
        <div className="no-data-message">
          <p>Nenhum médico encontrado. Tente ajustar os filtros ou adicione um novo médico.</p>
        </div>
      ) : (
        <div className="medicos-list">
          {medicos.map((medico) => (
            <div key={medico._id} className="medico-card">
              <div className="medico-info">
                <h3>{medico.nome}</h3>
                <div className="medico-details">
                  <p className="medico-crm">
                    <strong>CRM:</strong> {medico.crm}
                  </p>
                  <p className="medico-especialidade">
                    <strong>Especialidade:</strong> {medico.especialidade}
                  </p>
                  <p className="medico-local">
                    <strong>Localização:</strong> {medico.cidade}/{medico.estado}
                  </p>
                  <p className="medico-contato">
                    <strong>Contato:</strong> {medico.telefone} | {medico.email}
                  </p>
                </div>
              </div>
              <div className="medico-actions">
                <Link to={`/medicos/${medico._id}`} className="btn-ver">
                  <FaEye /> Ver Detalhes
                </Link>
                <div className="dropdown">
                  <button className="btn-dropdown">
                    <FaEllipsisV />
                  </button>
                  <div className="dropdown-content">
                    <Link to={`/medicos/${medico._id}/editar`}>Editar</Link>
                    <button onClick={() => {}}>Excluir</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && medicos.length > 0 && (
        <div className="pagination">
          <button 
            onClick={() => mudarPagina(paginacao.paginaAtual - 1)}
            disabled={paginacao.paginaAtual === 1}
          >
            Anterior
          </button>
          <span>
            Página {paginacao.paginaAtual} de {paginacao.paginas}
          </span>
          <button 
            onClick={() => mudarPagina(paginacao.paginaAtual + 1)}
            disabled={paginacao.paginaAtual === paginacao.paginas}
          >
            Próxima
          </button>
        </div>
      )}

      {/* Modal de Importação */}
      <ImportacaoMedicoModal
        open={showImportModal}
        onClose={() => setShowImportModal(false)}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default Medicos;