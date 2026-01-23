const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const permissionMiddleware = require('../middleware/permissions');

// GET /api/apontamentos - Listar apontamentos (com filtros)
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data_inicio, data_fim, maquina_id, status } = req.query;
        const { conta_id, role } = req.user;

        let queryBase = `
            SELECT DISTINCT a.id, a.data_apontamento, a.maquina_id, a.operador, a.apontador_id, a.status, a.criado_em, a.observacoes, m.nome as maquina_nome
            FROM apontamentos a
            LEFT JOIN maquinas m ON a.maquina_id = m.id
        `;

        // Segregation Join
        if (conta_id && role !== 'Administrador' && role !== 'Desenvolvedor') {
            queryBase += ` JOIN apontamento_linhas al_seg ON a.id = al_seg.apontamento_id `;
        }

        let queryWhere = ` WHERE 1=1 `;
        const params = [];
        let counter = 1;

        // Segregation Filter
        if (conta_id && role !== 'Administrador' && role !== 'Desenvolvedor') {
            queryWhere += ` AND al_seg.conta_id = $${counter++} `;
            params.push(conta_id);
        }

        if (data_inicio) {
            queryWhere += ` AND a.data_apontamento >= $${counter++}`;
            params.push(data_inicio);
        }
        if (data_fim) {
            queryWhere += ` AND a.data_apontamento <= $${counter++}`;
            params.push(data_fim);
        }
        if (maquina_id) {
            queryWhere += ` AND a.maquina_id = $${counter++}`;
            params.push(maquina_id);
        }
        if (status) {
            queryWhere += ` AND a.status = $${counter++}`;
            params.push(status);
        }

        // VISIBILITY RULES
        if (role === 'Supervisor') {
            // Supervisors cannot see 'em_apontamento' (Drafts)
            queryWhere += ` AND a.status != 'em_apontamento'`;
        } else if (role === 'Líder' || role === 'Lider') {
            // Leaders only see what Supervisors approved
            queryWhere += ` AND a.status IN ('pendente_lider', 'aprovado', 'liberado_lider')`;
        }

        const query = queryBase + queryWhere + ' ORDER BY a.data_apontamento DESC, a.criado_em DESC';

        const result = await db.query(query, params);
        const apontamentos = result.rows;

        // Buscar linhas de cada apontamento
        for (const apt of apontamentos) {
            let linesQuery = `
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
            const linesParams = [apt.id];

            // Também filtrar as linhas exibidas? Sim, para consistência visual.
            if (conta_id && role !== 'Administrador' && role !== 'Desenvolvedor') {
                linesQuery += ` AND al.conta_id = $2`;
                linesParams.push(conta_id);
            }

            const linesResult = await db.query(linesQuery, linesParams);
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
router.post('/', authMiddleware, permissionMiddleware(['Apontador', 'Suprimentos']), async (req, res) => {
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

// PUT /api/apontamentos/:id - Atualizar apontamento (Conteúdo)
router.put('/:id', authMiddleware, permissionMiddleware(['Apontador']), async (req, res) => {
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

// PUT /api/apontamentos/:id/status - Mudar status do apontamento (Validação)
router.put('/:id/status', authMiddleware, permissionMiddleware(['Apontador', 'Suprimentos', 'Supervisor', 'Líder']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatus = ['em_apontamento', 'liberado_apontador', 'pendente_supervisor', 'pendente_lider', 'aprovado', 'liberado_lider']; // Added liberado_lider just in case
        if (!validStatus.includes(status)) {
            return res.status(400).json({ error: 'Status inválido' });
        }

        let query = `
            UPDATE apontamentos 
            SET status = $1, atualizado_em = CURRENT_TIMESTAMP
        `;
        const params = [status, id];
        let counter = 3;

        // REJECTION LOGIC
        if (status === 'em_apontamento') {
            // If reverting to draft (Rejection), reason is required
            const { observacoes_reprovacao } = req.body;
            if (!observacoes_reprovacao) {
                return res.status(400).json({ error: 'Motivo da reprovação é obrigatório' });
            }

            // Append to existing validation/observation log
            // We use standard string concat for simplicity in SQL
            // formatted: [Data] [Autor] Motivo
            const timestamp = new Date().toLocaleString('pt-BR');
            const autor = req.user.nome || req.userRole;
            const newObs = `\n[REPROVADO em ${timestamp} por ${autor}]: ${observacoes_reprovacao}`;

            query += `, observacoes = COALESCE(observacoes, '') || $${counter++}`;
            params.push(newObs);
        }

        query += ` WHERE id = $2`;

        await db.query(query, params);

        res.json({ message: 'Status atualizado com sucesso' });

    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

// DELETE /api/apontamentos/:id - Deletar apontamento
router.delete('/:id', authMiddleware, permissionMiddleware(['Apontador', 'Suprimentos']), async (req, res) => {
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
        const { conta_id, role } = req.user;

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

        let segregationJoin = '';
        let segregationFilter = '';

        if (conta_id && role !== 'Administrador' && role !== 'Desenvolvedor') {
            // Logic for total count needs to join lines to check UGB
            // We can filter appointments that have at least one line of this UGB
            segregationJoin = ` JOIN apontamento_linhas al_seg ON a.id = al_seg.apontamento_id `;
            segregationFilter = ` AND al_seg.conta_id = $${counter++} `;
            params.push(conta_id);
        }

        // Total de apontamentos (Unique appointment IDs that match filter)
        const totalQuery = `
            SELECT COUNT(DISTINCT a.id) as count 
            FROM apontamentos a
            ${segregationJoin}
            WHERE 1=1 ${dateFilter} ${segregationFilter}
        `;
        const totalResult = await db.query(totalQuery, params);
        const totalApontamentos = totalResult.rows[0].count;

        // Apontamentos por status
        const statusQuery = `
            SELECT a.status, COUNT(DISTINCT a.id) as count 
            FROM apontamentos a
            ${segregationJoin}
            WHERE 1=1 ${dateFilter} ${segregationFilter}
            GROUP BY a.status
        `;
        const statusResult = await db.query(statusQuery, params);
        const porStatus = statusResult.rows;

        // Horas trabalhadas (Only sum lines that belong to the UGB if segregated?)
        // If segregated, we probably only want to count hours for that UGB.
        // Currently hours are summed from al.horas_trabalhadas

        // Re-construct logic for lines stats specifically
        // If segregated, we filter by al.conta_id in the JOIN or WHERE

        let horasWhere = ` WHERE 1=1 ${dateFilter} `;

        // Note: dateFilter uses 'data_apontamento', so we need join with apontamentos 'a'

        let horasQuery = `
            SELECT SUM(al.horas_trabalhadas) as total
            FROM apontamento_linhas al
            JOIN apontamentos a ON al.apontamento_id = a.id
        `;

        // Params for Horas (need to be fresh or careful with order)
        // Let's create specific params for this query to avoid index confusion or reuse
        // Actually, reusing params with different query structure is tricky. 
        // Better to rebuild params for this query if structure differs.

        const horasParams = [];
        let hCounter = 1;
        if (data_inicio) {
            horasQuery += ` AND a.data_apontamento >= $${hCounter++}`;
            horasParams.push(data_inicio);
        }
        if (data_fim) {
            horasQuery += ` AND a.data_apontamento <= $${hCounter++}`;
            horasParams.push(data_fim);
        }

        if (conta_id && role !== 'Administrador' && role !== 'Desenvolvedor') {
            horasQuery += ` AND al.conta_id = $${hCounter++}`;
            horasParams.push(conta_id);
        }

        const horasResult = await db.query(horasQuery, horasParams);
        const horasTrabalhadas = horasResult.rows[0].total || 0;

        // Máquinas mais utilizadas
        // Filter appointments by segregation, then count
        // Can reuse the main logic, join maquinas

        const maquinasQuery = `
            SELECT m.nome, COUNT(DISTINCT a.id) as count
            FROM apontamentos a
            JOIN maquinas m ON a.maquina_id = m.id
            ${segregationJoin}
            WHERE 1=1 ${dateFilter} ${segregationFilter}
            GROUP BY m.id, m.nome
            ORDER BY count DESC
            LIMIT 5
        `;
        // Reuse original params which cover date and segregation
        const maquinasResult = await db.query(maquinasQuery, params);
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
