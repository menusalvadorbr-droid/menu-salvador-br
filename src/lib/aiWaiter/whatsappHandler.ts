import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { buildCardapioContextPorId } from './buildCardapioContext'
import { montarSystemPrompt } from './systemPrompt'
import { resolverAtalho } from './atalhos'
import { enviarMensagemWhatsApp, ErroTokenWhatsApp } from '@/lib/whatsapp/metaApi'

// DeepSeek V4 Flash como padrão (mesmo modelo/endpoint de
// /api/ai-waiter-deepseek, mas não-streaming aqui — a Cloud API do
// WhatsApp só aceita a mensagem pronta, não aceita ir enchendo aos poucos).
// Claude Haiku 4.5 roda em paralelo só numa amostra pequena das conversas,
// como auditor de qualidade — nunca é a resposta enviada ao cliente.
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
const DEEPSEEK_MODEL = 'deepseek-v4-flash'
const PROPORCAO_AUDITORIA_HAIKU = 0.05

const anthropic = new Anthropic()

interface MensagemArmazenada {
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  wamid?: string
}

export interface MensagemWhatsAppRecebida {
  phoneNumberId: string
  telefone: string
  texto: string
  wamid: string
}

const PEDIDOS_DE_HUMANO = ['atendente', 'humano', 'pessoa de verdade', 'falar com alguém', 'falar com alguem', 'quero falar com uma pessoa']

function pediuAtendimentoHumano(texto: string): boolean {
  const t = texto.toLowerCase()
  return PEDIDOS_DE_HUMANO.some((p) => t.includes(p))
}

/** Ponto de entrada chamado pela rota de processamento assíncrono do
 *  webhook (POST /api/whatsapp/webhook já respondeu 200 pra Meta antes
 *  disto rodar — nunca faz a Meta esperar por uma chamada de IA). */
