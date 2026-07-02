'use client'

import { useTransition } from 'react'
import { Trash2 } from 'lucide-react'
import { excluirEstabelecimento } from '../actions'

interface Props {
  estabelecimentoId: string
  nomeExibicao: string
}

export function ExcluirEstabelecimentoButton({ estabelecimentoId, nomeExibicao }: Props) {
  const [isPending, startTransition] = useTransition()

  const handleExcluir = async () => {
    if (!confirm(`Tem certeza que deseja excluir "${nomeExibicao}"? Esta ação pode ser desfeita apenas pelo suporte.`)) {
      return
    }

    const formData = new FormData()
    formData.append('id', estabelecimentoId)

    startTransition(async () => {
      try {
        await excluirEstabelecimento(formData)
      } catch (err) {
        console.error('Erro ao excluir:', err)
        alert('Erro ao excluir estabelecimento.')
      }
    })
  }

  return (
    <button
      onClick={handleExcluir}
      disabled={isPending}
      className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition disabled:opacity-50"
      title="Excluir estabelecimento"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  )
}