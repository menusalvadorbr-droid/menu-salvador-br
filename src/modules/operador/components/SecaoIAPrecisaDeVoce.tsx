'use client'

import { useFilaIA } from '../hooks/useFilaIA'
import CardConversa from './CardConversa'
import PainelSecao from './PainelSecao'

export default function SecaoIAPrecisaDeVoce({
  estabelecimentoId,
  mostrarTitulo = true,
}: {
  estabelecimentoId: string
  mostrarTitulo?: boolean
}) {
  const { conversas, carregando } = useFilaIA(estabelecimentoId)

  return (
    <PainelSecao
      cor="amber"
      titulo="🤖 IA precisa de você"
      contagem={conversas.length}
      mostrarTitulo={mostrarTitulo}
      carregando={carregando}
      vazio="Nenhuma conversa esperando atendimento."
    >
      {conversas.map((c) => (
        <CardConversa key={c.id} estabelecimentoId={estabelecimentoId} conversa={c} />
      ))}
    </PainelSecao>
  )
}
