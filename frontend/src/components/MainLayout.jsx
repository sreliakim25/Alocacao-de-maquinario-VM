import {
    Drawer,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    ListItemButton,
    AppBar,
    Toolbar,
    Typography,
    IconButton,
    Box,
    Avatar,
    Menu,
    MenuItem,
    Divider,
    Alert,
    alpha,
    Tooltip
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    Assignment,
    List as ListIcon,
    Settings,
    Menu as MenuIcon,
    Logout,
    DeveloperMode,
    Construction,
    LightMode,
    DarkMode,
    ChevronLeft,
    ChevronRight,
    PushPin,
    PushPinOutlined,
    AccountCircle,
    People,
    Notifications,
    Person,
    ManageAccounts,
    NotificationsNone
} from '@mui/icons-material';
import { useState } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useThemeStore from '../store/themeStore';
import logo from '../assets/logo.png';
import excavatorIcon from '../assets/excavator-icon.png';

const drawerWidth = 260;
const collapsedDrawerWidth = 70;

const MainLayout = () => {
    const [mobileOpen, setMobileOpen] = useState(false);
    const [anchorEl, setAnchorEl] = useState(null);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [sidebarPinned, setSidebarPinned] = useState(true);
    const [sidebarHovered, setSidebarHovered] = useState(false);

    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout, isDevelopmentBypass, hasPermission } = useAuthStore();
    const { mode, toggleTheme } = useThemeStore();

    const menuItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
        { text: 'Novo Apontamento', icon: <Assignment />, path: '/apontamento' },
        { text: 'Apontamentos', icon: <ListIcon />, path: '/lista-apontamentos' },
        {
            text: 'Maquinários',
            icon: <Box component="img" src={excavatorIcon} sx={{ width: 24, height: 24, filter: 'invert(0.7)' }} />,
            path: '/cadastros'
        },
    ];

    // Menu de administração (apenas para Gerente ou superior)
    const adminMenuItems = hasPermission('Gerente') ? [
        { text: 'Gerenciar Usuários', icon: <People />, path: '/user-management' },
    ] : [];

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
        handleMenuClose();
    };

    const toggleSidebarPin = () => {
        if (sidebarPinned) {
            // Despinando: colapsar
            setSidebarCollapsed(true);
            setSidebarPinned(false);
        } else {
            // Pinando: expandir e fixar
            setSidebarCollapsed(false);
            setSidebarPinned(true);
        }
    };

    // Decidir largura efetiva do drawer
    const isExpanded = sidebarPinned || (!sidebarPinned && sidebarHovered);
    const effectiveDrawerWidth = isExpanded ? drawerWidth : collapsedDrawerWidth;

    const drawer = (
        <Box
            sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}
            onMouseEnter={() => !sidebarPinned && setSidebarHovered(true)}
            onMouseLeave={() => !sidebarPinned && setSidebarHovered(false)}
        >
            {/* Logo Section */}
            <Box sx={{ p: 3, borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
                {isExpanded && (
                    <>
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                mb: 2
                            }}
                        >
                            <Box
                                component="img"
                                src={logo}
                                alt="UDE"
                                sx={{
                                    height: 100,
                                    filter: 'brightness(1.2)',
                                }}
                            />
                        </Box>
                        <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Construction sx={{ fontSize: 16 }} />
                            Apontamento de Maquinário
                        </Typography>
                    </>
                )}
                {!isExpanded && (
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'center',
                        }}
                    >
                        <Box
                            component="img"
                            src={logo}
                            alt="UDE"
                            sx={{
                                height: 80,
                                width: 80,
                                objectFit: 'contain',
                                filter: 'brightness(1.2)',
                            }}
                        />
                    </Box>
                )}

                {/* Pin Button */}
                <Tooltip title={sidebarPinned ? "Ocultar barra lateral" : "Fixar barra lateral"} placement="right">
                    <IconButton
                        onClick={toggleSidebarPin}
                        size="small"
                        sx={{
                            position: 'absolute',
                            top: 8,
                            right: 8,
                            opacity: isExpanded ? 1 : 0,
                            transition: 'opacity 0.2s'
                        }}
                    >
                        {sidebarPinned ? <PushPin sx={{ fontSize: 18 }} /> : <PushPinOutlined sx={{ fontSize: 18 }} />}
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Navigation */}
            <List sx={{ px: isExpanded ? 2 : 1, py: 2, flex: 1 }}>
                {menuItems.map((item) => {
                    const isSelected = location.pathname === item.path;
                    return (
                        <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                            <Tooltip title={!isExpanded ? item.text : ""} placement="right">
                                <ListItemButton
                                    selected={isSelected}
                                    onClick={() => {
                                        navigate(item.path);
                                        setMobileOpen(false);
                                    }}
                                    sx={{
                                        borderRadius: 2,
                                        py: 1.5,
                                        justifyContent: isExpanded ? 'flex-start' : 'center',
                                        transition: 'all 0.2s ease',
                                        '&.Mui-selected': {
                                            background: 'linear-gradient(135deg, rgba(192, 72, 72, 0.2) 0%, rgba(217, 164, 65, 0.2) 100%)',
                                            borderLeft: isExpanded ? '3px solid #D9A441' : 'none',
                                            '&:hover': {
                                                background: 'linear-gradient(135deg, rgba(192, 72, 72, 0.3) 0%, rgba(217, 164, 65, 0.3) 100%)',
                                            }
                                        },
                                        '&:hover': {
                                            backgroundColor: alpha('#ffffff', 0.05),
                                        }
                                    }}
                                >
                                    <ListItemIcon sx={{
                                        color: isSelected ? '#D9A441' : 'text.secondary',
                                        minWidth: isExpanded ? 40 : 0,
                                        justifyContent: 'center'
                                    }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    {isExpanded && (
                                        <ListItemText
                                            primary={item.text}
                                            primaryTypographyProps={{
                                                fontWeight: isSelected ? 600 : 400,
                                            }}
                                        />
                                    )}
                                </ListItemButton>
                            </Tooltip>
                        </ListItem>
                    );
                })}

                {/* Admin Menu Items */}
                {adminMenuItems.length > 0 && (
                    <>
                        <Divider sx={{ my: 1, opacity: 0.3 }} />
                        {adminMenuItems.map((item) => {
                            const isSelected = location.pathname === item.path;
                            return (
                                <ListItem key={item.text} disablePadding sx={{ mb: 1 }}>
                                    <Tooltip title={!isExpanded ? item.text : ""} placement="right">
                                        <ListItemButton
                                            selected={isSelected}
                                            onClick={() => {
                                                navigate(item.path);
                                                setMobileOpen(false);
                                            }}
                                            sx={{
                                                borderRadius: 2,
                                                py: 1.5,
                                                justifyContent: isExpanded ? 'flex-start' : 'center',
                                                transition: 'all 0.2s ease',
                                                '&.Mui-selected': {
                                                    background: 'linear-gradient(135deg, rgba(192, 72, 72, 0.2) 0%, rgba(217, 164, 65, 0.2) 100%)',
                                                    borderLeft: isExpanded ? '3px solid #D9A441' : 'none',
                                                    '&:hover': {
                                                        background: 'linear-gradient(135deg, rgba(192, 72, 72, 0.3) 0%, rgba(217, 164, 65, 0.3) 100%)',
                                                    }
                                                },
                                                '&:hover': {
                                                    backgroundColor: alpha('#ffffff', 0.05),
                                                }
                                            }}
                                        >
                                            <ListItemIcon sx={{
                                                color: isSelected ? '#D9A441' : 'text.secondary',
                                                minWidth: isExpanded ? 40 : 0,
                                                justifyContent: 'center'
                                            }}>
                                                {item.icon}
                                            </ListItemIcon>
                                            {isExpanded && (
                                                <ListItemText
                                                    primary={item.text}
                                                    primaryTypographyProps={{
                                                        fontWeight: isSelected ? 600 : 400,
                                                    }}
                                                />
                                            )}
                                        </ListItemButton>
                                    </Tooltip>
                                </ListItem>
                            );
                        })}
                    </>
                )}
            </List>

            {/* Footer */}
            {isExpanded && (
                <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    {/* User Profile Section */}
                    <Box
                        onClick={handleMenuOpen}
                        sx={{
                            p: 2,
                            cursor: 'pointer',
                            transition: 'background 0.2s',
                            '&:hover': {
                                bgcolor: alpha('#ffffff', 0.05)
                            }
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={1.5}>
                            <Avatar
                                sx={{
                                    bgcolor: 'secondary.main',
                                    color: '#000',
                                    fontWeight: 600,
                                    width: 45,
                                    height: 45
                                }}
                            >
                                {user?.name?.charAt(0) || 'U'}
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" fontWeight="700" sx={{ lineHeight: 1.2 }}>
                                    {user?.name || 'Usuário'}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    {user?.email || ''}
                                </Typography>
                            </Box>
                        </Box>
                    </Box>

                    {/* Copyright Info */}
                    <Box sx={{ px: 2, pb: 2, borderTop: '1px solid rgba(255,255,255,0.08)', pt: 2 }}>
                        <Typography variant="caption" color="text.secondary" display="block">
                            © 2025 UDE
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                            v0.1.0
                        </Typography>
                    </Box>
                </Box>
            )}
        </Box>
    );

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh' }}>
            <AppBar
                position="fixed"
                sx={{
                    width: { sm: `calc(100% - ${effectiveDrawerWidth}px)` },
                    ml: { sm: `${effectiveDrawerWidth}px` },
                    transition: 'all 0.3s ease',
                }}
            >
                <Toolbar>
                    <IconButton
                        color="inherit"
                        edge="start"
                        onClick={handleDrawerToggle}
                        sx={{ mr: 2, display: { sm: 'none' } }}
                    >
                        <MenuIcon />
                    </IconButton>
                    <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 600 }}>
                        Sistema de Apontamento de Maquinários Viana e Moura
                    </Typography>

                    {/* Theme Toggle */}
                    <IconButton onClick={toggleTheme} sx={{ mr: 1, color: 'inherit' }}>
                        {mode === 'dark' ? <LightMode /> : <DarkMode />}
                    </IconButton>

                    {/* Notifications Bell */}
                    <IconButton sx={{ color: 'inherit' }}>
                        <NotificationsNone />
                    </IconButton>

                    {/* User Menu Dropdown */}
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        PaperProps={{
                            sx: {
                                mt: 1.5,
                                minWidth: 280,
                                bgcolor: '#1a1a1a',
                                border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: 2,
                            }
                        }}
                        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                    >
                        {/* User Info Header */}
                        <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                            <Box display="flex" alignItems="center" gap={1.5}>
                                <Avatar
                                    sx={{
                                        bgcolor: 'secondary.main',
                                        color: '#000',
                                        fontWeight: 600,
                                        width: 45,
                                        height: 45
                                    }}
                                >
                                    {user?.name?.charAt(0) || 'U'}
                                </Avatar>
                                <Box>
                                    <Typography variant="subtitle1" fontWeight="700">
                                        {user?.name || 'Usuário'}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary" display="block">
                                        {user?.email || ''}
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        {/* Menu Options */}
                        <Box sx={{ py: 1 }}>
                            <MenuItem
                                onClick={() => {
                                    handleMenuClose();
                                    navigate('/configuracoes');
                                }}
                                sx={{
                                    py: 1.5,
                                    px: 2.5,
                                    '&:hover': { bgcolor: alpha('#D9A441', 0.1) }
                                }}
                            >
                                <ListItemIcon>
                                    <Person fontSize="small" sx={{ color: '#D9A441' }} />
                                </ListItemIcon>
                                <Typography variant="body2">Seu Perfil</Typography>
                            </MenuItem>

                            <MenuItem
                                onClick={handleMenuClose}
                                sx={{
                                    py: 1.5,
                                    px: 2.5,
                                    '&:hover': { bgcolor: alpha('#D9A441', 0.1) }
                                }}
                            >
                                <ListItemIcon>
                                    <ManageAccounts fontSize="small" sx={{ color: '#D9A441' }} />
                                </ListItemIcon>
                                <Box>
                                    <Typography variant="body2">Sua Conta</Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        Permissão: {user?.role || 'Não definido'}
                                    </Typography>
                                </Box>
                            </MenuItem>

                            <MenuItem
                                onClick={handleMenuClose}
                                sx={{
                                    py: 1.5,
                                    px: 2.5,
                                    '&:hover': { bgcolor: alpha('#D9A441', 0.1) }
                                }}
                            >
                                <ListItemIcon>
                                    <Notifications fontSize="small" sx={{ color: '#D9A441' }} />
                                </ListItemIcon>
                                <Typography variant="body2">Notificações</Typography>
                            </MenuItem>
                        </Box>

                        {/* Logout */}
                        <Divider sx={{ my: 0.5, opacity: 0.1 }} />
                        <MenuItem
                            onClick={handleLogout}
                            sx={{
                                py: 1.5,
                                px: 2.5,
                                color: '#ff5252',
                                '&:hover': { bgcolor: alpha('#ff5252', 0.1) }
                            }}
                        >
                            <ListItemIcon>
                                <Logout fontSize="small" sx={{ color: '#ff5252' }} />
                            </ListItemIcon>
                            <Typography variant="body2">Log out</Typography>
                        </MenuItem>
                    </Menu>
                </Toolbar>
            </AppBar>

            <Box
                component="nav"
                sx={{ width: { sm: effectiveDrawerWidth }, flexShrink: { sm: 0 }, transition: 'width 0.3s ease' }}
            >
                <Drawer
                    variant="temporary"
                    open={mobileOpen}
                    onClose={handleDrawerToggle}
                    ModalProps={{ keepMounted: true }}
                    sx={{
                        display: { xs: 'block', sm: 'none' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: drawerWidth,
                        },
                    }}
                >
                    {drawer}
                </Drawer>
                <Drawer
                    variant="permanent"
                    sx={{
                        display: { xs: 'none', sm: 'block' },
                        '& .MuiDrawer-paper': {
                            boxSizing: 'border-box',
                            width: effectiveDrawerWidth,
                            transition: 'width 0.3s ease',
                            overflowX: 'hidden',
                        },
                    }}
                    open
                >
                    {drawer}
                </Drawer>
            </Box>

            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    p: 3,
                    width: { sm: `calc(100% - ${effectiveDrawerWidth}px)` },
                    minHeight: '100vh',
                    transition: 'all 0.3s ease',
                }}
            >
                <Toolbar />

                {isDevelopmentBypass && (
                    <Alert
                        severity="warning"
                        icon={<DeveloperMode />}
                        sx={{
                            mb: 3,
                            backgroundColor: alpha('#D9A441', 0.1),
                            border: '1px solid rgba(217, 164, 65, 0.3)',
                        }}
                    >
                        <strong>Modo Desenvolvimento</strong> - Você está usando bypass de autenticação
                    </Alert>
                )}

                <Box sx={{ maxWidth: 1400, mx: 'auto' }}>
                    <Outlet />
                </Box>
            </Box>
        </Box>
    );
};

export default MainLayout;
