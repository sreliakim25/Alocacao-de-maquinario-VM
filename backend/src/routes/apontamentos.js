const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const permissionMiddleware = require('../middleware/permissions');

// GET /api/apontamentos - Listar apontamentos (com filtros)
router.get('/', authMiddleware, (req, res) => {
    try {
        const { data_inicio, data_fim, maquina_id, status } = req.query;

        let query = `
            SELECT a.*, m.nome as maquina_nome
            FROM apontamentos a
            LEFT JOIN maquinas m ON a.maquina_id = m.id
            WHERE 1=1
        `;
        const params = [];

        if (data_inicio) {
            query += ' AND a.data_apontamento >= ?';
            params.push(data_inicio);
        }
        if (data_fim) {
            query += ' AND a.data_apontamento <= ?';
            params.push(data_fim);
        }
        if (maquina_id) {
            query += ' AND a.maquina_id = ?';
            params.push(maquina_id);
        }
        if (status) {
            query += ' AND a.status = ?';
            params.push(status);
        }

        query += ' ORDER BY a.data_apontamento DESC, a.criado_em DESC';

        const apontamentos = db.prepare(query).all(...params);

        // Buscar linhas de cada apontamento
        apontamentos.forEach(apt => {
            apt.linhas = db.prepare(`
                SELECT * FROM apontamento_linhas WHERE apontamento_id = ?
            `).all(apt.id);
        });

        res.json(apontamentos);

    } catch (error) {
        console.error('Erro ao listar apontamentos:', error);
        res.status(500).json({ error: 'Erro ao listar apontamentos' });
    }
});

// GET /api/apontamentos/:id - Buscar apontamento por ID
router.get('/:id', authMiddleware, (req, res) => {
    try {
        const { id } = req.params;

        const apontamento = db.prepare(`
            SELECT a.*, m.nome as maquina_nome
            FROM apontamentos a
            LEFT JOIN maquinas m ON a.maquina_id = m.id
            WHERE a.id = ?
        `).get(id);

        if (!apontamento) {
            return res.status(404).json({ error: 'Apontamento não encontrado' });
        }

        // Buscar linhas
        apontamento.linhas = db.prepare(`
            SELECT * FROM apontamento_linhas WHERE apontamento_id = ?
        `).all(id);

        res.json(apontamento);

    } catch (error) {
        console.error('Erro ao buscar apontamento:', error);
        res.status(500).json({ error: 'Erro ao buscar apontamento' });
    }
});

