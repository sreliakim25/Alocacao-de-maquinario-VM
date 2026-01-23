const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    },
    connectionTimeoutMillis: 30000, // 30 segundos
    idleTimeoutMillis: 30000,
    keepAlive: true,
    max: 20 // Increase max connections slightly if needed
});

pool.on('connect', () => {
    console.log('✅ Base de dados conectada com sucesso!');
});

pool.on('error', (err) => {
    console.error('❌ Erro inesperado na conexão com o banco:', err);
    process.exit(-1);
});

// Wrapper para manter compatibilidade com interface de query simples
const db = {
    query: (text, params) => pool.query(text, params),
    pool: pool
};

// Função para executar migrações (simplificada para Postgres)
async function runMigrations() {
    const fs = require('fs');
    const path = require('path');
    const schemaPath = path.join(__dirname, '../database/schema.sql');

    try {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schema);
        console.log('✅ Migrações executadas com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao executar migrações:', error.message);
        throw error; // Propaga o erro para ser tratado pelo caller
    }
}

module.exports = { db, runMigrations };
