const { db } = require('../config/database');

async function migrate() {
    try {
        console.log('Iniciando migração de colunas para tabela maquinas...');

        const columns = [
            { name: 'operador', type: 'TEXT' },
            { name: 'setor', type: 'TEXT' },
            { name: 'fornecedor', type: 'TEXT' },
            { name: 'foto', type: 'TEXT' } // Storing base64
        ];

        for (const col of columns) {
            try {
                // Check if column exists
                const checkQuery = `
                    SELECT column_name 
                    FROM information_schema.columns 
                    WHERE table_name='maquinas' AND column_name=$1;
                `;
                const checkRes = await db.query(checkQuery, [col.name]);

                if (checkRes.rows.length === 0) {
                    // Add column
                    await db.query(`ALTER TABLE maquinas ADD COLUMN ${col.name} ${col.type}`);
                    console.log(`Coluna '${col.name}' adicionada.`);
                } else {
                    console.log(`Coluna '${col.name}' já existe.`);
                }
            } catch (err) {
                console.error(`Erro ao adicionar coluna ${col.name}:`, err.message);
            }
        }

        console.log('Migração concluída.');
        process.exit(0);
    } catch (error) {
        console.error('Erro geral na migração:', error);
        process.exit(1);
    }
}

migrate();
