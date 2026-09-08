'use client'

export interface PeriodoHorario {
  id: string
  dia_semana: number
  horario_abertura: string
  horario_fechamento: string
  fechado: boolean
}

interface SeletorHorariosProps {
  periodos: PeriodoHorario[]
  onChange: (periodos: PeriodoHorario[]) => void
  readOnly?: boolean
  diaSemanaHoje?: number
}

export const DIAS_SEMANA = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MAX_PERIODOS = 3

function somarHoras(hora: string, horas: number): string {
  const [h, m] = hora.split(':').map(Number)
  const total = h + horas
  return `${String(total).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function arredondarPara5Minutos(horaTexto: string): string {
  const [h, m] = horaTexto.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return horaTexto

  let totalMinutos = h * 60 + Math.round(m / 5) * 5
  totalMinutos = ((totalMinutos % 1440) + 1440) % 1440 // nunca deixa passar de 23:55 pra o dia seguinte

  const horaArredondada = Math.floor(totalMinutos / 60)
  const minutoArredondado = totalMinutos % 60
  return `${String(horaArredondada).padStart(2, '0')}:${String(minutoArredondado).padStart(2, '0')}`
}

/**
 * Editor controlado de horário de funcionamento, com suporte a múltiplos
 * períodos por dia (ex: almoço 11h-15h e jantar 18h-23h) — extraído de
 * HorariosEditor.tsx (painel do dono) pra ser reaproveitado também na
 * revisão de importação em lote do admin, sem duplicar a lógica de
 * adicionar/remover período. Não lê/escreve Supabase — quem chama decide
 * quando e como persistir `periodos`.
 */
export default function SeletorHorarios({ periodos, onChange, readOnly = false, diaSemanaHoje }: SeletorHorariosProps) {
  function adicionarPeriodo(diaIndex: number) {
    if (readOnly) return
    const dia = periodos.filter((h) => h.dia_semana === diaIndex)
    if (dia.length >= MAX_PERIODOS) {
      alert(`Máximo de ${MAX_PERIODOS} períodos por dia.`)
      return
    }
    const ultimo = dia[dia.length - 1]
    onChange([
      ...periodos,
      {
        id: `temp-${Date.now()}-${diaIndex}`,
        dia_semana: diaIndex,
        horario_abertura: ultimo?.horario_fechamento || '12:00',
        horario_fechamento: somarHoras(ultimo?.horario_fechamento || '12:00', 2),
        fechado: false,
      },
    ])
  }

  function removerPeriodo(id: string) {
    if (readOnly) return
    const diaIndex = periodos.find((h) => h.id === id)?.dia_semana
    const doDia = periodos.filter((h) => h.dia_semana === diaIndex)
    if (doDia.length <= 1) {
      alert('Cada dia precisa ter pelo menos um período.')
      return
    }
    onChange(periodos.filter((h) => h.id !== id))
  }

  function atualizarPeriodo(id: string, campo: 'horario_abertura' | 'horario_fechamento', valor: string) {
    if (readOnly) return
    const valorFinal = arredondarPara5Minutos(valor)
    onChange(periodos.map((h) => (h.id === id ? { ...h, [campo]: valorFinal } : h)))
  }

  function alternarFechado(diaIndex: number, fechado: boolean) {
    if (readOnly) return
    onChange(periodos.map((h) => (h.dia_semana === diaIndex ? { ...h, fechado } : h)))
  }

  return (
    <div className="space-y-4">
      {DIAS_SEMANA.map((dia, idx) => {
        const doDia = periodos.filter((h) => h.dia_semana === idx)
        const todosFechados = doDia.length === 0 || doDia.every((h) => h.fechado)
        const hoje = diaSemanaHoje === idx

        return (
          <div key={idx} className={`rounded-xl border p-4 ${hoje ? 'border-orange-200 bg-orange-50' : 'border-gray-200 bg-gray-50'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`font-medium ${hoje ? 'text-orange-700' : ''}`}>
                  {hoje && '👉 '}{dia}
                </span>
                <label className="flex items-center gap-1 text-sm">
                  <input
                    type="checkbox"
                    checked={todosFechados}
                    onChange={(e) => alternarFechado(idx, e.target.checked)}
                    disabled={readOnly}
                  />
                  Fechado
                </label>
              </div>
              {!readOnly && !todosFechados && (
                <button
                  type="button"
                  onClick={() => adicionarPeriodo(idx)}
                  className="rounded bg-blue-500 px-3 py-1 text-sm text-white hover:bg-blue-600"
                >
                  + Adicionar período
                </button>
              )}
            </div>

            {!todosFechados && (
              <div className="mt-3 space-y-2">
                {doDia.map((h) => (
                  <div key={h.id} className="flex items-center gap-3">
                    <input
                      type="time"
                      step="300"
                      value={h.horario_abertura?.substring(0, 5) || '08:00'}
                      onChange={(e) => atualizarPeriodo(h.id, 'horario_abertura', e.target.value)}
                      disabled={readOnly}
                      className="rounded border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                    <span className="text-gray-400">—</span>
                    <input
                      type="time"
                      step="300"
                      value={h.horario_fechamento?.substring(0, 5) || '18:00'}
                      onChange={(e) => atualizarPeriodo(h.id, 'horario_fechamento', e.target.value)}
                      disabled={readOnly}
                      className="rounded border border-gray-200 bg-white px-2 py-1 text-sm text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
                    />
                    {!readOnly && doDia.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removerPeriodo(h.id)}
                        className="text-sm text-red-500 hover:text-red-700"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            {todosFechados && <div className="mt-2 text-sm italic text-gray-400">Fechado</div>}
          </div>
        )
      })}
    </div>
  )
}

/** 1 período por dia, todos abertos 08:00-18:00 — mesmo default que HorariosEditor.tsx já usava. */
export function periodosPadrao(): PeriodoHorario[] {
  return DIAS_SEMANA.map((_, index) => ({
    id: `temp-${index}`,
    dia_semana: index,
    horario_abertura: '08:00',
    horario_fechamento: '18:00',
    fechado: false,
  }))
}
