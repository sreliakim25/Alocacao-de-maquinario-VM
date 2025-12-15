import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { maquinasAPI } from '../services/api';

const useMaquinarioStore = create(
    persist(
        (set, get) => ({
            maquinarios: [],
            loading: false,
            error: null,

            // Buscar todas as máquinas do backend
            fetchMaquinarios: async () => {
                set({ loading: true, error: null });
                try {
                    const maquinarios = await maquinasAPI.getAll();
                    set({ maquinarios, loading: false });
                } catch (error) {
                    set({ error: error.message, loading: false });
                }
            },

            // Adicionar nova máquina
            addMaquinario: async (maquinario) => {
                set({ loading: true, error: null });
                try {
                    const result = await maquinasAPI.create(maquinario);

                    // Atualizar lista local
                    const newMaquinario = {
                        id: result.id,
                        ...maquinario,
                        ativo: 1,
                        criado_em: new Date().toISOString()
                    };

                    set(state => ({
                        maquinarios: [newMaquinario, ...state.maquinarios],
                        loading: false
                    }));

                    return result.id;
                } catch (error) {
                    set({ error: error.message, loading: false });
                    throw error;
                }
            },

            // Atualizar máquina
            updateMaquinario: async (id, updatedData) => {
                set({ loading: true, error: null });
                try {
                    await maquinasAPI.update(id, updatedData);

                    // Atualizar lista local
                    set(state => ({
                        maquinarios: state.maquinarios.map(m =>
                            m.id === id ? { ...m, ...updatedData } : m
                        ),
                        loading: false
                    }));
                } catch (error) {
                    set({ error: error.message, loading: false });
                    throw error;
                }
            },

            // Remover máquina (soft delete)
            removeMaquinario: async (id) => {
                set({ loading: true, error: null });
                try {
                    await maquinasAPI.delete(id);

                    // Remover da lista local ou marcar como inativo
                    set(state => ({
                        maquinarios: state.maquinarios.filter(m => m.id !== id),
                        loading: false
                    }));
                } catch (error) {
                    set({ error: error.message, loading: false });
                    throw error;
                }
            },

            // Limpar erros
            clearError: () => set({ error: null }),
        }),
        {
            name: 'maquinarios-storage-v5', // Versioned storage
        }
    )
);

export default useMaquinarioStore;
