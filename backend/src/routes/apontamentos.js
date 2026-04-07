const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const authMiddleware = require('../middleware/auth');
const permissionMiddleware = require('../middleware/permissions');

// GET /api/apontamentos/stats/kpis — deve vir antes de /:id
router.get('/stats/kpis', authMiddleware, async (req, res) => {
    try {
        const { data_inicio, data_fim } = req.query;
        const { conta_id, role } = req.user;

        // Buscar apontamentos com linhas para calcular KPIs
        let aptQuery = supabase
            .from('apontamentos')
            .select('id, status, data_apontamento, maquinas(nome), apontamento_linhas(horas_trabalhadas, conta_id)');

        if (data_inicio) aptQuery = aptQuery.gte('data_apontamento', data_inicio);
        if (data_fim) aptQuery = aptQuery.lte('data_apontamento', data_fim);

        const { data: apts, error } = await aptQuery;
        if (error) throw error;

        // Filtrar por conta_id se necessário
        const filtered = (conta_id && role !== 'Administrador' && role !== 'Desenvolvedor')
            ? apts.filter(a => a.apontamento_linhas?.some(l => l.conta_id === conta_id))
            : apts;

        const totalApontamentos = filtered.length;

        // Por status
        const statusMap = {};
        filtered.forEach(a => { statusMap[a.status] = (statusMap[a.status] || 0) + 1; });
        const porStatus = Object.entries(statusMap).map(([status, count]) => ({ status, count }));

        // Horas trabalhadas
        let horasTrabalhadas = 0;
        filtered.forEach(a => {
            a.apontamento_linhas?.forEach(l => {
                if (!conta_id || role === 'Administrador' || role === 'Desenvolvedor' || l.conta_id === conta_id) {
                    horasTrabalhadas += parseFloat(l.horas_trabalhadas || 0);
                }
            });
        });

        // Top 5 máquinas
        const maqMap = {};
        filtered.forEach(a => {
            const nome = a.maquinas?.nome || 'Desconhecida';
            maqMap[nome] = (maqMap[nome] || 0) + 1;
        });
        const maquinasTop = Object.entries(maqMap)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([nome, count]) => ({ nome, count }));

        res.json({ totalApontamentos, porStatus, horasTrabalhadas, maquinasTop });

    } catch (error) {
        console.error('Erro ao buscar estatísticas:', error);
        res.status(500).json({ error: 'Erro ao buscar estatísticas' });
    }
});

// GET /api/apontamentos
router.get('/', authMiddleware, async (req, res) => {
    try {
        const { data_inicio, data_fim, maquina_id, status } = req.query;
        const { conta_id, role } = req.user;

        let query = supabase
            .from('apontamentos')
            .select(`
                id, data_apontamento, maquina_id, operador, apontador_id, status, criado_em, observacoes,
                maquinas(nome),
                apontamento_linhas(
                    id, vila_id, etapa_id, sub_etapa_id, conta_id, sub_conta_id, supervisor, inicio, fim, horas_trabalhadas, observacao,
                    vilas(nome),
                    sub_etapas(nome),
                    tarefas(nome),
                    ugbs(nome)
                )
            `)
            .order('data_apontamento', { ascending: false })
            .order('criado_em', { ascending: false });

        if (data_inicio) query = query.gte('data_apontamento', data_inicio);
        if (data_fim) query = query.lte('data_apontamento', data_fim);
        if (maquina_id) query = query.eq('maquina_id', maquina_id);
        if (status) query = query.eq('status', status);

        // Visibility rules
        if (role === 'Supervisor') {
            query = query.neq('status', 'em_apontamento');
        } else if (role === 'Líder' || role === 'Lider') {
            query = query.in('status', ['pendente_lider', 'aprovado', 'liberado_lider']);
        }

        const { data, error } = await query;
        if (error) throw error;

        // Flatten e filtrar por conta_id
        let apontamentos = data.map(a => ({
            ...a,
            maquina_nome: a.maquinas?.nome || null,
            maquinas: undefined,
            linhas: (a.apontamento_linhas || []).map(l => ({
                ...l,
                vila_nome: l.vilas?.nome || null,
                etapa_nome: l.sub_etapas?.nome || null,
                tarefa_nome: l.tarefas?.nome || null,
                ugb_nome: l.ugbs?.nome || null,
                vilas: undefined, sub_etapas: undefined, tarefas: undefined, ugbs: undefined
            })),
            apontamento_linhas: undefined
        }));

        // Segregação por conta_id
        if (conta_id && role !== 'Administrador' && role !== 'Desenvolvedor') {
            apontamentos = apontamentos.filter(a => a.linhas.some(l => l.conta_id === conta_id));
            apontamentos = apontamentos.map(a => ({
                ...a,
                linhas: a.linhas.filter(l => l.conta_id === conta_id)
            }));
        }

        res.json(apontamentos);

    } catch (error) {
        console.error('Erro ao listar apontamentos:', error);
        res.status(500).json({ error: 'Erro ao listar apontamentos' });
    }
});

