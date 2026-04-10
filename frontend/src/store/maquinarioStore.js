import { create } from 'zustand';
import { maquinasAPI } from '../services/api';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos

const useMaquinarioStore = create((set, get) => ({
    maquinarios: [],
    loading: false,
    error: null,
    lastFetched: null,

    fetchMaquinarios: async ({ forceRefresh = false } = {}) => {
        const { lastFetched, loading } = get();
        if (!forceRefresh && lastFetched && Date.now() - lastFetched < CACHE_TTL_MS) return;
        if (loading) return;

        set({ loading: true, error: null });
        try {
            const maquinarios = await maquinasAPI.getAll();
            set({ maquinarios, loading: false, lastFetched: Date.now() });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    addMaquinario: async (maquinario) => {
        set({ loading: true, error: null });
        try {
            const result = await maquinasAPI.create(maquinario);
            const maquinarios = await maquinasAPI.getAll();
            set({ maquinarios, loading: false, lastFetched: Date.now() });
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
            set({ maquinarios, loading: false, lastFetched: Date.now() });
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
