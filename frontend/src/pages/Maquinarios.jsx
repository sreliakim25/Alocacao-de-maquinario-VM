import {
    Box,
    Typography,
    Paper,
    Button,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    IconButton,
    Card,
    CardContent,
    Grid,
    alpha,
    MenuItem,
    InputAdornment,
    Avatar
} from '@mui/material';
import {
    Add,
    ArrowBack,
    Close,
    Construction,
    Person,
    Business,
    Delete,
    Edit,
    Badge,
    PhotoCamera,
    DirectionsCar,
    Category,
    Fingerprint,
    Work
} from '@mui/icons-material';
import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import useMaquinarioStore from '../store/maquinarioStore';

const TiposMaquinas = ['Retroescavadeira', 'Pá Carregadeira', 'Caminhão Pipa', 'Escavadeira Hidráulica', 'Motoniveladora', 'Rolo Compactador', 'Caminhão Caçamba'];
const Operadores = [
    { id: '1', nome: 'Carlos Silva' },
    { id: '2', nome: 'João Santos' },
    { id: '3', nome: 'Maria Oliveira' },
    { id: '4', nome: 'Pedro Lima' }
];
const Setores = ['UDE', 'Infraestrutura'];

const Cadastros = () => {
    const navigate = useNavigate();
    const { maquinarios, addMaquinario, removeMaquinario, updateMaquinario } = useMaquinarioStore();

    const [open, setOpen] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const fileInputRef = useRef(null);

    const [formData, setFormData] = useState({
        nome: '',
        tipo: '',
        operadorId: '',
        operadorNome: '',
        fornecedor: '',
        placa: '',
        setor: '',
        foto: null
    });

    const handleOpen = (item = null) => {
        if (item) {
            setEditingId(item.id);
            setFormData(item);
        } else {
            setEditingId(null);
            setFormData({
                nome: '',
                tipo: '',
                operadorId: '',
                operadorNome: '',
                fornecedor: '',
                placa: '',
                setor: '',
                foto: null
            });
        }
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData({ ...formData, foto: reader.result });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (editingId) {
            updateMaquinario(editingId, formData);
        } else {
            addMaquinario(formData);
        }
        handleClose();
    };

    return (
        <Box>
            {/* Header Navigation */}
            <Button
                startIcon={<ArrowBack />}
                onClick={() => navigate('/')}
                sx={{ mb: 3, color: 'text.secondary', '&:hover': { color: 'primary.main' } }}
            >
                Voltar
            </Button>

            <Box
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 4
                }}
            >
                <Box>
                    <Typography variant="h4" fontWeight="bold" gutterBottom>
                        Cadastro de Maquinários
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        Gerencie os maquinários cadastrados
                    </Typography>
                </Box>
                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<Add />}
                    onClick={() => handleOpen()}
                    sx={{
                        bgcolor: '#D9A441',
                        color: '#000',
                        fontWeight: 'bold',
                        '&:hover': { bgcolor: '#B8872E' }
                    }}
                >
                    Novo Maquinário
                </Button>
            </Box>

            {/* Grid de Maquinários */}
            <Grid container spacing={3}>
                {maquinarios.map((maq) => (
                    <Grid item xs={12} sm={6} md={4} key={maq.id}>
                        <Card
                            sx={{
                                position: 'relative',
                                transition: 'all 0.2s',
                                '&:hover': {
                                    transform: 'translateY(-4px)',
                                    boxShadow: 8
                                }
                            }}
                        >
                            {/* Card Media / Header with Photo */}
                            <Box
                                sx={{
                                    height: 140,
                                    bgcolor: 'background.paper',
                                    position: 'relative',
                                    backgroundImage: maq.foto ? `url(${maq.foto})` : 'none',
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}
                            >
                                {!maq.foto && (
                                    <Construction sx={{ fontSize: 48, color: 'text.disabled', opacity: 0.3 }} />
                                )}
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        top: 10,
                                        right: 10,
                                        display: 'flex',
                                        gap: 1
                                    }}
                                >
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleOpen(maq);
                                        }}
                                        sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                                    >
                                        <Edit fontSize="small" />
                                    </IconButton>
                                    <IconButton
                                        size="small"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            removeMaquinario(maq.id);
                                        }}
                                        sx={{ bgcolor: 'rgba(0,0,0,0.5)', color: '#ff5252', '&:hover': { bgcolor: 'rgba(0,0,0,0.7)' } }}
                                    >
                                        <Delete fontSize="small" />
                                    </IconButton>
                                </Box>
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        bottom: 10,
                                        left: 10,
                                        bgcolor: 'rgba(0,0,0,0.6)',
                                        px: 1,
                                        py: 0.5,
                                        borderRadius: 1,
                                        backdropFilter: 'blur(4px)'
                                    }}
                                >
                                    <Typography variant="caption" color="white" fontWeight="bold">
                                        {maq.placa || 'Sem Placa'}
                                    </Typography>
                                </Box>
                            </Box>

                            <CardContent sx={{ pt: 2.5 }}>
                                <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
                                    <Typography variant="h6" fontWeight="bold" lineHeight={1.2}>
                                        {maq.nome}
                                    </Typography>
                                    <Typography variant="caption" sx={{ bgcolor: 'rgba(255,255,255,0.05)', px: 1, py: 0.5, borderRadius: 1 }}>
                                        {maq.tipo}
                                    </Typography>
                                </Box>

                                <Stack spacing={1.5} mt={2}>
                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <Person sx={{ fontSize: 18, color: '#D9A441' }} />
                                        <Box>
                                            <Typography variant="caption" color="text.secondary" display="block">Operador Padrão</Typography>
                                            <Typography variant="body2" fontWeight="500">{maq.operador || 'Não definido'}</Typography>
                                        </Box>
                                    </Box>

                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <Business sx={{ fontSize: 18, color: 'text.secondary' }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {maq.fornecedor}
                                        </Typography>
                                    </Box>

                                    <Box display="flex" alignItems="center" gap={1.5}>
                                        <Work sx={{ fontSize: 18, color: 'text.secondary' }} />
                                        <Typography variant="body2" color="text.secondary">
                                            {maq.setor || 'Sem setor'}
                                        </Typography>
                                    </Box>
                                </Stack>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            {/* Modal de Cadastro/Edição */}
            <Dialog
                open={open}
                onClose={handleClose}
                maxWidth="md"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 2,
                        bgcolor: '#1a1a1a',
                        backgroundImage: 'none',
                        border: '1px solid rgba(255,255,255,0.08)'
                    }
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 3, pb: 2, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
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
                    <IconButton onClick={handleClose}>
                        <Close />
                    </IconButton>
                </Box>

                <DialogContent sx={{ px: 3, pb: 3, pt: 3 }}>
                    <Grid container spacing={3}>
                        {/* Coluna da Foto */}
                        <Grid item xs={12} md={4}>
                            <Box
                                sx={{
                                    height: '100%',
                                    minHeight: 250,
                                    border: '2px dashed rgba(255,255,255,0.1)',
                                    borderRadius: 2,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    overflow: 'hidden',
                                    position: 'relative',
                                    transition: 'border-color 0.2s',
                                    '&:hover': {
                                        borderColor: '#D9A441',
                                        bgcolor: alpha('#D9A441', 0.02)
                                    }
                                }}
                                onClick={() => fileInputRef.current.click()}
                            >
                                {formData.foto ? (
                                    <Box
                                        component="img"
                                        src={formData.foto}
                                        sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    />
                                ) : (
                                    <>
                                        <PhotoCamera sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                                        <Typography variant="body2" color="text.secondary" align="center">
                                            Arraste uma foto ou<br />
                                            <strong>clique para tirar</strong>
                                        </Typography>
                                    </>
                                )}
                                <input
                                    type="file"
                                    hidden
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={handlePhotoUpload}
                                />
                            </Box>
                        </Grid>

                        {/* Coluna do Formulário */}
                        <Grid item xs={12} md={8}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={8}>
                                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>Nome do Maquinário</Typography>
                                    <TextField
                                        fullWidth
                                        name="nome"
                                        placeholder="Ex: Retro-05, PC-01"
                                        value={formData.nome}
                                        onChange={handleChange}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><Construction fontSize="small" /></InputAdornment>
                                        }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>Placa</Typography>
                                    <TextField
                                        fullWidth
                                        name="placa"
                                        placeholder="ABC-1234"
                                        value={formData.placa}
                                        onChange={handleChange}
                                        InputProps={{
                                            startAdornment: <InputAdornment position="start"><DirectionsCar fontSize="small" /></InputAdornment>
                                        }}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>Tipo de Maquinário</Typography>
                                    <TextField
                                        select
                                        fullWidth
                                        name="tipo"
                                        value={formData.tipo}
                                        onChange={handleChange}
                                    >
                                        {TiposMaquinas.map((tipo) => (
                                            <MenuItem key={tipo} value={tipo}>{tipo}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>Fornecedor</Typography>
                                    <TextField
                                        fullWidth
                                        name="fornecedor"
                                        placeholder="Nome do fornecedor"
                                        value={formData.fornecedor}
                                        onChange={handleChange}
                                    />
                                </Grid>

                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>Operador Padrão</Typography>
                                    <TextField
                                        fullWidth
                                        name="operador"
                                        placeholder="Nome do operador"
                                        value={formData.operador}
                                        onChange={handleChange}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600 }}>Setor</Typography>
                                    <TextField
                                        select
                                        fullWidth
                                        name="setor"
                                        value={formData.setor}
                                        onChange={handleChange}
                                    >
                                        {Setores.map((setor) => (
                                            <MenuItem key={setor} value={setor}>{setor}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Grid>
                </DialogContent>

                <DialogActions sx={{ p: 3, pt: 0, borderTop: '1px solid rgba(255,255,255,0.05)', mt: 2 }}>
                    <Button onClick={handleClose} size="large" sx={{ color: 'text.secondary' }}>
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        variant="contained"
                        size="large"
                        sx={{
                            bgcolor: '#e65100',
                            color: 'white',
                            fontWeight: 600,
                            '&:hover': { bgcolor: '#ef6c00' },
                            px: 4
                        }}
                    >
                        {editingId ? 'Salvar Alterações' : 'Cadastrar'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default Cadastros;
