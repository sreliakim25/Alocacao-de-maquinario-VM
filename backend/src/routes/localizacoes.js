const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const permissionMiddleware = require('../middleware/permissions');

const normalize = (str) => str ? str.toString().trim() : '';

// ========== IMPORTAÇÃO MESTRE ==========

router.post('/import-master', authMiddleware, permissionMiddleware([]), async (req, res) => {
    try {
        let { dados, dryRun, importType } = req.body;

        console.log(`📥 Importação iniciada. Tipo: ${importType}, Linhas: ${dados?.length}, DryRun: ${dryRun}`);

        let stats = { ugbs: 0, vilas: 0, subEtapas: 0, tarefas: 0, supervisores: 0 };

        // Auto-detecção de tipo
        let keys = [];
        for (let i = 0; i < Math.min(dados.length, 5); i++) {
            const rowKeys = Object.keys(dados[i] || {}).map(k => k.toLowerCase());
            if (rowKeys.length > 0) { keys = rowKeys; break; }
        }

        let typeToUse = importType;
        if (keys.some(k => k.includes('cargo') || k.includes('supervisor') || k.includes('lider') || k.includes('colaborador'))) {
            typeToUse = 'supervisores';
        }

        console.log(`🛡️ Tipo de importação efetivo: ${typeToUse}, DryRun: ${dryRun}`);

        if (typeToUse === 'supervisores') {
            for (const row of dados) {
                const liderName = normalize(row['LÍDER DIRETO'] || row['LIDER DIRETO'] || row['Lider Direto'] || row['Lider'] || row['lider']);
                const collabName = normalize(row['COLABORADOR'] || row['Colaborador'] || row['colaborador'] || row['SUPERVISOR'] || row['Supervisor'] || row['supervisor']);
                const cargo = normalize(row['CARGO'] || row['Cargo'] || row['cargo']);
                const ugbName = normalize(row['UGB'] || row['ugb']);

                if (!collabName) continue;

                let ugbId = null;
                if (ugbName) {
                    const { data: ugbRes } = await supabase.from('ugbs').select('id').eq('nome', ugbName).maybeSingle();
                    if (ugbRes) {
                        ugbId = ugbRes.id;
                    } else if (!dryRun) {
                        const { data: newUgb } = await supabase.from('ugbs').insert({ nome: ugbName, ativo: true }).select('id').single();
                        ugbId = newUgb.id;
                        stats.ugbs++;
                    }
                }

                if (dryRun) { stats.supervisores++; continue; }

                let liderId = null;
                if (liderName) {
                    const { data: leaderRes } = await supabase.from('supervisores').select('id').eq('nome', liderName).maybeSingle();
                    if (leaderRes) {
                        liderId = leaderRes.id;
                    } else {
                        const { data: newLeader } = await supabase.from('supervisores').insert({ nome: liderName, ativo: true }).select('id').single();
                        liderId = newLeader.id;
                    }
                }

                const { data: collabRes } = await supabase.from('supervisores').select('id').eq('nome', collabName).maybeSingle();
                if (collabRes) {
                    await supabase.from('supervisores').update({ cargo, ugb_id: ugbId, lider_id: liderId, ativo: true }).eq('id', collabRes.id);
                } else {
                    await supabase.from('supervisores').insert({ nome: collabName, cargo, ugb_id: ugbId, lider_id: liderId, ativo: true });
                }
                stats.supervisores++;
            }

        } else {
            for (const row of dados) {
                const nomeUGB = normalize(row['UGB'] || row['Conta']);
                const nomeVila = normalize(row['Vila']);
                const nomeEtapa = normalize(row['Sub Etapa'] || row['Etapa']);
                const nomeTarefa = normalize(row['Tarefa'] || row['Sub-Etapa'] || row['Sub Etapa']);

                if (!nomeUGB && !nomeVila && !nomeEtapa && !nomeTarefa) continue;

                let ugbId = null;
                if (nomeUGB) {
                    const { data: ugbRes } = await supabase.from('ugbs').select('id').eq('nome', nomeUGB).maybeSingle();
                    if (ugbRes) {
                        ugbId = ugbRes.id;
                    } else if (!dryRun) {
                        const { data: cur } = await supabase.from('ugbs').insert({ nome: nomeUGB, ativo: true }).select('id').single();
                        ugbId = cur.id;
                        stats.ugbs++;
                    }
                }

                let vilaId = null;
                if (nomeVila) {
                    const { data: vilaRes } = await supabase.from('vilas').select('id').eq('nome', nomeVila).maybeSingle();
                    if (vilaRes) {
                        vilaId = vilaRes.id;
                        if (ugbId && !dryRun) {
                            await supabase.from('vilas').update({ ugb_id: ugbId }).eq('id', vilaId).is('ugb_id', null);
                        }
                    } else if (!dryRun) {
                        const { data: cur } = await supabase.from('vilas').insert({ nome: nomeVila, ugb_id: ugbId, ativo: true }).select('id').single();
                        vilaId = cur.id;
                        stats.vilas++;
                    }
                }

                let subEtapaId = null;
                if (nomeEtapa) {
                    const { data: seRes } = await supabase.from('sub_etapas').select('id').eq('nome', nomeEtapa).maybeSingle();
                    if (seRes) {
                        subEtapaId = seRes.id;
                    } else if (!dryRun) {
                        const { data: cur } = await supabase.from('sub_etapas').insert({ nome: nomeEtapa, ativo: true }).select('id').single();
                        subEtapaId = cur.id;
                        stats.subEtapas++;
                    }
                }

                if (nomeTarefa && subEtapaId && !dryRun) {
                    const { data: tRes } = await supabase.from('tarefas').select('id').eq('nome', nomeTarefa).eq('sub_etapa_id', subEtapaId).maybeSingle();
                    if (!tRes) {
                        await supabase.from('tarefas').insert({ nome: nomeTarefa, sub_etapa_id: subEtapaId, ativo: true });
                        stats.tarefas++;
                    }
                }
            }
        }

        res.json({ message: 'Importação concluída', stats, dryRun });

    } catch (error) {
        console.error('Erro na importação:', error);
        res.status(500).json({ error: 'Erro ao processar importação: ' + error.message });
    }
});

