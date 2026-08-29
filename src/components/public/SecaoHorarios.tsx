import { TextoInterface } from './TraducaoCardapio'

const DIAS_SEMANA = [
  { dia: 'Domingo', chave: 'dia_domingo' },
  { dia: 'Segunda', chave: 'dia_segunda' },
  { dia: 'Terça', chave: 'dia_terca' },
  { dia: 'Quarta', chave: 'dia_quarta' },
  { dia: 'Quinta', chave: 'dia_quinta' },
  { dia: 'Sexta', chave: 'dia_sexta' },
  { dia: 'Sábado', chave: 'dia_sabado' },
]

interface HorarioLinha {
  dia_semana: number
  fechado: boolean
  horario_abertura: string | null
  horario_fechamento: string | null
}

export default function SecaoHorarios({
  horarios,
  diaSemanaHoje,
}: {
  horarios: HorarioLinha[]
  diaSemanaHoje: number
}) {
  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold text-neutral-800">
        🕒 <TextoInterface chave="secao_horarios">Horários</TextoInterface>
      </h2>
      {horarios.length > 0 ? (
        <div className="space-y-3">
          {DIAS_SEMANA.map(({ dia, chave: chaveDia }, idx) => {
            const periodos = horarios.filter((h) => h.dia_semana === idx)
            const hoje = diaSemanaHoje === idx
            const todosFechados = periodos.every((h) => h.fechado)
            return (
              <div
                key={idx}
                className={`rounded-xl p-3 text-sm border ${
                  hoje ? 'border-[var(--brand-primary)]/30' : 'border-neutral-100 bg-neutral-50'
                }`}
                style={hoje ? { backgroundColor: 'color-mix(in srgb, var(--brand-primary) 8%, white)' } : undefined}
              >
                <div className="flex items-start justify-between">
                  <span className="font-medium">
                    {hoje && '👉 '}
                    <TextoInterface chave={chaveDia}>{dia}</TextoInterface>
                  </span>
                  <div className="text-right">
                    {todosFechados ? (
                      <span className="text-red-500">
                        <TextoInterface chave="fechado">Fechado</TextoInterface>
                      </span>
                    ) : (
                      periodos.map((h, i) => (
                        <div key={i} className="text-neutral-700">
                          {h.horario_abertura?.substring(0, 5) || '--'} – {h.horario_fechamento?.substring(0, 5) || '--'}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-neutral-500">
          <TextoInterface chave="horarios_nao_cadastrados">Horários não cadastrados.</TextoInterface>
        </p>
      )}
    </div>
  )
}
