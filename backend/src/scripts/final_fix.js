const { db } = require('../config/database');

(async () => {
    const client = await db.pool.connect();
    try {
        console.log('🔄 FINAL ATTEMPT: Fix Schema Constraint...');

        // 1. Drop Constraint
        console.log('STEP 1: Dropping constraint...');
        await client.query('ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_conta_id_fkey');
        console.log('✅ Constraint dropped.');

        // 2. Add New Constraint
        console.log('STEP 2: Adding new constraint referencing "ugbs"...');
        await client.query(`
            ALTER TABLE usuarios 
            ADD CONSTRAINT usuarios_conta_id_fkey 
            FOREIGN KEY (conta_id) 
            REFERENCES ugbs(id) 
            ON DELETE SET NULL
        `);
        console.log('✅ Constraint added.');

        // 3. Drop Table
        console.log('STEP 3: Dropping "contas" table...');
        await client.query('DROP TABLE IF EXISTS contas');
        console.log('✅ Table "contas" dropped.');

        console.log('🚀 SUCCESS: Schema fixed!');

    } catch (e) {
        console.error('❌ FATAL ERROR:', e);
    } finally {
        client.release();
        process.exit();
    }
})();
