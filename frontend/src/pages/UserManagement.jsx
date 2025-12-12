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
    CircularProgress
} from '@mui/material';
import {
    Edit as EditIcon,
    PersonOffOutlined,
    PersonOutlined,
    LockResetOutlined,
    DeleteOutline
} from '@mui/icons-material';
import { format } from 'date-fns';
import useUserStore from '../store/userStore';
import useAuthStore from '../store/authStore';

const USER_ROLES = [
    'Apontador',
    'Supervisor',
    'Líder',
    'Suprimentos',
    'Gerente',
    'Desenvolvedor'
];

const UserManagement = () => {
    const [selectedUser, setSelectedUser] = useState(null);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [newRole, setNewRole] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all'); // all, active, inactive
    const [resetPasswordDialog, setResetPasswordDialog] = useState(null);

    const { users, loading, fetchUsers, updateUserRole, toggleUserStatus, resetUserPassword } = useUserStore();
    const { user: currentUser } = useAuthStore();

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleEditClick = (user) => {
        setSelectedUser(user);
        setNewRole(user.role);
        setEditDialogOpen(true);
    };

    const handleSaveRole = async () => {
        if (selectedUser && newRole) {
            const success = await updateUserRole(selectedUser.id, newRole);
            if (success) {
                setEditDialogOpen(false);
                setSelectedUser(null);
                fetchUsers();
            }
        }
    };

    const handleToggleStatus = async (userId) => {
        await toggleUserStatus(userId);
        fetchUsers();
    };

    const handleResetPassword = async (userId) => {
        const result = await resetUserPassword(userId);
        if (result.success) {
            setResetPasswordDialog(result.tempPassword);
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

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' ||
            (filterStatus === 'active' && user.ativo) ||
            (filterStatus === 'inactive' && !user.ativo);
        return matchesSearch && matchesStatus;
    });

    const pendingUsers = users.filter(u => !u.ativo);

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
                            Gerencie permissões e status dos usuários do sistema
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
                                                    {user.name}
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
                                                {format(new Date(user.criado_em), 'dd/MM/yyyy')}
                                            </TableCell>
                                            <TableCell align="right">
                                                <Tooltip title="Editar Permissões">
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
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {filteredUsers.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center">
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

            {/* Dialog de Edição */}
            <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Editar Permissões</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ pt: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                            Usuário: <strong>{selectedUser?.name}</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Email: {selectedUser?.email}
                        </Typography>
                        <FormControl fullWidth>
                            <InputLabel>Nível de Acesso</InputLabel>
                            <Select
                                value={newRole}
                                label="Nível de Acesso"
                                onChange={(e) => setNewRole(e.target.value)}
                            >
                                {USER_ROLES.map((role) => (
                                    <MenuItem key={role} value={role}>
                                        {role}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEditDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSaveRole} variant="contained">
                        Salvar
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
