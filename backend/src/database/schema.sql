-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha_hash TEXT NOT NULL,
    telefone TEXT,
    foto_url TEXT,
    nivel_acesso TEXT CHECK(nivel_acesso IN ('Apontador', 'Supervisor', 'Líder', 'Suprimentos', 'Gerente', 'Desenvolvedor')) NOT NULL DEFAULT 'Apontador',
    ativo BOOLEAN DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Máquinas
CREATE TABLE IF NOT EXISTS maquinas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    tipo TEXT,
    placa TEXT,
    ativo BOOLEAN DEFAULT 1,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Vilas
CREATE TABLE IF NOT EXISTS vilas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    ativo BOOLEAN DEFAULT 1
);

-- Tabela de Etapas
CREATE TABLE IF NOT EXISTS etapas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    ativo BOOLEAN DEFAULT 1
);

-- Tabela de Sub-Etapas
CREATE TABLE IF NOT EXISTS sub_etapas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    etapa_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    ativo BOOLEAN DEFAULT 1,
    FOREIGN KEY (etapa_id) REFERENCES etapas(id)
);

-- Tabela de Contas
CREATE TABLE IF NOT EXISTS contas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    ativo BOOLEAN DEFAULT 1
);

-- Tabela de Sub-Contas
CREATE TABLE IF NOT EXISTS sub_contas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    conta_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    ativo BOOLEAN DEFAULT 1,
    FOREIGN KEY (conta_id) REFERENCES contas(id)
);

-- Tabela de Apontamentos
CREATE TABLE IF NOT EXISTS apontamentos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data_apontamento DATE NOT NULL,
    maquina_id INTEGER NOT NULL,
    operador TEXT NOT NULL,
    apontador_id INTEGER NOT NULL,
    status TEXT CHECK(status IN ('em_apontamento', 'liberado_apontador', 'pendente_supervisor', 'pendente_lider', 'aprovado')) DEFAULT 'em_apontamento',
    observacoes TEXT,
    criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (maquina_id) REFERENCES maquinas(id),
    FOREIGN KEY (apontador_id) REFERENCES usuarios(id)
);

-- Tabela de Linhas de Apontamento
CREATE TABLE IF NOT EXISTS apontamento_linhas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    apontamento_id INTEGER NOT NULL,
    vila_id INTEGER NOT NULL,
    etapa_id INTEGER NOT NULL,
    sub_etapa_id INTEGER,
    conta_id INTEGER NOT NULL,
    sub_conta_id INTEGER,
    supervisor TEXT,
    inicio TIME NOT NULL,
    fim TIME NOT NULL,
    horas_trabalhadas REAL,
    FOREIGN KEY (apontamento_id) REFERENCES apontamentos(id) ON DELETE CASCADE,
    FOREIGN KEY (vila_id) REFERENCES vilas(id),
    FOREIGN KEY (etapa_id) REFERENCES etapas(id),
    FOREIGN KEY (sub_etapa_id) REFERENCES sub_etapas(id),
    FOREIGN KEY (conta_id) REFERENCES contas(id),
    FOREIGN KEY (sub_conta_id) REFERENCES sub_contas(id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_apontamentos_data ON apontamentos(data_apontamento);
CREATE INDEX IF NOT EXISTS idx_apontamentos_status ON apontamentos(status);
CREATE INDEX IF NOT EXISTS idx_apontamentos_apontador ON apontamentos(apontador_id);
CREATE INDEX IF NOT EXISTS idx_apontamento_linhas_apontamento ON apontamento_linhas(apontamento_id);
