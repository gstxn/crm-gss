import React from 'react';
import './ImportacaoValidacao.css';
import { FaExclamationTriangle, FaInfoCircle } from 'react-icons/fa';

const ImportacaoValidacao = ({ validacoes, onIgnorarErro }) => {
  // Agrupar validações por tipo
  const erros = validacoes.filter(v => v.tipo === 'erro');
  const avisos = validacoes.filter(v => v.tipo === 'aviso');
  
  if (validacoes.length === 0) {
    return null;
  }
  
  return (
    <div className="importacao-validacao">
      <h3>Validação de Dados</h3>
      
      {erros.length > 0 && (
        <div className="validacao-secao erros">
          <h4>
            <FaExclamationTriangle /> Erros ({erros.length})
          </h4>
          <p className="validacao-info">
            Os seguintes erros precisam ser corrigidos antes de continuar:
          </p>
          <ul className="validacao-lista">
            {erros.map((erro, index) => (
              <li key={index} className="validacao-item">
                <div className="validacao-mensagem">
                  <strong>{erro.campo}:</strong> {erro.mensagem}
                </div>
                {erro.linhas && (
                  <div className="validacao-linhas">
                    Linhas afetadas: {erro.linhas.join(', ')}
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {avisos.length > 0 && (
        <div className="validacao-secao avisos">
          <h4>
            <FaInfoCircle /> Avisos ({avisos.length})
          </h4>
          <p className="validacao-info">
            Os seguintes avisos foram encontrados. Você pode ignorá-los, mas recomendamos verificar:
          </p>
          <ul className="validacao-lista">
            {avisos.map((aviso, index) => (
              <li key={index} className="validacao-item">
                <div className="validacao-mensagem">
                  <strong>{aviso.campo}:</strong> {aviso.mensagem}
                </div>
                {aviso.linhas && (
                  <div className="validacao-linhas">
                    Linhas afetadas: {aviso.linhas.join(', ')}
                  </div>
                )}
                <button 
                  className="btn-ignorar" 
                  onClick={() => onIgnorarErro(aviso.id)}
                >
                  Ignorar
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {erros.length === 0 && avisos.length === 0 && (
        <div className="validacao-sucesso">
          Nenhum problema encontrado nos dados. Você pode prosseguir com a importação.
        </div>
      )}
    </div>
  );
};

export default ImportacaoValidacao;