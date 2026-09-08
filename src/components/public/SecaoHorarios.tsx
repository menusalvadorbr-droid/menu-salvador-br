import { TextoInterface } from './TraducaoCardapio'
import StatusPill from './StatusPill'
import { isEstabelecimentoAberto } from '@/lib/statusAberto'

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

function textoPeriodosDoDia(periodos: HorarioLinha[]) {
  if (periodos.length === 0 || periodos.every((h) => h.fechado)) return null
  return periodos.map((h) => `${h.horario_abertura?.substring(0, 5) || '--'}–${h.horario_fechamento?.substring(0, 5) || '--'}`).join(', ')
}

/**
 * Semana inteira colapsada por padrão atrás de um <details> nativo (sem JS
 * próprio, funciona mesmo em Server Component) — abre mostrando só o
 * status de hoje (igual o padrão de "Aberto agora · Fecha às 22h" do
 * Google/iFood), expande pra ver a semana completa só quando alguém quer.
 */
export default function SecaoHorarios({
  horarios,
  diaSemanaHoje,
}: {
  horarios: HorarioLinha[]
  diaSemanaHoje: number
}) {
  const status = isEstabelecimentoAberto(horarios)
  const periodosHoje = horarios.filter((h) => h.dia_semana === diaSemanaHoje)
  const textoHoje = textoPeriodosDoDia(periodosHoje)

  return (
    <div>
      <h2 className="mb-2 text-lg font-semibold text-neutral-800">
        🕒 <TextoInterface chave="secao_horarios">Horários</TextoInterface>
      </h2>
      {horarios.length > 0 ? (
        <details className="group overflow-hidden rounded-xl border border-neutral-100">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 bg-neutral-50 p-3 text-sm marker:content-none [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-1.5 font-medium text-neutral-800">
              👉 <TextoInterface chave="dia_hoje">Hoje</TextoInterface>:{' '}
              {textoHoje || <span className="text-red-500"><TextoInterface chave="fechado">Fechado</TextoInterface></span>}
            </span>
            <span className="flex shrink-0 items-center gap-2">
              {status.exibir && <StatusPill aberto={status.aberto} estado={status.estado!} horaAbertura={status.horaAbertura} />}
              <span className="text-neutral-400 transition-transform group-open:rotate-180">▾</span>
            </span>
          </summary>

          <div className="space-y-2 p-3 pt-2">
            {DIAS_SEMANA.map(({ dia, chave: chaveDia }, idx) => {
              const periodos = horarios.filter((h) => h.dia_semana === idx)
              const hoje = diaSemanaHoje === idx
              const todosFechados = periodos.every((h) => h.fechado)
              return (
                <div
                  key={idx}
                  className={`rounded-xl border p-3 text-sm ${
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
        </details>
      ) : (
        <p className="py-6 text-center text-sm text-neutral-500">
          <TextoInterface chave="horarios_nao_cadastrados">Horários não cadastrados.</TextoInterface>
        </p>
      )}
    </div>
  )
}
