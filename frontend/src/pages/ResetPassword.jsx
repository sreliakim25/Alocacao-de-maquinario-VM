import { useState, useEffect } from 'react';
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
import { LockResetOutlined, ArrowBackOutlined } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import { authAPI } from '../services/api';
import logo from '../assets/logo.png';
import constructionBg from '../assets/construction-bg.jpg';

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();

    const [passwords, setPasswords] = useState({
        password: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!token) {
            setError('Token de recuperação inválido ou não fornecido.');
        }
    }, [token]);

    const validate = () => {
        if (passwords.password.length < 8) return 'A senha deve ter no mínimo 8 caracteres';
        if (passwords.password !== passwords.confirmPassword) return 'As senhas não coincidem';
        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await authAPI.resetPassword(token, passwords.password);
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Erro ao redefinir senha. O link pode ter expirado.');
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
                        <Typography variant="h5" gutterBottom sx={{ color: 'success.main', mb: 2 }}>
                            🔒 Senha Alterada!
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Sua senha foi atualizada com sucesso. Você já pode fazer login com a nova senha.
                        </Typography>
                        <Button
                            variant="contained"
                            fullWidth
                            onClick={() => navigate('/login')}
                            sx={{ mt: 2 }}
                        >
                            Ir para Login
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
                            Redefinir Senha
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Crie uma nova senha segura para sua conta
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
                            label="Nova Senha"
                            type="password"
                            value={passwords.password}
                            onChange={(e) => setPasswords({ ...passwords, password: e.target.value })}
                            required
                            disabled={loading || !token}
                            sx={{ mb: 2 }}
                            helperText="Mínimo 8 caracteres"
                        />
                        <TextField
                            fullWidth
                            label="Confirmar Nova Senha"
                            type="password"
                            value={passwords.confirmPassword}
                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                            required
                            disabled={loading || !token}
                            sx={{ mb: 3 }}
                        />

                        <Button
                            type="submit"
                            variant="contained"
                            fullWidth
                            size="large"
                            disabled={loading || !token}
                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockResetOutlined />}
                            sx={{ mb: 2 }}
                        >
                            {loading ? 'Atualizando...' : 'Alterar Senha'}
                        </Button>

                        <Button
                            fullWidth
                            variant="text"
                            startIcon={<ArrowBackOutlined />}
                            onClick={() => navigate('/login')}
                            disabled={loading}
                            sx={{ color: 'text.secondary' }}
                        >
                            Cancelar
                        </Button>
                    </form>
                </Paper>
            </Container>
        </Box>
    );
};

export default ResetPassword;
