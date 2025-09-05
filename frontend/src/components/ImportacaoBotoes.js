import React, { useState } from 'react';
import { FaFileImport, FaSync } from 'react-icons/fa';
import ImportacaoModal from './ImportacaoModal';
import './ImportacaoBotoes.css';

const ImportacaoBotoes = () => {
  const [modalAberto, setModalAberto] = useState(false);
  const [tipoImportacao, setTipoImportacao] = useState(null);
  
  const abrirModalPlanilha = () => {
    setTipoImportacao('planilha');
    setModalAberto(true);
  };
  
  const abrirModalGoogleSheets = () => {
    setTipoImportacao('googleSheets');
    setModalAberto(true);
  };
  
  const fecharModal = () => {
    setModalAberto(false);
  };
  
  return (
    <>
      <div className="importacao-botoes">
        <button 
          className="btn-importar" 
          onClick={abrirModalPlanilha}
          title="Importar clientes de arquivo CSV ou XLSX"
        >
          <FaFileImport /> Importar
        </button>
        <button 
          className="btn-sincronizar" 
          onClick={abrirModalGoogleSheets}
          title="Sincronizar com Google Sheets"
        >
          <FaSync /> Sincronizar
        </button>
      </div>
      
      <ImportacaoModal 
        isOpen={modalAberto} 
        onClose={fecharModal} 
        tipo={tipoImportacao} 
      />
    </>
  );
};

export default ImportacaoBotoes;