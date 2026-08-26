import { createPublicClient } from '@/lib/supabase/publicServer'
import { formatarEndereco, formatarHorario, LABEL_ESTACIONAMENTO, type EstabelecimentoParaAtalho } from './atalhos'
import { METODOS_PAGAMENTO } from '@/modules/pedidos/metodosPagamento'

// Dados do cardápio já resolvidos (alérgenos diretos + herdados da Ficha
// Técnica mesclados) — é essa lista, e só ela, que vira o system prompt do
// AI Waiter. Nunca inclui itens de outro estabelecimento.
export interface ItemCardapioContexto {
  nome: string
  descricao: string | null
  preco: number
  precoPromocional: number | null
  disponivel: boolean
  categoria: string
  alergenos: string[]
}

export interface EstabelecimentoContexto {
  id: string
  nome: string
  itens: ItemCardapioContexto[]
  /** Já formatado (mesma função usada pelo atalho de palavra-chave
   *  "endereço") — "Não temos o endereço cadastrado..." se vazio no
   *  cadastro, nunca inventado. */
  endereco: string
  /** Idem, mesma função do atalho "horário". */
  horario: string
  /** Comodidades reais do cadastro (aceita_pets, acessibilidade,
   *  estacionamento) — string vazia se nada preenchido. */
  comodidades: string
  /** Métodos aceitos ao finalizar pedido pelo cardápio — constante da
   *  plataforma inteira (não é campo configurável por estabelecimento
   *  hoje, ver comentário em montarContextoDoEstabelecimento). */
  formasPagamento: string
}

interface CategoriaBruta {
  id: string
  nome: string
}

interface AllergenEmbed {
  allergen: { nome: string } | null
}

interface ItemCardapioBruto {
  id: string
  nome: string
  descricao: string | null
  preco: number
  preco_promocional: number | null
  disponivel: boolean
  categoria_id: string
  item_allergens: AllergenEmbed[] | null
}

interface FichaTecnicaBruta {
  id: string
  cardapio_item_id: string | null
}

interface ComposicaoBruta {
  ficha_tecnica_id: string
  tipo: 'insumo' | 'sub_ficha'
  insumo_id: string | null
  sub_ficha_id: string | null
}

// Mesmos campos reais já usados pelos atalhos de palavra-chave
// (atalhos.ts) — nome pro system prompt da IA, e o resto pra montar
// endereço/estacionamento/comodidades sem duplicar a fonte de dado.
const SELECT_ESTABELECIMENTO =
  'id, nome, nome_fantasia, endereco, numero, tipo_logradouro, estacionamento, aceita_pets, acessibilidade, bairros(nome), cidades(nome)'

interface EstabelecimentoBruto extends EstabelecimentoParaAtalho {
  nome: string
  nome_fantasia: string | null
  aceita_pets: boolean | null
  acessibilidade: string[] | null
}

type ClientePublico = ReturnType<typeof createPublicClient>

/** Busca nome + cardápio completo (disponível ou não) de um estabelecimento
 *  pelo slug público. `null` se o estabelecimento não existe/não está ativo. */
export async function buildCardapioContext(slug: string): Promise<EstabelecimentoContexto | null> {
  const supabase = createPublicClient()
  const { data: est } = await supabase
    .from('estabelecimentos')
    .select(SELECT_ESTABELECIMENTO)
    .eq('slug', slug).eq('status', 'active').eq('ativo', true)
    .limit(1).single()
  if (!est) return null
  return montarContextoDoEstabelecimento(supabase, est as unknown as EstabelecimentoBruto)
}

/** Mesma coisa que `buildCardapioContext`, mas resolvendo pelo id direto —
 *  usada pelo robô de WhatsApp, que não tem slug de URL disponível (só o
 *  phone_number_id da mensagem recebida, já resolvido pra estabelecimento
 *  antes de chegar aqui). */
export async function buildCardapioContextPorId(estabelecimentoId: string): Promise<EstabelecimentoContexto | null> {
  const supabase = createPublicClient()
  const { data: est } = await supabase
    .from('estabelecimentos')
    .select(SELECT_ESTABELECIMENTO)
    .eq('id', estabelecimentoId).eq('status', 'active').eq('ativo', true)
    .limit(1).single()
  if (!est) return null
  return montarContextoDoEstabelecimento(supabase, est as unknown as EstabelecimentoBruto)
}

export interface DadosLocalizacaoEstabelecimento {
  nome: string
  /** Só o logradouro (tipo + endereço), ex. "Rua Example" — usado apenas
   *  pra detectar se uma resposta já enviada "fala do endereço" (checagem
   *  de substring em considerarEnviarLocalizacao, whatsappHandler.ts), não
   *  pra exibir. */
  enderecoParaChecagem: string
  /** Endereço completo formatado (logradouro, número, bairro, cidade) —
   *  vai no cartão de localização nativo (campo `address`) e no link de
   *  fallback do Google Maps quando não há lat/long cadastrados. */
  enderecoCompleto: string
  /** Mesmos campos usados pelo mapa embutido da página pública
   *  ([...slug]/page.tsx) — null se o estabelecimento não preencheu. */
  latitude: number | null
  longitude: number | null
}

