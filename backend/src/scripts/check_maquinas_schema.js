const { db } = require('../config/database');

async function checkColumns() {
    try {
        const query = `
            SELECT column_name
            FROM information_schema.columns 
            WHERE table_name = 'maquinas';
        `;
        const res = await db.query(query);
        console.log('--- COLUNAS ---');
        res.rows.forEach(r => console.log(r.column_name));
        console.log('--- FIM ---');
        process.exit(0);
    } catch (error) {
        console.error('Erro:', error);
        process.exit(1);
    }
}

checkColumns();
