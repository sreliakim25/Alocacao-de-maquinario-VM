const { Resend } = require('resend');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3005';

// "from" no plano gratuito do Resend deve ser onboarding@resend.dev
// Após verificar seu domínio no painel do Resend, pode usar seu próprio email
const FROM = process.env.EMAIL_FROM || 'Sistema de Maquinários VM <onboarding@resend.dev>';

function getResend() {
    if (!process.env.RESEND_API_KEY) return null;
    return new Resend(process.env.RESEND_API_KEY);
}

async function sendEmail({ to, subject, html }) {
    const resend = getResend();
    if (!resend) {
        console.warn(`[EMAIL-SKIP] RESEND_API_KEY não configurado. Para: ${to} | ${subject}`);
        return false;
    }
    const { data, error } = await resend.emails.send({ from: FROM, to, subject, html });
    if (error) {
        console.error(`[EMAIL-ERRO] Para: ${to} | Código: ${error.statusCode} | ${error.name}: ${error.message}`);
        return false;
    }
    console.log(`[EMAIL-OK] id=${data?.id} | Para: ${to} | ${subject}`);
    return true;
}

// Email enviado ao usuário quando ele se cadastra (aguardando aprovação)
async function sendRegistrationPendingEmail({ nome, email }) {
    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f0f0f0;">
        <div style="background:#1a1a2e;padding:30px;border-radius:10px;text-align:center;margin-bottom:20px;">
            <h1 style="color:#D9A441;margin:0;font-size:26px;letter-spacing:1px;">Sistema de Maquinários</h1>
            <p style="color:#aaa;margin:6px 0 0;font-size:13px;">Viana &amp; Moura</p>
        </div>
        <div style="background:#fff;padding:30px;border-radius:10px;border-left:4px solid #D9A441;">
            <h2 style="color:#333;margin-top:0;">Solicitação Recebida!</h2>
            <p style="color:#555;">Olá, <strong>${nome}</strong>!</p>
            <p style="color:#555;">Sua solicitação de acesso ao sistema foi recebida e está aguardando análise do administrador.</p>
            <div style="background:#fff8e1;border:1px solid #D9A441;border-radius:8px;padding:15px;margin:20px 0;">
                <p style="margin:0;color:#7a5c00;font-size:14px;">
                    <strong>Próximo passo:</strong><br>
                    Assim que um administrador aprovar seu cadastro, você receberá um email com sua senha de acesso.
                </p>
            </div>
            <p style="color:#999;font-size:12px;margin-top:20px;">Este é um email automático. Não responda a esta mensagem.</p>
        </div>
    </div>`;
    return sendEmail({
        to: email,
        subject: 'Solicitação de acesso recebida — Sistema de Maquinários',
        html
    });
}

// Email enviado quando admin aprova o usuário (com senha provisória)
async function sendApprovalEmail({ nome, email, provisionalPassword }) {
    const loginUrl = `${FRONTEND_URL}/login`;
    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f0f0f0;">
        <div style="background:#1a1a2e;padding:30px;border-radius:10px;text-align:center;margin-bottom:20px;">
            <h1 style="color:#D9A441;margin:0;font-size:26px;letter-spacing:1px;">Sistema de Maquinários</h1>
            <p style="color:#aaa;margin:6px 0 0;font-size:13px;">Viana &amp; Moura</p>
        </div>
        <div style="background:#fff;padding:30px;border-radius:10px;border-left:4px solid #4caf50;">
            <h2 style="color:#333;margin-top:0;">✅ Acesso Liberado!</h2>
            <p style="color:#555;">Olá, <strong>${nome}</strong>!</p>
            <p style="color:#555;">Seu acesso ao sistema foi aprovado. Utilize as credenciais abaixo para fazer login:</p>
            <div style="background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;padding:20px;margin:20px 0;">
                <p style="margin:0 0 10px;color:#333;font-size:15px;"><strong>Email:</strong> ${email}</p>
                <p style="margin:0;color:#333;font-size:15px;"><strong>Senha provisória:</strong><br>
                    <span style="display:inline-block;margin-top:8px;font-family:monospace;font-size:24px;font-weight:bold;color:#D9A441;background:#1a1a1a;padding:10px 24px;border-radius:6px;letter-spacing:4px;">${provisionalPassword}</span>
                </p>
            </div>
            <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:15px;margin:20px 0;">
                <p style="margin:0;color:#856404;font-size:13px;">
                    <strong>⚠️ Importante:</strong> Altere sua senha após o primeiro acesso em <strong>Configurações → Alterar Senha</strong>.
                </p>
            </div>
            <div style="text-align:center;margin:28px 0 10px;">
                <a href="${loginUrl}" style="background:#D9A441;color:#1a1a1a;padding:14px 36px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">
                    Acessar o Sistema
                </a>
            </div>
            <p style="color:#999;font-size:12px;text-align:center;margin-top:20px;">Este é um email automático. Não responda a esta mensagem.</p>
        </div>
    </div>`;
    return sendEmail({
        to: email,
        subject: '✅ Seu acesso foi liberado! — Sistema de Maquinários',
        html
    });
}

// Email de recuperação de senha
async function sendPasswordResetEmail({ nome, email, token }) {
    const resetUrl = `${FRONTEND_URL}/reset-password/${token}`;
    const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f0f0f0;">
        <div style="background:#1a1a2e;padding:30px;border-radius:10px;text-align:center;margin-bottom:20px;">
            <h1 style="color:#D9A441;margin:0;font-size:26px;letter-spacing:1px;">Sistema de Maquinários</h1>
            <p style="color:#aaa;margin:6px 0 0;font-size:13px;">Viana &amp; Moura</p>
        </div>
        <div style="background:#fff;padding:30px;border-radius:10px;border-left:4px solid #2196f3;">
            <h2 style="color:#333;margin-top:0;">🔑 Recuperação de Senha</h2>
            <p style="color:#555;">Olá, <strong>${nome}</strong>!</p>
            <p style="color:#555;">Recebemos uma solicitação de recuperação de senha. Clique no botão abaixo para criar uma nova senha:</p>
            <div style="text-align:center;margin:28px 0;">
                <a href="${resetUrl}" style="background:#2196f3;color:#fff;padding:14px 36px;border-radius:6px;text-decoration:none;font-weight:bold;font-size:16px;">
                    Redefinir Senha
                </a>
            </div>
            <div style="background:#f8f9fa;border:1px solid #dee2e6;border-radius:8px;padding:15px;margin:20px 0;">
                <p style="margin:0;color:#666;font-size:13px;">
                    <strong>Link direto:</strong><br>
                    <a href="${resetUrl}" style="color:#2196f3;word-break:break-all;font-size:12px;">${resetUrl}</a>
                </p>
            </div>
            <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:15px;">
                <p style="margin:0;color:#856404;font-size:13px;">
                    Este link expira em <strong>1 hora</strong>. Se você não solicitou a recuperação, ignore este email.
                </p>
            </div>
            <p style="color:#999;font-size:12px;text-align:center;margin-top:20px;">Este é um email automático. Não responda a esta mensagem.</p>
        </div>
    </div>`;
    return sendEmail({
        to: email,
        subject: '🔑 Recuperação de senha — Sistema de Maquinários',
        html
    });
}

module.exports = { sendRegistrationPendingEmail, sendApprovalEmail, sendPasswordResetEmail };
