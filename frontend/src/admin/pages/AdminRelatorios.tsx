import React, { useState } from 'react';
import { FaDownload, FaSearch } from 'react-icons/fa';

type RelatorioOpcao = {
  id: string;
  nome: string;
  descricao: string;
  tipo: 'pdf' | 'excel' | 'csv';
};

const relatoriosDisponiveis: RelatorioOpcao[] = [
  {
    id: 'medicos',
    nome: 'Relatório de Médicos',
    descricao: 'Lista completa de médicos cadastrados com suas especialidades e status',
    tipo: 'pdf',
  },
  {
    id: 'clientes',
    nome: 'Relatório de Clientes',
    descricao: 'Lista de clientes com informações de contato e segmento',
    tipo: 'excel',
  },
  {
    id: 'oportunidades',
    nome: 'Relatório de Oportunidades',
    descricao: 'Resumo de oportunidades por status e valor total',
    tipo: 'pdf',
  },
  {
    id: 'oportunidades_detalhado',
    nome: 'Relatório Detalhado de Oportunidades',
    descricao: 'Informações detalhadas de todas as oportunidades incluindo histórico',
    tipo: 'excel',
  },
  {
    id: 'financeiro',
    nome: 'Relatório Financeiro',
    descricao: 'Resumo financeiro de oportunidades fechadas e em andamento',
    tipo: 'excel',
  },
  {
    id: 'atividades',
    nome: 'Relatório de Atividades',
    descricao: 'Registro de atividades dos usuários no sistema',
    tipo: 'csv',
  },
];

const AdminRelatorios: React.FC = () => {
  const [filtro, setFiltro] = useState('');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [relatorioSelecionado, setRelatorioSelecionado] = useState<string | null>(null);

  // Filtra os relatórios com base no texto de pesquisa
  const relatoriosFiltrados = relatoriosDisponiveis.filter((relatorio) =>
    relatorio.nome.toLowerCase().includes(filtro.toLowerCase()) ||
    relatorio.descricao.toLowerCase().includes(filtro.toLowerCase())
  );

  // Função para gerar o relatório
  const gerarRelatorio = () => {
    if (!relatorioSelecionado) {
      alert('Selecione um relatório para gerar');
      return;
    }

    const relatorio = relatoriosDisponiveis.find((r) => r.id === relatorioSelecionado);
    if (!relatorio) return;

    console.log(`Gerando relatório: ${relatorio.nome}`);
    console.log(`Tipo: ${relatorio.tipo}`);
    console.log(`Período: ${periodoInicio} a ${periodoFim}`);

    // Aqui seria implementada a chamada à API para gerar o relatório
    alert(`Relatório ${relatorio.nome} gerado com sucesso!`);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Relatórios</h1>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="filtro" className="block text-sm font-medium text-gray-700 mb-1">
              Pesquisar Relatório
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                id="filtro"
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Buscar por nome ou descrição"
              />
            </div>
          </div>
          <div>
            <label htmlFor="periodoInicio" className="block text-sm font-medium text-gray-700 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              id="periodoInicio"
              value={periodoInicio}
              onChange={(e) => setPeriodoInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="periodoFim" className="block text-sm font-medium text-gray-700 mb-1">
              Data Final
            </label>
            <input
              type="date"
              id="periodoFim"
              value={periodoFim}
              onChange={(e) => setPeriodoFim(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {relatoriosFiltrados.map((relatorio) => (
            <div
              key={relatorio.id}
              className={`border rounded-lg p-4 cursor-pointer transition-all ${relatorioSelecionado === relatorio.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
              onClick={() => setRelatorioSelecionado(relatorio.id)}
            >
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-medium text-gray-800">{relatorio.nome}</h3>
                <span
                  className={`px-2 py-1 rounded-full text-xs uppercase font-bold ${
                    relatorio.tipo === 'pdf'
                      ? 'bg-red-100 text-red-800'
                      : relatorio.tipo === 'excel'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {relatorio.tipo}
                </span>
              </div>
              <p className="text-sm text-gray-600 mt-2">{relatorio.descricao}</p>
            </div>
          ))}
        </div>

        {relatoriosFiltrados.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-gray-500">Nenhum relatório encontrado com os filtros aplicados.</p>
          </div>
        )}

        <div className="flex justify-end border-t border-gray-200 bg-gray-50 px-6 py-3">
          <button
            onClick={gerarRelatorio}
            disabled={!relatorioSelecionado}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FaDownload size={14} />
            <span>Gerar Relatório</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminRelatorios;