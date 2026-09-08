'use client'

import { useState, useTransition } from 'react'
import ConfirmarAcaoModal from '@/components/ConfirmarAcaoModal'
import { moderarEstabelecimento, excluirEstabelecimento } from './actions'

interface Props {
  estabelecimentoId: string
  nomeExibicao: string
  isPending: boolean
  isBlocked: boolean
  isExcluido: boolean
  temDono: boolean
}

export function AcoesEstabelecimentoAdmin({
  estabelecimentoId,
  nomeExibicao,
  isPending,
  isBlocked,
  isExcluido,
  temDono,
}: Props) {
  const [isTransitioning, startTransition] = useTransition()
  const [acaoConfirmando, setAcaoConfirmando] = useState<'block' | 'restore' | 'excluir' | null>(null)

  const executar = (acao: 'approve' | 'block' | 'unblock' | 'unlink' | 'restore') => {
    startTransition(async () => {
      try {
        await moderarEstabelecimento(estabelecimentoId, acao)
      } catch (err) {
        console.error('Erro ao moderar:', err)
        alert(err instanceof Error ? err.message : 'Erro ao executar ação.')
      }
    })
  }

  const handleClickAcao = (acao: 'approve' | 'block' | 'unblock' | 'unlink' | 'restore') => {
    if (acao === 'block' || acao === 'restore') {
      setAcaoConfirmando(acao)
      return
    }
    executar(acao)
  }

  const handleExcluir = () => {
    startTransition(async () => {
      try {
        await excluirEstabelecimento(estabelecimentoId)
      } catch (err) {
        console.error('Erro ao excluir:', err)
        alert(err instanceof Error ? err.message : 'Erro ao excluir estabelecimento.')
      }
    })
  }

  return (
    <>
      {isExcluido && (
        <button
          type="button"
          disabled={isTransitioning}
          onClick={() => handleClickAcao('restore')}
          className="inline-flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
        >
          ♻️ Restaurar
        </button>
      )}

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

      {/* Bloquear/desbloquear não fazem sentido pra um estabelecimento que
          o próprio dono já excluiu — a única ação de "reverter" ali é Restaurar. */}
      {!isBlocked && !isExcluido && (
        <button
          type="button"
          disabled={isTransitioning}
          onClick={() => handleClickAcao('block')}
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
        onClick={() => setAcaoConfirmando('excluir')}
        className="inline-flex items-center gap-1 bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition disabled:opacity-50"
      >
        🗑️ Excluir
      </button>

      {acaoConfirmando === 'block' && (
        <ConfirmarAcaoModal
          titulo="Bloquear estabelecimento?"
          descricao={`Bloquear "${nomeExibicao}"? O estabelecimento vai sair do ar imediatamente.`}
          confirmarLabel="Bloquear"
          tom="perigo"
          enviando={isTransitioning}
          onCancelar={() => setAcaoConfirmando(null)}
          onConfirmar={() => {
            setAcaoConfirmando(null)
            executar('block')
          }}
        />
      )}

      {acaoConfirmando === 'restore' && (
        <ConfirmarAcaoModal
          titulo="Restaurar estabelecimento?"
          descricao={`Restaurar "${nomeExibicao}"? Volta a ficar ativo e visível pro dono e ao público.`}
          confirmarLabel="Restaurar"
          enviando={isTransitioning}
          onCancelar={() => setAcaoConfirmando(null)}
          onConfirmar={() => {
            setAcaoConfirmando(null)
            executar('restore')
          }}
        />
      )}

      {acaoConfirmando === 'excluir' && (
        <ConfirmarAcaoModal
          titulo="Excluir estabelecimento?"
          descricao={`Tem certeza que deseja excluir permanentemente "${nomeExibicao}"? Esta ação não pode ser desfeita.`}
          confirmarLabel="Excluir"
          tom="perigo"
          enviando={isTransitioning}
          onCancelar={() => setAcaoConfirmando(null)}
          onConfirmar={() => {
            setAcaoConfirmando(null)
            handleExcluir()
          }}
        />
      )}
    </>
  )
}
