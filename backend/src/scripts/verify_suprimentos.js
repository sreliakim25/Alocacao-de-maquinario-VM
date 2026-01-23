const { db } = require('../config/database');

async function verifySuprimentos() {
    console.log('🧪 Iniciando teste de fluxo Suprimentos...');
    try {
        // 1. Criar novo apontamento (Apontador)
        const resApt = await db.query(`
            INSERT INTO apontamentos (data_apontamento, maquina_id, operador, status, observacoes, apontador_id)
            VALUES (CURRENT_DATE, 1, 'Teste Suprimentos', 'em_apontamento', 'Inicial', 13)
            RETURNING id
        `);
        const id = resApt.rows[0].id;
        console.log(`📝 Apontamento criado: ID ${id} (em_apontamento)`);

        // 2. Supervisor Aprova
        await db.query(`UPDATE apontamentos SET status = 'pendente_lider' WHERE id = $1`, [id]);
        console.log('✅ Supervisor Aprovou -> pendente_lider');

        // 3. Líder Aprova
        await db.query(`UPDATE apontamentos SET status = 'aprovado' WHERE id = $1`, [id]);
        console.log('✅ Líder Aprovou -> aprovado');

        // 4. Verificar Visibilidade Suprimentos
        // Simulating the visibility query logic
        const queryVisibility = `
            SELECT id FROM apontamentos 
            WHERE id = $1 AND status = 'aprovado'
        `;
        const resVis = await db.query(queryVisibility, [id]);
        if (resVis.rows.length > 0) {
            console.log('👁️  Suprimentos consegue ver o apontamento aprovado.');
        } else {
            console.error('❌ ERRO: Suprimentos NÃO vê o apontamento aprovado.');
        }

        // 5. Suprimentos Reprova
        const motivo = 'Reprovado por Suprimentos - Teste';
        const timestamp = new Date().toLocaleString('pt-BR');
        const newObs = `\n[REPROVADO em ${timestamp} por Suprimentos]: ${motivo}`;

        await db.query(`
            UPDATE apontamentos 
            SET status = 'em_apontamento', 
                observacoes = COALESCE(observacoes, '') || $1 
            WHERE id = $2
        `, [newObs, id]);
        console.log('🚫 Suprimentos Reprovou -> em_apontamento');

        // 6. Verificar Resultado Final
        const finalRes = await db.query('SELECT status, observacoes FROM apontamentos WHERE id = $1', [id]);
        const finalApt = finalRes.rows[0];

        if (finalApt.status === 'em_apontamento' && finalApt.observacoes.includes(motivo)) {
            console.log('✅ SUCESSO FINAL: Ciclo completo validado.');
        } else {
            console.error('❌ ERRO FINAL: Status ou observação incorretos.', finalApt);
        }

        // Cleanup
        await db.query('DELETE FROM apontamentos WHERE id = $1', [id]);
        process.exit(0);

    } catch (error) {
        console.error('❌ Erro Fatal:', error);
        process.exit(1);
    }
}

verifySuprimentos();
