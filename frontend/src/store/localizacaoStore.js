import { create } from 'zustand';
import { localizacoesAPI } from '../services/api';

const useLocalizacaoStore = create((set) => ({
    vilas: [],
    etapas: [],
    subEtapas: [],
    contas: [],
    subContas: [],
    loading: false,
    error: null,

    // ========== VILAS ==========
    fetchVilas: async () => {
        set({ loading: true, error: null });
        try {
            const vilas = await localizacoesAPI.getVilas();
            set({ vilas, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    addVila: async (nome) => {
        try {
            const result = await localizacoesAPI.createVila(nome);
            set(state => ({
                vilas: [...state.vilas, { id: result.id, nome, ativo: 1 }]
            }));
        } catch (error) {
            set({ error: error.message });
            throw error;
        }
    },

    // ========== ETAPAS ==========
    fetchEtapas: async () => {
        set({ loading: true, error: null });
        try {
            const etapas = await localizacoesAPI.getEtapas();
            set({ etapas, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    addEtapa: async (nome) => {
        try {
            const result = await localizacoesAPI.createEtapa(nome);
            set(state => ({
                etapas: [...state.etapas, { id: result.id, nome, ativo: 1 }]
            }));
        } catch (error) {
            set({ error: error.message });
            throw error;
        }
    },

    // ========== SUB-ETAPAS ==========
    fetchSubEtapas: async (etapa_id = null) => {
        set({ loading: true, error: null });
        try {
            const subEtapas = await localizacoesAPI.getSubEtapas(etapa_id);
            set({ subEtapas, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    addSubEtapa: async (etapa_id, nome) => {
        try {
            const result = await localizacoesAPI.createSubEtapa(etapa_id, nome);
            set(state => ({
                subEtapas: [...state.subEtapas, { id: result.id, etapa_id, nome, ativo: 1 }]
            }));
        } catch (error) {
            set({ error: error.message });
            throw error;
        }
    },

    // ========== CONTAS ==========
    fetchContas: async () => {
        set({ loading: true, error: null });
        try {
            const contas = await localizacoesAPI.getContas();
            set({ contas, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    addConta: async (nome) => {
        try {
            const result = await localizacoesAPI.createConta(nome);
            set(state => ({
                contas: [...state.contas, { id: result.id, nome, ativo: 1 }]
            }));
        } catch (error) {
            set({ error: error.message });
            throw error;
        }
    },

    // ========== SUB-CONTAS ==========
    fetchSubContas: async (conta_id = null) => {
        set({ loading: true, error: null });
        try {
            const subContas = await localizacoesAPI.getSubContas(conta_id);
            set({ subContas, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    addSubConta: async (conta_id, nome) => {
        try {
            const result = await localizacoesAPI.createSubConta(conta_id, nome);
            set(state => ({
                subContas: [...state.subContas, { id: result.id, conta_id, nome, ativo: 1 }]
            }));
        } catch (error) {
            set({ error: error.message });
            throw error;
        }
    },

    // Limpar erros
    clearError: () => set({ error: null }),
}));

export default useLocalizacaoStore;
