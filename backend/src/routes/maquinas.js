const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const authMiddleware = require('../middleware/auth');

// GET /api/maquinas - Listar todas as máquinas
router.get('/', authMiddleware, (req, res) => {
    try {
        const maquinas = db.prepare(`
            SELECT id, nome, tipo, placa, ativo, criado_em
            FROM maquinas
            WHERE ativo = 1
            ORDER BY nome
        `).all();

        res.json(maquinas);
    } catch (error) {
        console.error('Erro ao listar máquinas:', error);
        res.status(500).json({ error: 'Erro ao listar máquinas' });
    }
});

// GET /api/maquinas/:id - Buscar máquina por ID
router.get('/:id', authMiddleware, (req, res) => {
    try {
        const { id } = req.params;

        const maquina = db.prepare(`
            SELECT id, nome, tipo, placa, ativo, criado_em
            FROM maquinas
            WHERE id = ?
        `).get(id);

        if (!maquina) {
            return res.status(404).json({ error: 'Máquina não encontrada' });
        }

        res.json(maquina);
    } catch (error) {
        console.error('Erro ao buscar máquina:', error);
        res.status(500).json({ error: 'Erro ao buscar máquina' });
    }
});

// POST /api/maquinas - Criar nova máquina (Supervisor+)
router.post('/', authMiddleware, (req, res) => {
    try {
        const { nome, tipo, placa } = req.body;

        if (!nome) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        const insert = db.prepare(`
            INSERT INTO maquinas (nome, tipo, placa, ativo)
            VALUES (?, ?, ?, 1)
        `);

        const result = insert.run(nome, tipo || null, placa || null);

        res.status(201).json({
            message: 'Máquina criada com sucesso',
            id: result.lastInsertRowid
        });

    } catch (error) {
        console.error('Erro ao criar máquina:', error);
        res.status(500).json({ error: 'Erro ao criar máquina' });
    }
});

// PUT /api/maquinas/:id - Atualizar máquina (Supervisor+)
router.put('/:id', authMiddleware, (req, res) => {
    try {
        const { id } = req.params;
        const { nome, tipo, placa } = req.body;

        const updates = [];
        const values = [];

        if (nome) {
            updates.push('nome = ?');
            values.push(nome);
        }
        if (tipo !== undefined) {
            updates.push('tipo = ?');
            values.push(tipo);
        }
        if (placa !== undefined) {
            updates.push('placa = ?');
            values.push(placa);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar' });
        }

        values.push(id);

        const query = `UPDATE maquinas SET ${updates.join(', ')} WHERE id = ?`;
        db.prepare(query).run(...values);

        res.json({ message: 'Máquina atualizada com sucesso' });

    } catch (error) {
        console.error('Erro ao atualizar máquina:', error);
        res.status(500).json({ error: 'Erro ao atualizar máquina' });
    }
});

// DELETE /api/maquinas/:id - Deletar máquina (soft delete)
router.delete('/:id', authMiddleware, (req, res) => {
    try {
        const { id } = req.params;

        db.prepare('UPDATE maquinas SET ativo = 0 WHERE id = ?').run(id);

        res.json({ message: 'Máquina desativada com sucesso' });

    } catch (error) {
        console.error('Erro ao deletar máquina:', error);
        res.status(500).json({ error: 'Erro ao deletar máquina' });
    }
});

module.exports = router;
