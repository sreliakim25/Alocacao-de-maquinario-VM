# Sistema de Apontamento de Maquinário

Sistema para gerenciamento e acompanhamento de apontamentos de maquinário, desenvolvido com React e Vite.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado em sua máquina:

- [Node.js](https://nodejs.org/) (versão 18 ou superior)
- npm (geralmente vem com o Node.js)

## 🚀 Como Rodar o Projeto

### 1. Instalação das Dependências

Primeiro, navegue até a pasta do projeto e instale as dependências:

```bash
cd frontend
npm install
```

### 2. Executar em Modo de Desenvolvimento

Para rodar o projeto localmente em modo de desenvolvimento:

```bash
npm run dev
```

O aplicativo estará disponível em: **http://localhost:3005/**

A aplicação possui Hot Module Replacement (HMR), ou seja, as alterações no código serão refletidas automaticamente no navegador.

### 3. Build para Produção

Para criar uma versão otimizada para produção:

```bash
npm run build
```

### 4. Visualizar Build de Produção

Para visualizar o build de produção localmente:

```bash
npm run preview
```

## 📁 Estrutura do Projeto

```
frontend/
├── src/
│   ├── components/     # Componentes reutilizáveis
│   ├── pages/          # Páginas da aplicação
│   ├── store/          # Gerenciamento de estado (Zustand)
│   ├── App.jsx         # Componente principal
│   └── main.jsx        # Ponto de entrada
├── public/             # Arquivos estáticos
└── index.html          # HTML base
```

## 🛠️ Tecnologias Utilizadas

- **React** - Biblioteca para construção de interfaces
- **Vite** - Build tool e dev server
- **Material-UI** - Componentes de UI
- **Zustand** - Gerenciamento de estado
- **React Router** - Roteamento
- **Recharts** - Gráficos e visualizações
- **date-fns** - Manipulação de datas

## 📜 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria o build de produção
- `npm run preview` - Visualiza o build de produção
- `npm run lint` - Executa o ESLint para verificar código

## 🔧 Configuração

O projeto está configurado com:
- ESLint para análise de código
- Vite para build rápido
- React Router para navegação
- Material-UI para componentes prontos

## 📝 Funcionalidades

- Dashboard com KPIs e gráficos
- Registro de apontamentos
- Lista de apontamentos com filtros
- Gerenciamento de máquinas, operadores e vilas
- Interface responsiva e moderna
