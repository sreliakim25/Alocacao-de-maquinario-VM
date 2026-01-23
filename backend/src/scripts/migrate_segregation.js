const { db } = require('../config/database');

async function migrateSegregation() {
    console.log('Iniciando migração de Segregação de Dados e Recuperação de Senha...');

    try {
        // 1. Adicionar conta_id na tabela usuarios
        console.log('Adicionando coluna conta_id em usuarios...');
        await db.query(`
            ALTER TABLE usuarios 
            ADD COLUMN IF NOT EXISTS conta_id INTEGER REFERENCES contas(id);
        `);

        // 2. Criar tabela de recuperação de senha
        console.log('Criando tabela password_resets...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS password_resets (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
                token TEXT NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                used BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // Criar índice para busca rápida de token
        await db.query(`CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token);`);

        console.log('Migração concluída com sucesso!');
        process.exit(0);

    } catch (error) {
        console.error('Erro na migração:', error);
        process.exit(1);
    }
}

migrateSegregation();
