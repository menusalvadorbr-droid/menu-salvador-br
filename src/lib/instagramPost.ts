// Geração de post pra Instagram (imagem via <canvas> + legenda) a partir de
// uma promoção/combo (special_offers) já cadastrado. Tudo roda no
// navegador — sem processamento no servidor, sem integração com a API do
// Instagram (o dono baixa a imagem e publica manualmente).

export type ModeloPost = 'foto' | 'moldura' | 'texto'

export const TAMANHO_POST = 1080

export interface CoresPost {
  corPrimaria: string
  corSecundaria: string
  corFundo: string
  corTexto: string
}

export interface OfertaParaPost {
  nome: string
  descricao: string | null
  preco_de: number | null
  preco_por: number
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function quebrarTexto(ctx: CanvasRenderingContext2D, texto: string, maxWidth: number): string[] {
  const palavras = texto.split(' ')
  const linhas: string[] = []
  let linhaAtual = ''
  for (const palavra of palavras) {
    const tentativa = linhaAtual ? `${linhaAtual} ${palavra}` : palavra
    if (linhaAtual && ctx.measureText(tentativa).width > maxWidth) {
      linhas.push(linhaAtual)
      linhaAtual = palavra
    } else {
      linhaAtual = tentativa
    }
  }
  if (linhaAtual) linhas.push(linhaAtual)
  return linhas
}

/** Desenha `img` cobrindo todo o retângulo (x,y,w,h), cortando o excesso —
 *  mesmo comportamento de CSS `object-fit: cover`. */
function desenharFotoCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) {
  const escala = Math.max(w / img.width, h / img.height)
  const sw = w / escala
  const sh = h / escala
  const sx = (img.width - sw) / 2
  const sy = (img.height - sh) / 2
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

/** Google Fonts não tem `text-decoration: line-through` no canvas — desenha
 *  o traço manualmente por cima do texto já escrito. */
function riscarTexto(ctx: CanvasRenderingContext2D, texto: string, x: number, y: number, alturaLinha: number) {
  const largura = ctx.measureText(texto).width
  const alinhamento = ctx.textAlign
  const inicioX = alinhamento === 'center' ? x - largura / 2 : alinhamento === 'right' ? x - largura : x
  ctx.beginPath()
  ctx.moveTo(inicioX, y + alturaLinha / 2)
  ctx.lineTo(inicioX + largura, y + alturaLinha / 2)
  ctx.lineWidth = Math.max(2, alturaLinha * 0.06)
  ctx.strokeStyle = ctx.fillStyle as string
  ctx.stroke()
}

/**
 * Desenha um dos 3 modelos de post no canvas (sempre 1080×1080). `img` pode
 * ser null — os três modelos têm um fallback sem foto (a "Texto em
 * destaque" é literalmente pensada pra isso).
 */
export function desenharPostInstagram(
  ctx: CanvasRenderingContext2D,
  modelo: ModeloPost,
  img: HTMLImageElement | null,
  oferta: OfertaParaPost,
  cores: CoresPost,
  fonteNome: string
) {
  const T = TAMANHO_POST
  ctx.clearRect(0, 0, T, T)
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  const temDesconto = oferta.preco_de != null && oferta.preco_de > oferta.preco_por

  if (modelo === 'foto') {
    ctx.fillStyle = cores.corPrimaria
    ctx.fillRect(0, 0, T, T)
    if (img) desenharFotoCover(ctx, img, 0, 0, T, T)

    const alturaFaixa = 320
    ctx.fillStyle = cores.corPrimaria
    ctx.globalAlpha = 0.94
    ctx.fillRect(0, T - alturaFaixa, T, alturaFaixa)
    ctx.globalAlpha = 1

    const margem = 60
    let y = T - alturaFaixa + 44
    ctx.fillStyle = '#ffffff'
    ctx.font = `700 60px "${fonteNome}"`
    for (const linha of quebrarTexto(ctx, oferta.nome, T - margem * 2).slice(0, 2)) {
      ctx.fillText(linha, margem, y)
      y += 70
    }

    y += 14
    if (temDesconto) {
      ctx.font = `400 38px "${fonteNome}"`
      ctx.globalAlpha = 0.75
      ctx.fillText(`De R$ ${fmt(oferta.preco_de!)}`, margem, y)
      riscarTexto(ctx, `De R$ ${fmt(oferta.preco_de!)}`, margem, y, 38)
      ctx.globalAlpha = 1
      y += 54
    }
    ctx.font = `700 78px "${fonteNome}"`
    ctx.fillText(`R$ ${fmt(oferta.preco_por)}`, margem, y)
    return
  }

  if (modelo === 'moldura') {
    ctx.fillStyle = cores.corFundo
    ctx.fillRect(0, 0, T, T)

    const tamanhoFoto = 680
    const xFoto = (T - tamanhoFoto) / 2
    const yFoto = 90

    ctx.save()
    ctx.beginPath()
    ctx.rect(xFoto, yFoto, tamanhoFoto, tamanhoFoto)
    ctx.clip()
    if (img) {
      desenharFotoCover(ctx, img, xFoto, yFoto, tamanhoFoto, tamanhoFoto)
    } else {
      ctx.fillStyle = cores.corSecundaria
      ctx.fillRect(xFoto, yFoto, tamanhoFoto, tamanhoFoto)
    }
    ctx.restore()

    ctx.lineWidth = 10
    ctx.strokeStyle = cores.corPrimaria
    ctx.strokeRect(xFoto + 5, yFoto + 5, tamanhoFoto - 10, tamanhoFoto - 10)

    ctx.textAlign = 'center'
    let y = yFoto + tamanhoFoto + 64
    ctx.fillStyle = cores.corTexto
    ctx.font = `700 54px "${fonteNome}"`
    for (const linha of quebrarTexto(ctx, oferta.nome, T - 160).slice(0, 2)) {
      ctx.fillText(linha, T / 2, y)
      y += 64
    }

    y += 16
    if (temDesconto) {
      ctx.font = `400 36px "${fonteNome}"`
      ctx.globalAlpha = 0.6
      const textoDe = `R$ ${fmt(oferta.preco_de!)}`
      ctx.fillText(textoDe, T / 2, y)
      riscarTexto(ctx, textoDe, T / 2, y, 36)
      ctx.globalAlpha = 1
      y += 52
    }
    ctx.font = `700 66px "${fonteNome}"`
    ctx.fillStyle = cores.corPrimaria
    ctx.fillText(`R$ ${fmt(oferta.preco_por)}`, T / 2, y)
    ctx.textAlign = 'left'
    return
  }

  // 'texto' — pouca ou nenhuma ênfase na foto, nome grande centralizado.
  ctx.fillStyle = cores.corFundo
  ctx.fillRect(0, 0, T, T)

  ctx.textAlign = 'center'
  let yTopo = 130
  if (img) {
    const tamanhoFoto = 260
    const xFoto = (T - tamanhoFoto) / 2
    ctx.save()
    ctx.beginPath()
    ctx.arc(T / 2, yTopo + tamanhoFoto / 2, tamanhoFoto / 2, 0, Math.PI * 2)
    ctx.clip()
    desenharFotoCover(ctx, img, xFoto, yTopo, tamanhoFoto, tamanhoFoto)
    ctx.restore()
    ctx.lineWidth = 6
    ctx.strokeStyle = cores.corPrimaria
    ctx.beginPath()
    ctx.arc(T / 2, yTopo + tamanhoFoto / 2, tamanhoFoto / 2, 0, Math.PI * 2)
    ctx.stroke()
    yTopo += tamanhoFoto + 80
  } else {
    yTopo = 340
  }

  ctx.fillStyle = cores.corTexto
  ctx.font = `700 80px "${fonteNome}"`
  let y = yTopo
  for (const linha of quebrarTexto(ctx, oferta.nome, T - 140).slice(0, 3)) {
    ctx.fillText(linha, T / 2, y)
    y += 92
  }

  y += 36
  if (temDesconto) {
    ctx.font = `400 40px "${fonteNome}"`
    ctx.globalAlpha = 0.6
    const textoDe = `De R$ ${fmt(oferta.preco_de!)}`
    ctx.fillText(textoDe, T / 2, y)
    riscarTexto(ctx, textoDe, T / 2, y, 40)
    ctx.globalAlpha = 1
    y += 58
  }

  ctx.font = `700 104px "${fonteNome}"`
  ctx.fillStyle = cores.corPrimaria
  ctx.fillText(`R$ ${fmt(oferta.preco_por)}`, T / 2, y)
  ctx.textAlign = 'left'
}

/** Carrega uma imagem com CORS liberado (necessário pra depois exportar o
 *  canvas com `toBlob`/`toDataURL` sem "tainted canvas") — resolve `null`
 *  em vez de rejeitar quando falha, pra cair no fallback sem foto de cada
 *  modelo em vez de travar a geração inteira. */
export function carregarImagem(url: string | null): Promise<HTMLImageElement | null> {
  if (!url) return Promise.resolve(null)
  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => resolve(img)
    img.onerror = () => resolve(null)
    img.src = url
  })
}

