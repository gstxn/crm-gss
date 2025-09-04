import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Importar estilos globais (já importados em index.css)

// Páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Oportunidades from './pages/Oportunidades';
import OportunidadeDetalhes from './pages/OportunidadeDetalhes';
import NovaOportunidade from './pages/NovaOportunidade';
import EditarOportunidade from './pages/EditarOportunidade';
import Medicos from './pages/Medicos';
import MedicoDetalhes from './pages/MedicoDetalhes';
import NovoMedico from './pages/NovoMedico';
import EditarMedico from './pages/EditarMedico';
import Clientes from './pages/Clientes';
import ClienteDetalhes from './pages/ClienteDetalhes';
import NovoCliente from './pages/NovoCliente';
import EditarCliente from './pages/EditarCliente';
import Relatorios from './pages/Relatorios';
import Mensagens from './pages/Mensagens/Mensagens';
import NovaMensagem from './pages/Mensagens/NovaMensagem';
import Register from './pages/Register';
import CompletedTasks from './pages/CompletedTasks';
import PendingTasks from './pages/PendingTasks';
import Kanban from './pages/Kanban';

// Admin imports
import AdminLayout from './admin/AdminLayout';
import AdminLogin from './admin/pages/AdminLogin';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminUsers from './admin/pages/AdminUsers';
import AdminMedicos from './admin/pages/AdminMedicos';
import AdminClientes from './admin/pages/AdminClientes';
import AdminOportunidades from './admin/pages/AdminOportunidades';
import AdminTaxonomias from './admin/pages/AdminTaxonomias';
import AdminConfiguracoes from './admin/pages/AdminConfiguracoes';
import AdminRelatorios from './admin/pages/AdminRelatorios';
import AdminLogs from './admin/pages/AdminLogs';
import AdminProtectedRoute from './admin/components/AdminProtectedRoute';

// Componentes
import Sidebar from './components/Sidebar';
import Header from './components/Header';

// Flag para habilitar/desabilitar painel admin (padrão true)
const ADMIN_ENABLED = process.env.REACT_APP_ADMIN_ENABLED !== 'false';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se o usuário está autenticado
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  // Componente de proteção de rotas
  const ProtectedRoute = ({ children }) => {
    if (loading) return <div className="loading">Carregando...</div>;
    if (!isAuthenticated) return <Navigate to="/login" />;
    return (
      <div className="app-container">
        <Sidebar />
        <div className="content-container">
          <Header />
          <main className="main-content">
            {children}
          </main>
        </div>
      </div>
    );
  };

  return (
    <div className="App">
      <Routes>
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/register" element={<Register setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/oportunidades" element={<ProtectedRoute><Oportunidades /></ProtectedRoute>} />
        <Route path="/oportunidades/nova" element={<ProtectedRoute><NovaOportunidade /></ProtectedRoute>} />
        <Route path="/oportunidades/:id" element={<ProtectedRoute><OportunidadeDetalhes /></ProtectedRoute>} />
        <Route path="/oportunidades/:id/editar" element={<ProtectedRoute><EditarOportunidade /></ProtectedRoute>} />
        <Route path="/medicos" element={<ProtectedRoute><Medicos /></ProtectedRoute>} />
        <Route path="/medicos/novo" element={<ProtectedRoute><NovoMedico /></ProtectedRoute>} />
        <Route path="/medicos/:id" element={<ProtectedRoute><MedicoDetalhes /></ProtectedRoute>} />
        <Route path="/medicos/:id/editar" element={<ProtectedRoute><EditarMedico /></ProtectedRoute>} />
        <Route path="/clientes" element={<ProtectedRoute><Clientes /></ProtectedRoute>} />
        <Route path="/clientes/novo" element={<ProtectedRoute><NovoCliente /></ProtectedRoute>} />
        <Route path="/clientes/:id" element={<ProtectedRoute><ClienteDetalhes /></ProtectedRoute>} />
        <Route path="/clientes/:id/editar" element={<ProtectedRoute><EditarCliente /></ProtectedRoute>} />
        <Route path="/mensagens" element={<ProtectedRoute><Mensagens /></ProtectedRoute>} />
        <Route path="/mensagens/nova" element={<ProtectedRoute><NovaMensagem /></ProtectedRoute>} />
        <Route path="/mensagens/responder/:id" element={<ProtectedRoute><NovaMensagem /></ProtectedRoute>} />
        <Route path="/relatorios" element={<ProtectedRoute><Relatorios /></ProtectedRoute>} />
        <Route path="/tarefas-concluidas" element={<ProtectedRoute><CompletedTasks /></ProtectedRoute>} />
        <Route path="/tarefas-pendentes" element={<ProtectedRoute><PendingTasks /></ProtectedRoute>} />
        <Route path="/kanban" element={<ProtectedRoute><Kanban /></ProtectedRoute>} />
        {ADMIN_ENABLED && <Route path="/admin/login" element={<AdminLogin />} />}
        {ADMIN_ENABLED && (
          <Route path="/admin/*" element={
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          }>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="medicos" element={<AdminMedicos />} />
            <Route path="clientes" element={<AdminClientes />} />
            <Route path="oportunidades" element={<AdminOportunidades />} />
            <Route path="taxonomias" element={<AdminTaxonomias />} />
            <Route path="configuracoes" element={<AdminConfiguracoes />} />
            <Route path="relatorios" element={<AdminRelatorios />} />
            <Route path="logs" element={<AdminLogs />} />
          </Route>
        )}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </div>
  );
}

export default App;