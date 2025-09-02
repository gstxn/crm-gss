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
const mockMedicos = [
  {
    id: '1',
    nome: 'Dr. João Silva',
    crm: '12345-SP',
    especialidade: 'Cardiologia',
    telefone: '(11) 98765-4321',
    email: 'joao.silva@exemplo.com',
    status: 'ativo',
    createdAt: '10/05/2023',
  },
  {
    id: '2',
    nome: 'Dra. Maria Oliveira',
    crm: '54321-SP',
    especialidade: 'Neurologia',
    telefone: '(11) 91234-5678',
    email: 'maria.oliveira@exemplo.com',
    status: 'ativo',
    createdAt: '15/06/2023',
  },
  {
    id: '3',
    nome: 'Dr. Carlos Santos',
    crm: '67890-RJ',
    especialidade: 'Ortopedia',
    telefone: '(21) 99876-5432',
    email: 'carlos.santos@exemplo.com',
    status: 'inativo',
    createdAt: '20/07/2023',
  },
  {
    id: '4',
    nome: 'Dra. Ana Pereira',
    crm: '09876-MG',
    especialidade: 'Pediatria',
    telefone: '(31) 98765-1234',
    email: 'ana.pereira@exemplo.com',
    status: 'ativo',
    createdAt: '25/08/2023',
  },
  {
    id: '5',
    nome: 'Dr. Roberto Almeida',
    crm: '13579-RS',
    especialidade: 'Dermatologia',
    telefone: '(51) 97531-2468',
    email: 'roberto.almeida@exemplo.com',
    status: 'ativo',
    createdAt: '30/09/2023',
  },
];

type Medico = {
  id: string;
  nome: string;
  crm: string;
  especialidade: string;
  telefone: string;
  email: string;
  status: string;
  createdAt: string;
};

const AdminMedicos: React.FC = () => {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [data] = useState<Medico[]>(() => [...mockMedicos]);

  const columnHelper = createColumnHelper<Medico>();

  const columns = [
    columnHelper.accessor('nome', {
      header: 'Nome',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('crm', {
      header: 'CRM',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('especialidade', {
      header: 'Especialidade',
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
            onClick={() => navigate(`/admin/medicos/${info.row.original.id}/edit`)}
            className="text-blue-600 hover:text-blue-800"
          >
            Editar
          </button>
          <button
            onClick={() => alert(`Excluir médico ${info.row.original.id}`)}
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
        <h1 className="text-2xl font-bold">Médicos</h1>
        <button
          onClick={() => navigate('/admin/medicos/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Novo Médico
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

export default AdminMedicos;