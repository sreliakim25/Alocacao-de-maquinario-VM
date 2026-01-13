const { db } = require('../config/database');

async function fixSchema() {
    console.log('🔧 Corrigindo schema do banco de dados...');

    try {
        // Adicionar coluna conta_id na tabela vilas se não existir
        await db.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'vilas' AND column_name = 'conta_id') THEN 
                    ALTER TABLE vilas ADD COLUMN conta_id INTEGER REFERENCES contas(id); 
                    RAISE NOTICE 'Coluna conta_id adicionada na tabela vilas';
                ELSE 
                    RAISE NOTICE 'Coluna conta_id já existe na tabela vilas';
                END IF; 
            END $$;
        `);

        console.log('✅ Schema corrigido com sucesso!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro ao corrigir schema:', error);
        process.exit(1);
    }
}

fixSchema();
