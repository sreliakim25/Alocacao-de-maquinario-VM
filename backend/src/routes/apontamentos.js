const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const permissionMiddleware = require('../middleware/permissions');

// GET /api/apontamentos - Listar apontamentos (com filtros)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data_inicio, data_fim, maquina_id, status } = req.query;

        let query = `
            SELECT a.*, m.nome as maquina_nome
            FROM apontamentos a
            LEFT JOIN maquinas m ON a.maquina_id = m.id
            WHERE 1=1
        `;
        const params = [];
        let counter = 1;

        if (data_inicio) {
            query += ` AND a.data_apontamento >= $${counter++}`;
            params.push(data_inicio);
        }
        if (data_fim) {
            query += ` AND a.data_apontamento <= $${counter++}`;
            params.push(data_fim);
        }
        if (maquina_id) {
            query += ` AND a.maquina_id = $${counter++}`;
            params.push(maquina_id);
        }
        if (status) {
            query += ` AND a.status = $${counter++}`;
            params.push(status);
        }

        query += ' ORDER BY a.data_apontamento DESC, a.criado_em DESC';

        const result = await db.query(query, params);
        const apontamentos = result.rows;

        // Buscar linhas de cada apontamento
        for (const apt of apontamentos) {
            const linesQuery = `
                SELECT al.*, 
                       v.nome as vila_nome, 
                       se.nome as etapa_nome, 
                       t.nome as tarefa_nome, 
                       u.nome as ugb_nome
                FROM apontamento_linhas al
                LEFT JOIN vilas v ON al.vila_id = v.id
                LEFT JOIN sub_etapas se ON al.etapa_id = se.id
                LEFT JOIN tarefas t ON al.sub_etapa_id = t.id
                LEFT JOIN ugbs u ON al.conta_id = u.id
                WHERE al.apontamento_id = $1
            `;
            const linesResult = await db.query(linesQuery, [apt.id]);
            apt.linhas = linesResult.rows;
        }

        res.json(apontamentos);

    } catch (error) {
        console.error('Erro ao listar apontamentos:', error);
        res.status(500).json({ error: 'Erro ao listar apontamentos' });
    }
});

