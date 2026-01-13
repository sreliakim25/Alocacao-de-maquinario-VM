const { db } = require('../config/database');

async function checkApontamentos() {
    try {
        console.log('--- Checking Apontamentos ---');
        // Get all apontamentos with related info
        const res = await db.query(`
            SELECT 
                a.id, 
                a.data, 
                m.codigo as maquina, 
                a.status,
                t.nome as tarefa,
                s.nome as supervisor,
                u.nome as ugb,
                a.horario_inicio,
                a.horario_fim
            FROM apontamentos a
            LEFT JOIN maquinas m ON a.maquina_id = m.id
            LEFT JOIN tarefas t ON a.tarefa_id = t.id
            LEFT JOIN supervisores s ON a.supervisor_id = s.id
            LEFT JOIN ugbs u ON a.ugb_id = u.id
            ORDER BY a.created_at DESC
            LIMIT 10
        `);

        console.log(`Found ${res.rows.length} records.`);
        console.table(res.rows);

    } catch (err) {
        console.error('Error checking apontamentos:', err);
    } finally {
        process.exit();
    }
}

checkApontamentos();
