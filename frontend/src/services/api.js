// Configuração da API Backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Função para fazer requisições HTTP
async function apiRequest(endpoint, options = {}) {
    const token = localStorage.getItem('auth-token');

    const config = {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers,
        },
    };

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

        // Se não autenticado, limpar token e redirecionar
        if (response.status === 401) {
            localStorage.removeItem('auth-token');
            window.location.href = '/login';
            throw new Error('Não autorizado');
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Erro na requisição');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// ========== AUTENTICAÇÃO ==========

export const authAPI = {
    login: async (email, senha) => {
        const data = await apiRequest('/api/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, senha }),
        });

        // Salvar token
        if (data.token) {
            localStorage.setItem('auth-token', data.token);
        }

        return data;
    },

    register: async (userData) => {
        return await apiRequest('/api/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData),
        });
    },

    getMe: async () => {
        return await apiRequest('/api/auth/me');
    },

    forgotPassword: async (email) => {
        return await apiRequest('/api/auth/forgot-password', {
            method: 'POST',
            body: JSON.stringify({ email }),
        });
    },

    resetPassword: async (token, novaSenha) => {
        return await apiRequest('/api/auth/reset-password', {
            method: 'POST',
            body: JSON.stringify({ token, novaSenha }),
        });
    },

    logout: () => {
        localStorage.removeItem('auth-token');
    },
};

// ========== USUÁRIOS ==========

export const usuariosAPI = {
    getAll: async () => {
        return await apiRequest('/api/usuarios');
    },

    getById: async (id) => {
        return await apiRequest(`/api/usuarios/${id}`);
    },

    update: async (id, userData) => {
        return await apiRequest(`/api/usuarios/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData),
        });
    },

    updateRole: async (id, nivel_acesso) => {
        return await apiRequest(`/api/usuarios/${id}/role`, {
            method: 'PUT',
            body: JSON.stringify({ nivel_acesso }),
        });
    },

    updateStatus: async (id, ativo) => {
        return await apiRequest(`/api/usuarios/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ ativo }),
        });
    },

    delete: async (id) => {
        return await apiRequest(`/api/usuarios/${id}`, {
            method: 'DELETE',
        });
    },
};

// ========== MÁQUINAS ==========

export const maquinasAPI = {
    getAll: async () => {
        return await apiRequest('/api/maquinas');
    },

    getById: async (id) => {
        return await apiRequest(`/api/maquinas/${id}`);
    },

    create: async (maquinaData) => {
        return await apiRequest('/api/maquinas', {
            method: 'POST',
            body: JSON.stringify(maquinaData),
        });
    },

    update: async (id, maquinaData) => {
        return await apiRequest(`/api/maquinas/${id}`, {
            method: 'PUT',
            body: JSON.stringify(maquinaData),
        });
    },

    delete: async (id) => {
        return await apiRequest(`/api/maquinas/${id}`, {
            method: 'DELETE',
        });
    },
};

// ========== LOCALIZAÇÕES ==========

export const localizacoesAPI = {
    // Vilas
    getVilas: async () => {
        return await apiRequest('/api/localizacoes/vilas');
    },

    createVila: async (nome) => {
        return await apiRequest('/api/localizacoes/vilas', {
            method: 'POST',
            body: JSON.stringify({ nome }),
        });
    },

    // Etapas
    getEtapas: async () => {
        return await apiRequest('/api/localizacoes/etapas');
    },

    createEtapa: async (nome) => {
        return await apiRequest('/api/localizacoes/etapas', {
            method: 'POST',
            body: JSON.stringify({ nome }),
        });
    },

    // Sub-Etapas
    getSubEtapas: async (etapa_id = null) => {
        const query = etapa_id ? `?etapa_id=${etapa_id}` : '';
        return await apiRequest(`/api/localizacoes/sub-etapas${query}`);
    },

    createSubEtapa: async (etapa_id, nome) => {
        return await apiRequest('/api/localizacoes/sub-etapas', {
            method: 'POST',
            body: JSON.stringify({ etapa_id, nome }),
        });
    },

    // Contas
    getContas: async () => {
        return await apiRequest('/api/localizacoes/contas');
    },

    createConta: async (nome) => {
        return await apiRequest('/api/localizacoes/contas', {
            method: 'POST',
            body: JSON.stringify({ nome }),
        });
    },

    // Sub-Contas
    getSubContas: async (conta_id = null) => {
        const query = conta_id ? `?conta_id=${conta_id}` : '';
        return await apiRequest(`/api/localizacoes/sub-contas${query}`);
    },

    createSubConta: async (conta_id, nome) => {
        return await apiRequest('/api/localizacoes/sub-contas', {
            method: 'POST',
            body: JSON.stringify({ conta_id, nome }),
        });
    },
};

// ========== APONTAMENTOS ==========

export const apontamentosAPI = {
    getAll: async (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        return await apiRequest(`/api/apontamentos${query ? '?' + query : ''}`);
    },

    getById: async (id) => {
        return await apiRequest(`/api/apontamentos/${id}`);
    },

    create: async (apontamentoData) => {
        return await apiRequest('/api/apontamentos', {
            method: 'POST',
            body: JSON.stringify(apontamentoData),
        });
    },

    update: async (id, apontamentoData) => {
        return await apiRequest(`/api/apontamentos/${id}`, {
            method: 'PUT',
            body: JSON.stringify(apontamentoData),
        });
    },

    updateStatus: async (id, status) => {
        return await apiRequest(`/api/apontamentos/${id}/status`, {
            method: 'PUT',
            body: JSON.stringify({ status }),
        });
    },

    delete: async (id) => {
        return await apiRequest(`/api/apontamentos/${id}`, {
            method: 'DELETE',
        });
    },

    getKPIs: async (filters = {}) => {
        const query = new URLSearchParams(filters).toString();
        return await apiRequest(`/api/apontamentos/stats/kpis${query ? '?' + query : ''}`);
    },
};

export default {
    auth: authAPI,
    usuarios: usuariosAPI,
    maquinas: maquinasAPI,
    localizacoes: localizacoesAPI,
    apontamentos: apontamentosAPI,
};
