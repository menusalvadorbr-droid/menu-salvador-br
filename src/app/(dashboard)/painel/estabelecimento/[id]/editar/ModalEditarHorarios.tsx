'use client'

import HorariosEditor from '@/app/(dashboard)/painel/components/HorariosEditor'
import ModalPerfil from './ModalPerfil'

/**
 * `HorariosEditor` já é autocontido (própria leitura/escrita em
 * horarios_funcionamento, próprio botão salvar) e é compartilhado com
 * outras telas — reusado aqui como está, só dentro da casca do modal.
 */
export default function ModalEditarHorarios({ estabelecimentoId, onFechar }: { estabelecimentoId: string; onFechar: () => void }) {
  return (
    <ModalPerfil titulo="Editar horários" onFechar={onFechar}>
      <HorariosEditor estabelecimentoId={estabelecimentoId} />
    </ModalPerfil>
  )
}
