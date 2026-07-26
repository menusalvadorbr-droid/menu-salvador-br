export type StatusMesa = 'livre' | 'ocupada' | 'reservada' | 'fechada'

export interface Mesa {
  id: string
  estabelecimento_id: string
  numero: string
  capacidade: number | null
  status: StatusMesa
  created_at: string
}

export const ETIQUETA_STATUS_MESA: Record<StatusMesa, { label: string; cor: string }> = {
  livre: { label: 'Livre', cor: 'bg-green-100 text-green-700 border-green-200' },
  ocupada: { label: 'Ocupada', cor: 'bg-orange-100 text-orange-700 border-orange-200' },
  reservada: { label: 'Reservada', cor: 'bg-blue-100 text-blue-700 border-blue-200' },
  fechada: { label: 'Fechada', cor: 'bg-neutral-100 text-neutral-400 border-neutral-200' },
}
