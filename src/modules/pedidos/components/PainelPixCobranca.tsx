'use client'

import { useState } from 'react'
import { gerarCodigoPix } from '@/lib/pix/gerarCodigoPix'
import QrCodeEstilizado from '@/app/(dashboard)/painel/components/ui/QrCodeEstilizado'

const ESTILOS = {
  claro: {
    card: 'border-sky-100 bg-sky-50/50',
    titulo: 'text-neutral-900',
    texto: 'text-neutral-500',
    textarea: 'border-neutral-200 bg-white text-neutral-600',
    botao: 'bg-sky-600 hover:bg-sky-700 text-white',
    aviso: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  escuro: {
    card: 'border-sky-500/20 bg-sky-500/5',
    titulo: 'text-white',
    texto: 'text-neutral-400',
    textarea: 'border-neutral-700 bg-neutral-800 text-neutral-300',
    botao: 'bg-sky-600 hover:bg-sky-500 text-white',
    aviso: 'border border-amber-500/30 bg-amber-500/10 text-amber-400',
  },
} as const

/**
 * Painel de cobrança Pix pro contexto do Caixa (fechamento de mesa e de
 * pedido avulso) — mesma ideia do PixPagamentoCard.tsx do checkout do
 * cliente (mesmo gerarCodigoPix, mesmo QrCodeEstilizado), mas com duas
 * diferenças propositais: suporta tema claro/escuro (o checkout é sempre
 * claro), e mostra um aviso visível em vez de sumir silenciosamente
 * quando falta configuração — quem olha essa tela é o operador, que
 * precisa entender por que o QR não apareceu.
 */
export default function PainelPixCobranca({
  chavePix,
  nomeFantasia,
  cidade,
  valor,
  referencia,
  tema = 'claro',
}: {
  chavePix: string | null
  nomeFantasia: string
  cidade: string | null
  valor: number
  /** Vira o txid do BR Code — sanitizado aqui (só alfanumérico, até 25
   *  caracteres) porque o pix-utils só valida o tamanho, não o formato;
   *  quem chama pode passar qualquer string legível (mesa-3-169..., um
   *  código de pedido etc.) sem se preocupar com o padrão exigido. */
  referencia: string
  tema?: 'claro' | 'escuro'
}) {
  const [copiado, setCopiado] = useState(false)
  const c = ESTILOS[tema]

  if (!chavePix || !cidade) {
    return (
      <div className={`rounded-2xl border p-4 text-sm ${c.aviso}`}>
        ⚠️ Pix não configurado — configure em Configurações → WhatsApp/Pix antes de usar essa forma de pagamento no caixa.
      </div>
    )
  }

  const txid = referencia.replace(/[^a-zA-Z0-9]/g, '').slice(0, 25) || 'PEDIDO'
  const pix = gerarCodigoPix({ chavePix, nomeRecebedor: nomeFantasia, cidade, valor, codigoPedido: txid })

  if (!pix) {
    return (
      <div className={`rounded-2xl border p-4 text-sm ${c.aviso}`}>
        ⚠️ Não foi possível gerar o QR code Pix — confira a chave Pix cadastrada em Configurações.
      </div>
    )
  }

  function copiar() {
    navigator.clipboard.writeText(pix!.copiaCola)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  return (
    <div className={`rounded-2xl border p-4 ${c.card}`}>
      <p className={`mb-3 text-sm font-bold ${c.titulo}`}>💳 Cobrar via Pix</p>
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <QrCodeEstilizado data={pix.copiaCola} width={140} height={140} />
        <div className="min-w-0 flex-1">
          <p className={`mb-1 text-xs ${c.texto}`}>
            Peça pro cliente escanear com o app do banco, ou copie o código abaixo.
          </p>
          <textarea
            readOnly
            value={pix.copiaCola}
            rows={3}
            onFocus={(e) => e.currentTarget.select()}
            className={`w-full rounded-lg border px-2 py-1.5 text-xs ${c.textarea}`}
          />
          <button
            onClick={copiar}
            className={`mt-2 w-full rounded-lg px-3 py-2 text-xs font-semibold sm:w-auto ${c.botao}`}
          >
            {copiado ? 'Copiado!' : 'Copiar código Pix'}
          </button>
        </div>
      </div>
    </div>
  )
}
