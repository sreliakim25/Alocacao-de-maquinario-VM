import {
    Box, Card, CardContent, Typography, Avatar, Button,
    TextField, Grid, Divider, IconButton, Alert, Stack,
    Chip, CircularProgress, Tooltip, alpha
} from '@mui/material';
import {
    PhotoCamera, Save, Lock, Person, AdminPanelSettings,
    Edit, Cancel, CheckCircle, Visibility, VisibilityOff,
    Security, Dashboard, Assignment, ListAlt, Construction,
    ManageAccounts, TableChart, CloudUpload, Block
} from '@mui/icons-material';
import { useState, useRef } from 'react';
import useAuthStore from '../store/authStore';
import { authAPI, usuariosAPI } from '../services/api';

const ROLE_LABELS = {
    'Desenvolvedor': 'Desenvolvedor',
    'Administrador': 'Administrador',
    'Gerente': 'Gerente',
    'Líder': 'Líder de Infraestrutura',
    'Lider': 'Líder de Infraestrutura',
    'Supervisor': 'Supervisor de Infraestrutura',
    'Suprimentos': 'Suprimentos',
    'Apontador': 'Apontador',
};

const ROLE_COLORS = {
    'Desenvolvedor': 'error',
    'Administrador': 'error',
    'Gerente': 'warning',
    'Líder': 'info',
    'Lider': 'info',
    'Supervisor': 'primary',
    'Suprimentos': 'secondary',
    'Apontador': 'default',
};

const ROLE_HIERARCHY = {
    'Desenvolvedor': 7, 'Administrador': 7,
    'Gerente': 6, 'Líder': 5, 'Lider': 5,
    'Supervisor': 4, 'Suprimentos': 3, 'Apontador': 2,
};

const PERMISSIONS_LIST = [
    { label: 'Dashboard', desc: 'Visualizar KPIs e métricas executivas', icon: Dashboard, minRole: 'Apontador' },
    { label: 'Criar Apontamentos', desc: 'Registrar novos apontamentos de maquinários', icon: Assignment, minRole: 'Apontador' },
    { label: 'Consultar Apontamentos', desc: 'Visualizar e filtrar lista de apontamentos', icon: ListAlt, minRole: 'Apontador' },
    { label: 'Visualizar Maquinários', desc: 'Acessar o cadastro de máquinas', icon: Construction, minRole: 'Suprimentos' },
    { label: 'Gerenciar Maquinários', desc: 'Cadastrar, editar e excluir maquinários', icon: Construction, minRole: 'Supervisor' },
    { label: 'Central de Cadastros', desc: 'Gerenciar UGBs, Vilas, Sub Etapas e Supervisores', icon: TableChart, minRole: 'Líder' },
    { label: 'Importar Planilhas', desc: 'Importar dados em massa via Excel/CSV', icon: CloudUpload, minRole: 'Gerente' },
    { label: 'Gerenciar Usuários', desc: 'Criar, editar e administrar contas de usuário', icon: ManageAccounts, minRole: 'Administrador' },
];

