'use client'

const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export interface AgendamentoRegra {
  diasSemana: number[]
  horarioDe: string
  horarioAte: string
  validaAte: string // valor de <input type="datetime-local">
}

export function agendamentoVazio(): AgendamentoRegra {
  return { diasSemana: [], horarioDe: '', horarioAte: '', validaAte: '' }
}

/**
 * Campos de "quando" (dias da semana + horário recorrente — o mesmo padrão
 * que cobre Happy Hour — e uma validade pontual opcional), reaproveitados
 * tanto pela promoção de item/categoria (RegraExibicaoEditor.tsx) quanto
 * pelo combo (OfertaForm.tsx) — um só lugar pra essa UI em vez de duas
 * cópias do mesmo JSX. Puramente controlado, sem leitura/escrita própria.
 */
export default function AgendamentoRegraCampos({
  valor,
  onChange,
}: {
  valor: AgendamentoRegra
  onChange: (valor: AgendamentoRegra) => void
}) {
  function alternarDia(dia: number) {
    const diasSemana = valor.diasSemana.includes(dia)
      ? valor.diasSemana.filter((d) => d !== dia)
      : [...valor.diasSemana, dia]
    onChange({ ...valor, diasSemana })
  }

  return (
    <div className="space-y-2 rounded-lg border border-neutral-200 p-3">
      <div>
        <p className="mb-1 text-xs font-medium text-neutral-600">
          Dias da semana <span className="font-normal text-neutral-400">(vazio = todo dia)</span>
        </p>
        <div className="flex flex-wrap gap-1">
          {DIAS.map((dia, index) => (
            <button
              key={dia}
              type="button"
              onClick={() => alternarDia(index)}
              className={`rounded px-2 py-1 text-xs ${
                valor.diasSemana.includes(index) ? 'bg-orange-100 text-orange-700' : 'bg-neutral-100 text-neutral-500'
              }`}
            >
              {dia}
            </button>
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Das</label>
          <input
            type="time"
            value={valor.horarioDe}
            onChange={(e) => onChange({ ...valor, horarioDe: e.target.value })}
            className="rounded-lg border border-neutral-200 px-2 py-1 text-xs"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-neutral-600">Às</label>
          <input
            type="time"
            value={valor.horarioAte}
            onChange={(e) => onChange({ ...valor, horarioAte: e.target.value })}
            className="rounded-lg border border-neutral-200 px-2 py-1 text-xs"
          />
        </div>
      </div>
      <p className="text-[11px] text-neutral-400">
        Ex: Happy Hour toda sexta 18h–20h. Horário fim menor ou igual ao início cruza a meia-noite (ex: 22:00–02:00).
      </p>
      <div>
        <label className="mb-1 block text-xs font-medium text-neutral-600">
          Válido até <span className="font-normal text-neutral-400">(opcional — some sozinho depois dessa data)</span>
        </label>
        <input
          type="datetime-local"
          value={valor.validaAte}
          onChange={(e) => onChange({ ...valor, validaAte: e.target.value })}
          className="rounded-lg border border-neutral-200 px-2 py-1 text-xs"
        />
      </div>
    </div>
  )
}
