'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { listarChamadosPendentes, marcarChamadoAtendido, type ChamadoGarcom } from '../chamarGarcomRepository'

export function useChamadosGarcom(estabelecimentoId: string) {
  const [chamados, setChamados] = useState<ChamadoGarcom[]>([])

  const carregar = useCallback(async () => {
    try {
      setChamados(await listarChamadosPendentes(estabelecimentoId))
    } catch {
      // silencioso — não é crítico, o painel de comandas continua funcionando
    }
  }, [estabelecimentoId])

  useEffect(() => {
    carregar()

    const supabase = createClient()
    const canal = supabase
      .channel(`chamados-garcom-${estabelecimentoId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chamados_garcom', filter: `estabelecimento_id=eq.${estabelecimentoId}` },
        () => carregar()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [estabelecimentoId, carregar])

  async function atender(chamadoId: string) {
    setChamados((prev) => prev.filter((c) => c.id !== chamadoId))
    try {
      await marcarChamadoAtendido(chamadoId)
    } catch (err) {
      await carregar()
      alert(`Não foi possível marcar como atendido: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  return { chamados, atender }
}
