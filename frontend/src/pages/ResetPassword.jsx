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
import { LockResetOutlined, CheckCircleOutline } from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import logo from '../assets/logo.png';
import constructionBg from '../assets/construction-bg.jpg';

const ResetPassword = () => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [success, setSuccess] = useState(false);
    const [validationError, setValidationError] = useState('');
    const navigate = useNavigate();
    const { token } = useParams();
    const { resetPassword, error, loading, clearError } = useAuthStore();

    const validatePassword = () => {
        setValidationError('');

        if (newPassword.length < 8) {
            setValidationError('A senha deve ter no mínimo 8 caracteres');
            return false;
        }

        if (!/[A-Za-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
            setValidationError('A senha deve conter letras e números');
            return false;
        }

        if (newPassword !== confirmPassword) {
            setValidationError('As senhas não coincidem');
            return false;
        }

        return true;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearError();

        if (!validatePassword()) {
            return;
        }

        const success = await resetPassword(token, newPassword);
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
                        <CheckCircleOutline sx={{ fontSize: 80, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h4" gutterBottom sx={{ color: 'primary.main' }}>
                            Senha Redefinida!
                        </Typography>
                        <Typography variant="body1" color="text.secondary" paragraph>
                            Sua senha foi alterada com sucesso.
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            Você já pode fazer login com sua nova senha.
                        </Typography>
                        <Button
                            variant="contained"
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
                                Redefinir Senha
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Digite sua nova senha
                            </Typography>
                        </Box>

                        {/* Mensagens de erro */}
                        {(error || validationError) && (
                            <Alert severity="error" onClose={() => { clearError(); setValidationError(''); }}>
                                {error || validationError}
                            </Alert>
                        )}

                        {/* Formulário */}
                        <form onSubmit={handleSubmit}>
                            <Stack spacing={3}>
                                <TextField
                                    fullWidth
                                    label="Nova Senha"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    required
                                    autoFocus
                                    disabled={loading}
                                    helperText="Mínimo 8 caracteres, com letras e números"
                                />

                                <TextField
                                    fullWidth
                                    label="Confirmar Nova Senha"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    disabled={loading}
                                />

                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <LockResetOutlined />}
                                    disabled={loading}
                                    sx={{ py: 1.5 }}
                                >
                                    {loading ? 'Redefinindo...' : 'Redefinir Senha'}
                                </Button>
                            </Stack>
                        </form>
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
};

export default ResetPassword;