// ========== VILAS ==========

router.get('/vilas', authMiddleware, async (req, res) => {
    try {
        const { ugb_id } = req.query;
        const { conta_id, role } = req.user;

        let query = supabase
            .from('vilas')
            .select('*, ugbs(nome)')
            .eq('ativo', true)
            .order('nome');

        if (conta_id && role !== 'Administrador' && role !== 'Desenvolvedor') {
            query = query.eq('ugb_id', conta_id);
        } else if (ugb_id) {
            query = query.or(`ugb_id.eq.${ugb_id},ugb_id.is.null`);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Flatten ugbs join para compatibilidade
        res.json(data.map(v => ({ ...v, ugb_nome: v.ugbs?.nome || null, ugbs: undefined })));
    } catch (error) {
        console.error('Erro ao listar vilas:', error);
        res.status(500).json({ error: 'Erro ao listar vilas' });
    }
});

router.post('/vilas', authMiddleware, permissionMiddleware([]), async (req, res) => {
    try {
        const { nome, ugb_id } = req.body;
        if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

        const { data, error } = await supabase.from('vilas').insert({ nome, ugb_id, ativo: true }).select('id').single();
        if (error) throw error;
        res.status(201).json({ message: 'Vila criada', id: data.id });
    } catch (error) {
        console.error('Erro ao criar vila:', error);
        res.status(500).json({ error: 'Erro ao criar vila' });
    }
});

router.delete('/vilas/:id', authMiddleware, permissionMiddleware([]), async (req, res) => {
    try {
        const { error } = await supabase.from('vilas').update({ ativo: false }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Vila removida' });
    } catch (error) {
        console.error('Erro ao remover vila:', error);
        res.status(500).json({ error: 'Erro ao remover vila' });
    }
});

// ========== SUB-ETAPAS ==========

router.get('/sub-etapas', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase.from('sub_etapas').select('*').eq('ativo', true).order('nome');
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao listar sub-etapas:', error);
        res.status(500).json({ error: 'Erro ao listar sub-etapas' });
    }
});

router.post('/sub-etapas', authMiddleware, permissionMiddleware([]), async (req, res) => {
    try {
        const { nome } = req.body;
        if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

        const { data, error } = await supabase.from('sub_etapas').insert({ nome, ativo: true }).select('id').single();
        if (error) throw error;
        res.status(201).json({ message: 'Sub-etapa criada', id: data.id });
    } catch (error) {
        console.error('Erro ao criar sub-etapa:', error);
        res.status(500).json({ error: 'Erro ao criar sub-etapa' });
    }
});

router.delete('/sub-etapas/:id', authMiddleware, permissionMiddleware([]), async (req, res) => {
    try {
        const { error } = await supabase.from('sub_etapas').update({ ativo: false }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Sub-etapa removida' });
    } catch (error) {
        console.error('Erro ao remover sub-etapa:', error);
        res.status(500).json({ error: 'Erro ao remover sub-etapa' });
    }
});

// ========== TAREFAS ==========

router.get('/tarefas', authMiddleware, async (req, res) => {
    try {
        const { sub_etapa_id } = req.query;

        let query = supabase
            .from('tarefas')
            .select('*, sub_etapas(nome)')
            .eq('ativo', true)
            .order('nome');

        if (sub_etapa_id) query = query.eq('sub_etapa_id', sub_etapa_id);

        const { data, error } = await query;
        if (error) throw error;
        res.json(data.map(t => ({ ...t, sub_etapa_nome: t.sub_etapas?.nome || null, sub_etapas: undefined })));
    } catch (error) {
        console.error('Erro ao listar tarefas:', error);
        res.status(500).json({ error: 'Erro ao listar tarefas' });
    }
});

router.post('/tarefas', authMiddleware, permissionMiddleware([]), async (req, res) => {
    try {
        const { sub_etapa_id, nome } = req.body;
        if (!sub_etapa_id || !nome) return res.status(400).json({ error: 'sub_etapa_id e nome obrigatórios' });

        const { data, error } = await supabase.from('tarefas').insert({ sub_etapa_id, nome, ativo: true }).select('id').single();
        if (error) throw error;
        res.status(201).json({ message: 'Tarefa criada', id: data.id });
    } catch (error) {
        console.error('Erro ao criar tarefa:', error);
        res.status(500).json({ error: 'Erro ao criar tarefa' });
    }
});

router.delete('/tarefas/:id', authMiddleware, permissionMiddleware([]), async (req, res) => {
    try {
        const { error } = await supabase.from('tarefas').update({ ativo: false }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Tarefa removida' });
    } catch (error) {
        console.error('Erro ao remover tarefa:', error);
        res.status(500).json({ error: 'Erro ao remover tarefa' });
    }
});

// ========== UGBS ==========

router.get('/ugbs', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase.from('ugbs').select('*').eq('ativo', true).order('nome');
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao listar ugbs:', error);
        res.status(500).json({ error: 'Erro ao listar ugbs' });
    }
});