// GET /api/apontamentos/:id
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('apontamentos')
            .select(`
                *,
                maquinas(nome),
                apontamento_linhas(
                    id, vila_id, etapa_id, sub_etapa_id, conta_id, sub_conta_id, supervisor, inicio, fim, horas_trabalhadas, observacao,
                    vilas(nome),
                    sub_etapas(nome),
                    tarefas(nome),
                    ugbs(nome)
                )
            `)
            .eq('id', req.params.id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Apontamento não encontrado' });

        res.json({
            ...data,
            maquina_nome: data.maquinas?.nome || null,
            maquinas: undefined,
            linhas: (data.apontamento_linhas || []).map(l => ({
                ...l,
                vila_nome: l.vilas?.nome || null,
                etapa_nome: l.sub_etapas?.nome || null,
                tarefa_nome: l.tarefas?.nome || null,
                ugb_nome: l.ugbs?.nome || null,
                vilas: undefined, sub_etapas: undefined, tarefas: undefined, ugbs: undefined
            })),
            apontamento_linhas: undefined
        });

    } catch (error) {
        console.error('Erro ao buscar apontamento:', error);
        res.status(500).json({ error: 'Erro ao buscar apontamento' });
    }
});

// POST /api/apontamentos
router.post('/', authMiddleware, permissionMiddleware(['Apontador', 'Suprimentos']), async (req, res) => {
    try {
        const { data_apontamento, maquina_id, operador, observacoes, linhas } = req.body;

        if (!data_apontamento || !maquina_id || !operador || !linhas || linhas.length === 0) {
            return res.status(400).json({ error: 'Dados obrigatórios faltando' });
        }

        // Inserir cabeçalho
        const { data: apt, error: aptError } = await supabase
            .from('apontamentos')
            .insert({ data_apontamento, maquina_id, operador, apontador_id: req.userId, status: 'em_apontamento', observacoes: observacoes || null })
            .select('id')
            .single();

        if (aptError) throw aptError;
        const apontamento_id = apt.id;

        // Inserir linhas
        const linhasPayload = linhas.map(l => ({
            apontamento_id,
            vila_id: l.vila_id,
            etapa_id: l.etapa_id,
            sub_etapa_id: l.sub_etapa_id || null,
            conta_id: l.conta_id,
            sub_conta_id: l.sub_conta_id || null,
            supervisor: l.supervisor || null,
            inicio: l.inicio,
            fim: l.fim,
            horas_trabalhadas: calcularHoras(l.inicio, l.fim),
            observacao: l.observacao || null
        }));

        const { error: linhasError } = await supabase.from('apontamento_linhas').insert(linhasPayload);

        if (linhasError) {
            // Rollback manual: remover o cabeçalho criado
            await supabase.from('apontamentos').delete().eq('id', apontamento_id);
            throw linhasError;
        }

        res.status(201).json({ message: 'Apontamento criado com sucesso', id: apontamento_id });

    } catch (error) {
        console.error('Erro ao criar apontamento:', error);
        res.status(500).json({ error: 'Erro ao criar apontamento.' });
    }
});

