'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings } from 'lucide-react'
import EstadoCarregamento from '../EstadoCarregamento'
import { useEstabelecimentoGerenciar } from '../useEstabelecimentoGerenciar'
import CabecalhoGerenciar from '../CabecalhoGerenciar'
import ConfiguracoesTab from '../../editar/components/ConfiguracoesTab'

export default function ConfiguracoesModuloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [contaAberta, setContaAberta] = useState(false)
  const { estabelecimento, usuarioNome, usuarioLogadoId, loading, acessoNegado, ehDonoOuGerente, podeEditar, recursosPlano } =
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
          tituloPagina={{ icone: <Settings className="h-full w-full" />, texto: 'Configurações' }}
          contaAberta={contaAberta}
          onAbrirConta={() => setContaAberta(true)}
          onFecharConta={() => setContaAberta(false)}
        />

        {ehDonoOuGerente ? (
          <ConfiguracoesTab estabelecimento={estabelecimento} readOnly={!podeEditar} recursosPlano={recursosPlano} />
        ) : (
          <div className="flex min-h-[40vh] items-center justify-center rounded-2xl border border-neutral-100 bg-white text-sm text-neutral-500">
            Só o dono ou gerente do estabelecimento pode acessar as configurações.
          </div>
        )}
      </div>
    </div>
  )
}
