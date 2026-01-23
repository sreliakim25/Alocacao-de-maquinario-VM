// Hierarquia de permissões
const roleHierarchy = {
    'Desenvolvedor': 7,
    'Administrador': 7,
    'Gerente': 6,
    'Líder': 5,
    'Lider': 5,
    'Supervisor': 4,
    'Suprimentos': 3,
    'Apontador': 2
};

function permissionMiddleware(allowedRoles) {
    return (req, res, next) => {
        const userRole = req.userRole;

        if (!userRole) {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        // Se allowedRoles for uma string (único papel), converte para array
        const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

        // Se 'Desenvolvedor' ou 'Administrador' não estiverem explicítamente inclusos, 
        // vamos permitir que eles acessem tudo por padrão? 
        // Pela matriz, Admin/Dev têm acesso a tudo. Vamos garantir isso.
        const effectiveRoles = [...roles, 'Administrador', 'Desenvolvedor'];

        if (!effectiveRoles.includes(userRole)) {
            return res.status(403).json({
                error: 'Permissão insuficiente',
                required: roles,
                current: userRole
            });
        }

        next();
    };
}

module.exports = permissionMiddleware;
