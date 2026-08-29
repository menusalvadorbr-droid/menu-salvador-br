import { createClient } from '@/lib/supabase/server'
import GridClient from './GridClient'
import type { EstabelecimentoComJoins, VinculoCulinaria } from './tipos'

const LOTE = 30
// Teto pra busca por texto — sem paginação real no banco pro modo busca
// (ver comentário mais abaixo), então "trazer tudo" precisa de um limite
// de segurança. Bem acima do que uma busca de verdade deveria retornar
// num diretório de uma cidade só.
const LIMITE_BUSCA = 300

const IDS_VAZIO = ['00000000-0000-0000-0000-000000000000']

function normalizar(t: string) {
  return t.trim().toLowerCase()
}

async function resolverIdsComCulinaria(supabase: Awaited<ReturnType<typeof createClient>>, tipoCozinhaId?: string) {
  if (!tipoCozinhaId) return null
  const { data } = await supabase
    .from('estabelecimento_tipos_cozinha')
    .select('estabelecimento_id')
    .eq('tipo_cozinha_id', Number(tipoCozinhaId))
  return ((data || []) as VinculoCulinaria[]).map((v) => v.estabelecimento_id)
}

/**
 * Última seção a carregar de propósito (ver ordem em (public)/page.tsx)
 * — é a consulta mais pesada (junções de bairro/culinária, potencialmente
 * muitas linhas), então fica no fim: as seções mais rápidas/importantes já
 * apareceram antes dela terminar.
 *
 * Dois modos, conforme `q` (searchParams):
 * - Padrão: ordenado por destaque, paginação de verdade via .range()
 *   (cada "carregar mais" é uma consulta nova, só do próximo lote).
 * - Busca: sem `q` não tem "relevância" nenhuma pra ordenar, então esse
 *   modo nem entra em jogo. Com `q`, PostgREST não tem como combinar um
 *   ORDER BY calculado (exata > começa com > contém) com .range() de
 *   forma consistente entre páginas sem uma função no banco — em vez
 *   disso, busca tudo que bate (até LIMITE_BUSCA), ordena uma vez aqui, e
 *   "carregar mais" só revela mais desse array já pronto (ver GridClient).
 */
export default async function GridGeralSecao({
  q,
  bairroId,
  tipoCozinhaId,
}: {
  q?: string
  bairroId?: string
  tipoCozinhaId?: string
}) {
  const supabase = await createClient()
  const idsComCulinaria = await resolverIdsComCulinaria(supabase, tipoCozinhaId)
  const termo = q?.trim()

  if (termo) {
    let query = supabase
      .from('estabelecimentos_publico')
      .select('*, bairros(nome, slug), cidades(slug), tipos_estabelecimento(slug), estabelecimento_tipos_cozinha(tipos_cozinha(nome, icone))')
      .eq('status', 'active')
      .eq('ativo', true)
      .not('bairro_id', 'is', null)
      .not('tipo_estabelecimento', 'is', null)
      .or(`nome.ilike.%${termo}%,nome_fantasia.ilike.%${termo}%,bairro.ilike.%${termo}%,tipo_estabelecimento.ilike.%${termo}%`)
      .limit(LIMITE_BUSCA)

    if (bairroId) query = query.eq('bairro_id', bairroId)
    if (idsComCulinaria) query = query.in('id', idsComCulinaria.length > 0 ? idsComCulinaria : IDS_VAZIO)

    const { data } = await query
    const resultadosBrutos = (data || []) as unknown as EstabelecimentoComJoins[]
    const termoNorm = normalizar(termo)
    const relevancia = (est: EstabelecimentoComJoins) => {
      const nome = normalizar(est.nome_fantasia || est.nome || '')
      if (nome === termoNorm) return 0
      if (nome.startsWith(termoNorm)) return 1
      if (nome.includes(termoNorm)) return 2
      return 3
    }
    const resultados = resultadosBrutos
      .slice()
      .sort((a, b) => {
        const diff = relevancia(a) - relevancia(b)
        if (diff !== 0) return diff
        return (a.nome_fantasia || a.nome).localeCompare(b.nome_fantasia || b.nome)
      })

    return (
      <GridClient
        modo="busca"
        estabelecimentosIniciais={resultados.slice(0, LOTE)}
        todosResultadosBusca={resultados}
        total={resultados.length}
        q={termo}
        bairroId={bairroId}
        tipoCozinhaId={tipoCozinhaId}
      />
    )
  }

  let query = supabase
    .from('estabelecimentos')
    .select('*, bairros(nome, slug), cidades(slug), tipos_estabelecimento(slug), estabelecimento_tipos_cozinha(tipos_cozinha(nome, icone))', { count: 'exact' })
    .eq('status', 'active')
    .eq('ativo', true)
    .not('bairro_id', 'is', null)
    .not('tipo_estabelecimento', 'is', null)

  if (bairroId) query = query.eq('bairro_id', bairroId)
  if (idsComCulinaria) query = query.in('id', idsComCulinaria.length > 0 ? idsComCulinaria : IDS_VAZIO)

  const { data, count } = await query.order('destaque', { ascending: false }).range(0, LOTE - 1)

  return (
    <GridClient
      modo="padrao"
      estabelecimentosIniciais={(data || []) as unknown as EstabelecimentoComJoins[]}
      total={count || 0}
      bairroId={bairroId}
      tipoCozinhaId={tipoCozinhaId}
    />
  )
}
