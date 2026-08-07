// src/lib/horarioSalvador.ts
//
// Horário de funcionamento e promoções recorrentes são sempre locais a
// Salvador — independente de onde o código roda (servidor da Vercel, que
// roda em UTC, ou o navegador de alguém em outro fuso). `new Date().getHours()`
// direto usa o fuso de QUEM RODA o código, não o de Salvador — daí esses
// helpers, que sempre calculam explicitamente em America/Bahia via Intl.

const FUSO_SALVADOR = 'America/Bahia'

const DIAS_SEMANA_INTL: Record<string, number> = {
  Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
}

export interface HorarioLocalSalvador {
  diaSemana: number // 0 (domingo) .. 6 (sábado), no calendário de Salvador
  minutosDoDia: number // minutos desde meia-noite, no relógio de Salvador
}

/** Dia da semana + minutos desde meia-noite, sempre no fuso de Salvador,
 *  não importa o fuso de onde o código está rodando. */
export function horarioAtualSalvador(instante: Date = new Date()): HorarioLocalSalvador {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: FUSO_SALVADOR,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(instante).map((p) => [p.type, p.value])
  )
  return {
    diaSemana: DIAS_SEMANA_INTL[partes.weekday] ?? instante.getDay(),
    minutosDoDia: Number(partes.hour) * 60 + Number(partes.minute),
  }
}

/** Diferença (em minutos) entre o fuso de Salvador e UTC no instante dado
 *  — hoje sempre -180 (UTC-3, Brasil não tem mais horário de verão desde
 *  2019), calculada na hora em vez de fixa só pra não depender de um
 *  número mágico que quebraria se isso mudasse de novo. */
function offsetMinutosSalvador(instante: Date): number {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: FUSO_SALVADOR,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(instante).map((p) => [p.type, p.value])
  )
  const comoSeUtc = Date.UTC(
    Number(partes.year), Number(partes.month) - 1, Number(partes.day),
    Number(partes.hour), Number(partes.minute), Number(partes.second)
  )
  return (comoSeUtc - instante.getTime()) / 60000
}

/**
 * Constrói o instante UTC correto pra uma hora:minuto de parede em
 * Salvador, no dia (ano/mês/dia) em que `dataBase` cai NO FUSO DE
 * SALVADOR — não no fuso local de onde o código roda. Usado quando
 * precisamos transformar "termina às HH:MM" (sempre horário de Salvador)
 * num ISO de verdade pro contador regressivo (ContadorRegressivo lê a
 * hora do navegador de quem visita, então o instante final tem que estar
 * certo em UTC, não só a hora de parede).
 */
export function dataEmSalvador(dataBase: Date, horas: number, minutos: number): Date {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: FUSO_SALVADOR,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(dataBase).map((p) => [p.type, p.value])
  )
  const offset = offsetMinutosSalvador(dataBase)
  const comoSeUtc = Date.UTC(Number(partes.year), Number(partes.month) - 1, Number(partes.day), horas, minutos, 0)
  return new Date(comoSeUtc - offset * 60000)
}
