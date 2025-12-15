const express = require('express');
const router = express.Router();
const { db } = require('../config/database');
const authMiddleware = require('../middleware/auth');
const permissionMiddleware = require('../middleware/permissions');

// GET /api/usuarios - Listar todos os usuários (admin apenas)
router.get('/', authMiddleware, permissionMiddleware('Gerente'), (req, res) => {
    try {
        const users = db.prepare(`
            SELECT id, nome, email, telefone, nivel_acesso, ativo, foto_url, criado_em
            FROM usuarios
            ORDER BY criado_em DESC
        `).all();

        res.json(users);
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
});

// GET /api/usuarios/:id - Buscar usuário por ID
router.get('/:id', authMiddleware, (req, res) => {
    try {
        const { id } = req.params;

        // Usuários comuns só podem ver seu próprio perfil
        if (req.userId !== parseInt(id) && req.userRole !== 'Gerente' && req.userRole !== 'Desenvolvedor') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const user = db.prepare(`
            SELECT id, nome, email, telefone, nivel_acesso, ativo, foto_url, criado_em
            FROM usuarios
            WHERE id = ?
        `).get(id);

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json(user);
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});

// PUT /api/usuarios/:id - Atualizar usuário
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, telefone, foto_url, senha } = req.body;

        // Usuários comuns só podem editar seu próprio perfil
        if (req.userId !== parseInt(id) && req.userRole !== 'Gerente' && req.userRole !== 'Desenvolvedor') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const updates = [];
        const values = [];

        if (nome) {
            updates.push('nome = ?');
            values.push(nome);
        }
        if (telefone !== undefined) {
            updates.push('telefone = ?');
            values.push(telefone);
        }
        if (foto_url !== undefined) {
            updates.push('foto_url = ?');
            values.push(foto_url);
        }
        if (senha) {
            const bcrypt = require('bcrypt');
            const senha_hash = await bcrypt.hash(senha, 10);
            updates.push('senha_hash = ?');
            values.push(senha_hash);
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar' });
        }

        updates.push('atualizado_em = CURRENT_TIMESTAMP');
        values.push(id);

        const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = ?`;
        db.prepare(query).run(...values);

        res.json({ message: 'Usuário atualizado com sucesso' });

    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ error: 'Erro ao atualizar usuário' });
    }
});

// PUT /api/usuarios/:id/role - Alterar permissão (Gerente+)
router.put('/:id/role', authMiddleware, permissionMiddleware('Gerente'), (req, res) => {
    try {
        const { id } = req.params;
        const { nivel_acesso } = req.body;

        const validRoles = ['Apontador', 'Supervisor', 'Líder', 'Suprimentos', 'Gerente', 'Desenvolvedor'];
        if (!validRoles.includes(nivel_acesso)) {
            return res.status(400).json({ error: 'Nível de acesso inválido' });
        }

        // Não permitir editar própria permissão
        if (req.userId === parseInt(id)) {
            return res.status(403).json({ error: 'Não é possível alterar sua própria permissão' });
        }

        db.prepare(`
            UPDATE usuarios 
            SET nivel_acesso = ?, atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(nivel_acesso, id);

        res.json({ message: 'Permissão atualizada com sucesso' });

    } catch (error) {
        console.error('Erro ao atualizar permissão:', error);
        res.status(500).json({ error: 'Erro ao atualizar permissão' });
    }
});

// PUT /api/usuarios/:id/status - Ativar/Desativar usuário (Gerente+)
router.put('/:id/status', authMiddleware, permissionMiddleware('Gerente'), (req, res) => {
    try {
        const { id } = req.params;
        const { ativo } = req.body;

        // Não permitir desativar própria conta
        if (req.userId === parseInt(id)) {
            return res.status(403).json({ error: 'Não é possível desativar sua própria conta' });
        }

        db.prepare(`
            UPDATE usuarios 
            SET ativo = ?, atualizado_em = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(ativo ? 1 : 0, id);

        res.json({ message: `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso` });

    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

// DELETE /api/usuarios/:id - Deletar usuário (Desenvolvedor apenas)
router.delete('/:id', authMiddleware, permissionMiddleware('Desenvolvedor'), (req, res) => {
    try {
        const { id } = req.params;

        // Não permitir deletar própria conta
        if (req.userId === parseInt(id)) {
            return res.status(403).json({ error: 'Não é possível deletar sua própria conta' });
        }

        db.prepare('DELETE FROM usuarios WHERE id = ?').run(id);

        res.json({ message: 'Usuário deletado com sucesso' });

    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
});

module.exports = router;
