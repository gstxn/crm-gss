import React, { useState, useRef } from 'react';
import { FaUpload, FaTimes, FaCheck, FaExclamationTriangle, FaFileExcel, FaSync } from 'react-icons/fa';
import axios from 'axios';
import './ImportacaoDisparoModal.css';

const ImportacaoDisparoModal = ({ isOpen, onClose, onImportSuccess }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Mapping, 3: Processing
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [mapping, setMapping] = useState({});
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  // Campos obrigatórios e opcionais para mapeamento
  const requiredFields = [
    { key: 'nome', label: 'Nome', required: true },
    { key: 'telefone', label: 'Telefone', required: true }
  ];

  const optionalFields = [
    { key: 'email', label: 'Email', required: false },
    { key: 'especialidades', label: 'Especialidades', required: false },
    { key: 'crm', label: 'CRM', required: false },
    { key: 'endereco', label: 'Endereço', required: false },
    { key: 'cidade', label: 'Cidade', required: false },
    { key: 'estado', label: 'Estado', required: false },
    { key: 'observacoes', label: 'Observações', required: false }
  ];

  const allFields = [...requiredFields, ...optionalFields];

  // Reset modal state
  const resetModal = () => {
    setStep(1);
    setFile(null);
    setPreviewData([]);
    setHeaders([]);
    setMapping({});
    setProcessing(false);
    setResults(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile) {
      if (!selectedFile.name.match(/\.(xlsx|xls|csv)$/)) {
        setError('Por favor, selecione um arquivo Excel (.xlsx, .xls) ou CSV (.csv)');
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  // Process file and extract preview data
  const processFile = async () => {
    if (!file) return;

    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('arquivo', file); // Mudança: 'file' para 'arquivo' para corresponder ao backend

      const response = await axios.post('/api/medicos-disparo/preview-import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      const { headers: fileHeaders, preview } = response.data;
      setHeaders(fileHeaders);
      setPreviewData(preview);
      
      // Auto-map columns based on similarity
      const autoMapping = {};
      allFields.forEach(field => {
        const matchingHeader = fileHeaders.find(header => 
          header.toLowerCase().includes(field.key.toLowerCase()) ||
          field.label.toLowerCase().includes(header.toLowerCase()) ||
          (field.key === 'telefone' && (header.toLowerCase().includes('phone') || header.toLowerCase().includes('cel'))) ||
          (field.key === 'email' && header.toLowerCase().includes('mail')) ||
          (field.key === 'especialidades' && (header.toLowerCase().includes('especialidade') || header.toLowerCase().includes('specialty')))
        );
        if (matchingHeader) {
          autoMapping[field.key] = matchingHeader;
        }
      });
      
      setMapping(autoMapping);
      setStep(2);
    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      setError(error.response?.data?.message || 'Erro ao processar arquivo');
    } finally {
      setProcessing(false);
    }
  };

  // Handle mapping change
  const handleMappingChange = (fieldKey, headerValue) => {
    setMapping(prev => ({
      ...prev,
      [fieldKey]: headerValue
    }));
  };

  // Validate mapping
  const validateMapping = () => {
    const missingRequired = requiredFields.filter(field => !mapping[field.key]);
    return missingRequired.length === 0;
  };

  // Execute import
  const executeImport = async () => {
    if (!validateMapping()) {
      setError('Por favor, mapeie todos os campos obrigatórios');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('arquivo', file); // Mudança: 'file' para 'arquivo' para corresponder ao backend
      formData.append('mapping', JSON.stringify(mapping));

      const response = await axios.post('/api/medicos-disparo/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      setResults(response.data);
      setStep(3);
      
      // Notify parent component of successful import
      if (onImportSuccess) {
        onImportSuccess(response.data);
      }
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      setError(error.response?.data?.message || 'Erro ao importar dados');
    } finally {
      setProcessing(false);
    }
  };

  // Handle close
  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content importacao-modal">
        <div className="modal-header">
          <h2>
            <FaUpload className="icon" />
            Importar Médicos para Disparo
          </h2>
          <button className="close-btn" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {/* Step 1: File Upload */}
          {step === 1 && (
            <div className="upload-step">
              <div className="upload-area">
                <FaFileExcel className="upload-icon" />
                <h3>Selecione o arquivo para importação</h3>
                <p>Formatos aceitos: Excel (.xlsx, .xls) ou CSV (.csv)</p>
                
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  className="file-input"
                />
                
                {file && (
                  <div className="file-selected">
                    <FaCheck className="success-icon" />
                    <span>Arquivo selecionado: {file.name}</span>
                  </div>
                )}
              </div>
              
              <div className="step-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={handleClose}
                >
                  Cancelar
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={processFile}
                  disabled={!file || processing}
                >
                  {processing ? (
                    <><FaSync className="spinning" /> Processando...</>
                  ) : (
                    <>Próximo</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Column Mapping */}
          {step === 2 && (
            <div className="mapping-step">
              <h3>Mapeamento de Colunas</h3>
              <p>Associe as colunas do arquivo aos campos do sistema:</p>
              
              <div className="mapping-grid">
                {allFields.map(field => (
                  <div key={field.key} className="mapping-row">
                    <div className="field-info">
                      <label className={field.required ? 'required' : ''}>
                        {field.label}
                        {field.required && <span className="required-mark">*</span>}
                      </label>
                    </div>
                    <div className="field-mapping">
                      <select
                        value={mapping[field.key] || ''}
                        onChange={(e) => handleMappingChange(field.key, e.target.value)}
                        className={field.required && !mapping[field.key] ? 'error' : ''}
                      >
                        <option value="">-- Selecione uma coluna --</option>
                        {headers.map(header => (
                          <option key={header} value={header}>{header}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ))}
              </div>
              
              {previewData.length > 0 && (
                <div className="preview-section">
                  <h4>Prévia dos dados (primeiras 3 linhas):</h4>
                  <div className="preview-table">
                    <table>
                      <thead>
                        <tr>
                          {headers.map(header => (
                            <th key={header}>{header}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.slice(0, 3).map((row, index) => (
                          <tr key={index}>
                            {headers.map(header => (
                              <td key={header}>{row[header] || '-'}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
              
              <div className="step-actions">
                <button 
                  className="btn btn-secondary" 
                  onClick={() => setStep(1)}
                >
                  Voltar
                </button>
                <button 
                  className="btn btn-primary" 
                  onClick={executeImport}
                  disabled={!validateMapping() || processing}
                >
                  {processing ? (
                    <><FaSync className="spinning" /> Importando...</>
                  ) : (
                    <>Importar Dados</>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Results */}
          {step === 3 && results && (
            <div className="results-step">
              <div className="results-summary">
                <FaCheck className="success-icon large" />
                <h3>Importação Concluída!</h3>
                
                <div className="results-stats">
                  <div className="stat-item success">
                    <span className="stat-number">{results.processados || 0}</span>
                    <span className="stat-label">Processados</span>
                  </div>
                  <div className="stat-item success">
                    <span className="stat-number">{results.novos || 0}</span>
                    <span className="stat-label">Novos</span>
                  </div>
                  <div className="stat-item warning">
                    <span className="stat-number">{results.atualizados || 0}</span>
                    <span className="stat-label">Atualizados</span>
                  </div>
                  {results.erros > 0 && (
                    <div className="stat-item error">
                      <span className="stat-number">{results.erros}</span>
                      <span className="stat-label">Erros</span>
                    </div>
                  )}
                </div>
                
                {results.detalhes && results.detalhes.length > 0 && (
                  <div className="results-details">
                    <h4>Detalhes:</h4>
                    <ul>
                      {results.detalhes.map((detalhe, index) => (
                        <li key={index} className={detalhe.tipo}>
                          {detalhe.mensagem}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="step-actions">
                <button 
                  className="btn btn-primary" 
                  onClick={handleClose}
                >
                  Concluir
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="error-message">
              <FaExclamationTriangle className="error-icon" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportacaoDisparoModal;