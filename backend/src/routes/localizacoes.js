const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const permissionMiddleware = require('../middleware/permissions');

// ========== IMPORTAÇÃO MESTRE ==========

// ========== IMPORTAÇÃO ==========

// Função auxiliar para normalizar strings
const normalize = (str) => str ? str.toString().trim() : '';

router.post('/import-master', authMiddleware, permissionMiddleware([]), async (req, res) => {
    const client = await db.pool.connect();
    try {
        let { dados, dryRun, importType } = req.body; // importType: 'empreendimentos' | 'supervisores'

        console.log(`📥 Importação iniciada. Tipo: ${importType}, Linhas: ${dados?.length}, DryRun: ${dryRun}`);

        await client.query('BEGIN');

        let stats = {
            ugbs: 0,
            vilas: 0,
            subEtapas: 0,
            tarefas: 0,
            supervisores: 0
        };

        // AUTO-DETECÇÃO DE TIPO (Failsafe Robust)
        // Verifica as primeiras 5 linhas para encontrar chaves, caso a primeira esteja vazia
        let keys = [];
        for (let i = 0; i < Math.min(dados.length, 5); i++) {
            const rowKeys = Object.keys(dados[i] || {}).map(k => k.toLowerCase());
            if (rowKeys.length > 0) {
                keys = rowKeys;
                break;
            }
        }

        // Determina tipo
        let typeToUse = importType;
        if (keys.some(k => k.includes('cargo') || k.includes('supervisor') || k.includes('lider') || k.includes('colaborador'))) {
            typeToUse = 'supervisores';
            console.log('🔄 Auto-detecção: Tipo de importação definido como SUPERVISORES');
        }

        console.log(`🛡️ Tipo de importação efetivo: ${typeToUse}, DryRun: ${dryRun}`);

        // =========================================================================
        // MODO 1: CADASTRO DE SUPERVISORES (Hierarquia)
        // Colunas: UGB, LÍDER DIRETO, COLABORADOR, CARGO
        // =========================================================================
        if (typeToUse === 'supervisores') {
            for (const row of dados) {
                // Tenta varias chaves para Lider
                const liderName = normalize(row['LÍDER DIRETO'] || row['LIDER DIRETO'] || row['Lider Direto'] || row['Lider'] || row['lider']);
                // Tenta varias chaves para Colaborador (Supervisor)
                const collabName = normalize(row['COLABORADOR'] || row['Colaborador'] || row['colaborador'] || row['SUPERVISOR'] || row['Supervisor'] || row['supervisor']);
                const cargo = normalize(row['CARGO'] || row['Cargo'] || row['cargo']);
                const ugbName = normalize(row['UGB'] || row['ugb']);

                if (!collabName) continue;

                // 1. Find/Create UGB (se fornecida)
                let ugbId = null;
                if (ugbName) {
                    const ugbRes = await client.query('SELECT id FROM ugbs WHERE nome = $1', [ugbName]);
                    if (ugbRes.rows.length > 0) {
                        ugbId = ugbRes.rows[0].id;
                    } else if (!dryRun) {
                        const newUgb = await client.query('INSERT INTO ugbs (nome, ativo) VALUES ($1, true) RETURNING id', [ugbName]);
                        ugbId = newUgb.rows[0].id;
                        stats.ugbs++;
                    }
                }

                if (dryRun) {
                    stats.supervisores++; // Simulando criação/atualização
                    continue;
                }

                // 2. Find/Create Leader (Recursive/Self-ref)
                let liderId = null;
                if (liderName) {
                    const leaderRes = await client.query('SELECT id FROM supervisores WHERE nome = $1', [liderName]);
                    if (leaderRes.rows.length > 0) {
                        liderId = leaderRes.rows[0].id;
                    } else {
                        const newLeader = await client.query('INSERT INTO supervisores (nome, ativo) VALUES ($1, true) RETURNING id', [liderName]);
                        liderId = newLeader.rows[0].id;
                    }
                }

                // 3. Upsert Collaborator (Supervisor)
                const collabRes = await client.query('SELECT id FROM supervisores WHERE nome = $1', [collabName]);
                if (collabRes.rows.length > 0) {
                    // Update existing (set cargo, ugb, leader AND inactive->active)
                    await client.query(
                        'UPDATE supervisores SET cargo = $1, ugb_id = $2, lider_id = $3, ativo = true WHERE id = $4',
                        [cargo, ugbId, liderId, collabRes.rows[0].id]
                    );
                    stats.supervisores++; // Conta updating também para feedback visual
                } else {
                    // Create new
                    await client.query(
                        'INSERT INTO supervisores (nome, cargo, ugb_id, lider_id, ativo) VALUES ($1, $2, $3, $4, true)',
                        [collabName, cargo, ugbId, liderId]
                    );
                    stats.supervisores++;
                }
            }

            // =========================================================================
            // MODO 2: CADASTRO DE EMPREENDIMENTOS (Padrão)
            // Colunas: UGB, Vila, Sub Etapa, Tarefa
            // =========================================================================
        } else {
            for (const row of dados) {
                const nomeUGB = normalize(row['UGB'] || row['Conta']);
                const nomeVila = normalize(row['Vila']);
                const nomeEtapa = normalize(row['Sub Etapa'] || row['Etapa']);
                const nomeTarefa = normalize(row['Tarefa'] || row['Sub-Etapa'] || row['Sub Etapa']);

                if (!nomeUGB && !nomeVila && !nomeEtapa && !nomeTarefa) continue;

                // 1. Process UGB
                let ugbId = null;
                if (nomeUGB) {
                    const ugbRes = await client.query('SELECT id FROM ugbs WHERE nome = $1', [nomeUGB]);
                    if (ugbRes.rows.length === 0) {
                        if (!dryRun) {
                            const cur = await client.query('INSERT INTO ugbs (nome, ativo) VALUES ($1, true) RETURNING id', [nomeUGB]);
                            ugbId = cur.rows[0].id;
                            stats.ugbs++;
                        }
                    } else {
                        ugbId = ugbRes.rows[0].id;
                    }
                }

                // 2. Process Vila
                let vilaId = null;
                if (nomeVila) {
                    const vilaRes = await client.query('SELECT id FROM vilas WHERE nome = $1', [nomeVila]);
                    if (vilaRes.rows.length === 0) {
                        if (!dryRun) {
                            const cur = await client.query('INSERT INTO vilas (nome, ugb_id, ativo) VALUES ($1, $2, true) RETURNING id', [nomeVila, ugbId]);
                            vilaId = cur.rows[0].id;
                            stats.vilas++;
                        }
                    } else {
                        vilaId = vilaRes.rows[0].id;
                        // Update UGB link if missing
                        if (ugbId && !dryRun) {
                            await client.query('UPDATE vilas SET ugb_id = $1 WHERE id = $2 AND ugb_id IS NULL', [ugbId, vilaId]);
                        }
                    }
                }

                // 3. Process Sub-Etapa (Global)
                let subEtapaId = null;
                if (nomeEtapa) {
                    const seRes = await client.query('SELECT id FROM sub_etapas WHERE nome = $1', [nomeEtapa]);
                    if (seRes.rows.length === 0) {
                        if (!dryRun) {
                            const cur = await client.query('INSERT INTO sub_etapas (nome, ativo) VALUES ($1, true) RETURNING id', [nomeEtapa]);
                            subEtapaId = cur.rows[0].id;
                            stats.sub_etapas++;
                        }
                    } else {
                        subEtapaId = seRes.rows[0].id;
                    }
                }

                // 4. Process Tarefa (Linked to Sub-Etapa)
                if (nomeTarefa && subEtapaId) {
                    const tRes = await client.query('SELECT id FROM tarefas WHERE nome = $1 AND sub_etapa_id = $2', [nomeTarefa, subEtapaId]);
                    if (tRes.rows.length === 0) {
                        if (!dryRun) {
                            await client.query('INSERT INTO tarefas (nome, sub_etapa_id, ativo) VALUES ($1, $2, true)', [nomeTarefa, subEtapaId]);
                            stats.tarefas++;
                        }
                    }
                }
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Importação concluída', stats, dryRun });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Erro na importação:', error);
        res.status(500).json({ error: 'Erro ao processar importação: ' + error.message });
    } finally {
        client.release();
    }
});

// ========== VILAS ==========

router.get('/vilas', authMiddleware, async (req, res) => {
    try {
        const { ugb_id } = req.query;
        const { conta_id, role } = req.user;

        let query = `
            SELECT v.*, u.nome as ugb_nome 
            FROM vilas v
            LEFT JOIN ugbs u ON v.ugb_id = u.id
            WHERE v.ativo = true
        `;
        const params = [];
        let counter = 1;

        // Enforce segregation
        if (conta_id && role !== 'Administrador' && role !== 'Desenvolvedor') {
            query += ` AND v.ugb_id = $${counter++}`;
            params.push(conta_id);
        } else if (ugb_id) {
            query += ` AND (v.ugb_id = $${counter++} OR v.ugb_id IS NULL)`;
            params.push(ugb_id);
        }

        query += ' ORDER BY v.nome';
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar vilas:', error);
        res.status(500).json({ error: 'Erro ao listar vilas' });
    }
});

router.post('/vilas', authMiddleware, permissionMiddleware([]), async (req, res) => {
    try {
        const { nome, ugb_id } = req.body;
        if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

        const result = await db.query('INSERT INTO vilas (nome, ugb_id, ativo) VALUES ($1, $2, true) RETURNING id', [nome, ugb_id]);
        res.status(201).json({ message: 'Vila criada', id: result.rows[0].id });
    } catch (error) {
        console.error('Erro ao criar vila:', error);
        res.status(500).json({ error: 'Erro ao criar vila' });
    }
});

router.delete('/vilas/:id', authMiddleware, permissionMiddleware([]), async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE vilas SET ativo = false WHERE id = $1', [id]);
        res.json({ message: 'Vila removida' });
    } catch (error) {
        console.error('Erro ao remover vila:', error);
        res.status(500).json({ error: 'Erro ao remover vila' });
    }
});


