import React, { useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
  FilterFn,
  getFilteredRowModel,
} from '@tanstack/react-table';
import { FaSearch, FaFilter } from 'react-icons/fa';

type LogEntry = {
  id: string;
  usuario: string;
  acao: string;
  entidade: string;
  detalhes: string;
  ip: string;
  timestamp: string;
  nivel: 'info' | 'warning' | 'error';
};

// Dados de exemplo para desenvolvimento
const logsMock: LogEntry[] = [
  {
    id: '1',
    usuario: 'admin@exemplo.com',
    acao: 'login',
    entidade: 'AdminUser',
    detalhes: 'Login bem-sucedido',
    ip: '192.168.1.100',
    timestamp: '2023-05-10T08:30:45Z',
    nivel: 'info',
  },
  {
    id: '2',
    usuario: 'admin@exemplo.com',
    acao: 'create',
    entidade: 'Medico',
    detalhes: 'Criou médico ID: 12345',
    ip: '192.168.1.100',
    timestamp: '2023-05-10T09:15:22Z',
    nivel: 'info',
  },
  {
    id: '3',
    usuario: 'gerente@exemplo.com',
    acao: 'update',
    entidade: 'Cliente',
    detalhes: 'Atualizou cliente ID: 54321',
    ip: '192.168.1.101',
    timestamp: '2023-05-10T10:45:33Z',
    nivel: 'info',
  },
  {
    id: '4',
    usuario: 'gerente@exemplo.com',
    acao: 'delete',
    entidade: 'Oportunidade',
    detalhes: 'Excluiu oportunidade ID: 98765',
    ip: '192.168.1.101',
    timestamp: '2023-05-10T11:22:18Z',
    nivel: 'warning',
  },
  {
    id: '5',
    usuario: 'admin@exemplo.com',
    acao: 'error',
    entidade: 'Sistema',
    detalhes: 'Erro ao processar pagamento',
    ip: '192.168.1.100',
    timestamp: '2023-05-10T14:05:12Z',
    nivel: 'error',
  },
  {
    id: '6',
    usuario: 'suporte@exemplo.com',
    acao: 'update',
    entidade: 'Configuração',
    detalhes: 'Alterou configurações de email',
    ip: '192.168.1.102',
    timestamp: '2023-05-10T15:30:45Z',
    nivel: 'info',
  },
  {
    id: '7',
    usuario: 'admin@exemplo.com',
    acao: 'create',
    entidade: 'AdminUser',
    detalhes: 'Criou usuário: suporte@exemplo.com',
    ip: '192.168.1.100',
    timestamp: '2023-05-10T16:12:33Z',
    nivel: 'warning',
  },
];

const columnHelper = createColumnHelper<LogEntry>();

const AdminLogs: React.FC = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [data] = useState<LogEntry[]>(() => [...logsMock]);
  const [globalFilter, setGlobalFilter] = useState('');
  const [nivelFilter, setNivelFilter] = useState<string>('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');

  // Função de filtro personalizada para nível
  const nivelFilterFn: FilterFn<LogEntry> = (row, _columnId, value) => {
    if (value === 'todos') return true;
    return row.original.nivel === value;
  }

  // Função de filtro personalizada para data
  const dateRangeFilterFn: FilterFn<LogEntry> = (row) => {
    if (!dataInicio && !dataFim) return true;

    const timestamp = new Date(row.original.timestamp);
    let passesFilter = true;

    if (dataInicio) {
      const startDate = new Date(dataInicio);
      passesFilter = passesFilter && timestamp >= startDate;
    }

    if (dataFim) {
      const endDate = new Date(dataFim);
      endDate.setHours(23, 59, 59, 999); // Fim do dia
      passesFilter = passesFilter && timestamp <= endDate;
    }

    return passesFilter;
  };

  const columns = [
    columnHelper.accessor('timestamp', {
      header: 'Data/Hora',
      cell: (info) => new Date(info.getValue()).toLocaleString('pt-BR'),
      filterFn: dateRangeFilterFn,
    }),
    columnHelper.accessor('usuario', {
      header: 'Usuário',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('acao', {
      header: 'Ação',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('entidade', {
      header: 'Entidade',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('detalhes', {
      header: 'Detalhes',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('ip', {
      header: 'IP',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('nivel', {
      header: 'Nível',
      cell: (info) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${
            info.getValue() === 'info'
              ? 'bg-blue-100 text-blue-800'
              : info.getValue() === 'warning'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {info.getValue() === 'info' ? 'Info' : info.getValue() === 'warning' ? 'Aviso' : 'Erro'}
        </span>
      ),
      filterFn: nivelFilterFn,
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      globalFilter,
      columnFilters: [
        {
          id: 'nivel',
          value: nivelFilter,
        },
        {
          id: 'timestamp',
          value: { dataInicio, dataFim },
        },
      ],
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    globalFilterFn: 'includesString',
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Logs do Sistema</h1>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-800 mb-4">Filtros</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <label htmlFor="globalFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Pesquisar
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                id="globalFilter"
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Buscar em todos os campos"
              />
            </div>
          </div>
          <div>
            <label htmlFor="nivelFilter" className="block text-sm font-medium text-gray-700 mb-1">
              Nível
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="text-gray-400" />
              </div>
              <select
                id="nivelFilter"
                value={nivelFilter}
                onChange={(e) => setNivelFilter(e.target.value)}
                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="todos">Todos</option>
                <option value="info">Info</option>
                <option value="warning">Aviso</option>
                <option value="error">Erro</option>
              </select>
            </div>
          </div>
          <div>
            <label htmlFor="dataInicio" className="block text-sm font-medium text-gray-700 mb-1">
              Data Inicial
            </label>
            <input
              type="date"
              id="dataInicio"
              value={dataInicio}
              onChange={(e) => setDataInicio(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="dataFim" className="block text-sm font-medium text-gray-700 mb-1">
              Data Final
            </label>
            <input
              type="date"
              id="dataFim"
              value={dataFim}
              onChange={(e) => setDataFim(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              {table.getHeaderGroups().map((headerGroup) => (
                <tr key={headerGroup.id}>
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      scope="col"
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <div className="flex items-center space-x-1">
                        <span>{flexRender(header.column.columnDef.header, header.getContext())}</span>
                        <span>
                          {{
                            asc: ' 🔼',
                            desc: ' 🔽',
                          }[header.column.getIsSorted() as string] ?? null}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {table.getRowModel().rows.length === 0 && (
          <div className="p-6 text-center">
            <p className="text-gray-500">Nenhum log encontrado com os filtros aplicados.</p>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3 sm:px-6">
          <div className="flex flex-1 justify-between sm:hidden">
            <button
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Próximo
            </button>
          </div>
          <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Mostrando <span className="font-medium">{table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1}</span> a{' '}
                <span className="font-medium">
                  {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}
                </span>{' '}
                de <span className="font-medium">{table.getFilteredRowModel().rows.length}</span> resultados
              </p>
            </div>
            <div>
              <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                <button
                  onClick={() => table.previousPage()}
                  disabled={!table.getCanPreviousPage()}
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => table.nextPage()}
                  disabled={!table.getCanNextPage()}
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                >
                  Próximo
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminLogs;