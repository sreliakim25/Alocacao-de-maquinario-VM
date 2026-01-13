const { db } = require('../config/database');
const fs = require('fs');

async function runTest() {
    try {
        // Setup File Logging
        const logFile = 'test_output.log';
        if (fs.existsSync(logFile)) fs.unlinkSync(logFile);

        const fileLog = (...args) => {
            const str = args.map(a => (typeof a === 'object' && a !== null) ? JSON.stringify(a, null, 2) : String(a)).join(' ') + '\n';
            fs.appendFileSync(logFile, str);
            // Also write to stdout but we rely on file for verification
            // process.stdout.write(str); 
        };

        console.log = fileLog;
        console.error = fileLog;

        console.log("Starting Integration Test...");

        // 1. Fetch Valid IDs
        console.log("Fetching maquina ID...");
        const maquina = (await db.query('SELECT id FROM maquinas LIMIT 1')).rows[0];
        console.log("Fetching vila ID...");
        const vila = (await db.query('SELECT id FROM vilas LIMIT 1')).rows[0];
        console.log("Fetching etapa ID...");
        const etapa = (await db.query('SELECT id FROM sub_etapas LIMIT 1')).rows[0];
        console.log("Fetching subEtapa ID...");
        const subEtapa = (await db.query('SELECT id FROM tarefas LIMIT 1')).rows[0];
        console.log("Fetching ugb ID...");
        const ugb = (await db.query('SELECT id FROM ugbs LIMIT 1')).rows[0];

        if (!maquina || !vila || !etapa || !subEtapa || !ugb) {
            console.error("Missing seed data (maquinas, vilas, etc). Cannot test.");
            process.exit(1);
        }

        console.log("Found IDs:", { maquina, vila, etapa, subEtapa, ugb });

        console.log("Fetching User ID...");
        const user = (await db.query('SELECT id FROM usuarios LIMIT 1')).rows[0];
        if (!user) { console.error("No user found"); process.exit(1); }

        // 2. Simulate POST Query
        const payload = {
            data_apontamento: '2025-01-01',
            maquina_id: maquina.id,
            operador: 'Test Operador',
            status: 'em_apontamento',
            apontadorId: user.id, // INTEGER
            observacoes: 'Test Obs Header',
            linhas: [
                {
                    vila_id: vila.id,
                    etapa_id: etapa.id,
                    sub_etapa_id: subEtapa.id,
                    conta_id: ugb.id,
                    sub_conta_id: null,
                    supervisor: 'Test Supervisor',
                    inicio: '08:00',
                    fim: '10:00',
                    observacao: 'Test Line Obs'
                }
            ]
        };

        console.log("Testing INSERT...");
        const insertHeaders = 'INSERT INTO apontamentos (data_apontamento, maquina_id, operador, status, apontador_id, observacoes) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id';
        const resHeader = await db.query(insertHeaders, [
            payload.data_apontamento, payload.maquina_id, payload.operador, payload.status, payload.apontadorId, payload.observacoes
        ]);
        const apontamentoId = resHeader.rows[0].id;
        console.log("Inserted Header ID:", apontamentoId);

        const insertLine = `
            INSERT INTO apontamento_linhas 
            (apontamento_id, vila_id, etapa_id, sub_etapa_id, conta_id, sub_conta_id, supervisor, inicio, fim, observacao)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        `;
        const l = payload.linhas[0];

        // Explicit Casting to avoid invalid syntax errors
        const values = [
            Number(apontamentoId),
            Number(l.vila_id),
            Number(l.etapa_id),
            Number(l.sub_etapa_id),
            Number(l.conta_id),
            l.sub_conta_id ? Number(l.sub_conta_id) : null,
            l.supervisor,
            l.inicio,
            l.fim,
            l.observacao
        ];

        console.log("\n\n====== START PAYLOAD ======");
        console.log("Values Types:", values.map(v => typeof v));
        console.log("Values:", values);
        console.log("====== END PAYLOAD ======\n");

        await db.query(insertLine, values);
        console.log("Inserted Line successfully.");


        // 3. Simulate GET (Verify JOINs)
        console.log("Testing SELECT with JOINs...");
        const selectQuery = `
            SELECT al.*, 
                   v.nome as vila_nome,
                   se.nome as etapa_nome,
                   t.nome as tarefa_nome,
                   u.nome as ugb_nome
            FROM apontamento_linhas al
            LEFT JOIN vilas v ON al.vila_id = v.id
            LEFT JOIN sub_etapas se ON al.etapa_id = se.id
            LEFT JOIN tarefas t ON al.sub_etapa_id = t.id
            LEFT JOIN ugbs u ON al.conta_id = u.id
            WHERE al.apontamento_id = $1
        `;
        const resGet = await db.query(selectQuery, [apontamentoId]);
        console.log("Fetched Line:", resGet.rows[0]);

        if (!resGet.rows[0].vila_nome) console.warn("WARNING: vila_nome is null. Check IDs.");

        // 4. Clean Up
        console.log("Cleaning up...");
        await db.query('DELETE FROM apontamentos WHERE id = $1', [apontamentoId]);
        console.log("Deleted test data.");

        console.log("TEST PASSED.");
    } catch (err) {
        if (typeof console !== 'undefined' && console.error) {
            console.error("TEST FAILED:", err.message);
            console.error("Full Error:", err);
        }
    } finally {
        setTimeout(() => process.exit(), 1000);
    }
}

runTest();