// GET /api/apontamentos/:id - Buscar apontamento por ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT a.*, m.nome as maquina_nome
            FROM apontamentos a
            LEFT JOIN maquinas m ON a.maquina_id = m.id
            WHERE a.id = $1
        `;
        const result = await db.query(query, [id]);
        const apontamento = result.rows[0];

        if (!apontamento) {
            return res.status(404).json({ error: 'Apontamento não encontrado' });
        }

        // Buscar linhas
        const linesQuery = `
            SELECT al.*, 
                   v.nome as vila_nome, 
                   se.nome as etapa_nome, 
                   t.nome as tarefa_nome, 
                   u.nome as ugb_nome
            FROM apontamento_linhas al
            LEFT JOIN vilas v ON al.vila_id = v.id
            LEFT JOIN sub_etapas se ON al.etapa_id = se.id
            LEFT JOIN tarefas t ON al.sub_etapa_id = t.id
            LEFT JOIN ugbs u ON al.conta_id = u.id
            WHERE al.apontamento_id = $1
        `;
        const linesResult = await db.query(linesQuery, [id]);
        apontamento.linhas = linesResult.rows;

        res.json(apontamento);

    } catch (error) {
        console.error('Erro ao buscar apontamento:', error);
        res.status(500).json({ error: 'Erro ao buscar apontamento' });
    }
});

// POST /api/apontamentos - Criar novo apontamento
router.post('/', authMiddleware, async (req, res) => {
    const fs = require('fs');
    const logError = (msg, data) => {
        const timestamp = new Date().toISOString();
        const logContent = `[${timestamp}] ${msg}\nData: ${JSON.stringify(data, null, 2)}\n\n`;
        fs.appendFileSync('backend_errors.log', logContent);
    };

    try {
        const { data_apontamento, maquina_id, operador, observacoes, linhas } = req.body;

        if (!data_apontamento || !maquina_id || !operador || !linhas || linhas.length === 0) {
            return res.status(400).json({ error: 'Dados obrigatórios faltando' });
        }

        // START TRANSACTION
        await db.query('BEGIN');

        try {
            // Inserir apontamento
            const insertAptQuery = `
                INSERT INTO apontamentos (data_apontamento, maquina_id, operador, apontador_id, status, observacoes)
                VALUES ($1, $2, $3, $4, 'em_apontamento', $5)
                RETURNING id
            `;

            const aptResult = await db.query(insertAptQuery, [data_apontamento, maquina_id, operador, req.userId, observacoes || null]);
            const apontamento_id = aptResult.rows[0].id;

            // Inserir linhas
            const insertLinhaQuery = `
                INSERT INTO apontamento_linhas 
                (apontamento_id, vila_id, etapa_id, sub_etapa_id, conta_id, sub_conta_id, supervisor, inicio, fim, horas_trabalhadas, observacao)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `;

            for (const linha of linhas) {
                const horas = calcularHoras(linha.inicio, linha.fim);

                // DATA TYPE SAFEGUARDS
                const values = [
                    apontamento_id,
                    linha.vila_id,
                    linha.etapa_id,
                    linha.sub_etapa_id || null, // Ensure null if empty/undefined
                    linha.conta_id,
                    linha.sub_conta_id || null,
                    linha.supervisor || null,
                    linha.inicio,
                    linha.fim,
                    horas,
                    linha.observacao || null
                ];

                try {
                    await db.query(insertLinhaQuery, values);
                } catch (lineError) {
                    logError('Erro na inserção da linha individual', { values, error: lineError.message });
                    throw lineError; // Re-throw to trigger rollback
                }
            }

            // COMMIT TRANSACTION
            await db.query('COMMIT');

            res.status(201).json({
                message: 'Apontamento criado com sucesso',
                id: apontamento_id
            });

        } catch (innerError) {
            await db.query('ROLLBACK');
            logError('Erro durante transação de criação', { body: req.body, error: innerError.message });
            throw innerError;
        }

    } catch (error) {
        console.error('Erro ao criar apontamento:', error);
        res.status(500).json({ error: 'Erro ao criar apontamento. Consulte o log do servidor.' });
    }
});

// PUT /api/apontamentos/:id - Atualizar apontamento
router.put('/:id', authMiddleware, async (req, res) => {
    const fs = require('fs');
    const logDebug = (msg, data) => {
        try {
            const timestamp = new Date().toISOString();
            const logContent = `[${timestamp}] [DEBUG] [PUT] ${msg}\nData: ${JSON.stringify(data, null, 2)}\n\n`;
            fs.appendFileSync('backend_debug.log', logContent);
        } catch (e) {
            console.error('Log Error:', e);
        }
    };

    const { id } = req.params;
    const { data_apontamento, maquina_id, operador, observacoes, linhas } = req.body;

    logDebug(`Recebendo requisição PUT /apontamentos/${id}`, { bodyKeys: Object.keys(req.body) });

    // START TRANSACTION
    await db.query('BEGIN');
    logDebug('TRANSACAO INICIADA (BEGIN) PARA UPDATE');

    try {
        // Atualizar apontamento principal
        if (data_apontamento || maquina_id || operador || observacoes !== undefined) {
            const updates = [];
            const values = [];
            let counter = 1;

            if (data_apontamento) {
                updates.push(`data_apontamento = $${counter++}`);
                values.push(data_apontamento);
            }
            if (maquina_id) {
                updates.push(`maquina_id = $${counter++}`);
                values.push(maquina_id);
            }
            if (operador) {
                updates.push(`operador = $${counter++}`);
                values.push(operador);
            }
            if (observacoes !== undefined) {
                updates.push(`observacoes = $${counter++}`);
                values.push(observacoes);
            }

            if (updates.length > 0) {
                updates.push('atualizado_em = CURRENT_TIMESTAMP');
                values.push(id);
                // ID is last param
                await db.query(`UPDATE apontamentos SET ${updates.join(', ')} WHERE id = $${counter}`, values);
                logDebug('Header atualizado com sucesso');
            }
        }

        // Atualizar linhas (deletar todas e recriar)
        if (linhas && linhas.length > 0) {
            logDebug(`Deletando linhas antigas para o ID ${id}`);
            await db.query('DELETE FROM apontamento_linhas WHERE apontamento_id = $1', [id]);

            const insertLinhaQuery = `
                INSERT INTO apontamento_linhas 
                (apontamento_id, vila_id, etapa_id, sub_etapa_id, conta_id, sub_conta_id, supervisor, inicio, fim, horas_trabalhadas, observacao)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            `;

            for (const [index, linha] of linhas.entries()) {
                const horas = calcularHoras(linha.inicio, linha.fim);
                logDebug(`Processando (Inserção) Linha [${index}]`, { linha, horas });

                const values = [
                    id,
                    linha.vila_id, // Now receiving correct values from frontend
                    linha.etapa_id,
                    linha.sub_etapa_id || null,
                    linha.conta_id,
                    linha.sub_conta_id || null,
                    linha.supervisor || null,
                    linha.inicio,
                    linha.fim,
                    horas,
                    linha.observacao || null
                ];

                try {
                    await db.query(insertLinhaQuery, values);
                    logDebug(`Linha [${index}] inserida com sucesso`);
                } catch (lineError) {
                    logDebug(`ERRO ao inserir Linha [${index}]`, { values, error: lineError.message });
                    throw lineError;
                }
            }
        }

        await db.query('COMMIT');
        logDebug('TRANSACAO COMMITADA (Update finalizado)');

        res.json({ message: 'Apontamento atualizado com sucesso' });

    } catch (error) {
        await db.query('ROLLBACK');
        logDebug('ROLLBACK EXECUTADO (Update falhou)', { error: error.message });
        console.error('Erro ao atualizar apontamento:', error);
        res.status(500).json({ error: 'Erro ao atualizar apontamento' });
    }
});

// PUT /api/apontamentos/:id/status - Mudar status do apontamento
router.put('/:id/status', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatus = ['em_apontamento', 'liberado_apontador', 'pendente_supervisor', 'pendente_lider', 'aprovado'];
        if (!validStatus.includes(status)) {
            return res.status(400).json({ error: 'Status inválido' });
        }

        const query = `
            UPDATE apontamentos 
            SET status = $1, atualizado_em = CURRENT_TIMESTAMP
            WHERE id = $2
        `;
        await db.query(query, [status, id]);

        res.json({ message: 'Status atualizado com sucesso' });

    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

// DELETE /api/apontamentos/:id - Deletar apontamento
router.delete('/:id', authMiddleware, permissionMiddleware('Supervisor'), async (req, res) => {
    try {
        const { id } = req.params;

        // DELETE CASCADE automático remove linhas
        await db.query('DELETE FROM apontamentos WHERE id = $1', [id]);

        res.json({ message: 'Apontamento deletado com sucesso' });

    } catch (error) {
        console.error('Erro ao deletar apontamento:', error);
        res.status(500).json({ error: 'Erro ao deletar apontamento' });
    }
});

// GET /api/apontamentos/stats/kpis - Estatísticas e KPIs
router.get('/stats/kpis', authMiddleware, async (req, res) => {
    try {
        const { data_inicio, data_fim } = req.query;

        let dateFilter = '';
        const params = [];
        let counter = 1;

        if (data_inicio) {
            dateFilter += ` AND data_apontamento >= $${counter++}`;
            params.push(data_inicio);
        }
        if (data_fim) {
            dateFilter += ` AND data_apontamento <= $${counter++}`;
            params.push(data_fim);
        }

        // Total de apontamentos
        const totalResult = await db.query(`SELECT COUNT(*) as count FROM apontamentos WHERE 1=1 ${dateFilter}`, params);
        const totalApontamentos = totalResult.rows[0].count;

        // Apontamentos por status
        const statusResult = await db.query(`
            SELECT status, COUNT(*) as count 
            FROM apontamentos 
            WHERE 1=1 ${dateFilter}
            GROUP BY status
        `, params);
        const porStatus = statusResult.rows;

        // Horas trabalhadas
        const horasResult = await db.query(`
            SELECT SUM(horas_trabalhadas) as total
            FROM apontamento_linhas al
            JOIN apontamentos a ON al.apontamento_id = a.id
            WHERE 1=1 ${dateFilter}
        `, params);
        const horasTrabalhadas = horasResult.rows[0].total || 0;

        // Máquinas mais utilizadas
        const maquinasResult = await db.query(`
            SELECT m.nome, COUNT(*) as count
            FROM apontamentos a
            JOIN maquinas m ON a.maquina_id = m.id
            WHERE 1=1 ${dateFilter}
            GROUP BY m.id, m.nome
            ORDER BY count DESC
            LIMIT 5
        `, params);
        const maquinasTop = maquinasResult.rows;

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
