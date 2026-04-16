import React, { useState, useMemo, useEffect } from 'react';
import {
    Grid, Card, CardContent, Box, Stack, Typography, Chip,
    Button, TextField, MenuItem, Alert, LinearProgress, alpha,
    Divider, Table, TableBody, TableCell, TableHead, TableRow,
    Tooltip, CircularProgress, Paper
} from '@mui/material';
import {
    Speed, Construction, Timer, CheckCircle, Warning,
    Error as ErrorIcon, Assignment, FilterList, AccessTime,
    Refresh, FactCheck, TrendingUp, CalendarToday, Engineering
} from '@mui/icons-material';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    PieChart, Pie, Cell, ResponsiveContainer,
    Tooltip as RechTooltip, Legend
} from 'recharts';
import { useNavigate } from 'react-router-dom';
import useApontamentoStore from '../store/apontamentoStore';
import useMaquinarioStore from '../store/maquinarioStore';
import { checklistAPI } from '../services/api';

// ─── Constantes ──────────────────────────────────────────────────────────────
const STATUS_COLORS = {
    em_apontamento:     '#757575',
    liberado_apontador: '#2196f3',
    pendente_supervisor:'#ff9800',
    pendente_lider:     '#ff5722',
    aprovado:           '#4caf50',
};
const STATUS_LABELS = {
    em_apontamento:     'Em Edição',
    liberado_apontador: 'Aguard. Supervisor',
    pendente_supervisor:'Pendente Supervisor',
    pendente_lider:     'Pendente Líder',
    aprovado:           'Aprovado',
};
const STATUS_ORDER = ['em_apontamento', 'liberado_apontador', 'pendente_supervisor', 'pendente_lider', 'aprovado'];

const todayStr = () => new Date().toISOString().split('T')[0];
const daysAgo  = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; };
const fmtDate  = (iso) => { if (!iso) return '—'; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };

// ─── Sub-componentes simples ──────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, color, loading }) {
    return (
        <Card sx={{ height: '100%' }}>
            <CardContent>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                        <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.5}>
                            {label}
                        </Typography>
                        {loading
                            ? <CircularProgress size={22} sx={{ mt: 1, display: 'block' }} />
                            : <Typography variant="h4" fontWeight="bold" sx={{ color, mt: 0.5, lineHeight: 1.1 }}>
                                {value}
                              </Typography>
                        }
                        {sub && <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>{sub}</Typography>}
                    </Box>
                    <Box sx={{ bgcolor: alpha(color, 0.12), p: 1.2, borderRadius: 2 }}>
                        {React.cloneElement(icon, { sx: { fontSize: 28, color } })}
                    </Box>
                </Box>
            </CardContent>
        </Card>
    );
}

function StatusCard({ status, count, total }) {
    const color = STATUS_COLORS[status] || '#999';
    const label = STATUS_LABELS[status] || status;
    const pct   = total > 0 ? (count / total) * 100 : 0;
    return (
        <Card sx={{ height: '100%', borderTop: `3px solid ${color}` }}>
            <CardContent sx={{ pb: '12px !important' }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600} textTransform="uppercase" letterSpacing={0.4} noWrap display="block">
                    {label}
                </Typography>
                <Typography variant="h3" fontWeight="bold" sx={{ color, my: 0.5 }}>{count}</Typography>
                <LinearProgress
                    variant="determinate"
                    value={pct}
                    sx={{ height: 4, borderRadius: 2, bgcolor: alpha(color, 0.15),
                          '& .MuiLinearProgress-bar': { bgcolor: color } }}
                />
                <Typography variant="caption" color="text.secondary">{pct.toFixed(0)}% do total</Typography>
            </CardContent>
        </Card>
    );
}

