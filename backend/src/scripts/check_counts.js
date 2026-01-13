const { db } = require('../config/database');

async function checkCounts() {
    try {
        const counts = {};
        const tables = ['ugbs', 'vilas', 'sub_etapas', 'tarefas', 'supervisores'];

        for (const table of tables) {
            const res = await db.query(`SELECT COUNT(*) FROM ${table} WHERE ativo = true`);
            counts[table] = res.rows[0].count;
        }

        console.log('Database Counts:', counts);
    } catch (err) {
        console.error('Error checking counts:', err);
    } finally {
        process.exit();
    }
}

checkCounts();
