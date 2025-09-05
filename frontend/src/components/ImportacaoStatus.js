import React from 'react';
import './ImportacaoStatus.css';
import { FaCheckCircle, FaExclamationTriangle, FaSpinner, FaFileDownload } from 'react-icons/fa';

const ImportacaoStatus = ({ status, resultado, onDownloadErros }) => {
  // Status possíveis: 'processando', 'concluido', 'erro'
  
  const renderIcone = () => {
    switch (status) {
      case 'processando':
        return <FaSpinner className="icone-girando" />;
      case 'concluido':
        return <FaCheckCircle className="icone-sucesso" />;
      case 'erro':
        return <FaExclamationTriangle className="icone-erro" />;
      default:
        return null;
    }
  };
  
  const renderMensagem = () => {
    switch (status) {
      case 'processando':
        return (
          <div className="mensagem-status">
            <h3>Processando importação...</h3>
            <p>Isso pode levar alguns minutos dependendo do tamanho do arquivo.</p>
            {resultado?.progresso && (
              <div className="barra-progresso-container">
                <div className="barra-progresso">
                  <div 
                    className="barra-progresso-preenchimento" 
                    style={{ width: `${resultado.progresso}%` }}
                  ></div>
                </div>
                <span className="porcentagem-progresso">{resultado.progresso}%</span>
              </div>
            )}
          </div>
        );
      case 'concluido':
        return (
          <div className="mensagem-status">
            <h3>Importação concluída com sucesso!</h3>
            <div className="estatisticas-importacao">
              <div className="estatistica">
                <span className="estatistica-valor">{resultado?.adicionados || 0}</span>
                <span className="estatistica-label">Adicionados</span>
              </div>
              <div className="estatistica">
                <span className="estatistica-valor">{resultado?.atualizados || 0}</span>
                <span className="estatistica-label">Atualizados</span>
              </div>
              <div className="estatistica">
                <span className="estatistica-valor">{resultado?.erros || 0}</span>
                <span className="estatistica-label">Erros</span>
              </div>
              <div className="estatistica">
                <span className="estatistica-valor">{resultado?.total || 0}</span>
                <span className="estatistica-label">Total</span>
              </div>
            </div>
            {resultado?.erros > 0 && (
              <button className="btn-download-erros" onClick={onDownloadErros}>
                <FaFileDownload /> Baixar relatório de erros
              </button>
            )}
          </div>
        );
      case 'erro':
        return (
          <div className="mensagem-status">
            <h3>Erro na importação</h3>
            <p className="mensagem-erro">{resultado?.mensagem || 'Ocorreu um erro durante o processamento da importação.'}</p>
            {resultado?.erros > 0 && (
              <button className="btn-download-erros" onClick={onDownloadErros}>
                <FaFileDownload /> Baixar relatório de erros
              </button>
            )}
          </div>
        );
      default:
        return null;
    }
  };
  
  return (
    <div className={`importacao-status status-${status}`}>
      <div className="icone-status">
        {renderIcone()}
      </div>
      {renderMensagem()}
    </div>
  );
};

export default ImportacaoStatus;