const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const authMiddleware = require('../middleware/auth');
const { sendRegistrationPendingEmail, sendPasswordResetEmail } = require('../services/emailService');

// POST /api/auth/change-password — altera senha verificando a senha atual
router.post('/change-password', authMiddleware, async (req, res) => {
    try {
        const { senhaAtual, novaSenha } = req.body;

        if (!senhaAtual || !novaSenha) {
            return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
        }

        if (novaSenha.length < 8) {
            return res.status(400).json({ error: 'A nova senha deve ter no mínimo 8 caracteres' });
        }

        const { data: user, error } = await supabase
            .from('usuarios')
            .select('senha_hash')
            .eq('id', req.userId)
            .single();

        if (error || !user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        const senhaValida = await bcrypt.compare(senhaAtual, user.senha_hash);
        if (!senhaValida) {
            return res.status(400).json({ error: 'Senha atual incorreta' });
        }

        const senha_hash = await bcrypt.hash(novaSenha, 10);
        await supabase
            .from('usuarios')
            .update({ senha_hash, atualizado_em: new Date().toISOString() })
            .eq('id', req.userId);

        res.json({ message: 'Senha alterada com sucesso!' });
    } catch (error) {
        console.error('Erro ao alterar senha:', error);
        res.status(500).json({ error: 'Erro ao alterar senha' });
    }
});

// GET /api/auth/test-email?to=email@exemplo.com — testa envio de email (só em dev)
router.get('/test-email', async (req, res) => {
    if (process.env.NODE_ENV === 'production') {
        return res.status(404).json({ error: 'Not found' });
    }
    const { to } = req.query;
    if (!to) return res.status(400).json({ error: 'Parâmetro "to" obrigatório' });

    const { sendApprovalEmail } = require('../services/emailService');
    const sent = await sendApprovalEmail({
        nome: 'Usuário Teste',
        email: to,
        provisionalPassword: 'Vm123@TEST'
    });

    res.json({
        sent,
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
        to,
        resend_configured: !!process.env.RESEND_API_KEY
    });
});

// GET /api/auth/ugbs — público, para o formulário de cadastro
router.get('/ugbs', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('ugbs')
            .select('id, nome')
            .eq('ativo', true)
            .order('nome');
        if (error) throw error;
        res.json(data);
    } catch (error) {
        console.error('Erro ao listar UGBs públicos:', error);
        res.status(500).json({ error: 'Erro ao listar UGBs' });
    }
});

