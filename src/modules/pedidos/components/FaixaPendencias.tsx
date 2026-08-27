'use client'

import { useState } from 'react'
import { useFilaIA } from '@/modules/operador/hooks/useFilaIA'
import { useFilaPix } from '@/modules/operador/hooks/useFilaPix'
import { useFilaValidacao } from '@/modules/operador/hooks/useFilaValidacao'
import SecaoIAPrecisaDeVoce from '@/modules/operador/components/SecaoIAPrecisaDeVoce'
import SecaoPixAguardando from '@/modules/operador/components/SecaoPixAguardando'
import SecaoValidarEntrega from '@/modules/operador/components/SecaoValidarEntrega'

type Tipo = 'ia' | 'pix' | 'validacao'

/** Traz as mesmas 3 pendências da Fila do Operador (/operador) pra dentro
 *  do board de comandas, sem trocar de rota — reaproveita os mesmos
 *  componentes de seção (com mostrarTitulo=false pra não duplicar o
 *  título) e os mesmos hooks Realtime, só pras contagens dos pills. Mesma
 *  duplicação de assinatura que já existe entre outros hooks deste
 *  projeto (cada Secao também assina por conta própria quando expandida)
 *  — não é regressão, é o padrão já estabelecido aqui. */
export default function FaixaPendencias({ estabelecimentoId }: { estabelecimentoId: string }) {
  const [expandido, setExpandido] = useState<Tipo | null>(null)
  const { conversas } = useFilaIA(estabelecimentoId)
  const { pedidos: pixPendentes } = useFilaPix(estabelecimentoId)
  const { validacoes } = useFilaValidacao(estabelecimentoId)

  const pills: { tipo: Tipo; label: string }[] = [
    ...(conversas.length > 0 ? [{ tipo: 'ia' as const, label: `🔔 ${conversas.length} IA aguardando` }] : []),
    ...(pixPendentes.length > 0 ? [{ tipo: 'pix' as const, label: `💰 ${pixPendentes.length} Pix pendente` }] : []),
    ...(validacoes.length > 0 ? [{ tipo: 'validacao' as const, label: `📦 ${validacoes.length} entrega pra validar` }] : []),
  ]

  if (pills.length === 0) return null

  function alternar(tipo: Tipo) {
    setExpandido((atual) => (atual === tipo ? null : tipo))
  }

  return (
    <div className="mb-4 flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {pills.map((pill) => (
          <button
            key={pill.tipo}
            onClick={() => alternar(pill.tipo)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
              expandido === pill.tipo
                ? 'border-neutral-900 bg-neutral-900 text-white'
                : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
            }`}
          >
            {pill.label}
          </button>
        ))}
      </div>

      {expandido === 'ia' && <SecaoIAPrecisaDeVoce estabelecimentoId={estabelecimentoId} mostrarTitulo={false} />}
      {expandido === 'pix' && <SecaoPixAguardando estabelecimentoId={estabelecimentoId} mostrarTitulo={false} />}
      {expandido === 'validacao' && <SecaoValidarEntrega estabelecimentoId={estabelecimentoId} mostrarTitulo={false} />}
    </div>
  )
}
