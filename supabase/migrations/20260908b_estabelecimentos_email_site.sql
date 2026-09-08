-- Campos novos pedidos pra consolidar a criação de estabelecimento no
-- fluxo /admin/estabelecimentos/importar (email e site não existiam antes
-- — instagram já existia). Público, mesmo padrão de telefone/whatsapp/
-- instagram: aparecem na página pública, então também precisam entrar na
-- allow-list de estabelecimentos_publico (20260828_view_publica_estabelecimentos.sql),
-- senão ficam invisíveis pra quem consulta a view em vez da tabela base.
alter table public.estabelecimentos add column if not exists email text;
alter table public.estabelecimentos add column if not exists site text;

-- Colunas novas (email, site) vão no FIM da lista de propósito: o Postgres
-- só deixa create-or-replace-view mudar a query se as colunas já
-- existentes mantiverem nome e posição — inserir no meio (ex: logo depois
-- de instagram) empurra a posição de tudo que vem depois e o Postgres lê
-- isso como "renomear coluna", não como coluna nova (42P16). Só é seguro
-- adicionar coluna nova numa view existente acrescentando no final.
create or replace view public.estabelecimentos_publico as
select
  id, nome, nome_fantasia, slug, descricao, status, ativo, destaque,
  endereco, numero, complemento, tipo_logradouro, cep, bairro, bairro_id, cidade, cidade_id,
  telefone, whatsapp, instagram,
  tipo_estabelecimento, tipo_estabelecimento_id,
  estacionamento, aceita_pets, acessibilidade, latitude, longitude, link_google_maps,
  foto_capa, galeria_fotos, logo_url, google_place_id,
  tema_atual_id, cardapio_config, cardapio_formato, cardapio_navegacao_categoria,
  cardapio_clique_expande_ativado, cardapio_carrinho_ativado, cardapio_variacoes_ativado, cardapio_complementos_ativado,
  promocoes_contador_ativado, idiomas_ativos, whatsapp_atalhos, qrcode_short_url,
  chave_pix, tipo_chave_pix,
  owner_user_id,
  case when owner_user_id is null then cnpj else null end as cnpj,
  email, site
from public.estabelecimentos;

grant select on public.estabelecimentos_publico to anon, authenticated;