// ─── Dashboard principal ──────────────────────────────────────────────────────
const Dashboard = () => {
    const navigate = useNavigate();

    const { apontamentos, fetchApontamentos, loading: loadingApts } = useApontamentoStore();
    const { maquinarios, fetchMaquinarios }                         = useMaquinarioStore();

    // Filtros
    const [dateFrom,     setDateFrom]     = useState(daysAgo(30));
    const [dateTo,       setDateTo]       = useState(todayStr());
    const [ugbFilter,    setUgbFilter]    = useState('');
    const [tarefaFilter, setTarefaFilter] = useState('');
    const [selectedDay,  setSelectedDay]  = useState(todayStr());

    // Checklist stats
    const [clStats,        setClStats]        = useState([]);
    const [loadingCl,      setLoadingCl]      = useState(false);

    useEffect(() => {
        fetchApontamentos();
        fetchMaquinarios();
        setLoadingCl(true);
        checklistAPI.getStats()
            .then(setClStats)
            .catch(() => {})
            .finally(() => setLoadingCl(false));
    }, []);

    const handleRefresh = () => {
        fetchApontamentos();
        setLoadingCl(true);
        checklistAPI.getStats().then(setClStats).catch(() => {}).finally(() => setLoadingCl(false));
    };

    // ─── Opções de filtro (UGB / Tarefa) ─────────────────────────────────────
    const ugbOptions = useMemo(() => {
        const s = new Set();
        apontamentos.forEach(a => { if (a.detalhes?.contaNome) s.add(a.detalhes.contaNome); });
        return Array.from(s).sort();
    }, [apontamentos]);

    const tarefaOptions = useMemo(() => {
        const s = new Set();
        apontamentos
            .filter(a => !ugbFilter || a.detalhes?.contaNome === ugbFilter)
            .forEach(a => { if (a.detalhes?.subEtapaNome) s.add(a.detalhes.subEtapaNome); });
        return Array.from(s).sort();
    }, [apontamentos, ugbFilter]);

    // ─── Apontamentos filtrados ───────────────────────────────────────────────
    const filtered = useMemo(() =>
        apontamentos.filter(a => {
            const inDate   = (!dateFrom || a.data >= dateFrom) && (!dateTo || a.data <= dateTo);
            const inUgb    = !ugbFilter    || a.detalhes?.contaNome   === ugbFilter;
            const inTarefa = !tarefaFilter || a.detalhes?.subEtapaNome === tarefaFilter;
            return inDate && inUgb && inTarefa;
        }),
    [apontamentos, dateFrom, dateTo, ugbFilter, tarefaFilter]);

    // Total horas
    const totalHoras = useMemo(() =>
        filtered.reduce((s, a) => s + parseFloat(a.totalHoras || 0), 0).toFixed(1),
    [filtered]);

    // Apontamentos únicos (por cabeçalho)
    const totalApts = useMemo(() => new Set(filtered.map(a => a.apontamentoId)).size, [filtered]);

    // Por status (conta cabeçalhos únicos)
    const byStatus = useMemo(() => {
        const seen = new Map();
        filtered.forEach(a => { if (!seen.has(a.apontamentoId)) seen.set(a.apontamentoId, a.status); });
        const map = {};
        seen.forEach(s => { map[s] = (map[s] || 0) + 1; });
        return map;
    }, [filtered]);

    const pendentes = useMemo(() =>
        (byStatus.em_apontamento || 0) +
        (byStatus.liberado_apontador || 0) +
        (byStatus.pendente_supervisor || 0) +
        (byStatus.pendente_lider || 0),
    [byStatus]);

    // Pizza: distribuição por status
    const statusPie = STATUS_ORDER
        .filter(s => byStatus[s] > 0)
        .map(s => ({ name: STATUS_LABELS[s], value: byStatus[s], color: STATUS_COLORS[s] }));

    // Horas por UGB
    const horasByUgb = useMemo(() => {
        const map = {};
        filtered.forEach(a => {
            const ugb = a.detalhes?.contaNome || 'Não informado';
            map[ugb] = (map[ugb] || 0) + parseFloat(a.totalHoras || 0);
        });
        return Object.entries(map)
            .map(([name, horas]) => ({
                name: name.length > 20 ? name.substring(0, 20) + '…' : name,
                horas: parseFloat(horas.toFixed(1)),
            }))
            .sort((a, b) => b.horas - a.horas)
            .slice(0, 10);
    }, [filtered]);

    // ─── Análise por dia ─────────────────────────────────────────────────────
    const dayAnalysis = useMemo(() => {
        const dayApts = apontamentos.filter(a => a.data === selectedDay);
        const seen    = new Map();
        dayApts.forEach(a => { if (!seen.has(a.apontamentoId)) seen.set(a.apontamentoId, a.status); });
        const map = {};
        seen.forEach(s => { map[s] = (map[s] || 0) + 1; });
        const total     = seen.size;
        const chartData = STATUS_ORDER
            .map(s => ({ name: STATUS_LABELS[s], count: map[s] || 0, fill: STATUS_COLORS[s] }))
            .filter(d => d.count > 0);
        return { map, total, chartData };
    }, [apontamentos, selectedDay]);

    // ─── Checklist KPIs ──────────────────────────────────────────────────────
    const checklistKPIs = useMemo(() => {
        const now     = new Date();
        const statsMap = new Map(clStats.map(c => [c.maquina_id, c.ultima_inspecao]));
        const lists   = { emDia: [], aVencer: [], vencido: [], semChecklist: [] };

        maquinarios.filter(m => m.ativo).forEach(maq => {
            const lastInsp = statsMap.get(maq.id);
            if (!lastInsp) { lists.semChecklist.push(maq); return; }
            const days = Math.floor((now - new Date(lastInsp)) / 86400000);
            if      (days <= 23) lists.emDia.push({ ...maq, days, lastInsp });
            else if (days <= 30) lists.aVencer.push({ ...maq, days, lastInsp });
            else                 lists.vencido.push({ ...maq, days, lastInsp });
        });
        return lists;
    }, [maquinarios, clStats]);

    const clTotal = maquinarios.filter(m => m.ativo).length;

    // ─── Alertas ─────────────────────────────────────────────────────────────
    const hasAlerts = (checklistKPIs.vencido.length + checklistKPIs.semChecklist.length) > 0
                   || pendentes > 0;

    return (
        <Box>
            {/* ── Header ── */}
            <Box sx={{
                background: 'linear-gradient(135deg, rgba(192,72,72,0.1) 0%, rgba(217,164,65,0.1) 100%)',
                borderRadius: 3, p: { xs: 2.5, md: 4 }, mb: 3,
                border: 1, borderColor: 'divider',
            }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{
                            width: 48, height: 48, borderRadius: 2,
                            background: 'linear-gradient(135deg, #D9A441 0%, #B8872E 100%)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Speed sx={{ fontSize: 28, color: '#000' }} />
                        </Box>
                        <Box>
                            <Typography variant="h4" fontWeight="bold">Dashboard Executivo</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Visão completa de apontamentos, horas alocadas e checklists
                            </Typography>
                        </Box>
                    </Stack>
                    <Button startIcon={<Refresh />} variant="outlined" size="small" onClick={handleRefresh} disabled={loadingApts}>
                        Atualizar
                    </Button>
                </Stack>
            </Box>

            {/* ── Alertas ── */}
            {hasAlerts && (
                <Alert severity="warning" sx={{ mb: 3 }} action={
                    <Button color="inherit" size="small" onClick={() => navigate('/lista-apontamentos')}>Ver Apontamentos</Button>
                }>
                    <Typography variant="body2" fontWeight="bold">
                        {pendentes > 0 && `${pendentes} apontamento(s) pendente(s) de aprovação. `}
                        {(checklistKPIs.vencido.length + checklistKPIs.semChecklist.length) > 0 &&
                            `${checklistKPIs.vencido.length + checklistKPIs.semChecklist.length} máquina(s) com checklist vencido ou sem checklist.`}
                    </Typography>
                </Alert>
            )}

            {/* ── Filtros ── */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
                        <FilterList sx={{ color: 'text.secondary' }} />
                        <Typography variant="subtitle2" fontWeight="bold">Filtros</Typography>
                        {(ugbFilter || tarefaFilter || dateFrom !== daysAgo(30) || dateTo !== todayStr()) && (
                            <Chip label="Filtros ativos" size="small" color="primary" variant="outlined"
                                onDelete={() => { setUgbFilter(''); setTarefaFilter(''); setDateFrom(daysAgo(30)); setDateTo(todayStr()); }} />
                        )}
                    </Stack>
                    <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                        <TextField
                            label="De" type="date" size="small" value={dateFrom}
                            onChange={e => setDateFrom(e.target.value)}
                            InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }}
                        />
                        <TextField
                            label="Até" type="date" size="small" value={dateTo}
                            onChange={e => setDateTo(e.target.value)}
                            InputLabelProps={{ shrink: true }} sx={{ minWidth: 150 }}
                        />
                        <TextField
                            select label="UGB / Empreendimento" size="small" value={ugbFilter}
                            onChange={e => { setUgbFilter(e.target.value); setTarefaFilter(''); }}
                            sx={{ minWidth: 200 }}
                        >
                            <MenuItem value=""><em>Todos</em></MenuItem>
                            {ugbOptions.map(u => <MenuItem key={u} value={u}>{u}</MenuItem>)}
                        </TextField>
                        <TextField
                            select label="Tarefa" size="small" value={tarefaFilter}
                            onChange={e => setTarefaFilter(e.target.value)}
                            sx={{ minWidth: 180 }} disabled={tarefaOptions.length === 0}
                        >
                            <MenuItem value=""><em>Todas</em></MenuItem>
                            {tarefaOptions.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                        </TextField>
                    </Box>
                </CardContent>
            </Card>

            {/* ── KPI Cards ── */}
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                <Grid item xs={6} sm={3}>
                    <KpiCard
                        icon={<AccessTime />} label="Horas Alocadas" color="#D9A441"
                        value={`${totalHoras}h`} sub={`${fmtDate(dateFrom)} – ${fmtDate(dateTo)}`}
                        loading={loadingApts}
                    />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <KpiCard
                        icon={<Assignment />} label="Apontamentos" color="#2196f3"
                        value={totalApts} sub="Registros únicos"
                        loading={loadingApts}
                    />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <KpiCard
                        icon={<Warning />} label="Pendentes" color="#ff9800"
                        value={pendentes} sub="Aguardando aprovação"
                        loading={loadingApts}
                    />
                </Grid>
                <Grid item xs={6} sm={3}>
                    <KpiCard
                        icon={<CheckCircle />} label="Aprovados" color="#4caf50"
                        value={byStatus.aprovado || 0} sub="No período filtrado"
                        loading={loadingApts}
                    />
                </Grid>
            </Grid>

            {/* ── Cards por Status ── */}
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
                Apontamentos por Status
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
                {STATUS_ORDER.map(s => (
                    <Grid item xs={12} sm key={s}>
                        <StatusCard status={s} count={byStatus[s] || 0} total={totalApts} />
                    </Grid>
                ))}
            </Grid>

            {/* ── Gráficos ── */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
                {/* Horas por UGB */}
                <Grid item xs={12} md={7}>
                    <Card sx={{ height: 380 }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" gap={1} mb={2}>
                                <TrendingUp sx={{ color: '#D9A441' }} />
                                <Typography variant="h6" fontWeight="bold">Horas Alocadas por Empreendimento</Typography>
                                {tarefaFilter && <Chip label={tarefaFilter} size="small" onDelete={() => setTarefaFilter('')} />}
                            </Stack>
                            {horasByUgb.length === 0
                                ? <Box display="flex" alignItems="center" justifyContent="center" height={280}>
                                    <Typography color="text.secondary">Sem dados no período</Typography>
                                  </Box>
                                : <ResponsiveContainer width="100%" height={290}>
                                    <BarChart data={horasByUgb} margin={{ left: -10, right: 8, top: 4, bottom: 50 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-35} textAnchor="end" interval={0} />
                                        <YAxis tick={{ fontSize: 11 }} unit="h" />
                                        <RechTooltip formatter={v => [`${v}h`, 'Horas']} />
                                        <Bar dataKey="horas" radius={[4, 4, 0, 0]} fill="#D9A441" />
                                    </BarChart>
                                  </ResponsiveContainer>
                            }
                        </CardContent>
                    </Card>
                </Grid>

                {/* Pizza status */}
                <Grid item xs={12} md={5}>
                    <Card sx={{ height: 380 }}>
                        <CardContent>
                            <Stack direction="row" alignItems="center" gap={1} mb={2}>
                                <Speed sx={{ color: 'primary.main' }} />
                                <Typography variant="h6" fontWeight="bold">Distribuição por Status</Typography>
                            </Stack>
                            {statusPie.length === 0
                                ? <Box display="flex" alignItems="center" justifyContent="center" height={290}>
                                    <Typography color="text.secondary">Sem dados no período</Typography>
                                  </Box>
                                : <>
                                    <ResponsiveContainer width="100%" height={220}>
                                        <PieChart>
                                            <Pie data={statusPie} cx="50%" cy="50%" innerRadius={55} outerRadius={95}
                                                 dataKey="value" paddingAngle={2}>
                                                {statusPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                                            </Pie>
                                            <RechTooltip formatter={(v, n) => [v, n]} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <Box display="flex" flexWrap="wrap" gap={0.8} justifyContent="center">
                                        {statusPie.map(e => (
                                            <Chip key={e.name} size="small"
                                                label={`${e.name}: ${e.value}`}
                                                sx={{ bgcolor: alpha(e.color, 0.15), color: e.color, fontWeight: 700, fontSize: 11 }} />
                                        ))}
                                    </Box>
                                  </>
                            }
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* ── Análise por Dia ── */}
            <Card sx={{ mb: 3 }}>
                <CardContent>
                    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} gap={2} mb={3}>
                        <Stack direction="row" alignItems="center" gap={1}>
                            <CalendarToday sx={{ color: 'secondary.main' }} />
                            <Typography variant="h6" fontWeight="bold">Análise por Dia</Typography>
                        </Stack>
                        <TextField
                            type="date" size="small" value={selectedDay}
                            onChange={e => setSelectedDay(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            label="Selecionar data"
                            sx={{ minWidth: 160 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                            {dayAnalysis.total} apontamento(s) em {fmtDate(selectedDay)}
                        </Typography>
                    </Stack>

                    {dayAnalysis.total === 0
                        ? <Box display="flex" alignItems="center" justifyContent="center" py={4}>
                            <Typography color="text.secondary">Nenhum apontamento neste dia</Typography>
                          </Box>
                        : <Grid container spacing={2}>
                            {/* Cards de status no dia */}
                            <Grid item xs={12} md={5}>
                                <Stack spacing={1.5}>
                                    {STATUS_ORDER.map(s => {
                                        const count = dayAnalysis.map[s] || 0;
                                        if (count === 0) return null;
                                        const color = STATUS_COLORS[s];
                                        return (
                                            <Box key={s} sx={{
                                                display: 'flex', alignItems: 'center', gap: 2,
                                                p: 1.5, borderRadius: 2, border: 1,
                                                borderColor: alpha(color, 0.3),
                                                bgcolor: alpha(color, 0.05),
                                            }}>
                                                <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                                                <Typography variant="body2" flex={1}>{STATUS_LABELS[s]}</Typography>
                                                <Typography variant="h6" fontWeight="bold" sx={{ color }}>{count}</Typography>
                                            </Box>
                                        );
                                    })}
                                </Stack>
                            </Grid>
                            {/* Gráfico de barras do dia */}
                            <Grid item xs={12} md={7}>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={dayAnalysis.chartData} margin={{ top: 4, right: 8, left: -10, bottom: 30 }}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.15)" />
                                        <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-20} textAnchor="end" interval={0} />
                                        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                                        <RechTooltip />
                                        <Bar dataKey="count" radius={[4, 4, 0, 0]} name="Qtde">
                                            {dayAnalysis.chartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </Grid>
                          </Grid>
                    }
                </CardContent>
            </Card>

            {/* ── Checklist ── */}
            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1.5 }}>
                Status de Checklist de Inspeção
            </Typography>
            <Grid container spacing={2.5} sx={{ mb: 3 }}>
                {[
                    { key: 'emDia',        label: 'Em Dia',      color: '#4caf50', icon: <CheckCircle />, desc: 'Inspeção ≤ 23 dias' },
                    { key: 'aVencer',      label: 'A Vencer',    color: '#ff9800', icon: <Warning />,      desc: 'Inspeção entre 24–30 dias' },
                    { key: 'vencido',      label: 'Vencido',     color: '#f44336', icon: <ErrorIcon />,    desc: 'Inspeção > 30 dias' },
                    { key: 'semChecklist', label: 'Sem Checklist', color: '#9e9e9e', icon: <FactCheck />,   desc: 'Nunca inspecionado' },
                ].map(({ key, label, color, icon, desc }) => (
                    <Grid item xs={6} sm={3} key={key}>
                        <Card sx={{ borderTop: `3px solid ${color}`, height: '100%' }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" gap={1} mb={1}>
                                    {React.cloneElement(icon, { sx: { color, fontSize: 22 } })}
                                    <Typography variant="caption" fontWeight={700} textTransform="uppercase" color="text.secondary">
                                        {label}
                                    </Typography>
                                </Box>
                                {loadingCl
                                    ? <CircularProgress size={22} />
                                    : <Typography variant="h3" fontWeight="bold" sx={{ color }}>
                                        {checklistKPIs[key].length}
                                      </Typography>
                                }
                                <Typography variant="caption" color="text.secondary">{desc}</Typography>
                                <LinearProgress
                                    variant="determinate"
                                    value={clTotal > 0 ? (checklistKPIs[key].length / clTotal) * 100 : 0}
                                    sx={{ mt: 1, height: 4, borderRadius: 2, bgcolor: alpha(color, 0.15),
                                          '& .MuiLinearProgress-bar': { bgcolor: color } }}
                                />
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Tabela de máquinas com checklist vencido / a vencer */}
            {(checklistKPIs.vencido.length + checklistKPIs.aVencer.length + checklistKPIs.semChecklist.length) > 0 && (
                <Card>
                    <CardContent>
                        <Stack direction="row" alignItems="center" gap={1} mb={2}>
                            <Engineering sx={{ color: 'warning.main' }} />
                            <Typography variant="h6" fontWeight="bold">Máquinas que Requerem Atenção</Typography>
                        </Stack>
                        <Table size="small">
                            <TableHead>
                                <TableRow sx={{ bgcolor: 'background.default' }}>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Máquina</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Última Inspeção</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Dias</TableCell>
                                    <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {[
                                    ...checklistKPIs.vencido.map(m => ({ ...m, _status: 'vencido' })),
                                    ...checklistKPIs.aVencer.map(m => ({ ...m, _status: 'aVencer' })),
                                    ...checklistKPIs.semChecklist.map(m => ({ ...m, _status: 'semChecklist', days: null, lastInsp: null })),
                                ].map(maq => {
                                    const cfg = maq._status === 'vencido'
                                        ? { label: 'Vencido',      color: '#f44336' }
                                        : maq._status === 'aVencer'
                                        ? { label: 'A Vencer',     color: '#ff9800' }
                                        : { label: 'Sem Checklist', color: '#9e9e9e' };
                                    return (
                                        <TableRow key={maq.id} sx={{ '&:last-child td': { border: 0 } }}>
                                            <TableCell><Typography variant="body2" fontWeight={600}>{maq.nome}</Typography></TableCell>
                                            <TableCell><Typography variant="body2">{maq.tipo || '—'}</Typography></TableCell>
                                            <TableCell><Typography variant="body2">{fmtDate(maq.lastInsp)}</Typography></TableCell>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight="bold" sx={{ color: cfg.color }}>
                                                    {maq.days !== null ? `${maq.days}d` : '—'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip label={cfg.label} size="small"
                                                    sx={{ bgcolor: alpha(cfg.color, 0.15), color: cfg.color, fontWeight: 700, fontSize: 11 }} />
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            )}
        </Box>
    );
};

export default Dashboard;
