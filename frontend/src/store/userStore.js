import { create } from 'zustand';
import { getMockUsers, setMockUsers } from './authStore';

const useUserStore = create((set, get) => ({
    users: [],
    loading: false,
    error: null,

    // Carregar todos os usuários
    fetchUsers: async () => {
        set({ loading: true, error: null });

        await new Promise(resolve => setTimeout(resolve, 500));

        const mockUsers = getMockUsers();
        const users = mockUsers.map(({ password, ...user }) => user);

        set({ users, loading: false });
        return users;
    },

    // Atualizar role/permissão de um usuário
    updateUserRole: async (userId, newRole) => {
        set({ loading: true, error: null });

        await new Promise(resolve => setTimeout(resolve, 600));

        const mockUsers = getMockUsers();
        const userIndex = mockUsers.findIndex(u => u.id === userId);

        if (userIndex !== -1) {
            mockUsers[userIndex].role = newRole;
            setMockUsers(mockUsers);

            // Atualizar estado local
            const updatedUsers = mockUsers.map(({ password, ...user }) => user);
            set({ users: updatedUsers, loading: false });

            console.log(`✅ Permissão atualizada: Usuário ${userId} -> ${newRole}`);
            return true;
        }

        set({ loading: false, error: 'Usuário não encontrado' });
        return false;
    },

    // Ativar/Desativar usuário
    toggleUserStatus: async (userId) => {
        set({ loading: true, error: null });

        await new Promise(resolve => setTimeout(resolve, 600));

        const mockUsers = getMockUsers();
        const userIndex = mockUsers.findIndex(u => u.id === userId);

        if (userIndex !== -1) {
            mockUsers[userIndex].ativo = !mockUsers[userIndex].ativo;
            setMockUsers(mockUsers);

            const updatedUsers = mockUsers.map(({ password, ...user }) => user);
            set({ users: updatedUsers, loading: false });

            const status = mockUsers[userIndex].ativo ? 'ativado' : 'desativado';
            console.log(`✅ Usuário ${userId} ${status}`);
            return true;
        }

        set({ loading: false, error: 'Usuário não encontrado' });
        return false;
    },

    // Resetar senha do usuário (gerar senha temporária)
    resetUserPassword: async (userId) => {
        set({ loading: true, error: null });

        await new Promise(resolve => setTimeout(resolve, 600));

        const mockUsers = getMockUsers();
        const userIndex = mockUsers.findIndex(u => u.id === userId);

        if (userIndex !== -1) {
            const tempPassword = Math.random().toString(36).substring(7);
            mockUsers[userIndex].password = tempPassword;
            setMockUsers(mockUsers);

            console.log(`🔑 Senha temporária gerada para usuário ${userId}:`, tempPassword);
            console.log('📧 Em produção, enviaria email com a nova senha');

            set({ loading: false });
            return { success: true, tempPassword };
        }

        set({ loading: false, error: 'Usuário não encontrado' });
        return { success: false };
    },

    // Deletar usuário
    deleteUser: async (userId) => {
        set({ loading: true, error: null });

        await new Promise(resolve => setTimeout(resolve, 600));

        let mockUsers = getMockUsers();
        const initialLength = mockUsers.length;
        mockUsers = mockUsers.filter(u => u.id !== userId);

        if (mockUsers.length < initialLength) {
            setMockUsers(mockUsers);

            const updatedUsers = mockUsers.map(({ password, ...user }) => user);
            set({ users: updatedUsers, loading: false });

            console.log(`🗑️ Usuário ${userId} removido`);
            return true;
        }

        set({ loading: false, error: 'Usuário não encontrado' });
        return false;
    },

    // Limpar erro
    clearError: () => set({ error: null }),
}));

export default useUserStore;