/** Busca só os campos de endereço/coordenadas — usada exclusivamente pra
 *  decidir se manda a localização real depois de uma resposta (atalho ou
 *  IA) já ter falado do endereço. Deliberadamente mais enxuta que
 *  buildCardapioContextPorId (sem cardápio/horário/comodidades) pra não
 *  pesar o caminho do atalho "custo zero". `null` se não há endereço
 *  cadastrado (nada pra checar/enviar). */
export async function buscarDadosLocalizacao(estabelecimentoId: string): Promise<DadosLocalizacaoEstabelecimento | null> {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('estabelecimentos')
    .select('nome, nome_fantasia, endereco, numero, tipo_logradouro, latitude, longitude, bairros(nome), cidades(nome)')
    .eq('id', estabelecimentoId)
    .maybeSingle()
  if (!data || !data.endereco) return null
  const est = data as unknown as {
    nome: string
    nome_fantasia: string | null
    endereco: string
    numero: string | null
    tipo_logradouro: string | null
    latitude: number | null
    longitude: number | null
    bairros: { nome: string } | { nome: string }[] | null
    cidades: { nome: string } | { nome: string }[] | null
  }
  const bairro = primeiroNome(est.bairros)
  const cidade = primeiroNome(est.cidades)
  const enderecoParaChecagem = [est.tipo_logradouro, est.endereco].filter(Boolean).join(' ')
  const enderecoCompleto = [enderecoParaChecagem, est.numero, bairro, cidade].filter(Boolean).join(', ')
  return {
    nome: est.nome_fantasia || est.nome,
    enderecoParaChecagem,
    enderecoCompleto,
    latitude: est.latitude,
    longitude: est.longitude,
  }
}

function primeiroNome(v: { nome: string } | { nome: string }[] | null): string | null {
  return (Array.isArray(v) ? v[0] : v)?.nome ?? null
}

async function montarContextoDoEstabelecimento(
  supabase: ClientePublico,
  est: EstabelecimentoBruto
): Promise<EstabelecimentoContexto> {
  const estabelecimentoId = est.id
  const nome = est.nome_fantasia || est.nome
  const dadosFixos = {
    endereco: formatarEndereco(est),
    horario: await formatarHorario(supabase, estabelecimentoId),
    comodidades: formatarComodidades(est),
    // Métodos aceitos ao finalizar pedido pelo cardápio — não existe
    // campo de cadastro "formas de pagamento aceitas" por estabelecimento
    // hoje, é a mesma constante da plataforma inteira usada na tela de
    // finalizar pedido (SeletorFormaPagamento.tsx).
    formasPagamento: METODOS_PAGAMENTO.join(', '),
  }

  const { data: menus } = await supabase
    .from('menus')
    .select('id')
    .eq('estabelecimento_id', estabelecimentoId)
    .order('created_at', { ascending: true })
    .limit(1)
  const menu = menus?.[0]
  if (!menu) return { id: estabelecimentoId, nome, itens: [], ...dadosFixos }

  const { data: categorias } = await supabase
    .from('categorias')
    .select('id, nome')
    .eq('menu_id', menu.id)
    .order('ordem')
  const catIds = (categorias || []).map((c: CategoriaBruta) => c.id)
  if (catIds.length === 0) return { id: estabelecimentoId, nome, itens: [], ...dadosFixos }
  const nomePorCategoria = new Map((categorias || []).map((c: CategoriaBruta) => [c.id, c.nome]))

  // Propositalmente sem `.eq('disponivel', true)` — o AI Waiter precisa
  // saber dos itens indisponíveis pra poder avisar o cliente sobre eles
  // em vez de simplesmente não conhecê-los.
  const { data: itens } = await supabase
    .from('itens_cardapio')
    .select('id, nome, descricao, preco, preco_promocional, disponivel, categoria_id, item_allergens(allergen:allergen_id(nome))')
    .in('categoria_id', catIds)
    .order('ordem')
  const itensRows = (itens || []) as unknown as ItemCardapioBruto[]

  const herdadosPorItem = await resolverAlergenosHerdados(supabase, estabelecimentoId, itensRows.map((i) => i.id))

  const itensContexto: ItemCardapioContexto[] = itensRows.map((item) => {
    const diretos = (item.item_allergens || [])
      .map((r) => r.allergen?.nome)
      .filter((n): n is string => Boolean(n))
    const herdados = herdadosPorItem.get(item.id) || []
    return {
      nome: item.nome,
      descricao: item.descricao,
      preco: item.preco,
      precoPromocional: item.preco_promocional,
      disponivel: item.disponivel,
      categoria: nomePorCategoria.get(item.categoria_id) || '',
      alergenos: Array.from(new Set([...diretos, ...herdados])),
    }
  })

  return { id: estabelecimentoId, nome, itens: itensContexto, ...dadosFixos }
}