/** Injeta o CSS do Google Fonts pra família (se ainda não tiver) e espera
 *  carregar — canvas só desenha com a fonte certa depois dela estar
 *  disponível via Font Loading API (`document.fonts`). */
export async function carregarFonteGoogle(nomeFonte: string): Promise<void> {
  const familia = nomeFonte.replace(/ /g, '+')
  const href = `https://fonts.googleapis.com/css2?family=${familia}:wght@400;700&display=swap`
  if (!document.querySelector(`link[data-fonte-post="${nomeFonte}"]`)) {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = href
    link.setAttribute('data-fonte-post', nomeFonte)
    document.head.appendChild(link)
  }
  try {
    await Promise.all([
      document.fonts.load(`400 16px "${nomeFonte}"`),
      document.fonts.load(`700 16px "${nomeFonte}"`),
    ])
  } catch {
    // Sem a fonte carregada, o canvas cai na fonte padrão do navegador —
    // não trava a geração do post por causa disso.
  }
}

function normalizarHashtag(texto: string): string {
  // NFD separa acento de letra (é → e + ´); o replace seguinte já descarta
  // qualquer coisa que não seja letra/número comum, incluindo esse ´ solto
  // — não precisa de uma faixa Unicode à parte só pra acentos.
  return texto.normalize('NFD').replace(/[^a-zA-Z0-9]/g, '')
}

