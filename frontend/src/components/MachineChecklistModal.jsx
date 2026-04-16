import { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, TextField, MenuItem, Button, Table,
    TableBody, TableCell, TableContainer, TableHead, TableRow,
    ToggleButtonGroup, ToggleButton, Alert, CircularProgress,
    Chip, Divider, alpha, Paper
} from '@mui/material';
import {
    CheckCircle, Cancel, DoNotDisturb, Assignment, Warning
} from '@mui/icons-material';
import { CHECKLIST_ITEMS, EQUIPMENT_TYPES } from '../constants/checklistItems';
import { checklistAPI } from '../services/api';

const STATUS_CONFIG = {
    C:  { label: 'C',  tooltip: 'Conforme',       color: 'success' },
    NC: { label: 'NC', tooltip: 'Não Conforme',    color: 'error' },
    NA: { label: 'NA', tooltip: 'Não Aplicável',   color: 'default' },
};

export default function MachineChecklistModal({ maquinaId, maquinaNome, open, onClose, onSaved }) {
    const today = new Date().toISOString().split('T')[0];

    const [operadorNome, setOperadorNome] = useState('');
    const [empresa, setEmpresa] = useState('Viana & Moura');
    const [chassi, setChassi] = useState('');
    const [tipoEquipamento, setTipoEquipamento] = useState('');
    const [dataInspecao, setDataInspecao] = useState(today);
    const [observacoes, setObservacoes] = useState('');
    const [itemStates, setItemStates] = useState(
        () => Object.fromEntries(CHECKLIST_ITEMS.map(i => [i.id, null]))
    );
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const visibleItems = CHECKLIST_ITEMS.filter(
        item => !item.applicableTo || item.applicableTo.includes(tipoEquipamento)
    );

    const answered = visibleItems.filter(i => itemStates[i.id] !== null).length;
    const total = visibleItems.length;
    const ncCount = visibleItems.filter(i => itemStates[i.id] === 'NC').length;

    function setStatus(itemId, status) {
        setItemStates(prev => ({ ...prev, [itemId]: prev[itemId] === status ? null : status }));
    }

    function validate() {
        if (!operadorNome.trim()) return 'Informe o nome do operador.';
        if (!empresa.trim()) return 'Informe a empresa.';
        if (!tipoEquipamento) return 'Selecione o tipo de equipamento.';
        const pendentes = visibleItems.filter(i => itemStates[i.id] === null).length;
        if (pendentes > 0) return `Responda todos os itens (${pendentes} pendente${pendentes > 1 ? 's' : ''}).`;
        return null;
    }

    async function handleSave() {
        const validationError = validate();
        if (validationError) { setError(validationError); return; }

        setSaving(true);
        setError('');
        try {
            const itens = visibleItems.map(i => ({
                item_id: i.id,
                label: i.label,
                status: itemStates[i.id],
            }));

            await checklistAPI.save({
                maquina_id: maquinaId,
                operador_nome: operadorNome,
                empresa,
                chassi,
                tipo_equipamento: tipoEquipamento,
                data_inspecao: dataInspecao,
                itens,
                observacoes,
            });

            if (onSaved) onSaved();
            handleClose();
        } catch (err) {
            setError(err.message || 'Erro ao salvar checklist.');
        } finally {
            setSaving(false);
        }
    }

    function handleClose() {
        setOperadorNome('');
        setEmpresa('Viana & Moura');
        setChassi('');
        setTipoEquipamento('');
        setDataInspecao(today);
        setObservacoes('');
        setItemStates(Object.fromEntries(CHECKLIST_ITEMS.map(i => [i.id, null])));
        setError('');
        setSaving(false);
        onClose();
    }

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            maxWidth="md"
            fullWidth
            scroll="paper"
            PaperProps={{ sx: { borderRadius: 2 } }}
        >
            {/* Header */}
            <Box sx={{ bgcolor: 'primary.dark', px: 3, py: 2.5 }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Assignment sx={{ color: 'white', fontSize: 28 }} />
                    <Box>
                        <Typography variant="h6" fontWeight="bold" color="white" lineHeight={1.2}>
                            Checklist de Inspeção de Segurança
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                            FORM 140-2/03 · Viana & Moura Construções
                            {maquinaNome && ` · ${maquinaNome}`}
                        </Typography>
                    </Box>
                </Box>
            </Box>

            <DialogContent sx={{ p: 3 }}>
                {/* Cabeçalho da inspeção */}
                <Box display="grid" gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }} gap={2} mb={3}>
                    <TextField
                        label="Nome do Operador *"
                        value={operadorNome}
                        onChange={e => setOperadorNome(e.target.value)}
                        size="small"
                        fullWidth
                    />
                    <TextField
                        label="Empresa *"
                        value={empresa}
                        onChange={e => setEmpresa(e.target.value)}
                        size="small"
                        fullWidth
                    />
                    <TextField
                        label="Chassi"
                        value={chassi}
                        onChange={e => setChassi(e.target.value)}
                        size="small"
                        fullWidth
                    />
                    <TextField
                        label="Data de Verificação *"
                        type="date"
                        value={dataInspecao}
                        onChange={e => setDataInspecao(e.target.value)}
                        size="small"
                        fullWidth
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        select
                        label="Tipo de Equipamento *"
                        value={tipoEquipamento}
                        onChange={e => setTipoEquipamento(e.target.value)}
                        size="small"
                        fullWidth
                        sx={{ gridColumn: { sm: '1 / -1' } }}
                    >
                        {EQUIPMENT_TYPES.map(t => (
                            <MenuItem key={t} value={t}>{t}</MenuItem>
                        ))}
                    </TextField>
                </Box>

                <Divider sx={{ mb: 2 }} />

                {/* Legenda + progresso */}
                <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1} mb={2}>
                    <Box display="flex" gap={1.5} flexWrap="wrap">
                        <Chip size="small" label="C — Conforme" sx={{ bgcolor: alpha('#4caf50', 0.12), color: 'success.dark', fontWeight: 600 }} />
                        <Chip size="small" label="NC — Não Conforme" sx={{ bgcolor: alpha('#C04848', 0.12), color: 'error.dark', fontWeight: 600 }} />
                        <Chip size="small" label="NA — Não Aplicável" sx={{ bgcolor: 'action.selected', fontWeight: 600 }} />
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                        {answered}/{total} respondidos
                        {ncCount > 0 && (
                            <Typography component="span" variant="caption" color="error.main" fontWeight="bold">
                                {' '}· {ncCount} NC
                            </Typography>
                        )}
                    </Typography>
                </Box>

                {/* Tabela de itens */}
                <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'background.default' }}>
                                <TableCell sx={{ fontWeight: 'bold', width: 40 }}>#</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Item de Verificação</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', width: 160, textAlign: 'center' }}>Status</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {visibleItems.map((item) => {
                                const current = itemStates[item.id];
                                return (
                                    <TableRow
                                        key={item.id}
                                        sx={{
                                            bgcolor: current === 'NC'
                                                ? alpha('#C04848', 0.05)
                                                : current === 'C'
                                                    ? alpha('#4caf50', 0.04)
                                                    : 'transparent',
                                            '&:last-child td': { border: 0 },
                                        }}
                                    >
                                        <TableCell>
                                            <Typography variant="caption" color="text.disabled" fontFamily="monospace">
                                                {String(item.id).padStart(2, '0')}
                                            </Typography>
                                        </TableCell>
                                        <TableCell>
                                            <Typography variant="body2">{item.label}</Typography>
                                        </TableCell>
                                        <TableCell>
                                            <ToggleButtonGroup
                                                value={current}
                                                exclusive
                                                size="small"
                                                sx={{ display: 'flex', justifyContent: 'center' }}
                                            >
                                                {Object.entries(STATUS_CONFIG).map(([statusKey, cfg]) => (
                                                    <ToggleButton
                                                        key={statusKey}
                                                        value={statusKey}
                                                        onClick={() => setStatus(item.id, statusKey)}
                                                        color={cfg.color}
                                                        sx={{
                                                            px: 1.5,
                                                            py: 0.5,
                                                            fontSize: '0.7rem',
                                                            fontWeight: 700,
                                                            minWidth: 40,
                                                        }}
                                                    >
                                                        {cfg.label}
                                                    </ToggleButton>
                                                ))}
                                            </ToggleButtonGroup>
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {visibleItems.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} align="center" sx={{ py: 4 }}>
                                        <Typography variant="body2" color="text.secondary">
                                            Selecione o tipo de equipamento para ver os itens
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Observações */}
                <TextField
                    label="Observações"
                    multiline
                    rows={3}
                    fullWidth
                    value={observacoes}
                    onChange={e => setObservacoes(e.target.value)}
                    placeholder="Registre aqui qualquer inconformidade ou detalhe adicional..."
                    size="small"
                />

                {error && (
                    <Alert severity="error" sx={{ mt: 2 }} icon={<Warning />}>
                        {error}
                    </Alert>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider', gap: 1 }}>
                <Button
                    onClick={handleClose}
                    color="inherit"
                    disabled={saving}
                >
                    Pular por agora
                </Button>
                <Button
                    variant="contained"
                    onClick={handleSave}
                    disabled={saving}
                    startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <CheckCircle />}
                >
                    {saving ? 'Salvando...' : 'Salvar Checklist'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
