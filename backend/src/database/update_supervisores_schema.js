const { db } = require('../config/database');

async function runMigration() {
    console.log('🔄 Atualizando schema de supervisores...');
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Adicionar colunas UGB, Cargo, Lider
        await client.query(`
            ALTER TABLE supervisores 
            ADD COLUMN IF NOT EXISTS cargo VARCHAR(255),
            ADD COLUMN IF NOT EXISTS ugb_id INT REFERENCES ugbs(id),
            ADD COLUMN IF NOT EXISTS lider_id INT REFERENCES supervisores(id)
        `);

        await client.query('COMMIT');
        console.log('✅ Schema de supervisores atualizado com sucesso!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erro na migração:', error);
    } finally {
        client.release();
        process.exit();
    }
}

runMigration();
