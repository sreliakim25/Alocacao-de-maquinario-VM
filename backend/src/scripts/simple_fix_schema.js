const { db } = require('../config/database');

(async () => {
    const client = await db.pool.connect();
    try {
        console.log('🔄 SIMPLE FIX: Schema Constraint on "usuarios" table with lock timeout...');

        await client.query('SET lock_timeout = 5000;'); // 5 seconds timeout for locks

        // 1. Drop the incorrect constraint
        console.log('Dropping constraint "usuarios_conta_id_fkey"...');
        await client.query('ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_conta_id_fkey');

        // 2. Add the correct constraint referencing ugbs
        console.log('Adding constraint "usuarios_conta_id_fkey" referencing "ugbs"...');
        await client.query(`
            ALTER TABLE usuarios 
            ADD CONSTRAINT usuarios_conta_id_fkey 
            FOREIGN KEY (conta_id) 
            REFERENCES ugbs(id) 
            ON DELETE SET NULL
        `);

        // 3. Drop the empty "contas" table
        console.log('Dropping unused "contas" table...');
        await client.query('DROP TABLE IF EXISTS contas');

        console.log('✅ Schema fixed successfully!');

    } catch (e) {
        console.error('❌ Error fixing schema:', e.message);
        if (e.message.includes('lock timeout')) {
            console.log('🔒 Table is locked. backend server might be holding a connection open.');
        }
    } finally {
        client.release();
        process.exit();
    }
})();
