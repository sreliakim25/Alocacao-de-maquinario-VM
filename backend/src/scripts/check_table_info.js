const { db } = require('../config/database');

async function check() {
    try {
        const res = await db.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log("FINAL SCHEMA RESULT:");
        console.log(JSON.stringify(res.rows, null, 2));

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}
check();
