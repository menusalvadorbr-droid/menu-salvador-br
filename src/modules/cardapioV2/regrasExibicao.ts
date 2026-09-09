import { horarioAtualSalvador } from '@/lib/horarioSalvador'
import type { CardapioV2RegraExibicao } from './types'

/**
 * Decide se uma regra de exibição (disponibilidade/promoção/destaque) está
 * ativa agora, considerando dia da semana e janela de horário — todos
 * opcionais (null = sem restrição naquele campo). Pura e testável de
 * propósito: usada tanto na página pública (servidor) quanto no preview
 * ao vivo do editor, sempre com o mesmo resultado pro mesmo `agora`.
 */
export function regraEstaNaJanela(regra: CardapioV2RegraExibicao, agora: Date): boolean {
  if (!regra.ativo) return false

  // Sempre no fuso de Salvador, não no fuso de onde o código roda (servidor
  // da Vercel roda em UTC) — mesmo motivo já documentado em
  // statusAberto.ts/specialOffers.ts. agora.getDay()/getHours() usava o
  // fuso de quem executa, o que deixava dia/horário errados em produção.
  const { diaSemana: diaAtual, minutosDoDia: minutosAgora } = horarioAtualSalvador(agora)

  if (regra.dias_semana && regra.dias_semana.length > 0) {
    if (!regra.dias_semana.includes(diaAtual)) return false
  }

  if (regra.horario_de || regra.horario_ate) {
    const [hDe, mDe] = (regra.horario_de ?? '00:00').split(':').map(Number)
    const [hAte, mAte] = (regra.horario_ate ?? '23:59').split(':').map(Number)
    const minutosDe = hDe * 60 + mDe
    const minutosAte = hAte * 60 + mAte

    // janela que vira a virada da meia-noite (ex: 18:00–02:00)
    const dentroDaJanela = minutosDe <= minutosAte
      ? minutosAgora >= minutosDe && minutosAgora <= minutosAte
      : minutosAgora >= minutosDe || minutosAgora <= minutosAte

    if (!dentroDaJanela) return false
  }

  if (regra.tipo === 'promocao') {
    if (regra.promocao_valida_de && agora < new Date(regra.promocao_valida_de)) return false
    if (regra.promocao_valida_ate && agora > new Date(regra.promocao_valida_ate)) return false
  }

  return true
}

/** Entre as regras de um mesmo tipo pra um item/categoria, a última ativa vence. */
export function regraAtivaDoTipo(
  regras: CardapioV2RegraExibicao[],
  tipo: CardapioV2RegraExibicao['tipo'],
  agora: Date
): CardapioV2RegraExibicao | null {
  const doTipo = regras.filter((r) => r.tipo === tipo && regraEstaNaJanela(r, agora))
  return doTipo.at(-1) ?? null
}

export interface EstadoExibicaoItem {
  disponivel: boolean
  precoPromocional: number | null
  destaque: boolean
  ordemDestaque: number | null
}

export function resolverEstadoExibicao(regras: CardapioV2RegraExibicao[], agora: Date = new Date()): EstadoExibicaoItem {
  const disponibilidade = regraAtivaDoTipo(regras, 'disponibilidade', agora)
  const promocao = regraAtivaDoTipo(regras, 'promocao', agora)
  const destaque = regraAtivaDoTipo(regras, 'destaque', agora)

  return {
    disponivel: disponibilidade ? disponibilidade.disponivel !== false : true,
    precoPromocional: promocao?.promocao_preco ?? null,
    destaque: !!destaque?.destaque,
    ordemDestaque: destaque?.ordem_destaque ?? null,
  }
}
