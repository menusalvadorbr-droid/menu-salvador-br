'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logSupabaseError } from '@/lib/supabase/logError'

export default function GoogleReviewsTab({
  estabelecimentoId,
  placeIdAtual,
}: {
  estabelecimentoId: string
  placeIdAtual: string | null
}) {
  const supabase = createClient()
  const [placeId, setPlaceId] = useState(placeIdAtual || '')
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  async function salvar() {
    setSalvando(true)
    try {
      const { error } = await supabase
        .from('estabelecimentos')
        .update({ google_place_id: placeId.trim() || null })
        .eq('id', estabelecimentoId)

      if (error) throw new Error(error.message)

      // Apaga o cache antigo pra forçar uma busca fresca na próxima
      // visita à página pública, refletindo o novo Place ID na hora.
      await supabase.from('google_reviews_cache').delete().eq('estabelecimento_id', estabelecimentoId)

      setSalvo(true)
      setTimeout(() => setSalvo(false), 2000)
    } catch (err) {
      logSupabaseError('Erro ao salvar Place ID do Google', err)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-1 text-sm font-semibold text-neutral-800">⭐ Avaliações do Google</h3>
        <p className="text-xs text-neutral-500">
          Mostra a nota e comentários do Google Maps na sua página pública (se essa seção estiver
          ativada pelo admin geral da plataforma). Atualiza sozinho a cada 24h.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-700">Place ID do Google</label>
        <input
          value={placeId}
          onChange={(e) => setPlaceId(e.target.value)}
          placeholder="Ex: ChIJN1t_tDeuEmsRUsoyG83frY4"
          className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
        />
        <p className="mt-1 text-xs text-neutral-400">
          Ache o seu em{' '}
          <a
            href="https://developers.google.com/maps/documentation/places/web-service/place-id"
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
          >
            developers.google.com/maps/documentation/places/web-service/place-id
          </a>{' '}
          (ferramenta "Place ID Finder").
        </p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={salvar}
          disabled={salvando}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
        {salvo && <span className="text-sm text-green-600">Salvo ✓</span>}
      </div>
    </div>
  )
}
