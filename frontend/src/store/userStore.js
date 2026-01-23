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
    updateUserRole: async (userId, newRole, conta_id) => {
        set({ loading: true, error: null });
        try {
            await usuariosAPI.updateRole(userId, newRole, conta_id);

            // Atualizar lista local
            set(state => ({
                users: state.users.map(u =>
                    u.id === userId ? { ...u, nivel_acesso: newRole, conta_id } : u
                ),
                loading: false
            }));
            return true;
        } catch (error) {
            set({ error: error.message, loading: false });
            return false;
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

    // Resetar senha do usuário (Gera senha temporária)
    resetUserPassword: async (userId) => {
        set({ loading: true, error: null });
        try {
            const tempPassword = Math.random().toString(36).slice(-8) + 'Aa1'; // Ensure complexity
            await usuariosAPI.update(userId, { senha: tempPassword });

            set({ loading: false });
            return { success: true, tempPassword };
        } catch (error) {
            set({ error: error.message, loading: false });
            return { success: false, error: error.message };
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
