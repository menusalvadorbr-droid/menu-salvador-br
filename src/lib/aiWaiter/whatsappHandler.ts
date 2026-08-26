import Anthropic from '@anthropic-ai/sdk'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { buildCardapioContextPorId, buscarDadosLocalizacao } from './buildCardapioContext'
import { montarSystemPrompt } from './systemPrompt'
import { resolverAtalho } from './atalhos'
import { enviarMensagemWhatsApp, enviarLocalizacaoWhatsApp, marcarComoLidaEDigitando, ErroTokenWhatsApp } from '@/lib/whatsapp/metaApi'

// DeepSeek V4 Flash como padrão (mesmo modelo/endpoint de
// /api/ai-waiter-deepseek, mas não-streaming aqui — a Cloud API do
// WhatsApp só aceita a mensagem pronta, não aceita ir enchendo aos poucos).
// Claude Haiku 4.5 roda em paralelo só numa amostra pequena das conversas,
// como auditor de qualidade — nunca é a resposta enviada ao cliente.
const DEEPSEEK_URL = 'https://api.deepseek.com/chat/completions'
const DEEPSEEK_MODEL = 'deepseek-v4-flash'
const PROPORCAO_AUDITORIA_HAIKU = 0.05
// Tamanho da resposta é controlado pela instrução de canal em
// systemPrompt.ts (2-4 linhas), não por um teto agressivo de tokens — 300
// cortava resposta no meio da frase (e, com deepseek-v4-flash, parece ter
// esvaziado `content` de vez em alguns casos, não só truncado — ver o log
// de finish_reason em chamarDeepSeek). 1024 é o valor original, alto o
// bastante pra nunca cortar uma resposta normal, servindo só de limite de
// segurança de verdade.
const MAX_TOKENS_RESPOSTA_WHATSAPP = 1024
// Achado ao vivo (caso real "Sim monte" -> "Claro! 😊 Mon"): o DeepSeek às
// vezes gera uma resposta genuinamente curta e para sozinho por conta
// própria — HTTP 200, sem erro, tokens_saida de só 6 num teto de 1024, não
// é corte por max_tokens. Não cai no catch de erro porque não é erro.
// Limiar arbitrário mas folgado — qualquer resposta de verdade em
// português passa disso fácil; só existe pra pegar esse tipo de corte
// espúrio do modelo.
const TAMANHO_MINIMO_RESPOSTA_VALIDA = 15

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

  // Reivindica o wamid atomicamente antes de qualquer outra coisa — a
  // Meta manda duas notificações por mensagem (confirmado em produção,
  // sempre em par, ~0,5s de diferença), e a checagem antiga (ler os
  // wamids já salvos em whatsapp_conversas e decidir em JS) tinha uma
  // janela de corrida: as duas notificações liam o mesmo estado "ainda
  // sem esse wamid" antes de qualquer uma gravar, processavam em
  // paralelo, e quem terminava por último vencia — se essa segunda
  // chamada falhasse por qualquer motivo, sobrescrevia uma resposta boa
  // já enviada com o fallback de erro. A constraint unique no banco
  // garante exclusão mútua de verdade sob concorrência; checar em JS não.
  const { error: erroReivindicacao } = await supabaseAdmin
    .from('whatsapp_wamids_processados')
    .insert({ wamid })
  if (erroReivindicacao) {
    console.log('[whatsapp] wamid já reivindicado por outra notificação concorrente, ignorando duplicata:', wamid)
    return
  }

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
    .select('id, mensagens, precisa_humano, localizacao_enviada')
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

  // Marca como lida + ativa "digitando..." assim que sabemos que vamos
  // responder de algum jeito (atalho, aviso de humano, ou IA) — cobre a
  // percepção de espera em qualquer um dos três caminhos, não só o da IA.
  // Cosmético e não bloqueante: uma falha aqui nunca impede o resto.
  await marcarComoLidaEDigitando(est.whatsapp_phone_number_id, est.whatsapp_access_token, wamid)

  // Camada 1 — atalho por palavra-chave, custo zero, checado antes de
  // qualquer IA. Só bate se o cliente não pediu um humano explicitamente.
  const respostaAtalho = pediuHumanoAgora ? null : await resolverAtalho(estabelecimentoId, texto)
  if (respostaAtalho) {
    const enviado = await enviarComTratamentoDeErro(est, telefone, respostaAtalho, estabelecimentoId)
    if (enviado) await registrarMetrica(estabelecimentoId, 'atalho')
    const localizacaoEnviada = enviado
      ? await considerarEnviarLocalizacao(est, estabelecimentoId, telefone, respostaAtalho, !!conversaExistente?.localizacao_enviada)
      : undefined
    await salvarConversa(
      estabelecimentoId, telefone, conversaExistente?.id,
      [...historicoComNova, ...(enviado ? [mensagemAssistente(respostaAtalho)] : [])],
      enviado ? jaPrecisavaHumano : true,
      localizacaoEnviada
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
  const inicioContexto = Date.now()
  const contexto = await buildCardapioContextPorId(estabelecimentoId)
  console.log(`[whatsapp][timing] buildCardapioContext: ${Date.now() - inicioContexto}ms`, { wamid })
  if (!contexto) {
    console.error('[whatsapp] contexto de cardápio não encontrado:', estabelecimentoId)
    return
  }
  const system = montarSystemPrompt(contexto, { canal: 'whatsapp' })
  const mensagensParaModelo = historicoComNova.map((m) => ({ role: m.role, content: m.content }))

  let respostaTexto: string
  let precisaHumano = jaPrecisavaHumano
  let metricaIa: { tokensEntrada: number; tokensSaida: number } | null = null
  try {
    const inicioDeepSeek = Date.now()
    let resultado = await chamarDeepSeek(system, mensagensParaModelo, MAX_TOKENS_RESPOSTA_WHATSAPP)
    if (resultado.texto.trim().length < TAMANHO_MINIMO_RESPOSTA_VALIDA) {
      console.warn('[whatsapp] resposta da IA anormalmente curta, tentando de novo uma vez:', JSON.stringify(resultado.texto), { wamid })
      resultado = await chamarDeepSeek(system, mensagensParaModelo, MAX_TOKENS_RESPOSTA_WHATSAPP)
    }
    console.log(`[whatsapp][timing] chamarDeepSeek: ${Date.now() - inicioDeepSeek}ms`, { wamid })
    respostaTexto = resultado.texto
    metricaIa = { tokensEntrada: resultado.tokensEntrada, tokensSaida: resultado.tokensSaida }
  } catch (err) {
    console.error('[whatsapp] erro ao chamar DeepSeek:', err)
    respostaTexto = 'Desculpe, não consegui responder agora. Nossa equipe vai te responder em breve por aqui.'
    precisaHumano = true
  }

  // Fora do try/catch da IA de propósito — achado ao vivo: essa gravação
  // de métrica (efeito colateral, não crítico) rodava DENTRO do try, então
  // uma falha aqui (mesmo transitória) caía no catch e descartava uma
  // resposta da IA que já tinha dado certo, trocando por "não consegui
  // responder agora" sem a IA ter falhado de verdade. Uma falha aqui
  // nunca pode apagar a resposta já obtida.
  if (metricaIa) {
    try {
      await registrarMetrica(estabelecimentoId, 'ia', DEEPSEEK_MODEL, metricaIa.tokensEntrada, metricaIa.tokensSaida)
    } catch (err) {
      console.error('[whatsapp] erro ao registrar métrica (não afeta a resposta já obtida da IA):', err)
    }
  }

  // Auditoria por amostragem — roda em paralelo (não aguardada), nunca
  // bloqueia nem decide a resposta enviada ao cliente, só registra pra
  // comparação de qualidade/custo entre os dois modelos.
  if (Math.random() < PROPORCAO_AUDITORIA_HAIKU) {
    auditarComHaiku(system, mensagensParaModelo, estabelecimentoId).catch((err) => {
      console.error('[whatsapp] erro na auditoria Haiku (não afeta a resposta já enviada ao cliente):', err)
    })
  }

  const inicioEnvio = Date.now()
  const enviado = await enviarComTratamentoDeErro(est, telefone, respostaTexto, estabelecimentoId)
  console.log(`[whatsapp][timing] enviarMensagemWhatsApp: ${Date.now() - inicioEnvio}ms`, { wamid })
  const localizacaoEnviada = enviado
    ? await considerarEnviarLocalizacao(est, estabelecimentoId, telefone, respostaTexto, !!conversaExistente?.localizacao_enviada)
    : undefined
  await salvarConversa(
    estabelecimentoId, telefone, conversaExistente?.id,
    [...historicoComNova, ...(enviado ? [mensagemAssistente(respostaTexto)] : [])],
    enviado ? precisaHumano : true,
    localizacaoEnviada
  )
}

/** Decide se manda a localização real do estabelecimento logo depois de uma
 *  resposta (atalho ou IA) que já falou do endereço — gatilho é o TEXTO DA
 *  RESPOSTA já enviada conter o logradouro cadastrado, não uma tentativa de
 *  adivinhar como o cliente perguntou (o projeto já viu abordagem por
 *  palavra-chave da pergunta quebrar com erro de digitação/variação de
 *  frase). Cobre as duas rotas (atalho "endereço" e resposta livre da IA)
 *  com a mesma checagem, sem duplicar lógica de detecção de intenção.
 *
 *  Nunca bloqueia nem afeta a resposta de texto já enviada: chamada sempre
 *  DEPOIS do envio de texto ter dado certo, e qualquer falha aqui (rede,
 *  token, campo faltando) só é logada. Retorna o novo valor de
 *  localizacao_enviada pra persistir (`undefined` = deixa como já estava,
 *  usado quando nem chega a rodar). Se já tinha sido enviada nesta
 *  conversa, não reenvia — a resposta em texto (já confirmada funcionando)
 *  já basta a partir da segunda vez; reabrir a conversa via
 *  marcarConversaResolvida (atendimentoActions.ts) reseta o marcador. */
async function considerarEnviarLocalizacao(
  est: { whatsapp_phone_number_id: string; whatsapp_access_token: string },
  estabelecimentoId: string,
  telefone: string,
  respostaTexto: string,
  jaEnviada: boolean
): Promise<boolean | undefined> {
  if (jaEnviada) return undefined
  try {
    const dados = await buscarDadosLocalizacao(estabelecimentoId)
    if (!dados || !dados.enderecoParaChecagem) return undefined
    if (!normalizar(respostaTexto).includes(normalizar(dados.enderecoParaChecagem))) return undefined

    if (dados.latitude != null && dados.longitude != null) {
      await enviarLocalizacaoWhatsApp(est.whatsapp_phone_number_id, est.whatsapp_access_token, telefone, {
        latitude: dados.latitude,
        longitude: dados.longitude,
        nome: dados.nome,
        endereco: dados.enderecoCompleto,
      })
    } else {
      // Sem lat/long cadastrados: mesmo fallback de link (não o formato de
      // iframe embutido) usado pela página pública quando faltam
      // coordenadas — abre direto no Google Maps do celular do cliente.
      const link = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(dados.enderecoCompleto)}`
      await enviarMensagemWhatsApp(est.whatsapp_phone_number_id, est.whatsapp_access_token, telefone, link)
    }
    return true
  } catch (err) {
    console.error('[whatsapp] erro ao enviar localização (não afeta a resposta de texto já enviada):', err)
    return undefined
  }
}

function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
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
  precisaHumano: boolean,
  // `undefined` = não mexe no valor já salvo (nenhum envio de localização
  // foi sequer considerado neste turno) — só definido quando
  // considerarEnviarLocalizacao rodou de fato.
  localizacaoEnviada?: boolean
): Promise<void> {
  const payload: Record<string, unknown> = {
    telefone,
    estabelecimento_id: estabelecimentoId,
    mensagens,
    precisa_humano: precisaHumano,
    ultima_interacao_em: new Date().toISOString(),
  }
  if (localizacaoEnviada !== undefined) payload.localizacao_enviada = localizacaoEnviada
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
  choices?: { message?: { content?: string }; finish_reason?: string }[]
  usage?: { prompt_tokens?: number; completion_tokens?: number }
}

async function chamarDeepSeek(
  system: string,
  mensagens: { role: 'user' | 'assistant'; content: string }[],
  maxTokens: number
): Promise<{ texto: string; tokensEntrada: number; tokensSaida: number }> {
  const resp = await fetch(DEEPSEEK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.DEEPSEEK_API_KEY}` },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages: [{ role: 'system', content: system }, ...mensagens],
      stream: false,
      max_tokens: maxTokens,
      // deepseek-v4-flash roda em "thinking mode" por padrão — gera
      // raciocínio interno (reasoning_content) antes da resposta final,
      // consumindo parte do max_tokens de forma invisível. Era isso que
      // batia o teto e devolvia content vazio (finish_reason 'length')
      // mesmo em perguntas simples que exigem comparar vários itens do
      // cardápio (ex: "qual o mais caro"). Resposta de WhatsApp não
      // precisa de raciocínio em cadeia — desativa, o que também reduz a
      // latência de geração.
      thinking: { type: 'disabled' },
    }),
  })
  if (!resp.ok) throw new Error(`DeepSeek respondeu ${resp.status}`)
  const dados = (await resp.json()) as DeepSeekRespostaCompleta
  const texto = dados.choices?.[0]?.message?.content
  if (!texto) {
    // finish_reason 'length' = cortou por max_tokens (o que estava
    // acontecendo com o teto de 300) — qualquer outro valor aqui aponta
    // pra uma causa diferente.
    console.error('[whatsapp] DeepSeek não retornou texto, finish_reason:', dados.choices?.[0]?.finish_reason)
    throw new Error('DeepSeek não retornou texto')
  }
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
