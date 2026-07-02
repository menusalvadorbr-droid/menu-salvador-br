'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logSupabaseError } from '@/lib/supabase/logError'
import Filtros from './Filtros'
import GridEstabelecimentos from './GridEstabelecimentos'

interface ExploradorEstabelecimentosProps {
  estabelecimentosIniciais: any[]
}

/**
 * Une os filtros de bairro/cozinha (client-side) com o grid de resultados.
 * Antes esses componentes existiam mas não estavam conectados a lugar
 * nenhum — os filtros não faziam nenhuma busca de verdade.
 */
export default function ExploradorEstabelecimentos({
  estabelecimentosIniciais,
}: ExploradorEstabelecimentosProps) {
  const supabase = createClient()
  const [bairro, setBairro] = useState('')
  const [tipoCozinha, setTipoCozinha] = useState('')
  const [estabelecimentos, setEstabelecimentos] = useState(estabelecimentosIniciais)
  const [loading, setLoading] = useState(false)

  const buscar = useCallback(async () => {
    if (!bairro && !tipoCozinha) {
      setEstabelecimentos(estabelecimentosIniciais)
      return
    }

    setLoading(true)
    let query = supabase
      .from('estabelecimentos')
      .select('*')
      .eq('status', 'active')
      .eq('ativo', true)

    if (bairro) query = query.eq('bairro', bairro)
    if (tipoCozinha) query = query.eq('tipo_cozinha', tipoCozinha)

    const { data, error } = await query.order('destaque', { ascending: false }).limit(30)

    if (error) {
      logSupabaseError('Erro ao filtrar estabelecimentos', error)
    } else {
      setEstabelecimentos(data || [])
    }
    setLoading(false)
  }, [bairro, tipoCozinha, estabelecimentosIniciais, supabase])

  useEffect(() => {
    buscar()
  }, [buscar])

  return (
    <div>
      <Filtros
        bairro={bairro}
        tipoCozinha={tipoCozinha}
        onChange={(f) => {
          setBairro(f.bairro)
          setTipoCozinha(f.tipoCozinha)
        }}
      />
      <div className="container mx-auto px-4 py-10">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
          </div>
        ) : (
          <GridEstabelecimentos estabelecimentos={estabelecimentos} />
        )}
      </div>
    </div>
  )
}
