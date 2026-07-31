import { toPng } from 'html-to-image'

/**
 * Renderiza um elemento do DOM (ex: um <QRCode>) como PNG e dispara o
 * download — mesmo mecanismo usado tanto pro QR geral do cardápio quanto
 * pelo QR por mesa, extraído aqui pra não duplicar a chamada ao
 * html-to-image em cada lugar que precisa baixar um QR como imagem.
 */
export async function baixarElementoComoPng(
  elemento: HTMLElement,
  nomeArquivo: string,
  corFundo: string,
  tamanho = 400
) {
  const dataUrl = await toPng(elemento, {
    width: tamanho,
    height: tamanho,
    backgroundColor: corFundo,
  })
  const link = document.createElement('a')
  link.download = nomeArquivo
  link.href = dataUrl
  link.click()
}
