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
const mockOportunidades = [
  {
    id: '1',
    titulo: 'Implementação Sistema Hospitalar',
    cliente: 'Hospital São Lucas',
    valor: 'R$ 150.000,00',
    status: 'Em andamento',
    responsavel: 'Ana Silva',
    medico: 'Dr. João Silva',
    createdAt: '15/01/2023',
  },
  {
    id: '2',
    titulo: 'Renovação Equipamentos Laboratório',
    cliente: 'Laboratório Análises',
    valor: 'R$ 75.000,00',
    status: 'Concluído',
    responsavel: 'Carlos Santos',
    medico: 'Dra. Maria Oliveira',
    createdAt: '20/02/2023',
  },
  {
    id: '3',
    titulo: 'Consultoria Gestão Clínica',
    cliente: 'Clínica Bem Estar',
    valor: 'R$ 45.000,00',
    status: 'Negociação',
    responsavel: 'Roberto Almeida',
    medico: 'Dr. Carlos Santos',
    createdAt: '10/03/2023',
  },
  {
    id: '4',
    titulo: 'Treinamento Equipe Médica',
    cliente: 'Centro Médico Saúde Total',
    valor: 'R$ 30.000,00',
    status: 'Proposta',
    responsavel: 'Juliana Lima',
    medico: 'Dra. Ana Pereira',
    createdAt: '05/04/2023',
  },
  {
    id: '5',
    titulo: 'Implementação Telemedicina',
    cliente: 'Empresa ABC Ltda',
    valor: 'R$ 120.000,00',
    status: 'Em andamento',
    responsavel: 'Marcos Oliveira',
    medico: 'Dr. Roberto Almeida',
    createdAt: '25/05/2023',
  },
];

type Oportunidade = {
  id: string;
  titulo: string;
  cliente: string;
  valor: string;
  status: string;
  responsavel: string;
  medico: string;
  createdAt: string;
};

const AdminOportunidades: React.FC = () => {
  const navigate = useNavigate();
  const [sorting, setSorting] = useState<SortingState>([]);
  const [data] = useState<Oportunidade[]>(() => [...mockOportunidades]);

  const columnHelper = createColumnHelper<Oportunidade>();

  const columns = [
    columnHelper.accessor('titulo', {
      header: 'Título',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('cliente', {
      header: 'Cliente',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('valor', {
      header: 'Valor',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('status', {
      header: 'Status',
      cell: (info) => {
        const status = info.getValue();
        let colorClass = '';
        
        switch(status) {
          case 'Em andamento':
            colorClass = 'bg-blue-100 text-blue-800';
            break;
          case 'Concluído':
            colorClass = 'bg-green-100 text-green-800';
            break;
          case 'Negociação':
            colorClass = 'bg-yellow-100 text-yellow-800';
            break;
          case 'Proposta':
            colorClass = 'bg-purple-100 text-purple-800';
            break;
          default:
            colorClass = 'bg-gray-100 text-gray-800';
        }
        
        return (
          <span className={`px-2 py-1 rounded-full text-xs ${colorClass}`}>
            {status}
          </span>
        );
      },
    }),
    columnHelper.accessor('responsavel', {
      header: 'Responsável',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('medico', {
      header: 'Médico',
      cell: (info) => info.getValue(),
    }),
    columnHelper.accessor('createdAt', {
      header: 'Data de Criação',
      cell: (info) => info.getValue(),
    }),
    columnHelper.display({
      id: 'actions',
      header: 'Ações',
      cell: (info) => (
        <div className="flex space-x-2">
          <button
            onClick={() => navigate(`/admin/oportunidades/${info.row.original.id}/edit`)}
            className="text-blue-600 hover:text-blue-800"
          >
            Editar
          </button>
          <button
            onClick={() => alert(`Excluir oportunidade ${info.row.original.id}`)}
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
        <h1 className="text-2xl font-bold">Oportunidades</h1>
        <button
          onClick={() => navigate('/admin/oportunidades/new')}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Nova Oportunidade
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

export default AdminOportunidades;