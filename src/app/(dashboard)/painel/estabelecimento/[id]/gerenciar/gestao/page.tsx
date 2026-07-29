'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import EstadoCarregamento from '../EstadoCarregamento'
import { useEstabelecimentoGerenciar } from '../useEstabelecimentoGerenciar'
import ModuloGestao from '../ModuloGestao'

export default function GestaoModuloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { estabelecimento, loading, acessoNegado } = useEstabelecimentoGerenciar(id)

  const estadoEspecial = EstadoCarregamento({ acessoNegado, loading, encontrado: !!estabelecimento })
  if (estadoEspecial) return estadoEspecial

  return (
    <div className="min-h-screen bg-neutral-50 p-4 text-neutral-900 md:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => router.push(`/painel/estabelecimento/${id}/gerenciar`)}
            aria-label="Voltar"
            className="rounded-lg p-2 text-neutral-500 transition hover:bg-white hover:text-orange-600"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold tracking-tight text-neutral-900">🛠️ Gestão</h1>
        </div>

        {/* Chega até aqui mesmo desativado só se alguém guardou o link —
            o card da tela inicial já bloqueia a navegação nesse caso, mas
            o ModuloGestao continua mostrando o aviso e os itens apagados
            de qualquer forma, sem depender só desse bloqueio anterior. */}
        <ModuloGestao estabelecimentoId={estabelecimento.id} ativado={!!estabelecimento.gestao_modulo_ativado} />
      </div>
    </div>
  )
}
