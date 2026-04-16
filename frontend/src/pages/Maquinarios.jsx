import {
    Box, Typography, Button, Stack, Dialog, DialogContent, DialogActions,
    TextField, IconButton, Card, CardContent, Grid, alpha, MenuItem,
    InputAdornment, Alert, CircularProgress, Switch, FormControlLabel,
    Chip, Tooltip, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Avatar, Divider, ToggleButtonGroup,
    ToggleButton
} from '@mui/material';
import {
    Add, ArrowBack, Close, Construction, Person, Business,
    Delete, Edit, PhotoCamera, DirectionsCar, Work,
    ViewModule, ViewList, ChecklistRtl, Circle, Assignment
} from '@mui/icons-material';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useMaquinarioStore from '../store/maquinarioStore';
import MachineChecklistModal from '../components/MachineChecklistModal';

const TiposMaquinas = [
    'Retroescavadeira', 'Pá Carregadeira', 'Caminhão Pipa',
    'Escavadeira Hidráulica', 'Motoniveladora', 'Rolo Compactador', 'Caminhão Caçamba'
];
const Setores = ['UDE', 'Infraestrutura'];

const emptyForm = {
    nome: '', tipo: '', operador: '', fornecedor: '',
    placa: '', setor: '', foto: null, ativo: true
};

