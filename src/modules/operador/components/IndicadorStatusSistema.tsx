'use client'

import { useStatusSistema, type StatusSistema } from '../hooks/useStatusSistema'

const TEXTO: Record<StatusSistema, string> = {
  online: 'SISTEMA ONLINE',
  sem_conexao: 'SEM CONEXÃO — TENTANDO RECONECTAR',
  whatsapp_desconectado: 'WHATSAPP DESCONECTADO',
}

/** Substitui o antigo aviso decorativo "atualiza em tempo real" — agora é
 *  um status de verdade: verde quando o Realtime está inscrito e o
 *  WhatsApp está conectado, vermelho (com o motivo) quando qualquer um
 *  dos dois cai. Usado no cabeçalho da Central do Operador. */
export default function IndicadorStatusSistema({ estabelecimentoId }: { estabelecimentoId: string }) {
  const { status } = useStatusSistema(estabelecimentoId)
  const online = status === 'online'

  return (
    <span
      className={`flex items-center gap-1.5 whitespace-nowrap text-[11px] font-bold tracking-wide ${
        online ? 'text-emerald-700' : 'text-red-600'
      }`}
      title={
        status === 'sem_conexao'
          ? 'A conexão em tempo real com o servidor caiu — tentando reconectar sozinho.'
          : status === 'whatsapp_desconectado'
            ? 'O WhatsApp deste estabelecimento não está conectado — confira em Configurações → WhatsApp.'
            : undefined
      }
    >
      <span className={`h-1.5 w-1.5 rounded-full ${online ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
      {TEXTO[status]}
    </span>
  )
}
