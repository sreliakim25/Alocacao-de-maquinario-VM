const { db } = require('../config/database');

async function checkTables() {
    try {
        const query = `
            SELECT table_name
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        `;
        const res = await db.query(query);
        console.log('--- TABELAS ---');
        res.rows.forEach(r => console.log(r.table_name));
        console.log('--- FIM ---');
        process.exit(0);
    } catch (error) {
        console.error('Erro:', error);
        process.exit(1);
    }
}

checkTables();
