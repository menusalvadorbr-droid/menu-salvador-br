'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logSupabaseError } from '@/lib/supabase/logError'
import Filtros from './Filtros'
import CategoriaIconStrip from './CategoriaIconStrip'
import GridEstabelecimentos from './GridEstabelecimentos'

interface ExploradorEstabelecimentosProps {
  estabelecimentosIniciais: any[]
  bairros: { id: string; nome: string; slug: string }[]
  tiposCozinha: { id: number; nome: string; slug: string; icone: string | null }[]
  mostrarFiltros?: boolean
}

/**
 * Une os filtros de bairro/cozinha (client-side) com o grid de resultados.
 *
 * O filtro de cozinha comparava com `estabelecimentos.tipo_cozinha`, uma
 * coluna solta de texto — mas a edição de culinária (EditorCulinarias,
 * até 3 tipos por estabelecimento) grava numa tabela de junção,
 * `estabelecimento_tipos_cozinha`, que é a fonte de verdade desde essa
 * mudança. A coluna antiga nunca é atualizada por lá, então o filtro
 * clicando num ícone de categoria não achava estabelecimentos
 * cadastrados pelo editor atual. Corrigido pra consultar a tabela de
 * junção (mesmo padrão já usado em /culinaria/[slug]).
 *
 * O filtro de bairro usa bairro_id (tabela bairros, com slug), em vez
 * do texto livre — necessário pros links ficarem com slug limpo em vez
 * de "/Santo%20Ant%C3%B4nio".
 */
export default function ExploradorEstabelecimentos({
  estabelecimentosIniciais,
  bairros,
  tiposCozinha,
  mostrarFiltros = true,
}: ExploradorEstabelecimentosProps) {
  const supabase = createClient()
  const [bairroId, setBairroId] = useState('')
  const [tipoCozinhaId, setTipoCozinhaId] = useState<number | null>(null)
  const [estabelecimentos, setEstabelecimentos] = useState(estabelecimentosIniciais)
  const [loading, setLoading] = useState(false)

  const buscar = useCallback(async () => {
    if (!bairroId && !tipoCozinhaId) {
      setEstabelecimentos(estabelecimentosIniciais)
      return
    }

    setLoading(true)

    // Filtro de culinária: resolve primeiro quais estabelecimentos têm
    // esse tipo vinculado (tabela de junção), depois filtra por id — mais
    // simples e confiável do que embutir o filtro dentro do select().
    let idsComCulinaria: string[] | null = null
    if (tipoCozinhaId) {
      const { data: vinculos, error: vinculosError } = await supabase
        .from('estabelecimento_tipos_cozinha')
        .select('estabelecimento_id')
        .eq('tipo_cozinha_id', tipoCozinhaId)

      if (vinculosError) {
        logSupabaseError('Erro ao filtrar por culinária', vinculosError)
        setLoading(false)
        return
      }
      idsComCulinaria = (vinculos || []).map((v: any) => v.estabelecimento_id)
      if (idsComCulinaria.length === 0) {
        setEstabelecimentos([])
        setLoading(false)
        return
      }
    }

    let query = supabase
      .from('estabelecimentos')
      .select('*, bairros(nome, slug), estabelecimento_tipos_cozinha(tipos_cozinha(nome, icone))')
      .eq('status', 'active')
      .eq('ativo', true)

    if (bairroId) query = query.eq('bairro_id', bairroId)
    if (idsComCulinaria) query = query.in('id', idsComCulinaria)

    const { data, error } = await query.order('destaque', { ascending: false }).limit(30)

    if (error) {
      logSupabaseError('Erro ao filtrar estabelecimentos', error)
    } else {
      setEstabelecimentos(data || [])
    }
    setLoading(false)
  }, [bairroId, tipoCozinhaId, estabelecimentosIniciais, supabase])

  useEffect(() => {
    buscar()
  }, [buscar])

  return (
    <div>
      {mostrarFiltros && (
        <>
          <CategoriaIconStrip
            tiposCozinha={tiposCozinha}
            ativoId={tipoCozinhaId}
            onSelecionar={setTipoCozinhaId}
          />
          <Filtros
            bairroId={bairroId}
            bairros={bairros}
            temFiltroAtivo={Boolean(bairroId || tipoCozinhaId)}
            onChangeBairro={setBairroId}
            onLimpar={() => {
              setBairroId('')
              setTipoCozinhaId(null)
            }}
          />
        </>
      )}
      <div className="container mx-auto px-4 py-10">
        {loading ? (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-2xl border border-neutral-100">
                <div className="h-48 bg-neutral-100" />
                <div className="space-y-2 p-5">
                  <div className="h-4 w-2/3 rounded bg-neutral-100" />
                  <div className="h-3 w-1/2 rounded bg-neutral-100" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <GridEstabelecimentos estabelecimentos={estabelecimentos} />
        )}
      </div>
    </div>
  )
}
