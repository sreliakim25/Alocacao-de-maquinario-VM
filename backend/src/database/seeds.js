const { db } = require('../config/database');
const bcrypt = require('bcrypt');

async function runSeeds() {
    console.log('🌱 Populando banco de dados...');

    try {
        // 1. Criar usuário admin
        const adminPassword = await bcrypt.hash('admin123', 10);

        const insertAdmin = `
            INSERT INTO usuarios (nome, email, senha_hash, nivel_acesso, ativo)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (email) DO NOTHING
        `;

        await db.query(insertAdmin, [
            'Admin Sistema',
            'admin@vianaemoura.com',
            adminPassword,
            'Desenvolvedor',
            true
        ]);

        // 2. Criar maquinários de exemplo
        const insertMaq = `
            INSERT INTO maquinas (nome, tipo, placa, ativo)
            VALUES ($1, $2, $3, $4)
        `;

        await db.query(insertMaq, ['Retro-05', 'Retroescavadeira', 'ABC-1234', true]);
        await db.query(insertMaq, ['PC-01', 'Pá Carregadeira', 'XYZ-5678', true]);
        await db.query(insertMaq, ['Pipa-02', 'Caminhão Pipa', 'DEF-9012', true]);

        // 3. Criar vilas
        const insertVila = `INSERT INTO vilas (nome, ativo) VALUES ($1, $2)`;

        await db.query(insertVila, ['Vila A', true]);
        await db.query(insertVila, ['Vila B', true]);
        await db.query(insertVila, ['Vila C', true]);

        // 4. Criar etapas
        const insertEtapa = `INSERT INTO etapas (nome, ativo) VALUES ($1, $2)`;

        await db.query(insertEtapa, ['Terraplanagem', true]);
        await db.query(insertEtapa, ['Infraestrutura', true]);
        await db.query(insertEtapa, ['Pavimentação', true]);

        // 5. Criar sub-etapas
        const insertSubEtapa = `INSERT INTO sub_etapas (etapa_id, nome, ativo) VALUES ($1, $2, $3)`;

        await db.query(insertSubEtapa, [1, 'Escavação', true]);
        await db.query(insertSubEtapa, [1, 'Aterro', true]);
        await db.query(insertSubEtapa, [2, 'Drenagem', true]);
        await db.query(insertSubEtapa, [2, 'Água', true]);

        // 6. Criar contas
        const insertConta = `INSERT INTO contas (nome, ativo) VALUES ($1, $2)`;

        await db.query(insertConta, ['Conta Obra', true]);
        await db.query(insertConta, ['Conta Manutenção', true]);

        // 7. Criar sub-contas
        const insertSubConta = `INSERT INTO sub_contas (conta_id, nome, ativo) VALUES ($1, $2, $3)`;

        await db.query(insertSubConta, [1, 'Materiais', true]);
        await db.query(insertSubConta, [1, 'Equipamentos', true]);
        await db.query(insertSubConta, [2, 'Preventiva', true]);
        await db.query(insertSubConta, [2, 'Corretiva', true]);

        console.log('✅ Seeds executados com sucesso!');
        // 2. Criar Usuário Desenvolvedor (Solicitado)
        const devEmail = 'desenvolvedor@vianaemora.com.br';
        const hashedPasswordDev = await bcrypt.hash('Dev.vm2026@', 10);

        await db.query(`
            INSERT INTO usuarios (nome, email, senha_hash, nivel_acesso, ativo)
            VALUES ($1, $2, $3, 'Desenvolvedor', true)
            ON CONFLICT (email) DO UPDATE SET senha_hash = $3
        `, ['Desenvolvedor Master', devEmail, hashedPasswordDev]);

        console.log('📧 Login Dev: desenvolvedor@vianaemora.com.br');
        console.log('🔑 Senha Dev: Dev.vm2026@');

    } catch (error) {
        console.error('❌ Erro ao executar seeds:', error.message);
        throw error;
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    runSeeds()
        .then(() => {
            console.log('🎉 Banco de dados populado!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 Erro:', error);
            process.exit(1);
        });
}

module.exports = { runSeeds };
