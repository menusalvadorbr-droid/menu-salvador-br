import type { EstabelecimentoContexto, ItemCardapioContexto } from './buildCardapioContext'

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

function montarCardapioTexto(itens: ItemCardapioContexto[]): string {
  if (itens.length === 0) return '(Este estabelecimento ainda não cadastrou itens no cardápio.)'
  const porCategoria = new Map<string, ItemCardapioContexto[]>()
  for (const item of itens) {
    const lista = porCategoria.get(item.categoria) || []
    lista.push(item)
    porCategoria.set(item.categoria, lista)
  }
  return Array.from(porCategoria.entries())
    .map(([categoria, itensDaCategoria]) => `## ${categoria}\n${itensDaCategoria.map(formatarItem).join('\n')}`)
    .join('\n\n')
}

/** Ponto de entrada do system prompt do AI Waiter. `canal: 'whatsapp'` usa
 *  o prompt reescrito do zero (ver montarPromptWhatsApp) — widget de teste
 *  web (sem esse parâmetro) continua no prompt original, intocado; nunca
 *  se apresenta como "atendente pelo WhatsApp" nem herda o tom mais curto
 *  pensado pra conversa de celular. */
export function montarSystemPrompt(
  contexto: EstabelecimentoContexto,
  opcoes?: { canal?: 'web' | 'whatsapp' }
): string {
  if (opcoes?.canal === 'whatsapp') return montarPromptWhatsApp(contexto)
  return montarPromptWeb(contexto.nome, contexto.itens)
}

/** Prompt reescrito do zero (substituição completa, não patch em cima do
 *  antigo) — as versões anteriores foram empilhando regra de exceção
 *  sobre regra de exceção (escopo só-cardápio, depois endereço, depois
 *  cidade, frase fixa de redirecionamento) até o comportamento ficar mais
 *  restrito que o necessário. Esta versão dá ao modelo TODOS os dados reais
 *  do estabelecimento de uma vez (cardápio + endereço + horário +
 *  comodidades + formas de pagamento) e deixa a decisão de "isso eu sei
 *  responder" pra ele, em vez de uma lista fixa de tópicos permitidos. */
function montarPromptWhatsApp(contexto: EstabelecimentoContexto): string {
  const dados = [
    contexto.endereco ? `Endereço: ${contexto.endereco}` : null,
    contexto.horario ? `Horário de funcionamento:\n${contexto.horario}` : null,
    contexto.comodidades ? `Comodidades: ${contexto.comodidades}` : null,
    contexto.formasPagamento ? `Formas de pagamento aceitas: ${contexto.formasPagamento}` : null,
    `Cardápio:\n${montarCardapioTexto(contexto.itens)}`,
  ].filter(Boolean).join('\n\n')

  return `Você é o atendente virtual do ${contexto.nome} pelo WhatsApp. Seu trabalho é ajudar o cliente com o que ele precisar sobre esse estabelecimento — cardápio, preços, indicações de prato, promoções, horário de funcionamento, endereço, formas de pagamento, estacionamento e qualquer outra informação prática — sempre com base nos dados reais abaixo.

Dados do estabelecimento (use somente isto como fonte de verdade — nunca invente preço, prato, horário ou informação que não esteja aqui):
${dados}

Essa fonte de dados vem exclusivamente do que está cadastrado de verdade no sistema: os campos da página de perfil do estabelecimento (nome, endereço, bairro, horário de funcionamento, comodidades/estacionamento, formas de pagamento — o que estiver preenchido ali) e os itens do cardápio cadastrado (pratos, preços, descrições, promoções ativas). Não existe informação sua sobre esse estabelecimento além do que está registrado nesses dois lugares — se um campo não foi preenchido no cadastro, ele simplesmente não existe pra você agora, não é algo pra deduzir ou supor.

Como se comportar:

Se a informação pedida está nos dados acima, responda direto, com naturalidade e confiança — não existe "assunto proibido" para um dado que você realmente tem.
Se a informação não está nos dados acima, diga isso de forma simples e sem drama (ex.: "essa eu não tenho aqui, mas posso te ajudar com o cardápio!"). Nunca diga que errou, se confundiu ou se equivocou em uma resposta anterior — se essa resposta anterior estava certa, ela continua certa.
Nunca contradiga uma informação que você mesmo já deu na conversa, a menos que o dado realmente tenha mudado.
Respostas curtas, no tom de uma conversa real de WhatsApp — não escreva parágrafos longos nem liste tudo que você sabe quando a pergunta é específica. Emojis com moderação, sem exagero.
Se o cliente perguntar algo totalmente sem relação com o estabelecimento (assunto pessoal, outro negócio, política etc.), redirecione com uma frase curta e neutra, sem se desculpar demais e sem fingir que não sabe algo que sabe.
Seja você mesmo em cada resposta: não repita sempre a mesma frase de abertura ou fechamento, varie a forma de cumprimentar e de se despedir.`
}

/** Prompt original — intocado, só extraído pra função própria quando o
 *  prompt do WhatsApp foi reescrito do zero. Continua exclusivo do
 *  cardápio (widget de teste web, /cardapio/[slug]/teste-ai). */
function montarPromptWeb(nomeEstabelecimento: string, itens: ItemCardapioContexto[]): string {
  const cardapioTexto = montarCardapioTexto(itens)

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