// POST /api/apontamentos - Criar novo apontamento
router.post('/', authMiddleware, (req, res) => {
    try {
        const { data_apontamento, maquina_id, operador, observacoes, linhas } = req.body;

        if (!data_apontamento || !maquina_id || !operador || !linhas || linhas.length === 0) {
            return res.status(400).json({ error: 'Dados obrigatórios faltando' });
        }

        // Inserir apontamento
        const insertApt = db.prepare(`
            INSERT INTO apontamentos (data_apontamento, maquina_id, operador, apontador_id, status, observacoes)
            VALUES (?, ?, ?, ?, 'em_apontamento', ?)
        `);

        const result = insertApt.run(data_apontamento, maquina_id, operador, req.userId, observacoes || null);
        const apontamento_id = result.lastInsertRowid;

        // Inserir linhas
        const insertLinha = db.prepare(`
            INSERT INTO apontamento_linhas 
            (apontamento_id, vila_id, etapa_id, sub_etapa_id, conta_id, sub_conta_id, supervisor, inicio, fim, horas_trabalhadas)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        linhas.forEach(linha => {
            const horas = calcularHoras(linha.inicio, linha.fim);
            insertLinha.run(
                apontamento_id,
                linha.vila_id,
                linha.etapa_id,
                linha.sub_etapa_id || null,
                linha.conta_id,
                linha.sub_conta_id || null,
                linha.supervisor || null,
                linha.inicio,
                linha.fim,
                horas
            );
        });

        res.status(201).json({
            message: 'Apontamento criado com sucesso',
            id: apontamento_id
        });

    } catch (error) {
        console.error('Erro ao criar apontamento:', error);
        res.status(500).json({ error: 'Erro ao criar apontamento' });
    }
});

// PUT /api/apontamentos/:id - Atualizar apontamento
router.put('/:id', authMiddleware, (req, res) => {
    try {
        const { id } = req.params;
        const { data_apontamento, maquina_id, operador, observacoes, linhas } = req.body;

        // Atualizar apontamento principal
        if (data_apontamento || maquina_id || operador || observacoes !== undefined) {
            const updates = [];
            const values = [];

            if (data_apontamento) {
                updates.push('data_apontamento = ?');
                values.push(data_apontamento);
            }
            if (maquina_id) {
                updates.push('maquina_id = ?');
                values.push(maquina_id);
            }
            if (operador) {
                updates.push('operador = ?');
                values.push(operador);
            }
            if (observacoes !== undefined) {
                updates.push('observacoes = ?');
                values.push(observacoes);
            }

            if (updates.length > 0) {
                updates.push('atualizado_em = CURRENT_TIMESTAMP');
                values.push(id);
                db.prepare(`UPDATE apontamentos SET ${updates.join(', ')} WHERE id = ?`).run(...values);
            }
        }

        // Atualizar linhas (deletar todas e recriar)
        if (linhas && linhas.length > 0) {
            db.prepare('DELETE FROM apontamento_linhas WHERE apontamento_id = ?').run(id);

            const insertLinha = db.prepare(`
                INSERT INTO apontamento_linhas 
                (apontamento_id, vila_id, etapa_id, sub_etapa_id, conta_id, sub_conta_id, supervisor, inicio, fim, horas_trabalhadas)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `);

            linhas.forEach(linha => {
                const horas = calcularHoras(linha.inicio, linha.fim);
                insertLinha.run(
                    id,
                    linha.vila_id,
                    linha.etapa_id,
                    linha.sub_etapa_id || null,
                    linha.conta_id,
                    linha.sub_conta_id || null,
                    linha.supervisor || null,
                    linha.inicio,
                    linha.fim,
                    horas
                );
            });
        }

        res.json({ message: 'Apontamento atualizado com sucesso' });

    } catch (error) {
        console.error('Erro ao atualizar apontamento:', error);
        res.status(500).json({ error: 'Erro ao atualizar apontamento' });
    }
});

// PUT /api/apontamentos/:id/status - Mudar status do apontamento
router.put('/:id/status', authMiddleware, (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatus = ['em_apontamento', 'liberado_apontador', 'pendente_supervisor', 'pendente_lider', 'aprovado'];
        if (!validStatus.includes(status)) {
            return res.status(400).json({ error: 'Status inválido' });
        }

        db.prepare(`
            UPDATE apontamentos 
            SET status = ?, atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(status, id);

        res.json({ message: 'Status atualizado com sucesso' });

    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

// DELETE /api/apontamentos/:id - Deletar apontamento
router.delete('/:id', authMiddleware, permissionMiddleware('Supervisor'), (req, res) => {
    try {
        const { id } = req.params;

        // DELETE CASCADE automático remove linhas
        db.prepare('DELETE FROM apontamentos WHERE id = ?').run(id);

        res.json({ message: 'Apontamento deletado com sucesso' });

    } catch (error) {
        console.error('Erro ao deletar apontamento:', error);
        res.status(500).json({ error: 'Erro ao deletar apontamento' });
    }
});

// GET /api/apontamentos/stats/kpis - Estatísticas e KPIs
router.get('/stats/kpis', authMiddleware, (req, res) => {
    try {
        const { data_inicio, data_fim } = req.query;

        let dateFilter = '';
        const params = [];

        if (data_inicio) {
            dateFilter += ' AND data_apontamento >= ?';
            params.push(data_inicio);
        }
        if (data_fim) {
            dateFilter += ' AND data_apontamento <= ?';
            params.push(data_fim);
        }

        // Total de apontamentos
        const totalApontamentos = db.prepare(`
            SELECT COUNT(*) as count FROM apontamentos WHERE 1=1 ${dateFilter}
        `).get(...params).count;

        // Apontamentos por status
        const porStatus = db.prepare(`
            SELECT status, COUNT(*) as count 
            FROM apontamentos 
            WHERE 1=1 ${dateFilter}
            GROUP BY status
        `).all(...params);

        // Horas trabalhadas
        const horasTrabalhadas = db.prepare(`
            SELECT SUM(horas_trabalhadas) as total
            FROM apontamento_linhas al
            JOIN apontamentos a ON al.apontamento_id = a.id
            WHERE 1=1 ${dateFilter}
        `).get(...params).total || 0;

        // Máquinas mais utilizadas
        const maquinasTop = db.prepare(`
            SELECT m.nome, COUNT(*) as count
            FROM apontamentos a
            JOIN maquinas m ON a.maquina_id = m.id
            WHERE 1=1 ${dateFilter}
            GROUP BY m.id, m.nome
            ORDER BY count DESC
            LIMIT 5
        `).all(...params);

        res.json({
            totalApontamentos,
            porStatus,
            horasTrabalhadas,
            maquinasTop
        });

    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

// Função auxiliar para calcular horas
function calcularHoras(inicio, fim) {
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fim.split(':').map(Number);

    const minutos1 = h1 * 60 + m1;
    const minutos2 = h2 * 60 + m2;

    let diff = minutos2 - minutos1;
    if (diff < 0) diff += 24 * 60; // Se passou da meia-noite

    return (diff / 60).toFixed(2);
}

module.exports = router;
