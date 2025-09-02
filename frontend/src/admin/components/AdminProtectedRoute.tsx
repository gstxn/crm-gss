import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAdminAuth } from '../hooks/useAdminAuth';

type AdminProtectedRouteProps = {
  children: React.ReactNode;
  requiredRole?: 'SUPERADMIN' | 'ADMIN' | 'EDITOR';
};

const AdminProtectedRoute: React.FC<AdminProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { adminIsAuthenticated, adminLoading, adminUser } = useAdminAuth();

  if (adminLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!adminIsAuthenticated) {
    return <Navigate to="/admin/login" />;
  }

  // Verificar permissão baseada em role, se necessário
  if (requiredRole && adminUser?.role) {
    const roleHierarchy = {
      'SUPERADMIN': 3,
      'ADMIN': 2,
      'EDITOR': 1
    };

    const userRoleLevel = roleHierarchy[adminUser.role as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="flex flex-col items-center justify-center h-screen">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Acesso Negado</h1>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      );
    }
  }

  return <>{children}</>;
};

export default AdminProtectedRoute;