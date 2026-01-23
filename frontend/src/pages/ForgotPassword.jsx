import { useState } from 'react';
import {
    Container,
    Box,
    TextField,
    Button,
    Typography,
    Paper,
    alpha,
    Alert,
    CircularProgress
} from '@mui/material';
import { ArrowBackOutlined, SendOutlined } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import logo from '../assets/logo.png';
import constructionBg from '../assets/construction-bg.jpg';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            await authAPI.forgotPassword(email);
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Erro ao solicitar recuperação. Tente novamente.');
        } finally {
            setLoading(false);
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
                <Container maxWidth="xs" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 4,
                            width: '100%',
                            backgroundColor: alpha('#1a1a1a', 0.8),
                            backdropFilter: 'blur(20px)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 3,
                            textAlign: 'center'
                        }}
                    >
                        <Typography variant="h5" gutterBottom sx={{ color: 'primary.main', mb: 2 }}>
                            📩 Email Enviado!
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Se o email <strong>{email}</strong> estiver cadastrado, você receberá um link para redefinir sua senha em instantes.
                        </Typography>
                        <Button
                            variant="contained"
                            fullWidth
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
            <Container maxWidth="xs" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
                <Paper
                    elevation={0}
                    sx={{
                        p: 4,
                        width: '100%',
                        backgroundColor: alpha('#1a1a1a', 0.8),
                        backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 3,
                    }}
                >
                    <Box textAlign="center" mb={3}>
                        <Box
                            component="img"
                            src={logo}
                            alt="Logo"
                            sx={{ height: 50, mb: 2 }}
                        />
                        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
                            Recuperar Senha
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Digite seu email para receber o link de redefinição
                        </Typography>
                    </Box>

                    {error && (
                        <Alert severity="error" sx={{ mb: 3 }}>
                            {error}
                        </Alert>
                    )}

                    <form onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            disabled={loading}
                            sx={{ mb: 3 }}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendOutlined />}
                            sx={{ mb: 2 }}
                        >
                            {loading ? 'Enviando...' : 'Enviar Link'}
                        </Button>

                        <Button
                            fullWidth
                            variant="text"
                            startIcon={<ArrowBackOutlined />}
                            onClick={() => navigate('/login')}
                            disabled={loading}
                            sx={{ color: 'text.secondary' }}
                        >
                            Voltar para Login
                        </Button>
                    </form>
                </Paper>
            </Container>
        </Box>
    );
};

export default ForgotPassword;
