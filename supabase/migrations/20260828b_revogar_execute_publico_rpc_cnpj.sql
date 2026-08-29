-- Postgres concede EXECUTE em toda function nova pra PUBLIC por padrão
-- (revogar não é automático só por eu ter dado GRANT explícito pra
-- authenticated na migration anterior) — confirmado ao vivo que `anon`
-- ainda conseguia chamar buscar_estabelecimento_por_cnpj mesmo sem
-- GRANT explícito, porque nunca revoguei o PUBLIC default. A function em
-- si não reexpõe o cnpj (só id/nome/nome_fantasia/slug/owner_user_id),
-- mas permitir chamada anônima habilita enumeração de CNPJ em massa sem
-- precisar nem de conta — não é o uso pretendido (NovoEstabelecimentoForm.tsx
-- exige login antes de chamar).
revoke execute on function public.buscar_estabelecimento_por_cnpj(text) from public;
revoke execute on function public.buscar_estabelecimento_por_cnpj(text) from anon;
grant execute on function public.buscar_estabelecimento_por_cnpj(text) to authenticated;