const Cadastros = () => {
    const navigate = useNavigate();
    const { maquinarios, addMaquinario, removeMaquinario, updateMaquinario, fetchMaquinarios, loading } = useMaquinarioStore();

    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [submitError, setSubmitError] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'
    const fileInputRef = useRef(null);

    // Checklist modal
    const [checklistOpen, setChecklistOpen] = useState(false);
    const [checklistMaquinaId, setChecklistMaquinaId] = useState(null);
    const [checklistMaquinaNome, setChecklistMaquinaNome] = useState('');

    const [formData, setFormData] = useState(emptyForm);

    useEffect(() => { fetchMaquinarios(); }, [fetchMaquinarios]);

    // Separar ativos e inativos
    const ativos = maquinarios.filter(m => m.ativo);
    const inativos = maquinarios.filter(m => !m.ativo);
    const ordenados = [...ativos, ...inativos];

    const handleOpen = (item = null) => {
        if (item) {
            setEditingId(item.id);
            setFormData({ ...emptyForm, ...item, ativo: item.ativo !== false });
        } else {
            setEditingId(null);
            setFormData(emptyForm);
        }
        setSubmitError(null);
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setSubmitError(null);
        setSubmitting(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setFormData(prev => ({ ...prev, foto: reader.result }));
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!formData.nome?.trim()) {
            setSubmitError('O nome do maquinário é obrigatório.');
            return;
        }
        setSubmitError(null);
        setSubmitting(true);
        try {
            if (editingId) {
                await updateMaquinario(editingId, formData);
                handleClose();
            } else {
                const novaId = await addMaquinario(formData);
                handleClose();
                // Abrir checklist automaticamente após criar
                setChecklistMaquinaId(novaId);
                setChecklistMaquinaNome(formData.nome);
                setChecklistOpen(true);
            }
        } catch (error) {
            setSubmitError(error.message || 'Erro ao salvar. Verifique sua permissão e tente novamente.');
        } finally {
            setSubmitting(false);
        }
    };

    // ── Card de maquinário (grid) ──
    const MaquinarioCard = ({ maq }) => (
        <Card
            sx={{
                position: 'relative',
                transition: 'all 0.2s',
                opacity: maq.ativo ? 1 : 0.55,
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 8 }
            }}
        >
            {/* Foto */}
            <Box
                sx={{
                    height: 140,
                    bgcolor: 'background.paper',
                    position: 'relative',
                    backgroundImage: maq.foto ? `url(${maq.foto})` : 'none',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    borderBottom: 1,
                    borderColor: 'divider',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
            >
                {!maq.foto && <Construction sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.3 }} />}

                {/* Badges */}
                <Box sx={{ position: 'absolute', top: 8, left: 8 }}>
                    <Chip
                        icon={<Circle sx={{ fontSize: '10px !important' }} />}
                        label={maq.ativo ? 'Ativo' : 'Inativo'}
                        size="small"
                        color={maq.ativo ? 'success' : 'default'}
                        sx={{ fontSize: 10, height: 20 }}
                    />
                </Box>

                {/* Ações */}
                <Box sx={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 0.5 }}>
                    <Tooltip title="Fazer Checklist">
                        <IconButton size="small"
                            onClick={() => { setChecklistMaquinaId(maq.id); setChecklistMaquinaNome(maq.nome); setChecklistOpen(true); }}
                            sx={{ bgcolor: 'rgba(0,0,0,0.55)', color: '#D9A441', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
                            <Assignment fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <IconButton size="small" onClick={() => handleOpen(maq)}
                        sx={{ bgcolor: 'rgba(0,0,0,0.55)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
                        <Edit fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => removeMaquinario(maq.id)}
                        sx={{ bgcolor: 'rgba(0,0,0,0.55)', color: '#ff5252', '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' } }}>
                        <Delete fontSize="small" />
                    </IconButton>
                </Box>

                {/* Placa */}
                <Box sx={{ position: 'absolute', bottom: 8, left: 8, bgcolor: 'rgba(0,0,0,0.6)', px: 1, py: 0.3, borderRadius: 1 }}>
                    <Typography variant="caption" color="white" fontWeight="bold">
                        {maq.placa || 'Sem Placa'}
                    </Typography>
                </Box>
            </Box>

            <CardContent sx={{ pt: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                    <Typography variant="h6" fontWeight="bold" lineHeight={1.2}>{maq.nome}</Typography>
                    <Typography variant="caption" sx={{ bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1, whiteSpace: 'nowrap' }}>
                        {maq.tipo}
                    </Typography>
                </Box>
                <Stack spacing={1} mt={1.5}>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Person sx={{ fontSize: 16, color: '#D9A441' }} />
                        <Typography variant="body2">{maq.operador || 'Não definido'}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Business sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">{maq.fornecedor || '-'}</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" gap={1}>
                        <Work sx={{ fontSize: 16, color: 'text.secondary' }} />
                        <Typography variant="body2" color="text.secondary">{maq.setor || '-'}</Typography>
                    </Box>
                </Stack>
            </CardContent>
        </Card>
    );

    // ── Linha de maquinário (list) ──
    const MaquinarioRow = ({ maq }) => (
        <TableRow sx={{ opacity: maq.ativo ? 1 : 0.55 }}>
            <TableCell>
                <Avatar src={maq.foto || undefined} variant="rounded" sx={{ width: 40, height: 40, bgcolor: 'background.paper' }}>
                    {!maq.foto && <Construction sx={{ fontSize: 20, color: 'text.disabled' }} />}
                </Avatar>
            </TableCell>
            <TableCell>
                <Typography variant="body2" fontWeight={600}>{maq.nome}</Typography>
            </TableCell>
            <TableCell><Typography variant="body2">{maq.tipo || '-'}</Typography></TableCell>
            <TableCell><Typography variant="body2">{maq.placa || '-'}</Typography></TableCell>
            <TableCell><Typography variant="body2">{maq.operador || '-'}</Typography></TableCell>
            <TableCell><Typography variant="body2">{maq.fornecedor || '-'}</Typography></TableCell>
            <TableCell><Typography variant="body2">{maq.setor || '-'}</Typography></TableCell>
            <TableCell>
                <Chip
                    icon={<Circle sx={{ fontSize: '10px !important' }} />}
                    label={maq.ativo ? 'Ativo' : 'Inativo'}
                    size="small"
                    color={maq.ativo ? 'success' : 'default'}
                />
            </TableCell>
            <TableCell align="right">
                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title="Fazer Checklist">
                        <IconButton size="small"
                            onClick={() => { setChecklistMaquinaId(maq.id); setChecklistMaquinaNome(maq.nome); setChecklistOpen(true); }}
                            sx={{ color: 'secondary.main' }}>
                            <Assignment fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleOpen(maq)}>
                            <Edit fontSize="small" />
                        </IconButton>
                    </Tooltip>
                    <Tooltip title="Excluir">
                        <IconButton size="small" onClick={() => removeMaquinario(maq.id)} sx={{ color: '#ff5252' }}>
                            <Delete fontSize="small" />
                        </IconButton>
                    </Tooltip>
                </Stack>
            </TableCell>
        </TableRow>
    );

    return (
        <Box>
            <Button startIcon={<ArrowBack />} onClick={() => navigate('/')}
                sx={{ mb: 3, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}>
                Voltar
            </Button>

            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">Cadastro de Maquinários</Typography>
                    <Typography variant="body2" color="text.secondary">
                        {ativos.length} ativo{ativos.length !== 1 ? 's' : ''}{inativos.length > 0 ? ` · ${inativos.length} inativo${inativos.length !== 1 ? 's' : ''}` : ''}
                    </Typography>
                </Box>
                <Stack direction="row" spacing={1.5} alignItems="center">
                    {/* Toggle visualização */}
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(_, v) => v && setViewMode(v)}
                        size="small"
                    >
                        <ToggleButton value="grid"><Tooltip title="Miniaturas"><ViewModule /></Tooltip></ToggleButton>
                        <ToggleButton value="list"><Tooltip title="Lista"><ViewList /></Tooltip></ToggleButton>
                    </ToggleButtonGroup>

                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => handleOpen()}
                        sx={{ bgcolor: '#D9A441', color: '#000', fontWeight: 'bold', '&:hover': { bgcolor: '#B8872E' } }}
                    >
                        Novo Maquinário
                    </Button>
                </Stack>
            </Box>

            {/* ── Visualização em Grade ── */}
            {viewMode === 'grid' && (
                <Box>
                    {ativos.length > 0 && (
                        <>
                            <Typography variant="overline" color="success.main" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
                                Ativos ({ativos.length})
                            </Typography>
                            <Grid container spacing={3} sx={{ mb: 4 }}>
                                {ativos.map(maq => (
                                    <Grid item xs={12} sm={6} md={4} key={maq.id}>
                                        <MaquinarioCard maq={maq} />
                                    </Grid>
                                ))}
                            </Grid>
                        </>
                    )}
                    {inativos.length > 0 && (
                        <>
                            <Divider sx={{ mb: 2 }} />
                            <Typography variant="overline" color="text.secondary" fontWeight={700} sx={{ mb: 1, display: 'block' }}>
                                Inativos ({inativos.length})
                            </Typography>
                            <Grid container spacing={3}>
                                {inativos.map(maq => (
                                    <Grid item xs={12} sm={6} md={4} key={maq.id}>
                                        <MaquinarioCard maq={maq} />
                                    </Grid>
                                ))}
                            </Grid>
                        </>
                    )}
                    {ordenados.length === 0 && !loading && (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Construction sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                            <Typography color="text.secondary">Nenhum maquinário cadastrado</Typography>
                        </Box>
                    )}
                </Box>
            )}

            {/* ── Visualização em Lista ── */}
            {viewMode === 'list' && (
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ width: 56 }}></TableCell>
                                <TableCell>Nome</TableCell>
                                <TableCell>Tipo</TableCell>
                                <TableCell>Placa</TableCell>
                                <TableCell>Operador</TableCell>
                                <TableCell>Fornecedor</TableCell>
                                <TableCell>Setor</TableCell>
                                <TableCell>Status</TableCell>
                                <TableCell align="right">Ações</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {ativos.map(maq => <MaquinarioRow key={maq.id} maq={maq} />)}
                            {inativos.length > 0 && ativos.length > 0 && (
                                <TableRow>
                                    <TableCell colSpan={9} sx={{ py: 0.5, bgcolor: 'rgba(255,255,255,0.02)' }}>
                                        <Typography variant="caption" color="text.secondary">Inativos</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                            {inativos.map(maq => <MaquinarioRow key={maq.id} maq={maq} />)}
                            {ordenados.length === 0 && !loading && (
                                <TableRow>
                                    <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">Nenhum maquinário cadastrado</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* ── Dialog Cadastrar/Editar ── */}
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: { borderRadius: 2, backgroundImage: 'none', border: 1, borderColor: 'divider' }
                }}
            >
                {/* Header do dialog */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 2, borderBottom: (theme) => `1px solid ${theme.palette.divider}` }}>
                    <Box display="flex" alignItems="center" gap={2}>
                        <Box sx={{ p: 1, borderRadius: 1, bgcolor: alpha('#D9A441', 0.1) }}>
                            <Construction sx={{ color: '#D9A441' }} />
                        </Box>
                        <Box>
                            <Typography variant="h6" fontWeight="bold">
                                {editingId ? 'Editar Maquinário' : 'Cadastrar Maquinário'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                {editingId ? `Editando: ${formData.nome}` : 'Adicione um novo equipamento ao sistema'}
                            </Typography>
                        </Box>
                    </Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                        {/* Botão Checklist — módulo futuro */}
                        {editingId && (
                            <Tooltip title="Checklist de Segurança — em breve">
                                <span>
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<ChecklistRtl />}
                                        disabled
                                        sx={{ borderColor: 'rgba(255,255,255,0.2)', color: 'text.secondary' }}
                                    >
                                        Checklist
                                    </Button>
                                </span>
                            </Tooltip>
                        )}
                        <IconButton onClick={handleClose}><Close /></IconButton>
                    </Stack>
                </Box>

                <DialogContent sx={{ px: 3, pb: 2, pt: 3 }}>
                    <Grid container spacing={3}>
                        {/* Foto */}
                        <Grid item xs={12} md={4}>
                            <Box
                                sx={{
                                    height: '100%', minHeight: 220,
                                    border: '2px dashed rgba(255,255,255,0.1)', borderRadius: 2,
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', overflow: 'hidden', position: 'relative',
                                    '&:hover': { borderColor: '#D9A441', bgcolor: alpha('#D9A441', 0.02) }
                                }}
                                onClick={() => fileInputRef.current.click()}
                            >
                                {formData.foto ? (
                                    <Box component="img" src={formData.foto} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <>
                                        <PhotoCamera sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                                        <Typography variant="body2" color="text.secondary" align="center">
                                            Clique para adicionar foto
                                        </Typography>
                                    </>
                                )}
                                <input type="file" hidden ref={fileInputRef} accept="image/*" onChange={handlePhotoUpload} />
                            </Box>
                        </Grid>

                        {/* Campos */}
                        <Grid item xs={12} md={8}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={8}>
                                    <TextField fullWidth label="Nome do Maquinário" name="nome"
                                        placeholder="Ex: Retro-05, PC-01" value={formData.nome} onChange={handleChange}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><Construction fontSize="small" /></InputAdornment> }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField fullWidth label="Placa" name="placa"
                                        placeholder="ABC-1234" value={formData.placa} onChange={handleChange}
                                        InputProps={{ startAdornment: <InputAdornment position="start"><DirectionsCar fontSize="small" /></InputAdornment> }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField select fullWidth label="Tipo de Maquinário" name="tipo" value={formData.tipo} onChange={handleChange}>
                                        {TiposMaquinas.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Fornecedor" name="fornecedor"
                                        placeholder="Nome do fornecedor" value={formData.fornecedor} onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField fullWidth label="Operador Padrão" name="operador"
                                        placeholder="Nome do operador" value={formData.operador} onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField select fullWidth label="Setor" name="setor" value={formData.setor} onChange={handleChange}>
                                        {Setores.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                                    </TextField>
                                </Grid>

                                {/* Status ativo/inativo */}
                                <Grid item xs={12}>
                                    <Box sx={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                        p: 1.5, borderRadius: 2, border: '1px solid',
                                        borderColor: formData.ativo ? 'success.dark' : 'divider',
                                        bgcolor: formData.ativo ? alpha('#4caf50', 0.06) : 'transparent',
                                        transition: 'all 0.2s'
                                    }}>
                                        <Box>
                                            <Typography variant="body2" fontWeight={600}>
                                                Maquinário ativo?
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {formData.ativo ? 'Disponível para apontamentos' : 'Indisponível — não aparecerá em novos apontamentos'}
                                            </Typography>
                                        </Box>
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={!!formData.ativo}
                                                    onChange={e => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                                                    color="success"
                                                />
                                            }
                                            label={formData.ativo ? 'Sim' : 'Não'}
                                            labelPlacement="start"
                                            sx={{ mr: 0, ml: 1 }}
                                        />
                                    </Box>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </DialogContent>

                {submitError && (
                    <Box sx={{ px: 3, pb: 1 }}>
                        <Alert severity="error" onClose={() => setSubmitError(null)}>{submitError}</Alert>
                    </Box>
                )}

                <DialogActions sx={{ p: 3, pt: 1, borderTop: (theme) => `1px solid ${theme.palette.divider}` }}>
                    <Button onClick={handleClose} sx={{ color: 'text.secondary' }} disabled={submitting}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        disabled={submitting}
                        startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : null}
                        sx={{ bgcolor: '#e65100', color: 'white', fontWeight: 600, '&:hover': { bgcolor: '#ef6c00' }, px: 4 }}
                    >
                        {submitting ? 'Salvando...' : editingId ? 'Salvar Alterações' : 'Cadastrar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* ── Checklist Modal ── */}
            <MachineChecklistModal
                open={checklistOpen}
                maquinaId={checklistMaquinaId}
                maquinaNome={checklistMaquinaNome}
                onClose={() => { setChecklistOpen(false); setChecklistMaquinaId(null); setChecklistMaquinaNome(''); }}
                onSaved={() => fetchMaquinarios({ forceRefresh: true })}
            />
        </Box>
    );
};

export default Cadastros;