/** Mesmos campos reais de ComodidadesTab.tsx (aceita_pets, acessibilidade)
 *  + estacionamento (já formatado por LABEL_ESTACIONAMENTO, mesmo rótulo
 *  do atalho de palavra-chave) — string vazia se nada estiver preenchido
 *  no cadastro, nunca um valor de exemplo. */
function formatarComodidades(est: EstabelecimentoBruto): string {
  const partes: string[] = []
  if (est.estacionamento) partes.push(LABEL_ESTACIONAMENTO[est.estacionamento] || '')
  if (est.aceita_pets) partes.push('Aceita pets.')
  if (est.acessibilidade && est.acessibilidade.length > 0) {
    partes.push(`Acessibilidade: ${est.acessibilidade.join(', ')}.`)
  }
  return partes.filter(Boolean).join(' ')
}

/** Mesma lógica recursiva de `alergenosHerdados()` em fichaTecnicaRepository.ts
 *  (insumo direto + sub-ficha em qualquer profundidade), só que resolvida em
 *  lote pra todos os itens do estabelecimento de uma vez — poucas queries em
 *  vez de uma cadeia de round-trips por item. */
async function resolverAlergenosHerdados(
  supabase: ClientePublico,
  estabelecimentoId: string,
  itemIds: string[]
): Promise<Map<string, string[]>> {
  const resultado = new Map<string, string[]>()
  if (itemIds.length === 0) return resultado

  const { data: fichas } = await supabase
    .from('fichas_tecnicas')
    .select('id, cardapio_item_id')
    .eq('estabelecimento_id', estabelecimentoId)
    .not('cardapio_item_id', 'is', null)
  const fichasComItem = (fichas || []) as FichaTecnicaBruta[]
  if (fichasComItem.length === 0) return resultado

  const { data: todasFichas } = await supabase
    .from('fichas_tecnicas').select('id').eq('estabelecimento_id', estabelecimentoId)
  const todosFichaIds = (todasFichas || []).map((f: { id: string }) => f.id)
  if (todosFichaIds.length === 0) return resultado

  const { data: composicao } = await supabase
    .from('ficha_tecnica_itens')
    .select('ficha_tecnica_id, tipo, insumo_id, sub_ficha_id')
    .in('ficha_tecnica_id', todosFichaIds)
  const composicaoRows = (composicao || []) as ComposicaoBruta[]

  const composicaoPorFicha = new Map<string, ComposicaoBruta[]>()
  for (const linha of composicaoRows) {
    const lista = composicaoPorFicha.get(linha.ficha_tecnica_id) || []
    lista.push(linha)
    composicaoPorFicha.set(linha.ficha_tecnica_id, lista)
  }

  const insumoIds = Array.from(new Set(
    composicaoRows.filter((l) => l.tipo === 'insumo' && l.insumo_id).map((l) => l.insumo_id as string)
  ))
  const alergenosPorInsumo = new Map<string, string[]>()
  if (insumoIds.length > 0) {
    const { data: insumoAlergenos } = await supabase
      .from('insumo_allergens')
      .select('insumo_id, allergen:allergen_id(nome)')
      .in('insumo_id', insumoIds)
    for (const row of (insumoAlergenos || []) as unknown as { insumo_id: string; allergen: { nome: string } | null }[]) {
      const nomeAlergeno = row.allergen?.nome
      if (!nomeAlergeno) continue
      const lista = alergenosPorInsumo.get(row.insumo_id) || []
      lista.push(nomeAlergeno)
      alergenosPorInsumo.set(row.insumo_id, lista)
    }
  }

  function resolverFicha(fichaId: string, visitados: Set<string>): string[] {
    if (visitados.has(fichaId)) return []
    visitados.add(fichaId)
    const nomes = new Set<string>()
    for (const linha of composicaoPorFicha.get(fichaId) || []) {
      if (linha.tipo === 'insumo' && linha.insumo_id) {
        for (const n of alergenosPorInsumo.get(linha.insumo_id) || []) nomes.add(n)
      } else if (linha.tipo === 'sub_ficha' && linha.sub_ficha_id) {
        for (const n of resolverFicha(linha.sub_ficha_id, visitados)) nomes.add(n)
      }
    }
    return Array.from(nomes)
  }

  for (const ficha of fichasComItem) {
    if (!ficha.cardapio_item_id) continue
    resultado.set(ficha.cardapio_item_id, resolverFicha(ficha.id, new Set()))
  }

  return resultado
}
