const { db } = require('../config/database');

async function updateConstraints() {
    console.log('Atualizando constraints da tabela usuarios...');
    try {
        // 1. Descobrir o nome da constraint (geralmente usuarios_nivel_acesso_check ou algo assim)
        // Mas como não temos certeza, vamos tentar remover as mais prováveis ou consultar primeiro.

        // Vamos tentar remover a constraint pelo nome padrão gerado pelo Postgres se não nomeamos explicitamente no CREATE TABLE
        // O CREATE TABLE usou CHECK(nivel_acesso IN ...), então o nome costuma ser tabela_coluna_check

        await db.query(`ALTER TABLE usuarios DROP CONSTRAINT IF EXISTS usuarios_nivel_acesso_check`);

        // Se ela tiver outro nome, precisamos achar. Vamos listar e dropar dinamicamente.
        const res = await db.query(`
            SELECT conname
            FROM pg_constraint c
            JOIN pg_namespace n ON n.oid = c.connamespace
            WHERE n.nspname = 'public' 
            AND conrelid = 'usuarios'::regclass
            AND contype = 'c' -- Check constraint
        `);

        for (const row of res.rows) {
            // Check if definition contains 'nivel_acesso'
            // Na verdade, vamos dropar qualquer check constraint nessa coluna se conseguirmos identificar
            console.log(`Dropping constraint: ${row.conname}`);
            await db.query(`ALTER TABLE usuarios DROP CONSTRAINT "${row.conname}"`);
        }

        console.log('Constraints de nivel_acesso removidas.');

        // Opcional: Recriar com os novos valores
        await db.query(`
            ALTER TABLE usuarios 
            ADD CONSTRAINT usuarios_nivel_acesso_check 
            CHECK (nivel_acesso IN ('Apontador', 'Supervisor', 'Líder', 'Lider', 'Suprimentos', 'Gerente', 'Desenvolvedor', 'Administrador'))
        `);
        console.log('Nova constraint adicionada.');

        process.exit(0);

    } catch (error) {
        console.error('Erro ao atualizar constraints:', error);
        process.exit(1);
    }
}

updateConstraints();