// POST /api/auth/register — Solicitação de acesso (sem senha; admin aprova depois)
router.post('/register', async (req, res) => {
    try {
        const { nome, email, conta_id, nivel_acesso } = req.body;

        if (!nome || !email) {
            return res.status(400).json({ error: 'Nome e email são obrigatórios' });
        }

        // Validar email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: 'Email inválido' });
        }

        // Verificar se já existe
        const { data: existing } = await supabase
            .from('usuarios')
            .select('id')
            .eq('email', email.toLowerCase().trim())
            .maybeSingle();

        if (existing) {
            return res.status(400).json({ error: 'Este email já está cadastrado no sistema' });
        }

        // Roles válidos para auto-cadastro
        const validSelfRegisterRoles = ['Supervisor', 'Líder', 'Suprimentos', 'Gerente', 'Apontador'];
        const requestedRole = validSelfRegisterRoles.includes(nivel_acesso) ? nivel_acesso : 'Apontador';

        // Resolver conta_id: pode vir como nome da UGB (ex: "CA.01") ou como integer
        let resolvedContaId = null;
        if (conta_id) {
            const asInt = parseInt(conta_id);
            if (!isNaN(asInt) && String(asInt) === String(conta_id)) {
                resolvedContaId = asInt;
            } else {
                // Buscar pelo nome da UGB
                const { data: ugb } = await supabase
                    .from('ugbs')
                    .select('id')
                    .eq('nome', conta_id)
                    .maybeSingle();
                resolvedContaId = ugb?.id || null;
            }
        }

        // Gerar hash placeholder (usuário não pode logar até aprovação pois ativo=false)
        const placeholderHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);

        const { data, error } = await supabase
            .from('usuarios')
            .insert({
                nome: nome.trim(),
                email: email.toLowerCase().trim(),
                senha_hash: placeholderHash,
                nivel_acesso: requestedRole,
                ativo: false,
                conta_id: resolvedContaId,
            })
            .select('id')
            .single();

        if (error) throw error;

        // Enviar email de confirmação (silencia erro se SMTP não configurado)
        sendRegistrationPendingEmail({ nome: nome.trim(), email: email.toLowerCase().trim() })
            .catch(err => console.error('[REGISTER-EMAIL]', err.message));

        res.status(201).json({
            message: 'Solicitação enviada! Um administrador irá analisar seu cadastro e você receberá um email com suas credenciais de acesso.',
            userId: data.id
        });

    } catch (error) {
        console.error('Erro ao registrar usuário:', error);
        res.status(500).json({ error: 'Erro ao processar cadastro' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ error: 'Email e senha são obrigatórios' });
        }

        const { data: user, error } = await supabase
            .from('usuarios')
            .select('id, nome, email, senha_hash, nivel_acesso, ativo, foto_url, conta_id')
            .eq('email', email.toLowerCase().trim())
            .maybeSingle();

        if (error) throw error;

        if (!user) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        if (!user.ativo) {
            return res.status(403).json({ error: 'Acesso ainda não liberado. Aguarde a aprovação do administrador.' });
        }

        const validPassword = await bcrypt.compare(senha, user.senha_hash);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciais inválidas' });
        }

        const token = jwt.sign(
            { id: user.id, role: user.nivel_acesso, conta_id: user.conta_id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                name: user.nome,
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

// GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
    try {
        const { data: user, error } = await supabase
            .from('usuarios')
            .select('id, nome, email, nivel_acesso, ativo, foto_url, telefone, conta_id')
            .eq('id', req.userId)
            .single();

        if (error) throw error;

        if (!user) {
            return res.status(404).json({ error: 'Usuário não encontrado' });
        }

        res.json({
            id: user.id,
            name: user.nome,
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

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email é obrigatório' });
        }

        const { data: user } = await supabase
            .from('usuarios')
            .select('id, nome, email')
            .eq('email', email.toLowerCase().trim())
            .eq('ativo', true)
            .maybeSingle();

        if (user) {
            const token = crypto.randomBytes(32).toString('hex');
            const expires = new Date(Date.now() + 3600000).toISOString(); // 1 hora

            // Invalidar tokens anteriores
            await supabase
                .from('password_resets')
                .update({ used: true })
                .eq('user_id', user.id)
                .eq('used', false);

            await supabase
                .from('password_resets')
                .insert({ user_id: user.id, token, expires_at: expires });

            // Enviar email de recuperação
            sendPasswordResetEmail({ nome: user.nome, email: user.email, token })
                .catch(err => console.error('[FORGOT-EMAIL]', err.message));

            // Log de fallback em desenvolvimento
            if (process.env.NODE_ENV !== 'production') {
                console.log(`🔑 RESET TOKEN para ${email}: ${token}`);
                console.log(`🔗 Link: ${process.env.FRONTEND_URL || 'http://localhost:3005'}/reset-password/${token}`);
            }
        }

        // Sempre retornar a mesma mensagem (não vazar info sobre existência do email)
        res.json({ message: 'Se o email estiver cadastrado e ativo, você receberá as instruções em instantes.' });

    } catch (error) {
        console.error('Erro ao solicitar recuperação:', error);
        res.status(500).json({ error: 'Erro ao processar solicitação' });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, novaSenha } = req.body;

        if (!token || !novaSenha) {
            return res.status(400).json({ error: 'Token e nova senha são obrigatórios' });
        }

        if (novaSenha.length < 8) {
            return res.status(400).json({ error: 'A senha deve ter no mínimo 8 caracteres' });
        }

        const { data: resetRecord } = await supabase
            .from('password_resets')
            .select('user_id')
            .eq('token', token)
            .eq('used', false)
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();

        if (!resetRecord) {
            return res.status(400).json({ error: 'Link inválido ou expirado. Solicite um novo link de recuperação.' });
        }

        const senha_hash = await bcrypt.hash(novaSenha, 10);

        await supabase
            .from('usuarios')
            .update({ senha_hash, atualizado_em: new Date().toISOString() })
            .eq('id', resetRecord.user_id);

        await supabase
            .from('password_resets')
            .update({ used: true })
            .eq('user_id', resetRecord.user_id);

        res.json({ message: 'Senha atualizada com sucesso! Você já pode fazer login com a nova senha.' });

    } catch (error) {
        console.error('Erro ao resetar senha:', error);
        res.status(500).json({ error: 'Erro ao redefinir senha' });
    }
});

module.exports = router;
