'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import EstadoCarregamento from '../../gerenciar/EstadoCarregamento'
import { useEstabelecimentoGerenciar } from '../../gerenciar/useEstabelecimentoGerenciar'
import CabecalhoGerenciar from '../../gerenciar/CabecalhoGerenciar'
import DemonstrativoSessaoCaixa from '@/modules/financeiro/components/DemonstrativoSessaoCaixa'

export default function SessaoCaixaPage({ params }: { params: Promise<{ id: string; sessaoId: string }> }) {
  const { id, sessaoId } = use(params)
  const router = useRouter()
  const [contaAberta, setContaAberta] = useState(false)
  const { estabelecimento, usuarioNome, usuarioLogadoId, loading, acessoNegado, ehDonoOuGerente, podeEditar } =
    useEstabelecimentoGerenciar(id)

  const estadoEspecial = EstadoCarregamento({ acessoNegado, loading, encontrado: !!estabelecimento })
  if (estadoEspecial) return estadoEspecial

  return (
    <div className="min-h-screen bg-neutral-50 p-4 text-neutral-900 md:p-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl">
        <div className="print:hidden">
          <CabecalhoGerenciar
            estabelecimento={estabelecimento}
            usuarioNome={usuarioNome}
            usuarioLogadoId={usuarioLogadoId}
            ehDonoOuGerente={ehDonoOuGerente}
            podeEditar={podeEditar}
            aoVoltar={() => router.push(`/painel/estabelecimento/${id}/caixa`)}
            tituloPagina={{ icone: '🧾', texto: 'Demonstrativo de caixa' }}
            contaAberta={contaAberta}
            onAbrirConta={() => setContaAberta(true)}
            onFecharConta={() => setContaAberta(false)}
          />
        </div>

        <DemonstrativoSessaoCaixa sessaoId={sessaoId} />
      </div>
    </div>
  )
}
