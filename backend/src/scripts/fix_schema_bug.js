const { db } = require('../config/database');

(async () => {
    try {
        console.log('🔄 Fixing Foreign Key Constraint on "usuarios" table...');

        // 1. Drop the incorrect constraint
        console.log('Dropping constraint "usuarios_conta_id_fkey"...');
        await db.query('ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_conta_id_fkey');

        // 2. Add the correct constraint referencing ugbs
        console.log('Adding constraint "usuarios_conta_id_fkey" referencing "ugbs"...');
        await db.query(`
            ALTER TABLE usuarios 
            ADD CONSTRAINT usuarios_conta_id_fkey 
            FOREIGN KEY (conta_id) 
            REFERENCES ugbs(id) 
            ON DELETE SET NULL
        `);

        // 3. Drop the empty "contas" table to prevent confusion
        console.log('Dropping unused "contas" table...');
        await db.query('DROP TABLE IF EXISTS contas');

        console.log('✅ Schema fixed successfully!');

    } catch (e) {
        console.error('❌ Error fixing schema:', e);
    } finally {
        process.exit();
    }
})();
