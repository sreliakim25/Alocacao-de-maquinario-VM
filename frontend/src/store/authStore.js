import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            error: null,
            loading: false,

            // Ação para limpar erros (faltava essa função!)
            clearError: () => set({ error: null }),

            // Login com email e senha (API REAL)
            login: async (email, password) => {
                set({ loading: true, error: null });

                try {
                    const data = await authAPI.login(email, password);

                    set({
                        user: data.user,
                        isAuthenticated: true,
                        loading: false,
                        error: null,
                    });

                    return true;

                } catch (error) {
                    set({
                        loading: false,
                        error: error.message || 'Erro ao fazer login',
                    });
                    return false;
                }
            },

            // Registrar novo usuário / Solicitar acesso (API REAL)
            register: async (userData) => {
                set({ loading: true, error: null });

                try {
                    await authAPI.register({
                        nome: userData.nome || userData.name,
                        email: userData.email,
                        nivel_acesso: userData.nivel_acesso,
                        conta_id: userData.conta_id || null,
                    });

                    set({ loading: false, error: null });
                    return true;

                } catch (error) {
                    set({
                        loading: false,
                        error: error.message || 'Erro ao enviar solicitação',
                    });
                    return false;
                }
            },

            // Solicitar recuperação de senha
            requestPasswordReset: async (email) => {
                set({ loading: true, error: null });

                try {
                    await authAPI.forgotPassword(email);

                    set({
                        loading: false,
                        error: null,
                    });

                    return true;

                } catch (error) {
                    set({
                        loading: false,
                        error: error.message || 'Erro ao solicitar recuperação',
                    });
                    return false;
                }
            },

            // Resetar senha
            resetPassword: async (token, newPassword) => {
                set({ loading: true, error: null });

                try {
                    await authAPI.resetPassword(token, newPassword);

                    set({
                        loading: false,
                        error: null,
                    });

                    return true;

                } catch (error) {
                    set({
                        loading: false,
                        error: error.message || 'Erro ao resetar senha',
                    });
                    return false;
                }
            },

            // Logout
            logout: () => {
                authAPI.logout();
                set({
                    user: null,
                    isAuthenticated: false,
                    error: null,
                });
            },

            // Verificar permissão baseada em role
            hasPermission: (requiredRole) => {
                const { user } = get();
                if (!user) return false;

                const roleHierarchy = {
                    'Desenvolvedor': 7,
                    'Administrador': 7, // Added Admin
                    'Gerente': 6,
                    'Líder': 5,
                    'Lider': 5, // Added normalized alias
                    'Supervisor': 4,
                    'Suprimentos': 3,
                    'Apontador': 2
                };

                const userLevel = roleHierarchy[user.role] || 0;
                const requiredLevel = roleHierarchy[requiredRole] || 0;

                return userLevel >= requiredLevel;
            },
        }),
        {
            name: 'auth-storage',
        }
    )
);

export default useAuthStore;
