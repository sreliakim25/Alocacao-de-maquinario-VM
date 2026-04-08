# Sistema de Apontamento de Maquinários — Viana & Moura

Sistema web completo para **gestão, apontamento e controle de maquinários** em obras de construção civil, desenvolvido exclusivamente para a **Viana & Moura**. O sistema digitaliza e centraliza o processo de registro de uso de equipamentos por obra, etapa e operador, substituindo planilhas e controles manuais por um fluxo digital com aprovações hierárquicas em tempo real.

---

## Por que este sistema existe

Obras de grande porte utilizam dezenas de maquinários simultaneamente em diferentes frentes. Controlar **quem usou qual equipamento, em qual vila, em qual etapa, por quantas horas**, e garantir que esse dado seja validado por supervisores e líderes antes de gerar custo — é um desafio operacional crítico.

Este sistema resolve isso com:
- Registro digital de apontamentos diários por equipe
- Fluxo de aprovação em múltiplos níveis (Apontador → Supervisor → Líder → Gerente)
- Dashboard com KPIs e métricas de utilização em tempo real
- Gestão de usuários com permissões por hierarquia
- Acesso mobile via PWA instalável (sem App Store)

---

## Módulos do sistema

### 1. Dashboard
Visão executiva com indicadores de desempenho:
- Total de horas apontadas no período
- Maquinários ativos vs. inativos
- Apontamentos por status (em andamento, pendentes, aprovados)
- Gráficos de utilização por equipamento e por vila
- Filtros por data e UGB

### 2. Apontamentos
Módulo central do sistema. Permite registrar o uso diário de um maquinário:
- Seleção de máquina, operador e data
- Registro de múltiplas linhas por apontamento (vila, etapa, sub-etapa, conta, sub-conta, horário início/fim)
- Cálculo automático de horas trabalhadas
- Fluxo de aprovação com status progressivos:
  - `em_apontamento` → `liberado_apontador` → `pendente_supervisor` → `pendente_lider` → `aprovado`
- Cada nível de hierarquia aprova ou rejeita (com justificativa)

### 3. Lista de Apontamentos
Histórico completo com filtros:
- Por data, máquina, status, operador
- Exportação de dados
- Visualização detalhada de cada apontamento e suas linhas

### 4. Maquinários
Cadastro e gestão do parque de equipamentos:
- Cadastro com nome, tipo, placa, operador padrão, fornecedor, setor e foto
- Switch ativo/inativo (inativo não aparece em novos apontamentos)
- Duas visualizações: grade (miniaturas) e lista (tabela)
- Separação visual entre ativos e inativos
- Botão de Checklist de Segurança (módulo futuro)
- Tipos suportados: Retroescavadeira, Pá Carregadeira, Caminhão Pipa, Escavadeira Hidráulica, Motoniveladora, Rolo Compactador, Caminhão Caçamba

### 5. Cadastros Gerais
Tabelas de apoio editáveis pelo administrador:
- **Vilas** — frentes de obra vinculadas à UGB
- **Etapas** — fases da obra
- **Sub-etapas** — subdivisões das etapas
- **Contas / Sub-contas** — centros de custo

### 6. Gerenciamento de Usuários *(Gerente e acima)*
- Lista de todos os usuários com status e nível de acesso
- Filtros: todos / ativos / pendentes de aprovação
- **Fluxo de aprovação de novos usuários**: usuário se cadastra → admin aprova → sistema gera senha provisória → envia por e-mail automaticamente
- Ativar / desativar contas
- Redefinir senha de usuários
- Alerta de usuários aguardando aprovação

### 7. Configurações (Perfil)
- Foto de perfil com upload
- Edição de nome, e-mail e telefone
- Alteração de senha (com verificação da senha atual)
- Tipo de acesso read-only (definido pelo administrador)
- Chip de nível de acesso visível no menu

---

## Hierarquia de Permissões

