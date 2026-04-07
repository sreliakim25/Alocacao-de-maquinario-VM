import { useState } from 'react';
import {
    Container, Box, TextField, Button, Typography, Stack,
    Alert, Paper, alpha, Link, CircularProgress,
    Select, MenuItem, InputLabel, FormControl, Divider, Chip
} from '@mui/material';
import {
    PersonAddOutlined, ArrowBackOutlined, BadgeOutlined,
    BusinessOutlined, CheckCircleOutlined, HourglassEmptyOutlined
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import logo from '../assets/logo.png';
import constructionBg from '../assets/construction-bg.jpg';

// Mapeamento: label exibido → valor salvo no sistema
const ROLE_OPTIONS = [
    {
        value: 'Supervisor',
        label: 'Supervisor de Infraestrutura',
        description: 'Aprova apontamentos e acompanha obras'
    },
    {
        value: 'Líder',
        label: 'Líder de Infraestrutura',
        description: 'Libera apontamentos e gerencia equipe'
    },
    {
        value: 'Gerente',
        label: 'Gerente',
        description: 'Acesso gerencial ao sistema'
    },
    {
        value: 'Suprimentos',
        label: 'Suprimentos',
        description: 'Gerencia e acompanha suprimentos'
    },
    {
        value: 'Apontador',
        label: 'Apontador',
        description: 'Registra e gerencia apontamentos de maquinários'
    },
];

// Componente compartilhado de background
const AuthBackground = ({ children }) => (
    <Box
        sx={{
            minHeight: '100vh',
            display: 'flex',
            position: 'relative',
            backgroundImage: `url(${constructionBg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            '&::before': {
                content: '""',
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundColor: 'rgba(0,0,0,0.65)',
                backdropFilter: 'blur(4px)',
                WebkitBackdropFilter: 'blur(4px)',
            },
            '&::after': {
                content: '""',
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(192,72,72,0.1) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(217,164,65,0.1) 0%, transparent 50%)',
                pointerEvents: 'none',
            }
        }}
    >
        {children}
    </Box>
);

const Register = () => {
    const navigate = useNavigate();
    const { register, error, loading, clearError } = useAuthStore();

    const [formData, setFormData] = useState({
        nome: '',
        email: '',
        nivel_acesso: '',
        conta_id: '',
    });
    const [localError, setLocalError] = useState(null);
    const [success, setSuccess] = useState(false);

    const UGB_OPTIONS = ['CA.01', 'CA.02', 'GA', 'IG', 'JB', 'SC', 'SL'];

    const handleChange = (e) => {
        clearError();
        setLocalError(null);
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const validate = () => {
        if (!formData.nome.trim()) return 'Informe seu nome completo';
        if (formData.nome.trim().split(' ').length < 2) return 'Informe nome e sobrenome';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) return 'Informe um email válido';
        if (!formData.nivel_acesso) return 'Selecione o tipo de acesso';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();
        setLocalError(null);

        const validationError = validate();
        if (validationError) {
            setLocalError(validationError);
            return;
        }

        const success = await register({
            nome: formData.nome.trim(),
            email: formData.email.toLowerCase().trim(),
            nivel_acesso: formData.nivel_acesso,
            conta_id: formData.conta_id || null,
        });

        if (success) {
            setSuccess(true);
        }
    };

    const displayError = localError || error;

    // Tela de sucesso
    if (success) {
        return (
            <AuthBackground>
                <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, py: 4 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 5,
                            width: '100%',
                            backgroundColor: alpha('#1a1a1a', 0.85),
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 3,
                            textAlign: 'center'
                        }}
                    >
                        <Stack spacing={3} alignItems="center">
                            <Box
                                sx={{
                                    width: 72, height: 72,
                                    borderRadius: '50%',
                                    backgroundColor: alpha('#4caf50', 0.15),
                                    border: '2px solid #4caf50',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}
                            >
                                <HourglassEmptyOutlined sx={{ fontSize: 36, color: '#4caf50' }} />
                            </Box>

                            <Typography variant="h5" fontWeight={700} sx={{ color: '#4caf50' }}>
                                Solicitação Enviada!
                            </Typography>

                            <Typography variant="body1" color="text.secondary">
                                Seu cadastro foi recebido com sucesso.
                            </Typography>

                            <Alert
                                severity="info"
                                icon={<CheckCircleOutlined />}
                                sx={{ width: '100%', textAlign: 'left' }}
                            >
                                <strong>O que acontece agora?</strong>
                                <Box component="ol" sx={{ mt: 1, mb: 0, pl: 2 }}>
                                    <li>Um administrador irá analisar sua solicitação</li>
                                    <li>Você receberá um email com sua senha provisória quando aprovado</li>
                                    <li>Acesse o sistema e altere sua senha nas Configurações</li>
                                </Box>
                            </Alert>

                            <Typography variant="body2" color="text.secondary">
                                Verifique também a pasta de <strong>spam</strong> do seu email.
                            </Typography>

                            <Button
                                variant="contained"
                                fullWidth
                                size="large"
                                onClick={() => navigate('/login')}
                                sx={{ py: 1.5 }}
                            >
                                Voltar para Login
                            </Button>
                        </Stack>
                    </Paper>
                </Container>
            </AuthBackground>
        );
    }

    return (
        <AuthBackground>
            <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, py: 4 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 5,
                        width: '100%',
                        backgroundColor: alpha('#1a1a1a', 0.85),
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 3,
                    }}
                >
                    <Stack spacing={4}>
                        {/* Logo e Título */}
                        <Box textAlign="center">
                            <Box
                                component="img"
                                src={logo}
                                alt="Logo"
                                sx={{ height: 65, mb: 2.5, filter: 'brightness(1.1)' }}
                            />
                            <Typography
                                variant="h4"
                                gutterBottom
                                sx={{
                                    background: 'linear-gradient(135deg, #D9A441 0%, #E5B854 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontWeight: 700,
                                }}
                            >
                                Solicitar Acesso
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Preencha os dados abaixo. O administrador irá liberar seu acesso e você receberá as credenciais por email.
                            </Typography>
                        </Box>

                        {/* Erro */}
                        {displayError && (
                            <Alert severity="error" onClose={() => { clearError(); setLocalError(null); }}>
                                {displayError}
                            </Alert>
                        )}

                        {/* Formulário */}
                        <form onSubmit={handleSubmit}>
                            <Stack spacing={2.5}>
                                <Divider>
                                    <Chip label="Dados Pessoais" size="small" icon={<BadgeOutlined />} />
                                </Divider>

                                <TextField
                                    fullWidth
                                    label="Nome Completo"
                                    name="nome"
                                    value={formData.nome}
                                    onChange={handleChange}
                                    required
                                    autoFocus
                                    disabled={loading}
                                    placeholder="Ex: João Silva Santos"
                                    helperText="Informe nome e sobrenome"
                                />

                                <TextField
                                    fullWidth
                                    label="Email Corporativo"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                    placeholder="seu.email@empresa.com.br"
                                />

                                <Divider>
                                    <Chip label="Perfil de Acesso" size="small" icon={<BusinessOutlined />} />
                                </Divider>

                                <FormControl fullWidth required disabled={loading}>
                                    <InputLabel>Tipo de Acesso Solicitado *</InputLabel>
                                    <Select
                                        name="nivel_acesso"
                                        value={formData.nivel_acesso}
                                        label="Tipo de Acesso Solicitado *"
                                        onChange={handleChange}
                                    >
                                        {ROLE_OPTIONS.map(opt => (
                                            <MenuItem key={opt.value} value={opt.value}>
                                                <Box>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {opt.label}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {opt.description}
                                                    </Typography>
                                                </Box>
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <FormControl fullWidth disabled={loading}>
                                    <InputLabel>UGB</InputLabel>
                                    <Select
                                        name="conta_id"
                                        value={formData.conta_id}
                                        label="UGB"
                                        onChange={handleChange}
                                    >
                                        <MenuItem value="">
                                            <em>Não sei / Acesso Geral</em>
                                        </MenuItem>
                                        {UGB_OPTIONS.map(ugb => (
                                            <MenuItem key={ugb} value={ugb}>
                                                {ugb}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                <Alert severity="info" sx={{ mt: 1 }}>
                                    Você <strong>não precisa definir uma senha agora</strong>. O administrador irá liberar seu acesso e você receberá sua senha provisória por email.
                                </Alert>

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PersonAddOutlined />}
                                    disabled={loading}
                                    sx={{ py: 1.5, mt: 1 }}
                                >
                                    {loading ? 'Enviando solicitação...' : 'Solicitar Acesso'}
                                </Button>

                                <Button
                                    variant="outlined"
                                    startIcon={<ArrowBackOutlined />}
                                    onClick={() => navigate('/login')}
                                    disabled={loading}
                                    fullWidth
                                >
                                    Voltar para Login
                                </Button>

                                <Box sx={{ textAlign: 'center' }}>
                                    <Typography variant="caption" color="text.secondary">
                                        Já tem uma conta?{' '}
                                        <Link
                                            onClick={() => navigate('/login')}
                                            sx={{ cursor: 'pointer', color: 'primary.main' }}
                                        >
                                            Fazer Login
                                        </Link>
                                    </Typography>
                                </Box>
                            </Stack>
                        </form>
                    </Stack>
                </Paper>
            </Container>
        </AuthBackground>
    );
};

export default Register;
