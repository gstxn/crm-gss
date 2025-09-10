import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUserMd, FaSearch, FaFilter, FaPlus, FaUpload, FaSync, FaDownload, FaCheck, FaTimes, FaTrash, FaClock } from 'react-icons/fa';
import ImportacaoDisparoModal from '../components/ImportacaoDisparoModal';
import './MedicosDisparo.css';

const MedicosDisparo = () => {
  const [medicos, setMedicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filtros, setFiltros] = useState({
    especialidades: [],
    status_contato: '',
    tem_email: ''
  });
  const [especialidadesDisponiveis, setEspecialidadesDisponiveis] = useState([]);
  const [selectedMedicos, setSelectedMedicos] = useState([]);
  const [paginacao, setPaginacao] = useState({
    total: 0,
    paginas: 0,
    paginaAtual: 1,
    porPagina: 20
  });
  const [showImportModal, setShowImportModal] = useState(false);
  const [syncingSheets, setSyncingSheets] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    novos: 0,
    fila: 0,
    enviados: 0,
    optOut: 0
  });

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
      if (filtros.especialidades.length > 0) {
        queryParams += `&especialidades=${filtros.especialidades.join(',')}`;
      }
      
      if (filtros.status_contato) {
        queryParams += `&status_contato=${filtros.status_contato}`;
      }
      
      if (filtros.tem_email) {
        queryParams += `&tem_email=${filtros.tem_email}`;
      }

      const response = await axios.get(`/api/medicos-disparo?${queryParams}`);
      
      setMedicos(response.data.medicos || []);
      setPaginacao({
        total: response.data.total || 0,
        paginas: response.data.paginas || 0,
        paginaAtual: response.data.paginaAtual || 1,
        porPagina: response.data.porPagina || 20
      });
    } catch (error) {
      console.error('Erro ao buscar médicos de disparo:', error);
      setError('Erro ao carregar médicos de disparo. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Buscar estatísticas
  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/medicos-disparo/estatisticas');
      setStats(response.data.data || response.data);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    }
  };

  // Buscar especialidades disponíveis
  const fetchEspecialidades = async () => {
    try {
      const response = await axios.get('/api/medicos-disparo/especialidades');
      setEspecialidadesDisponiveis(response.data.data || response.data);
    } catch (error) {
      console.error('Erro ao buscar especialidades:', error);
    }
  };

  useEffect(() => {
    fetchMedicos();
    fetchStats();
    fetchEspecialidades();
  }, [paginacao.paginaAtual, paginacao.porPagina]);

  // Handlers
  const handleSearch = (e) => {
    e.preventDefault();
    setPaginacao(prev => ({ ...prev, paginaAtual: 1 }));
    fetchMedicos();
  };

  const handleFiltroChange = (e) => {
    const { name, value } = e.target;
    setFiltros(prev => ({ ...prev, [name]: value }));
  };

  const handleEspecialidadeChange = (especialidade) => {
    setFiltros(prev => ({
      ...prev,
      especialidades: prev.especialidades.includes(especialidade)
        ? prev.especialidades.filter(esp => esp !== especialidade)
        : [...prev.especialidades, especialidade]
    }));
  };

  const aplicarFiltros = () => {
    setPaginacao(prev => ({ ...prev, paginaAtual: 1 }));
    fetchMedicos();
  };

  const limparFiltros = () => {
    setFiltros({
      especialidades: [],
      status_contato: '',
      tem_email: ''
    });
    setSearchTerm('');
    setPaginacao(prev => ({ ...prev, paginaAtual: 1 }));
    setTimeout(fetchMedicos, 100);
  };

  const mudarPagina = (novaPagina) => {
    if (novaPagina >= 1 && novaPagina <= paginacao.paginas) {
      setPaginacao(prev => ({ ...prev, paginaAtual: novaPagina }));
    }
  };

  // Seleção de médicos
  const toggleSelectMedico = (medicoId) => {
    setSelectedMedicos(prev => 
      prev.includes(medicoId)
        ? prev.filter(id => id !== medicoId)
        : [...prev, medicoId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedMedicos.length === medicos.length) {
      setSelectedMedicos([]);
    } else {
      setSelectedMedicos(medicos.map(m => m._id));
    }
  };

  // Ações em massa
  const handleBulkAction = async (action) => {
    if (selectedMedicos.length === 0) {
      alert('Selecione pelo menos um médico.');
      return;
    }

    try {
      await axios.post('/api/medicos-disparo/bulk-action', {
        action,
        ids: selectedMedicos
      });
      
      setSelectedMedicos([]);
      fetchMedicos();
      fetchStats();
      alert(`Ação "${action}" executada com sucesso em ${selectedMedicos.length} médicos.`);
    } catch (error) {
      console.error('Erro na ação em massa:', error);
      alert('Erro ao executar ação em massa.');
    }
  };

  // Exportar para disparo
  const handleExportDisparo = async () => {
    try {
      const response = await axios.get('/api/disparo/contatos?format=csv', {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contatos-disparo-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar contatos para disparo.');
    }
  };

  // Sincronizar planilha
  const handleSyncSheets = async () => {
    setSyncingSheets(true);
    try {
      await axios.post('/api/medicos-disparo/sync-sheets');
      fetchMedicos();
      fetchStats();
      alert('Sincronização com Google Sheets concluída com sucesso!');
    } catch (error) {
      console.error('Erro na sincronização:', error);
      alert('Erro ao sincronizar com Google Sheets.');
    } finally {
      setSyncingSheets(false);
    }
  };

  const handleImportSuccess = () => {
    fetchMedicos();
    fetchStats();
    setShowImportModal(false);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'novo': return <FaPlus className="status-novo" />;
      case 'fila': return <FaClock className="status-fila" />;
      case 'enviado': return <FaCheck className="status-enviado" />;
      case 'falha': return <FaTimes className="status-falha" />;
      case 'opt_out': return <FaTimes className="status-opt-out" />;
      default: return null;
    }
  };

  const getStatusLabel = (status) => {
    const labels = {
      novo: 'Novo',
      fila: 'Na Fila',
      enviado: 'Enviado',
      falha: 'Falha',
      opt_out: 'Opt-out'
    };
    return labels[status] || status;
  };

  return (
    <div className="medicos-disparo-container">
      <div className="page-header">
        <div className="header-content">
          <div className="header-title">
            <FaUserMd className="page-icon" />
            <h1>Médicos (Disparo)</h1>
          </div>
          <div className="header-stats">
            <div className="stat-item">
              <span className="stat-label">Total:</span>
              <span className="stat-value">{stats.total}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Novos:</span>
              <span className="stat-value stat-novo">{stats.novos}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Na Fila:</span>
              <span className="stat-value stat-fila">{stats.fila}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Enviados:</span>
              <span className="stat-value stat-enviado">{stats.enviados}</span>
            </div>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="btn-import"
            onClick={() => setShowImportModal(true)}
            title="Importar planilha XLSX/CSV"
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
          <button 
            className="btn-export"
            onClick={handleExportDisparo}
            title="Exportar contatos para disparo"
          >
            <FaDownload /> Exportar para Disparo
          </button>
        </div>
      </div>

      <div className="medicos-actions">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-container">
            <input
              type="text"
              placeholder="Buscar por nome ou telefone..."
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
              <label>Especialidades</label>
              <div className="especialidades-checkboxes">
                {especialidadesDisponiveis.map((esp) => (
                  <label key={esp} className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={filtros.especialidades.includes(esp)}
                      onChange={() => handleEspecialidadeChange(esp)}
                    />
                    {esp}
                  </label>
                ))}
              </div>
            </div>

            <div className="filter-group">
              <label>Status do Contato</label>
              <select 
                name="status_contato" 
                value={filtros.status_contato} 
                onChange={handleFiltroChange}
              >
                <option value="">Todos</option>
                <option value="novo">Novo</option>
                <option value="fila">Na Fila</option>
                <option value="enviado">Enviado</option>
                <option value="falha">Falha</option>
                <option value="opt_out">Opt-out</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Possui E-mail</label>
              <select 
                name="tem_email" 
                value={filtros.tem_email} 
                onChange={handleFiltroChange}
              >
                <option value="">Todos</option>
                <option value="true">Sim</option>
                <option value="false">Não</option>
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

      {/* Ações em massa */}
      {selectedMedicos.length > 0 && (
        <div className="bulk-actions">
          <div className="bulk-info">
            <span>{selectedMedicos.length} médicos selecionados</span>
          </div>
          <div className="bulk-buttons">
            <button 
              onClick={() => handleBulkAction('add_to_queue')}
              className="btn-bulk btn-fila"
            >
              <FaClock /> Adicionar à Fila
            </button>
            <button 
              onClick={() => handleBulkAction('mark_sent')}
              className="btn-bulk btn-enviado"
            >
              <FaCheck /> Marcar como Enviado
            </button>
            <button 
              onClick={() => handleBulkAction('mark_opt_out')}
              className="btn-bulk btn-opt-out"
            >
              <FaTimes /> Marcar Opt-out
            </button>
            <button 
              onClick={() => handleBulkAction('delete')}
              className="btn-bulk btn-delete"
            >
              <FaTrash /> Excluir Selecionados
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
          <p>Nenhum médico encontrado. Tente ajustar os filtros ou importe uma planilha.</p>
        </div>
      ) : (
        <div className="medicos-table-container">
          <table className="medicos-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={selectedMedicos.length === medicos.length && medicos.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Especialidades</th>
                <th>Status</th>
                <th>Última Interação</th>
                <th>Total Envios</th>
                <th>E-mail</th>
              </tr>
            </thead>
            <tbody>
              {medicos.map((medico) => (
                <tr key={medico._id} className={selectedMedicos.includes(medico._id) ? 'selected' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedMedicos.includes(medico._id)}
                      onChange={() => toggleSelectMedico(medico._id)}
                    />
                  </td>
                  <td className="nome-cell">
                    <strong>{medico.nome || 'N/A'}</strong>
                    {medico.canal && <div className="canal-tag">{medico.canal}</div>}
                  </td>
                  <td className="telefone-cell">{medico.telefone}</td>
                  <td className="especialidades-cell">
                    {medico.especialidades && medico.especialidades.length > 0 ? (
                      <div className="especialidades-tags">
                        {medico.especialidades.map((esp, index) => (
                          <span key={index} className="especialidade-tag">{esp}</span>
                        ))}
                      </div>
                    ) : (
                      <span className="no-data">N/A</span>
                    )}
                  </td>
                  <td className="status-cell">
                    <div className="status-container">
                      {getStatusIcon(medico.status_contato)}
                      <span>{getStatusLabel(medico.status_contato)}</span>
                    </div>
                  </td>
                  <td className="data-cell">
                    {medico.ultima_interacao_em 
                      ? new Date(medico.ultima_interacao_em).toLocaleDateString('pt-BR')
                      : 'N/A'
                    }
                  </td>
                  <td className="envios-cell">
                    <span className="envios-count">{medico.total_envios || 0}</span>
                  </td>
                  <td className="email-cell">
                    {medico.email ? (
                      <span className="email-text">{medico.email}</span>
                    ) : (
                      <span className="no-data">N/A</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
            Página {paginacao.paginaAtual} de {paginacao.paginas} ({paginacao.total} registros)
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
      <ImportacaoDisparoModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={handleImportSuccess}
      />
    </div>
  );
};

export default MedicosDisparo;