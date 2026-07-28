// src/lib/specialOffers.ts
//
// Estado de exibição de uma "promoção com contador" (tabela special_offers)
// — combos/happy hour que não são itens do cardápio. Calculado uma vez por
// request no servidor (mesma filosofia de isEstabelecimentoAberto em
// statusAberto.ts): não fica reavaliando ao vivo no cliente se a promoção
// entrou/saiu da janela ativa, só o contador dentro do estado "ativo" tique
// (via ContadorRegressivo). Recarregar a página reavalia o estado.

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

export type EstadoOferta =
  | { tipo: 'fora' }
  | { tipo: 'anuncio'; texto: string }
  | { tipo: 'ativo'; fimIso: string }

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

    const hojeDia = agora.getDay()
    const ontemDia = (hojeDia + 6) % 7
    const minutosAgora = agora.getHours() * 60 + agora.getMinutes()

    const comecouHojeEAindaAtivo = dias.includes(hojeDia) && (cruzaMeiaNoite
      ? minutosAgora >= minutosIni
      : minutosAgora >= minutosIni && minutosAgora < minutosFim)
    const continuandoDeOntem = cruzaMeiaNoite && dias.includes(ontemDia) && minutosAgora < minutosFim

    if (comecouHojeEAindaAtivo || continuandoDeOntem) {
      // Continuando de ontem: o fim é hoje. Começou hoje e cruza meia-noite: o fim é amanhã.
      const fim = new Date(agora)
      if (cruzaMeiaNoite && comecouHojeEAindaAtivo) fim.setDate(fim.getDate() + 1)
      const [hFim, mFim] = offer.hora_fim.split(':').map(Number)
      fim.setHours(hFim, mFim, 0, 0)
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

  // Pontual — fim_em é obrigatório (sem ele não dá pra saber quando conta
  // como "ativo"), mas inicio_em ausente conta como "já começou" (sem
  // limite inferior) em vez de esconder a promoção inteira. Antes exigia os
  // dois juntos, o que escondia qualquer promoção cadastrada só com "fim"
  // preenchido (o caso mais comum de teste rápido: "termina às X", sem se
  // preocupar em also marcar "começa agora").
  if (!offer.fim_em) return { tipo: 'fora' }
  const fim = new Date(offer.fim_em)
  const inicio = offer.inicio_em ? new Date(offer.inicio_em) : null

  if ((!inicio || agora >= inicio) && agora < fim) return { tipo: 'ativo', fimIso: offer.fim_em }

  if (inicio && agora < inicio) {
    const dataFmt = inicio.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    const horaFmt = inicio.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    return { tipo: 'anuncio', texto: `${dataFmt} às ${horaFmt}` }
  }

  return { tipo: 'fora' } // já passou de fim_em, sem mais ocorrências
}
