import { useState, useEffect } from 'react';
import { Snackbar, Button, Box, Typography, IconButton } from '@mui/material';
import { GetApp, Close, SystemUpdate } from '@mui/icons-material';
import { useRegisterSW } from 'virtual:pwa-register/react';

// ── Prompt de instalação (Adicionar à tela inicial) ──────────────────────────
export function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState(null);
    const [open, setOpen] = useState(false);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setOpen(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            setDeferredPrompt(null);
            setOpen(false);
        }
    };

    const handleClose = () => {
        setOpen(false);
        // Não mostra de novo por 7 dias
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    // Verificar se o usuário já dispensou recentemente
    useEffect(() => {
        const dismissed = localStorage.getItem('pwa-install-dismissed');
        if (dismissed) {
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            if (Date.now() - Number(dismissed) < sevenDays) {
                setOpen(false);
            }
        }
    }, []);

    return (
        <Snackbar
            open={open}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            sx={{ bottom: { xs: 80, sm: 24 } }}
        >
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                bgcolor: '#2a2a2a', border: '1px solid rgba(217,164,65,0.3)',
                borderRadius: 2, px: 2, py: 1.5, boxShadow: 8,
                maxWidth: 360,
            }}>
                <GetApp sx={{ color: '#D9A441', flexShrink: 0 }} />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                        Instalar aplicativo
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Adicione à tela inicial para acesso rápido
                    </Typography>
                </Box>
                <Button
                    size="small"
                    onClick={handleInstall}
                    sx={{ bgcolor: '#D9A441', color: '#000', fontWeight: 700, whiteSpace: 'nowrap',
                        '&:hover': { bgcolor: '#B8872E' }, flexShrink: 0 }}
                >
                    Instalar
                </Button>
                <IconButton size="small" onClick={handleClose} sx={{ flexShrink: 0 }}>
                    <Close fontSize="small" />
                </IconButton>
            </Box>
        </Snackbar>
    );
}

// ── Prompt de atualização disponível ─────────────────────────────────────────
export function PWAUpdatePrompt() {
    const { needRefresh: [needRefresh], updateServiceWorker } = useRegisterSW();

    if (!needRefresh) return null;

    return (
        <Snackbar
            open={needRefresh}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            sx={{ bottom: { xs: 80, sm: 24 } }}
        >
            <Box sx={{
                display: 'flex', alignItems: 'center', gap: 1.5,
                bgcolor: '#2a2a2a', border: '1px solid rgba(33,150,243,0.3)',
                borderRadius: 2, px: 2, py: 1.5, boxShadow: 8,
                maxWidth: 360,
            }}>
                <SystemUpdate sx={{ color: '#2196f3', flexShrink: 0 }} />
                <Box sx={{ flex: 1 }}>
                    <Typography variant="body2" fontWeight={600}>
                        Atualização disponível
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        Uma nova versão do sistema está disponível
                    </Typography>
                </Box>
                <Button
                    size="small"
                    onClick={() => updateServiceWorker(true)}
                    sx={{ bgcolor: '#2196f3', color: '#fff', fontWeight: 700, whiteSpace: 'nowrap',
                        '&:hover': { bgcolor: '#1565c0' }, flexShrink: 0 }}
                >
                    Atualizar
                </Button>
            </Box>
        </Snackbar>
    );
}
