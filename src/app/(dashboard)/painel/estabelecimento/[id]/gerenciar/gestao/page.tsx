'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import EstadoCarregamento from '../EstadoCarregamento'
import { useEstabelecimentoGerenciar } from '../useEstabelecimentoGerenciar'
import ModuloGestao from '../ModuloGestao'
import CabecalhoGerenciar from '../CabecalhoGerenciar'

export default function GestaoModuloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [contaAberta, setContaAberta] = useState(false)
  const { estabelecimento, usuarioNome, usuarioLogadoId, loading, acessoNegado, ehDonoOuGerente, podeEditar } =
    useEstabelecimentoGerenciar(id)

  const estadoEspecial = EstadoCarregamento({ acessoNegado, loading, encontrado: !!estabelecimento })
  if (estadoEspecial) return estadoEspecial

  return (
    <div className="min-h-screen bg-neutral-50 p-4 text-neutral-900 md:p-6">
      <div className="mx-auto max-w-6xl">
        <CabecalhoGerenciar
          estabelecimento={estabelecimento}
          usuarioNome={usuarioNome}
          usuarioLogadoId={usuarioLogadoId}
          ehDonoOuGerente={ehDonoOuGerente}
          podeEditar={podeEditar}
          aoVoltar={() => router.push(`/painel/estabelecimento/${id}/gerenciar`)}
          tituloPagina={{ icone: '🛠️', texto: 'Gestão' }}
          contaAberta={contaAberta}
          onAbrirConta={() => setContaAberta(true)}
          onFecharConta={() => setContaAberta(false)}
        />

        {/* Chega até aqui mesmo desativado só se alguém guardou o link —
            o card da tela inicial já bloqueia a navegação nesse caso, mas
            o ModuloGestao continua mostrando o aviso e os itens apagados
            de qualquer forma, sem depender só desse bloqueio anterior. */}
        <ModuloGestao estabelecimentoId={estabelecimento.id} ativado={!!estabelecimento.gestao_modulo_ativado} />
      </div>
    </div>
  )
}
