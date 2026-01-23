const { db } = require('../config/database');

async function listApts() {
    try {
        const res = await db.query(`
            SELECT a.id, a.data_apontamento, a.operador, a.status, a.apontador_id, u.nome as apontador_nome
            FROM apontamentos a
            LEFT JOIN usuarios u ON a.apontador_id = u.id
        `);
        console.log(JSON.stringify(res.rows, null, 2));
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

listApts();
