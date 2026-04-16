const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

// POST /api/checklist — salvar checklist de inspeção
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { maquina_id, operador_nome, empresa, chassi, tipo_equipamento, data_inspecao, itens, observacoes } = req.body;

        if (!maquina_id) return res.status(400).json({ error: 'maquina_id é obrigatório' });
        const maquinaIdInt = parseInt(maquina_id, 10);
        if (isNaN(maquinaIdInt)) return res.status(400).json({ error: 'maquina_id inválido' });
        if (!operador_nome) return res.status(400).json({ error: 'operador_nome é obrigatório' });
        if (!empresa) return res.status(400).json({ error: 'empresa é obrigatório' });
        if (!tipo_equipamento) return res.status(400).json({ error: 'tipo_equipamento é obrigatório' });
        if (!itens || !Array.isArray(itens)) return res.status(400).json({ error: 'itens inválidos' });

        const { data, error } = await supabase
            .from('machine_checklists')
            .insert({
                maquina_id: maquinaIdInt,
                operador_nome,
                empresa,
                chassi: chassi || null,
                tipo_equipamento,
                data_inspecao: data_inspecao || new Date().toISOString().split('T')[0],
                itens,
                observacoes: observacoes || null,
            })
            .select('id')
            .single();

        if (error) throw error;
        res.status(201).json({ message: 'Checklist salvo com sucesso', id: data.id });
    } catch (error) {
        console.error('Erro ao salvar checklist:', error);
        res.status(500).json({ error: 'Erro ao salvar checklist' });
    }
});

// GET /api/checklist/stats/machines — última inspeção e total por máquina
router.get('/stats/machines', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('machine_checklists')
            .select('maquina_id, data_inspecao');

        if (error) throw error;

        const map = {};
        data.forEach(({ maquina_id, data_inspecao }) => {
            if (!map[maquina_id]) {
                map[maquina_id] = { maquina_id, ultima_inspecao: data_inspecao, total: 0 };
            }
            map[maquina_id].total++;
            if (data_inspecao > map[maquina_id].ultima_inspecao) {
                map[maquina_id].ultima_inspecao = data_inspecao;
            }
        });

        res.json(Object.values(map));
    } catch (error) {
        console.error('Erro ao buscar stats de checklist:', error);
        res.status(500).json({ error: 'Erro ao buscar stats de checklist' });
    }
});

// GET /api/checklist/maquina/:maquinaId — listar checklists de uma máquina
router.get('/maquina/:maquinaId', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('machine_checklists')
            .select('*')
            .eq('maquina_id', req.params.maquinaId)
            .order('data_inspecao', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao listar checklists:', error);
        res.status(500).json({ error: 'Erro ao listar checklists' });
    }
});

// GET /api/checklist/:id — buscar checklist específico
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('machine_checklists')
            .select('*')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Checklist não encontrado' });
        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar checklist:', error);
        res.status(500).json({ error: 'Erro ao buscar checklist' });
    }
});

module.exports = router;