| Nível | Papel | Pode |
|---|---|---|
| 7 | **Desenvolvedor** | Tudo |
| 7 | **Administrador** | Tudo |
| 6 | **Gerente** | Aprovar apontamentos, gerenciar usuários, cadastrar maquinários |
| 5 | **Líder** | Aprovar apontamentos do seu nível |
| 4 | **Supervisor** | Aprovar apontamentos do seu nível |
| 3 | **Suprimentos** | Cadastrar e editar maquinários |
| 2 | **Apontador** | Criar e submeter apontamentos |

---

## Fluxo de Cadastro de Novo Usuário

```
Usuário preenche formulário (nome, e-mail, UGB, tipo de acesso)
        ↓
Sistema salva como "pendente de aprovação"
        ↓
Administrador recebe alerta e aprova
        ↓
Sistema gera senha provisória automaticamente
        ↓
E-mail enviado ao usuário com a senha (via Resend)
        ↓
Usuário faz login e pode alterar a senha em Configurações
```

---

## Stack Tecnológica

### Frontend
| Tecnologia | Versão | Uso |
|---|---|---|
| React | 19.2 | Framework de interface |
| Vite | 7.x | Build tool e dev server |
| Material UI (MUI) | 7.x | Design system e componentes |
| Zustand | 5.x | Gerenciamento de estado global |
| React Router DOM | 7.x | Navegação entre páginas |
| Recharts | 3.x | Gráficos e visualizações |
| date-fns | 4.x | Manipulação de datas |
| vite-plugin-pwa | — | Service Worker e manifest PWA |

### Backend
| Tecnologia | Versão | Uso |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 5.x | Framework HTTP |
| Supabase | 2.x | Banco de dados PostgreSQL gerenciado |
| JWT (jsonwebtoken) | 9.x | Autenticação stateless |
| bcrypt | 6.x | Hash de senhas |
| Resend SDK | 6.x | Envio de e-mails transacionais |

### Infraestrutura
| Serviço | Uso |
|---|---|
| **Vercel** | Deploy do frontend (CI/CD automático via GitHub) |
| **Railway** | Deploy do backend Node.js |
| **Supabase** | Banco de dados PostgreSQL em nuvem |
| **Resend** | E-mails transacionais (aprovação, senha, reset) |

---

## Banco de Dados

### Tabelas principais

| Tabela | Descrição |
|---|---|
| `usuarios` | Usuários do sistema com nível de acesso e vínculo à UGB |
| `maquinas` | Cadastro de equipamentos com status ativo/inativo |
| `apontamentos` | Cabeçalho do apontamento diário (máquina, operador, data, status) |
| `apontamento_linhas` | Linhas detalhadas do apontamento (vila, etapa, horários) |
| `contas` | UGBs (Unidades de Gestão de Base) |
| `vilas` | Frentes de obra vinculadas à UGB |
| `etapas` | Fases da obra |
| `sub_etapas` | Subdivisões das etapas |
| `sub_contas` | Centros de custo subordinados |
| `password_resets` | Tokens temporários para redefinição de senha |

---

## PWA — Aplicativo Instalável

O sistema é um **Progressive Web App** completo. Funcionalidades:

- **Instalável** no celular e desktop sem App Store — o banner de instalação aparece automaticamente no primeiro acesso
- **Offline parcial** — páginas e assets já visitados ficam em cache e carregam sem internet
- **Atualização automática** — quando uma nova versão é publicada, o app exibe um banner e atualiza com um clique
- **Funciona como app nativo** — abre em tela cheia, sem barra do browser, com ícone na tela inicial

---

## Rodando localmente

### Pré-requisitos

- Node.js 18 ou superior
- npm
- Conta no Supabase com as tabelas criadas (schema em `backend/src/database/schema.sql`)

### 1. Clone o repositório

```bash
git clone https://github.com/sreliakim25/Alocacao-de-maquinario-VM.git
cd Alocacao-de-maquinario-VM
```

### 2. Configure o backend

```bash
cd backend
npm install
cp .env.example .env
```

Preencha o `.env` com suas credenciais:

