'use client'

import { useEffect, useState, useCallback } from 'react'
import { sincronizarPendentes } from '../ordersRepository'
import { temPendentes } from '../localQueue'

export function useSincronizacaoPedidos() {
  const [pendentes, setPendentes] = useState(0)
  const [sincronizando, setSincronizando] = useState(false)

  const tentarSincronizar = useCallback(async () => {
    if (!temPendentes()) {
      setPendentes(0)
      return
    }
    setSincronizando(true)
    try {
      const resultado = await sincronizarPendentes()
      setPendentes(resultado.restantes)
    } finally {
      setSincronizando(false)
    }
  }, [])

  useEffect(() => {
    // Checa quantos pedidos estão pendentes assim que a página carrega
    setPendentes(temPendentes() ? 1 : 0)

    // Tenta sincronizar assim que o navegador informar que voltou a ter rede
    window.addEventListener('online', tentarSincronizar)

    // E também tenta periodicamente (o evento 'online' nem sempre dispara
    // de forma confiável em todos os navegadores/dispositivos)
    const intervalo = setInterval(tentarSincronizar, 15000)

    // Tenta uma vez ao montar, caso já existam pendentes de uma sessão anterior
    tentarSincronizar()

    return () => {
      window.removeEventListener('online', tentarSincronizar)
      clearInterval(intervalo)
    }
  }, [tentarSincronizar])

  return { pendentes, sincronizando }
}
