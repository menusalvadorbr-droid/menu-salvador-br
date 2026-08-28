import { createStaticPix, hasError } from 'pix-utils'

export interface DadosPix {
  chavePix: string
  nomeRecebedor: string
  cidade: string
  valor: number
  codigoPedido: string
}

export interface CodigoPix {
  copiaCola: string
  txid: string
}

// Campos merchantName/merchantCity do BR Code são ASCII, dentro de limites
// fixos (25/15 chars) — normaliza aqui em vez de arriscar um código que
// algum banco recusa por causa de acento ou tamanho.
const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '')

/** null quando os dados não dão pra gerar um BR Code válido (chave/cidade
 *  vazias, valor <= 0, ou o próprio pix-utils rejeita os campos) — quem
 *  chama trata como "Pix não configurado" e simplesmente não mostra o
 *  painel, sem quebrar a tela. */
export function gerarCodigoPix(dados: DadosPix): CodigoPix | null {
  if (!dados.chavePix.trim() || !dados.cidade.trim() || dados.valor <= 0) return null

  const txid = dados.codigoPedido
  const pix = createStaticPix({
    merchantName: semAcento(dados.nomeRecebedor).slice(0, 25),
    merchantCity: semAcento(dados.cidade).slice(0, 15),
    pixKey: dados.chavePix.trim(),
    txid,
    transactionAmount: dados.valor,
  })

  if (hasError(pix)) return null
  return { copiaCola: pix.toBRCode(), txid }
}
