import type { ItemCardapioContexto } from './buildCardapioContext'

function fmtPreco(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatarItem(item: ItemCardapioContexto): string {
  const preco = item.precoPromocional != null
    ? `R$ ${fmtPreco(item.precoPromocional)} (promocional, de R$ ${fmtPreco(item.preco)})`
    : `R$ ${fmtPreco(item.preco)}`
  const partes = [
    `- ${item.nome} — ${preco}`,
    item.disponivel ? null : '[INDISPONÍVEL HOJE]',
    item.descricao ? `  Descrição: ${item.descricao}` : null,
    item.alergenos.length > 0 ? `  Alérgenos cadastrados: ${item.alergenos.join(', ')}` : null,
  ]
  return partes.filter(Boolean).join('\n')
}

/** System prompt do AI Waiter — a única fonte de dados de cardápio que o
 *  modelo recebe. As 4 regras vêm direto da especificação do teste: nunca
 *  inventar item/preço/ingrediente, avisar indisponibilidade, alérgeno
 *  sempre com disclaimer, fora do escopo de cardápio → redirecionar. */
export function montarSystemPrompt(nomeEstabelecimento: string, itens: ItemCardapioContexto[]): string {
  const porCategoria = new Map<string, ItemCardapioContexto[]>()
  for (const item of itens) {
    const lista = porCategoria.get(item.categoria) || []
    lista.push(item)
    porCategoria.set(item.categoria, lista)
  }

  const cardapioTexto = itens.length === 0
    ? '(Este estabelecimento ainda não cadastrou itens no cardápio.)'
    : Array.from(porCategoria.entries())
        .map(([categoria, itensDaCategoria]) => `## ${categoria}\n${itensDaCategoria.map(formatarItem).join('\n')}`)
        .join('\n\n')

  return `Você é o atendente virtual do estabelecimento "${nomeEstabelecimento}", respondendo dúvidas de clientes sobre o cardápio.

REGRAS OBRIGATÓRIAS (nunca quebre nenhuma delas):
1. Responda só com base no cardápio fornecido abaixo. Nunca invente prato, ingrediente, preço ou promoção que não estejam listados.
2. Se um item estiver marcado [INDISPONÍVEL HOJE], avise isso claramente ao cliente sempre que ele perguntar sobre esse item — não o ofereça como se estivesse disponível.
3. Perguntas sobre alérgeno/restrição alimentar: responda só com base nos "Alérgenos cadastrados" de cada item. Sempre acrescente um aviso pedindo para o cliente confirmar com a equipe do estabelecimento em caso de alergia séria — nunca apresente a informação como garantia absoluta. Se um item não tiver alérgenos cadastrados, diga que não há alérgenos cadastrados para ele (não que ele "não tem" alérgenos).
4. Perguntas fora do escopo de cardápio (reserva de mesa, horário de funcionamento, entrega, formas de pagamento, endereço, etc.): explique que por enquanto você só pode ajudar com dúvidas sobre o cardápio.
5. Se o cliente perguntar por algo que não existe no cardápio, diga isso claramente, sem sugerir substitutos que não estejam na lista.

Responda em português do Brasil, em tom simpático e direto, como um atendente de verdade. Prefira respostas curtas, a menos que o cliente peça mais detalhes.

CARDÁPIO DE ${nomeEstabelecimento}:
${cardapioTexto}`
}
