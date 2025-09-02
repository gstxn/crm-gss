import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Users2, Stethoscope, Briefcase, FolderKanban, Layers, BarChart2, FileText, Settings, LogOut } from 'lucide-react';
import clsx from 'clsx';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const navItems: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: <Home size={18} /> },
  { to: '/admin/users', label: 'Usuários', icon: <Users2 size={18} /> },
  { to: '/admin/medicos', label: 'Médicos', icon: <Stethoscope size={18} /> },
  { to: '/admin/clientes', label: 'Clientes', icon: <Briefcase size={18} /> },
  { to: '/admin/oportunidades', label: 'Oportunidades', icon: <FolderKanban size={18} /> },
  { to: '/admin/taxonomias', label: 'Taxonomias', icon: <Layers size={18} /> },
  { to: '/admin/relatorios', label: 'Relatórios', icon: <BarChart2 size={18} /> },
  { to: '/admin/logs', label: 'Logs', icon: <FileText size={18} /> },
  { to: '/admin/config', label: 'Configurações', icon: <Settings size={18} /> },
];

const AdminSidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden md:block">
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-center h-16 border-b border-gray-200 dark:border-gray-700 text-lg font-semibold">
          Admin
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center px-3 py-2 rounded-md text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700',
                  isActive ? 'text-primary-600 dark:text-primary-400 bg-gray-100 dark:bg-gray-700' : 'text-gray-700 dark:text-gray-300'
                )
              }
            >
              {icon}
              <span className="ml-3">{label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t border-gray-200 dark:border-gray-700">
          <button className="flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md">
            <LogOut size={18} />
            <span className="ml-3">Sair</span>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar;