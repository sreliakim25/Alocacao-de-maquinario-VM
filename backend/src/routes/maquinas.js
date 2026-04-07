const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const permissionMiddleware = require('../middleware/permissions');

// GET /api/maquinas
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { apenas_ativos } = req.query;

        let query = supabase
            .from('maquinas')
            .select('id, nome, tipo, placa, operador, setor, fornecedor, foto, ativo, criado_em')
            .order('ativo', { ascending: false })  // ativos primeiro
            .order('nome', { ascending: true });

        if (apenas_ativos === 'true') {
            query = query.eq('ativo', true);
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
        const { data, error } = await supabase
            .from('maquinas')
            .select('id, nome, tipo, placa, operador, setor, fornecedor, foto, ativo, criado_em')
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Máquina não encontrada' });
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

        if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

        const { data, error } = await supabase
            .from('maquinas')
            .insert({ nome, tipo: tipo || null, placa: placa || null, operador: operador || null, setor: setor || null, fornecedor: fornecedor || null, foto: foto || null, ativo: true })
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
        const { error } = await supabase.from('maquinas').update({ ativo: false }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Máquina desativada com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar máquina:', error);
        res.status(500).json({ error: 'Erro ao deletar máquina' });
    }
});

module.exports = router;
