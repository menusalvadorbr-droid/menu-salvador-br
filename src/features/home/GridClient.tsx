'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import GridEstabelecimentos from './GridEstabelecimentos'
import SectionHeading from '@/components/public/SectionHeading'
import type { EstabelecimentoComJoins, VinculoCulinaria } from './tipos'

const LOTE = 30
const IDS_VAZIO = ['00000000-0000-0000-0000-000000000000']

interface GridClientProps {
  modo: 'padrao' | 'busca'
  estabelecimentosIniciais: EstabelecimentoComJoins[]
  /** Só no modo busca — array completo já buscado e ordenado por
   *  relevância; "carregar mais" revela mais dele em vez de nova consulta. */
  todosResultadosBusca?: EstabelecimentoComJoins[]
  total: number
  q?: string
  bairroId?: string
  tipoCozinhaId?: string
}

/**
 * "Carregar mais" — modo padrão busca o próximo lote via .range() (nova
 * consulta a cada clique); modo busca só revela mais do array que já
 * veio pronto do servidor (ver GridGeralSecao pro motivo).
 */
export default function GridClient({
  modo,
  estabelecimentosIniciais,
  todosResultadosBusca,
  total,
  q,
  bairroId,
  tipoCozinhaId,
}: GridClientProps) {
  const supabase = createClient()
  const [estabelecimentos, setEstabelecimentos] = useState(estabelecimentosIniciais)
  const [carregando, setCarregando] = useState(false)

  const temMais = estabelecimentos.length < total

  async function carregarMais() {
    setCarregando(true)

    if (modo === 'busca' && todosResultadosBusca) {
      setEstabelecimentos(todosResultadosBusca.slice(0, estabelecimentos.length + LOTE))
      setCarregando(false)
      return
    }

    let idsComCulinaria: string[] | null = null
    if (tipoCozinhaId) {
      const { data: vinculos } = await supabase
        .from('estabelecimento_tipos_cozinha')
        .select('estabelecimento_id')
        .eq('tipo_cozinha_id', Number(tipoCozinhaId))
      idsComCulinaria = ((vinculos || []) as VinculoCulinaria[]).map((v) => v.estabelecimento_id)
    }

    let query = supabase
      .from('estabelecimentos_publico')
      .select('*, bairros(nome, slug), cidades(slug), tipos_estabelecimento(slug), estabelecimento_tipos_cozinha(tipos_cozinha(nome, icone))')
      .eq('status', 'active')
      .eq('ativo', true)
      .not('bairro_id', 'is', null)
      .not('tipo_estabelecimento', 'is', null)

    if (bairroId) query = query.eq('bairro_id', bairroId)
    if (idsComCulinaria) query = query.in('id', idsComCulinaria.length > 0 ? idsComCulinaria : IDS_VAZIO)

    const { data } = await query
      .order('destaque', { ascending: false })
      .range(estabelecimentos.length, estabelecimentos.length + LOTE - 1)

    setEstabelecimentos((prev) => [...prev, ...(data || [])])
    setCarregando(false)
  }

  const titulo = q ? `Resultados para "${q}"` : 'Todos os estabelecimentos'

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <SectionHeading title={titulo} />
        {total > 0 && (
          <p className="text-sm text-neutral-400">
            {estabelecimentos.length} de {total} {total === 1 ? 'estabelecimento' : 'estabelecimentos'}
          </p>
        )}
      </div>

      <GridEstabelecimentos estabelecimentos={estabelecimentos} />

      {temMais && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={carregarMais}
            disabled={carregando}
            className="rounded-full border-2 border-[var(--brand-primary)] px-6 py-2.5 text-sm font-semibold text-[var(--brand-primary)] transition hover:bg-[var(--brand-primary)] hover:text-white disabled:opacity-50"
          >
            {carregando ? 'Carregando…' : 'Carregar mais'}
          </button>
        </div>
      )}
    </div>
  )
}
