-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    telefone TEXT,
    foto_url TEXT,
    nivel_acesso TEXT CHECK(nivel_acesso IN ('Apontador', 'Supervisor', 'Líder', 'Suprimentos', 'Gerente', 'Desenvolvedor')) NOT NULL DEFAULT 'Apontador',
    ativo BOOLEAN DEFAULT true,
    conta_id INTEGER,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Máquinas
CREATE TABLE IF NOT EXISTS maquinas (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    tipo TEXT,
    placa TEXT,
    ativo BOOLEAN DEFAULT true,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Contas (UGB) — deve vir antes de vilas
CREATE TABLE IF NOT EXISTS contas (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true
);

-- Tabela de Vilas
CREATE TABLE IF NOT EXISTS vilas (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    conta_id INTEGER REFERENCES contas(id), -- Vincula Vila à UGB (Conta)
    ativo BOOLEAN DEFAULT true
);

-- Tabela de Etapas
CREATE TABLE IF NOT EXISTS etapas (
    id SERIAL PRIMARY KEY,
    nome TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true
);

-- Tabela de Sub-Etapas
CREATE TABLE IF NOT EXISTS sub_etapas (
    id SERIAL PRIMARY KEY,
    etapa_id INTEGER NOT NULL REFERENCES etapas(id),
    nome TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true
);

-- Tabela de Sub-Contas
CREATE TABLE IF NOT EXISTS sub_contas (
    id SERIAL PRIMARY KEY,
    conta_id INTEGER NOT NULL REFERENCES contas(id),
    nome TEXT NOT NULL,
    ativo BOOLEAN DEFAULT true
);

-- Tabela de Apontamentos
CREATE TABLE IF NOT EXISTS apontamentos (
    id SERIAL PRIMARY KEY,
    data_apontamento DATE NOT NULL,
    maquina_id INTEGER NOT NULL REFERENCES maquinas(id),
    operador TEXT NOT NULL,
    apontador_id INTEGER NOT NULL REFERENCES usuarios(id),
    status TEXT CHECK(status IN ('em_apontamento', 'liberado_apontador', 'pendente_supervisor', 'pendente_lider', 'aprovado')) DEFAULT 'em_apontamento',
    observacoes TEXT,
    criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Linhas de Apontamento
CREATE TABLE IF NOT EXISTS apontamento_linhas (
    id SERIAL PRIMARY KEY,
    apontamento_id INTEGER NOT NULL REFERENCES apontamentos(id) ON DELETE CASCADE,
    vila_id INTEGER NOT NULL REFERENCES vilas(id),
    etapa_id INTEGER NOT NULL REFERENCES etapas(id),
    sub_etapa_id INTEGER REFERENCES sub_etapas(id),
    conta_id INTEGER NOT NULL REFERENCES contas(id),
    sub_conta_id INTEGER REFERENCES sub_contas(id),
    supervisor TEXT,
    inicio TIME NOT NULL,
    fim TIME NOT NULL,
    horas_trabalhadas REAL
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_apontamentos_data ON apontamentos(data_apontamento);
CREATE INDEX IF NOT EXISTS idx_apontamentos_status ON apontamentos(status);
CREATE INDEX IF NOT EXISTS idx_apontamentos_apontador ON apontamentos(apontador_id);
CREATE INDEX IF NOT EXISTS idx_apontamento_linhas_apontamento ON apontamento_linhas(apontamento_id);