// ========== SUB-ETAPAS (Antigas Etapas) ==========

router.get('/sub-etapas', authMiddleware, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM sub_etapas WHERE ativo = true ORDER BY nome');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar sub-etapas:', error);
        res.status(500).json({ error: 'Erro ao listar sub-etapas' });
    }
});

router.post('/sub-etapas', authMiddleware, permissionMiddleware([]), async (req, res) => {
    try {
        const { nome } = req.body;
        if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

        const result = await db.query('INSERT INTO sub_etapas (nome, ativo) VALUES ($1, true) RETURNING id', [nome]);
        res.status(201).json({ message: 'Sub-etapa criada', id: result.rows[0].id });
    } catch (error) {
        console.error('Erro ao criar sub-etapa:', error);
        res.status(500).json({ error: 'Erro ao criar sub-etapa' });
    }
});

router.delete('/sub-etapas/:id', authMiddleware, permissionMiddleware([]), async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE sub_etapas SET ativo = false WHERE id = $1', [id]);
        res.json({ message: 'Sub-etapa removida' });
    } catch (error) {
        console.error('Erro ao remover sub-etapa:', error);
        res.status(500).json({ error: 'Erro ao remover sub-etapa' });
    }
});


// ========== TAREFAS (Antigas Sub-Etapas) ==========