// PUT /api/apontamentos/:id
router.put('/:id', authMiddleware, permissionMiddleware(['Apontador']), async (req, res) => {
    try {
        const { id } = req.params;
        const { data_apontamento, maquina_id, operador, observacoes, linhas } = req.body;

        // Atualizar cabeçalho
        const updates = {};
        if (data_apontamento) updates.data_apontamento = data_apontamento;
        if (maquina_id) updates.maquina_id = maquina_id;
        if (operador) updates.operador = operador;
        if (observacoes !== undefined) updates.observacoes = observacoes;

        if (Object.keys(updates).length > 0) {
            updates.atualizado_em = new Date().toISOString();
            const { error } = await supabase.from('apontamentos').update(updates).eq('id', id);
            if (error) throw error;
        }

        // Recriar linhas
        if (linhas && linhas.length > 0) {
            await supabase.from('apontamento_linhas').delete().eq('apontamento_id', id);

            const linhasPayload = linhas.map(l => ({
                apontamento_id: parseInt(id),
                vila_id: l.vila_id,
                etapa_id: l.etapa_id,
                sub_etapa_id: l.sub_etapa_id || null,
                conta_id: l.conta_id,
                sub_conta_id: l.sub_conta_id || null,
                supervisor: l.supervisor || null,
                inicio: l.inicio,
                fim: l.fim,
                horas_trabalhadas: calcularHoras(l.inicio, l.fim),
                observacao: l.observacao || null
            }));

            const { error: linhasError } = await supabase.from('apontamento_linhas').insert(linhasPayload);
            if (linhasError) throw linhasError;
        }

        res.json({ message: 'Apontamento atualizado com sucesso' });

    } catch (error) {
        console.error('Erro ao atualizar apontamento:', error);
        res.status(500).json({ error: 'Erro ao atualizar apontamento' });
    }
});

// PUT /api/apontamentos/:id/status
router.put('/:id/status', authMiddleware, permissionMiddleware(['Apontador', 'Suprimentos', 'Supervisor', 'Líder']), async (req, res) => {
    try {
        const { id } = req.params;
        const { status, observacoes_reprovacao } = req.body;

        const validStatus = ['em_apontamento', 'liberado_apontador', 'pendente_supervisor', 'pendente_lider', 'aprovado', 'liberado_lider'];
        if (!validStatus.includes(status)) {
            return res.status(400).json({ error: 'Status inválido' });
        }

        const updates = { status, atualizado_em: new Date().toISOString() };

        if (status === 'em_apontamento') {
            if (!observacoes_reprovacao) {
                return res.status(400).json({ error: 'Motivo da reprovação é obrigatório' });
            }
            // Buscar observacoes atual para concatenar
            const { data: current } = await supabase.from('apontamentos').select('observacoes').eq('id', id).single();
            const timestamp = new Date().toLocaleString('pt-BR');
            const autor = req.user?.nome || req.userRole;
            const newObs = `${current?.observacoes || ''}\n[REPROVADO em ${timestamp} por ${autor}]: ${observacoes_reprovacao}`;
            updates.observacoes = newObs;
        }

        const { error } = await supabase.from('apontamentos').update(updates).eq('id', id);
        if (error) throw error;
        res.json({ message: 'Status atualizado com sucesso' });

    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

// DELETE /api/apontamentos/:id
router.delete('/:id', authMiddleware, permissionMiddleware(['Apontador', 'Suprimentos']), async (req, res) => {
    try {
        const { error } = await supabase.from('apontamentos').delete().eq('id', req.params.id);
        if (error) throw error;
        res.json({ message: 'Apontamento deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar apontamento:', error);
        res.status(500).json({ error: 'Erro ao deletar apontamento' });
    }
});

function calcularHoras(inicio, fim) {
    const [h1, m1] = inicio.split(':').map(Number);
    const [h2, m2] = fim.split(':').map(Number);
    const minutos1 = h1 * 60 + m1;
    const minutos2 = h2 * 60 + m2;
    let diff = minutos2 - minutos1;
    if (diff < 0) diff += 24 * 60;
    return (diff / 60).toFixed(2);
}

module.exports = router;
