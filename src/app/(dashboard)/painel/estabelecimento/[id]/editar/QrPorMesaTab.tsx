'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import QRCode from 'react-qr-code'
import { useMesas } from '@/modules/pedidos/mesas/hooks/useMesas'
import { baixarElementoComoPng } from '@/lib/baixarImagemElemento'
import { useIsClient } from '@/lib/useIsClient'

interface QrPorMesaTabProps {
  estabelecimentoId: string
  slug: string
  readOnly?: boolean
}

export default function QrPorMesaTab({ estabelecimentoId, slug, readOnly = false }: QrPorMesaTabProps) {
  const { mesas, carregando, adicionar } = useMesas(estabelecimentoId)
  const isClient = useIsClient()
  const origem = isClient ? window.location.origin : ''
  // Refs guardadas fora de state — não precisam disparar re-render, e um
  // callback ref inline que faz setState a cada attach/detach entra em
  // loop (o setState causa novo render, que cria uma nova função de ref,
  // que o React trata como "mudou", desanexando e reanexando de novo).
  const refsRef = useRef<Record<string, HTMLDivElement | null>>({})
  const [baixandoId, setBaixandoId] = useState<string | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [numeroNovo, setNumeroNovo] = useState('')

  async function handleAdicionar() {
    if (!numeroNovo.trim()) return
    await adicionar(numeroNovo.trim())
    setNumeroNovo('')
    setMostrarForm(false)
  }

  async function baixarQrDaMesa(mesaId: string, numero: string) {
    const elemento = refsRef.current[mesaId]
    if (!elemento) return
    setBaixandoId(mesaId)
    try {
      await baixarElementoComoPng(elemento, `qrcode-mesa-${numero}-${slug}.png`, '#FFFFFF')
    } catch (err) {
      console.error('Erro ao baixar QR da mesa:', err)
      alert('Erro ao baixar QR Code. Tente novamente.')
    }
    setBaixandoId(null)
  }

  if (carregando) return <div className="py-10 text-center text-gray-400">Carregando mesas…</div>

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <span className="text-2xl">🪑</span> QR por mesa
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Cada mesa tem seu próprio QR Code — o cliente escaneia, escolhe &quot;Estou na mesa&quot; e o pedido já
          chega identificado com o número dela, sem precisar digitar nada.
        </p>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Link
          href={`/painel/estabelecimento/${estabelecimentoId}/pedidos/mesas`}
          className="text-sm text-orange-600 hover:underline font-medium"
        >
          🗺️ Gerenciar mesas (capacidade, status)
        </Link>
        {!readOnly && (
          <button
            onClick={() => setMostrarForm((v) => !v)}
            className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 transition"
          >
            {mostrarForm ? 'Cancelar' : '+ Nova mesa'}
          </button>
        )}
      </div>

      {mostrarForm && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-gray-200 p-4">
          <label className="flex flex-col gap-1 text-xs text-gray-500">
            Número/nome da mesa
            <input
              value={numeroNovo}
              onChange={(e) => setNumeroNovo(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAdicionar()}
              placeholder="Ex: 12"
              className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
            />
          </label>
          <button
            onClick={handleAdicionar}
            disabled={!numeroNovo.trim()}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-40 transition"
          >
            Adicionar
          </button>
        </div>
      )}

      {mesas.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-4xl mb-3">🪑</p>
          <p className="font-medium text-gray-500">Nenhuma mesa cadastrada</p>
          <p className="text-sm">Adicione uma mesa acima para gerar o QR dela</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {mesas.map((mesa) => {
            const link = `${origem}/cardapio/${slug}?mesa=${encodeURIComponent(mesa.numero)}&mesa_id=${mesa.id}`
            return (
              <div key={mesa.id} className="rounded-xl border border-gray-200 p-4 text-center">
                <p className="font-semibold text-gray-800 mb-2">Mesa {mesa.numero}</p>
                {isClient ? (
                  <div
                    ref={(el) => { refsRef.current[mesa.id] = el }}
                    className="inline-block rounded-lg bg-white p-2"
                  >
                    <QRCode value={link} size={120} bgColor="#FFFFFF" fgColor="#000000" level="H" />
                  </div>
                ) : (
                  <div className="mx-auto h-[136px] w-[136px] animate-pulse rounded-lg bg-gray-100" />
                )}
                <button
                  onClick={() => baixarQrDaMesa(mesa.id, mesa.numero)}
                  disabled={!isClient || baixandoId === mesa.id}
                  className="mt-3 w-full rounded-lg bg-green-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-600 disabled:opacity-50 transition"
                >
                  {baixandoId === mesa.id ? '⏳ Baixando…' : '⬇️ Baixar QR'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
