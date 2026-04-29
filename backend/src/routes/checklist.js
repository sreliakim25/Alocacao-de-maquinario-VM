const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');

const GLOBAL_ROLES = ['Administrador', 'Desenvolvedor', 'Gerente'];

// Monta cláusula de filtro por UGB para queries de checklist (via join com maquinas)
function buildUgbFilter(query, conta_id, role) {
    if (!conta_id || GLOBAL_ROLES.includes(role)) return query;
    // Filtra checklists de máquinas que pertencem à UGB do usuário
    return query.eq('maquinas.ugb_id', conta_id);
}

// POST /api/checklist — salvar checklist de inspeção
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { maquina_id, operador_nome, empresa, chassi, tipo_equipamento, data_inspecao, itens, observacoes } = req.body;
        const { conta_id, role } = req.user;

        if (!maquina_id) return res.status(400).json({ error: 'maquina_id é obrigatório' });
        const maquinaIdInt = parseInt(maquina_id, 10);
        if (isNaN(maquinaIdInt)) return res.status(400).json({ error: 'maquina_id inválido' });
        if (!operador_nome) return res.status(400).json({ error: 'operador_nome é obrigatório' });
        if (!empresa) return res.status(400).json({ error: 'empresa é obrigatório' });
        if (!tipo_equipamento) return res.status(400).json({ error: 'tipo_equipamento é obrigatório' });
        if (!itens || !Array.isArray(itens)) return res.status(400).json({ error: 'itens inválidos' });

        // Verificar acesso à máquina
        if (conta_id && !GLOBAL_ROLES.includes(role)) {
            const { data: maquina } = await supabase
                .from('maquinas')
                .select('ugb_id')
                .eq('id', maquinaIdInt)
                .single();

            if (!maquina || maquina.ugb_id !== conta_id) {
                return res.status(403).json({ error: 'Acesso negado a esta máquina' });
            }
        }

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
        const { conta_id, role } = req.user;

        let query = supabase
            .from('machine_checklists')
            .select('maquina_id, data_inspecao, maquinas!inner(ugb_id)');

        query = buildUgbFilter(query, conta_id, role);

        const { data, error } = await query;
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
        const { conta_id, role } = req.user;
        const maquinaId = parseInt(req.params.maquinaId, 10);
        if (isNaN(maquinaId)) return res.status(400).json({ error: 'maquinaId inválido' });

        // Verificar acesso à máquina
        if (conta_id && !GLOBAL_ROLES.includes(role)) {
            const { data: maquina } = await supabase
                .from('maquinas')
                .select('ugb_id')
                .eq('id', maquinaId)
                .single();

            if (!maquina || maquina.ugb_id !== conta_id) {
                return res.status(403).json({ error: 'Acesso negado a esta máquina' });
            }
        }

        const { data, error } = await supabase
            .from('machine_checklists')
            .select('*')
            .eq('maquina_id', maquinaId)
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
        const { conta_id, role } = req.user;

        const { data, error } = await supabase
            .from('machine_checklists')
            .select('*, maquinas(ugb_id)')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Checklist não encontrado' });

        // Verificar acesso à máquina
        if (conta_id && !GLOBAL_ROLES.includes(role) && data.maquinas?.ugb_id !== conta_id) {
            return res.status(403).json({ error: 'Acesso negado a este checklist' });
        }

        // Remove o join da resposta
        const { maquinas: _, ...checklist } = data;
        res.json(checklist);
    } catch (error) {
        console.error('Erro ao buscar checklist:', error);
        res.status(500).json({ error: 'Erro ao buscar checklist' });
    }
});

module.exports = router;
