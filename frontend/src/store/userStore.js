import { create } from 'zustand';
import { usuariosAPI } from '../services/api';

const useUserStore = create((set, get) => ({
    users: [],
    loading: false,
    error: null,

    // Buscar todos os usuários (Gerente+)
    fetchUsers: async () => {
        set({ loading: true, error: null });
        try {
            const users = await usuariosAPI.getAll();
            set({ users, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    // Atualizar role do usuário
    updateUserRole: async (userId, newRole) => {
        set({ loading: true, error: null });
        try {
            await usuariosAPI.updateRole(userId, newRole);

            // Atualizar lista local
            set(state => ({
                users: state.users.map(u =>
                    u.id === userId ? { ...u, nivel_acesso: newRole } : u
                ),
                loading: false
            }));
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    // Ativar/Desativar usuário
    toggleUserStatus: async (userId, ativo) => {
        set({ loading: true, error: null });
        try {
            await usuariosAPI.updateStatus(userId, ativo);

            // Atualizar lista local
            set(state => ({
                users: state.users.map(u =>
                    u.id === userId ? { ...u, ativo } : u
                ),
                loading: false
            }));
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    // Resetar senha do usuário (mock - TODO: implementar no backend)
    resetUserPassword: async (userId) => {
        set({ loading: true, error: null });
        try {
            // TODO: Implementar endpoint no backend
            console.log('Reset password para user:', userId);

            set({ loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    // Deletar usuário (Desenvolvedor apenas)
    deleteUser: async (userId) => {
        set({ loading: true, error: null });
        try {
            await usuariosAPI.delete(userId);

            // Remover da lista local
            set(state => ({
                users: state.users.filter(u => u.id !== userId),
                loading: false
            }));
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    // Limpar erros
    clearError: () => set({ error: null }),
}));

export default useUserStore;
