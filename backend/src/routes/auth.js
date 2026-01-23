const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

// POST /api/auth/register - Cadastro de novo usuário
router.post('/register', async (req, res) => {
    try {
        const { nome, email, telefone, senha, conta_id } = req.body;

        // Validações
        if (!nome || !email || !senha) {
            return res.status(400).json({ error: 'Dados inválidos' });
        }

        // Verificar se email já existe
        const existingUserResult = await db.query('SELECT id FROM usuarios WHERE email = $1', [email]);
        if (existingUserResult.rows.length > 0) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // Hash da senha
        const senha_hash = await bcrypt.hash(senha, 10);

        // Inserir usuário (inativo até aprovação)
        const query = `
            INSERT INTO usuarios (nome, email, senha_hash, telefone, nivel_acesso, ativo, conta_id)
            VALUES ($1, $2, $3, $4, 'Apontador', false, $5)
            RETURNING id
        `;

        const result = await db.query(query, [nome, email, senha_hash, telefone || null, conta_id || null]);

        res.status(201).json({
            message: 'Usuário cadastrado! Aguarde aprovação do administrador.',
            userId: result.rows[0].id
        });

    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ error: 'Erro ao cadastrar usuário' });
    }
});

// POST /api/auth/login - Login do usuário
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        // Buscar usuário
        const query = `
            SELECT id, nome, email, senha_hash, nivel_acesso, ativo, foto_url, conta_id
            FROM usuarios
            WHERE email = $1
        `;
        const result = await db.query(query, [email]);
        const user = result.rows[0];

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Verificar se está ativo
        if (!user.ativo) {
            return res.status(403).json({ error: 'Usuário inativo. Aguarde aprovação do administrador.' });
        }

        // Verificar senha
        const validPassword = await bcrypt.compare(senha, user.senha_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        // Gerar token JWT
        const token = jwt.sign(
            { id: user.id, role: user.nivel_acesso, conta_id: user.conta_id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Remover senha do retorno
        delete user.senha_hash;

        res.json({
            token,
            user: {
                id: user.id,
                name: user.nome, // Manter name para compatibilidade frontend por enquanto
                nome: user.nome,
                email: user.email,
                role: user.nivel_acesso,
                foto_url: user.foto_url,
                conta_id: user.conta_id
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

// GET /api/auth/me - Dados do usuário logado
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const query = `
            SELECT id, nome, email, nivel_acesso, ativo, foto_url, telefone, conta_id
            FROM usuarios
            WHERE id = $1
        `;
        const result = await db.query(query, [req.userId]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({
            id: user.id,
            name: user.nome, // Compatibilidade
            nome: user.nome,
            email: user.email,
            role: user.nivel_acesso,
            ativo: user.ativo,
            foto_url: user.foto_url,
            telefone: user.telefone,
            conta_id: user.conta_id
        });

    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ error: 'Erro ao buscar dados do usuário' });
    }
});

// POST /api/auth/forgot-password - Solicitar recuperação de senha
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;
        const crypto = require('crypto');

        const result = await db.query('SELECT id, nome FROM usuarios WHERE email = $1', [email]);
        const user = result.rows[0];

        if (user) {
            // Gerar token
            const token = crypto.randomBytes(32).toString('hex');
            const expires = new Date(Date.now() + 3600000); // 1 hora

            await db.query(`
                INSERT INTO password_resets (user_id, token, expires_at)
                VALUES ($1, $2, $3)
            `, [user.id, token, expires]);

            // Em produção enviaria email. Aqui vamos logar para teste.
            console.log(`🔑 RESET PASSWORD TOKEN para ${email}: ${token}`);
            console.log(`🔗 Link (Simulado): http://localhost:3005/reset-password?token=${token}`);
        }

        // Sempre retornar success (segurança)
        res.json({
            message: 'Se o email existir, você receberá instruções de recuperação.'
        });

    } catch (error) {
        console.error('Erro ao solicitar recuperação:', error);
        res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
});

// POST /api/auth/reset-password - Resetar senha com token
router.post('/reset-password', async (req, res) => {
    try {
        const { token, novaSenha } = req.body;

        if (!token || !novaSenha) {
            return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
        }

        // Buscar token válido e não expirado
        const queryToken = `
            SELECT user_id FROM password_resets 
            WHERE token = $1 
            AND expires_at > CURRENT_TIMESTAMP 
            AND used = false
        `;
        const result = await db.query(queryToken, [token]);

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Token inválido ou expirado' });
        }

        const userId = result.rows[0].user_id;

        // Atualizar senha do usuário
        const senha_hash = await bcrypt.hash(novaSenha, 10);
        await db.query('UPDATE usuarios SET senha_hash = $1 WHERE id = $2', [senha_hash, userId]);

        // Marcar token como usado
        await db.query('UPDATE password_resets SET used = true WHERE token = $1', [token]);

        // Opcional: invalidar outros tokens desse usuário
        await db.query('UPDATE password_resets SET used = true WHERE user_id = $1 AND token != $2', [userId, token]);

        res.json({ message: 'Senha atualizada com sucesso! Faça login com a nova senha.' });

    } catch (error) {
        console.error('Erro ao resetar senha:', error);
        res.status(500).json({ error: 'Erro ao resetar senha' });
    }
});

module.exports = router;
