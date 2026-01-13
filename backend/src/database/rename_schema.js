const { db } = require('../config/database');

async function runMigration() {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        console.log('🔄 Iniciando migração de schema...');

        // 1. Rename Tables
        // Check if tables allow renaming (simple rename)
        // Order: Rename sub_etapas -> tarefas (to free up sub_etapas name)

        // --- TAREFAS (antiga sub_etapas) ---
        // Verifica se sub_etapas existe e tarefas NÃO existe
        const checkTarefas = await client.query("SELECT to_regclass('public.tarefas')");
        const checkSubEtapasOld = await client.query("SELECT to_regclass('public.sub_etapas')");

        if (checkSubEtapasOld.rows[0].to_regclass && !checkTarefas.rows[0].to_regclass) {
            await client.query('ALTER TABLE sub_etapas RENAME TO tarefas');
            console.log('✅ Tabela sub_etapas renomeada para tarefas');
        }

        // --- SUB_ETAPAS (antiga etapas) ---
        // Verifica se etapas existe e sub_etapas NÃO existe (ela foi renomeada acima se existia)
        const checkSubEtapasNew = await client.query("SELECT to_regclass('public.sub_etapas')");
        const checkEtapasOld = await client.query("SELECT to_regclass('public.etapas')");

        if (checkEtapasOld.rows[0].to_regclass && !checkSubEtapasNew.rows[0].to_regclass) {
            await client.query('ALTER TABLE etapas RENAME TO sub_etapas');
            console.log('✅ Tabela etapas renomeada para sub_etapas');
        }

        // --- UGBS (antiga contas) ---
        const checkUgbs = await client.query("SELECT to_regclass('public.ugbs')");
        const checkContas = await client.query("SELECT to_regclass('public.contas')");

        if (checkContas.rows[0].to_regclass && !checkUgbs.rows[0].to_regclass) {
            await client.query('ALTER TABLE contas RENAME TO ugbs');
            console.log('✅ Tabela contas renomeada para ugbs');
        }

        // 2. Drop Unused Tables
        await client.query('DROP TABLE IF EXISTS sub_contas CASCADE');
        console.log('✅ Tabela sub_contas removida');

        // 3. Create Supervisores
        const checkSupervisores = await client.query("SELECT to_regclass('public.supervisores')");
        if (!checkSupervisores.rows[0].to_regclass) {
            await client.query(`
                CREATE TABLE supervisores (
                    id SERIAL PRIMARY KEY,
                    nome VARCHAR(255) NOT NULL,
                    ativo BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ Tabela supervisores criada');
        }

        // 4. Rename Columns (Fix Foreign Keys)

        // Vilas: conta_id -> ugb_id
        // Check column existence
        const checkVilaCol = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='vilas' AND column_name='conta_id'
        `);
        if (checkVilaCol.rows.length > 0) {
            await client.query('ALTER TABLE vilas RENAME COLUMN conta_id TO ugb_id');
            console.log('✅ Coluna vilas.conta_id renomeada para ugb_id');
        }

        // Tarefas: etapa_id -> sub_etapa_id
        const checkTarefaCol = await client.query(`
            SELECT column_name FROM information_schema.columns 
            WHERE table_name='tarefas' AND column_name='etapa_id'
        `);
        if (checkTarefaCol.rows.length > 0) {
            await client.query('ALTER TABLE tarefas RENAME COLUMN etapa_id TO sub_etapa_id');
            console.log('✅ Coluna tarefas.etapa_id renomeada para sub_etapa_id');
        }

        await client.query('COMMIT');
        console.log('🎉 Migração concluída com sucesso!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Erro na migração:', error);
    } finally {
        client.release();
        process.exit();
    }
}

runMigration();