router.get('/tarefas', authMiddleware, async (req, res) => {
    try {
        const { sub_etapa_id } = req.query;
        let query = `
            SELECT t.*, s.nome as sub_etapa_nome
            FROM tarefas t
            LEFT JOIN sub_etapas s ON t.sub_etapa_id = s.id
            WHERE t.ativo = true
        `;
        const params = [];

        if (sub_etapa_id) {
            query += ' AND t.sub_etapa_id = $1';
            params.push(sub_etapa_id);
        }
        query += ' ORDER BY t.nome';
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar tarefas:', error);
        res.status(500).json({ error: 'Erro ao listar tarefas' });
    }
});

router.post('/tarefas', authMiddleware, permissionMiddleware([]), async (req, res) => {
    try {
        const { sub_etapa_id, nome } = req.body;
        if (!sub_etapa_id || !nome) return res.status(400).json({ error: 'sub_etapa_id e nome obrigatórios' });

        const result = await db.query('INSERT INTO tarefas (sub_etapa_id, nome, ativo) VALUES ($1, $2, true) RETURNING id', [sub_etapa_id, nome]);
        res.status(201).json({ message: 'Tarefa criada', id: result.rows[0].id });
    } catch (error) {
        console.error('Erro ao criar tarefa:', error);
        res.status(500).json({ error: 'Erro ao criar tarefa' });
    }
});

router.delete('/tarefas/:id', authMiddleware, permissionMiddleware([]), async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE tarefas SET ativo = false WHERE id = $1', [id]);
        res.json({ message: 'Tarefa removida' });
    } catch (error) {
        console.error('Erro ao remover tarefa:', error);
        res.status(500).json({ error: 'Erro ao remover tarefa' });
    }
});


// ========== UGBS (Antigas Contas) ==========

router.get('/ugbs', authMiddleware, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM ugbs WHERE ativo = true ORDER BY nome');
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar ugbs:', error);
        res.status(500).json({ error: 'Erro ao listar ugbs' });
    }
});

