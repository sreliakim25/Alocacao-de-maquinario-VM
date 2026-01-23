import { useEffect, useState } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    IconButton,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    TextField,
    Stack,
    Alert,
    Tooltip,
    CircularProgress,
    Grid
} from '@mui/material';
import {
    Edit as EditIcon,
    PersonOffOutlined,
    PersonOutlined,
    LockResetOutlined
} from '@mui/icons-material';
import { format } from 'date-fns';
import useUserStore from '../store/userStore';
import useAuthStore from '../store/authStore';
import { localizacoesAPI, usuariosAPI } from '../services/api';

const USER_ROLES = [
    'Apontador',
    'Supervisor',
    'Lider',
    'Líder',
    'Suprimentos',
    'Gerente',
    'Administrador',
    'Desenvolvedor'
];

const UserManagement = () => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    // Unified Edit State
    const [editData, setEditData] = useState({
        nome: '',
        email: '',
        telefone: '',
        role: '',
        conta_id: ''
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [resetPasswordDialog, setResetPasswordDialog] = useState(null);
    const [ugbs, setUgbs] = useState([]);
    const [loadingSave, setLoadingSave] = useState(false);

    const { users, loading, fetchUsers, toggleUserStatus, resetUserPassword } = useUserStore();
    const { user: currentUser } = useAuthStore();

    useEffect(() => {
        fetchUsers();
        loadUgbs();
    }, [fetchUsers]);

    const loadUgbs = async () => {
        try {
            const data = await localizacoesAPI.getUgbs();
            setUgbs(data);
        } catch (error) {
            console.error('Erro ao carregar UGBs:', error);
        }
    };

    const getUgbName = (contaId) => {
        if (!contaId) return '-';
        const ugb = ugbs.find(u => u.id === contaId);
        return ugb ? ugb.nome : 'ID: ' + contaId;
    };

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setEditData({
            nome: user.name || '',
            email: user.email || '',
            telefone: user.telefone || '',
            role: user.role || '',
            conta_id: user.conta_id || ''
        });
        setEditDialogOpen(true);
    };

    const handleSaveUser = async () => {
        if (!selectedUser) return;
        setLoadingSave(true);

        try {
            // 1. Update Profile Info (Name, Email, Phone)
            await usuariosAPI.update(selectedUser.id, {
                nome: editData.nome,
                email: editData.email,
                telefone: editData.telefone,
            });

            // 2. Update Role & UGB
            // Ensure conta_id is null if empty
            const contaIdToSend = editData.conta_id === '' ? null : editData.conta_id;
            await usuariosAPI.updateRole(selectedUser.id, editData.role, contaIdToSend);

            // 3. Update local store (simpler than complex reducers for now)
            await fetchUsers();

            setEditDialogOpen(false);
            setSelectedUser(null);
        } catch (error) {
            console.error('Erro ao salvar usuário:', error);
            alert('Erro ao salvar alterações: ' + (error.message || 'Erro desconhecido'));
        } finally {
            setLoadingSave(false);
        }
    };

    const handleToggleStatus = async (userId) => {
        await toggleUserStatus(userId);
        fetchUsers();
    };

    const handleResetPassword = async (userId) => {
        if (!window.confirm('Tem certeza que deseja resetar a senha deste usuário?')) return;

        const result = await resetUserPassword(userId);
        if (result.success) {
            setResetPasswordDialog(result.tempPassword);
        } else {
            alert('Erro ao resetar senha: ' + result.error);
        }
    };

    const getRoleColor = (role) => {
        const colors = {
            'Desenvolvedor': 'error',
            'Gerente': 'warning',
            'Líder': 'info',
            'Supervisor': 'primary',
            'Suprimentos': 'secondary',
            'Apontador': 'default'
        };
        return colors[role] || 'default';
    };

    const filteredUsers = (users || []).filter(user => {
        const userName = user.nome || user.name || '';
        const userEmail = user.email || '';
        const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            userEmail.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && user.ativo) ||
            (filterStatus === 'inactive' && !user.ativo);
        return matchesSearch && matchesStatus;
    });

    const pendingUsers = (users || []).filter(u => !u.ativo);

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Paper sx={{ p: 3 }}>
                <Stack spacing={3}>
                    {/* Header */}
                    <Box>
                        <Typography variant="h4" gutterBottom>
                            Gerenciamento de Usuários
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Gerencie permissões, dados e status dos usuários do sistema
                        </Typography>
                    </Box>

                    {/* Alerta de usuários pendentes */}
                    {pendingUsers.length > 0 && (
                        <Alert severity="info">
                            <strong>{pendingUsers.length}</strong> usuário(s) aguardando aprovação
                        </Alert>
                    )}

                    {/* Filtros */}
                    <Stack direction="row" spacing={2}>
                        <TextField
                            placeholder="Buscar por nome ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            size="small"
                            sx={{ flexGrow: 1 }}
                        />
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={filterStatus}
                                label="Status"
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <MenuItem value="all">Todos</MenuItem>
                                <MenuItem value="active">Ativos</MenuItem>
                                <MenuItem value="inactive">Inativos</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>

                    {/* Tabela */}
                    {loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Nome</TableCell>
                                        <TableCell>Email</TableCell>
                                        <TableCell>Telefone</TableCell>
                                        <TableCell>UGB / Conta</TableCell>
                                        <TableCell>Permissão</TableCell>
                                        <TableCell>Status</TableCell>
                                        <TableCell>Cadastrado em</TableCell>
                                        <TableCell align="right">Ações</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredUsers.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell>
                                                <Typography variant="body2" fontWeight={!user.ativo ? 'bold' : 'normal'}>
                                                    {user.name || user.nome}
                                                    {!user.ativo && (
                                                        <Chip
                                                            label="Pendente"
                                                            size="small"
                                                            color="warning"
                                                            sx={{ ml: 1 }}
                                                        />
                                                    )}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>{user.telefone || '-'}</TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {getUgbName(user.conta_id)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={user.role}
                                                    size="small"
                                                    color={getRoleColor(user.role)}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={user.ativo ? 'Ativo' : 'Inativo'}
                                                    size="small"
                                                    color={user.ativo ? 'success' : 'default'}
                                                    variant={user.ativo ? 'filled' : 'outlined'}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                {user.criado_em && !isNaN(new Date(user.criado_em).getTime())
                                                    ? format(new Date(user.criado_em), 'dd/MM/yyyy')
                                                    : '-'}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                                    <Tooltip title="Editar Usuário">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleEditClick(user)}
                                                            disabled={user.id === currentUser?.id}
                                                        >
                                                            <EditIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title={user.ativo ? 'Desativar' : 'Ativar'}>
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleToggleStatus(user.id)}
                                                            disabled={user.id === currentUser?.id}
                                                        >
                                                            {user.ativo ? (
                                                                <PersonOffOutlined fontSize="small" />
                                                            ) : (
                                                                <PersonOutlined fontSize="small" />
                                                            )}
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Resetar Senha">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleResetPassword(user.id)}
                                                        >
                                                            <LockResetOutlined fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={8} align="center">
                                                <Typography color="text.secondary" py={4}>
                                                    Nenhum usuário encontrado
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Stack>
            </Paper>

            {/* Dialog de Edição Completa */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Editar Usuário</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 1 }}>
                        <TextField
                            label="Nome Completo"
                            fullWidth
                            value={editData.nome}
                            onChange={(e) => setEditData({ ...editData, nome: e.target.value })}
                        />
                        <TextField
                            label="Email"
                            fullWidth
                            value={editData.email}
                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                        />
                        <TextField
                            label="Telefone"
                            fullWidth
                            value={editData.telefone}
                            onChange={(e) => setEditData({ ...editData, telefone: e.target.value })}
                        />

                        <FormControl fullWidth>
                            <InputLabel>Nível de Acesso</InputLabel>
                            <Select
                                value={editData.role}
                                label="Nível de Acesso"
                                onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                            >
                                {USER_ROLES.map((role) => (
                                    <MenuItem key={role} value={role}>
                                        {role}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <FormControl fullWidth>
                            <InputLabel>UGB / Conta</InputLabel>
                            <Select
                                value={editData.conta_id}
                                label="UGB / Conta"
                                onChange={(e) => setEditData({ ...editData, conta_id: e.target.value })}
                            >
                                <MenuItem value="">
                                    <em>Nenhuma (Acesso Geral)</em>
                                </MenuItem>
                                {ugbs.map((ugb) => (
                                    <MenuItem key={ugb.id} value={ugb.id}>
                                        {ugb.nome}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
                    <Button
                        onClick={handleSaveUser}
                        variant="contained"
                        disabled={loadingSave}
                        startIcon={loadingSave ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {loadingSave ? 'Salvando...' : 'Salvar'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Dialog de Senha Resetada */}
            <Dialog open={!!resetPasswordDialog} onClose={() => setResetPasswordDialog(null)}>
                <DialogTitle>Senha Resetada</DialogTitle>
                <DialogContent>
                    <Alert severity="success" sx={{ mb: 2 }}>
                        Senha temporária gerada com sucesso!
                    </Alert>
                    <Typography variant="body2" gutterBottom>
                        Senha temporária:
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.900', fontFamily: 'monospace' }}>
                        <Typography variant="h6" sx={{ color: 'primary.main' }}>
                            {resetPasswordDialog}
                        </Typography>
                    </Paper>
                    <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                        Copie esta senha e envie para o usuário. Em produção, seria enviada por email.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setResetPasswordDialog(null)} variant="contained">
                        Fechar
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default UserManagement;
