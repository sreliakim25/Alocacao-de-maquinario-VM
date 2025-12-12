import {
    Box,
    Card,
    CardContent,
    Typography,
    Avatar,
    Button,
    TextField,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Divider,
    IconButton,
    Alert
} from '@mui/material';
import {
    PhotoCamera,
    Save,
    Lock,
    Person,
    AdminPanelSettings,
    Edit
} from '@mui/icons-material';
import { useState } from 'react';
import useAuthStore from '../store/authStore';

const Configuracoes = () => {
    const { user } = useAuthStore();
    const [editMode, setEditMode] = useState(false);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        role: user?.role || 'apontador',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const roles = [
        { value: 'apontador', label: 'Apontador' },
        { value: 'supervisor', label: 'Supervisor' },
        { value: 'lider', label: 'Líder' },
        { value: 'suprimentos', label: 'Suprimentos' },
        { value: 'gerente', label: 'Gerente' },
        { value: 'desenvolvedor', label: 'Desenvolvedor' }
    ];

    const handleChange = (field) => (event) => {
        setFormData({ ...formData, [field]: event.target.value });
    };

    const handleSave = () => {
        // TODO: Implementar salvamento no backend
        console.log('Salvando configurações:', formData);
        setEditMode(false);
    };

    const handleImageUpload = (event) => {
        // TODO: Implementar upload de imagem
        const file = event.target.files[0];
        if (file) {
            console.log('Upload de imagem:', file);
        }
    };

    return (
        <Box>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h4" fontWeight="bold">
                    Configurações
                </Typography>
                {!editMode && (
                    <Button
                        variant="contained"
                        startIcon={<Edit />}
                        onClick={() => setEditMode(true)}
                    >
                        Editar Perfil
                    </Button>
                )}
            </Box>

            <Grid container spacing={3}>
                {/* Perfil do Usuário */}
                <Grid item xs={12} md={4}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center', py: 4 }}>
                            <Box sx={{ position: 'relative', display: 'inline-block', mb: 2 }}>
                                <Avatar
                                    sx={{
                                        width: 120,
                                        height: 120,
                                        bgcolor: 'secondary.main',
                                        color: '#000',
                                        fontSize: 48,
                                        fontWeight: 600
                                    }}
                                >
                                    {formData.name?.charAt(0) || 'U'}
                                </Avatar>
                                {editMode && (
                                    <IconButton
                                        color="primary"
                                        component="label"
                                        sx={{
                                            position: 'absolute',
                                            bottom: 0,
                                            right: 0,
                                            bgcolor: 'background.paper',
                                            '&:hover': { bgcolor: 'background.paper' }
                                        }}
                                    >
                                        <input
                                            hidden
                                            accept="image/*"
                                            type="file"
                                            onChange={handleImageUpload}
                                        />
                                        <PhotoCamera />
                                    </IconButton>
                                )}
                            </Box>
                            <Typography variant="h6" fontWeight="bold" gutterBottom>
                                {formData.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {formData.email}
                            </Typography>
                            <Box
                                sx={{
                                    mt: 2,
                                    px: 2,
                                    py: 1,
                                    borderRadius: 2,
                                    bgcolor: 'primary.main',
                                    color: 'primary.contrastText',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 1
                                }}
                            >
                                <AdminPanelSettings fontSize="small" />
                                <Typography variant="caption" fontWeight="bold" textTransform="uppercase">
                                    {roles.find(r => r.value === formData.role)?.label}
                                </Typography>
                            </Box>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Informações Pessoais */}
                <Grid item xs={12} md={8}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <Person sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6" fontWeight="bold">
                                    Informações Pessoais
                                </Typography>
                            </Box>

                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Nome Completo"
                                        value={formData.name}
                                        onChange={handleChange('name')}
                                        disabled={!editMode}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Email"
                                        value={formData.email}
                                        onChange={handleChange('email')}
                                        disabled={!editMode}
                                        type="email"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        fullWidth
                                        label="Telefone"
                                        value={formData.phone}
                                        onChange={handleChange('phone')}
                                        disabled={!editMode}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth disabled={!editMode}>
                                        <InputLabel>Tipo de Acesso</InputLabel>
                                        <Select
                                            value={formData.role}
                                            label="Tipo de Acesso"
                                            onChange={handleChange('role')}
                                        >
                                            {roles.map((role) => (
                                                <MenuItem key={role.value} value={role.value}>
                                                    {role.label}
                                                </MenuItem>
                                            ))}
                                        </Select>
                                    </FormControl>
                                </Grid>
                            </Grid>

                            {editMode && (
                                <>
                                    <Divider sx={{ my: 3 }} />

                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                        <Lock sx={{ mr: 1, color: 'primary.main' }} />
                                        <Typography variant="h6" fontWeight="bold">
                                            Alterar Senha
                                        </Typography>
                                    </Box>

                                    <Alert severity="info" sx={{ mb: 2 }}>
                                        Deixe em branco se não deseja alterar a senha
                                    </Alert>

                                    <Grid container spacing={2}>
                                        <Grid item xs={12}>
                                            <TextField
                                                fullWidth
                                                type="password"
                                                label="Senha Atual"
                                                value={formData.currentPassword}
                                                onChange={handleChange('currentPassword')}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                type="password"
                                                label="Nova Senha"
                                                value={formData.newPassword}
                                                onChange={handleChange('newPassword')}
                                            />
                                        </Grid>
                                        <Grid item xs={12} sm={6}>
                                            <TextField
                                                fullWidth
                                                type="password"
                                                label="Confirmar Nova Senha"
                                                value={formData.confirmPassword}
                                                onChange={handleChange('confirmPassword')}
                                            />
                                        </Grid>
                                    </Grid>

                                    <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                                        <Button
                                            variant="outlined"
                                            onClick={() => {
                                                setEditMode(false);
                                                setFormData({
                                                    ...formData,
                                                    currentPassword: '',
                                                    newPassword: '',
                                                    confirmPassword: ''
                                                });
                                            }}
                                        >
                                            Cancelar
                                        </Button>
                                        <Button
                                            variant="contained"
                                            startIcon={<Save />}
                                            onClick={handleSave}
                                        >
                                            Salvar Alterações
                                        </Button>
                                    </Box>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Permissões e Acessos */}
                <Grid item xs={12}>
                    <Card>
                        <CardContent>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                                <AdminPanelSettings sx={{ mr: 1, color: 'primary.main' }} />
                                <Typography variant="h6" fontWeight="bold">
                                    Permissões e Acessos
                                </Typography>
                            </Box>

                            <Alert severity="info">
                                <Typography variant="body2" fontWeight="bold" gutterBottom>
                                    Níveis de Acesso:
                                </Typography>
                                <Box component="ul" sx={{ mt: 1, mb: 0, pl: 2 }}>
                                    <li><strong>Apontador:</strong> Pode criar e visualizar apontamentos próprios</li>
                                    <li><strong>Supervisor:</strong> Pode aprovar e revisar apontamentos da equipe</li>
                                    <li><strong>Líder:</strong> Gerencia equipes e visualiza relatórios</li>
                                    <li><strong>Suprimentos:</strong> Acesso a dados de materiais e equipamentos</li>
                                    <li><strong>Gerente:</strong> Acesso completo a relatórios e dashboards</li>
                                    <li><strong>Desenvolvedor:</strong> Acesso total ao sistema (modo debug)</li>
                                </Box>
                            </Alert>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default Configuracoes;
