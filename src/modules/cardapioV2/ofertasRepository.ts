import { createClient } from '@/lib/supabase/client'
import { createPublicClient } from '@/lib/supabase/publicServer'
import { logSupabaseError } from '@/lib/supabase/logError'
import type { CardapioV2Oferta, CardapioV2RegraExibicao } from './types'

export interface OfertaComRegra {
  oferta: CardapioV2Oferta
  regra: CardapioV2RegraExibicao | null
}

// error do supabase-js é um objeto plano (PostgrestError), não Error —
// lançar direto faz o overlay do Next mostrar "[object Object]" em vez da
// mensagem real. Mesmo padrão de estoqueRepository.ts/itemRepository.ts.

export async function listarOfertas(estabelecimentoId: string): Promise<CardapioV2Oferta[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cardapio_v2_ofertas')
    .select('*')
    .eq('estabelecimento_id', estabelecimentoId)
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

interface OfertaBrutaComRegras extends CardapioV2Oferta {
  cardapio_v2_regras_exibicao: CardapioV2RegraExibicao[]
}

/** Leitura pública (página do cardápio V2) — só ofertas ativas, cliente
 *  anônimo, já com a regra de agendamento (0 ou 1, tipo='promocao')
 *  embutida — evita uma consulta extra por oferta. `ativo=false` já filtra
 *  no banco; a janela de tempo em si (resolverEstadoOferta) é sempre
 *  resolvida no navegador, não aqui — a página tem ISR e o estado "ativo
 *  agora" não pode ficar preso ao cache. */
export async function listarOfertasPublicas(estabelecimentoId: string): Promise<OfertaComRegra[]> {
  const supabase = createPublicClient()
  const { data, error } = await supabase
    .from('cardapio_v2_ofertas')
    .select('*, cardapio_v2_regras_exibicao(*)')
    .eq('estabelecimento_id', estabelecimentoId)
    .eq('ativo', true)
    .order('created_at', { ascending: false })
  if (error) {
    logSupabaseError('Erro ao buscar ofertas do Cardápio V2:', error)
    return []
  }
  return ((data ?? []) as unknown as OfertaBrutaComRegras[]).map(({ cardapio_v2_regras_exibicao, ...oferta }) => ({
    oferta,
    regra: cardapio_v2_regras_exibicao.find((r) => r.tipo === 'promocao') ?? null,
  }))
}

export interface DadosOferta {
  nome: string
  descricao: string | null
  fotoUrl: string | null
  precoDe: number | null
  precoPor: number
  cardLargo: boolean
  ativo: boolean
  alertaMinutos: number
}

export async function criarOferta(estabelecimentoId: string, dados: DadosOferta): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('cardapio_v2_ofertas')
    .insert({
      estabelecimento_id: estabelecimentoId,
      nome: dados.nome,
      descricao: dados.descricao,
      foto_url: dados.fotoUrl,
      preco_de: dados.precoDe,
      preco_por: dados.precoPor,
      card_largo: dados.cardLargo,
      ativo: dados.ativo,
      alerta_minutos: dados.alertaMinutos,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return data.id
}

export async function atualizarOferta(ofertaId: string, dados: DadosOferta): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('cardapio_v2_ofertas')
    .update({
      nome: dados.nome,
      descricao: dados.descricao,
      foto_url: dados.fotoUrl,
      preco_de: dados.precoDe,
      preco_por: dados.precoPor,
      card_largo: dados.cardLargo,
      ativo: dados.ativo,
      alerta_minutos: dados.alertaMinutos,
      updated_at: new Date().toISOString(),
    })
    .eq('id', ofertaId)
  if (error) throw new Error(error.message)
}

export async function alternarAtivoOferta(ofertaId: string, ativo: boolean): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('cardapio_v2_ofertas').update({ ativo }).eq('id', ofertaId)
  if (error) throw new Error(error.message)
}

export async function removerOferta(ofertaId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from('cardapio_v2_ofertas').delete().eq('id', ofertaId)
  if (error) throw new Error(error.message)
}
