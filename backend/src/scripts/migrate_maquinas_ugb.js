/**
 * Migração: adicionar ugb_id na tabela maquinas
 * e limpar dados de teste (maquinas, checklists, apontamentos)
 *
 * Como usar:
 *   cd backend && node src/scripts/migrate_maquinas_ugb.js
 */

require('dotenv').config();
const supabase = require('../config/supabase');

async function run() {
    console.log('🚀 Iniciando migração de produção...\n');

    // ── 1. Limpar dados de teste ──────────────────────────────────────
    console.log('🗑️  Removendo dados de teste...');

    const { error: e1 } = await supabase.from('machine_checklists').delete().neq('id', 0);
    if (e1) { console.error('Erro ao limpar checklists:', e1.message); process.exit(1); }
    console.log('  ✓ machine_checklists limpa');

    const { error: e2 } = await supabase.from('apontamento_linhas').delete().neq('id', 0);
    if (e2) { console.error('Erro ao limpar apontamento_linhas:', e2.message); process.exit(1); }
    console.log('  ✓ apontamento_linhas limpa');

    const { error: e3 } = await supabase.from('apontamentos').delete().neq('id', 0);
    if (e3) { console.error('Erro ao limpar apontamentos:', e3.message); process.exit(1); }
    console.log('  ✓ apontamentos limpa');

    const { error: e4 } = await supabase.from('maquinas').delete().neq('id', 0);
    if (e4) { console.error('Erro ao limpar maquinas:', e4.message); process.exit(1); }
    console.log('  ✓ maquinas limpa');

    // ── 2. Adicionar coluna ugb_id via SQL direto ─────────────────────
    // ATENÇÃO: O Supabase não expõe DDL via client JS.
    // Execute o SQL abaixo diretamente no Supabase Dashboard > SQL Editor:
    console.log('\n📋 PRÓXIMO PASSO — Execute no Supabase Dashboard > SQL Editor:\n');
    console.log('─'.repeat(60));
    console.log(`
-- Adiciona ugb_id na tabela maquinas (FK para ugbs)
ALTER TABLE maquinas
  ADD COLUMN IF NOT EXISTS ugb_id INTEGER REFERENCES ugbs(id) ON DELETE SET NULL;

-- Índice para performance nas queries de filtro
CREATE INDEX IF NOT EXISTS idx_maquinas_ugb_id ON maquinas(ugb_id);
`);
    console.log('─'.repeat(60));
    console.log('\n✅ Dados de teste removidos com sucesso.');
    console.log('⚠️  Execute o SQL acima no Supabase antes de iniciar o sistema em produção.');
}

run().catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
});
