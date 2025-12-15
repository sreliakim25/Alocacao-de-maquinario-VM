const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const authMiddleware = require('../middleware/auth');

// ========== VILAS ==========

router.get('/vilas', authMiddleware, (req, res) => {
    try {
        const vilas = db.prepare('SELECT * FROM vilas WHERE ativo = 1 ORDER BY nome').all();
        res.json(vilas);
    } catch (error) {
        console.error('Erro ao listar vilas:', error);
        res.status(500).json({ error: 'Erro ao listar vilas' });
    }
});

router.post('/vilas', authMiddleware, (req, res) => {
    try {
        const { nome } = req.body;
        if (!nome) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        const result = db.prepare('INSERT INTO vilas (nome, ativo) VALUES (?, 1)').run(nome);
        res.status(201).json({ message: 'Vila criada', id: result.lastInsertRowid });
    } catch (error) {
        console.error('Erro ao criar vila:', error);
        res.status(500).json({ error: 'Erro ao criar vila' });
    }
});

// ========== ETAPAS ==========

router.get('/etapas', authMiddleware, (req, res) => {
    try {
        const etapas = db.prepare('SELECT * FROM etapas WHERE ativo = 1 ORDER BY nome').all();
        res.json(etapas);
    } catch (error) {
        console.error('Erro ao listar etapas:', error);
        res.status(500).json({ error: 'Erro ao listar etapas' });
    }
});

router.post('/etapas', authMiddleware, (req, res) => {
    try {
        const { nome } = req.body;
        if (!nome) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        const result = db.prepare('INSERT INTO etapas (nome, ativo) VALUES (?, 1)').run(nome);
        res.status(201).json({ message: 'Etapa criada', id: result.lastInsertRowid });
    } catch (error) {
        console.error('Erro ao criar etapa:', error);
        res.status(500).json({ error: 'Erro ao criar etapa' });
    }
});

// ========== SUB-ETAPAS ==========

router.get('/sub-etapas', authMiddleware, (req, res) => {
    try {
        const { etapa_id } = req.query;

        let query = 'SELECT * FROM sub_etapas WHERE ativo = 1';
        const params = [];

        if (etapa_id) {
            query += ' AND etapa_id = ?';
            params.push(etapa_id);
        }

        query += ' ORDER BY nome';

        const subEtapas = db.prepare(query).all(...params);
        res.json(subEtapas);
    } catch (error) {
        console.error('Erro ao listar sub-etapas:', error);
        res.status(500).json({ error: 'Erro ao listar sub-etapas' });
    }
});

router.post('/sub-etapas', authMiddleware, (req, res) => {
    try {
        const { etapa_id, nome } = req.body;
        if (!etapa_id || !nome) {
            return res.status(400).json({ error: 'etapa_id e nome são obrigatórios' });
        }

        const result = db.prepare('INSERT INTO sub_etapas (etapa_id, nome, ativo) VALUES (?, ?, 1)')
            .run(etapa_id, nome);
        res.status(201).json({ message: 'Sub-etapa criada', id: result.lastInsertRowid });
    } catch (error) {
        console.error('Erro ao criar sub-etapa:', error);
        res.status(500).json({ error: 'Erro ao criar sub-etapa' });
    }
});

// ========== CONTAS ==========

router.get('/contas', authMiddleware, (req, res) => {
    try {
        const contas = db.prepare('SELECT * FROM contas WHERE ativo = 1 ORDER BY nome').all();
        res.json(contas);
    } catch (error) {
        console.error('Erro ao listar contas:', error);
        res.status(500).json({ error: 'Erro ao listar contas' });
    }
});

router.post('/contas', authMiddleware, (req, res) => {
    try {
        const { nome } = req.body;
        if (!nome) {
            return res.status(400).json({ error: 'Nome é obrigatório' });
        }

        const result = db.prepare('INSERT INTO contas (nome, ativo) VALUES (?, 1)').run(nome);
        res.status(201).json({ message: 'Conta criada', id: result.lastInsertRowid });
    } catch (error) {
        console.error('Erro ao criar conta:', error);
        res.status(500).json({ error: 'Erro ao criar conta' });
    }
});

// ========== SUB-CONTAS ==========

router.get('/sub-contas', authMiddleware, (req, res) => {
    try {
        const { conta_id } = req.query;

        let query = 'SELECT * FROM sub_contas WHERE ativo = 1';
        const params = [];

        if (conta_id) {
            query += ' AND conta_id = ?';
            params.push(conta_id);
        }

        query += ' ORDER BY nome';

        const subContas = db.prepare(query).all(...params);
        res.json(subContas);
    } catch (error) {
        console.error('Erro ao listar sub-contas:', error);
        res.status(500).json({ error: 'Erro ao listar sub-contas' });
    }
});

router.post('/sub-contas', authMiddleware, (req, res) => {
    try {
        const { conta_id, nome } = req.body;
        if (!conta_id || !nome) {
            return res.status(400).json({ error: 'conta_id e nome são obrigatórios' });
        }

        const result = db.prepare('INSERT INTO sub_contas (conta_id, nome, ativo) VALUES (?, ?, 1)')
            .run(conta_id, nome);
        res.status(201).json({ message: 'Sub-conta criada', id: result.lastInsertRowid });
    } catch (error) {
        console.error('Erro ao criar sub-conta:', error);
        res.status(500).json({ error: 'Erro ao criar sub-conta' });
    }
});

module.exports = router;
