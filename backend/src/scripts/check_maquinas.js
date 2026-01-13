const { db } = require('../config/database');

async function checkMaquinas() {
    try {
        console.log('--- Checking Maquinas ---');
        const res = await db.query('SELECT COUNT(*) FROM maquinas WHERE ativo = true');
        console.log(`Active Maquinas Count: ${res.rows[0].count}`);

        const list = await db.query('SELECT id, nome, placa FROM maquinas WHERE ativo = true LIMIT 5');
        console.table(list.rows);

    } catch (err) {
        console.error('Error checking maquinas:', err);
    } finally {
        process.exit();
    }
}

checkMaquinas();
