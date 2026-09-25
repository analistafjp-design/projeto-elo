-- ============================================================
-- ELO | Migration 0006 (opcional)
-- Dados de exemplo para ambiente de desenvolvimento local.
--
-- Este arquivo NÃO deve ser aplicado em produção.
-- Ele só insere dados fictícios quando a tabela "clientes" está
-- vazia, então rodar novamente não duplica registros.
-- Para usá-lo, crie antes um usuário via Auth (Supabase Studio)
-- e substitua o UUID abaixo pelo id desse usuário.
-- ============================================================

do $$
declare
  v_admin_id uuid;
  v_cliente_1 uuid;
  v_cliente_2 uuid;
  v_neg_1 uuid;
begin
  select id into v_admin_id from public.profiles where perfil = 'administrador' limit 1;

  if v_admin_id is null then
    raise notice 'Nenhum administrador encontrado. Cadastre um usuário pela tela de login antes de rodar o seed.';
    return;
  end if;

  if exists (select 1 from public.clientes limit 1) then
    raise notice 'Tabela clientes já possui dados. Seed ignorado.';
    return;
  end if;

  insert into public.clientes (matricula, nome, telefone, endereco, email, cpf, status, operador_id, created_by)
  values ('000123', 'Maria da Silva', '(11) 98888-7777', 'Rua das Flores, 123 - São Paulo/SP', 'maria.silva@example.com', '111.111.111-11', 'Em Negociação', v_admin_id, v_admin_id)
  returning id into v_cliente_1;

  insert into public.clientes (matricula, nome, telefone, endereco, email, cpf, status, operador_id, created_by)
  values ('000456', 'João Pereira', '(21) 97777-6666', 'Av. Central, 456 - Rio de Janeiro/RJ', 'joao.pereira@example.com', '222.222.222-22', 'Ativo', v_admin_id, v_admin_id)
  returning id into v_cliente_2;

  insert into public.negociacoes (cliente_id, valor_negociado, data_vencimento, status, observacao, created_by)
  values (v_cliente_1, 350.90, current_date + interval '1 day', 'Aguardando Pagamento', 'Cliente comprometeu-se a pagar via PIX.', v_admin_id)
  returning id into v_neg_1;

  insert into public.negociacoes (cliente_id, valor_negociado, data_vencimento, status, observacao, created_by)
  values (v_cliente_2, 189.50, current_date - interval '5 day', 'Vencido', 'Sem retorno do cliente até o momento.', v_admin_id);

  insert into public.interacoes (cliente_id, tipo, descricao, created_by)
  values (v_cliente_1, 'Visita', 'Visita inicial para apresentação da negociação.', v_admin_id);

  insert into public.alertas (cliente_id, negociacao_id, data_alerta, status)
  values (v_cliente_1, v_neg_1, current_date, 'Pendente');

  raise notice 'Seed de desenvolvimento inserido com sucesso.';
end $$;
