const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const permissionMiddleware = require('../middleware/permissions');

// Roles que enxergam máquinas de todas as UGBs
const GLOBAL_ROLES = ['Administrador', 'Desenvolvedor', 'Gerente'];

// GET /api/maquinas
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { apenas_ativos } = req.query;
        const { conta_id, role } = req.user;

        let query = supabase
            .from('maquinas')
            .select('id, nome, tipo, placa, operador, setor, fornecedor, foto, ativo, ugb_id, criado_em')
            .order('ativo', { ascending: false })
            .order('nome', { ascending: true });

        if (apenas_ativos === 'true') {
            query = query.eq('ativo', true);
        }

        // Usuários comuns só veem máquinas da sua UGB
        if (conta_id && !GLOBAL_ROLES.includes(role)) {
            query = query.eq('ugb_id', conta_id);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao listar máquinas:', error);
        res.status(500).json({ error: 'Erro ao listar máquinas' });
    }
});

// GET /api/maquinas/:id
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { conta_id, role } = req.user;

        const { data, error } = await supabase
            .from('maquinas')
            .select('id, nome, tipo, placa, operador, setor, fornecedor, foto, ativo, ugb_id, criado_em')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Máquina não encontrada' });

        // Verificar acesso por UGB
        if (conta_id && !GLOBAL_ROLES.includes(role) && data.ugb_id !== conta_id) {
            return res.status(403).json({ error: 'Acesso negado a esta máquina' });
        }

        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar máquina:', error);
        res.status(500).json({ error: 'Erro ao buscar máquina' });
    }
});

// POST /api/maquinas
router.post('/', authMiddleware, permissionMiddleware(['Suprimentos', 'Gerente']), async (req, res) => {
    try {
        const { nome, tipo, placa, operador, setor, fornecedor, foto } = req.body;
        const { conta_id, role } = req.user;

        if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

        // ugb_id: Gerente pode passar explicitamente; demais usam o próprio conta_id
        const ugb_id = GLOBAL_ROLES.includes(role)
            ? (req.body.ugb_id || conta_id || null)
            : conta_id;

        const { data, error } = await supabase
            .from('maquinas')
            .insert({
                nome,
                tipo: tipo || null,
                placa: placa || null,
                operador: operador || null,
                setor: setor || null,
                fornecedor: fornecedor || null,
                foto: foto || null,
                ugb_id,
                ativo: true,
            })
            .select('id')
            .single();

        if (error) throw error;
        res.status(201).json({ message: 'Máquina criada com sucesso', id: data.id });
    } catch (error) {
        console.error('Erro ao criar máquina:', error);
        res.status(500).json({ error: 'Erro ao criar máquina' });
    }
});

// PUT /api/maquinas/:id
router.put('/:id', authMiddleware, permissionMiddleware(['Suprimentos', 'Gerente']), async (req, res) => {
    try {
        const { conta_id, role } = req.user;

        // Verificar que a máquina pertence à UGB do usuário (exceto roles globais)
        if (conta_id && !GLOBAL_ROLES.includes(role)) {
            const { data: maquina } = await supabase
                .from('maquinas')
                .select('ugb_id')
                .eq('id', req.params.id)
                .single();

            if (!maquina) return res.status(404).json({ error: 'Máquina não encontrada' });
            if (maquina.ugb_id !== conta_id) {
                return res.status(403).json({ error: 'Você só pode editar máquinas da sua UGB' });
            }
        }

        const { nome, tipo, placa, operador, setor, fornecedor, foto, ativo } = req.body;
        const updates = {};

        if (nome !== undefined) updates.nome = nome;
        if (tipo !== undefined) updates.tipo = tipo;
        if (placa !== undefined) updates.placa = placa;
        if (operador !== undefined) updates.operador = operador;
        if (setor !== undefined) updates.setor = setor;
        if (fornecedor !== undefined) updates.fornecedor = fornecedor;
        if (foto !== undefined) updates.foto = foto;
        if (ativo !== undefined) updates.ativo = ativo;
        // Gerente pode mover máquina entre UGBs
        if (GLOBAL_ROLES.includes(role) && req.body.ugb_id !== undefined) {
            updates.ugb_id = req.body.ugb_id;
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar' });
        }

        const { error } = await supabase.from('maquinas').update(updates).eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Máquina atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar máquina:', error);
        res.status(500).json({ error: 'Erro ao atualizar máquina' });
    }
});

// DELETE /api/maquinas/:id (soft delete)
router.delete('/:id', authMiddleware, permissionMiddleware(['Suprimentos', 'Gerente']), async (req, res) => {
    try {
        const { conta_id, role } = req.user;

        // Verificar que a máquina pertence à UGB do usuário (exceto roles globais)
        if (conta_id && !GLOBAL_ROLES.includes(role)) {
            const { data: maquina } = await supabase
                .from('maquinas')
                .select('ugb_id')
                .eq('id', req.params.id)
                .single();

            if (!maquina) return res.status(404).json({ error: 'Máquina não encontrada' });
            if (maquina.ugb_id !== conta_id) {
                return res.status(403).json({ error: 'Você só pode desativar máquinas da sua UGB' });
            }
        }

        const { error } = await supabase.from('maquinas').update({ ativo: false }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Máquina desativada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar máquina:', error);
        res.status(500).json({ error: 'Erro ao deletar máquina' });
    }
});

module.exports = router;