export async function processarMensagemWhatsApp(payload: MensagemWhatsAppRecebida): Promise<void> {
  const { phoneNumberId, telefone, texto, wamid } = payload

  const { data: mapeamento } = await supabaseAdmin
    .from('whatsapp_numero_estabelecimento')
    .select('estabelecimento_id')
    .eq('phone_number_id', phoneNumberId)
    .maybeSingle()
  if (!mapeamento) {
    console.error('[whatsapp] phone_number_id sem estabelecimento mapeado:', phoneNumberId)
    return
  }
  const estabelecimentoId = mapeamento.estabelecimento_id as string

  const { data: est } = await supabaseAdmin
    .from('estabelecimentos')
    .select('id, whatsapp_robo_ativado, whatsapp_phone_number_id, whatsapp_access_token')
    .eq('id', estabelecimentoId)
    .maybeSingle()
  if (!est) return

  const { data: conversaExistente } = await supabaseAdmin
    .from('whatsapp_conversas')
    .select('id, mensagens, precisa_humano')
    .eq('telefone', telefone)
    .eq('estabelecimento_id', estabelecimentoId)
    .maybeSingle()

  const mensagensAtuais = (conversaExistente?.mensagens || []) as MensagemArmazenada[]

  // Idempotência — a Meta reenvia a notificação se não receber 200 rápido;
  // sem checar o wamid, a mesma pergunta dispararia 2 chamadas de IA e 2
  // respostas repetidas pro cliente.
  if (mensagensAtuais.some((m) => m.wamid === wamid)) return

  const jaPrecisavaHumano = !!conversaExistente?.precisa_humano
  const pediuHumanoAgora = pediuAtendimentoHumano(texto)

  const historicoComNova: MensagemArmazenada[] = [
    ...mensagensAtuais,
    { role: 'user', content: texto, timestamp: new Date().toISOString(), wamid },
  ]

  // Robô desligado pelo dono (ex: movimento corrido, prefere responder
  // pessoalmente) — só registra a mensagem e sinaliza cliente esperando,
  // nunca chama IA nem responde automaticamente.
  if (!est.whatsapp_robo_ativado) {
    await salvarConversa(estabelecimentoId, telefone, conversaExistente?.id, historicoComNova, true)
    return
  }

  if (!est.whatsapp_phone_number_id || !est.whatsapp_access_token) {
    console.error('[whatsapp] estabelecimento sem token/phone_number_id configurado:', estabelecimentoId)
    await salvarConversa(estabelecimentoId, telefone, conversaExistente?.id, historicoComNova, true)
    return
  }

  // Camada 1 — atalho por palavra-chave, custo zero, checado antes de
  // qualquer IA. Só bate se o cliente não pediu um humano explicitamente.
  const respostaAtalho = pediuHumanoAgora ? null : await resolverAtalho(estabelecimentoId, texto)
  if (respostaAtalho) {
    const enviado = await enviarComTratamentoDeErro(est, telefone, respostaAtalho, estabelecimentoId)
    if (enviado) await registrarMetrica(estabelecimentoId, 'atalho')
    await salvarConversa(
      estabelecimentoId, telefone, conversaExistente?.id,
      [...historicoComNova, ...(enviado ? [mensagemAssistente(respostaAtalho)] : [])],
      enviado ? jaPrecisavaHumano : true
    )
    return
  }

  if (pediuHumanoAgora) {
    const aviso = 'Ok! Já avisei nossa equipe — alguém vai te responder por aqui em instantes.'
    const enviado = await enviarComTratamentoDeErro(est, telefone, aviso, estabelecimentoId)
    await salvarConversa(
      estabelecimentoId, telefone, conversaExistente?.id,
      [...historicoComNova, ...(enviado ? [mensagemAssistente(aviso)] : [])],
      true
    )
    return
  }

  // Camada 2 — IA, sobre o cardápio real do estabelecimento (mesmo contexto
  // e regras do AI Waiter testado em /cardapio/[slug]/teste-ai).
  const contexto = await buildCardapioContextPorId(estabelecimentoId)
  if (!contexto) {
    console.error('[whatsapp] contexto de cardápio não encontrado:', estabelecimentoId)
    return
  }
  const system = montarSystemPrompt(contexto.nome, contexto.itens)
  const mensagensParaModelo = historicoComNova.map((m) => ({ role: m.role, content: m.content }))

  let respostaTexto: string
  let precisaHumano = jaPrecisavaHumano
  try {
    const resultado = await chamarDeepSeek(system, mensagensParaModelo)
    respostaTexto = resultado.texto
    await registrarMetrica(estabelecimentoId, 'ia', DEEPSEEK_MODEL, resultado.tokensEntrada, resultado.tokensSaida)
  } catch (err) {
    console.error('[whatsapp] erro ao chamar DeepSeek:', err)
    respostaTexto = 'Desculpe, não consegui responder agora. Nossa equipe vai te responder em breve por aqui.'
    precisaHumano = true
  }

  // Auditoria por amostragem — roda em paralelo (não aguardada), nunca
  // bloqueia nem decide a resposta enviada ao cliente, só registra pra
  // comparação de qualidade/custo entre os dois modelos.
  if (Math.random() < PROPORCAO_AUDITORIA_HAIKU) {
    auditarComHaiku(system, mensagensParaModelo, estabelecimentoId).catch((err) => {
      console.error('[whatsapp] erro na auditoria Haiku (não afeta a resposta já enviada ao cliente):', err)
    })
  }

  const enviado = await enviarComTratamentoDeErro(est, telefone, respostaTexto, estabelecimentoId)
  await salvarConversa(
    estabelecimentoId, telefone, conversaExistente?.id,
    [...historicoComNova, ...(enviado ? [mensagemAssistente(respostaTexto)] : [])],
    enviado ? precisaHumano : true
  )
}

/** Envia e trata falha de forma explícita — em especial token expirado/
 *  inválido (comum com o token temporário do Graph API Explorer, que dura
 *  só algumas horas): não é bug de código, precisa gerar um token novo
 *  manualmente. Nunca deixa a mensagem do cliente se perder: se o envio
 *  falhar, quem chama ainda salva a conversa (sem a resposta que não foi
 *  entregue) e marca precisa_humano — a equipe vê no painel que ficou
 *  pendente. Também marca o estabelecimento como "erro" de conexão, pra
 *  aparecer na aba WhatsApp do painel sem precisar ler log nenhum. */
