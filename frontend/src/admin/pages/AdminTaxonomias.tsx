import React, { useState } from 'react';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  SortingState,
} from '@tanstack/react-table';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';

type Taxonomia = {
  id: string;
  nome: string;
  tipo: string;
  descricao: string;
  status: 'ativo' | 'inativo';
  createdAt: string;
};

// Dados de exemplo para desenvolvimento
const taxonomiasMock: Taxonomia[] = [
  {
    id: '1',
    nome: 'Cardiologia',
    tipo: 'Especialidade',
    descricao: 'Especialidade médica que trata de doenças do coração',
    status: 'ativo',
    createdAt: '2023-01-10T08:30:00Z',
  },
  {
    id: '2',
    nome: 'Neurologia',
    tipo: 'Especialidade',
    descricao: 'Especialidade médica que trata de doenças do sistema nervoso',
    status: 'ativo',
    createdAt: '2023-01-12T09:45:00Z',
  },
  {
    id: '3',
    nome: 'Hospitalar',
    tipo: 'Segmento',
    descricao: 'Segmento de clientes do tipo hospital',
    status: 'ativo',
    createdAt: '2023-01-15T14:20:00Z',
  },
  {
    id: '4',
    nome: 'Clínica',
    tipo: 'Segmento',
    descricao: 'Segmento de clientes do tipo clínica médica',
    status: 'ativo',
    createdAt: '2023-01-18T11:10:00Z',
  },
  {
    id: '5',
    nome: 'Em andamento',
    tipo: 'Status Oportunidade',
    descricao: 'Status para oportunidades em andamento',
    status: 'ativo',
    createdAt: '2023-01-20T10:00:00Z',
  },
];

const columnHelper = createColumnHelper<Taxonomia>();

const AdminTaxonomias: React.FC = () => {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [data] = useState<Taxonomia[]>(() => [...taxonomiasMock]);

  const columns = [
    columnHelper.accessor('nome', {
      header: 'Nome',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('tipo', {
      header: 'Tipo',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('descricao', {
      header: 'Descrição',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${info.getValue() === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
        >
          {info.getValue() === 'ativo' ? 'Ativo' : 'Inativo'}
        </span>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Data de Cadastro',
      cell: (info) => new Date(info.getValue()).toLocaleDateString('pt-BR'),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Ações',
      cell: (info) => (
        <div className="flex space-x-2">
          <button
            onClick={() => console.log('Editar', info.row.original.id)}
            className="p-1 text-blue-600 hover:text-blue-800"
          >
            <FaEdit />
          </button>
          <button
            onClick={() => console.log('Excluir', info.row.original.id)}
            className="p-1 text-red-600 hover:text-red-800"
          >
            <FaTrash />
          </button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Gerenciar Taxonomias</h1>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center space-x-2"
          onClick={() => console.log('Adicionar nova taxonomia')}
        >
          <FaPlus size={14} />
          <span>Nova Taxonomia</span>
        </button>
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
                  {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, data.length)}
                </span>{' '}
                de <span className="font-medium">{data.length}</span> resultados
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

export default AdminTaxonomias;