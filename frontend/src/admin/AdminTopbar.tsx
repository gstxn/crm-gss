import React from 'react';
import { Menu } from 'lucide-react';

const AdminTopbar: React.FC = () => {
  return (
    <header className="w-full h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 shadow-sm">
      <div className="flex items-center space-x-3">
        <button className="md:hidden p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
          <Menu size={20} />
        </button>
        <span className="text-lg font-semibold">Painel Admin</span>
      </div>
      <div className="flex items-center space-x-4 text-sm">
        {/* Placeholder para notificações ou usuário */}
        <span className="font-medium text-gray-700 dark:text-gray-300">admin@gsscrm.com</span>
      </div>
    </header>
  );
};

export default AdminTopbar;