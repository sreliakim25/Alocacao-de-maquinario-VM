import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Mock data updated with new schema - Operador is now a string
const initialMaquinarios = [
    {
        id: '1',
        nome: 'Retro-05',
        tipo: 'Retroescavadeira',
        fornecedor: 'Locadora A',
        placa: 'ABC-1234',
        operador: 'Carlos Silva',
        setor: 'UDE',
        foto: null,
        dataUltimoChecklist: '2024-12-01',
        proximoChecklist: '2024-12-15',
        periodicidadeChecklist: 14 // dias
    },
    {
        id: '2',
        nome: 'PC-01',
        tipo: 'Pá Carregadeira',
        fornecedor: 'Locadora B',
        placa: 'XYZ-5678',
        operador: 'João Santos',
        setor: 'Infraestrutura',
        foto: null,
        dataUltimoChecklist: '2024-12-05',
        proximoChecklist: '2025-01-05',
        periodicidadeChecklist: 30
    },
    {
        id: '3',
        nome: 'Pipa-02',
        tipo: 'Caminhão Pipa',
        fornecedor: 'Locadora A',
        placa: 'DEF-9012',
        operador: 'Maria Oliveira',
        setor: 'UDE',
        foto: null,
        dataUltimoChecklist: '2024-11-20',
        proximoChecklist: '2024-12-05', // Vencido
        periodicidadeChecklist: 15
    },
];

const useMaquinarioStore = create(
    persist(
        (set) => ({
            maquinarios: initialMaquinarios,

            addMaquinario: (maquinario) => set((state) => ({
                maquinarios: [
                    {
                        id: Math.random().toString(36).substr(2, 9),
                        ...maquinario
                    },
                    ...state.maquinarios
                ]
            })),

            removeMaquinario: (id) => set((state) => ({
                maquinarios: state.maquinarios.filter((m) => m.id !== id)
            })),

            updateMaquinario: (id, updatedData) => set((state) => ({
                maquinarios: state.maquinarios.map((m) =>
                    m.id === id ? { ...m, ...updatedData } : m
                )
            })),
        }),
        {
            name: 'maquinarios-storage-v3', // Versioned storage
        }
    )
);

export default useMaquinarioStore;
