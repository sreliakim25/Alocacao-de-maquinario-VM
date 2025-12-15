// Hierarquia de permissões
const roleHierarchy = {
    'Desenvolvedor': 7,
    'Gerente': 6,
    'Líder': 5,
    'Supervisor': 4,
    'Suprimentos': 3,
    'Apontador': 2
};

function permissionMiddleware(requiredRole) {
    return (req, res, next) => {
        const userRole = req.userRole;

        if (!userRole) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const userLevel = roleHierarchy[userRole] || 0;
        const requiredLevel = roleHierarchy[requiredRole] || 0;

        if (userLevel < requiredLevel) {
            return res.status(403).json({
                error: 'Permissão insuficiente',
                required: requiredRole,
                current: userRole
            });
        }

        next();
    };
}

module.exports = permissionMiddleware;