router.post('/ugbs', authMiddleware, permissionMiddleware([]), async (req, res) => {
    try {
        const { nome } = req.body;
        if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

        const { data, error } = await supabase.from('ugbs').insert({ nome, ativo: true }).select('id').single();
        if (error) throw error;
        res.status(201).json({ message: 'UGB criada', id: data.id });
    } catch (error) {
        console.error('Erro ao criar ugb:', error);
        res.status(500).json({ error: 'Erro ao criar ugb' });
    }
});

router.delete('/ugbs/:id', authMiddleware, permissionMiddleware([]), async (req, res) => {
    try {
        const { error } = await supabase.from('ugbs').update({ ativo: false }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'UGB removida' });
    } catch (error) {
        console.error('Erro ao remover ugb:', error);
        res.status(500).json({ error: 'Erro ao remover ugb' });
    }
});

// ========== SUPERVISORES ==========

router.get('/supervisores', authMiddleware, async (req, res) => {
    try {
        const { ugb_id } = req.query;
        const { conta_id, role } = req.user;

        let query = supabase
            .from('supervisores')
            .select('*, ugbs(nome), lider:supervisores!lider_id(nome)')
            .eq('ativo', true)
            .order('nome');

        if (conta_id && role !== 'Administrador' && role !== 'Desenvolvedor') {
            query = query.eq('ugb_id', conta_id);
        } else if (ugb_id) {
            query = query.eq('ugb_id', ugb_id);
        }

        const { data, error } = await query;
        if (error) throw error;
        res.json(data.map(s => ({ ...s, ugb_nome: s.ugbs?.nome || null, lider_nome: s.lider?.nome || null, ugbs: undefined, lider: undefined })));
    } catch (error) {
        console.error('Erro ao listar supervisores:', error);
        res.status(500).json({ error: 'Erro ao listar supervisores' });
    }
});

router.post('/supervisores', authMiddleware, permissionMiddleware([]), async (req, res) => {
    try {
        const { nome, cargo, ugb_id, lider_id } = req.body;
        if (!nome) return res.status(400).json({ error: 'Nome é obrigatório' });

        const { data, error } = await supabase
            .from('supervisores')
            .insert({ nome, cargo, ugb_id, lider_id, ativo: true })
            .select('id')
            .single();

        if (error) throw error;
        res.status(201).json({ message: 'Supervisor criado', id: data.id });
    } catch (error) {
        console.error('Erro ao criar supervisor:', error);
        res.status(500).json({ error: 'Erro ao criar supervisor' });
    }
});

router.delete('/supervisores/:id', authMiddleware, permissionMiddleware([]), async (req, res) => {
    try {
        const { error } = await supabase.from('supervisores').update({ ativo: false }).eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Supervisor removido' });
    } catch (error) {
        console.error('Erro ao remover supervisor:', error);
        res.status(500).json({ error: 'Erro ao remover supervisor' });
    }
});

// ========== RESET GERAL ==========

router.delete('/reset-database', authMiddleware, async (req, res) => {
    try {
        if (req.userRole !== 'Desenvolvedor' && req.userRole !== 'Gerente') {
            return res.status(403).json({ error: 'Apenas Gerentes e Desenvolvedores podem resetar o banco de dados.' });
        }

        console.log('🗑️ Iniciando limpeza total das tabelas de cadastro...');

        await supabase.from('tarefas').delete().neq('id', 0);
        await supabase.from('sub_etapas').delete().neq('id', 0);
        await supabase.from('vilas').delete().neq('id', 0);
        await supabase.from('ugbs').delete().neq('id', 0);
        await supabase.from('supervisores').delete().neq('id', 0);

        console.log('✅ Banco de dados de cadastros limpo com sucesso!');
        res.json({ message: 'Todas as informações de cadastro foram apagadas com sucesso.' });

    } catch (error) {
        console.error('❌ Erro no reset de banco:', error);
        res.status(500).json({ error: 'Erro ao limpar banco de dados: ' + error.message });
    }
});

module.exports = router;
