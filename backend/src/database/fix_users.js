const { db } = require('../config/database');
const bcrypt = require('bcrypt');

async function fixUsers() {
    console.log('🔧 Corrigindo e adicionando usuários...');

    try {
        const passwordDev = 'Dev.vm2026@';
        const hashedPasswordDev = await bcrypt.hash(passwordDev, 10);

        // 1. Variante com Typo (O que o usuário pediu)
        await db.query(`
            INSERT INTO usuarios (nome, email, senha_hash, nivel_acesso, ativo)
            VALUES ($1, $2, $3, 'Desenvolvedor', true)
            ON CONFLICT (email) DO UPDATE SET senha_hash = $3, ativo = true
        `, ['Desenvolvedor (Typos)', 'desenvolvedor@vianaemora.com.br', hashedPasswordDev]);
        console.log('✅ Usuário criado/atualizado: desenvolvedor@vianaemora.com.br');

        // 2. Variante Correta (Possível intenção)
        await db.query(`
            INSERT INTO usuarios (nome, email, senha_hash, nivel_acesso, ativo)
            VALUES ($1, $2, $3, 'Desenvolvedor', true)
            ON CONFLICT (email) DO UPDATE SET senha_hash = $3, ativo = true
        `, ['Desenvolvedor Master', 'desenvolvedor@vianaemoura.com.br', hashedPasswordDev]);
        console.log('✅ Usuário criado/atualizado: desenvolvedor@vianaemoura.com.br');

        process.exit(0);
    } catch (error) {
        console.error('❌ Erro:', error);
        process.exit(1);
    }
}

fixUsers();
