const { db } = require('../config/database');

async function checkSchema() {
    try {
        console.log('--- Checking Apontamentos Schema ---');
        const res = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'apontamentos'
        `);
        console.table(res.rows);
    } catch (err) {
        console.error('Error checking schema:', err);
    } finally {
        process.exit();
    }
}

checkSchema();
