import { createHmac, timingSafeEqual } from 'crypto'

/** 401/403 da Graph API — token temporário do Graph API Explorer expirado
 *  (dura só algumas horas) ou access token errado/revogado. Não é bug de
 *  código: precisa gerar um token novo manualmente e atualizar
 *  WHATSAPP_ACCESS_TOKEN (ou o token salvo por estabelecimento, se for o
 *  caso) — ver a mensagem de `salvarErroConexao` em whatsappHandler.ts. */
export class ErroTokenWhatsApp extends Error {
  constructor(status: number, corpo: string) {
    super(`Token do WhatsApp expirado ou inválido (HTTP ${status}): ${corpo}`)
    this.name = 'ErroTokenWhatsApp'
  }
}

// v25.0 — mesma versão usada no exemplo oficial da doc de typing
// indicators (developers.facebook.com/docs/whatsapp/cloud-api/typing-indicators).
// v24.0 aceitava o request e confirmava a leitura (campo antigo/estável),
// mas o "digitando..." não aparecia pro cliente — hipótese de que o campo
// typing_indicator (recurso mais novo) era ignorado silenciosamente numa
// versão que não o reconhece plenamente, em vez de dar erro.
const GRAPH_VERSION = 'v25.0'
// Limite real da Cloud API por mensagem de texto — acima disso a Meta
// rejeita o envio inteiro, não só corta o excedente.
const LIMITE_CARACTERES_MENSAGEM = 4096

/** Confere X-Hub-Signature-256 contra WHATSAPP_APP_SECRET — sem isso,
 *  qualquer um que descobrisse a URL do webhook poderia mandar payloads
 *  falsos e gerar chamadas de IA por nossa conta. `timingSafeEqual` evita
 *  vazar o segredo por diferença de tempo de resposta. */
export function validarAssinaturaWebhook(payloadCru: string, assinaturaHeader: string | null): boolean {
  if (!assinaturaHeader) return false
  const appSecret = process.env.WHATSAPP_APP_SECRET
  if (!appSecret) return false

  const esperada = 'sha256=' + createHmac('sha256', appSecret).update(payloadCru).digest('hex')
  const bufRecebido = Buffer.from(assinaturaHeader)
  const bufEsperado = Buffer.from(esperada)
  if (bufRecebido.length !== bufEsperado.length) return false
  return timingSafeEqual(bufRecebido, bufEsperado)
}

/** Envia texto pro cliente via Cloud API. Quebra em várias mensagens se
 *  passar do limite de caracteres, na ordem certa (não é comum acontecer
 *  numa resposta de cardápio, mas evita a mensagem simplesmente falhar se
 *  o modelo gerar algo longo). `accessToken`/`phoneNumberId` vêm do
 *  estabelecimento resolvido — cada loja pode ter seu próprio número.
 *
 *  Janela de 24h: nesta fase (só resposta direta a pergunta de cardápio)
 *  toda mensagem que mandamos é reação a uma mensagem que acabou de chegar
 *  do cliente, o que sempre reabre a janela — não há como isto esgotar
 *  aqui. Se algum dia isso mudar (reengajamento, retomar conversa muito
 *  depois — fase 2+), a Meta rejeita o envio com um erro específico de
 *  janela fechada, que sobe como exceção abaixo com o corpo da resposta;
 *  seria o ponto de checar `ultima_interacao_em` antes de enviar e trocar
 *  pra um template pré-aprovado em vez de texto livre. */
export async function enviarMensagemWhatsApp(
  phoneNumberId: string,
  accessToken: string,
  telefoneDestino: string,
  texto: string
): Promise<void> {
  const pedacos = quebrarEmPedacos(texto, LIMITE_CARACTERES_MENSAGEM)
  for (const pedaco of pedacos) {
    await postMensagemWhatsApp(phoneNumberId, accessToken, {
      messaging_product: 'whatsapp',
      to: telefoneDestino,
      type: 'text',
      text: { body: pedaco },
    })
  }
}

/** Envia a localização real do estabelecimento (cartão de mapa nativo do
 *  WhatsApp, tocável, abre no app de mapas do cliente) — mesma
 *  lat/long usada pelo mapa embutido da página pública do estabelecimento.
 *  Quem chama decide se usa isto (lat/long preenchidos) ou o link de texto
 *  do Google Maps (fallback sem lat/long) — ver considerarEnviarLocalizacao
 *  em whatsappHandler.ts. */
export async function enviarLocalizacaoWhatsApp(
  phoneNumberId: string,
  accessToken: string,
  telefoneDestino: string,
  local: { latitude: number; longitude: number; nome: string; endereco: string }
): Promise<void> {
  await postMensagemWhatsApp(phoneNumberId, accessToken, {
    messaging_product: 'whatsapp',
    to: telefoneDestino,
    type: 'location',
    location: {
      latitude: local.latitude,
      longitude: local.longitude,
      name: local.nome,
      address: local.endereco,
    },
  })
}

async function postMensagemWhatsApp(phoneNumberId: string, accessToken: string, body: object): Promise<void> {
  const resp = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(body),
  })
  if (!resp.ok) {
    const erro = await resp.text().catch(() => '')
    if (resp.status === 401 || resp.status === 403) throw new ErroTokenWhatsApp(resp.status, erro)
    throw new Error(`Falha ao enviar mensagem WhatsApp (${resp.status}): ${erro}`)
  }
}

/** Marca a mensagem recebida como lida e ativa o indicador "digitando..."
 *  no WhatsApp do cliente (fica visível por até ~25s ou até a resposta
 *  real chegar, o que vier primeiro) — cobre o tempo de geração da IA sem
 *  custo nenhum de latência real. Cosmético: nunca lança erro pra quem
 *  chama, só loga e segue — uma falha aqui não pode atrapalhar a resposta
 *  de verdade. */
export async function marcarComoLidaEDigitando(
  phoneNumberId: string,
  accessToken: string,
  wamid: string
): Promise<void> {
  try {
    const resp = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: wamid,
        typing_indicator: { type: 'text' },
      }),
    })
    if (!resp.ok) {
      const erro = await resp.text().catch(() => '')
      console.error('[whatsapp] falha ao marcar como lida/digitando (não bloqueia a resposta):', resp.status, erro)
    }
  } catch (err) {
    console.error('[whatsapp] erro ao marcar como lida/digitando (não bloqueia a resposta):', err)
  }
}

/** Confirma que access token + phone_number_id realmente autenticam contra
 *  a Cloud API — usado pelo botão "Verificar conexão" do painel, pra não
 *  depender só do dono confirmar visualmente que colou os valores certos. */
export async function verificarConexaoWhatsApp(phoneNumberId: string, accessToken: string): Promise<boolean> {
  const resp = await fetch(`https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}?fields=id`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  return resp.ok
}

function quebrarEmPedacos(texto: string, limite: number): string[] {
  if (texto.length <= limite) return [texto]
  const pedacos: string[] = []
  let resto = texto
  while (resto.length > limite) {
    // Quebra num espaço perto do limite pra não cortar palavra no meio.
    let corte = resto.lastIndexOf(' ', limite)
    if (corte <= 0) corte = limite
    pedacos.push(resto.slice(0, corte))
    resto = resto.slice(corte).trimStart()
  }
  if (resto) pedacos.push(resto)
  return pedacos
}
