# ELO

**Conectando equipes de campo e clientes.**

Plataforma de gestão de negociações em campo para equipes que mantêm contato
direto com clientes durante a rotina operacional. Com o ELO, colaboradores
acompanham clientes, registram negociações, anexam comprovantes, recebem
alertas de vencimento e mantêm o histórico completo de cada interação —
transformando processos hoje informais (WhatsApp, ligações, anotações
pessoais) em um fluxo estruturado, rastreável e orientado à recuperação de
receita.

---

## Sumário

1. [Descrição](#descrição)
2. [Funcionalidades](#funcionalidades)
3. [Arquitetura](#arquitetura)
4. [Banco de dados](#banco-de-dados)
5. [Estrutura de pastas](#estrutura-de-pastas)
6. [Instalação](#instalação)
7. [Configuração](#configuração)
8. [Deploy](#deploy)
9. [Segurança](#segurança)
10. [Tecnologias utilizadas](#tecnologias-utilizadas)
11. [Roadmap futuro](#roadmap-futuro)
12. [CONFIGURAÇÃO MANUAL](#configuração-manual)

---

## Descrição

O ELO funciona como um CRM especializado em negociações de campo. Ele
concentra em um único lugar:

- O cadastro completo de clientes e sua carteira;
- As negociações financeiras vinculadas a cada cliente (valor, vencimento,
  status, observações);
- Os comprovantes de pagamento e contas (fotos, PDFs), com OCR automático
  para extrair dados da conta fotografada;
- O histórico de interações (ligações, WhatsApp, visitas), incluindo
  geolocalização automática das visitas;
- Alertas automáticos de vencimento e um centro de notificações;
- Um dashboard executivo com indicadores e gráficos de desempenho.

A aplicação é uma **PWA (Progressive Web App)**, mobile first, instalável na
tela inicial de Android e iOS, funcionando como um aplicativo nativo mesmo
sendo 100% web.

---

## Funcionalidades

### Autenticação e perfis
- Login, cadastro e recuperação de senha via Supabase Auth.
- Dois perfis: **Administrador** (acesso total) e **Operador** (gerencia
  apenas os clientes vinculados a ele).

### Dashboard executivo
- Cards: clientes acompanhados, negociações ativas, valor negociado, valor
  recuperado, comprovantes pendentes, negociações vencidas.
- Gráficos: negociações por mês, recuperação de receita, clientes por
  status, evolução de pagamentos.

### Módulo Clientes
- CRUD completo (criar, editar, excluir, visualizar).
- Busca instantânea por matrícula, nome, telefone ou endereço.

### Módulo Negociações
- Registro e atualização de negociações, alteração de status, observações e
  histórico completo por cliente.

### Módulo Comprovantes
- Upload de JPG, PNG e PDF.
- Botão **"Capturar Foto"**, que abre a câmera nativa do dispositivo.
- Visualização, download e exclusão de arquivos.
- **OCR com Tesseract.js**: fotografe a conta, o sistema extrai
  automaticamente matrícula, nome, valor e data de vencimento, preenche o
  formulário de negociação e permite correções manuais antes de salvar.

### Interações e visitas
- Registro de ligações, WhatsApp, visitas e negociações.
- Em visitas, a geolocalização (latitude/longitude) é capturada
  automaticamente, com foto opcional.
- Histórico completo visível no perfil do cliente, com link direto para o
  mapa.

### Alertas automáticos
- Gerados 1 dia antes do vencimento e no dia do vencimento.
- Negociações vencidas são automaticamente marcadas como "Vencido".
- Central de notificações com filtros por status (Pendente/Enviado/Resolvido).

### Lembrete via WhatsApp
- Botão **"Enviar lembrete"** que monta a mensagem automaticamente e abre o
  WhatsApp Web/App com o número do cliente:

  > Olá, {nome}. Identificamos que a negociação vinculada à matrícula
  > {matricula} possui vencimento em {data}. Caso o pagamento já tenha sido
  > realizado, favor encaminhar o comprovante. Equipe ELO.

### Tela detalhada do cliente
- Dados cadastrais, negociações, comprovantes, interações, alertas e mapa em
  uma única visualização organizada por abas.

---

## Arquitetura

```
┌───────────────────────┐        ┌────────────────────────────┐
│   Cliente (Browser)    │        │          Supabase           │
│  React + TS + Vite     │◄──────►│  Auth · PostgreSQL · Storage│
│  Tailwind + shadcn/ui  │  HTTPS │       · Edge Functions       │
│  PWA (Service Worker)  │        │                              │
└───────────────────────┘        └────────────────────────────┘
         │
         ├─ Tesseract.js  → OCR executado 100% no navegador
         ├─ Geolocation API → captura de latitude/longitude
         └─ WhatsApp (wa.me) → deep link para lembretes
```

- **Frontend**: SPA React servida como site estático (Vercel), comunicando-se
  diretamente com o Supabase via `@supabase/supabase-js` (REST + Realtime
  sobre PostgREST), sem backend próprio.
- **Backend/BaaS**: Supabase provê banco de dados PostgreSQL, autenticação,
  armazenamento de arquivos (Storage) e Edge Functions para a rotina de
  alertas automáticos.
- **Segurança**: toda a regra de acesso (quem vê o quê) é garantida por
  **Row Level Security (RLS)** no banco — o frontend nunca decide sozinho o
  que o usuário pode ou não acessar.

---

## Banco de dados

Todas as tabelas usam UUID como chave primária e possuem RLS habilitado. O
schema completo está em [`supabase/migrations`](./supabase/migrations).

### `profiles`
Perfis de usuário, criados automaticamente no primeiro login.

| Campo | Tipo | Descrição |
|---|---|---|
| id | uuid | Referencia `auth.users.id` |
| nome | text | Nome do colaborador |
| email | text | E-mail |
| telefone | text | Telefone (opcional) |
| perfil | text | `administrador` ou `operador` |
| ativo | boolean | Conta ativa |
| created_at / updated_at | timestamptz | Controle |

### `clientes`

| Campo | Tipo |
|---|---|
| id | uuid |
| matricula | text (único) |
| nome | text |
| telefone | text |
| endereco | text |
| email | text |
| cpf | text |
| status | `Ativo` \| `Inativo` \| `Em Negociação` |
| operador_id | uuid → `profiles.id` |
| created_at / updated_at | timestamptz |

### `negociacoes`

| Campo | Tipo |
|---|---|
| id | uuid |
| cliente_id | uuid → `clientes.id` |
| valor_negociado | numeric(12,2) |
| data_vencimento | date |
| status | `Aguardando Pagamento` \| `Pago` \| `Vencido` \| `Em Acompanhamento` |
| observacao | text |
| created_at / updated_at | timestamptz |

### `comprovantes`

| Campo | Tipo |
|---|---|
| id | uuid |
| cliente_id | uuid → `clientes.id` |
| negociacao_id | uuid → `negociacoes.id` (opcional) |
| arquivo_url | text |
| arquivo_path | text (caminho no Storage) |
| tipo | `Conta` \| `Comprovante` |
| created_at | timestamptz |

### `interacoes`

| Campo | Tipo |
|---|---|
| id | uuid |
| cliente_id | uuid → `clientes.id` |
| tipo | `Ligação` \| `WhatsApp` \| `Visita` \| `Negociação` |
| descricao | text |
| latitude / longitude | double precision |
| foto_url | text (extensão adicionada para suportar "Registrar foto" nas visitas) |
| created_at | timestamptz |

### `alertas`

| Campo | Tipo |
|---|---|
| id | uuid |
| cliente_id | uuid → `clientes.id` |
| negociacao_id | uuid → `negociacoes.id` |
| data_alerta | date |
| status | `Pendente` \| `Enviado` \| `Resolvido` |
| created_at | timestamptz |

### View e função auxiliares
- `vw_dashboard_resumo`: agregações prontas para os cards do dashboard.
- `gerar_alertas_vencimento()`: função `SECURITY DEFINER` que gera os
  alertas do dia e marca negociações vencidas; é chamada pela Edge Function
  `gerar-alertas`.

---

## Estrutura de pastas

```
projeto-elo/
├── public/                      # Ícones PWA, favicon, robots.txt
├── scripts/
│   └── generate-icons.py        # Geração dos ícones PWA
├── src/
│   ├── components/
│   │   ├── ui/                  # Componentes shadcn/ui (button, dialog, table…)
│   │   ├── layout/               # AppLayout, Sidebar, Topbar, MobileNav, AuthLayout
│   │   ├── shared/                # PageHeader, StatCard, EmptyState, ConfirmDialog…
│   │   ├── clientes/              # ClienteForm, ClienteTable, ClienteFilters
│   │   ├── negociacoes/           # NegociacaoForm, NegociacaoTable, fluxo OCR
│   │   ├── comprovantes/          # Upload, CameraCapture, OcrProcessor, lista
│   │   ├── interacoes/            # InteracaoForm, VisitaForm, Timeline
│   │   ├── alertas/               # AlertaList
│   │   ├── dashboard/             # Gráficos (Recharts)
│   │   └── whatsapp/              # WhatsappButton
│   ├── pages/                    # Uma página por rota
│   │   └── auth/                  # Login, Cadastro, Recuperar/Redefinir senha
│   ├── context/AuthContext.tsx   # Sessão, perfil e ações de autenticação
│   ├── hooks/                    # useClientes, useNegociacoes, useGeolocation…
│   ├── lib/                      # supabase.ts, utils, masks, ocr, whatsapp, validations
│   ├── services/                 # Camada de acesso a dados (Supabase)
│   ├── types/                    # Tipos gerados a partir do schema
│   └── routes/                   # ProtectedRoute / PublicOnlyRoute
├── supabase/
│   ├── migrations/               # SQL versionado (schema, RLS, storage, alertas)
│   ├── functions/gerar-alertas/  # Edge Function (Deno) agendada
│   └── config.toml
├── .env.example
├── vercel.json
└── package.json
```

---

## Instalação

Pré-requisitos: **Node.js 20+** e **npm 10+**, e uma conta gratuita no
[Supabase](https://supabase.com).

```bash
git clone https://github.com/analistafjp-design/projeto-elo.git
cd projeto-elo
npm install
cp .env.example .env
# preencha o .env com os dados do seu projeto Supabase (veja CONFIGURAÇÃO MANUAL)
npm run dev
```

A aplicação sobe em `http://localhost:5173`. Se as variáveis do Supabase não
estiverem configuradas, a tela inicial mostra instruções de configuração em
vez de quebrar — isso é intencional.

Scripts disponíveis:

| Comando | Descrição |
|---|---|
| `npm run dev` | Ambiente de desenvolvimento (Vite) |
| `npm run build` | Typecheck + build de produção (`dist/`) |
| `npm run preview` | Serve o build de produção localmente |
| `npm run lint` | ESLint |
| `npm run typecheck` | Checagem de tipos sem gerar arquivos |

---

## Configuração

Todas as variáveis ficam em `.env` (nunca commitado — veja `.gitignore`):

| Variável | Obrigatória | Descrição |
|---|---|---|
| `VITE_SUPABASE_URL` | Sim | URL do projeto Supabase |
| `VITE_SUPABASE_ANON_KEY` | Sim | Chave pública (anon) do Supabase |
| `VITE_WHATSAPP_NUMERO_PADRAO` | Não | Número padrão da equipe (não usado no envio direto ao cliente, reservado para uso futuro) |
| `VITE_APP_NAME` | Não | Nome exibido no app (padrão: `ELO`) |

O schema do banco, as políticas de RLS, o bucket de Storage e a Edge
Function de alertas ficam versionados em [`supabase/`](./supabase) e devem
ser aplicados ao projeto Supabase — passo a passo completo na seção
[CONFIGURAÇÃO MANUAL](#configuração-manual).

---

## Deploy

### Frontend — Vercel
O repositório já inclui [`vercel.json`](./vercel.json) configurado para
build Vite (`npm run build`, saída em `dist/`) com rewrite de SPA
(`/* → /index.html`). Basta importar o repositório na Vercel e configurar as
variáveis de ambiente (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, etc.)
no painel do projeto.

### Frontend — GitHub Pages (alternativa sem precisar de outra conta)
O repositório também inclui um workflow pronto
([`.github/workflows/deploy-pages.yml`](./.github/workflows/deploy-pages.yml))
que builda e publica o site automaticamente no GitHub Pages a cada push na
`main`, usando só a conta do GitHub (sem precisar criar conta em outro
serviço). Requer:
1. Em **Settings → Secrets and variables → Actions → Secrets**, cadastrar
   `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
2. Em **Settings → Pages**, definir **Source: GitHub Actions**.
3. Um push na `main` (ou rodar o workflow manualmente em **Actions**) publica
   o site em `https://<usuário>.github.io/projeto-elo/`.

O build detecta automaticamente o destino (raiz do domínio na Vercel,
subcaminho `/projeto-elo/` no GitHub Pages) via a variável `GH_PAGES`
definida pelo próprio workflow — nenhum ajuste manual é necessário.

### Backend — Supabase
O banco de dados, autenticação, storage e a Edge Function `gerar-alertas`
rodam inteiramente no Supabase. Não há servidor próprio para manter.

Veja o passo a passo completo e detalhado na seção
[CONFIGURAÇÃO MANUAL](#configuração-manual) abaixo.

---

## Segurança

- **Row Level Security (RLS)** habilitado em todas as tabelas: um
  Administrador vê e edita tudo; um Operador só acessa os clientes
  vinculados a ele (`clientes.operador_id`) e os registros filhos
  (negociações, comprovantes, interações, alertas) desses clientes.
- **Storage privado**: o bucket `comprovantes` não é público — o acesso a
  cada arquivo é validado pela mesma regra de RLS (via
  `storage.foldername`), e a exibição/download usa sempre URLs assinadas
  com expiração.
- **Autenticação e proteção de rotas**: sessão gerenciada pelo Supabase Auth
  (JWT); todas as rotas privadas do app passam por `ProtectedRoute`, que
  redireciona usuários não autenticados para o login e bloqueia áreas
  administrativas para quem não tem o perfil adequado.
- **Validação de formulários**: todos os formulários usam `react-hook-form`
  + `zod`, validando tipos, formatos (e-mail, CPF, telefone) e campos
  obrigatórios antes de qualquer chamada ao banco.
- **Sanitização de dados**: consultas sempre parametrizadas via
  `@supabase/supabase-js` (PostgREST), sem concatenação manual de SQL —
  elimina o vetor clássico de SQL Injection.
- **Controle de acesso por perfil**: reforçado tanto na interface (menus e
  ações condicionais) quanto, principalmente, no banco via RLS — a UI nunca
  é a única barreira.

---

## Tecnologias utilizadas

**Frontend**
- React 18 + TypeScript + Vite
- TailwindCSS + shadcn/ui (Radix UI primitives)
- React Router, React Hook Form + Zod
- Recharts (gráficos do dashboard)
- Tesseract.js (OCR no navegador)
- vite-plugin-pwa (Service Worker, manifest)

**Backend (Supabase)**
- PostgreSQL + Row Level Security
- Supabase Auth
- Supabase Storage
- Edge Functions (Deno)

**Infraestrutura**
- Vercel (frontend)
- Supabase Cloud (backend)

---

## Roadmap futuro

- [ ] Notificações push nativas (Web Push) para alertas de vencimento.
- [ ] Envio automático de WhatsApp via API oficial (Cloud API), sem depender
      de abrir o app manualmente.
- [ ] Relatórios exportáveis em PDF/Excel por operador e período.
- [ ] Modo offline completo (fila de sincronização de visitas sem conexão).
- [ ] App mobile empacotado (Capacitor) para publicação nas lojas.
- [ ] Metas e gamificação por operador (ranking de recuperação de receita).
- [ ] Integração com gateways de pagamento para conciliação automática de
      status "Pago".
- [ ] Auditoria completa (log de alterações por usuário).

---

## CONFIGURAÇÃO MANUAL

Este passo a passo foi escrito para quem **nunca configurou um projeto de
programação antes**. Siga os passos na ordem, sem pular etapas.

### 1. Clonar o repositório

1. Instale o [Git](https://git-scm.com/downloads) (se ainda não tiver).
2. Instale o [Node.js versão 20 ou superior](https://nodejs.org/) (baixe a
   versão "LTS").
3. Abra o **Terminal** (Mac/Linux) ou **PowerShell/Prompt de Comando**
   (Windows).
4. Rode os comandos abaixo, um de cada vez:

   ```bash
   git clone https://github.com/analistafjp-design/projeto-elo.git
   cd projeto-elo
   ```

### 2. Criar projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) e clique em **Start your
   project**.
2. Crie uma conta gratuita (pode usar sua conta do GitHub).
3. Clique em **New Project**.
4. Preencha:
   - **Name**: `projeto-elo` (ou o nome que preferir);
   - **Database Password**: crie uma senha forte e **guarde-a em um lugar
     seguro** (você não vai precisar dela no dia a dia, mas é importante
     para emergências);
   - **Region**: escolha a região mais próxima de você (ex.: `South
     America (São Paulo)`).
5. Clique em **Create new project** e aguarde alguns minutos até o projeto
   ficar pronto (o painel mostra "Setting up project...").

### 3. Executar o SQL (schema, RLS, storage, alertas)

**Caminho rápido (recomendado) — tudo em uma única execução:**

1. No painel do Supabase, no menu lateral esquerdo, clique no ícone
   **SQL Editor** → **New query**.
2. No seu computador, abra o arquivo `supabase/setup_completo.sql` do
   projeto que você clonou (ou veja direto no GitHub, na pasta
   `supabase/`).
3. Copie **todo o conteúdo** do arquivo, cole na caixa do SQL Editor e
   clique em **Run** (ou `Ctrl+Enter`). Esse arquivo já contém, na ordem
   certa, tudo que os 5 arquivos de `migrations/` fazem juntos — schema,
   RLS, storage e alertas — em uma única transação.
4. Aguarde a mensagem de sucesso ("Success. No rows returned").

**Caminho alternativo — arquivo por arquivo:**

Se preferir revisar/aplicar cada etapa separadamente, abra a pasta
`supabase/migrations` e execute, um de cada vez e **sempre nessa ordem**,
os arquivos `0001_profiles.sql`, `0002_core_tables.sql`,
`0003_rls_policies.sql`, `0004_storage.sql` e `0005_alertas_automaticos.sql`
— copiando o conteúdo de cada um, colando em uma **New query** e clicando
em **Run** antes de passar para o próximo.

Em ambos os casos, o arquivo `0006_seed_opcional.sql` (dados de exemplo)
só deve ser executado **depois** que você já tiver criado seu primeiro
usuário (passo 5 abaixo).

### 4. Configurar Storage

O bucket de arquivos já é criado automaticamente pelo arquivo
`0004_storage.sql` do passo anterior. Para confirmar:

1. No menu lateral, clique em **Storage**.
2. Você deve ver um bucket chamado **comprovantes**, marcado como privado
   (não público). Se ele aparecer na lista, está tudo certo — não é
   necessário fazer mais nada aqui.

### 5. Configurar autenticação

1. No menu lateral, clique em **Authentication** → **Providers**.
2. Confirme que o provedor **Email** está habilitado (vem habilitado por
   padrão).
3. Ainda em Authentication, vá em **URL Configuration** e configure:
   - **Site URL**: em desenvolvimento, use `http://localhost:5173`. Depois
     de publicar o site (passo 10), troque para a URL final (ex.:
     `https://projeto-elo.vercel.app`);
   - **Redirect URLs**: adicione `http://localhost:5173/**` e, depois do
     deploy, também `https://SEU-DOMINIO.vercel.app/**`.
4. Crie o primeiro usuário (que será automaticamente o **Administrador** do
   sistema): rode o projeto localmente (passos 6 e 7 abaixo) e cadastre-se
   pela tela **"Cadastre-se"**. O primeiro usuário criado no banco vira
   administrador automaticamente; os próximos entram como operadores.

### 6. Configurar variáveis de ambiente

1. No painel do Supabase, vá em **Project Settings** (ícone de engrenagem)
   → **API**.
2. Copie o valor de **Project URL**.
3. Copie o valor de **anon public** (dentro de "Project API keys").
4. No seu computador, dentro da pasta do projeto, copie o arquivo de
   exemplo:

   ```bash
   cp .env.example .env
   ```
5. Abra o arquivo `.env` em um editor de texto e preencha:

   ```env
   VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
   VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
   ```
6. Salve o arquivo.

### 7. Instalar dependências

No terminal, dentro da pasta do projeto:

```bash
npm install
```

Aguarde a instalação terminar (pode levar alguns minutos na primeira vez).

### 8. Rodar localmente

```bash
npm run dev
```

Abra o navegador em **http://localhost:5173**. Você verá a tela de login do
ELO. Clique em **"Cadastre-se"** para criar sua primeira conta (ela será o
administrador do sistema).

### 9. Publicar no GitHub

Se você fez alterações no código e quer salvá-las no GitHub:

```bash
git add .
git commit -m "minhas alterações"
git push origin nome-da-sua-branch
```

Se você é o dono do repositório e quer manter tudo direto na branch
principal, peça orientação a um desenvolvedor antes de usar `git push`
diretamente na `main`, para evitar sobrescrever o trabalho de outras
pessoas.

### 10. Publicar no Vercel

1. Acesse [vercel.com](https://vercel.com) e crie uma conta (pode usar sua
   conta do GitHub).
2. Clique em **Add New...** → **Project**.
3. Selecione o repositório `projeto-elo` (autorize o acesso da Vercel ao
   GitHub se solicitado).
4. Na tela de configuração do projeto:
   - **Framework Preset**: a Vercel deve detectar automaticamente **Vite**;
   - **Build Command**: `npm run build` (já vem preenchido);
   - **Output Directory**: `dist` (já vem preenchido).
5. Antes de clicar em **Deploy**, abra a seção **Environment Variables** e
   adicione:
   - `VITE_SUPABASE_URL` → o mesmo valor do seu `.env`;
   - `VITE_SUPABASE_ANON_KEY` → o mesmo valor do seu `.env`.
6. Clique em **Deploy** e aguarde a build finalizar (2 a 3 minutos).
7. Ao final, a Vercel mostra a URL pública do seu site (ex.:
   `https://projeto-elo.vercel.app`).
8. Volte ao Supabase (**Authentication → URL Configuration**) e adicione
   essa URL nos campos **Site URL** e **Redirect URLs**, como explicado no
   passo 5.

### 11. Configurar domínio (opcional)

1. No painel da Vercel, abra o projeto → aba **Settings** → **Domains**.
2. Digite o domínio que você já possui (ex.: `app.suaempresa.com.br`) e
   clique em **Add**.
3. A Vercel mostrará registros DNS (tipo `CNAME` ou `A`) para você cadastrar
   no painel do seu provedor de domínio (Registro.br, GoDaddy, etc.).
4. Após configurar o DNS, aguarde a propagação (pode levar de alguns
   minutos a algumas horas) — a Vercel emite o certificado HTTPS
   automaticamente.
5. Não esqueça de adicionar o novo domínio também em **Site URL /
   Redirect URLs** no Supabase (passo 5).

### 12. Testar o OCR

1. Acesse o perfil de um cliente cadastrado.
2. Vá na aba **Negociações** → **"Nova negociação por foto (OCR)"**.
3. No celular, toque em **"Capturar Foto"** (isso abre a câmera do
   aparelho) e fotografe uma conta; no computador, use **"Escolher da
   galeria"** para selecionar uma imagem.
4. Clique em **"Processar com OCR"** e aguarde alguns segundos.
5. Confira os campos preenchidos automaticamente (matrícula, nome, valor,
   vencimento) e corrija manualmente o que for necessário.
6. Clique em **"Registrar negociação"** — a foto é salva automaticamente
   como comprovante do tipo "Conta".

> Dica: o OCR funciona melhor com fotos nítidas, bem iluminadas e sem
> reflexos. Ele é apenas um auxiliar — sempre confira os dados antes de
> salvar.

### 13. Testar o WhatsApp

1. Cadastre um cliente com telefone válido (com DDD).
2. Registre uma negociação para esse cliente.
3. Na lista de negociações (ou na Central de notificações), clique em
   **"Enviar lembrete"**.
4. O WhatsApp Web (no computador) ou o aplicativo do WhatsApp (no celular)
   deve abrir automaticamente, já com a mensagem de lembrete preenchida e
   pronta para envio.

### 14. Testar o PWA (instalação como aplicativo)

**No Android (Chrome):**
1. Acesse o site publicado pelo navegador Chrome.
2. Toque no menu (⋮) → **"Instalar aplicativo"** (ou aguarde o banner
   automático de instalação aparecer).
3. Confirme — o ícone do ELO aparecerá na tela inicial, como um app nativo.

**No iPhone/iPad (Safari):**
1. Acesse o site publicado pelo navegador Safari (é obrigatório ser o
   Safari, não funciona pelo Chrome no iOS).
2. Toque no ícone de **Compartilhar** (quadrado com seta para cima).
3. Toque em **"Adicionar à Tela de Início"**.
4. Confirme — o ícone do ELO aparecerá na tela inicial.

**No computador (Chrome/Edge):**
1. Acesse o site publicado.
2. Clique no ícone de instalação que aparece na barra de endereço (à
   direita, perto do ícone de favoritos).
3. Confirme a instalação — o ELO abrirá em uma janela própria, sem as
   barras do navegador.

### 15. Publicar em produção — checklist final

Antes de liberar o sistema para a equipe, confirme:

- [ ] Todas as migrações SQL (`0001` a `0005`) foram executadas no Supabase
      de produção;
- [ ] O bucket **comprovantes** existe no Storage;
- [ ] O primeiro usuário administrador foi criado;
- [ ] As variáveis `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` estão
      configuradas na Vercel (ambiente de produção);
- [ ] **Site URL** e **Redirect URLs** no Supabase apontam para o domínio
      final (não mais `localhost`);
- [ ] A Edge Function `gerar-alertas` foi publicada e agendada para rodar
      diariamente (veja [`supabase/README.md`](./supabase/README.md) —
      seção "Agendando a geração de alertas");
- [ ] O login, o cadastro de cliente, o registro de negociação, o upload de
      comprovante, o OCR, o lembrete de WhatsApp e a instalação como PWA
      foram testados no ambiente de produção;
- [ ] Os demais colaboradores foram cadastrados (eles entram
      automaticamente como "Operador"; um administrador pode promovê-los
      posteriormente atualizando o campo `perfil` na tabela `profiles`
      pelo Supabase Studio, se necessário).

Pronto — o ELO está em produção.

---

<p align="center">ELO © 2026 — Todos os direitos reservados</p>
