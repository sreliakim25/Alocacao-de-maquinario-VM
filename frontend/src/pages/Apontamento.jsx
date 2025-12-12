import {
    Box,
    Typography,
    Paper,
    TextField,
    MenuItem,
    Grid,
    Button,
    Stack,
    InputAdornment,
    Divider,
    IconButton,
    Chip,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    List,
    ListItem,
    ListItemText,
    Alert
} from '@mui/material';
import {
    Person,
    Construction,
    LocationOn,
    Save,
    AddCircleOutline,
    Delete,
    AccessTime,
    WbSunny,
    NightsStay,
    CalendarToday,
    Assignment,
    CheckCircle,
    Send,
    Lock
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useApontamentoStore from '../store/apontamentoStore';
import useMaquinarioStore from '../store/maquinarioStore';
import useAuthStore from '../store/authStore';

// Listas de Dropdown (Mock Data)
const Vilas = ['Vila A', 'Vila B', 'Trecho Principal'];
const Etapas = ['Terraplanagem', 'Drenagem', 'Pavimentação', 'Obras de Arte'];
const SubEtapas = ['Escavação', 'Aterro', 'Compactação', 'Acabamento'];
const Contas = ['Operacional', 'Manutenção', 'Ocioso'];
const SubContas = ['Ativa', 'Parada Chuva', 'Parada Manutenção'];
const Supervisores = ['Eng. Ricardo', 'Mestre João', 'Superv. Ana'];

const initialRow = {
    id: 1,
    vila: '',
    etapa: '',
    subEtapa: '',
    conta: '',
    subConta: '',
    supervisor: '',
    inicio: '',
    fim: '',
    observacao: ''
};

const Apontamento = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const isEditMode = Boolean(id);

    const { addApontamento, updateApontamento, updateStatus, apontamentos } = useApontamentoStore();
    const { maquinarios } = useMaquinarioStore();
    const { user } = useAuthStore();

    // Estado do Cabeçalho
    const [headerData, setHeaderData] = useState({
        data: new Date().toISOString().split('T')[0],
        maquina: '',
        maquinaNome: '',
        operador: '',
    });

    // Estado das Linhas (Itens do Apontamento)
    const [rows, setRows] = useState([initialRow]);

    // Controle de Edição
    const [statusData, setStatusData] = useState('em_apontamento'); // Default new
    const [isEditable, setIsEditable] = useState(true);
    const [originalContext, setOriginalContext] = useState(null);

    // Carregar Dados na Edição
    useEffect(() => {
        if (isEditMode && id) {
            const currentItem = apontamentos.find(a => a.id === id);
            if (currentItem) {
                // Header Map
                setHeaderData({
                    data: currentItem.data,
                    maquina: currentItem.maquina,
                    maquinaNome: '', // Not stored explicitly usually, but acceptable
                    operador: currentItem.operador
                });

                setOriginalContext({
                    data: currentItem.data,
                    maquina: currentItem.maquina,
                    apontadorId: currentItem.apontadorId
                });

                // Status Logic
                setStatusData(currentItem.status);
                const editableStatuses = ['em_apontamento', 'pendente_supervisor', 'pendente_lider'];
                setIsEditable(editableStatuses.includes(currentItem.status));

                // Find all siblings
                const siblings = apontamentos.filter(a =>
                    a.data === currentItem.data &&
                    a.maquina === currentItem.maquina &&
                    a.apontadorId === currentItem.apontadorId
                );

                // Row Map (Batch)
                const mappedRows = siblings.map(item => ({
                    id: item.id,
                    vila: item.vila,
                    etapa: item.detalhes?.etapa || '',
                    subEtapa: item.detalhes?.subEtapa || '',
                    conta: item.detalhes?.conta || '',
                    subConta: item.detalhes?.subConta || '',
                    supervisor: item.detalhes?.supervisor || '',
                    inicio: item.inicio,
                    fim: item.fim,
                    observacao: item.observacao
                })).sort((a, b) => a.inicio.localeCompare(b.inicio));

                setRows(mappedRows);
            } else {
                navigate('/lista-apontamentos');
            }
        }
    }, [id, isEditMode, apontamentos, navigate]);


    // Estado do Dialog de Confirmação
    const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

    // Auto-preenchimento: Máquina -> Operador
    const handleMaquinaChange = (e) => {
        if (!isEditable) return;
        const maquinaSelecionada = maquinarios?.find(m => m.nome === e.target.value);
        if (maquinaSelecionada) {
            setHeaderData({
                ...headerData,
                maquina: maquinaSelecionada.nome,
                maquinaNome: maquinaSelecionada.tipo,
                operador: maquinaSelecionada.operador || ''
            });
        } else {
            setHeaderData({ ...headerData, maquina: e.target.value });
        }
    };

    // Auto-preenchimento: Operador -> Máquina
    const handleOperadorBlur = (e) => {
        if (!isEditable) return;
        const opName = e.target.value;
        const maquinasDoOperador = maquinarios?.filter(m => m.operador && m.operador.toLowerCase() === opName.toLowerCase()) || [];

        if (maquinasDoOperador.length === 1 && !headerData.maquina) {
            setHeaderData(prev => ({
                ...prev,
                maquina: maquinasDoOperador[0].nome,
                operador: maquinasDoOperador[0].operador
            }));
        }
    };


    const handleHeaderChange = (e) => {
        if (!isEditable) return;
        setHeaderData({ ...headerData, [e.target.name]: e.target.value });
    };

    // Manipulação das Linhas
    const handleRowChange = (id, field, value) => {
        if (!isEditable) return;
        setRows(rows.map(row =>
            row.id === id ? { ...row, [field]: value } : row
        ));
    };

    const addRow = () => {
        if (!isEditable) return;
        const newId = `temp-${Date.now()}`;
        setRows([...rows, { ...initialRow, id: newId }]);
    };

    const removeRow = (id) => {
        if (!isEditable) return;
        if (rows.length > 1) {
            setRows(rows.filter(row => row.id !== id));
        }
    };

    // Botões de Atalho de Horário
    const setTimeRange = (id, type) => {
        if (!isEditable) return;
        let inicio = '';
        let fim = '';
        switch (type) {
            case 'manha': inicio = '07:00'; fim = '12:00'; break;
            case 'tarde': inicio = '13:00'; fim = '17:00'; break;
            case 'dia': inicio = '07:00'; fim = '17:00'; break;
            default: break;
        }
        setRows(rows.map(row =>
            row.id === id ? { ...row, inicio, fim } : row
        ));
    };


    const calculateRowHours = (inicio, fim) => {
        if (!inicio || !fim) return '0.0';
        const [hStart, mStart] = inicio.split(':').map(Number);
        const [hEnd, mEnd] = fim.split(':').map(Number);

        if (isNaN(hStart) || isNaN(mStart) || isNaN(hEnd) || isNaN(mEnd)) return '0.0';

        const start = hStart * 60 + mStart;
        const end = hEnd * 60 + mEnd;
        let diff = (end - start) / 60;

        // Desconta 1h (almoço) se o período cobrir totalmente o intervalo 12:00 - 13:00
        const lunchStart = 12 * 60;
        const lunchEnd = 13 * 60;

        if (start <= lunchStart && end >= lunchEnd) {
            diff -= 1.0;
        }

        return diff > 0 ? diff.toFixed(1) : '0.0';
    };

    const calculateTotalHours = () => {
        return rows.reduce((acc, row) => acc + parseFloat(calculateRowHours(row.inicio, row.fim)), 0).toFixed(1);
    };

    // Validação
    const [validationErrors, setValidationErrors] = useState([]);
    const [openErrorDialog, setOpenErrorDialog] = useState(false);

    const validateForm = () => {
        const errors = [];
        if (!headerData.data) errors.push("Data do Apontamento");
        if (!headerData.maquina) errors.push("Máquina");
        if (!headerData.operador) errors.push("Operador");

        rows.forEach((row, index) => {
            const linhaNum = index + 1;
            const missingFields = [];
            if (!row.vila) missingFields.push("Vila/Local");
            if (!row.etapa) missingFields.push("Etapa");
            if (!row.subEtapa) missingFields.push("Sub-Etapa");
            if (!row.conta) missingFields.push("Conta");
            if (!row.subConta) missingFields.push("Sub-Conta");
            if (!row.supervisor) missingFields.push("Supervisor");
            if (!row.inicio) missingFields.push("Início");
            if (!row.fim) missingFields.push("Fim");

            if (missingFields.length > 0) {
                errors.push(`Linha ${linhaNum}: ${missingFields.join(', ')}`);
            }
        });
        return errors;
    };

    const handleOpenConfirm = () => {
        const errors = validateForm();
        if (errors.length > 0) {
            setValidationErrors(errors);
            setOpenErrorDialog(true);
        } else {
            setOpenConfirmDialog(true);
        }
    };

    const handleConfirmSubmit = () => {
        const baseApontamento = {
            data: headerData.data,
            maquina: headerData.maquina,
            operador: headerData.operador,

            // Workflow fields
            status: isEditMode ? statusData : 'em_apontamento',
            apontadorId: user?.id || 'anon',
            apontadorNome: user?.name || 'Desconhecido',
            ultimaPendencia: ''
        };

        // Create list of items from rows
        const itemsToSave = rows.map(row => {
            // Generate ID if temp or new
            const isTempId = (typeof row.id === 'string' && row.id.startsWith('temp-'));
            const rowId = isTempId
                ? Math.random().toString(36).substr(2, 9)
                : (isEditMode ? row.id : Math.random().toString(36).substr(2, 9));

            return {
                ...baseApontamento,
                id: rowId,
                // Row specific
                vila: row.vila,
                inicio: row.inicio,
                fim: row.fim,
                periodo: getPeriodo(row.inicio),
                totalHoras: calculateRowHours(row.inicio, row.fim),
                observacao: row.observacao,

                detalhes: {
                    etapa: row.etapa,
                    subEtapa: row.subEtapa,
                    conta: row.conta,
                    subConta: row.subConta,
                    supervisor: row.supervisor,
                }
            };
        });

        if (isEditMode && originalContext) {
            useApontamentoStore.getState().syncApontamentosBatch(originalContext, itemsToSave);
        } else {
            // Create Mode: Use dummy context to ensure no deletion of unrelated items, 
            // or better, verify if checking duplicates matters. 
            // For now, simple add.
            useApontamentoStore.getState().syncApontamentosBatch({ data: 'x', maquina: 'x', apontadorId: 'x' }, itemsToSave);
        }

        setOpenConfirmDialog(false);
        navigate('/lista-apontamentos');
    };

    const getPeriodo = (time) => {
        if (!time) return '';
        const hour = parseInt(time.split(':')[0]);
        return hour < 12 ? 'Manhã' : 'Tarde';
    };



    return (
        <Box>
            {/* Header Title */}
            <Box
                sx={{
                    background: 'linear-gradient(135deg, rgba(192, 72, 72, 0.1) 0%, rgba(217, 164, 65, 0.1) 100%)',
                    borderRadius: 3,
                    p: 3,
                    mb: 3,
                    border: '1px solid rgba(255,255,255,0.08)',
                }}
            >
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={2}>
                        <Box
                            sx={{
                                width: 48,
                                height: 48,
                                borderRadius: 2,
                                background: 'linear-gradient(135deg, #C04848 0%, #8B3333 100%)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Assignment sx={{ fontSize: 24 }} />
                        </Box>
                        <Box>
                            <Typography variant="h5" fontWeight="bold">
                                {isEditMode ? 'Editar Apontamento' : 'Novo Apontamento'}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {isEditMode ? 'Detalhes e Aprovações' : 'Boletim Diário de Equipamentos'}
                            </Typography>
                        </Box>
                    </Stack>

                    {!isEditable && (
                        <Chip
                            icon={<Lock />}
                            label="Somente Leitura"
                            color="error"
                            variant="outlined"
                        />
                    )}
                </Stack>
            </Box>

            {/* Cabeçalho do Apontamento */}
            <Paper sx={{ p: 3, mb: 3 }}>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={3}>
                        <TextField
                            fullWidth
                            label="Data"
                            type="date"
                            name="data"
                            value={headerData.data}
                            onChange={handleHeaderChange}
                            InputLabelProps={{ shrink: true }}
                            size="small"
                            disabled={!isEditable}
                        />
                    </Grid>
                    <Grid item xs={12} md={5}>
                        <TextField
                            select
                            fullWidth
                            label="Selecione a Máquina"
                            name="maquina"
                            value={headerData.maquina}
                            onChange={handleMaquinaChange}
                            size="small"
                            disabled={!isEditable}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Construction sx={{ color: 'text.secondary', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                            }}
                        >
                            {maquinarios?.map((m) => (
                                <MenuItem key={m.id} value={m.nome}>
                                    {m.nome} - {m.tipo}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <TextField
                            fullWidth
                            label="Operador"
                            name="operador"
                            value={headerData.operador}
                            onChange={handleHeaderChange}
                            onBlur={handleOperadorBlur}
                            size="small"
                            disabled={!isEditable}
                            placeholder="Preenchimento automático..."
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Person sx={{ color: 'text.secondary', fontSize: 20 }} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Linhas de Apontamento */}
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ ml: 1 }}>
                Detalhamento das Atividades
            </Typography>

            {rows.map((row, index) => (
                <Paper key={row.id} sx={{ p: 3, mb: 2, position: 'relative', borderLeft: '4px solid #D9A441' }}>

                    {/* Botão de Excluir Linha (Allowed in Edit Mode too now) */}
                    {rows.length > 1 && isEditable && (
                        <IconButton
                            onClick={() => removeRow(row.id)}
                            sx={{ position: 'absolute', top: 8, right: 8, color: 'text.disabled', '&:hover': { color: 'error.main' } }}
                            size="small"
                        >
                            <Delete fontSize="small" />
                        </IconButton>
                    )}

                    {/* Linha 1: Classificação (Dropdowns) */}
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                select
                                fullWidth
                                label="Vila / Local"
                                value={row.vila}
                                onChange={(e) => handleRowChange(row.id, 'vila', e.target.value)}
                                size="small"
                                disabled={!isEditable}
                            >
                                {Vilas.map(op => <MenuItem key={op} value={op}>{op}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                select
                                fullWidth
                                label="Etapa"
                                value={row.etapa}
                                onChange={(e) => handleRowChange(row.id, 'etapa', e.target.value)}
                                size="small"
                                disabled={!isEditable}
                            >
                                {Etapas.map(op => <MenuItem key={op} value={op}>{op}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                select
                                fullWidth
                                label="Sub-Etapa"
                                value={row.subEtapa}
                                onChange={(e) => handleRowChange(row.id, 'subEtapa', e.target.value)}
                                size="small"
                                disabled={!isEditable}
                            >
                                {SubEtapas.map(op => <MenuItem key={op} value={op}>{op}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                select
                                fullWidth
                                label="Conta"
                                value={row.conta}
                                onChange={(e) => handleRowChange(row.id, 'conta', e.target.value)}
                                size="small"
                                disabled={!isEditable}
                            >
                                {Contas.map(op => <MenuItem key={op} value={op}>{op}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                select
                                fullWidth
                                label="Sub-Conta"
                                value={row.subConta}
                                onChange={(e) => handleRowChange(row.id, 'subConta', e.target.value)}
                                size="small"
                                disabled={!isEditable}
                            >
                                {SubContas.map(op => <MenuItem key={op} value={op}>{op}</MenuItem>)}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={6} md={2}>
                            <TextField
                                select
                                fullWidth
                                label="Supervisor"
                                value={row.supervisor}
                                onChange={(e) => handleRowChange(row.id, 'supervisor', e.target.value)}
                                size="small"
                                disabled={!isEditable}
                            >
                                {Supervisores.map(op => <MenuItem key={op} value={op}>{op}</MenuItem>)}
                            </TextField>
                        </Grid>
                    </Grid>

                    {/* Linha 2 Estrutural: Detalhes Horários e Obs */}
                    <Box sx={{
                        mt: 3,
                        p: 2,
                        bgcolor: 'rgba(255,255,255,0.03)',
                        borderRadius: 2,
                        border: '1px solid rgba(255,255,255,0.08)'
                    }}>
                        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={3} alignItems="center">

                            {/* Grupo Horário */}
                            <Stack direction="row" spacing={2} alignItems="center">
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Início</Typography>
                                    <TextField
                                        type="time"
                                        value={row.inicio}
                                        onChange={(e) => handleRowChange(row.id, 'inicio', e.target.value)}
                                        sx={{ width: 130 }}
                                        InputProps={{ sx: { fontSize: '1rem' } }}
                                        disabled={!isEditable}
                                    />
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ pt: 2 }}>até</Typography>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>Fim</Typography>
                                    <TextField
                                        type="time"
                                        value={row.fim}
                                        onChange={(e) => handleRowChange(row.id, 'fim', e.target.value)}
                                        sx={{ width: 130 }}
                                        InputProps={{ sx: { fontSize: '1rem' } }}
                                        disabled={!isEditable}
                                    />
                                </Box>
                            </Stack>

                            <Divider orientation="vertical" flexItem sx={{ display: { xs: 'none', lg: 'block' }, height: 40, alignSelf: 'center' }} />

                            {/* Grupo Quick Fill */}
                            {isEditable && (
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                                        Preenchimento Rápido
                                    </Typography>
                                    <Stack direction="row" spacing={1}>
                                        <Tooltip title="Manhã (07:00 - 12:00)">
                                            <Chip
                                                icon={<WbSunny sx={{ fontSize: 14 }} />}
                                                label="M"
                                                onClick={() => setTimeRange(row.id, 'manha')}
                                                clickable
                                                variant="outlined"
                                            />
                                        </Tooltip>
                                        <Tooltip title="Tarde (13:00 - 17:00)">
                                            <Chip
                                                icon={<NightsStay sx={{ fontSize: 14 }} />}
                                                label="T"
                                                onClick={() => setTimeRange(row.id, 'tarde')}
                                                clickable
                                                variant="outlined"
                                            />
                                        </Tooltip>
                                        <Tooltip title="Dia (07:00 - 17:00) -1h Almoço">
                                            <Chip
                                                icon={<CalendarToday sx={{ fontSize: 14 }} />}
                                                label="Dia"
                                                onClick={() => setTimeRange(row.id, 'dia')}
                                                clickable
                                                color="primary"
                                            />
                                        </Tooltip>
                                    </Stack>
                                </Box>
                            )}

                            {/* Total Horas */}
                            <Paper variant="outlined" sx={{
                                p: 1,
                                px: 2,
                                minWidth: 90,
                                textAlign: 'center',
                                bgcolor: 'rgba(217, 164, 65, 0.05)',
                                borderColor: 'rgba(217, 164, 65, 0.3)'
                            }}>
                                <Typography variant="caption" color="text.secondary">Total</Typography>
                                <Typography variant="h6" fontWeight="bold" color="#D9A441">
                                    {calculateRowHours(row.inicio, row.fim)}h
                                </Typography>
                            </Paper>

                            {/* Observações */}
                            <TextField
                                fullWidth
                                label="Observações"
                                value={row.observacao}
                                onChange={(e) => handleRowChange(row.id, 'observacao', e.target.value)}
                                placeholder="Descrição da atividade..."
                                multiline
                                minRows={1}
                                maxRows={10}
                                sx={{ flexGrow: 1 }}
                                disabled={!isEditable}
                            />
                        </Stack>
                    </Box>
                </Paper>
            ))}

            {/* Ações do Rodapé */}
            <Stack direction="row" spacing={2} sx={{ mt: 3, mb: 10 }}>
                {isEditable && (
                    <Button
                        variant="outlined"
                        startIcon={<AddCircleOutline />}
                        onClick={addRow}
                        fullWidth
                        sx={{ borderStyle: 'dashed', height: 48 }}
                    >
                        Adicionar Nova Linha
                    </Button>
                )}

                {/* Botão Cancelar (Edit Mode Only) */}
                {isEditMode && isEditable && (
                    <Button
                        variant="contained"
                        onClick={() => navigate('/lista-apontamentos')}
                        fullWidth
                        sx={{
                            bgcolor: '#757575', // Grey color
                            color: '#fff',
                            fontWeight: 'bold',
                            '&:hover': { bgcolor: '#616161' },
                            height: 48
                        }}
                    >
                        Cancelar
                    </Button>
                )}

                {/* Botão Salvar (Create & Edit) */}
                {isEditable && (
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleOpenConfirm}
                        color="secondary"
                        fullWidth
                        sx={{
                            bgcolor: '#D9A441',
                            color: '#000',
                            fontWeight: 'bold',
                            '&:hover': { bgcolor: '#B8872E' },
                            height: 48
                        }}
                    >
                        {isEditMode ? 'Salvar Alterações' : 'Salvar Boletim'}
                    </Button>
                )}



                {!isEditable && (
                    <Button
                        variant="outlined"
                        onClick={() => navigate('/lista-apontamentos')}
                        fullWidth
                        sx={{ height: 48 }}
                    >
                        Voltar para Lista
                    </Button>
                )}

            </Stack>

            {/* Dialog de Confirmação */}
            <Dialog
                open={openConfirmDialog}
                onClose={() => setOpenConfirmDialog(false)}
            >
                <DialogTitle id="alert-dialog-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircle color="success" />
                    {isEditMode ? 'Confirmar Edição?' : 'Confirmar Lançamento?'}
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
                        <Box sx={{ bgcolor: 'rgba(255,255,255,0.05)', p: 2, borderRadius: 1 }}>
                            <Typography variant="subtitle2" color="text.secondary">Resumo Geral</Typography>
                            <Typography variant="body1"><strong>Máquina:</strong> {headerData.maquina}</Typography>
                            <Typography variant="body1"><strong>Total Horas:</strong> {calculateTotalHours()}h</Typography>
                        </Box>

                        <Typography variant="caption" color="text.secondary">
                            {isEditMode
                                ? 'O registro selecionado será atualizado.'
                                : `Ao confirmar, ${rows.length} registros serão gerados no sistema.`
                            }
                        </Typography>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenConfirmDialog(false)} color="inherit">
                        Voltar
                    </Button>
                    <Button onClick={handleConfirmSubmit} variant="contained" color="success" autoFocus>
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Erro de Validação Dialog */}
            <Dialog
                open={openErrorDialog}
                onClose={() => setOpenErrorDialog(false)}
            >
                <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'error.main' }}>
                    <CheckCircle color="error" />
                    Campos Obrigatórios Pendentes
                </DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
                        <Typography variant="body1">
                            Por favor, preencha as seguintes informações antes de salvar:
                        </Typography>
                        <Box sx={{ bgcolor: 'rgba(211, 47, 47, 0.1)', p: 2, borderRadius: 1, border: '1px solid rgba(211, 47, 47, 0.3)' }}>
                            <List dense>
                                {validationErrors.map((error, idx) => (
                                    <ListItem key={idx}>
                                        <ListItemText primary={`• ${error}`} primaryTypographyProps={{ color: 'error.light' }} />
                                    </ListItem>
                                ))}
                            </List>
                        </Box>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenErrorDialog(false)} variant="contained" color="error" autoFocus>
                        Voltar e Corrigir
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
};

export default Apontamento;
