const { runMigrations } = require('../config/database');

console.log('🔄 Executando migrações...');

try {
    runMigrations();
    console.log('✅ Migrações concluídas!');
    process.exit(0);
} catch (error) {
    console.error('❌ Erro nas migrações:', error);
    process.exit(1);
}
