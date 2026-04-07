import { create } from 'zustand';
import { maquinasAPI } from '../services/api';

const useMaquinarioStore = create((set) => ({
    maquinarios: [],
    loading: false,
    error: null,

    fetchMaquinarios: async () => {
        set({ loading: true, error: null });
        try {
            const maquinarios = await maquinasAPI.getAll();
            set({ maquinarios, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    addMaquinario: async (maquinario) => {
        set({ loading: true, error: null });
        try {
            const result = await maquinasAPI.create(maquinario);
            // Recarregar lista do backend para garantir consistência
            const maquinarios = await maquinasAPI.getAll();
            set({ maquinarios, loading: false });
            return result.id;
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    updateMaquinario: async (id, updatedData) => {
        set({ loading: true, error: null });
        try {
            await maquinasAPI.update(id, updatedData);
            const maquinarios = await maquinasAPI.getAll();
            set({ maquinarios, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    removeMaquinario: async (id) => {
        set({ loading: true, error: null });
        try {
            await maquinasAPI.delete(id);
            set(state => ({
                maquinarios: state.maquinarios.filter(m => m.id !== id),
                loading: false
            }));
        } catch (error) {
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    clearError: () => set({ error: null }),
}));

export default useMaquinarioStore;
