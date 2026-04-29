const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const authMiddleware = require('../middleware/auth');
const permissionMiddleware = require('../middleware/permissions');

// GET /api/usuarios
router.get('/', authMiddleware, permissionMiddleware('Gerente'), async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('usuarios')
            .select('id, nome, email, telefone, nivel_acesso, ativo, foto_url, criado_em, conta_id')
            .order('criado_em', { ascending: false });

        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao listar usuários:', error);
        res.status(500).json({ error: 'Erro ao listar usuários' });
    }
});

// GET /api/usuarios/:id
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (req.userId !== id && req.userRole !== 'Gerente' && req.userRole !== 'Desenvolvedor' && req.userRole !== 'Administrador') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const { data, error } = await supabase
            .from('usuarios')
            .select('id, nome, email, telefone, nivel_acesso, ativo, foto_url, criado_em')
            .eq('id', id)
            .single();

        if (error) throw error;
        if (!data) return res.status(404).json({ error: 'Usuário não encontrado' });
        res.json(data);
    } catch (error) {
        console.error('Erro ao buscar usuário:', error);
        res.status(500).json({ error: 'Erro ao buscar usuário' });
    }
});

// POST /api/usuarios
router.post('/', authMiddleware, permissionMiddleware(['Administrador', 'Desenvolvedor']), async (req, res) => {
    try {
        const { nome, email, telefone, senha, nivel_acesso, conta_id } = req.body;

        if (!nome || !email || !senha || !nivel_acesso) {
            return res.status(400).json({ error: 'Nome, email, senha e nível de acesso são obrigatórios' });
        }

        const bcrypt = require('bcrypt');
        const senha_hash = await bcrypt.hash(senha, 10);

        const { data, error } = await supabase
            .from('usuarios')
            .insert({ nome, email, telefone, senha_hash, nivel_acesso, conta_id })
            .select('id, nome, email, nivel_acesso, criado_em')
            .single();

        if (error) {
            if (error.code === '23505') return res.status(409).json({ error: 'Email já cadastrado' });
            throw error;
        }

        res.status(201).json(data);
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        res.status(500).json({ error: 'Erro ao criar usuário: ' + error.message });
    }
});

// PUT /api/usuarios/:id
router.put('/:id', authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { nome, email, telefone, foto_url, senha } = req.body;

        if (req.userId !== id && req.userRole !== 'Gerente' && req.userRole !== 'Desenvolvedor' && req.userRole !== 'Administrador') {
            return res.status(403).json({ error: 'Acesso negado' });
        }

        const updates = {};
        if (nome) updates.nome = nome;
        if (email) updates.email = email;
        if (telefone !== undefined) updates.telefone = telefone;
        if (foto_url !== undefined) updates.foto_url = foto_url;
        if (senha) {
            const bcrypt = require('bcrypt');
            updates.senha_hash = await bcrypt.hash(senha, 10);
        }

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ error: 'Nenhum campo para atualizar' });
        }

        updates.atualizado_em = new Date().toISOString();

        const { error } = await supabase.from('usuarios').update(updates).eq('id', id);
        if (error) throw error;
        res.json({ message: 'Usuário atualizado com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        res.status(500).json({ error: 'Erro ao atualizar usuário: ' + error.message });
    }
});

// PUT /api/usuarios/:id/role
router.put('/:id/role', authMiddleware, permissionMiddleware(['Administrador', 'Desenvolvedor']), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { nivel_acesso, conta_id } = req.body;

        const validRoles = ['Apontador', 'Supervisor', 'Líder', 'Suprimentos', 'Gerente', 'Desenvolvedor', 'Administrador'];
        if (!validRoles.includes(nivel_acesso)) {
            return res.status(400).json({ error: 'Nível de acesso inválido' });
        }

        if (req.userId === id) {
            return res.status(403).json({ error: 'Não é possível alterar sua própria permissão' });
        }

        const updates = { nivel_acesso, atualizado_em: new Date().toISOString() };
        if (conta_id !== undefined) updates.conta_id = conta_id;

        const { error } = await supabase.from('usuarios').update(updates).eq('id', id);
        if (error) throw error;
        res.json({ message: 'Permissão atualizada com sucesso' });
    } catch (error) {
        console.error('Erro ao atualizar permissão:', error);
        res.status(500).json({ error: 'Erro ao atualizar permissão: ' + error.message });
    }
});

// POST /api/usuarios/:id/approve — Aprova cadastro pendente + gera senha provisória + envia email
router.post('/:id/approve', authMiddleware, permissionMiddleware(['Gerente']), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const crypto = require('crypto');
        const { sendApprovalEmail } = require('../services/emailService');

        // Buscar dados do usuário
        const { data: user, error: fetchError } = await supabase
            .from('usuarios')
            .select('id, nome, email, ativo')
            .eq('id', id)
            .single();

        if (fetchError || !user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        // Gerar senha provisória: Vm + 3 dígitos + @ + 4 hex uppercase
        const digits = Math.floor(Math.random() * 900 + 100);
        const hex = crypto.randomBytes(2).toString('hex').toUpperCase();
        const provisionalPassword = `Vm${digits}@${hex}`;
        const senha_hash = await bcrypt.hash(provisionalPassword, 10);

        // Ativar usuário e definir senha provisória
        const { error: updateError } = await supabase
            .from('usuarios')
            .update({ ativo: true, senha_hash, atualizado_em: new Date().toISOString() })
            .eq('id', id);

        if (updateError) throw updateError;

        // Enviar email de aprovação com a senha provisória
        sendApprovalEmail({ nome: user.nome, email: user.email, provisionalPassword })
            .catch(err => console.error('[APPROVE-EMAIL]', err.message));

        console.log(`✅ Usuário aprovado: ${user.email}`);

        res.json({
            message: 'Usuário aprovado com sucesso! Email enviado com a senha provisória.'
        });

    } catch (error) {
        console.error('Erro ao aprovar usuário:', error);
        res.status(500).json({ error: 'Erro ao aprovar usuário' });
    }
});

// PUT /api/usuarios/:id/status
router.put('/:id/status', authMiddleware, permissionMiddleware('Gerente'), async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { ativo } = req.body;

        if (req.userId === id) {
            return res.status(403).json({ error: 'Não é possível desativar sua própria conta' });
        }

        const { error } = await supabase
            .from('usuarios')
            .update({ ativo: !!ativo, atualizado_em: new Date().toISOString() })
            .eq('id', id);

        if (error) throw error;
        res.json({ message: `Usuário ${ativo ? 'ativado' : 'desativado'} com sucesso` });
    } catch (error) {
        console.error('Erro ao atualizar status:', error);
        res.status(500).json({ error: 'Erro ao atualizar status' });
    }
});

// DELETE /api/usuarios/:id
router.delete('/:id', authMiddleware, permissionMiddleware('Desenvolvedor'), async (req, res) => {
    try {
        const id = parseInt(req.params.id);

        if (req.userId === id) {
            return res.status(403).json({ error: 'Não é possível deletar sua própria conta' });
        }

        const { error } = await supabase.from('usuarios').delete().eq('id', id);
        if (error) throw error;
        res.json({ message: 'Usuário deletado com sucesso' });
    } catch (error) {
        console.error('Erro ao deletar usuário:', error);
        res.status(500).json({ error: 'Erro ao deletar usuário' });
    }
});

module.exports = router;
