# ELO — instruções para a Claude

O ELO ("Conectando equipes de campo e clientes") é um CRM de **negociações em
campo**. Ele reúne:
- clientes e carteira;
- negociações (valor, vencimento, status);
- comprovantes com OCR;
- histórico de interações com geolocalização;
- alertas de vencimento e notificações;
- dashboard executivo;
- importação e exportação de clientes por Excel;
- exportação do dashboard em PDF.

É uma **PWA mobile first**, instalável. Há dois perfis: **Administrador**
(acesso total) e **Operador** (só os clientes vinculados a ele).

O `README.md` tem as funcionalidades, o banco, a configuração e a seção
"CONFIGURAÇÃO MANUAL". O `supabase/README.md` tem as tabelas, a RLS e as
funções.

## Como trabalhar com o usuário

- Converse sempre em **português do Brasil**, de forma direta.
- Preserve o que já funciona. Não mude tela, regra ou permissão além do que
  foi pedido.
- Não invente dados, resultados nem testes. Se algo não foi verificado, diga
  que não foi.
- **Nunca versione segredos.** As chaves do Supabase vão em `.env` (local) e
  nos secrets do GitHub/Vercel. O `.env.example` mostra os nomes:
  `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_NAME` e
  `VITE_WHATSAPP_NUMERO_PADRAO`.
- Para cada pedido, crie um branch a partir da `main`, abra o PR como
  **draft** e **só mescle quando o usuário disser "Pode mesclar"** (ou
  "Pode").
- Escreva as mensagens de commit e as descrições de PR em português.

## Decisões já tomadas

- **O formulário de cliente não tem CPF nem e-mail** (removidos a pedido).
  Não os traga de volta.
- **Responsividade e overflow** (fotos grandes, card de OCR) já foram
  corrigidos. Teste celular, tablet e desktop ao mexer em tela.
- **O PWA se atualiza sozinho** (auto-update).
- **A importação de Excel** precisa aguentar planilhas reais grandes e com
  várias abas (`@e965/xlsx`).

## Estrutura e publicação

- **Stack**: Vite + React + TypeScript + Tailwind + shadcn/ui (Radix), React
  Router e React Hook Form + Zod.
- **Backend**: Supabase (Auth, Postgres com RLS, Storage, Edge Functions em
  `supabase/functions`). Migrações em `supabase/migrations`; script único em
  `supabase/setup_completo.sql`.
- **Publicação**: o GitHub Pages publica a cada push na `main`
  (`.github/workflows/deploy-pages.yml`, subcaminho `/projeto-elo/` via
  `GH_PAGES`). A Vercel também é suportada (`vercel.json`).
- **Checagens antes do commit**: `npm run typecheck`, `npm run lint` e
  `npm run build`.
