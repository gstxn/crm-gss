import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaUpload, FaSync, FaTimes, FaCheck, FaExclamationTriangle, FaDownload } from 'react-icons/fa';
import './ImportacaoModal.css';
import MapeamentoColunas from './MapeamentoColunas';
import ImportacaoStatus from './ImportacaoStatus';

const ImportacaoModal = ({ isOpen, onClose, tipo }) => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Mapeamento, 3: Processamento, 4: Resultado
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [headers, setHeaders] = useState([]);
  const [previewLinhas, setPreviewLinhas] = useState([]);
  const [mapeamento, setMapeamento] = useState({});
  const [sugestoesMapeamento, setSugestoesMapeamento] = useState({});
  const [presets, setPresets] = useState([]);
  const [presetSelecionado, setPresetSelecionado] = useState('');
  const [salvarPreset, setSalvarPreset] = useState(false);
  const [nomePreset, setNomePreset] = useState('');
  const [jobId, setJobId] = useState(null);
  const [resultado, setResultado] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progresso, setProgresso] = useState(0);
  
  // Campos do modelo Cliente
  const camposCliente = [
    { id: 'nome', label: 'Nome', obrigatorio: true },
    { id: 'email', label: 'Email', obrigatorio: false },
    { id: 'telefone', label: 'Telefone', obrigatorio: false },
    { id: 'documento', label: 'Documento (CPF/CNPJ)', obrigatorio: false },
    { id: 'empresa', label: 'Empresa', obrigatorio: false },
    { id: 'cargo', label: 'Cargo', obrigatorio: false },
    { id: 'cidade', label: 'Cidade', obrigatorio: false },
    { id: 'uf', label: 'UF', obrigatorio: false },
    { id: 'tags', label: 'Tags', obrigatorio: false },
    { id: 'tipo', label: 'Tipo', obrigatorio: false },
    { id: 'observacoes', label: 'Observações', obrigatorio: false }
  ];
  
  // Resetar o estado quando o modal é aberto
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFile(null);
      setFileName('');
      setHeaders([]);
      setPreviewLinhas([]);
      setMapeamento({});
      setSugestoesMapeamento({});
      setPresetSelecionado('');
      setSalvarPreset(false);
      setNomePreset('');
      setJobId(null);
      setResultado(null);
      setLoading(false);
      setError(null);
      setProgresso(0);
    }
  }, [isOpen]);
  
  // Verificar status do job de importação
  useEffect(() => {
    let intervalId;
    
    if (jobId && step === 3) {
      intervalId = setInterval(async () => {
        try {
          const response = await axios.get(`/api/clientes/import/status/${jobId}`);
          
          // Atualizar o progresso se disponível
          if (response.data.progresso) {
            setProgresso(response.data.progresso);
          }
          
          if (response.data.status === 'concluido' || response.data.status === 'erro') {
            clearInterval(intervalId);
            setResultado(response.data);
            setStep(4);
          }
        } catch (error) {
          console.error('Erro ao verificar status da importação:', error);
          setError('Erro ao verificar status da importação');
          clearInterval(intervalId);
        }
      }, 2000);
    }
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobId, step]);
  
  // Função para lidar com o upload do arquivo
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };
  
  // Função para enviar o arquivo para o servidor
  const handleUpload = async () => {
    if (!file) {
      setError('Selecione um arquivo para importar');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('arquivo', file);
      
      const response = await axios.post('/api/clientes/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setHeaders(response.data.headers);
      setPreviewLinhas(response.data.previewLinhas);
      setSugestoesMapeamento(response.data.sugestoesMapeamento);
      setPresets(response.data.presets);
      
      // Inicializar mapeamento com sugestões
      const mapeamentoInicial = {};
      for (const header of response.data.headers) {
        mapeamentoInicial[header] = response.data.sugestoesMapeamento[header] || '';
      }
      setMapeamento(mapeamentoInicial);
      
      setStep(2);
    } catch (error) {
      console.error('Erro ao fazer upload do arquivo:', error);
      setError(error.response?.data?.message || 'Erro ao fazer upload do arquivo');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para iniciar sincronização com Google Sheets
  const handleSyncGoogleSheets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.post('/api/clientes/sync-sheets', {
        usePreset: 'googleSheets'
      });
      
      setJobId(response.data.jobId);
      setStep(3);
    } catch (error) {
      console.error('Erro ao sincronizar com Google Sheets:', error);
      setError(error.response?.data?.message || 'Erro ao sincronizar com Google Sheets');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para carregar preset de mapeamento
  const handleCarregarPreset = (preset) => {
    setPresetSelecionado(preset);
    // Aqui você carregaria o preset do backend
    // Por enquanto, vamos simular
    if (preset === 'padraoCRM') {
      setMapeamento({
        'Nome': 'nome',
        'Email': 'email',
        'Telefone': 'telefone',
        'Documento': 'documento',
        'Empresa': 'empresa',
        'Cargo': 'cargo',
        'Cidade': 'cidade',
        'UF': 'uf',
        'Tags': 'tags'
      });
    }
  };
  
  // Função para atualizar o mapeamento
  const handleChangeMapeamento = (header, campo) => {
    setMapeamento(prev => ({
      ...prev,
      [header]: campo
    }));
  };
  
  // Função para processar a importação
  const handleProcessarImportacao = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('arquivo', file);
      formData.append('mapeamento', JSON.stringify(mapeamento));
      
      if (salvarPreset && nomePreset) {
        formData.append('salvarPreset', 'true');
        formData.append('nomePreset', nomePreset);
      }
      
      const response = await axios.post('/api/clientes/import', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setJobId(response.data.jobId);
      setStep(3);
    } catch (error) {
      console.error('Erro ao processar importação:', error);
      setError(error.response?.data?.message || 'Erro ao processar importação');
    } finally {
      setLoading(false);
    }
  };
  
  // Função para baixar CSV de erros
  const handleDownloadErros = () => {
    if (resultado?.urlErros) {
      window.open(resultado.urlErros, '_blank');
    }
  };
  
  // Renderizar o conteúdo do modal com base no passo atual
  const renderConteudo = () => {
    switch (step) {
      case 1: // Upload
        return (
          <div className="importacao-upload">
            {tipo === 'planilha' ? (
              <>
                <h2>Importar Clientes</h2>
                <p>Selecione um arquivo CSV ou XLSX para importar.</p>
                
                <div className="upload-area">
                  <input
                    type="file"
                    id="file-upload"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                    className="file-input"
                  />
                  <label htmlFor="file-upload" className="file-label">
                    <FaUpload />
                    {fileName ? fileName : 'Escolher arquivo'}
                  </label>
                </div>
                
                <div className="upload-info">
                  <p><strong>Formatos aceitos:</strong> CSV, XLSX</p>
                  <p><strong>Tamanho máximo:</strong> 20MB</p>
                  <p><strong>Primeira linha:</strong> Cabeçalhos</p>
                </div>
                
                <div className="modal-actions">
                  <button className="btn-cancelar" onClick={onClose}>
                    <FaTimes /> Cancelar
                  </button>
                  <button 
                    className="btn-continuar" 
                    onClick={handleUpload}
                    disabled={!file || loading}
                  >
                    {loading ? 'Processando...' : 'Continuar'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>Sincronizar com Google Sheets</h2>
                <p>Clique em "Sincronizar" para importar clientes do Google Sheets configurado.</p>
                
                <div className="sync-info">
                  <p><strong>Planilha:</strong> Configurada nas variáveis de ambiente</p>
                  <p><strong>Range:</strong> {process.env.REACT_APP_GSHEETS_RANGE_CLIENTES || 'Clientes!A2:I'}</p>
                  <p><strong>Primeira linha:</strong> Cabeçalhos</p>
                </div>
                
                <div className="modal-actions">
                  <button className="btn-cancelar" onClick={onClose}>
                    <FaTimes /> Cancelar
                  </button>
                  <button 
                    className="btn-sincronizar" 
                    onClick={handleSyncGoogleSheets}
                    disabled={loading}
                  >
                    {loading ? 'Processando...' : <><FaSync /> Sincronizar</>}
                  </button>
                </div>
              </>
            )}
            
            {error && <div className="error-message"><FaExclamationTriangle /> {error}</div>}
          </div>
        );
        
      case 2: // Mapeamento
        return (
          <div className="importacao-mapeamento">
            <h2>Mapeamento de Colunas</h2>
            <p>Associe as colunas da planilha aos campos do sistema.</p>
            
            <div className="presets-container">
              <label>Usar preset:</label>
              <select 
                value={presetSelecionado} 
                onChange={(e) => handleCarregarPreset(e.target.value)}
              >
                <option value="">Selecione um preset</option>
                {presets.map(preset => (
                  <option key={preset} value={preset}>{preset}</option>
                ))}
              </select>
            </div>
            
            <MapeamentoColunas
               colunas={headers}
               onMapeamentoChange={handleChangeMapeamento}
               mapeamentoInicial={mapeamento}
             />
            
            <div className="salvar-preset">
              <label>
                <input
                  type="checkbox"
                  checked={salvarPreset}
                  onChange={(e) => setSalvarPreset(e.target.checked)}
                />
                Salvar como preset
              </label>
              {salvarPreset && (
                <input
                  type="text"
                  placeholder="Nome do preset"
                  value={nomePreset}
                  onChange={(e) => setNomePreset(e.target.value)}
                />
              )}
            </div>
            
            <div className="modal-actions">
              <button className="btn-voltar" onClick={() => setStep(1)}>
                Voltar
              </button>
              <button 
                className="btn-importar" 
                onClick={handleProcessarImportacao}
                disabled={loading || !Object.values(mapeamento).includes('nome')}
              >
                {loading ? 'Processando...' : 'Importar'}
              </button>
            </div>
            
            {!Object.values(mapeamento).includes('nome') && (
              <div className="warning-message">
                <FaExclamationTriangle /> O campo "Nome" é obrigatório para importação.
              </div>
            )}
            
            {error && <div className="error-message"><FaExclamationTriangle /> {error}</div>}
          </div>
        );
        
      case 3: // Processamento
        return (
          <div className="importacao-processamento">
            <h2>Processando Importação</h2>
            <ImportacaoStatus 
               status="processando" 
               resultado={{ progresso: progresso }}
             />
          </div>
        );
        
      case 4: // Resultado
        return (
          <div className="importacao-resultado">
            <h2>Resultado da Importação</h2>
            
            <ImportacaoStatus 
              status={resultado?.status === 'concluido' ? 'concluido' : 'erro'}
              resultado={{
                total: resultado?.total || 0,
                adicionados: resultado?.criados || 0,
                atualizados: resultado?.atualizados || 0,
                ignorados: resultado?.ignorados || 0,
                erros: resultado?.erros?.length || 0,
                mensagemErro: resultado?.mensagemErro,
                progresso: progresso
              }}
              onDownloadErros={handleDownloadErros}
            />
            
            <div className="modal-actions">
              <button className="btn-fechar" onClick={onClose}>
                Fechar
              </button>
              <button className="btn-nova-importacao" onClick={() => setStep(1)}>
                Nova Importação
              </button>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div className="modal-overlay">
      <div className="importacao-modal">
        {renderConteudo()}
      </div>
    </div>
  );
};

export default ImportacaoModal;