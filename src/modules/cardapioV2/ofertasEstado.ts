import { horarioAtualSalvador, dataEmSalvador } from '@/lib/horarioSalvador'
import { regraEstaNaJanela } from './regrasExibicao'
import type { CardapioV2RegraExibicao } from './types'

export type EstadoOferta =
  | { tipo: 'sempre' } // sem regra vinculada, ou regra sem nenhum limite de horário/validade — sempre visível, sem contador
  | { tipo: 'fora' } // regra existe mas a janela (dia/horário/validade) não bate agora
  | { tipo: 'ativo'; fimIso: string } // dentro da janela, com um instante de fim conhecido pro contador

/**
 * Estado de uma oferta (combo) pra exibição pública. Reaproveita
 * regraEstaNaJanela — o mesmo resolvedor de item/categoria — em vez de
 * duplicar o cálculo de janela numa segunda máquina de estado (que era
 * exatamente o problema do special_offers/calcularEstadoOferta do V1). A
 * única coisa nova é achar o instante concreto de "fim" pro contador ao
 * vivo, que regraEstaNaJanela não precisa expor (ela só responde sim/não).
 */
export function resolverEstadoOferta(regra: CardapioV2RegraExibicao | null, agora: Date = new Date()): EstadoOferta {
  if (!regra) return { tipo: 'sempre' }
  if (!regraEstaNaJanela(regra, agora)) return { tipo: 'fora' }

  // Recorrente (dias_semana + horario_de/ate) — Happy Hour: o fim é hoje,
  // ou amanhã se a janela cruza a meia-noite (ex: 22:00–02:00) e já
  // passamos da meia-noite dentro dela.
  if (regra.dias_semana && regra.dias_semana.length > 0 && regra.horario_de && regra.horario_ate) {
    const [hDe, mDe] = regra.horario_de.split(':').map(Number)
    const [hAte, mAte] = regra.horario_ate.split(':').map(Number)
    const cruzaMeiaNoite = hAte * 60 + mAte <= hDe * 60 + mDe
    const { minutosDoDia: minutosAgora } = horarioAtualSalvador(agora)
    const dataBaseFim = cruzaMeiaNoite && minutosAgora >= hDe * 60 + mDe
      ? new Date(agora.getTime() + 24 * 60 * 60 * 1000)
      : agora
    return { tipo: 'ativo', fimIso: dataEmSalvador(dataBaseFim, hAte, mAte).toISOString() }
  }

  // Sem horário recorrente — a janela é só a validade absoluta
  // (promocao_valida_de/ate). Sem promocao_valida_ate, a oferta fica
  // "sempre" (sem contador) mesmo tendo uma regra vinculada.
  if (regra.promocao_valida_ate) {
    return { tipo: 'ativo', fimIso: regra.promocao_valida_ate }
  }
  return { tipo: 'sempre' }
}

/** Selo "Encerrando em breve" — acende se a oferta ativa estiver a
 *  ≤alertaMinutos do fim (campo alerta_minutos da própria oferta). */
export function ofertaEncerrandoEmBreve(estado: EstadoOferta, alertaMinutos: number): boolean {
  return estado.tipo === 'ativo' && (new Date(estado.fimIso).getTime() - Date.now()) / 60000 <= alertaMinutos
}
