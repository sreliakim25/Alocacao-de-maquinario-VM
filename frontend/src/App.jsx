import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import getTheme from './theme';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import { useMemo } from 'react';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Apontamento from './pages/Apontamento';
import ListaApontamentos from './pages/ListaApontamentos';
import Maquinarios from './pages/Maquinarios';
import Configuracoes from './pages/Configuracoes';
import UserManagement from './pages/UserManagement';

// Layout & Components
import MainLayout from './components/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  const { isAuthenticated } = useAuthStore();
  const { mode } = useThemeStore();

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Rotas Públicas (Autenticação) */}
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
          />
          <Route
            path="/register"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Register />}
          />
          <Route
            path="/forgot-password"
            element={isAuthenticated ? <Navigate to="/" replace /> : <ForgotPassword />}
          />
          <Route
            path="/reset-password/:token"
            element={isAuthenticated ? <Navigate to="/" replace /> : <ResetPassword />}
          />

          {/* Rotas Protegidas */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="apontamento" element={<Apontamento />} />
            <Route path="apontamento/:id" element={<Apontamento />} />
            <Route path="lista-apontamentos" element={<ListaApontamentos />} />
            <Route path="cadastros" element={<Maquinarios />} />
            <Route path="configuracoes" element={<Configuracoes />} />

            {/* Rota de Gerenciamento de Usuários (apenas Gerente+) */}
            <Route
              path="user-management"
              element={
                <ProtectedRoute requiredRole="Gerente">
                  <UserManagement />
                </ProtectedRoute>
              }
            />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
