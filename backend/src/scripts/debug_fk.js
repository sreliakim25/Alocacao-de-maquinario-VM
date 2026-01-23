const { db } = require('../config/database');

(async () => {
    try {
        console.log('Checking Foreign Keys for table "usuarios"...');
        const query = `
            SELECT 
                tc.constraint_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name 
            FROM 
                information_schema.table_constraints AS tc 
                JOIN information_schema.key_column_usage AS kcu
                  ON tc.constraint_name = kcu.constraint_name
                  AND tc.table_schema = kcu.table_schema
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = tc.constraint_name
                  AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='usuarios';
        `;
        const res = await db.query(query);
        console.log('FK Constraints:', JSON.stringify(res.rows, null, 2));

        console.log('\nChecking "ugbs" table content:');
        const ugbs = await db.query('SELECT id, nome FROM ugbs');
        console.log('UGBs:', JSON.stringify(ugbs.rows, null, 2));

        console.log('\nChecking "contas" table content (if exists):');
        try {
            const contas = await db.query('SELECT id, nome FROM contas');
            console.log('Contas:', JSON.stringify(contas.rows, null, 2));
        } catch (e) {
            console.log('Table "contas" does not exist or error:', e.message);
        }

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
})();
