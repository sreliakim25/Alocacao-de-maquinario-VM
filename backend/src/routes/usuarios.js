const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const permissionMiddleware = require('../middleware/permissions');

// GET /api/usuarios - Listar todos os usuários (admin apenas)
router.get('/', authMiddleware, permissionMiddleware('Gerente'), async (req, res) => {
    try {
        const query = `
            SELECT id, nome, email, telefone, nivel_acesso, ativo, foto_url, criado_em, conta_id
            FROM usuarios
            ORDER BY criado_em DESC
        `;
        const result = await db.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
});

// GET /api/usuarios/:id - Buscar usuário por ID
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;

        // Usuários comuns só podem ver seu próprio perfil
        if (req.userId !== parseInt(id) && req.userRole !== 'Gerente' && req.userRole !== 'Desenvolvedor' && req.userRole !== 'Administrador') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const query = `
            SELECT id, nome, email, telefone, nivel_acesso, ativo, foto_url, criado_em
            FROM usuarios
            WHERE id = $1
        `;
        const result = await db.query(query, [id]);
        const user = result.rows[0];

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json(user);
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});

// POST /api/usuarios - Criar novo usuário (Admin/Dev)
router.post('/', authMiddleware, permissionMiddleware(['Administrador', 'Desenvolvedor']), async (req, res) => {
    try {
        const { nome, email, telefone, senha, nivel_acesso, conta_id } = req.body;

        if (!nome || !email || !senha || !nivel_acesso) {
            return res.status(400).json({ error: 'Nome, email, senha e nível de acesso são obrigatórios' });
        }

        const bcrypt = require('bcrypt');
        const senha_hash = await bcrypt.hash(senha, 10);

        const query = `
            INSERT INTO usuarios (nome, email, telefone, senha_hash, nivel_acesso, conta_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, nome, email, nivel_acesso, criado_em
        `;
        const result = await db.query(query, [nome, email, telefone, senha_hash, nivel_acesso, conta_id]);
        res.status(201).json(result.rows[0]);

    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        if (error.code === '23505') { // Unique violation
            return res.status(409).json({ error: 'Email já cadastrado' });
        }
        res.status(500).json({ error: 'Erro ao criar usuário: ' + error.message });
    }
});

// PUT /api/usuarios/:id - Atualizar usuário
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, telefone, foto_url, senha } = req.body;

        // Usuários comuns só podem editar seu próprio perfil
        if (req.userId !== parseInt(id) && req.userRole !== 'Gerente' && req.userRole !== 'Desenvolvedor' && req.userRole !== 'Administrador') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const updates = [];
        const values = [];
        let counter = 1;

        if (nome) {
            updates.push(`nome = $${counter++}`);
            values.push(nome);
        }
        if (email) {
            updates.push(`email = $${counter++}`);
            values.push(email);
        }
        if (telefone !== undefined) {
            updates.push(`telefone = $${counter++}`);
            values.push(telefone);
        }
        if (foto_url !== undefined) {
            updates.push(`foto_url = $${counter++}`);
            values.push(foto_url);
        }
        if (senha) {
            const bcrypt = require('bcrypt');
            const senha_hash = await bcrypt.hash(senha, 10);
            updates.push(`senha_hash = $${counter++}`);
            values.push(senha_hash);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar' });
        }

        updates.push('atualizado_em = CURRENT_TIMESTAMP');
        values.push(id);

        const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${counter}`;
        await db.query(query, values);

        res.json({ message: 'Usuário atualizado com sucesso' });

    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ error: 'Erro ao atualizar usuário: ' + error.message });
    }
});

// PUT /api/usuarios/:id/role - Alterar nível/obra (Admin/Dev)
router.put('/:id/role', authMiddleware, permissionMiddleware(['Administrador', 'Desenvolvedor']), async (req, res) => {
    try {
        const { id } = req.params;
        const { nivel_acesso, conta_id } = req.body;

        const validRoles = ['Apontador', 'Supervisor', 'Líder', 'Suprimentos', 'Gerente', 'Desenvolvedor', 'Administrador'];
        if (!validRoles.includes(nivel_acesso)) {
            return res.status(400).json({ error: 'Nível de acesso inválido' });
        }

        // Não permitir editar própria permissão
        if (req.userId === parseInt(id)) {
            return res.status(403).json({ error: 'Não é possível alterar sua própria permissão' });
        }

        let query;
        let params;

        if (conta_id !== undefined) {
            query = `
                UPDATE usuarios 
                SET nivel_acesso = $1, conta_id = $2, atualizado_em = CURRENT_TIMESTAMP
                WHERE id = $3
            `;
            params = [nivel_acesso, conta_id, id];
        } else {
            query = `
                UPDATE usuarios 
                SET nivel_acesso = $1, atualizado_em = CURRENT_TIMESTAMP
                WHERE id = $2
            `;
            params = [nivel_acesso, id];
        }

        await db.query(query, params);

        res.json({ message: 'Permissão atualizada com sucesso' });

    } catch (error) {
        console.error('Erro ao atualizar permissão:', error);
        res.status(500).json({ error: 'Erro ao atualizar permissão: ' + error.message });
    }
});

// PUT /api/usuarios/:id/status - Ativar/Desativar usuário (Gerente+)
router.put('/:id/status', authMiddleware, permissionMiddleware('Gerente'), async (req, res) => {
    try {
        const { id } = req.params;
        const { ativo } = req.body;

        // Não permitir desativar própria conta
        if (req.userId === parseInt(id)) {
            return res.status(403).json({ error: 'Não é possível desativar sua própria conta' });
        }

        const query = `
            UPDATE usuarios 
            SET ativo = $1, atualizado_em = CURRENT_TIMESTAMP
            WHERE id = $2
        `;
        await db.query(query, [ativo ? true : false, id]);

        res.json({ message: `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso` });

    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

// DELETE /api/usuarios/:id - Deletar usuário (Desenvolvedor apenas)
router.delete('/:id', authMiddleware, permissionMiddleware('Desenvolvedor'), async (req, res) => {
    try {
        const { id } = req.params;

        // Não permitir deletar própria conta
        if (req.userId === parseInt(id)) {
            return res.status(403).json({ error: 'Não é possível deletar sua própria conta' });
        }

        await db.query('DELETE FROM usuarios WHERE id = $1', [id]);

        res.json({ message: 'Usuário deletado com sucesso' });

    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
});

module.exports = router;