/**
 * Legenda pronta pra copiar e colar — nome, descrição (se tiver), preço com
 * chamada pra ação, e hashtags básicas a partir de bairro/tipo do
 * estabelecimento + "Salvador" (fixo, é o mercado da plataforma).
 */
export function gerarLegendaPost(
  oferta: OfertaParaPost,
  nomeEstabelecimento: string,
  bairro: string | null,
  tipoEstabelecimento: string | null
): string {
  const blocos: string[] = [`🔥 ${oferta.nome}`]

  if (oferta.descricao?.trim()) blocos.push(oferta.descricao.trim())

  const temDesconto = oferta.preco_de != null && oferta.preco_de > oferta.preco_por
  blocos.push(
    temDesconto
      ? `De R$ ${fmt(oferta.preco_de!)} por apenas R$ ${fmt(oferta.preco_por)}! 😍`
      : `Por apenas R$ ${fmt(oferta.preco_por)}! 😍`
  )

  blocos.push('👉 Peça já pelo cardápio digital!')

  const hashtags = [
    normalizarHashtag(nomeEstabelecimento),
    'promocao',
    'combo',
    tipoEstabelecimento ? normalizarHashtag(tipoEstabelecimento) : null,
    bairro ? normalizarHashtag(bairro) : null,
    'salvador',
    'salvadorbahia',
    'comidaboa',
  ]
    .filter((h): h is string => !!h)
    .map((h) => `#${h}`)

  return `${blocos.join('\n\n')}\n\n${hashtags.join(' ')}`
}
