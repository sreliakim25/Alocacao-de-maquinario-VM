const { db } = require('../config/database');
const bcrypt = require('bcrypt');

const usersToCreate = [
    { nome: 'Admin Processos', email: 'adm.processos@vianaemoura.com.br', role: 'Administrador' },
    { nome: 'Apontador Padrão', email: 'apontador@vianaemoura.com.br', role: 'Apontador' },
    { nome: 'Supervisor Obras', email: 'supervisor@vianaemoura.com.br', role: 'Supervisor' },
    { nome: 'Líder Equipe', email: 'lider@vianaemoura.com.br', role: 'Lider' }, // Check if role 'Lider' matches backend expectation or if it's 'Líder' or 'Encarregado'
    { nome: 'Suprimentos', email: 'suprimentos@vianaemoura.com.br', role: 'Suprimentos' }
];

// Based on frontend/src/store/authStore.js or backend/src/middleware/auth.js, check exact role strings. 
// Usually systems use standardized keys. I'll assume standard naming but will default to 'Apontador' if unsure.
// Actually, let's use the strings provided by user: 'Administrador', 'Apontador', 'Supervisor', 'Lider', 'Suprimentos'.

async function seedUsers() {
    console.log('Iniciando criação de usuários de teste...');

    try {
        const passwordHash = await bcrypt.hash('123456', 10);

        for (const user of usersToCreate) {
            // Check if exists
            const checkRes = await db.query('SELECT id FROM usuarios WHERE email = $1', [user.email]);

            if (checkRes.rows.length > 0) {
                // Update existing
                await db.query(`
                    UPDATE usuarios 
                    SET nome = $1, nivel_acesso = $2, senha_hash = $3, ativo = true 
                    WHERE email = $4
                `, [user.nome, user.role, passwordHash, user.email]);
                console.log(`Usuário atualizado: ${user.email}`);
            } else {
                // Create new
                await db.query(`
                    INSERT INTO usuarios (nome, email, senha_hash, nivel_acesso, ativo)
                    VALUES ($1, $2, $3, $4, true)
                `, [user.nome, user.email, passwordHash, user.role]);
                console.log(`Usuário criado: ${user.email}`);
            }
        }

        console.log('Seeding concluído. Senha padrão: 123456');
        process.exit(0);

    } catch (error) {
        console.error('Erro no seeding:', error);
        process.exit(1);
    }
}

seedUsers();
