'use client'

import { useTraducao } from './TraducaoCardapio'

export default function StatusPill({
  aberto,
  estado,
  horaAbertura,
}: {
  aberto: boolean
  estado: 'aberto_agora' | 'fechado' | 'abre_as'
  horaAbertura?: string
}) {
  const { traduzirInterface } = useTraducao()

  const mensagem =
    estado === 'aberto_agora'
      ? traduzirInterface('aberto_agora', 'Aberto agora')
      : estado === 'abre_as'
      ? traduzirInterface('abre_as', 'Abre às {hora}', { hora: horaAbertura || '' })
      : traduzirInterface('fechado', 'Fechado')

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
        aberto ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${aberto ? 'bg-green-500' : 'bg-red-500'}`} />
      {mensagem}
    </span>
  )
}
