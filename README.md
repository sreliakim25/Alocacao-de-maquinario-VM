# Apontamento de Maquinário - Sistema de Gestão

Sistema web para gestão e apontamento de maquinário em obras de construção civil, desenvolvido para Viana e Moura.

## 📋 Funcionalidades

- **Dashboard Interativo**: Visualização de KPIs e métricas de utilização de maquinário
- **Gestão de Maquinários**: Cadastro e gerenciamento de equipamentos
- **Apontamentos**: Registro detalhado de uso de máquinas por obra, etapa e operador  
- **Lista de Apontamentos**: Consulta e histórico de registros
- **Configurações**: Customização do sistema e preferências do usuário
- **Tema Dark/Light**: Interface adaptável com suporte a modo escuro

## 🚀 Tecnologias

### Frontend
- **React 19.2** com Vite
- **Material-UI (MUI)** para componentes e design system
- **Zustand** para gerenciamento de estado
- **React Router DOM** para navegação
- **Recharts** para visualização de dados
- **date-fns** para manipulação de datas

### Backend
- **PostgreSQL** (schema em `backend/src/database/schema.sql`)

## 💻 Desenvolvimento Local

### Pré-requisitos
- Node.js 18.x ou superior
- npm ou yarn

### Instalação

1. Clone o repositório:
```bash
git clone https://github.com/sreliakim25/Alocacao-de-maquinario-VM.git
cd "Apontamento de Maquinário"
```

2. Instale as dependências do frontend:
```bash
cd frontend
npm install
```

3. Execute o servidor de desenvolvimento:
```bash
npm run dev
```

O aplicativo estará disponível em `http://localhost:3005`

### Credenciais de Acesso (Desenvolvimento)

Ao popular o banco de dados inicial (verifique o arquivo de seeds), os seguintes usuários são criados para testes:

- **Admin / Desenvolvedor**
  - Email: `admin@vianaemoura.com`
  - Senha: `admin123`
- **Desenvolvedor Master**
  - Email: `desenvolvedor@vianaemora.com.br`
  - Senha: `Dev.vm2026@`
- **Administrador**
  - Email: `adm.processos@vianaemoura.com.br`
  - Senha: `123456`
- **Supervisor**
  - Email: `supervisor@vianaemoura.com.br`
  - Senha: `123456`
- **Líder**
  - Email: `lider@vianaemoura.com.br`
  - Senha: `123456`
- **Suprimentos**
  - Email: `suprimentos@vianaemoura.com.br`
  - Senha: `123456`
- **Apontador**
  - Email: `apontador@vianaemoura.com.br`
  - Senha: `123456`

### Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Cria build de produção
- `npm run preview` - Preview do build de produção
- `npm run lint` - Executa linter ESLint

## 🌐 Deploy no Vercel

### Passo 1: Preparação
Certifique-se de que o código está no GitHub (já configurado).

### Passo 2: Importar no Vercel

1. Acesse [vercel.com](https://vercel.com) e faça login
2. Clique em "New Project"
3. Importe o repositório: `sreliakim25/Alocacao-de-maquinario-VM`

### Passo 3: Configuração

O Vercel detectará automaticamente o Vite. Configure:

- **Framework Preset**: Vite
- **Root Directory**: `frontend`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Passo 4: Deploy

Clique em "Deploy" e aguarde a conclusão. O Vercel fornecerá uma URL pública para sua aplicação.

### Atualizações Automáticas

Após o setup inicial, cada push para a branch `main` acionará automaticamente um novo deploy no Vercel.

## 📁 Estrutura do Projeto

```
Apontamento de Maquinário/
├── backend/
│   └── src/
│       └── database/
│           └── schema.sql
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── MainLayout.jsx
│   │   │   └── dashboard/
│   │   │       └── KPICard.jsx
│   │   ├── hooks/
│   │   │   └── useKPIs.js
│   │   ├── pages/
│   │   │   ├── Apontamento.jsx
│   │   │   ├── Configuracoes.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ListaApontamentos.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Maquinarios.jsx
│   │   ├── store/
│   │   │   ├── apontamentoStore.js
│   │   │   ├── authStore.js
│   │   │   ├── maquinarioStore.js
│   │   │   └── themeStore.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── theme.js
│   ├── package.json
│   └── vite.config.js
└── .gitignore
```

## 📝 Licença

Projeto proprietário - Viana e Moura © 2025

## 👥 Autor

Desenvolvido para Viana e Moura - Construção Civil
