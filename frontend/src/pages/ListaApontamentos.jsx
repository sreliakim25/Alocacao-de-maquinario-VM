import {
    Box,
    Typography,
    Paper,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Stack,
    IconButton,
    Tooltip,
    Alert,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Button
} from '@mui/material';
import {
    ExpandMore,
    Edit,
    CheckCircle,
    ErrorOutline,
    HourglassEmpty,
    Assignment,
    CalendarToday,
    Person,
    Send,
    AddCircleOutline
} from '@mui/icons-material';
import useApontamentoStore from '../store/apontamentoStore';
import useAuthStore from '../store/authStore';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const StatusChip = ({ status }) => {
    let color = 'default';
    let label = status;
    let icon = null;

    switch (status) {
        case 'em_apontamento':
            color = 'default';
            label = 'Em Edição';
            icon = <Edit fontSize="small" />;
            break;
        case 'liberado_apontador':
            color = 'info';
            label = 'Aguardando Supervisor';
            icon = <Send fontSize="small" />;
            break;
        case 'pendente_supervisor':
            color = 'warning';
            label = 'Pendente Supervisor';
            icon = <ErrorOutline fontSize="small" />;
            break;
        case 'liberado_supervisor':
            color = 'info';
            label = 'Aguardando Líder';
            icon = <CheckCircle fontSize="small" />;
            break;
        case 'pendente_lider':
            color = 'warning';
            label = 'Pendente Líder';
            icon = <ErrorOutline fontSize="small" />;
            break;
        case 'liberado_lider':
            color = 'success';
            label = 'Aprovado Final';
            icon = <CheckCircle fontSize="small" />;
            break;
        default:
            break;
    }

    return (
        <Chip
            icon={icon}
            label={label}
            color={color}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 600 }}
        />
    );
};

