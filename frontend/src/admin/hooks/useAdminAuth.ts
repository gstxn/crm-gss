import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: string;
};

type UseAdminAuthReturn = {
  adminUser: AdminUser | null;
  adminLoading: boolean;
  adminError: string | null;
  adminLogin: (email: string, password: string) => Promise<void>;
  adminLogout: () => Promise<void>;
  adminIsAuthenticated: boolean;
};

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

export const useAdminAuth = (): UseAdminAuthReturn => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminLoading, setAdminLoading] = useState<boolean>(true);
  const [adminError, setAdminError] = useState<string | null>(null);
  const [adminIsAuthenticated, setAdminIsAuthenticated] = useState<boolean>(false);
  
  const navigate = useNavigate();

  // Configurar axios para incluir cookies em requisições
  axios.defaults.withCredentials = true;

  // Verificar se o admin está autenticado ao carregar
  useEffect(() => {
    const checkAdminAuth = async () => {
      try {
        setAdminLoading(true);
        const response = await axios.get(`${API_URL}/api/admin/auth/me`);
        
        if (response.data && response.data.user) {
          setAdminUser(response.data.user);
          setAdminIsAuthenticated(true);
        } else {
          setAdminIsAuthenticated(false);
          setAdminUser(null);
        }
      } catch (error) {
        setAdminIsAuthenticated(false);
        setAdminUser(null);
      } finally {
        setAdminLoading(false);
      }
    };

    checkAdminAuth();
  }, []);

  // Função para login do admin
  const adminLogin = useCallback(async (email: string, password: string) => {
    try {
      setAdminLoading(true);
      setAdminError(null);
      
      const response = await axios.post(`${API_URL}/api/admin/auth/login`, {
        email,
        password
      });

      if (response.data && response.data.user) {
        setAdminUser(response.data.user);
        setAdminIsAuthenticated(true);
        navigate('/admin');
      }
    } catch (error: any) {
      setAdminError(
        error.response?.data?.message || 
        'Falha na autenticação. Verifique suas credenciais.'
      );
      setAdminIsAuthenticated(false);
    } finally {
      setAdminLoading(false);
    }
  }, [navigate]);

  // Função para logout do admin
  const adminLogout = useCallback(async () => {
    try {
      setAdminLoading(true);
      await axios.post(`${API_URL}/api/admin/auth/logout`);
      setAdminUser(null);
      setAdminIsAuthenticated(false);
      navigate('/admin/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setAdminLoading(false);
    }
  }, [navigate]);

  return {
    adminUser,
    adminLoading,
    adminError,
    adminLogin,
    adminLogout,
    adminIsAuthenticated
  };
};