async function enviarComTratamentoDeErro(
  est: { whatsapp_phone_number_id: string; whatsapp_access_token: string },
  telefone: string,
  texto: string,
  estabelecimentoId: string
): Promise<boolean> {
  try {
    await enviarMensagemWhatsApp(est.whatsapp_phone_number_id, est.whatsapp_access_token, telefone, texto)
    return true
  } catch (err) {
    if (err instanceof ErroTokenWhatsApp) {
      console.error(
        '[whatsapp] Token do WhatsApp expirado ou inválido — gere um novo no Graph API Explorer e ' +
        'atualize WHATSAPP_ACCESS_TOKEN (ou reconecte pela aba WhatsApp em Configurações no painel).',
        { estabelecimentoId, detalhe: err.message }
      )
      await supabaseAdmin.from('estabelecimentos').update({ whatsapp_status: 'erro' }).eq('id', estabelecimentoId)
    } else {
      console.error('[whatsapp] erro ao enviar mensagem:', err)
    }
    return false
  }
}

function mensagemAssistente(texto: string): MensagemArmazenada {
  return { role: 'assistant', content: texto, timestamp: new Date().toISOString() }
}

async function salvarConversa(
  estabelecimentoId: string,
  telefone: string,
  conversaId: string | undefined,
  mensagens: MensagemArmazenada[],
  precisaHumano: boolean
): Promise<void> {
  const payload = {
    telefone,
    estabelecimento_id: estabelecimentoId,
    mensagens,
    precisa_humano: precisaHumano,
    ultima_interacao_em: new Date().toISOString(),
  }
  if (conversaId) {
    await supabaseAdmin.from('whatsapp_conversas').update(payload).eq('id', conversaId)
  } else {
    await supabaseAdmin.from('whatsapp_conversas').insert(payload)
  }
}

async function registrarMetrica(
  estabelecimentoId: string,
  resolvidoPor: 'atalho' | 'ia' | 'auditoria',
  modelo?: string,
  tokensEntrada?: number,
  tokensSaida?: number
): Promise<void> {
  await supabaseAdmin.from('whatsapp_metricas_log').insert({
    estabelecimento_id: estabelecimentoId,
    resolvido_por: resolvidoPor,
    modelo: modelo ?? null,
    tokens_entrada: tokensEntrada ?? null,
    tokens_saida: tokensSaida ?? null,
  })
}

interface DeepSeekRespostaCompleta {
  choices?: { message?: { content?: string } }[]
  usage?: { prompt_tokens?: number; completion_tokens?: number }
}

async function chamarDeepSeek(
  system: string,
  mensagens: { role: 'user' | 'assistant'; content: string }[]
): Promise<{ texto: string; tokensEntrada: number; tokensSaida: number }> {
  const resp = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [{ role: 'system', content: system }, ...mensagens],
      stream: false,
      max_tokens: 1024,
    }),
  })
  if (!resp.ok) throw new Error(`DeepSeek respondeu ${resp.status}`)
  const dados = (await resp.json()) as DeepSeekRespostaCompleta
  const texto = dados.choices?.[0]?.message?.content
  if (!texto) throw new Error('DeepSeek não retornou texto')
  return {
    texto,
    tokensEntrada: dados.usage?.prompt_tokens ?? 0,
    tokensSaida: dados.usage?.completion_tokens ?? 0,
  }
}

async function auditarComHaiku(
  system: string,
  mensagens: { role: 'user' | 'assistant'; content: string }[],
  estabelecimentoId: string
): Promise<void> {
  const resposta = await anthropic.messages.create({
    model: 'claude-haiku-4-5',
    max_tokens: 1024,
    system,
    messages: mensagens,
  })
  const bloco = resposta.content.find((b) => b.type === 'text')
  console.log('[whatsapp] auditoria Haiku', {
    estabelecimentoId,
    texto: bloco && 'text' in bloco ? bloco.text : null,
  })
  await registrarMetrica(
    estabelecimentoId, 'auditoria', 'claude-haiku-4-5',
    resposta.usage.input_tokens, resposta.usage.output_tokens
  )
}
