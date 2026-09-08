-- 20260828_view_publica_estabelecimentos.sql derrubou todas as policies
-- antigas de estabelecimentos e recriou só select/insert/update, deixando
-- DELETE sem policy nenhuma de propósito — o comentário de lá dizia "nenhum
-- lugar do código faz delete direto em estabelecimentos".
--
-- Isso não é mais verdade: excluirEstabelecimento()
-- (src/app/(admin)/admin/estabelecimentos/actions.ts) faz .delete() direto
-- usando checarSuperAdmin() — client de sessão, sujeito a RLS (não é
-- supabaseAdmin, que ignora RLS). Sem policy de DELETE, todo super_admin
-- batia em "Nenhuma linha foi excluída" — a query nem erra, só afeta 0
-- linhas silenciosamente, que é o próprio comportamento do Postgres RLS
-- sem policy permissiva pro comando.
--
-- Só super_admin — dono/funcionário nunca devem conseguir excluir
-- permanentemente (fora do escopo deles; exclusão "reversível" pelo dono já
-- existe via UPDATE status='excluido' em painel/actions.ts, coberta pela
-- policy de update).
create policy "estabelecimentos_delete_super_admin" on public.estabelecimentos
  for delete using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );
