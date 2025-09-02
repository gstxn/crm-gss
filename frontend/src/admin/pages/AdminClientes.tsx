import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';

// Dados mockados para exemplo
const mockClientes = [
  {
    id: '1',
    nome: 'Empresa ABC Ltda',
    cnpj: '12.345.678/0001-90',
    segmento: 'Saúde',
    telefone: '(11) 3456-7890',
    email: 'contato@empresaabc.com',
    status: 'ativo',
    createdAt: '05/01/2023',
  },
  {
    id: '2',
    nome: 'Hospital São Lucas',
    cnpj: '23.456.789/0001-12',
    segmento: 'Hospitalar',
    telefone: '(11) 2345-6789',
    email: 'contato@saolucas.com',
    status: 'ativo',
    createdAt: '10/02/2023',
  },
  {
    id: '3',
    nome: 'Clínica Bem Estar',
    cnpj: '34.567.890/0001-23',
    segmento: 'Clínica',
    telefone: '(21) 3456-7890',
    email: 'contato@bemestar.com',
    status: 'inativo',
    createdAt: '15/03/2023',
  },
  {
    id: '4',
    nome: 'Laboratório Análises',
    cnpj: '45.678.901/0001-34',
    segmento: 'Laboratório',
    telefone: '(31) 4567-8901',
    email: 'contato@labanalises.com',
    status: 'ativo',
    createdAt: '20/04/2023',
  },
  {
    id: '5',
    nome: 'Centro Médico Saúde Total',
    cnpj: '56.789.012/0001-45',
    segmento: 'Centro Médico',
    telefone: '(41) 5678-9012',
    email: 'contato@saudetotal.com',
    status: 'ativo',
    createdAt: '25/05/2023',
  },
];

type Cliente = {
  id: string;
  nome: string;
  cnpj: string;
  segmento: string;
  telefone: string;
  email: string;
  status: string;
  createdAt: string;
};

const AdminClientes: React.FC = () => {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [data] = useState<Cliente[]>(() => [...mockClientes]);

  const columnHelper = createColumnHelper<Cliente>();

  const columns = [
    columnHelper.accessor('nome', {
      header: 'Nome',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('cnpj', {
      header: 'CNPJ',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('segmento', {
      header: 'Segmento',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('email', {
      header: 'Email',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('telefone', {
      header: 'Telefone',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => (
        <span
          className={`px-2 py-1 rounded-full text-xs ${info.getValue() === 'ativo' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
        >
          {info.getValue()}
        </span>
      ),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Data de Cadastro',
      cell: (info) => info.getValue(),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Ações',
      cell: (info) => (
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/admin/clientes/${info.row.original.id}/edit`)}
            className="text-blue-600 hover:text-blue-800"
          >
            Editar
          </button>
          <button
            onClick={() => alert(`Excluir cliente ${info.row.original.id}`)}
            className="text-red-600 hover:text-red-800"
          >
            Excluir
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
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Clientes</h1>
        <button
          onClick={() => navigate('/admin/clientes/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Novo Cliente
        </button>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {{
                      asc: ' 🔼',
                      desc: ' 🔽',
                    }[header.column.getIsSorted() as string] ?? null}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {table.getRowModel().rows.map((row) => (
              <tr key={row.id} className="hover:bg-gray-50">
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="px-6 py-4 whitespace-nowrap">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4">
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => table.setPageIndex(0)}
            disabled={!table.getCanPreviousPage()}
          >
            {'<<'}
          </button>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            {'<'}
          </button>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            {'>'}
          </button>
          <button
            className="px-3 py-1 border rounded disabled:opacity-50"
            onClick={() => table.setPageIndex(table.getPageCount() - 1)}
            disabled={!table.getCanNextPage()}
          >
            {'>>'}
          </button>
        </div>
        <span className="flex items-center gap-1">
          <div>Página</div>
          <strong>
            {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
          </strong>
        </span>
      </div>
    </div>
  );
};

export default AdminClientes;