'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logSupabaseError } from '@/lib/supabase/logError'
import { planoTemRecurso } from '@/lib/recursosPlano'

interface Estabelecimento {
  id: string
  idiomas_ativos?: string[] | null
}

const IDIOMAS_DISPONIVEIS = [
  { valor: 'en', label: 'Inglês (EN)' },
  { valor: 'fr', label: 'Francês (FR)' },
  { valor: 'es', label: 'Espanhol (ES)' },
]

export default function IdiomasTab({
  estabelecimento,
  recursosPlano,
}: {
  estabelecimento: Estabelecimento
  recursosPlano?: string[]
}) {
  const supabase = createClient()
  const temIdiomas = planoTemRecurso(recursosPlano, 'idiomas')
  const [idiomasAtivos, setIdiomasAtivos] = useState<string[]>(estabelecimento.idiomas_ativos || [])
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)

  function toggleIdioma(idioma: string) {
    if (!temIdiomas) return
    setIdiomasAtivos((prev) =>
      prev.includes(idioma) ? prev.filter((i) => i !== idioma) : [...prev, idioma]
    )
  }

  async function salvar() {
    if (!temIdiomas) return
    setSalvando(true)
    try {
      const { error } = await supabase
        .from('estabelecimentos')
        .update({ idiomas_ativos: idiomasAtivos })
        .eq('id', estabelecimento.id)

      if (error) throw new Error(error.message)
      setSalvo(true)
      setTimeout(() => setSalvo(false), 2000)
    } catch (err) {
      logSupabaseError('Erro ao salvar idiomas', err)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-1 flex items-center gap-2">
          <h3 className="text-sm font-semibold text-neutral-800">🌐 Idiomas</h3>
          {!temIdiomas && (
            <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] font-semibold text-neutral-400">
              Recurso de plano superior
            </span>
          )}
        </div>
        <p className="text-xs text-neutral-500">
          Ative os idiomas em que você quer oferecer o cardápio. Depois de ativado, preencha a tradução
          de cada item e categoria na aba Cardápio — sem tradução preenchida, o cardápio mostra o texto
          em português normalmente.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        {IDIOMAS_DISPONIVEIS.map((idioma) => (
          <label
            key={idioma.valor}
            className={`flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-4 ${
              temIdiomas ? '' : 'opacity-50 cursor-not-allowed'
            }`}
          >
            <input
              type="checkbox"
              checked={idiomasAtivos.includes(idioma.valor)}
              onChange={() => toggleIdioma(idioma.valor)}
              disabled={!temIdiomas}
              className="h-4 w-4"
            />
            <span className="text-sm text-neutral-800">{idioma.label}</span>
          </label>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={salvar}
          disabled={salvando || !temIdiomas}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-50"
        >
          {salvando ? 'Salvando...' : 'Salvar idiomas'}
        </button>
        {salvo && <span className="text-sm text-green-600">Salvo ✓</span>}
      </div>
    </div>
  )
}
