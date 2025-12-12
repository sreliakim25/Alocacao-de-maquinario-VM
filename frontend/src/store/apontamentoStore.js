import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Dados fictícios iniciais atualizados para o novo fluxo
const initialApontamentos = [
    {
        id: '1',
        data: '2024-12-09',
        maquina: 'Retroescavadeira R-01',
        operador: 'João Silva',
        vila: 'Vila A',
        status: 'liberado_apontador', // Aguardando Supervisor
        totalHoras: 8,
        periodo: 'Manhã',
        inicio: '07:00',
        fim: '11:00',
        observacao: 'Serviço concluído sem paradas',
        apontadorId: 'user-123',
        apontadorNome: 'Mestre Obra 01',
        ultimaPendencia: '',
        dataCriacao: '2024-12-09T07:00:00'
    },
    {
        id: '2',
        data: '2024-12-09',
        maquina: 'Pá Carregadeira P-03',
        operador: 'Maria Santos',
        vila: 'Vila B',
        status: 'pendente_supervisor', // Retornou do Supervisor
        totalHoras: 4,
        periodo: 'Tarde',
        inicio: '13:00',
        fim: '17:00',
        observacao: 'Aguardando liberação da área',
        apontadorId: 'user-123',
        apontadorNome: 'Mestre Obra 01',
        ultimaPendencia: 'Supervisor: Verificar hora extra não autorizada.',
        dataCriacao: '2024-12-09T13:00:00'
    },
    {
        id: '3',
        data: '2024-12-08',
        maquina: 'Caminhão Pipa C-05',
        operador: 'Carlos Souza',
        vila: 'Vila C',
        status: 'em_apontamento', // Ainda em edição
        totalHoras: 6,
        periodo: 'Manhã',
        inicio: '07:00',
        fim: '13:00',
        observacao: 'Abastecimento de água',
        apontadorId: 'user-456',
        apontadorNome: 'Apontador Geral',
        ultimaPendencia: '',
        dataCriacao: '2024-12-08T07:00:00'
    }
];

const useApontamentoStore = create(
    persist(
        (set) => ({
            apontamentos: initialApontamentos,

            addApontamento: (apontamento, user) => set((state) => ({
                apontamentos: [
                    {
                        id: Math.random().toString(36).substr(2, 9),
                        status: 'em_apontamento', // Status inicial padrão
                        apontadorId: user?.id || 'anon',
                        apontadorNome: user?.name || 'Desconhecido',
                        ultimaPendencia: '',
                        ...apontamento
                    },
                    ...state.apontamentos
                ]
            })),

            updateStatus: (id, newStatus, pendenciaObs = '') => set((state) => ({
                apontamentos: state.apontamentos.map(apt =>
                    apt.id === id ? {
                        ...apt,
                        status: newStatus,
                        ultimaPendencia: pendenciaObs ? pendenciaObs : apt.ultimaPendencia
                    } : apt
                )
            })),

            updateStatusBatch: (ids, newStatus) => set((state) => {
                const idSet = new Set(ids);
                return {
                    apontamentos: state.apontamentos.map(apt =>
                        idSet.has(apt.id) ? { ...apt, status: newStatus } : apt
                    )
                };
            }),

            updateApontamento: (id, updatedData) => set((state) => ({
                apontamentos: state.apontamentos.map(apt =>
                    apt.id === id ? { ...apt, ...updatedData } : apt
                )
            })),

            syncApontamentosBatch: (originalContext, newItems) => set((state) => {
                // 1. Remove items matching the ORIGINAL context
                const remaining = state.apontamentos.filter(apt =>
                    !(apt.data === originalContext.data &&
                        apt.maquina === originalContext.maquina &&
                        apt.apontadorId === originalContext.apontadorId)
                );

                // 2. Add the new items
                return {
                    apontamentos: [...remaining, ...newItems]
                };
            }),

            deleteApontamento: (id) => set((state) => ({
                apontamentos: state.apontamentos.filter(apt => apt.id !== id)
            })),
        }),
        {
            name: 'apontamentos-storage',
        }
    )
);

export default useApontamentoStore;