const ListaApontamentos = () => {
    const { apontamentos, updateStatus, updateStatusBatch } = useApontamentoStore();
    const { user } = useAuthStore();
    const navigate = useNavigate();

    // 1. Filter by User Access (Apontador sees only own)
    // Assuming 'admin' or 'supervisor' roles would see all.
    // For this implementation, we restrict if user is NOT admin.
    const filteredApontamentos = useMemo(() => {
        if (!user) return [];
        // Se for admin/supervisor vê tudo, senão só os seus
        if (user.role === 'admin' || user.role === 'supervisor') {
            return apontamentos;
        }
        return apontamentos.filter(a => a.apontadorId === user.id);
    }, [apontamentos, user]);

    // 2. Group by Date, then by Machine
    const groupedData = useMemo(() => {
        const groups = {};

        filteredApontamentos.forEach(apt => {
            if (!groups[apt.data]) {
                groups[apt.data] = {};
            }
            // Group by Machine Name
            if (!groups[apt.data][apt.maquina]) {
                groups[apt.data][apt.maquina] = [];
            }
            groups[apt.data][apt.maquina].push(apt);
        });

        // Sort dates descending
        return Object.keys(groups).sort((a, b) => new Date(b) - new Date(a)).map(date => ({
            date,
            maquinas: groups[date]
        }));
    }, [filteredApontamentos]);

    const handleLiberar = (id) => {
        updateStatus(id, 'liberado_apontador');
    };

    const handleBatchLiberar = (items) => {
        const ids = items.map(i => i.id);
        updateStatusBatch(ids, 'liberado_apontador');
    };

    return (
        <Box>
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
                        <Assignment sx={{ fontSize: 28, color: '#000' }} />
                    </Box>
                    <Box>
                        <Typography variant="h4" fontWeight="bold">
                            Meus Apontamentos
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Gerencie os boletins diários e acompanhe as aprovações
                        </Typography>
                    </Box>
                </Stack>
            </Box>

            {groupedData.length === 0 ? (
                <Alert severity="info" sx={{ mt: 2 }}>
                    Nenhum apontamento encontrado para seu usuário.
                </Alert>
            ) : (
                <Box>
                    {groupedData.map((dateGroup) => (
                        <Box key={dateGroup.date} sx={{ mb: 4 }}>
                            {/* Date Header */}
                            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2, ml: 1 }}>
                                <CalendarToday color="primary" fontSize="small" />
                                <Typography variant="h6" fontWeight="bold">
                                    {new Date(dateGroup.date).toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                </Typography>
                            </Stack>

                            {/* Machine Groups */}
                            {Object.entries(dateGroup.maquinas).map(([machineName, items]) => {
                                // Assume all items in this group have same status context for the purpose of the header action, 
                                // OR we just pick the first one to determine actions.
                                const firstItem = items[0];
                                const canEdit = (firstItem.status === 'em_apontamento' || firstItem.status.includes('pendente'));

                                return (
                                    <Paper key={machineName} sx={{ mb: 3, overflow: 'hidden', borderLeft: '4px solid #D9A441' }}>
                                        <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                                <Stack direction="row" alignItems="center" spacing={1}>
                                                    <Typography variant="subtitle1" fontWeight="bold">
                                                        {machineName}
                                                    </Typography>
                                                    <Chip label={`${items.length} registros`} size="small" sx={{ ml: 2, height: 20, fontSize: '0.7rem' }} />
                                                </Stack>

                                                {/* Header Actions (Batch Edit) */}
                                                <Stack direction="row" spacing={1}>
                                                    {canEdit && (
                                                        <>
                                                            <Tooltip title="Editar Boletim Completo">
                                                                <Button
                                                                    variant="outlined"
                                                                    size="small"
                                                                    startIcon={<Edit />}
                                                                    onClick={() => navigate(`/apontamento/${firstItem.id}`)}
                                                                    sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'text.primary' }}
                                                                >
                                                                    Editar
                                                                </Button>
                                                            </Tooltip>
                                                            <Tooltip title="Liberar Boletim para Conferência">
                                                                <Button
                                                                    variant="contained"
                                                                    size="small"
                                                                    color="success"
                                                                    endIcon={<Send />}
                                                                    onClick={() => handleBatchLiberar(items)}
                                                                >
                                                                    Liberar
                                                                </Button>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                </Stack>
                                            </Stack>
                                        </Box>

                                        <TableContainer>
                                            <Table size="small">
                                                <TableHead>
                                                    <TableRow sx={{ '& th': { color: 'text.secondary', fontWeight: 600 } }}>
                                                        <TableCell>Status</TableCell>
                                                        <TableCell>Operador</TableCell>
                                                        <TableCell>Vila</TableCell>
                                                        <TableCell>Etapa</TableCell>
                                                        <TableCell>Sub-Etapa</TableCell>
                                                        <TableCell>Conta</TableCell>
                                                        <TableCell>Sub-Conta</TableCell>
                                                        <TableCell>Supervisor</TableCell>
                                                        <TableCell>Horário</TableCell>
                                                        <TableCell align="center">Total</TableCell>
                                                        <TableCell>Pendências</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {items.map((row) => (
                                                        <TableRow key={row.id} hover>
                                                            <TableCell>
                                                                <StatusChip status={row.status} />
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" color="text.secondary">{row.operador}</Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" color="text.secondary">{row.vila}</Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" color="text.secondary">{row.detalhes?.etapa || '-'}</Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" color="text.secondary">{row.detalhes?.subEtapa || '-'}</Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" color="text.secondary">{row.detalhes?.conta || '-'}</Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" color="text.secondary">{row.detalhes?.subConta || '-'}</Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" color="text.secondary">{row.detalhes?.supervisor || '-'}</Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" color="text.secondary">
                                                                    {row.inicio} - {row.fim}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Typography variant="body2" fontWeight="bold">
                                                                    {row.totalHoras}h
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                {row.ultimaPendencia ? (
                                                                    <Typography variant="caption" color="error.main" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                        <ErrorOutline fontSize="inherit" />
                                                                        {row.ultimaPendencia}
                                                                    </Typography>
                                                                ) : (
                                                                    <Typography variant="caption" color="text.disabled">-</Typography>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Paper>
                                );
                            })}
                        </Box>
                    ))}
                </Box>
            )}
            {/* Floating Action Button for New Appointment */}
            <Tooltip title="Novo Apontamento">
                <IconButton
                    color="secondary"
                    sx={{
                        position: 'fixed',
                        bottom: 32,
                        right: 32,
                        bgcolor: '#D9A441',
                        color: '#000',
                        width: 56,
                        height: 56,
                        boxShadow: 3,
                        '&:hover': { bgcolor: '#B8872E' }
                    }}
                    onClick={() => navigate('/apontamento')}
                >
                    <AddCircleOutline sx={{ fontSize: 32 }} />
                </IconButton>
            </Tooltip>
        </Box>
    );
};

export default ListaApontamentos;
