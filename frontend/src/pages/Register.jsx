import { useState } from 'react';
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    Stack,
    Alert,
    Paper,
    alpha,
    Link,
    CircularProgress,
    Checkbox,
    FormControlLabel
} from '@mui/material';
import { PersonAddOutlined, ArrowBackOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import logo from '../assets/logo.png';
import constructionBg from '../assets/construction-bg.jpg';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        telefone: '',
        password: '',
        confirmPassword: ''
    });
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const { register, error, loading, clearError } = useAuthStore();

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const validateForm = () => {
        clearError();

        if (formData.password.length < 8) {
            return 'A senha deve ter no mínimo 8 caracteres';
        }

        if (!/[A-Za-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
            return 'A senha deve conter letras e números';
        }

        if (formData.password !== formData.confirmPassword) {
            return 'As senhas não coincidem';
        }

        if (!agreedToTerms) {
            return 'Você deve aceitar os termos de uso';
        }

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const validationError = validateForm();
        if (validationError) {
            // Criar um erro temporário (em produção usaria setError do store)
            alert(validationError);
            return;
        }

        const success = await register(formData);
        if (success) {
            setSuccess(true);
        }
    };

    if (success) {
        return (
            <Box
                sx={{
                    minHeight: '100vh',
                    display: 'flex',
                    position: 'relative',
                    backgroundImage: `url(${constructionBg})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    '&::before': {
                        content: '""',
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.65)',
                        backdropFilter: 'blur(4px)',
                    },
                }}
            >
                <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 5,
                            backgroundColor: alpha('#1a1a1a', 0.8),
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 3,
                            textAlign: 'center'
                        }}
                    >
                        <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
                            ✅ Cadastro Realizado!
                        </Typography>
                        <Typography variant="body1" color="text.secondary" paragraph>
                            Seu cadastro foi enviado para análise. Um administrador irá revisar sua solicitação e ativar sua conta em breve.
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Você receberá um email quando sua conta for aprovada.
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => navigate('/login')}
                            sx={{ mt: 2 }}
                        >
                            Voltar para Login
                        </Button>
                    </Paper>
                </Container>
            </Box>
        );
    }

    return (
        <Box
            sx={{
                minHeight: '100vh',
                display: 'flex',
                position: 'relative',
                backgroundImage: `url(${constructionBg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(4px)',
                },
            }}
        >
            <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1, py: 4 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 5,
                        width: '100%',
                        backgroundColor: alpha('#1a1a1a', 0.8),
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
                                sx={{ height: 60, mb: 2 }}
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
                                Criar Nova Conta
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Preencha os dados abaixo para solicitar acesso
                            </Typography>
                        </Box>

                        {/* Mensagem de erro */}
                        {error && (
                            <Alert severity="error" onClose={clearError}>
                                {error}
                            </Alert>
                        )}

                        {/* Formulário */}
                        <form onSubmit={handleSubmit}>
                            <Stack spacing={2.5}>
                                <TextField
                                    fullWidth
                                    label="Nome Completo"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    autoFocus
                                    disabled={loading}
                                />
                                <TextField
                                    fullWidth
                                    label="Email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                />
                                <TextField
                                    fullWidth
                                    label="Telefone (opcional)"
                                    name="telefone"
                                    value={formData.telefone}
                                    onChange={handleChange}
                                    placeholder="(00) 00000-0000"
                                    disabled={loading}
                                />
                                <TextField
                                    fullWidth
                                    label="Senha"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    helperText="Mínimo 8 caracteres, com letras e números"
                                    disabled={loading}
                                />
                                <TextField
                                    fullWidth
                                    label="Confirmar Senha"
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    required
                                    disabled={loading}
                                />

                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={agreedToTerms}
                                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                                            disabled={loading}
                                        />
                                    }
                                    label={
                                        <Typography variant="body2" color="text.secondary">
                                            Concordo com os termos de uso e política de privacidade
                                        </Typography>
                                    }
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <PersonAddOutlined />}
                                    disabled={loading}
                                    sx={{ py: 1.5 }}
                                >
                                    {loading ? 'Cadastrando...' : 'Criar Conta'}
                                </Button>

                                <Button
                                    variant="outlined"
                                    startIcon={<ArrowBackOutlined />}
                                    onClick={() => navigate('/login')}
                                    disabled={loading}
                                >
                                    Voltar para Login
                                </Button>
                            </Stack>
                        </form>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
};

export default Register;
