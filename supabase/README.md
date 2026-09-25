# Supabase - Projeto ELO

Este diretório contém tudo que é necessário para provisionar o backend do
ELO no Supabase.

## Estrutura

```
supabase/
├── config.toml                  # Configuração do projeto (CLI local)
├── migrations/                  # Scripts SQL, aplicados em ordem
│   ├── 0001_profiles.sql        # Perfis de usuário + triggers
│   ├── 0002_core_tables.sql     # clientes, negociacoes, comprovantes,
│   │                             # interacoes, alertas
│   ├── 0003_rls_policies.sql    # Row Level Security de todas as tabelas
│   ├── 0004_storage.sql         # Bucket "comprovantes" + policies
│   ├── 0005_alertas_automaticos.sql  # Função de geração de alertas + view do dashboard
│   └── 0006_seed_opcional.sql   # Dados de exemplo (apenas dev local)
└── functions/
    └── gerar-alertas/           # Edge Function agendada (cron diário)
```

## Como aplicar

### Opção A — Supabase CLI (recomendado)

```bash
npm install -g supabase
supabase login
supabase link --project-ref <SEU_PROJECT_REF>
supabase db push
supabase functions deploy gerar-alertas
```

### Opção B — SQL Editor (manual, sem instalar nada)

Veja o passo a passo detalhado na seção **CONFIGURAÇÃO MANUAL** do
`README.md` na raiz do projeto. Resumidamente: abra o SQL Editor do
Supabase Studio e execute os arquivos de `migrations/` **em ordem
numérica**, um de cada vez.

## Agendando a geração de alertas

A função `gerar-alertas` deve rodar 1x por dia. No painel do Supabase:
`Edge Functions > gerar-alertas > Schedule` e configure um cron diário
(ex.: `0 10 * * *` para 07:00 no horário de Brasília, já que o Supabase
usa UTC). Alternativamente, use `pg_cron` (exemplo comentado dentro de
`migrations/0005_alertas_automaticos.sql`) ou um serviço externo (GitHub
Actions, Vercel Cron) fazendo um `POST` autenticado para a URL da função.
