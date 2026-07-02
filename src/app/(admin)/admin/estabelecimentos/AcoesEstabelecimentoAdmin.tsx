'use client'

import { useTransition } from 'react'
import { moderarEstabelecimento, excluirEstabelecimento } from './actions'

interface Props {
  estabelecimentoId: string
  nomeExibicao: string
  isPending: boolean
  isBlocked: boolean
  temDono: boolean
}

export function AcoesEstabelecimentoAdmin({
  estabelecimentoId,
  nomeExibicao,
  isPending,
  isBlocked,
  temDono,
}: Props) {
  const [isTransitioning, startTransition] = useTransition()

  const executar = (acao: 'approve' | 'block' | 'unblock' | 'unlink') => {
    startTransition(async () => {
      try {
        await moderarEstabelecimento(estabelecimentoId, acao)
      } catch (err) {
        console.error('Erro ao moderar:', err)
        alert('Erro ao executar ação.')
      }
    })
  }

  const handleExcluir = () => {
    if (!confirm(`Tem certeza que deseja excluir permanentemente "${nomeExibicao}"? Esta ação não pode ser desfeita.`)) {
      return
    }
    startTransition(async () => {
      try {
        await excluirEstabelecimento(estabelecimentoId)
      } catch (err) {
        console.error('Erro ao excluir:', err)
        alert('Erro ao excluir estabelecimento.')
      }
    })
  }

  return (
    <>
      {isPending && (
        <button
          type="button"
          disabled={isTransitioning}
          onClick={() => executar('approve')}
          className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          ✅ Aprovar
        </button>
      )}

      {!isBlocked && (
        <button
          type="button"
          disabled={isTransitioning}
          onClick={() => executar('block')}
          className="inline-flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          🚫 Bloquear
        </button>
      )}

      {isBlocked && (
        <button
          type="button"
          disabled={isTransitioning}
          onClick={() => executar('unblock')}
          className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          🔓 Desbloquear
        </button>
      )}

      {temDono && (
        <button
          type="button"
          disabled={isTransitioning}
          onClick={() => executar('unlink')}
          className="inline-flex items-center gap-1 bg-orange-500 hover:bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          🔓 Desvincular
        </button>
      )}

      <button
        type="button"
        disabled={isTransitioning}
        onClick={handleExcluir}
        className="inline-flex items-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
      >
        🗑️ Excluir
      </button>
    </>
  )
}
