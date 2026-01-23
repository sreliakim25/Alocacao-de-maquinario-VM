# Matriz de Permissões e Funcionalidades

Este documento lista todas as funcionalidades do sistema. Por favor, marque com **X** quais níveis de acesso devem ter permissão para cada ação.

**Níveis de Usuário (Da menor para maior hierarquia):**
1. **Apontador**: Acesso básico para registro.
2. **Suprimentos**: Acesso focado em visualização/relatórios (?).
3. **Supervisor**: Coordenação de equipe de campo.
4. **Líder**: Gestão intermediária.
5. **Gerente**: Gestão geral.
6. **Administrador**: Controle do sistema.
7. **Desenvolvedor**: Acesso irrestrito.

---

## 1. Apontamentos (Lançamentos Diários)

| Ação | Apontador | Suprimentos | Supervisor | Líder | Gerente | Administrador | Desenvolvedor |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Visualizar Meus Apontamentos** | [x] | [x] | [x] | [x] | [x] | [x] | [x] |
| **Visualizar Todos (Da sua UGB/Obra)** | [x] | [x]| [x] | [x] | [x] | [x] | [x] |
| **Visualizar GERAL (Todas as UGBs)** | [] | [] | [] | [] | [] | [x] | [x] |
| **Criar Novo Apontamento** | [x] | [x] | [] | [] | [] | [x] | [x] |
| **Editar Apontamento (Correção)** | [x] | [ ] | [] | [] | [] | [x] | [x] |
| **Deletar/Excluir Apontamento** | [x] | [x] | [] | [] | [] | [x] | [x] |
| **Validar/Aprovar Apontamento** | [x] | [x] | [x] | [x] | [] | [x] | [x] |
| **Exportar Relatórios (Excel/PDF)** | [ ] | [x] | [x] | [x] | [x] | [x] | [x] |
| **Ver Dashboard de KPIs** | [x] | [x] | [x] | [x] | [x] | [x] | [x] |

## 2. Maquinário e Equipamentos

| Ação | Apontador | Suprimentos | Supervisor | Líder | Gerente | Administrador | Desenvolvedor |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Visualizar Lista de Máquinas** | [x] | [x] | [x] | [x] | [x] | [x] | [x] |
| **Cadastrar Nova Máquina** | [ ] | [x] | [] | [] | [] | [x] | [x] |
| **Editar Dados da Máquina** | [ ] | [x] | [] | [] | [] | [x] | [x] |
| **Inativar/Excluir Máquina** | [ ] | [x] | [ ] | [] | [] | [x] | [x] |

## 3. Cadastros Gerais (Locais, Estrutura)
*Inclui: Vilas, Etapas, Sub-etapas, Tarefas, Supervisores, UGBs.*

| Ação | Apontador | Suprimentos | Supervisor | Líder | Gerente | Administrador | Desenvolvedor |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Visualizar Cadastros** | [x] | [x] | [x] | [x] | [x] | [x] | [x] |
| **Criar Novos Itens (Vila/Etapa/etc)** | [ ] | [ ] | [] | [] | [] | [x] | [x] |
| **Editar Itens Existentes** | [ ] | [ ] | [] | [] | [] | [x] | [x] |
| **Excluir Itens** | [ ] | [ ] | [ ] | [] | [] | [x] | [x] |
| **Importar Planilha Mestre** | [ ] | [ ] | [ ] | [] | [] | [x] | [x] |

## 4. Gestão de Usuários (Equipe)

| Ação | Apontador | Suprimentos | Supervisor | Líder | Gerente | Administrador | Desenvolvedor |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Visualizar Lista de Usuários** | [ ] | [] | [] | [] | [x] | [x] | [x] |
| **Editar Próprio Perfil (Senha/Foto)**| [x] | [x] | [x] | [x] | [x] | [x] | [x] |
| **Criar Novo Usuário (Sistema)** | [ ] | [ ] | [ ] | [ ] | [] | [x] | [x] |
| **Alterar Nível/Cargo de Outros** | [ ] | [ ] | [ ] | [ ] | [] | [x] | [x] |
| **Alterar UGB/Obra de Outros** | [ ] | [ ] | [ ] | [] | [] | [x] | [x] |
| **Resetar Senha de Outros** | [ ] | [ ] | [ ] | [] | [] | [x] | [x] |

## 5. Sistema / Administrativo

| Ação | Apontador | Suprimentos | Supervisor | Líder | Gerente | Administrador | Desenvolvedor |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Resetar Banco de Dados (Perigo)** | [ ] | [ ] | [ ] | [ ] | [] | [ ] | [x] |

---

### Observações Adicionais:
* Descreva aqui qualquer regra específica (ex: "Supervisor só pode ver apontamentos da sua própria UGB, mas Gerente vê de todas").
* O usuário só poderá ter acesso às informações da UGB em que estiver no seu cadastro.

## Fluxo de Aprovação de Apontamentos

O sistema segue um fluxo hierárquico de aprovação para garantir a integridade dos dados antes da alocação final.

### 1. Apontador (Início)
- **Ação**: Cria o apontamento e preenche os dados.
- **Status Inicial**: `em_apontamento` (Rascunho).
- **Transição**: Ao finalizar, clica em "Liberar". O status muda para `liberado_apontador`.

### 2. Supervisor (Validação Técnica)
- **Visibilidade**: Visualize apenas apontamentos `liberado_apontador`.
- **Aprovação**: Verifica os dados. Se correto, aprova.
  - **Status**: Muda para `pendente_lider`.
- **Reprovação**: Se incorreto, reprova com motivo obrigatório.
  - **Status**: Retorna para `em_apontamento`.

### 3. Líder (Validação Gerencial)
- **Visibilidade**: Visualiza apenas apontamentos `pendente_lider`.
- **Aprovação**: Valida a necessidade/alocação. Se correto, aprova.
  - **Status**: Muda para `aprovado`.
- **Reprovação**: Se incorreto, reprova com motivo obrigatório.
  - **Status**: Retorna para `em_apontamento`.

### 4. Suprimentos (Alocação Final)
- **Visibilidade**: Visualiza apenas apontamentos `aprovado`.
- **Ação**: Realiza a alocação no sistema externo (Extranet).
- **Reprovação**: Caso encontre inconsistências finais, pode reprovar.
  - **Status**: Retorna para `em_apontamento`.

### Regra de Correção
- Sempre que um apontamento é reprovado (por qualquer papel), ele retorna para o status `em_apontamento`.
- O Apontador deve corrigir as observações e liberar novamente.
- O fluxo reinicia (Supervisor -> Líder -> Suprimentos) para garantir que as correções sejam validadas por todas as instâncias.