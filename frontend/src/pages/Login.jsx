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
    alpha
} from '@mui/material';
import { LoginOutlined, DeveloperMode, Construction } from '@mui/icons-material';
import useAuthStore from '../store/authStore';
import logo from '../assets/logo.png';
import constructionBg from '../assets/construction-bg.jpg';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, loginBypass, isDevelopmentBypass } = useAuthStore();
    const isDevelopment = import.meta.env.DEV;

    const handleLogin = (e) => {
        e.preventDefault();
        login({
            id: '1',
            name: 'Usuário Teste',
            email: email,
            role: 'admin'
        });
    };

    const handleBypass = () => {
        loginBypass();
    };

    return (
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
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.65)',
                    backdropFilter: 'blur(4px)',
                    WebkitBackdropFilter: 'blur(4px)',
                },
                '&::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(192, 72, 72, 0.12) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(217, 164, 65, 0.12) 0%, transparent 50%)',
                    pointerEvents: 'none',
                }
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
                                alt="DL Painéis Elétricos"
                                sx={{
                                    height: 80,
                                    mb: 3,
                                    filter: 'brightness(1.1)',
                                }}
                            />
                            <Typography
                                variant="h3"
                                component="h1"
                                gutterBottom
                                sx={{
                                    background: 'linear-gradient(135deg, #D9A441 0%, #E5B854 100%)',
                                    WebkitBackgroundClip: 'text',
                                    WebkitTextFillColor: 'transparent',
                                    fontWeight: 700,
                                    mb: 1,
                                }}
                            >
                                Apontamento de Maquinários
                            </Typography>
                            <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                                Sistema de Gestão de Maquinários
                            </Typography>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, color: 'text.secondary' }}>
                                <Construction sx={{ fontSize: 20 }} />
                                <Typography variant="body2">

                                </Typography>
                            </Box>
                        </Box>

                        {isDevelopmentBypass && (
                            <Alert
                                severity="warning"
                                icon={<DeveloperMode />}
                                sx={{
                                    backgroundColor: alpha('#D9A441', 0.1),
                                    border: '1px solid rgba(217, 164, 65, 0.3)',
                                }}
                            >
                                <strong>Modo Desenvolvimento</strong> - Bypass de autenticação ativo
                            </Alert>
                        )}

                        {/* Formulário */}
                        <form onSubmit={handleLogin}>
                            <Stack spacing={3}>
                                <TextField
                                    fullWidth
                                    label="Email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                    variant="outlined"
                                />
                                <TextField
                                    fullWidth
                                    label="Senha"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    variant="outlined"
                                />
                                <Button
                                    type="submit"
                                    variant="contained"
                                    size="large"
                                    fullWidth
                                    startIcon={<LoginOutlined />}
                                    sx={{
                                        py: 1.5,
                                        fontSize: '1rem',
                                    }}
                                >
                                    Entrar no Sistema
                                </Button>
                            </Stack>
                        </form>

                        {/* Bypass de Desenvolvimento */}
                        {isDevelopment && (
                            <Box sx={{ pt: 2, borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    size="large"
                                    fullWidth
                                    startIcon={<DeveloperMode />}
                                    onClick={handleBypass}
                                    sx={{
                                        py: 1.5,
                                        borderWidth: 2,
                                        '&:hover': {
                                            borderWidth: 2,
                                        }
                                    }}
                                >
                                    Bypass - Modo Desenvolvimento
                                </Button>
                                <Typography
                                    variant="caption"
                                    display="block"
                                    textAlign="center"
                                    sx={{ mt: 1.5 }}
                                    color="text.secondary"
                                >
                                    ⚡ Este botão só aparece em ambiente de desenvolvimento
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </Paper>
            </Container>
        </Box>
    );
};

export default Login;
