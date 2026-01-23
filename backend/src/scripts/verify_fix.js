const { db } = require('../config/database');

(async () => {
    try {
        console.log('🔍 Verifying "usuarios_conta_id_fkey" definition...');

        const query = `
            SELECT 
                tc.constraint_name, 
                ccu.table_name AS foreign_table_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND tc.table_name='usuarios'
              AND tc.constraint_name='usuarios_conta_id_fkey';
        `;
        const res = await db.query(query);
        console.log('Constraint Definition:', JSON.stringify(res.rows, null, 2));

        // Also check if the table "ugbs" exists and has data
        const ugbs = await db.query('SELECT count(*) FROM ugbs');
        console.log('UGBs count:', ugbs.rows[0].count);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
})();
