const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
    try {
        // Pegar token do header Authorization
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ error: 'Token não fornecido' });
        }

        // Token formato: "Bearer TOKEN"
        const parts = authHeader.split(' ');

        if (parts.length !== 2) {
            return res.status(401).json({ error: 'Erro no token' });
        }

        const [scheme, token] = parts;

        if (!/^Bearer$/i.test(scheme)) {
            return res.status(401).json({ error: 'Token mal formatado' });
        }

        // Verificar token
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: 'Token inválido' });
            }

            // Adicionar dados do usuário à requisição
            req.userId = decoded.id;
            req.userRole = decoded.role;

            return next();
        });

    } catch (error) {
        return res.status(401).json({ error: 'Token inválido' });
    }
}

module.exports = authMiddleware;
