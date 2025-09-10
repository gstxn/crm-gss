import React, { useState, useEffect } from 'react';
import { FaTimes, FaUpload, FaSync, FaCheck, FaExclamationTriangle, FaDownload } from 'react-icons/fa';
import axios from 'axios';

const ImportacaoMedicoModal = ({ open, onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('upload');
  const [file, setFile] = useState(null);
  const [spreadsheetId, setSpreadsheetId] = useState('');
  const [sheetName, setSheetName] = useState('Médicos');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [columnMapping, setColumnMapping] = useState({});
  const [availableColumns, setAvailableColumns] = useState([]);
  const [showMapping, setShowMapping] = useState(false);

  const requiredFields = {
    nome: 'Nome do Médico',
    crm: 'CRM',
    uf_crm: 'UF do CRM',
    cpf: 'CPF',
    email: 'Email'
  };

  const optionalFields = {
    telefone: 'Telefone',
    especialidade: 'Especialidade',
    cidade: 'Cidade',
    uf: 'UF',
    rqe: 'RQE',
    subespecialidades: 'Subespecialidades',
    hospitais_vinculo: 'Hospitais de Vínculo'
  };

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setFile(null);
    setSpreadsheetId('');
    setSheetName('Médicos');
    setLoading(false);
    setProgress(0);
    setStatus('');
    setError('');
    setSuccess('');
    setImportResult(null);
    setColumnMapping({});
    setAvailableColumns([]);
    setShowMapping(false);
    setActiveTab('upload');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      const allowedTypes = ['.xlsx', '.xls', '.csv'];
      const fileExtension = selectedFile.name.toLowerCase().substring(selectedFile.name.lastIndexOf('.'));
      
      if (allowedTypes.includes(fileExtension)) {
        setFile(selectedFile);
        setError('');
      } else {
        setError('Formato de arquivo não suportado. Use .xlsx, .xls ou .csv');
        setFile(null);
      }
    }
  };

  const handleUploadImport = async () => {
    if (!file) {
      setError('Selecione um arquivo para importar');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('Enviando arquivo...');
    setProgress(10);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('tipo', 'medicos');
    
    // Usar mapeamento personalizado ou mapeamento padrão
    const mapeamentoFinal = Object.keys(columnMapping).length > 0 
      ? columnMapping 
      : {
          nome: 'nome',
          crm: 'crm', 
          uf_crm: 'uf_crm',
          cpf: 'cpf',
          email: 'email'
        };
    
    formData.append('mapeamento', JSON.stringify(mapeamentoFinal));

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/medicos/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setProgress(Math.min(percentCompleted, 90));
        }
      });

      setProgress(100);
      setStatus('Importação concluída com sucesso!');
      setSuccess(`${response.data.processados} médicos processados com sucesso`);
      setImportResult(response.data);
      
      if (onSuccess) {
        onSuccess(response.data);
      }

      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao importar arquivo');
      setProgress(0);
      setStatus('');
      
      if (err.response?.data?.erros) {
        setImportResult(err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSheetsSync = async () => {
    if (!spreadsheetId.trim()) {
      setError('Informe o ID da planilha do Google Sheets');
      return;
    }

    setLoading(true);
    setError('');
    setStatus('Conectando ao Google Sheets...');
    setProgress(20);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/medicos/import/sync-sheets', {
        spreadsheetId: spreadsheetId.trim(),
        nomeAba: sheetName.trim(),
        mapeamento: columnMapping
      }, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      setProgress(100);
      setStatus('Sincronização concluída com sucesso!');
      setSuccess(`${response.data.processados} médicos sincronizados`);
      setImportResult(response.data);
      
      if (onSuccess) {
        onSuccess(response.data);
      }

      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao sincronizar com Google Sheets');
      setProgress(0);
      setStatus('');
      
      if (err.response?.data?.erros) {
        setImportResult(err.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const downloadErrorReport = () => {
    if (importResult?.erros) {
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Linha,Campo,Erro,Valor\n"
        + importResult.erros.map(erro => 
            `${erro.linha},${erro.campo},"${erro.mensagem}","${erro.valor || ''}"`
          ).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "erros_importacao_medicos.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content importacao-modal">
        <div className="modal-header">
          <h2>Importar Médicos</h2>
          <button className="btn-close" onClick={onClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          <div className="import-tabs">
            <button 
              className={`tab-button ${activeTab === 'upload' ? 'active' : ''}`}
              onClick={() => setActiveTab('upload')}
            >
              <FaUpload /> Arquivo Local
            </button>
            <button 
              className={`tab-button ${activeTab === 'sheets' ? 'active' : ''}`}
              onClick={() => setActiveTab('sheets')}
            >
              <FaSync /> Google Sheets
            </button>
          </div>

          {activeTab === 'upload' && (
            <div className="import-section">
              <div className="file-upload">
                <label htmlFor="file-input" className="file-upload-label">
                  <FaUpload />
                  {file ? file.name : 'Clique para selecionar arquivo'}
                </label>
                <input
                  id="file-input"
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="file-input"
                />
                <small className="file-help">
                  Formatos suportados: .xlsx, .xls, .csv (máx. 10MB)
                </small>
              </div>
            </div>
          )}

          {activeTab === 'sheets' && (
            <div className="import-section">
              <div className="form-group">
                <label>ID da Planilha Google Sheets:</label>
                <input
                  type="text"
                  value={spreadsheetId}
                  onChange={(e) => setSpreadsheetId(e.target.value)}
                  placeholder="Ex: 1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                  className="form-control"
                />
                <small className="form-help">
                  Encontre o ID na URL da planilha: docs.google.com/spreadsheets/d/[ID]/edit
                </small>
              </div>
              
              <div className="form-group">
                <label>Nome da Aba:</label>
                <input
                  type="text"
                  value={sheetName}
                  onChange={(e) => setSheetName(e.target.value)}
                  placeholder="Médicos"
                  className="form-control"
                />
              </div>
            </div>
          )}

          {/* Mapeamento de Colunas */}
          {showMapping && (
            <div className="column-mapping">
              <h3>Mapeamento de Colunas</h3>
              <div className="mapping-grid">
                <div className="required-fields">
                  <h4>Campos Obrigatórios</h4>
                  {Object.entries(requiredFields).map(([field, label]) => (
                    <div key={field} className="mapping-row">
                      <label>{label}:</label>
                      <select
                        value={columnMapping[field] || ''}
                        onChange={(e) => setColumnMapping(prev => ({
                          ...prev,
                          [field]: e.target.value
                        }))}
                        className="form-control"
                      >
                        <option value="">Selecione a coluna</option>
                        {availableColumns.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                
                <div className="optional-fields">
                  <h4>Campos Opcionais</h4>
                  {Object.entries(optionalFields).map(([field, label]) => (
                    <div key={field} className="mapping-row">
                      <label>{label}:</label>
                      <select
                        value={columnMapping[field] || ''}
                        onChange={(e) => setColumnMapping(prev => ({
                          ...prev,
                          [field]: e.target.value
                        }))}
                        className="form-control"
                      >
                        <option value="">Selecione a coluna</option>
                        {availableColumns.map(col => (
                          <option key={col} value={col}>{col}</option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {loading && (
            <div className="progress-section">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="progress-text">{status}</p>
            </div>
          )}

          {/* Messages */}
          {error && (
            <div className="alert alert-error">
              <FaExclamationTriangle />
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <FaCheck />
              {success}
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="import-results">
              <h3>Resultado da Importação</h3>
              <div className="results-grid">
                <div className="result-item success">
                  <span className="result-label">Processados:</span>
                  <span className="result-value">{importResult.processados || 0}</span>
                </div>
                <div className="result-item info">
                  <span className="result-label">Novos:</span>
                  <span className="result-value">{importResult.novos || 0}</span>
                </div>
                <div className="result-item warning">
                  <span className="result-label">Atualizados:</span>
                  <span className="result-value">{importResult.atualizados || 0}</span>
                </div>
                <div className="result-item error">
                  <span className="result-label">Erros:</span>
                  <span className="result-value">{importResult.erros?.length || 0}</span>
                </div>
              </div>
              
              {importResult.erros && importResult.erros.length > 0 && (
                <div className="error-actions">
                  <button 
                    className="btn btn-secondary"
                    onClick={downloadErrorReport}
                  >
                    <FaDownload /> Baixar Relatório de Erros
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </button>
          
          {activeTab === 'upload' ? (
            <button 
              className="btn btn-primary" 
              onClick={handleUploadImport}
              disabled={loading || !file}
            >
              {loading ? 'Importando...' : 'Importar Arquivo'}
            </button>
          ) : (
            <button 
              className="btn btn-primary" 
              onClick={handleSheetsSync}
              disabled={loading || !spreadsheetId.trim()}
            >
              {loading ? 'Sincronizando...' : 'Sincronizar Sheets'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportacaoMedicoModal;