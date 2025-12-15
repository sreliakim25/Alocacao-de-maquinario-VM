const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../middleware/auth');

// POST /api/auth/register - Cadastro de novo usuário
router.post('/register', async (req, res) => {
    try {
        const { nome, email, telefone, senha } = req.body;

        // Validações
        if (!nome || !email || !senha) {
            return res.status(400).json({ error: 'Dados inválidos' });
        }

        // Verificar se email já existe
        const existingUser = db.prepare('SELECT id FROM usuarios WHERE email = ?').get(email);
        if (existingUser) {
            return res.status(400).json({ error: 'Email já cadastrado' });
        }

        // Hash da senha
        const senha_hash = await bcrypt.hash(senha, 10);

        // Inserir usuário (inativo até aprovação)
        const insert = db.prepare(`
            INSERT INTO usuarios (nome, email, senha_hash, telefone, nivel_acesso, ativo)
            VALUES (?, ?, ?, ?, 'Apontador', 0)
        `);

        const result = insert.run(nome, email, senha_hash, telefone || null);

        res.status(201).json({
            message: 'Usuário cadastrado! Aguarde aprovação do administrador.',
            userId: result.lastInsertRowid
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
        const user = db.prepare(`
            SELECT id, nome, email, senha_hash, nivel_acesso, ativo, foto_url
            FROM usuarios
            WHERE email = ?
        `).get(email);

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
            { id: user.id, role: user.nivel_acesso },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Remover senha do retorno
        delete user.senha_hash;

        res.json({
            token,
            user: {
                id: user.id,
                name: user.nome,
                email: user.email,
                role: user.nivel_acesso,
                foto_url: user.foto_url
            }
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ error: 'Erro ao fazer login' });
    }
});

// GET /api/auth/me - Dados do usuário logado
router.get('/me', authMiddleware, (req, res) => {
    try {
        const user = db.prepare(`
            SELECT id, nome, email, nivel_acesso, ativo, foto_url, telefone
            FROM usuarios
            WHERE id = ?
        `).get(req.userId);

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({
            id: user.id,
            name: user.nome,
            email: user.email,
            role: user.nivel_acesso,
            ativo: user.ativo,
            foto_url: user.foto_url,
            telefone: user.telefone
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

        const user = db.prepare('SELECT id, nome FROM usuarios WHERE email = ?').get(email);

        // Sempre retornar success (por segurança, não revelar se email existe)
        res.json({
            message: 'Se o email existir, você receberá instruções de recuperação.'
        });

        // TODO: Implementar envio de email com token de recuperação

    } catch (error) {
        console.error('Erro ao solicitar recuperação:', error);
        res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
});

// POST /api/auth/reset-password - Resetar senha com token
router.post('/reset-password', async (req, res) => {
    try {
        const { token, novaSenha } = req.body;

        // TODO: Validar token de recuperação
        // TODO: Verificar expiração do token

        // Por enquanto, retornar não implementado
        res.status(501).json({ error: 'Funcionalidade em desenvolvimento' });

    } catch (error) {
        console.error('Erro ao resetar senha:', error);
        res.status(500).json({ error: 'Erro ao resetar senha' });
    }
});

module.exports = router;
