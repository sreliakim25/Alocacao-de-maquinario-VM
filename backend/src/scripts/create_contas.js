const { db } = require('../config/database');

async function createContas() {
    try {
        console.log('Criando tabela contas...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS contas (
                id SERIAL PRIMARY KEY,
                nome TEXT NOT NULL,
                ativo BOOLEAN DEFAULT true
            );
        `);
        console.log('Tabela contas criada.');
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

createContas();
