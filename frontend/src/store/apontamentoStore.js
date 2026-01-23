import { create } from 'zustand';
import { apontamentosAPI } from '../services/api';

const useApontamentoStore = create((set, get) => ({
    apontamentos: [],
    loading: false,
    error: null,

    // Fetch and flatten
    fetchApontamentos: async () => {
        set({ loading: true, error: null });
        try {
            const data = await apontamentosAPI.getAll();

            // Flatten Header+Lines to unique Items for List View
            const flattened = data.flatMap(header => {
                if (!header.linhas || header.linhas.length === 0) return [];

                return header.linhas.map(line => ({
                    // IDs
                    id: line.id, // Line ID (Unique for List key)
                    apontamentoId: header.id, // Header ID (For grouping/editing)

                    // Header Info
                    data: header.data_apontamento ? header.data_apontamento.split('T')[0] : '',
                    maquina: header.maquina_nome || '', // Name for display
                    maquinaId: header.maquina_id, // ID for edit
                    operador: header.operador,
                    apontadorId: header.apontador_id, // Assuming snake_case from DB
                    status: header.status,

                    // Line Info (IDs for Edit, Names for Display)
                    inicio: line.inicio,
                    fim: line.fim,
                    observacao: line.observacao,
                    totalHoras: line.horas_trabalhadas,

                    vila: line.vila_id,
                    vilaNome: line.vila_nome,

                    // Detalhes Map
                    detalhes: {
                        etapa: line.etapa_id,
                        etapaNome: line.etapa_nome,

                        subEtapa: line.sub_etapa_id,
                        subEtapaNome: line.tarefa_nome, // backend tarefa = frontend subEtapa

                        conta: line.conta_id,
                        contaNome: line.ugb_nome,

                        supervisor: line.supervisor // Name
                    },

                    // Pendências (Rejection Reason)
                    // Pendências (Rejection Reason)
                    ultimaPendencia: (() => {
                        if (header.status === 'em_apontamento' && header.observacoes && header.observacoes.includes('[REPROVADO')) {
                            const parts = header.observacoes.split('[REPROVADO');
                            const lastPart = parts[parts.length - 1]; // Get the last rejection block
                            const reasonParts = lastPart.split(']:');

                            if (reasonParts.length > 1) {
                                let message = reasonParts.slice(1).join(']:').trim();

                                // Check for Line ID tag
                                // Format: [ID:123] Reason
                                const idMatch = message.match(/^\[ID:(\d+)\]/);

                                if (idMatch) {
                                    const rejectedLineId = idMatch[1];
                                    if (String(rejectedLineId) === String(line.id)) {
                                        return message.replace(/^\[ID:\d+\]\s*/, '');
                                    }
                                    return null; // ID mismatch, this line is fine (or at least not the one flagged)
                                }

                                // Fallback for legacy generic rejections (show on all lines or none? Let's show on all to be safe)
                                return message;
                            }
                            return 'Ver observações';
                        }
                        return null;
                    })()
                }));
            });

            set({ apontamentos: flattened, loading: false });
        } catch (error) {
            console.error('Erro ao buscar apontamentos:', error);
            set({ error: error.message, loading: false });
        }
    },

    // Not usually called directly by UI anymore, but kept for compatibility
    addApontamento: async (apontamento) => {
        // Implementation omitted as UI uses syncApontamentosBatch
    },

    updateStatus: async (id, status, extraData = {}) => {
        set({ loading: true });
        try {
            // ID here could be Line ID or Header ID.
            // ListaApontamentos usually passes Line ID?
            // Wait, ListaApontamentos calls `handleStatusUpdate` passing `selectedIds`.
            // selectedIds are Line IDs.
            // We need to find the Header ID for this Line ID.
            const state = get();
            const item = state.apontamentos.find(a => a.id === id);
            if (!item) throw new Error('Item não encontrado');

            await apontamentosAPI.updateStatus(item.apontamentoId, status, extraData);

            // Refetch to update UI
            await get().fetchApontamentos();
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    // Batch Status Update
    updateStatusBatch: async (ids, status, extraData = {}) => {
        set({ loading: true });
        try {
            // We need to find the Header IDs for these Line IDs.
            // We assume all lines belong to same Header if batch action is from grouped view?
            // Actually, `ListaApontamentos` groups by machine, so they might be different headers if multiple appointments for same machine same day?
            // But usually it's one header per (Date, Machine, Operator).
            // Let's iterate unique Header IDs.
            const state = get();
            const headerIds = new Set();

            ids.forEach(id => {
                const item = state.apontamentos.find(a => a.id === id);
                if (item) headerIds.add(item.apontamentoId);
            });

            const promises = Array.from(headerIds).map(headerId =>
                apontamentosAPI.updateStatus(headerId, status, extraData)
            );

            await Promise.all(promises);

            await get().fetchApontamentos();
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },

    // Batch Update/Create logic from Apontamento.jsx
    syncApontamentosBatch: async (originalContext, itemsToSave) => {
        set({ loading: true, error: null });
        try {
            // 1. Identify Header ID
            let apontamentoId = originalContext?.id;

            // 2. Construct Payload
            // itemsToSave contains Header info in every item. Take first.
            const firstItem = itemsToSave[0];
            if (!firstItem) return;

            const payload = {
                data_apontamento: firstItem.data_apontamento,
                maquina_id: firstItem.maquina_id,
                operador: firstItem.operador,
                observacoes: firstItem.observacoes || '', // Header Obs
                status: firstItem.status,

                linhas: itemsToSave.map(item => ({
                    vila_id: item.vila,
                    etapa_id: item.etapa,
                    sub_etapa_id: item.subEtapa, // Frontend uses camelCase 'subEtapa'
                    conta_id: item.conta,
                    sub_conta_id: item.subConta || null, // Assuming subConta might exist? In Apontamento.jsx initialRow doesn't have it explicitly shown but likely
                    supervisor: item.supervisor,
                    inicio: item.inicio,
                    fim: item.fim,
                    observacao: item.observacao
                }))
            };

            // 3. Create or Update
            if (apontamentoId) {
                await apontamentosAPI.update(apontamentoId, payload);
            } else {
                await apontamentosAPI.create(payload);
            }

            // 4. Refresh List
            await get().fetchApontamentos();

        } catch (error) {
            console.error('Erro ao salvar apontamento:', error);
            set({ error: error.message, loading: false });
            throw error;
        }
    },

    deleteApontamento: async (id) => {
        set({ loading: true });
        try {
            // ID is Line ID.
            // But we delete the Whole Header?
            // The UI usually says "Delete" on the list.
            // If user deletes one line, should we delete just the line or the header?
            // `routes/apontamentos.js` DELETE /:id deletes the Header (and cascades lines).
            // `ListaApontamentos` "Delete" button... let's assume it deletes the whole Boletim if grouped?
            // Actually `ListaApontamentos` allows selecting multiple rows.
            // If we delete a line, we should probably have an API to delete a line.
            // Current API only has DELETE /apontamentos/:id (Header).
            // So we MUST Find Header ID and delete the whole thing.
            const state = get();
            const item = state.apontamentos.find(a => a.id === id);
            if (!item) throw new Error('Item não encontrado');

            await apontamentosAPI.delete(item.apontamentoId);

            await get().fetchApontamentos();
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    }
}));

export default useApontamentoStore;
