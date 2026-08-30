'use client'

import { use } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import EstadoCarregamento from '../../gerenciar/EstadoCarregamento'
import { useEstabelecimentoGerenciar } from '../../gerenciar/useEstabelecimentoGerenciar'
import DemonstrativoSessaoCaixa from '@/modules/financeiro/components/DemonstrativoSessaoCaixa'
import { caixaTema } from '@/modules/financeiro/caixaTema'

export default function SessaoCaixaPage({ params }: { params: Promise<{ id: string; sessaoId: string }> }) {
  const { id, sessaoId } = use(params)
  const router = useRouter()
  const { estabelecimento, loading, acessoNegado } = useEstabelecimentoGerenciar(id)

  const estadoEspecial = EstadoCarregamento({ acessoNegado, loading, encontrado: !!estabelecimento })
  if (estadoEspecial) return estadoEspecial

  const nomeEstabelecimento = estabelecimento.nome_fantasia || estabelecimento.nome

  return (
    <div className={`min-h-screen ${caixaTema.pagina} print:bg-white print:text-black`}>
      <header className="flex items-center gap-3 border-b border-neutral-100 bg-white px-4 py-3 shadow-sm md:px-6 print:hidden">
        <button
          onClick={() => router.push(`/painel/estabelecimento/${id}/caixa`)}
          aria-label="Voltar ao caixa"
          className="shrink-0 rounded-lg p-1.5 text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-neutral-500">Demonstrativo de caixa</p>
          <h1 className="truncate text-sm font-semibold text-neutral-900">{nomeEstabelecimento}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-4xl p-4 md:p-6 print:p-0">
        <DemonstrativoSessaoCaixa sessaoId={sessaoId} />
      </div>
    </div>
  )
}
