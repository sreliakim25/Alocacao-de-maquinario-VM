import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import getTheme from './theme';
import useAuthStore from './store/authStore';
import useThemeStore from './store/themeStore';
import { useMemo } from 'react';

// Pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Apontamento from './pages/Apontamento';
import ListaApontamentos from './pages/ListaApontamentos';
import Maquinarios from './pages/Maquinarios';
import Configuracoes from './pages/Configuracoes';

// Layout
import MainLayout from './components/MainLayout';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  const { isAuthenticated } = useAuthStore();
  const { mode } = useThemeStore();

  const theme = useMemo(() => getTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route
            path="/login"
            element={isAuthenticated ? <Navigate to="/" replace /> : <Login />}
          />

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
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
