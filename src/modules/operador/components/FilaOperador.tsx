'use client'

import SecaoIAPrecisaDeVoce from './SecaoIAPrecisaDeVoce'
import SecaoPixAguardando from './SecaoPixAguardando'
import SecaoValidarEntrega from './SecaoValidarEntrega'
import SecaoTodasConversas from './SecaoTodasConversas'

export default function FilaOperador({ estabelecimentoId }: { estabelecimentoId: string }) {
  return (
    <div className="flex flex-col gap-4">
      <SecaoIAPrecisaDeVoce estabelecimentoId={estabelecimentoId} />
      <SecaoPixAguardando estabelecimentoId={estabelecimentoId} />
      <SecaoValidarEntrega estabelecimentoId={estabelecimentoId} />
      <SecaoTodasConversas estabelecimentoId={estabelecimentoId} />
    </div>
  )
}
