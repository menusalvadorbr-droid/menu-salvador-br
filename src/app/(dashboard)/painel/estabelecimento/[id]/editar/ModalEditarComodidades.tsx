'use client'

import ComodidadesTab from './components/ComodidadesTab'
import ModalPerfil from './ModalPerfil'

/**
 * `ComodidadesTab` já é autocontido (próprio botão "Salvar comodidades" e
 * feedback de sucesso) e também é usado em ConfiguracoesTab.tsx — reusado
 * aqui como está, sem alterar, só dentro da casca do modal.
 */
export default function ModalEditarComodidades({
  estabelecimento,
  onFechar,
}: {
  estabelecimento: { id: string; aceita_pets?: boolean | null; estacionamento?: string | null; acessibilidade?: string[] | null }
  onFechar: () => void
}) {
  return (
    <ModalPerfil titulo="Editar comodidades" onFechar={onFechar}>
      <ComodidadesTab estabelecimento={estabelecimento} />
    </ModalPerfil>
  )
}
