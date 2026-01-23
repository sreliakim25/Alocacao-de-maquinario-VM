const { db } = require('../config/database');

(async () => {
    const client = await db.pool.connect();
    try {
        console.log('🔄 FORCE FIX: Schema Constraint on "usuarios" table...');

        // 1. Terminate other connections to release locks
        const databaseName = process.env.DATABASE_URL.split('/').pop().split('?')[0]; // Extract DB name roughly or just rely on current DB
        console.log('⚠️ Terminating other connections...');

        await client.query(`
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE pid <> pg_backend_pid()
            AND datname = current_database()
            AND state = 'idle';
        `);

        // 2. Drop the incorrect constraint
        console.log('Dropping constraint "usuarios_conta_id_fkey"...');
        await client.query('ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_conta_id_fkey');

        // 3. Add the correct constraint referencing ugbs
        console.log('Adding constraint "usuarios_conta_id_fkey" referencing "ugbs"...');
        await client.query(`
            ALTER TABLE usuarios 
            ADD CONSTRAINT usuarios_conta_id_fkey 
            FOREIGN KEY (conta_id) 
            REFERENCES ugbs(id) 
            ON DELETE SET NULL
        `);

        // 4. Drop the empty "contas" table
        console.log('Dropping unused "contas" table...');
        await client.query('DROP TABLE IF EXISTS contas');

        console.log('✅ Schema fixed successfully!');

    } catch (e) {
        console.error('❌ Error fixing schema:', e);
    } finally {
        client.release();
        process.exit();
    }
})();
