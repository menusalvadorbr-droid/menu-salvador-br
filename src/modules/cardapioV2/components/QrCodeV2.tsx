'use client'

import { useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { baixarElementoComoPng } from '@/lib/baixarImagemElemento'
import { contarAcessosQr } from '../qrAcessoRepository'

/**
 * QR Code apontando direto pra rota pública da Fase 2 (/cardapio-v2/[slug])
 * — sem link curto/redirecionador (o V1 tem esse recurso à parte, fora do
 * escopo do cardápio em si). Componente próprio, usando só bibliotecas
 * genéricas já no projeto (react-qr-code, baixarElementoComoPng) — não
 * importa nada de QrCodeTab.tsx do V1.
 */
export default function QrCodeV2({ estabelecimentoId, slug }: { estabelecimentoId: string; slug: string }) {
  const [link, setLink] = useState('')
  const [qrRef, setQrRef] = useState<HTMLDivElement | null>(null)
  const [copiado, setCopiado] = useState(false)
  const [baixando, setBaixando] = useState(false)
  const [acessos, setAcessos] = useState<number | null>(null)

  useEffect(() => {
    // Leitura pontual de window.location no mount (só existe no cliente),
    // não uma inscrição em algo que muda sozinho.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLink(`${window.location.origin}/cardapio-v2/${slug}`)
  }, [slug])

  useEffect(() => {
    // Busca pontual ao montar (não uma inscrição em algo que muda sozinho).
    contarAcessosQr(estabelecimentoId).then(setAcessos)
  }, [estabelecimentoId])

  async function copiarLink() {
    try {
      await navigator.clipboard.writeText(link)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 3000)
    } catch {
      alert('Copie o link manualmente: ' + link)
    }
  }

  async function baixarQr() {
    if (!qrRef) return
    setBaixando(true)
    try {
      await baixarElementoComoPng(qrRef, `cardapio-v2-qr-${slug}.png`, '#FFFFFF')
    } catch (e) {
      alert('Erro ao baixar QR Code: ' + (e instanceof Error ? e.message : 'erro desconhecido'))
    }
    setBaixando(false)
  }

  if (!link) return <p className="text-sm text-neutral-400">Carregando QR Code…</p>

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-neutral-200 bg-white p-6">
      <div ref={setQrRef} className="rounded-2xl bg-white p-6">
        <QRCode value={link} size={200} bgColor="#FFFFFF" fgColor="#000000" level="H" />
      </div>

      <p className="break-all text-center font-mono text-sm text-neutral-500">{link}</p>

      <p className="text-sm text-neutral-600">
        <span className="font-semibold text-neutral-900">{acessos ?? '—'}</span> acesso{acessos === 1 ? '' : 's'} via QR desde o início
      </p>

      <div className="flex flex-wrap justify-center gap-3">
        <button onClick={copiarLink} className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white">
          {copiado ? 'Copiado!' : 'Copiar link'}
        </button>
        <button onClick={baixarQr} disabled={baixando} className="rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white disabled:opacity-50">
          {baixando ? 'Baixando…' : 'Baixar QR Code'}
        </button>
      </div>

      <p className="max-w-sm text-center text-xs text-neutral-400">
        Imprima e coloque no estabelecimento — o cliente escaneia e acessa o cardápio direto, sem precisar gerar um QR novo quando o cardápio mudar.
      </p>

      {/* TEMPORÁRIO — só pra facilitar teste do carrinho de delivery
          enquanto não existe uma tela própria pra isso; remover quando o
          fluxo de delivery tiver seu próprio ponto de entrada. */}
      <a
        href={`${link}?canal=delivery`}
        target="_blank"
        rel="noopener noreferrer"
        className="rounded-lg border border-dashed border-orange-300 px-4 py-2 text-xs font-medium text-orange-700 hover:bg-orange-50"
      >
        🧪 Testar menu delivery (link temporário)
      </a>
    </div>
  )
}
