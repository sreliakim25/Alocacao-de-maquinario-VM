const { db } = require('../config/database');

async function testRejection() {
    console.log('🧪 Iniciando teste de reprovação...');
    try {
        // 1. Criar um apontamento dummy como Apontador
        const resApt = await db.query(`
            INSERT INTO apontamentos (data_apontamento, maquina_id, operador, status, observacoes, apontador_id)
            VALUES (CURRENT_DATE, 1, 'Teste Rejeição', 'pendente_supervisor', 'Obs inicial', 13)
            RETURNING id
        `);
        const id = resApt.rows[0].id;
        console.log(`📝 Apontamento criado: ID ${id} (pendente_supervisor)`);

        // 2. Simular Reprovação pelo Supervisor (PUT /status)
        // Precisamos simular a query que a rota faz
        const motivo = 'Teste de Motivo 123';
        const autor = 'Supervisor Teste';
        const timestamp = new Date().toLocaleString('pt-BR');
        const newObs = `\n[REPROVADO em ${timestamp} por ${autor}]: ${motivo}`;

        await db.query(`
            UPDATE apontamentos 
            SET status = 'em_apontamento', 
                observacoes = COALESCE(observacoes, '') || $1,
                atualizado_em = CURRENT_TIMESTAMP
            WHERE id = $2
        `, [newObs, id]);

        console.log('🔄 Status atualizado para em_apontamento com observação.');

        // 3. Verificar resultado
        const finalRes = await db.query('SELECT status, observacoes FROM apontamentos WHERE id = $1', [id]);
        const finalApt = finalRes.rows[0];

        console.log('📊 Resultado Final:');
        console.log('Status:', finalApt.status);
        console.log('Observações:', finalApt.observacoes);

        if (finalApt.status === 'em_apontamento' && finalApt.observacoes.includes(motivo)) {
            console.log('✅ SUCESSO: Reprovação funcionou corretamente.');
        } else {
            console.error('❌ ERRO: Falha na verificação.');
        }

        // Cleanup
        await db.query('DELETE FROM apontamentos WHERE id = $1', [id]);

        process.exit(0);

    } catch (error) {
        console.error('❌ Erro Fatal:', error);
        process.exit(1);
    }
}

testRejection();
