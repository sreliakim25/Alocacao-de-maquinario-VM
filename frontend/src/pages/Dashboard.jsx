import React from 'react';
import {
    Grid,
    Card,
    CardContent,
    Box,
    Stack,
    Typography,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Button,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow,
    LinearProgress,
    Divider,
    alpha,
    Popover
} from '@mui/material';
import {
    Speed,
    Construction,
    Timer,
    CheckCircle,
    Warning,
    Error as ErrorIcon,
    TrendingUp,
    People,
    Assignment,
    Verified,
    BuildCircle
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, LineChart, Line, Area, AreaChart } from 'recharts';
import useKPIs from '../hooks/useKPIs';
import KPICard from '../components/dashboard/KPICard';
import { useNavigate } from 'react-router-dom';

const COLORS = {
    em_apontamento: '#757575',
    liberado_apontador: '#2196f3',
    pendente_supervisor: '#ff9800',
    pendente_lider: '#ff5722',
    aprovado: '#4caf50'
};

const STATUS_LABELS = {
    em_apontamento: 'Em Edição',
    liberado_apontador: 'Aguardando Supervisor',
    pendente_supervisor: 'Pendente Supervisor',
    pendente_lider: 'Pendente Líder',
    aprovado: 'Aprovado'
};

const Dashboard = () => {
    const navigate = useNavigate();
    const [downtimeAnchorEl, setDowntimeAnchorEl] = React.useState(null);
    const {
        statusDistribution,
        urgentAlerts,
        slaCompliance,
        machineryActivity,
        productivity,
        teamPerformance,
        checklistStatus,
        trends,
        projectAnalysis
    } = useKPIs();

    // Preparar dados para gráfico de pizza
    const statusChartData = Object.entries(statusDistribution.byStatus).map(([status, count]) => ({
        name: STATUS_LABELS[status] || status,
        value: count,
        color: COLORS[status] || '#999'
    }));

    // Preparar dados para gráfico de barras (Top 5 máquinas)
    const productivityChartData = productivity.top5Machines.map(m => ({
        name: m.machine.length > 15 ? m.machine.substring(0, 15) + '...' : m.machine,
        horas: parseFloat(m.hours)
    }));

    return (
        <Box>
            {/* Hero Header */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, rgba(192, 72, 72, 0.1) 0%, rgba(217, 164, 65, 0.1) 100%)',
                    borderRadius: 3,
                    p: 4,
                    mb: 4,
                    border: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            background: 'linear-gradient(135deg, #D9A441 0%, #B8872E 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Speed sx={{ fontSize: 28, color: '#000' }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            Dashboard Executivo
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Visão completa de apontamentos, SLA e performance
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            {/* Alertas Urgentes - Destaque no topo */}
            {(urgentAlerts.critical.length > 0 || urgentAlerts.urgent.length > 0) && (
                <Alert
                    severity={urgentAlerts.critical.length > 0 ? "error" : "warning"}
                    sx={{ mb: 3 }}
                    action={
                        <Button color="inherit" size="small" onClick={() => navigate('/lista-apontamentos')}>
                            Ver Todos
                        </Button>
                    }
                >
                    <Typography variant="subtitle2" fontWeight="bold">
                        🚨 {urgentAlerts.critical.length} Críticos • {urgentAlerts.urgent.length} Urgentes
                    </Typography>
                    <Typography variant="caption">
                        Itens aguardando ação imediata
                    </Typography>
                </Alert>
            )}

            {/* KPIs Principais - Grid de Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                {/* Status Distribution */}
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                        title="Total Apontamentos"
                        value={statusDistribution.total}
                        subtitle="Registrados"
                        icon={<Assignment sx={{ fontSize: 40 }} />}
                        color="#D9A441"
                        progress={75}
                    />
                </Grid>

                {/* SLA Compliance */}
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                        title="SLA Compliance"
                        value={`${slaCompliance.complianceRate}%`}
                        subtitle={`${slaCompliance.violated} Violados`}
                        icon={<Timer sx={{ fontSize: 40 }} />}
                        color={slaCompliance.complianceRate > 80 ? '#4caf50' : '#ff5722'}
                        progress={parseFloat(slaCompliance.complianceRate)}
                    />
                </Grid>

                {/* Máquinas Ativas */}
                <Grid item xs={12} sm={6} md={3}>
                    <KPICard
                        title="Máquinas Ativas"
                        value={`${machineryActivity.active}/${machineryActivity.total}`}
                        subtitle="Último mês"
                        icon={<Construction sx={{ fontSize: 40 }} />}
                        color="#2196f3"
                        progress={parseFloat(machineryActivity.activationRate)}
                    />
                </Grid>

                {/* Horas de Máquinas Paradas */}
                <Grid item xs={12} sm={6} md={3}>
                    <Box
                        onMouseEnter={(e) => setDowntimeAnchorEl(e.currentTarget)}
                        onMouseLeave={() => setDowntimeAnchorEl(null)}
                    >
                        <KPICard
                            title="Máquinas Paradas"
                            value="12.5h"
                            subtitle="Mês Corrente"
                            icon={<BuildCircle sx={{ fontSize: 40 }} />}
                            color="#f44336"
                            progress={30}
                        />
                    </Box>
                    <Popover
                        open={Boolean(downtimeAnchorEl)}
                        anchorEl={downtimeAnchorEl}
                        onClose={() => setDowntimeAnchorEl(null)}
                        anchorOrigin={{
                            vertical: 'bottom',
                            horizontal: 'left',
                        }}
                        transformOrigin={{
                            vertical: 'top',
                            horizontal: 'left',
                        }}
                        sx={{
                            pointerEvents: 'none',
                        }}
                        PaperProps={{
                            sx: {
                                pointerEvents: 'auto',
                                p: 2,
                                minWidth: 300,
                                maxWidth: 400
                            }
                        }}
                    >
                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                            🔧 Ranking de Máquinas Paradas (Mês Corrente)
                        </Typography>
                        <Divider sx={{ my: 1 }} />
                        <List dense>
                            <ListItem>
                                <ListItemText
                                    primary="Escavadeira CAT 320D"
                                    secondary="Quebra hidráulica - 4.2h"
                                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="Retroescavadeira JCB"
                                    secondary="Manutenção preventiva - 3.5h"
                                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="Pá Carregadeira L200"
                                    secondary="Problema elétrico - 2.8h"
                                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="Motoniveladora 140K"
                                    secondary="Troca de pneu - 1.5h"
                                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                                />
                            </ListItem>
                            <ListItem>
                                <ListItemText
                                    primary="Compactador CS64B"
                                    secondary="Falha no motor - 0.5h"
                                    primaryTypographyProps={{ fontWeight: 600, fontSize: '0.9rem' }}
                                />
                            </ListItem>
                        </List>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="caption" color="text.secondary" display="block" textAlign="center">
                            Total: 12.5 horas de paradas neste mês
                        </Typography>
                    </Popover>
                </Grid>
            </Grid>

            {/* Gráficos e Detalhes */}
            <Grid container spacing={3}>
                {/* Checklist - Lado Esquerdo */}
                <Grid item xs={12} md={4}>
                    <Card sx={{ height: 450 }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                ✅ Status de Checklist
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={4}>
                                    <Box textAlign="center" p={3} bgcolor="rgba(76, 175, 80, 0.1)" borderRadius={2}>
                                        <CheckCircle sx={{ fontSize: 48, color: '#4caf50', mb: 1 }} />
                                        <Typography variant="h4" fontWeight="bold">
                                            {checklistStatus.emDia}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Em Dia
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Box textAlign="center" p={3} bgcolor="rgba(255, 152, 0, 0.1)" borderRadius={2}>
                                        <Warning sx={{ fontSize: 48, color: '#ff9800', mb: 1 }} />
                                        <Typography variant="h4" fontWeight="bold">
                                            {checklistStatus.aVencer}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            A Vencer
                                        </Typography>
                                    </Box>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Box textAlign="center" p={3} bgcolor="rgba(244, 67, 54, 0.1)" borderRadius={2}>
                                        <ErrorIcon sx={{ fontSize: 48, color: '#f44336', mb: 1 }} />
                                        <Typography variant="h4" fontWeight="bold">
                                            {checklistStatus.vencidos}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Vencidos
                                        </Typography>
                                    </Box>
                                </Grid>
                            </Grid>

                            <Box sx={{ mt: 3 }}>
                                <LinearProgress
                                    variant="determinate"
                                    value={(checklistStatus.emDia / checklistStatus.total) * 100}
                                    sx={{
                                        height: 8,
                                        borderRadius: 4,
                                        '& .MuiLinearProgress-bar': {
                                            backgroundColor: '#4caf50'
                                        }
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    Taxa: {((checklistStatus.emDia / checklistStatus.total) * 100).toFixed(1)}%
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Performance da Equipe - Lado Direito */}
                <Grid item xs={12} md={8}>
                    <Card sx={{ height: 450, overflow: 'auto' }}>
                        <CardContent>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                👥 Performance da Equipe
                            </Typography>
                            <Table size="small">
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Apontador</TableCell>
                                        <TableCell align="center">Total</TableCell>
                                        <TableCell align="center">Aprovados</TableCell>
                                        <TableCell align="center">Taxa</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {teamPerformance.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell>{member.nome}</TableCell>
                                            <TableCell align="center">{member.total}</TableCell>
                                            <TableCell align="center">{member.aprovados}</TableCell>
                                            <TableCell align="center">
                                                <Chip
                                                    label={`${member.taxaAprovacao}%`}
                                                    size="small"
                                                    color={parseFloat(member.taxaAprovacao) > 80 ? 'success' : 'warning'}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </Grid>


            </Grid>
        </Box>
    );
};

export default Dashboard;
