const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const authMiddleware = require('../middleware/auth');

// GET /api/maquinas - Listar todas as máquinas
router.get('/', authMiddleware, async (req, res) => {
    try {
        const query = `
            SELECT id, nome, tipo, placa, operador, setor, fornecedor, foto, ativo, criado_em
            FROM maquinas
            WHERE ativo = true
            ORDER BY nome
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar máquinas:', error);
        res.status(500).json({ error: 'Erro ao listar máquinas' });
    }
});

// GET /api/maquinas/:id - Buscar máquina por ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT id, nome, tipo, placa, operador, setor, fornecedor, foto, ativo, criado_em
            FROM maquinas
            WHERE id = $1
        `;
        const result = await db.query(query, [id]);
        const maquina = result.rows[0];

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
router.post('/', authMiddleware, async (req, res) => {
    try {
        // Frontend sends: nome, tipo, placa, operador (nome), setor, fornecedor, foto
        const { nome, tipo, placa, operador, setor, fornecedor, foto } = req.body;

        if (!nome) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        const query = `
            INSERT INTO maquinas (nome, tipo, placa, operador, setor, fornecedor, foto, ativo)
            VALUES ($1, $2, $3, $4, $5, $6, $7, true)
            RETURNING id
        `;

        const result = await db.query(query, [
            nome,
            tipo || null,
            placa || null,
            operador || null,
            setor || null,
            fornecedor || null,
            foto || null
        ]);

        res.status(201).json({
            message: 'Máquina criada com sucesso',
            id: result.rows[0].id
        });

    } catch (error) {
        console.error('Erro ao criar máquina:', error);
        res.status(500).json({ error: 'Erro ao criar máquina' });
    }
});

// PUT /api/maquinas/:id - Atualizar máquina (Supervisor+)
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, tipo, placa, operador, setor, fornecedor, foto } = req.body;

        const updates = [];
        const values = [];
        let counter = 1;

        const addUpdate = (field, value) => {
            if (value !== undefined) {
                updates.push(`${field} = $${counter++}`);
                values.push(value);
            }
        };

        addUpdate('nome', nome);
        addUpdate('tipo', tipo);
        addUpdate('placa', placa);
        addUpdate('operador', operador);
        addUpdate('setor', setor);
        addUpdate('fornecedor', fornecedor);
        addUpdate('foto', foto);

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar' });
        }

        values.push(id);

        const query = `UPDATE maquinas SET ${updates.join(', ')} WHERE id = $${counter}`;
        await db.query(query, values);

        res.json({ message: 'Máquina atualizada com sucesso' });

    } catch (error) {
        console.error('Erro ao atualizar máquina:', error);
        res.status(500).json({ error: 'Erro ao atualizar máquina' });
    }
});

// DELETE /api/maquinas/:id - Deletar máquina (soft delete)
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        await db.query('UPDATE maquinas SET ativo = false WHERE id = $1', [id]);

        res.json({ message: 'Máquina desativada com sucesso' });

    } catch (error) {
        console.error('Erro ao deletar máquina:', error);
        res.status(500).json({ error: 'Erro ao deletar máquina' });
    }
});

module.exports = router;
