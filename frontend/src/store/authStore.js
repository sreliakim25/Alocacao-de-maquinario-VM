import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isDevelopmentBypass: false,
            error: null,
            loading: false,

            // Login com email e senha (API REAL)
            login: async (email, password) => {
                set({ loading: true, error: null });

                try {
                    const data = await authAPI.login(email, password);

                    set({
                        user: data.user,
                        isAuthenticated: true,
                        isDevelopmentBypass: false,
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

            // Registrar novo usuário (API REAL)
            register: async (userData) => {
                set({ loading: true, error: null });

                try {
                    await authAPI.register({
                        nome: userData.name,
                        email: userData.email,
                        senha: userData.password,
                        telefone: userData.telefone,
                    });

                    set({
                        loading: false,
                        error: null,
                    });

                    return true;

                } catch (error) {
                    set({
                        loading: false,
                        error: error.message || 'Erro ao registrar',
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

            // Login bypass para desenvolvimento
            loginBypass: () => set({
                user: {
                    id: 'dev-bypass',
                    name: 'Desenvolvedor',
                    email: 'dev@bypass.com',
                    role: 'Desenvolvedor'
                },
                isAuthenticated: true,
                isDevelopmentBypass: true
            }),

            // Logout
            logout: () => {
                authAPI.logout();
                set({
                    user: null,
                    isAuthenticated: false,
                    isDevelopmentBypass: false,
                    error: null,
                });
            },

            // Verificar permissão baseada em role
            hasPermission: (requiredRole) => {
                const { user } = get();
                if (!user) return false;

                const roleHierarchy = {
                    'Desenvolvedor': 7,
                    'Gerente': 6,
                    'Líder': 5,
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