const Configuracoes = () => {
    const { user, login } = useAuthStore();
    const fileInputRef = useRef(null);

    // ── Perfil ──
    const [editMode, setEditMode] = useState(false);
    const [profileData, setProfileData] = useState({
        nome: user?.nome || user?.name || '',
        email: user?.email || '',
        telefone: user?.telefone || '',
    });
    const [previewUrl, setPreviewUrl] = useState(user?.foto_url || null);
    const [imageFile, setImageFile] = useState(null);
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileMsg, setProfileMsg] = useState(null); // { type, text }

    // ── Senha ──
    const [passwordData, setPasswordData] = useState({
        senhaAtual: '',
        novaSenha: '',
        confirmarSenha: '',
    });
    const [showPasswords, setShowPasswords] = useState({
        senhaAtual: false,
        novaSenha: false,
        confirmarSenha: false,
    });
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordMsg, setPasswordMsg] = useState(null); // { type, text }

    // ── Foto ──
    const handleImageClick = () => {
        if (editMode) fileInputRef.current?.click();
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 800 * 1024) {
            setProfileMsg({ type: 'error', text: 'Imagem muito grande. Use até 800KB.' });
            return;
        }
        if (!file.type.startsWith('image/')) {
            setProfileMsg({ type: 'error', text: 'Selecione um arquivo de imagem válido.' });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result);
            setImageFile(reader.result);
        };
        reader.readAsDataURL(file);
    };

    // ── Salvar Perfil ──
    const handleSaveProfile = async () => {
        if (!profileData.nome.trim()) {
            setProfileMsg({ type: 'error', text: 'Nome é obrigatório.' });
            return;
        }

        setSavingProfile(true);
        setProfileMsg(null);

        try {
            const payload = {
                nome: profileData.nome.trim(),
                email: profileData.email.trim(),
                telefone: profileData.telefone,
            };
            if (imageFile) payload.foto_url = imageFile;

            await usuariosAPI.update(user.id, payload);

            // Atualizar store local
            useAuthStore.setState(state => ({
                user: {
                    ...state.user,
                    name: payload.nome,
                    nome: payload.nome,
                    email: payload.email,
                    foto_url: imageFile || state.user?.foto_url,
                }
            }));

            setProfileMsg({ type: 'success', text: 'Perfil atualizado com sucesso!' });
            setEditMode(false);
            setImageFile(null);
        } catch (err) {
            setProfileMsg({ type: 'error', text: err.message || 'Erro ao salvar perfil.' });
        } finally {
            setSavingProfile(false);
        }
    };

    const handleCancelEdit = () => {
        setEditMode(false);
        setProfileData({
            nome: user?.nome || user?.name || '',
            email: user?.email || '',
            telefone: user?.telefone || '',
        });
        setPreviewUrl(user?.foto_url || null);
        setImageFile(null);
        setProfileMsg(null);
    };

    // ── Alterar Senha ──
    const toggleShowPassword = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const handleChangePassword = async () => {
        setPasswordMsg(null);

        if (!passwordData.senhaAtual) {
            setPasswordMsg({ type: 'error', text: 'Informe sua senha atual.' });
            return;
        }
        if (passwordData.novaSenha.length < 8) {
            setPasswordMsg({ type: 'error', text: 'A nova senha deve ter no mínimo 8 caracteres.' });
            return;
        }
        if (passwordData.novaSenha !== passwordData.confirmarSenha) {
            setPasswordMsg({ type: 'error', text: 'A nova senha e a confirmação não coincidem.' });
            return;
        }
        if (passwordData.senhaAtual === passwordData.novaSenha) {
            setPasswordMsg({ type: 'error', text: 'A nova senha deve ser diferente da atual.' });
            return;
        }

        setSavingPassword(true);
        try {
            await authAPI.changePassword(passwordData.senhaAtual, passwordData.novaSenha);
            setPasswordMsg({ type: 'success', text: 'Senha alterada com sucesso!' });
            setPasswordData({ senhaAtual: '', novaSenha: '', confirmarSenha: '' });
        } catch (err) {
            setPasswordMsg({ type: 'error', text: err.message || 'Erro ao alterar senha.' });
        } finally {
            setSavingPassword(false);
        }
    };

    const roleLabel = ROLE_LABELS[user?.role] || user?.role || 'Não definido';
    const roleColor = ROLE_COLORS[user?.role] || 'default';
    const displayName = user?.nome || user?.name || 'Usuário';
    const initials = displayName.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();

    return (
        <Box>
            <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>
                Configurações
            </Typography>

            <Grid container spacing={3}>
                {/* ── Coluna esquerda: Avatar + Info resumida ── */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            {/* Avatar clicável */}
                            <Tooltip title={editMode ? 'Clique para trocar a foto' : 'Ative edição para trocar a foto'}>
                                <Box
                                    sx={{
                                        position: 'relative',
                                        display: 'inline-block',
                                        mb: 2,
                                        cursor: editMode ? 'pointer' : 'default',
                                    }}
                                    onClick={handleImageClick}
                                >
                                    <Avatar
                                        src={previewUrl || undefined}
                                        sx={{
                                            width: 120,
                                            height: 120,
                                            bgcolor: 'secondary.main',
                                            color: '#000',
                                            fontSize: 40,
                                            fontWeight: 700,
                                            border: editMode ? '3px dashed' : '3px solid transparent',
                                            borderColor: editMode ? 'primary.main' : 'transparent',
                                            transition: 'border 0.2s',
                                        }}
                                    >
                                        {!previewUrl && initials}
                                    </Avatar>

                                    {/* Botão câmera */}
                                    <IconButton
                                        color="primary"
                                        component="label"
                                        size="small"
                                        sx={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: 0,
                                            bgcolor: 'background.paper',
                                            border: '2px solid',
                                            borderColor: 'divider',
                                            opacity: editMode ? 1 : 0.3,
                                            pointerEvents: editMode ? 'auto' : 'none',
                                            '&:hover': { bgcolor: 'background.paper' }
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <input
                                            ref={fileInputRef}
                                            hidden
                                            accept="image/jpeg,image/png,image/webp"
                                            type="file"
                                            onChange={handleImageChange}
                                        />
                                        <PhotoCamera fontSize="small" />
                                    </IconButton>
                                </Box>
                            </Tooltip>

                            {editMode && (
                                <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                                    Clique na foto para alterar (máx. 800KB)
                                </Typography>
                            )}

                            <Typography variant="h6" fontWeight="bold">
                                {displayName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {user?.email}
                            </Typography>

                            <Chip
                                icon={<AdminPanelSettings fontSize="small" />}
                                label={roleLabel}
                                color={roleColor}
                                size="small"
                                sx={{ mt: 1.5, fontWeight: 600 }}
                            />

                            <Divider sx={{ my: 2 }} />

                            {!editMode ? (
                                <Button
                                    variant="contained"
                                    startIcon={<Edit />}
                                    onClick={() => setEditMode(true)}
                                    fullWidth
                                >
                                    Editar Perfil
                                </Button>
                            ) : (
                                <Stack spacing={1}>
                                    <Button
                                        variant="contained"
                                        startIcon={savingProfile ? <CircularProgress size={18} color="inherit" /> : <Save />}
                                        onClick={handleSaveProfile}
                                        disabled={savingProfile}
                                        fullWidth
                                    >
                                        {savingProfile ? 'Salvando...' : 'Salvar Alterações'}
                                    </Button>
                                    <Button
                                        variant="outlined"
                                        startIcon={<Cancel />}
                                        onClick={handleCancelEdit}
                                        disabled={savingProfile}
                                        fullWidth
                                    >
                                        Cancelar
                                    </Button>
                                </Stack>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* ── Coluna direita ── */}
                <Grid item xs={12} md={8}>
                    <Stack spacing={3}>
                        {/* Informações Pessoais */}
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                    <Person sx={{ mr: 1, color: 'primary.main' }} />
                                    <Typography variant="h6" fontWeight="bold">
                                        Informações Pessoais
                                    </Typography>
                                </Box>

                                {profileMsg && (
                                    <Alert
                                        severity={profileMsg.type}
                                        sx={{ mb: 2 }}
                                        onClose={() => setProfileMsg(null)}
                                        icon={profileMsg.type === 'success' ? <CheckCircle /> : undefined}
                                    >
                                        {profileMsg.text}
                                    </Alert>
                                )}

                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Nome Completo"
                                            value={profileData.nome}
                                            onChange={e => setProfileData(p => ({ ...p, nome: e.target.value }))}
                                            disabled={!editMode}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Email"
                                            type="email"
                                            value={profileData.email}
                                            onChange={e => setProfileData(p => ({ ...p, email: e.target.value }))}
                                            disabled={!editMode}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            label="Telefone"
                                            value={profileData.telefone}
                                            onChange={e => setProfileData(p => ({ ...p, telefone: e.target.value }))}
                                            disabled={!editMode}
                                            placeholder="(00) 00000-0000"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        {/* Tipo de acesso — somente leitura */}
                                        <TextField
                                            fullWidth
                                            label="Tipo de Acesso"
                                            value={roleLabel}
                                            disabled
                                            InputProps={{
                                                endAdornment: (
                                                    <AdminPanelSettings sx={{ color: 'text.disabled', mr: 1 }} />
                                                )
                                            }}
                                            helperText="Definido pelo administrador"
                                        />
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>

                        {/* Alterar Senha */}
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                    <Lock sx={{ mr: 1, color: 'primary.main' }} />
                                    <Typography variant="h6" fontWeight="bold">
                                        Alterar Senha
                                    </Typography>
                                </Box>

                                {passwordMsg && (
                                    <Alert
                                        severity={passwordMsg.type}
                                        sx={{ mb: 2 }}
                                        onClose={() => setPasswordMsg(null)}
                                        icon={passwordMsg.type === 'success' ? <CheckCircle /> : undefined}
                                    >
                                        {passwordMsg.text}
                                    </Alert>
                                )}

                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <TextField
                                            fullWidth
                                            type={showPasswords.senhaAtual ? 'text' : 'password'}
                                            label="Senha Atual"
                                            value={passwordData.senhaAtual}
                                            onChange={e => setPasswordData(p => ({ ...p, senhaAtual: e.target.value }))}
                                            disabled={savingPassword}
                                            InputProps={{
                                                endAdornment: (
                                                    <IconButton size="small" onClick={() => toggleShowPassword('senhaAtual')}>
                                                        {showPasswords.senhaAtual ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                )
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type={showPasswords.novaSenha ? 'text' : 'password'}
                                            label="Nova Senha"
                                            value={passwordData.novaSenha}
                                            onChange={e => setPasswordData(p => ({ ...p, novaSenha: e.target.value }))}
                                            disabled={savingPassword}
                                            helperText="Mínimo 8 caracteres"
                                            InputProps={{
                                                endAdornment: (
                                                    <IconButton size="small" onClick={() => toggleShowPassword('novaSenha')}>
                                                        {showPasswords.novaSenha ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                )
                                            }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type={showPasswords.confirmarSenha ? 'text' : 'password'}
                                            label="Confirmar Nova Senha"
                                            value={passwordData.confirmarSenha}
                                            onChange={e => setPasswordData(p => ({ ...p, confirmarSenha: e.target.value }))}
                                            disabled={savingPassword}
                                            error={
                                                passwordData.confirmarSenha.length > 0 &&
                                                passwordData.novaSenha !== passwordData.confirmarSenha
                                            }
                                            helperText={
                                                passwordData.confirmarSenha.length > 0 &&
                                                passwordData.novaSenha !== passwordData.confirmarSenha
                                                    ? 'As senhas não coincidem'
                                                    : ''
                                            }
                                            InputProps={{
                                                endAdornment: (
                                                    <IconButton size="small" onClick={() => toggleShowPassword('confirmarSenha')}>
                                                        {showPasswords.confirmarSenha ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                )
                                            }}
                                        />
                                    </Grid>
                                </Grid>

                                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                                    <Button
                                        variant="contained"
                                        startIcon={savingPassword ? <CircularProgress size={18} color="inherit" /> : <Lock />}
                                        onClick={handleChangePassword}
                                        disabled={savingPassword || !passwordData.senhaAtual || !passwordData.novaSenha || !passwordData.confirmarSenha}
                                    >
                                        {savingPassword ? 'Alterando...' : 'Alterar Senha'}
                                    </Button>
                                </Box>
                            </CardContent>
                        </Card>
                        {/* Permissões do Acesso */}
                        <Card>
                            <CardContent>
                                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                    <Security sx={{ mr: 1, color: 'secondary.main' }} />
                                    <Typography variant="h6" fontWeight="bold">
                                        Permissões do seu Acesso
                                    </Typography>
                                </Box>
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                    Funcionalidades disponíveis para o nível <strong>{roleLabel}</strong>
                                </Typography>

                                <Grid container spacing={1.5}>
                                    {PERMISSIONS_LIST.map((perm) => {
                                        const userLevel = ROLE_HIERARCHY[user?.role] || 0;
                                        const requiredLevel = ROLE_HIERARCHY[perm.minRole] || 0;
                                        const allowed = userLevel >= requiredLevel;
                                        const Icon = perm.icon;
                                        return (
                                            <Grid item xs={12} sm={6} key={perm.label}>
                                                <Box
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 1.5,
                                                        p: 1.5,
                                                        borderRadius: 2,
                                                        border: 1,
                                                        borderColor: allowed ? alpha('#4caf50', 0.3) : 'divider',
                                                        bgcolor: allowed ? alpha('#4caf50', 0.05) : 'action.hover',
                                                        opacity: allowed ? 1 : 0.6,
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: 34,
                                                            height: 34,
                                                            borderRadius: 1.5,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            bgcolor: allowed ? alpha('#4caf50', 0.12) : alpha('#000', 0.06),
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        <Icon sx={{ fontSize: 18, color: allowed ? 'success.main' : 'text.disabled' }} />
                                                    </Box>
                                                    <Box sx={{ flex: 1, minWidth: 0 }}>
                                                        <Typography variant="body2" fontWeight={600} lineHeight={1.2}>
                                                            {perm.label}
                                                        </Typography>
                                                        <Typography variant="caption" color="text.secondary" display="block" noWrap>
                                                            {perm.desc}
                                                        </Typography>
                                                    </Box>
                                                    {allowed
                                                        ? <CheckCircle sx={{ fontSize: 18, color: 'success.main', flexShrink: 0 }} />
                                                        : <Block sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0 }} />
                                                    }
                                                </Box>
                                            </Grid>
                                        );
                                    })}
                                </Grid>
                            </CardContent>
                        </Card>
                    </Stack>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Configuracoes;
