const { db } = require('../config/database');

async function listUsers() {
    try {
        const res = await db.query('SELECT id, nome, email, nivel_acesso, ativo FROM usuarios ORDER BY id');
        console.table(res.rows);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

listUsers();
