import axios from 'axios';

// Configuração base da API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Instância do axios com configurações padrão
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para adicionar token de autenticação
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verificar se o token não está vazio ou malformado
      if (token.trim() && token !== 'null' && token !== 'undefined') {
        config.headers.Authorization = `Bearer ${token}`;
      } else {
        // Remover token inválido
        localStorage.removeItem('token');
        window.location.href = '/login';
        return Promise.reject(new Error('Token inválido'));
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para tratar respostas e erros
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401 || 
        error.message?.includes('jwt malformed') ||
        error.message?.includes('Token inválido')) {
      // Token expirado, inválido ou malformado
      localStorage.removeItem('token');
      console.log('Token inválido removido, redirecionando para login');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Serviços para o módulo Médicos Disparo
export const medicoDisparoService = {
  // Listar médicos com filtros
  listar: async (params = {}) => {
    const response = await api.get('/medicos-disparo', { params });
    return response.data;
  },

  // Obter médico por ID
  obterPorId: async (id) => {
    const response = await api.get(`/medicos-disparo/${id}`);
    return response.data;
  },

  // Criar novo médico
  criar: async (dados) => {
    const response = await api.post('/medicos-disparo', dados);
    return response.data;
  },

  // Atualizar médico
  atualizar: async (id, dados) => {
    const response = await api.put(`/medicos-disparo/${id}`, dados);
    return response.data;
  },

  // Excluir médico
  excluir: async (id) => {
    const response = await api.delete(`/medicos-disparo/${id}`);
    return response.data;
  },

  // Obter estatísticas
  obterEstatisticas: async () => {
    const response = await api.get('/medicos-disparo/estatisticas');
    return response.data;
  },

  // Exportar para disparo
  exportarParaDisparo: async (filtros = {}) => {
    const response = await api.get('/medicos-disparo/exportar', {
      params: filtros,
      responseType: 'blob'
    });
    return response;
  },

  // Ação em massa
  acaoEmMassa: async (acao, ids, dados = {}) => {
    const response = await api.post('/medicos-disparo/acao-massa', {
      acao,
      ids,
      ...dados
    });
    return response.data;
  },

  // Importar arquivo
  importarArquivo: async (arquivo, onProgress) => {
    const formData = new FormData();
    formData.append('file', arquivo);

    const response = await api.post('/medicos-disparo/importar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  },

  // Sincronizar planilha
  sincronizarPlanilha: async () => {
    const response = await api.post('/medicos-disparo/sincronizar');
    return response.data;
  },
};

// Serviços para disparo externo
export const disparoService = {
  // Obter contatos para disparo
  obterContatos: async (filtros = {}) => {
    const response = await api.get('/disparo/contatos', { params: filtros });
    return response.data;
  },

  // Obter especialidades
  obterEspecialidades: async () => {
    const response = await api.get('/disparo/especialidades');
    return response.data;
  },

  // Obter estatísticas públicas
  obterEstatisticasPublicas: async () => {
    const response = await api.get('/disparo/estatisticas');
    return response.data;
  },

  // Marcar contatos como enviados
  marcarEnviados: async (telefones) => {
    const response = await api.post('/disparo/marcar-enviado', { telefones });
    return response.data;
  },

  // Marcar contatos com falha
  marcarFalha: async (telefones, motivo) => {
    const response = await api.post('/disparo/marcar-falha', { telefones, motivo });
    return response.data;
  },
};

// Serviços gerais
export const authService = {
  // Login
  login: async (email, senha) => {
    const response = await api.post('/users/login', { email, senha });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  // Logout
  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },

  // Verificar se está autenticado
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },

  // Obter usuário atual
  getCurrentUser: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
};

// Utilitários
export const utils = {
  // Fazer download de arquivo blob
  downloadBlob: (blob, filename) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  // Formatar telefone para exibição
  formatarTelefone: (telefone) => {
    if (!telefone) return '';
    const cleaned = telefone.replace(/\D/g, '');
    
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (cleaned.length === 10) {
      return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
    }
    return telefone;
  },

  // Normalizar telefone para envio
  normalizarTelefone: (telefone) => {
    if (!telefone) return '';
    return telefone.replace(/\D/g, '');
  },

  // Formatar data
  formatarData: (data) => {
    if (!data) return '';
    return new Date(data).toLocaleDateString('pt-BR');
  },

  // Formatar data e hora
  formatarDataHora: (data) => {
    if (!data) return '';
    return new Date(data).toLocaleString('pt-BR');
  },
};

export default api;