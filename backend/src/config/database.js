const Database = require('better-sqlite3');
const path = require('path');

// Configuração do banco de dados SQLite
const dbPath = path.join(__dirname, '../../database.db');
const db = new Database(dbPath, { verbose: console.log });

// Configurar WAL mode para melhor concorrência
db.pragma('journal_mode = WAL');

// Habilitar foreign keys
db.pragma('foreign_keys = ON');

// Função para executar migrations
function runMigrations() {
    const fs = require('fs');
    const schemaPath = path.join(__dirname, '../database/schema.sql');

    try {
        const schema = fs.readFileSync(schemaPath, 'utf8');
        db.exec(schema);
        console.log('✅ Migrações executadas com sucesso!');
    } catch (error) {
        console.error('❌ Erro ao executar migrações:', error.message);
        throw error;
    }
}

module.exports = { db, runMigrations };
