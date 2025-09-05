import React, { useState, useEffect } from 'react';
import './MapeamentoColunas.css';

const MapeamentoColunas = ({ colunas, onMapeamentoChange, mapeamentoInicial = {} }) => {
  const [mapeamento, setMapeamento] = useState({});
  const [sugestoes, setSugestoes] = useState({});

  // Campos disponíveis no modelo Cliente
  const camposCliente = [
    { id: 'nome', label: 'Nome', obrigatorio: true },
    { id: 'email', label: 'Email', obrigatorio: false },
    { id: 'telefone', label: 'Telefone', obrigatorio: false },
    { id: 'tipo', label: 'Tipo', obrigatorio: false },
    { id: 'cnpj', label: 'CNPJ', obrigatorio: false },
    { id: 'endereco.cep', label: 'CEP', obrigatorio: false },
    { id: 'endereco.logradouro', label: 'Logradouro', obrigatorio: false },
    { id: 'endereco.numero', label: 'Número', obrigatorio: false },
    { id: 'endereco.complemento', label: 'Complemento', obrigatorio: false },
    { id: 'endereco.bairro', label: 'Bairro', obrigatorio: false },
    { id: 'endereco.cidade', label: 'Cidade', obrigatorio: false },
    { id: 'endereco.estado', label: 'Estado', obrigatorio: false },
    { id: 'contatos.0.nome', label: 'Nome do Contato', obrigatorio: false },
    { id: 'contatos.0.email', label: 'Email do Contato', obrigatorio: false },
    { id: 'contatos.0.telefone', label: 'Telefone do Contato', obrigatorio: false },
    { id: 'contatos.0.cargo', label: 'Cargo do Contato', obrigatorio: false },
    { id: 'observacoes', label: 'Observações', obrigatorio: false },
    { id: 'tags', label: 'Tags', obrigatorio: false },
    { id: 'status', label: 'Status', obrigatorio: false },
  ];

  // Inicializar mapeamento com valores iniciais ou sugestões
  useEffect(() => {
    if (Object.keys(mapeamentoInicial).length > 0) {
      setMapeamento(mapeamentoInicial);
    } else {
      gerarSugestoesMapeamento();
    }
  }, [colunas, mapeamentoInicial]);

  // Notificar componente pai quando o mapeamento mudar
  useEffect(() => {
    if (Object.keys(mapeamento).length > 0) {
      onMapeamentoChange(mapeamento);
    }
  }, [mapeamento, onMapeamentoChange]);

  // Gerar sugestões automáticas de mapeamento baseadas nos nomes das colunas
  const gerarSugestoesMapeamento = () => {
    const novoMapeamento = {};
    const novasSugestoes = {};
    
    // Normalizar nomes de colunas para comparação
    const normalizarTexto = (texto) => {
      return texto.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, "");
    };
    
    // Mapear colunas para campos do cliente baseado em similaridade
    colunas.forEach(coluna => {
      const colunaNormalizada = normalizarTexto(coluna);
      
      // Verificar correspondências exatas ou parciais
      const sugestoesCampo = camposCliente
        .filter(campo => {
          const campoNormalizado = normalizarTexto(campo.label);
          return colunaNormalizada.includes(campoNormalizado) || 
                 campoNormalizado.includes(colunaNormalizada) ||
                 colunaNormalizada === normalizarTexto(campo.id);
        })
        .map(campo => campo.id);
      
      // Se encontrou sugestões, usar a primeira como padrão
      if (sugestoesCampo.length > 0) {
        novoMapeamento[coluna] = sugestoesCampo[0];
        novasSugestoes[coluna] = sugestoesCampo;
      } else {
        novoMapeamento[coluna] = '';
        novasSugestoes[coluna] = [];
      }
    });
    
    setMapeamento(novoMapeamento);
    setSugestoes(novasSugestoes);
  };

  // Atualizar mapeamento quando o usuário selecionar um campo
  const handleMapeamentoChange = (coluna, campo) => {
    setMapeamento(prev => ({
      ...prev,
      [coluna]: campo
    }));
  };

  // Verificar se todos os campos obrigatórios estão mapeados
  const verificarCamposObrigatorios = () => {
    const camposObrigatorios = camposCliente.filter(campo => campo.obrigatorio).map(campo => campo.id);
    const camposMapeados = Object.values(mapeamento);
    
    return camposObrigatorios.every(campo => camposMapeados.includes(campo));
  };

  return (
    <div className="mapeamento-colunas">
      <h3>Mapeamento de Colunas</h3>
      <p className="mapeamento-instrucao">
        Associe cada coluna do seu arquivo a um campo correspondente no sistema.
        Os campos marcados com * são obrigatórios.
      </p>
      
      <div className="mapeamento-lista">
        {colunas.map((coluna, index) => (
          <div key={index} className="mapeamento-item">
            <div className="coluna-original">
              <strong>{coluna}</strong>
            </div>
            <div className="seta-mapeamento">→</div>
            <div className="campo-destino">
              <select
                value={mapeamento[coluna] || ''}
                onChange={(e) => handleMapeamentoChange(coluna, e.target.value)}
                className={!mapeamento[coluna] ? 'nao-mapeado' : ''}
              >
                <option value="">Não mapear</option>
                {camposCliente.map((campo) => (
                  <option 
                    key={campo.id} 
                    value={campo.id}
                    className={sugestoes[coluna]?.includes(campo.id) ? 'sugestao' : ''}
                  >
                    {campo.label}{campo.obrigatorio ? ' *' : ''}
                  </option>
                ))}
              </select>
              {sugestoes[coluna]?.length > 0 && mapeamento[coluna] === '' && (
                <div className="dica-sugestao">
                  Sugestão: {camposCliente.find(c => c.id === sugestoes[coluna][0])?.label}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {!verificarCamposObrigatorios() && (
        <div className="aviso-obrigatorios">
          Atenção: Todos os campos obrigatórios (*) precisam ser mapeados para continuar.
        </div>
      )}
    </div>
  );
};

export default MapeamentoColunas;