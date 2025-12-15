const { db } = require('../config/database');
const bcrypt = require('bcrypt');

async function runSeeds() {
    console.log('🌱 Populando banco de dados...');

    try {
        // 1. Criar usuário admin
        const adminPassword = await bcrypt.hash('admin123', 10);

        const insertAdmin = db.prepare(`
            INSERT OR IGNORE INTO usuarios (nome, email, senha_hash, nivel_acesso, ativo)
            VALUES (?, ?, ?, ?, ?)
        `);

        insertAdmin.run(
            'Admin Sistema',
            'admin@vianaemoura.com',
            adminPassword,
            'Desenvolvedor',
            1
        );

        // 2. Criar maquinários de exemplo
        const insertMaq = db.prepare(`
            INSERT OR IGNORE INTO maquinas (nome, tipo, placa, ativo)
            VALUES (?, ?, ?, ?)
        `);

        insertMaq.run('Retro-05', 'Retroescavadeira', 'ABC-1234', 1);
        insertMaq.run('PC-01', 'Pá Carregadeira', 'XYZ-5678', 1);
        insertMaq.run('Pipa-02', 'Caminhão Pipa', 'DEF-9012', 1);

        // 3. Criar vilas
        const insertVila = db.prepare(`
            INSERT OR IGNORE INTO vilas (nome, ativo) VALUES (?, ?)
        `);

        insertVila.run('Vila A', 1);
        insertVila.run('Vila B', 1);
        insertVila.run('Vila C', 1);

        // 4. Criar etapas
        const insertEtapa = db.prepare(`
            INSERT OR IGNORE INTO etapas (nome, ativo) VALUES (?, ?)
        `);

        insertEtapa.run('Terraplanagem', 1);
        insertEtapa.run('Infraestrutura', 1);
        insertEtapa.run('Pavimentação', 1);

        // 5. Criar sub-etapas
        const insertSubEtapa = db.prepare(`
            INSERT OR IGNORE INTO sub_etapas (etapa_id, nome, ativo) VALUES (?, ?, ?)
        `);

        insertSubEtapa.run(1, 'Escavação', 1);
        insertSubEtapa.run(1, 'Aterro', 1);
        insertSubEtapa.run(2, 'Drenagem', 1);
        insertSubEtapa.run(2, 'Água', 1);

        // 6. Criar contas
        const insertConta = db.prepare(`
            INSERT OR IGNORE INTO contas (nome, ativo) VALUES (?, ?)
        `);

        insertConta.run('Conta Obra', 1);
        insertConta.run('Conta Manutenção', 1);

        // 7. Criar sub-contas
        const insertSubConta = db.prepare(`
            INSERT OR IGNORE INTO sub_contas (conta_id, nome, ativo) VALUES (?, ?, ?)
        `);

        insertSubConta.run(1, 'Materiais', 1);
        insertSubConta.run(1, 'Equipamentos', 1);
        insertSubConta.run(2, 'Preventiva', 1);
        insertSubConta.run(2, 'Corretiva', 1);

        console.log('✅ Seeds executados com sucesso!');
        console.log('📧 Login: admin@vianaemoura.com');
        console.log('🔑 Senha: admin123');

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