```env
PORT=3001
NODE_ENV=development
JWT_SECRET=sua-string-secreta-longa
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
FRONTEND_URL=http://localhost:3005
RESEND_API_KEY=re_...
EMAIL_FROM=Sistema VM <noreply@seudominio.com>
```

Inicie o servidor:

```bash
npm run dev
```

Backend disponível em `http://localhost:3001`

### 3. Configure o frontend

```bash
cd frontend
npm install
```

Crie o arquivo `.env.local`:

```env
VITE_API_URL=http://localhost:3001
```

Inicie o servidor:

```bash
npm run dev
```

Frontend disponível em `http://localhost:3005`

### Scripts disponíveis

**Backend:**
| Script | Descrição |
|---|---|
| `npm run dev` | Inicia com nodemon (hot reload) |
| `npm start` | Inicia em modo produção |

**Frontend:**
| Script | Descrição |
|---|---|
| `npm run dev` | Inicia Vite dev server |
| `npm run build` | Gera build de produção em `/dist` |
| `npm run preview` | Serve o build local para teste |
| `npm run lint` | Verifica o código com ESLint |

---

## Deploy em Produção

### Frontend — Vercel

1. Importe o repositório no [vercel.com](https://vercel.com)
2. Configure:
   - **Root Directory:** `frontend`
   - **Framework:** Vite
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Adicione a variável de ambiente:
   ```
   VITE_API_URL=https://seu-backend.up.railway.app
   ```
4. O `vercel.json` já está configurado para SPA routing

### Backend — Railway

1. Crie um novo projeto em [railway.app](https://railway.app)
2. Conecte o repositório GitHub e defina o **Root Directory** como `backend`
3. O `railway.json` já está configurado — Railway detecta automaticamente
4. Adicione todas as variáveis do `.env.example` no painel de Variables
5. Gere o domínio público em **Settings → Networking → Generate Domain**
6. Healthcheck disponível em `/health`

---

## Estrutura do Projeto

```
Alocacao-de-maquinario-VM/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   └── supabase.js           # Cliente Supabase
│   │   ├── database/
│   │   │   └── schema.sql            # Schema completo do banco
│   │   ├── middleware/
│   │   │   ├── authMiddleware.js     # Validação JWT
│   │   │   └── permissionMiddleware.js # Controle de acesso por role
│   │   ├── routes/
│   │   │   ├── auth.js               # Login, registro, senha
│   │   │   ├── usuarios.js           # CRUD usuários + aprovação
│   │   │   ├── maquinas.js           # CRUD maquinários
│   │   │   ├── apontamentos.js       # CRUD apontamentos + fluxo
│   │   │   └── localizacoes.js       # Vilas, etapas, contas
│   │   ├── services/
│   │   │   └── emailService.js       # Envio de e-mails via Resend
│   │   └── server.js                 # Entry point + CORS + rotas
│   ├── .env.example                  # Template de variáveis de ambiente
│   ├── .gitignore
│   ├── railway.json                  # Configuração de deploy Railway
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   ├── favicon.png
│   │   ├── apple-touch-icon.png
│   │   ├── pwa-192x192.png
│   │   ├── pwa-512x512.png
│   │   └── pwa-maskable-512x512.png
│   ├── src/
│   │   ├── assets/                   # Imagens e recursos estáticos
│   │   ├── components/
│   │   │   ├── MainLayout.jsx        # Layout principal + sidebar + menu
│   │   │   ├── ProtectedRoute.jsx    # Guard de rotas autenticadas
│   │   │   ├── PWAPrompt.jsx         # Banners de instalação e atualização
│   │   │   └── dashboard/            # Componentes do dashboard
│   │   ├── pages/
│   │   │   ├── Login.jsx             # Tela de login
│   │   │   ├── Register.jsx          # Cadastro de novo usuário
│   │   │   ├── ForgotPassword.jsx    # Solicitar redefinição de senha
│   │   │   ├── ResetPassword.jsx     # Definir nova senha via token
│   │   │   ├── Dashboard.jsx         # Dashboard com KPIs e gráficos
│   │   │   ├── Apontamento.jsx       # Criar/editar apontamento
│   │   │   ├── ListaApontamentos.jsx # Histórico e filtros
│   │   │   ├── Maquinarios.jsx       # Cadastro de maquinários
│   │   │   ├── Cadastros.jsx         # Cadastros gerais (vilas, etapas)
│   │   │   ├── UserManagement.jsx    # Gestão de usuários
│   │   │   └── Configuracoes.jsx     # Perfil e configurações
│   │   ├── services/
│   │   │   └── api.js                # Camada de acesso à API REST
│   │   ├── store/
│   │   │   ├── authStore.js          # Estado de autenticação (Zustand)
│   │   │   ├── userStore.js          # Estado de usuários
│   │   │   ├── maquinarioStore.js    # Estado de maquinários
│   │   │   ├── apontamentoStore.js   # Estado de apontamentos
│   │   │   ├── localizacaoStore.js   # Estado de vilas/etapas
│   │   │   └── themeStore.js         # Tema claro/escuro
│   │   ├── App.jsx                   # Roteamento principal
│   │   ├── main.jsx                  # Entry point React
│   │   └── theme.js                  # Tema MUI customizado
│   ├── index.html                    # HTML com meta tags PWA
│   ├── vercel.json                   # SPA routing no Vercel
│   ├── vite.config.js                # Vite + plugin PWA
│   └── package.json
│
└── README.md
```

---

## API — Endpoints principais

| Método | Rota | Descrição | Acesso |
|---|---|---|---|
| `POST` | `/api/auth/login` | Autenticação | Público |
| `POST` | `/api/auth/register` | Solicitar acesso | Público |
| `POST` | `/api/auth/forgot-password` | Solicitar reset de senha | Público |
| `POST` | `/api/auth/reset-password` | Redefinir senha via token | Público |
| `POST` | `/api/auth/change-password` | Alterar senha autenticado | Autenticado |
| `GET` | `/api/usuarios` | Listar usuários | Gerente+ |
| `POST` | `/api/usuarios/:id/approve` | Aprovar usuário | Gerente+ |
| `GET` | `/api/maquinas` | Listar maquinários | Autenticado |
| `POST` | `/api/maquinas` | Cadastrar maquinário | Suprimentos+ |
| `PUT` | `/api/maquinas/:id` | Editar maquinário | Suprimentos+ |
| `DELETE` | `/api/maquinas/:id` | Remover maquinário | Suprimentos+ |
| `GET` | `/api/apontamentos` | Listar apontamentos | Autenticado |
| `POST` | `/api/apontamentos` | Criar apontamento | Apontador+ |
| `PUT` | `/api/apontamentos/:id/status` | Avançar status no fluxo | Supervisor+ |
| `GET` | `/api/localizacoes/vilas` | Listar vilas | Autenticado |
| `GET` | `/api/localizacoes/etapas` | Listar etapas | Autenticado |
| `GET` | `/health` | Health check | Público |

---

## Variáveis de Ambiente

### Backend (`.env`)

| Variável | Descrição |
|---|---|
| `PORT` | Porta do servidor (Railway define automaticamente) |
| `NODE_ENV` | `development` ou `production` |
| `JWT_SECRET` | Chave secreta para assinar tokens JWT |
| `SUPABASE_URL` | URL do projeto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave de serviço do Supabase (acesso total) |
| `FRONTEND_URL` | URL do frontend em produção (para CORS) |
| `VERCEL_PROJECT` | Nome do projeto no Vercel (aceita preview deploys) |
| `RESEND_API_KEY` | Chave da API do Resend para envio de e-mails |
| `EMAIL_FROM` | Remetente dos e-mails (ex: `Sistema VM <noreply@dominio.com>`) |

### Frontend (`.env.local`)

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | URL base do backend (ex: `https://backend.up.railway.app`) |

---

## Licença

Projeto proprietário — **Viana & Moura Construção Civil**.  
Todos os direitos reservados © 2025.
