const { db } = require('../config/database');

async function checkUsers() {
    try {
        const res = await db.query(`
            SELECT id, nome, email, nivel_acesso, conta_id, ativo 
            FROM usuarios 
            WHERE nivel_acesso = 'Apontador' OR email LIKE '%apontador%'
        `);
        console.table(res.rows);

        const ugbs = await db.query('SELECT * FROM ugbs');
        console.log('UGBs:');
        console.table(ugbs.rows);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkUsers();
