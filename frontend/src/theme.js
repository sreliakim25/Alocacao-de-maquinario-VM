import { createTheme } from '@mui/material/styles';

const getTheme = (mode) => createTheme({
    palette: {
        mode,
        primary: {
            main: '#C04848', // Burgundy red from logo
            light: '#D96565',
            dark: '#8B3333',
            contrastText: '#fff',
        },
        secondary: {
            main: '#D9A441', // Gold from logo
            light: '#E5B854',
            dark: '#B8872E',
            contrastText: '#000',
        },
        success: {
            main: '#4caf50',
            light: '#81c784',
            dark: '#388e3c',
        },
        warning: {
            main: '#D9A441',
            light: '#E5B854',
            dark: '#B8872E',
        },
        error: {
            main: '#C04848',
            light: '#D96565',
            dark: '#8B3333',
        },
        background: {
            default: mode === 'dark' ? '#0a0a0a' : '#f5f5f5',
            paper: mode === 'dark' ? '#1a1a1a' : '#ffffff',
        },
        text: {
            primary: mode === 'dark' ? '#ffffff' : '#121212',
            secondary: mode === 'dark' ? '#b0b0b0' : '#424242',
        },
    },
    typography: {
        fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
        h1: {
            fontSize: '3rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
        },
        h2: {
            fontSize: '2.25rem',
            fontWeight: 700,
            letterSpacing: '-0.01em',
        },
        h3: {
            fontSize: '1.875rem',
            fontWeight: 600,
            letterSpacing: '-0.01em',
        },
        h4: {
            fontSize: '1.5rem',
            fontWeight: 600,
        },
        h5: {
            fontSize: '1.25rem',
            fontWeight: 600,
        },
        h6: {
            fontSize: '1rem',
            fontWeight: 600,
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
        },
    },
    spacing: 8,
    shape: {
        borderRadius: 12,
    },
    components: {
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: 8,
                    padding: '10px 24px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    boxShadow: 'none',
                    '&:hover': {
                        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                    },
                },
                containedPrimary: {
                    background: 'linear-gradient(135deg, #C04848 0%, #8B3333 100%)',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #D96565 0%, #C04848 100%)',
                    },
                },
                containedSecondary: {
                    background: 'linear-gradient(135deg, #D9A441 0%, #B8872E 100%)',
                    color: '#000',
                    '&:hover': {
                        background: 'linear-gradient(135deg, #E5B854 0%, #D9A441 100%)',
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: mode === 'dark' ? '#1a1a1a' : '#ffffff',
                    borderRadius: 12,
                    border: mode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                    boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                    backgroundColor: mode === 'dark' ? '#1a1a1a' : '#ffffff',
                },
            },
        },
        MuiTextField: {
            styleOverrides: {
                root: {
                    '& .MuiOutlinedInput-root': {
                        borderRadius: 8,
                        backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                        '&:hover': {
                            backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
                        },
                    },
                },
            },
        },
        MuiDrawer: {
            styleOverrides: {
                paper: {
                    backgroundColor: mode === 'dark' ? '#0f0f0f' : '#ffffff',
                    borderRight: mode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: mode === 'dark' ? '#0f0f0f' : '#ffffff',
                    color: mode === 'dark' ? '#ffffff' : '#121212',
                    borderBottom: mode === 'dark' ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.08)',
                    boxShadow: 'none',
                },
            },
        },
    },
});

export default getTheme;
