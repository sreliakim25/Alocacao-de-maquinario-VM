const { db } = require('../config/database');

async function checkColumns() {
    try {
        const res = await db.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'apontamento_linhas'
        `);
        console.table(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        process.exit();
    }
}

checkColumns();
