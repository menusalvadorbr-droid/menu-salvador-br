-- Bug confirmado ao vivo: AtendimentoInbox.tsx se inscreve em
-- postgres_changes de whatsapp_conversas normalmente (SUBSCRIBED), mas
-- nunca recebe nenhum evento — testei inserindo uma linha real e
-- escutando o canal, zero eventos chegaram. Causa: a migration original
-- (20260822_whatsapp_atendimento.sql) esqueceu de adicionar a tabela na
-- publicação supabase_realtime (mesmo requisito já documentado em
-- 20260806_realtime_cardapio.sql — sem isto, o supabase-js se inscreve
-- normalmente mas nunca recebe nenhum evento).
alter publication supabase_realtime add table public.whatsapp_conversas;
