const { runMigrations } = require('../config/database');

console.log('🔄 Executando migrações...');

(async () => {
    try {
        await runMigrations();
        console.log('✅ Migrações concluídas!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Erro nas migrações:', error);
        process.exit(1);
    }
})();