router.post('/ugbs', authMiddleware, permissionMiddleware([]), async (req, res) => {
    try {
        const { nome } = req.body;
        if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

        const result = await db.query('INSERT INTO ugbs (nome, ativo) VALUES ($1, true) RETURNING id', [nome]);
        res.status(201).json({ message: 'UGB criada', id: result.rows[0].id });
    } catch (error) {
        console.error('Erro ao criar ugb:', error);
        res.status(500).json({ error: 'Erro ao criar ugb' });
    }
});

router.delete('/ugbs/:id', authMiddleware, permissionMiddleware([]), async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE ugbs SET ativo = false WHERE id = $1', [id]);
        res.json({ message: 'UGB removida' });
    } catch (error) {
        console.error('Erro ao remover ugb:', error);
        res.status(500).json({ error: 'Erro ao remover ugb' });
    }
});

// ========== SUPERVISORES (Novo) ==========

router.get('/supervisores', authMiddleware, async (req, res) => {
    try {
        const { ugb_id } = req.query;
        const { conta_id, role } = req.user;

        let query = `
            SELECT s.*, u.nome as ugb_nome, l.nome as lider_nome
            FROM supervisores s
            LEFT JOIN ugbs u ON s.ugb_id = u.id
            LEFT JOIN supervisores l ON s.lider_id = l.id
            WHERE s.ativo = true
        `;
        const params = [];
        let counter = 1;

        // Enforce segregation
        if (conta_id && role !== 'Administrador' && role !== 'Desenvolvedor') {
            query += ` AND s.ugb_id = $${counter++}`;
            params.push(conta_id);
        } else if (ugb_id) {
            query += ` AND s.ugb_id = $${counter++}`;
            params.push(ugb_id);
        }

        query += ' ORDER BY s.nome';
        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar supervisores:', error);
        res.status(500).json({ error: 'Erro ao listar supervisores' });
    }
});

router.post('/supervisores', authMiddleware, permissionMiddleware([]), async (req, res) => {
    try {
        const { nome, cargo, ugb_id, lider_id } = req.body;
        if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

        const result = await db.query(
            'INSERT INTO supervisores (nome, cargo, ugb_id, lider_id, ativo) VALUES ($1, $2, $3, $4, true) RETURNING id',
            [nome, cargo, ugb_id, lider_id]
        );
        res.status(201).json({ message: 'Supervisor criado', id: result.rows[0].id });
    } catch (error) {
        console.error('Erro ao criar supervisor:', error);
        res.status(500).json({ error: 'Erro ao criar supervisor' });
    }
});

router.delete('/supervisores/:id', authMiddleware, permissionMiddleware([]), async (req, res) => {
    try {
        const { id } = req.params;
        await db.query('UPDATE supervisores SET ativo = false WHERE id = $1', [id]);
        res.json({ message: 'Supervisor removido' });
    } catch (error) {
        console.error('Erro ao remover supervisor:', error);
        res.status(500).json({ error: 'Erro ao remover supervisor' });
    }
});

// ========== RESET GERAL (LIMPEZA TOTAL) ==========

router.delete('/reset-database', authMiddleware, async (req, res) => {
    try {
        // Verifica se é administrador ou desenvolvedor
        if (req.userRole !== 'Desenvolvedor' && req.userRole !== 'Gerente') {
            return res.status(403).json({ error: 'Apenas Gerentes e Desenvolvedores podem resetar o banco de dados.' });
        }

        const client = await db.pool.connect();
        try {
            await client.query('BEGIN');

            // Ordem importa por causa das Chaves Estrangeiras (FKs)
            console.log('🗑️ Iniciando limpeza total das tabelas de cadastro...');

            // 1. Tarefas (Dependem de sub_etapas)
            await client.query('DELETE FROM tarefas');

            // 2. Sub-etapas e Vilas (Dependem de ugbs, ou são globais)
            await client.query('DELETE FROM sub_etapas');
            await client.query('DELETE FROM vilas');

            // 3. UGBs e Supervisores
            await client.query('DELETE FROM ugbs');
            await client.query('DELETE FROM supervisores');

            await client.query('COMMIT');
            console.log('✅ Banco de dados de cadastros limpo com sucesso!');
            res.json({ message: 'Todas as informações de cadastro (Cadastros Gerais) foram apagadas com sucesso.' });

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Erro no reset de banco:', error);
        res.status(500).json({ error: 'Erro ao limpar banco de dados: ' + error.message });
    }
});

module.exports = router;
