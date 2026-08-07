// src/lib/specialOffers.ts
//
// Estado de exibição de uma "promoção com contador" (tabela special_offers)
// — combos/happy hour que não são itens do cardápio. Calculado uma vez por
// request no servidor (mesma filosofia de isEstabelecimentoAberto em
// statusAberto.ts): não fica reavaliando ao vivo no cliente se a promoção
// entrou/saiu da janela ativa, só o contador dentro do estado "ativo" tique
// (via ContadorRegressivo). Recarregar a página reavalia o estado.

import { horarioAtualSalvador, dataEmSalvador } from './horarioSalvador'

const DIAS_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export interface SpecialOfferRow {
  id: string
  nome: string
  descricao: string | null
  foto_url: string | null
  preco_de: number | null
  preco_por: number
  card_largo: boolean
  ativo: boolean
  exibir_inicio: string | null
  exibir_fim: string | null
  recorrente: boolean
  dias_semana: number[] | null
  hora_inicio: string | null // "HH:MM" ou "HH:MM:SS"
  hora_fim: string | null
  inicio_em: string | null // ISO, usado quando recorrente = false
  fim_em: string | null
  alerta_minutos: number
}

/** Item do cardápio composto num combo (special_offer_itens) — opcional,
 *  uma promoção com contador continua podendo ser nome/preço/foto livres. */
export interface SpecialOfferItemRow {
  id: string
  special_offer_id: string
  item_cardapio_id: string
  quantidade: number
}

export type EstadoOferta =
  | { tipo: 'fora' }
  | { tipo: 'anuncio'; texto: string }
  | { tipo: 'ativo'; fimIso: string }
  | { tipo: 'sempre' }

function paraMinutos(hora: string): number {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

export function calcularEstadoOferta(offer: SpecialOfferRow, agora: Date = new Date()): EstadoOferta {
  // Janela geral de exibição — fora dela, nem anúncio aparece.
  if (offer.exibir_inicio && agora < new Date(offer.exibir_inicio)) return { tipo: 'fora' }
  if (offer.exibir_fim && agora > new Date(offer.exibir_fim)) return { tipo: 'fora' }

  if (offer.recorrente) {
    const dias = offer.dias_semana || []
    if (dias.length === 0 || !offer.hora_inicio || !offer.hora_fim) return { tipo: 'fora' }

    const minutosIni = paraMinutos(offer.hora_inicio)
    const minutosFim = paraMinutos(offer.hora_fim)
    // Janela que cruza meia-noite (ex: happy hour 22h–02h): fim <= início.
    const cruzaMeiaNoite = minutosFim <= minutosIni

    // Sempre no fuso de Salvador, não no fuso de onde o código roda (ver
    // src/lib/horarioSalvador.ts) — "recorrente" é sempre horário local
    // do estabelecimento, mesmo rodando no servidor em UTC.
    const { diaSemana: hojeDia, minutosDoDia: minutosAgora } = horarioAtualSalvador(agora)
    const ontemDia = (hojeDia + 6) % 7

    const comecouHojeEAindaAtivo = dias.includes(hojeDia) && (cruzaMeiaNoite
      ? minutosAgora >= minutosIni
      : minutosAgora >= minutosIni && minutosAgora < minutosFim)
    const continuandoDeOntem = cruzaMeiaNoite && dias.includes(ontemDia) && minutosAgora < minutosFim

    if (comecouHojeEAindaAtivo || continuandoDeOntem) {
      // Continuando de ontem: o fim é hoje. Começou hoje e cruza meia-noite: o
      // fim é amanhã — soma 24h em vez de setDate() (que usaria o fuso de
      // onde o código roda pra decidir a virada de dia); já que a diferença
      // é sempre 24h exatas (Salvador não tem horário de verão), isso já
      // cai no dia seguinte certo no fuso de Salvador.
      const dataBaseFim = cruzaMeiaNoite && comecouHojeEAindaAtivo
        ? new Date(agora.getTime() + 24 * 60 * 60 * 1000)
        : agora
      const [hFim, mFim] = offer.hora_fim.split(':').map(Number)
      const fim = dataEmSalvador(dataBaseFim, hFim, mFim)
      return { tipo: 'ativo', fimIso: fim.toISOString() }
    }

    // Não ativo agora — acha o próximo dia marcado (hoje, se ainda não
    // passou o horário de fim, ou o próximo dia da semana em dias_semana).
    // Vai até i=7 (não só 6) pra cobrir o caso de só um dia marcado e ele já
    // ter passado hoje — a próxima ocorrência é esse mesmo dia da semana que
    // vem, não "nenhuma".
    for (let i = 0; i < 8; i++) {
      const diaCandidato = (hojeDia + i) % 7
      if (!dias.includes(diaCandidato)) continue
      if (i === 0 && minutosAgora >= minutosFim && !cruzaMeiaNoite) continue
      const nomeDia = i === 0 ? 'Hoje' : DIAS_ABREV[diaCandidato]
      return { tipo: 'anuncio', texto: `${nomeDia} até ${offer.hora_fim.slice(0, 5)}` }
    }
    return { tipo: 'fora' }
  }

  // Pontual sem fim_em = "Tem prazo definido? Não" no formulário — um
  // combo/item fixo, sempre disponível, sem contador. Diferente de "fora"
  // (que esconde a oferta inteira): aqui ela aparece sempre, só sem selo de
  // tempo. Só é possível chegar aqui com inicio_em também vazio (o
  // formulário zera os dois juntos quando não tem prazo), mas checamos os
  // dois por segurança — não faz sentido "sempre ativo, mas só depois de X".
  if (!offer.fim_em) return offer.inicio_em ? { tipo: 'fora' } : { tipo: 'sempre' }
  const fim = new Date(offer.fim_em)
  const inicio = offer.inicio_em ? new Date(offer.inicio_em) : null

  if ((!inicio || agora >= inicio) && agora < fim) return { tipo: 'ativo', fimIso: offer.fim_em }

  if (inicio && agora < inicio) {
    // timeZone explícito pelo mesmo motivo do resto do arquivo — sem isso,
    // toLocaleDateString/toLocaleTimeString formatam no fuso de onde o
    // código roda (UTC no servidor), não no de Salvador.
    const dataFmt = inicio.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: 'America/Bahia' })
    const horaFmt = inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Bahia' })
    return { tipo: 'anuncio', texto: `${dataFmt} às ${horaFmt}` }
  }

  return { tipo: 'fora' } // já passou de fim_em, sem mais ocorrências
}
