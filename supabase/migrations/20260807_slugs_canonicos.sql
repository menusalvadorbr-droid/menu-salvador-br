-- Slugs canônicos pro diretório público (cidades, bairros, tipos de
-- estabelecimento, estabelecimentos) — identificador de rota estável,
-- independente do nome de exibição. Ver src/lib/slug.ts pra mesma regra
-- em TypeScript; as duas implementações devem produzir a mesma saída
-- pros mesmos casos de teste.
--
-- estabelecimentos é assumida vazia (só tinha dado de teste) — por isso
-- não há aqui nenhum backfill de estabelecimento nem reconciliação de
-- colisão de slug: cidade_id/tipo_estabelecimento_id nascem sem dado
-- nenhum pra migrar, populados só a partir de agora pelo cadastro via
-- CNPJ. bairros, ao contrário, é curada manualmente e continua — por
-- isso leva um seed explícito abaixo.

-- ─────────────────────────────────────────────────────────────
-- unaccent — extensão padrão do Postgres (contrib), não é dependência
-- externa nova. Usada em vez de um mapa de caracteres feito à mão, que
-- seria fácil de errar por desalinhamento entre os dois lados do mapa.
-- ─────────────────────────────────────────────────────────────
create extension if not exists unaccent with schema extensions;

-- ─────────────────────────────────────────────────────────────
-- Função de normalização — mesmo algoritmo do src/lib/slug.ts:
-- 1. remove diacríticos, 2. minúsculas, 3. remove apóstrofos (sem
-- substituir), 4. "&" -> "-e-", 5. sequência fora de [a-z0-9] -> "-",
-- 6. remove hífens das pontas.
-- ─────────────────────────────────────────────────────────────
create or replace function public.gerar_slug(texto text)
returns text
language plpgsql
immutable
as $func$
declare
  s text;
begin
  if texto is null then
    return null;
  end if;

  s := extensions.unaccent(texto);
  s := lower(s);
  -- apóstrofo reto ('), curvo (') e crase (`) — removidos, não trocados
  s := replace(replace(replace(s, '''', ''), chr(8217), ''), '`', '');
  s := replace(s, '&', '-e-');
  s := regexp_replace(s, '[^a-z0-9]+', '-', 'g');
  s := trim(both '-' from s);

  return s;
end;
$func$;

-- ─────────────────────────────────────────────────────────────
-- Trigger genérica — só gera slug quando vier nulo/vazio na escrita,
-- permitindo override manual (já existem slugs "customizados" hoje,
-- ex: um estabelecimento com nome_fantasia bem diferente do slug).
-- ─────────────────────────────────────────────────────────────
create or replace function public.preencher_slug_automatico()
returns trigger
language plpgsql
as $func$
begin
  if new.slug is null or btrim(new.slug) = '' then
    new.slug := public.gerar_slug(new.nome);
  end if;
  return new;
end;
$func$;

-- ─────────────────────────────────────────────────────────────
-- CIDADES — tabela nova. Antes não existia; "cidade" era texto livre
-- direto em estabelecimentos.
-- ─────────────────────────────────────────────────────────────
create table if not exists public.cidades (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  slug text,
  created_at timestamptz not null default now()
);

drop trigger if exists trg_cidades_slug on public.cidades;
create trigger trg_cidades_slug
  before insert or update on public.cidades
  for each row execute function public.preencher_slug_automatico();

create unique index if not exists cidades_slug_key on public.cidades (slug);

alter table public.cidades enable row level security;
drop policy if exists "cidades: leitura publica" on public.cidades;
create policy "cidades: leitura publica" on public.cidades for select using (true);

-- Seed — só as cidades que os bairros já cadastrados (curados
-- manualmente, ver abaixo) precisam pra ganhar cidade_id.
insert into public.cidades (nome)
select v.nome
from (values ('Salvador'), ('Lauro de Freitas')) as v(nome)
where not exists (select 1 from public.cidades c where c.slug = public.gerar_slug(v.nome));

-- ─────────────────────────────────────────────────────────────
-- BAIRROS — ganha cidade_id. Não dá pra derivar de estabelecimentos
-- (tabela será esvaziada); atribuição manual pelos 15 bairros já
-- cadastrados hoje, com base na geografia real: só "Villas do
-- Atlantico" é de Lauro de Freitas, o resto é de Salvador.
-- ─────────────────────────────────────────────────────────────
alter table public.bairros add column if not exists cidade_id uuid references public.cidades(id);

update public.bairros b
set cidade_id = c.id
from public.cidades c
where b.cidade_id is null
  and c.slug = case when b.nome = 'Villas do Atlantico' then public.gerar_slug('Lauro de Freitas')
                     else public.gerar_slug('Salvador') end;

create unique index if not exists bairros_cidade_slug_key on public.bairros (cidade_id, slug);

-- ─────────────────────────────────────────────────────────────
-- TIPOS_ESTABELECIMENTO — corrige inconsistência de slug já existente
-- (hífen vs underscore vs sem separador: "banca_acaraje", "foodtruck")
-- e um "nome" claramente errado (parece slug, não nome de exibição).
-- Nenhum estabelecimento vivo referencia essa tabela ainda (é assumida
-- vazia), então regenerar slug de todas as linhas é seguro.
-- ─────────────────────────────────────────────────────────────
update public.tipos_estabelecimento
set nome = 'Barraca de Praia'
where id = 11 and nome = 'barraca-de-praia';

update public.tipos_estabelecimento
set slug = public.gerar_slug(nome)
where slug is distinct from public.gerar_slug(nome);

create unique index if not exists tipos_estabelecimento_slug_key on public.tipos_estabelecimento (slug);

-- ─────────────────────────────────────────────────────────────
-- ESTABELECIMENTOS — ganha cidade_id e tipo_estabelecimento_id (FK).
-- Sem backfill: tabela assumida vazia (só tinha dado de teste). As
-- colunas de texto antigas (cidade, tipo_estabelecimento) continuam
-- existindo (restrição: não remover coluna), mas deixam de ser fonte
-- de verdade a partir do código que vier depois desta migração.
-- ─────────────────────────────────────────────────────────────
alter table public.estabelecimentos add column if not exists cidade_id uuid references public.cidades(id);
alter table public.estabelecimentos add column if not exists tipo_estabelecimento_id integer references public.tipos_estabelecimento(id);

create unique index if not exists estabelecimentos_cidade_slug_key on public.estabelecimentos (cidade_id, slug);
