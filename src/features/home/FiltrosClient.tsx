'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import Filtros from './Filtros'
import CategoriaIconStrip from './CategoriaIconStrip'

interface FiltrosClientProps {
  bairros: { id: string; nome: string; slug: string; cidadeId: string; nomeCidade: string }[]
  tiposCozinha: { id: number; nome: string; slug: string; icone: string | null }[]
}

/**
 * Filtros de bairro/culinária dirigidos pela URL (?bairro=...&tipo=...)
 * em vez de estado local — decoupla essa seção do Grid geral (mais
 * abaixo na página, seu próprio <Suspense>), que lê os mesmos
 * searchParams pra saber o que buscar. Preserva `q` (busca por texto) ao
 * trocar de filtro, e vice-versa (ver BuscaHome).
 */
export default function FiltrosClient({ bairros, tiposCozinha }: FiltrosClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const bairroId = searchParams.get('bairro') || ''
  const tipoStr = searchParams.get('tipo')
  const tipoCozinhaId = tipoStr ? Number(tipoStr) : null

  function atualizarUrl(mudancas: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [chave, valor] of Object.entries(mudancas)) {
      if (valor) params.set(chave, valor)
      else params.delete(chave)
    }
    router.push(params.toString() ? `/?${params.toString()}` : '/')
  }

  return (
    <>
      <CategoriaIconStrip
        tiposCozinha={tiposCozinha}
        ativoId={tipoCozinhaId}
        onSelecionar={(id) => atualizarUrl({ tipo: id ? String(id) : null })}
      />
      <Filtros
        bairroId={bairroId}
        bairros={bairros}
        temFiltroAtivo={Boolean(bairroId || tipoCozinhaId)}
        onChangeBairro={(id) => atualizarUrl({ bairro: id || null })}
        onLimpar={() => atualizarUrl({ bairro: null, tipo: null })}
      />
    </>
  )
}
