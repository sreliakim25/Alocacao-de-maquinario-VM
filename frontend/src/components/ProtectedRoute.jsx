import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';

const ProtectedRoute = ({ children, requiredRole }) => {
    const { isAuthenticated, hasPermission } = useAuthStore();

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Se requiredRole for especificado, verificar permissão
    if (requiredRole && !hasPermission(requiredRole)) {
        // Usuário autenticado mas sem permissão suficiente
        return (
            <Navigate to="/" replace />
        );
    }

    return children;
};

export default ProtectedRoute;
