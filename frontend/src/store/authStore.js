import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Mock de usuários para desenvolvimento (simula banco de dados)
let mockUsers = [
    {
        id: '1',
        name: 'Admin Sistema',
        email: 'admin@vianae moura.com',
        password: 'admin123', // Em produção, seria hash
        role: 'Desenvolvedor',
        ativo: true,
        telefone: '(11) 98765-4321',
        criado_em: new Date().toISOString(),
    },
    {
        id: '2',
        name: 'João Silva',
        email: 'joao@vianae moura.com',
        password: 'senha123',
        role: 'Gerente',
        ativo: true,
        telefone: '(11) 91234-5678',
        criado_em: new Date().toISOString(),
    },
];

const useAuthStore = create(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isDevelopmentBypass: false,
            error: null,
            loading: false,

            // Login com email e senha
            login: async (email, password) => {
                set({ loading: true, error: null });

                // Simular delay de rede
                await new Promise(resolve => setTimeout(resolve, 800));

                // Buscar usuário mock
                const user = mockUsers.find(u => u.email === email && u.password === password);

                if (user) {
                    if (!user.ativo) {
                        set({
                            loading: false,
                            error: 'Usuário inativo. Entre em contato com o administrador.'
                        });
                        return false;
                    }

                    const { password: _, ...userWithoutPassword } = user;
                    set({
                        user: userWithoutPassword,
                        isAuthenticated: true,
                        isDevelopmentBypass: false,
                        loading: false,
                        error: null
                    });
                    return true;
                } else {
                    set({
                        loading: false,
                        error: 'Email ou senha incorretos'
                    });
                    return false;
                }
            },

            // Registro de novo usuário
            register: async (userData) => {
                set({ loading: true, error: null });

                await new Promise(resolve => setTimeout(resolve, 1000));

                // Verificar se email já existe
                const emailExists = mockUsers.some(u => u.email === userData.email);
                if (emailExists) {
                    set({
                        loading: false,
                        error: 'Este email já está cadastrado'
                    });
                    return false;
                }

                // Criar novo usuário (inativo por padrão, aguardando aprovação)
                const newUser = {
                    id: String(mockUsers.length + 1),
                    name: userData.name,
                    email: userData.email,
                    password: userData.password, // Em produção, hash com bcrypt
                    telefone: userData.telefone || '',
                    role: 'Apontador', // Permissão padrão
                    ativo: false, // Inativo até admin aprovar
                    criado_em: new Date().toISOString(),
                };

                mockUsers.push(newUser);
                console.log('✅ Novo usuário cadastrado (aguardando aprovação):', newUser);

                set({ loading: false, error: null });
                return true;
            },

            // Solicitar recuperação de senha
            requestPasswordReset: async (email) => {
                set({ loading: true, error: null });

                await new Promise(resolve => setTimeout(resolve, 1000));

                const user = mockUsers.find(u => u.email === email);

                if (user) {
                    // Gerar token mock
                    const resetToken = Math.random().toString(36).substring(7);
                    console.log('📧 Email de recuperação enviado para:', email);
                    console.log('🔑 Token de recuperação (mock):', resetToken);
                    console.log('🔗 Link de reset:', `http://localhost:3005/reset-password/${resetToken}`);

                    set({ loading: false, error: null });
                    return { success: true, token: resetToken }; // Em produção, só retornaria success
                } else {
                    // Por segurança, não informar que email não existe
                    console.log('⚠️ Email não encontrado, mas retornando sucesso por segurança');
                    set({ loading: false, error: null });
                    return { success: true };
                }
            },

            // Redefinir senha com token
            resetPassword: async (token, newPassword) => {
                set({ loading: true, error: null });

                await new Promise(resolve => setTimeout(resolve, 800));

                // Em produção, verificaria token no banco de dados
                // Por ora, apenas simular sucesso
                console.log('✅ Senha redefinida com sucesso (mock)');
                console.log('Token usado:', token);

                set({ loading: false, error: null });
                return true;
            },

            // Bypass de desenvolvimento
            loginBypass: () => set({
                user: {
                    id: 'dev-bypass',
                    name: 'Desenvolvedor',
                    email: 'dev@bypass.com',
                    role: 'Desenvolvedor'
                },
                isAuthenticated: true,
                isDevelopmentBypass: true,
                error: null
            }),

            // Logout
            logout: () => set({
                user: null,
                isAuthenticated: false,
                isDevelopmentBypass: false,
                error: null
            }),

            // Verificar se usuário tem permissão
            hasPermission: (requiredRole) => {
                const { user } = get();
                if (!user) return false;

                const roleHierarchy = {
                    'Desenvolvedor': 7,
                    'Gerente': 6,
                    'Líder': 5,
                    'Supervisor': 4,
                    'Suprimentos': 3,
                    'Apontador': 2,
                };

                const userLevel = roleHierarchy[user.role] || 0;
                const requiredLevel = roleHierarchy[requiredRole] || 0;

                return userLevel >= requiredLevel;
            },

            // Limpar erro
            clearError: () => set({ error: null }),

            // Obter todos os usuários (para gerenciamento)
            getAllUsers: () => mockUsers.map(({ password, ...user }) => user),
        }),
        {
            name: 'auth-storage',
        }
    )
);

// Exportar função para acessar mockUsers (para userStore)
export const getMockUsers = () => mockUsers;
export const setMockUsers = (users) => { mockUsers = users; };

export default useAuthStore;
