-- Bug real, bem mais sério do que o relato original sugeria: "cardápio não
-- salva item" em Ki-Mukeka e Haus Pizza não tem nada a ver com status —
-- os dois têm menus DUPLICADOS (mais de uma linha em `menus` pro mesmo
-- estabelecimento_id), criados poucos milissegundos um do outro.
--
-- Causa: CardapioTab.tsx faz "consulta o menu, se não achou cria um" sem
-- nenhum lock — um clássico check-then-act. Sem unique constraint em
-- menus.estabelecimento_id pra impedir, duas chamadas concorrentes de
-- carregarDados() (ex: o duplo-mount de efeito do React StrictMode em
-- `next dev`, que roda contra o mesmo banco de produção neste projeto)
-- podem as duas "não achar menu" e as duas inserir — resultado: dois
-- menus pro mesmo estabelecimento. A tela sempre carrega o mais antigo
-- (order by created_at asc, limit 1), então categorias/itens que acabam
-- presos no menu mais novo somem da tela sem erro nenhum — parece que
-- "não salvou", mas na verdade salvou no menu errado/órfão.
--
-- Levantamento ao vivo: 13 de 20 estabelecimentos com menu têm essa
-- duplicação hoje, alguns com categoria de verdade presa no menu órfão
-- (Café Cultural, BAR ROCK, Sushi House, entre outros) — não é só um caso
-- isolado do relato original.

-- ── Passo 1: mesclar duplicados existentes ───────────────────────────
-- Pra cada estabelecimento com mais de um menu, mantém o mais antigo
-- (mesmo critério que a tela já usa) e move as categorias dos outros pra
-- ele antes de apagar — itens_cardapio não referencia menu_id diretamente
-- (só categoria_id), então seguem a categoria automaticamente, sem precisar
-- de um segundo UPDATE.
do $$
declare
  dup record;
  canonico uuid;
begin
  for dup in
    select id, estabelecimento_id
    from (
      select id, estabelecimento_id,
             row_number() over (partition by estabelecimento_id order by created_at asc, id asc) as posicao
      from public.menus
    ) ranked
    where posicao > 1
  loop
    select id into canonico
    from public.menus
    where estabelecimento_id = dup.estabelecimento_id
    order by created_at asc, id asc
    limit 1;

    update public.categorias set menu_id = canonico where menu_id = dup.id;
    delete from public.menus where id = dup.id;
  end loop;
end $$;

-- ── Passo 2: impedir que aconteça de novo ────────────────────────────
-- Todo ponto de leitura no app já assume "no máximo um menu por
-- estabelecimento" (vários têm até comentário citando esse pressuposto,
-- ex: CardapioTab.tsx, cardapioParaGarcom.ts) — nunca foi uma feature ter
-- mais de um, sempre foi bug latente. Formaliza isso no banco.
alter table public.menus
  add constraint menus_estabelecimento_id_unique unique (estabelecimento_id);
