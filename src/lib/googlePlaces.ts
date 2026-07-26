import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'

const HORAS_CACHE = 24

export interface AvaliacaoGoogle {
  autor: string
  autorFotoUrl?: string
  nota: number
  texto: string
  tempoRelativo: string
  linkAutor?: string
}

export interface ResumoAvaliacoesGoogle {
  notaMedia: number | null
  totalAvaliacoes: number | null
  avaliacoes: AvaliacaoGoogle[]
  atualizadoEm: string
  placeId: string
}

/**
 * Busca as avaliações do Google de um estabelecimento, usando cache de
 * 24h no banco (google_reviews_cache). A API do Google cobra por chamada
 * quando o campo `reviews` é solicitado (~US$25 a cada 1000 chamadas) —
 * então NUNCA chamamos a Google API direto na visita de um usuário, só
 * quando o cache está velho ou não existe.
 *
 * Retorna null se o estabelecimento não tiver um Place ID configurado.
 */
export async function obterAvaliacoesGoogle(estabelecimentoId: string): Promise<ResumoAvaliacoesGoogle | null> {
  const supabase = await createClient()

  const { data: est } = await supabase
    .from('estabelecimentos')
    .select('google_place_id')
    .eq('id', estabelecimentoId)
    .maybeSingle()

  if (!est?.google_place_id) return null

  const { data: cache } = await supabase
    .from('google_reviews_cache')
    .select('*')
    .eq('estabelecimento_id', estabelecimentoId)
    .maybeSingle()

  const cacheValido =
    cache &&
    !cache.erro &&
    new Date(cache.atualizado_em).getTime() > Date.now() - HORAS_CACHE * 60 * 60 * 1000

  if (cacheValido) {
    return {
      notaMedia: cache.nota_media,
      totalAvaliacoes: cache.total_avaliacoes,
      avaliacoes: cache.reviews || [],
      atualizadoEm: cache.atualizado_em,
      placeId: est.google_place_id,
    }
  }

  // Cache velho ou inexistente — busca fresco na Google e atualiza o cache.
  const fresco = await buscarNaGoogleEAtualizarCache(estabelecimentoId, est.google_place_id)
  if (fresco) return fresco

  // Se a busca falhar (API fora do ar, chave inválida, etc.), ainda assim
  // mostra o cache antigo em vez de nada — melhor mostrar dado de ontem
  // do que não mostrar nada.
  if (cache) {
    return {
      notaMedia: cache.nota_media,
      totalAvaliacoes: cache.total_avaliacoes,
      avaliacoes: cache.reviews || [],
      atualizadoEm: cache.atualizado_em,
      placeId: est.google_place_id,
    }
  }

  return null
}

async function buscarNaGoogleEAtualizarCache(
  estabelecimentoId: string,
  placeId: string
): Promise<ResumoAvaliacoesGoogle | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    console.warn('GOOGLE_PLACES_API_KEY não configurada — avaliações do Google desativadas.')
    return null
  }

  try {
    const resposta = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'rating,userRatingsTotal,reviews',
      },
      // Revalida no máximo uma vez por dia mesmo se chamado várias vezes
      // em rápida sucessão (proteção extra além do cache no banco).
      next: { revalidate: 60 * 60 * HORAS_CACHE },
    })

    if (!resposta.ok) {
      throw new Error(`Google Places API retornou ${resposta.status}`)
    }

    const dados = await resposta.json()

    const avaliacoes: AvaliacaoGoogle[] = (dados.reviews || []).slice(0, 5).map((r: any) => ({
      autor: r.authorAttribution?.displayName || 'Cliente do Google',
      autorFotoUrl: r.authorAttribution?.photoUri,
      nota: r.rating,
      texto: r.text?.text || '',
      tempoRelativo: r.relativePublishTimeDescription || '',
      linkAutor: r.authorAttribution?.uri,
    }))

    const resumo: ResumoAvaliacoesGoogle = {
      notaMedia: dados.rating ?? null,
      totalAvaliacoes: dados.userRatingsTotal ?? null,
      avaliacoes,
      atualizadoEm: new Date().toISOString(),
      placeId,
    }

    // supabaseAdmin porque isso pode rodar num contexto sem sessão de
    // usuário (ex: revalidação em background) e precisa ignorar RLS.
    await supabaseAdmin.from('google_reviews_cache').upsert({
      estabelecimento_id: estabelecimentoId,
      nota_media: resumo.notaMedia,
      total_avaliacoes: resumo.totalAvaliacoes,
      reviews: resumo.avaliacoes,
      atualizado_em: resumo.atualizadoEm,
      erro: null,
    })

    return resumo
  } catch (erro) {
    console.error('Erro ao buscar avaliações do Google:', erro)
    await supabaseAdmin
      .from('google_reviews_cache')
      .upsert({
        estabelecimento_id: estabelecimentoId,
        atualizado_em: new Date().toISOString(),
        erro: erro instanceof Error ? erro.message : 'Erro desconhecido',
      })
    return null
  }
}
