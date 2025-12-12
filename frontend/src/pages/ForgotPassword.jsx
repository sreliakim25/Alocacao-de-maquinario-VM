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
    CircularProgress
} from '@mui/material';
import { EmailOutlined, ArrowBackOutlined, CheckCircleOutline } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import logo from '../assets/logo.png';
import constructionBg from '../assets/construction-bg.jpg';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();
    const { requestPasswordReset, error, loading, clearError } = useAuthStore();

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();

        const result = await requestPasswordReset(email);
        if (result.success) {
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
                        <CheckCircleOutline sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
                            Email Enviado!
                        </Typography>
                        <Typography variant="body1" color="text.secondary" paragraph>
                            Se o email <strong>{email}</strong> estiver cadastrado, você receberá instruções para redefinir sua senha.
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Verifique sua caixa de entrada e também a pasta de spam.
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
            <Container maxWidth="sm" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
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
                                Recuperar Senha
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Digite seu email para receber instruções de recuperação
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
                            <Stack spacing={3}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                    disabled={loading}
                                    placeholder="seu@email.com"
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <EmailOutlined />}
                                    disabled={loading}
                                    sx={{ py: 1.5 }}
                                >
                                    {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
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

export default ForgotPassword;
