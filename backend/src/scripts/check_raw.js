const { db } = require('../config/database');

async function checkRaw() {
    try {
        console.log('--- Checking Raw Apontamentos (Last 5) ---');
        const res = await db.query('SELECT * FROM apontamentos ORDER BY id DESC LIMIT 5');
        if (res.rows.length > 0) {
            console.log('Columns:', Object.keys(res.rows[0]));
            console.table(res.rows);
        } else {
            console.log('No records found in apontamentos.');
        }
    } catch (err) {
        console.error('Error checking raw:', err);
    } finally {
        process.exit();
    }
}

checkRaw();
