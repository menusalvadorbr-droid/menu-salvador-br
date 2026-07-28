'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LayoutGrid, List } from 'lucide-react'
import { AcoesEstabelecimentoAdmin } from './AcoesEstabelecimentoAdmin'

interface Estabelecimento {
  id: string
  nome: string
  nome_fantasia: string | null
  slug: string
  status: string
  cidade: string | null
  tipo_estabelecimento: string | null
  owner_user_id: string | null
  bairros?: { slug: string } | null
}

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: '✅ Ativo', bg: 'bg-green-50', text: 'text-green-700' },
  em_analise: { label: '🕒 Em análise', bg: 'bg-amber-50', text: 'text-amber-700' },
  blocked: { label: '🚫 Bloqueado', bg: 'bg-red-50', text: 'text-red-700' },
  excluido: { label: '🗑️ Excluído pelo dono', bg: 'bg-gray-100', text: 'text-gray-600' },
}

function getStatusBadge(status: string) {
  return STATUS_BADGE[status] || { label: status, bg: 'bg-gray-50', text: 'text-gray-700' }
}

function linkPublico(est: Estabelecimento) {
  return est.cidade && est.bairros?.slug && est.tipo_estabelecimento
    ? `/${est.cidade}/${est.bairros.slug}/${est.tipo_estabelecimento}/${est.slug}`
    : `/cardapio/${est.slug}`
}

export default function ListaEstabelecimentosAdmin({ estabelecimentos }: { estabelecimentos: Estabelecimento[] }) {
  const [visualizacao, setVisualizacao] = useState<'card' | 'lista'>('card')

  return (
    <div>
      <div className="mb-4 flex items-center justify-end">
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
          <button
            onClick={() => setVisualizacao('card')}
            className={`rounded-md p-1.5 transition ${visualizacao === 'card' ? 'bg-orange-50 text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
            title="Ver em cards"
            aria-pressed={visualizacao === 'card'}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setVisualizacao('lista')}
            className={`rounded-md p-1.5 transition ${visualizacao === 'lista' ? 'bg-orange-50 text-orange-600' : 'text-gray-400 hover:text-gray-600'}`}
            title="Ver em lista"
            aria-pressed={visualizacao === 'lista'}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {visualizacao === 'card' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {estabelecimentos.map((est) => (
            <CardEstabelecimento key={est.id} est={est} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {estabelecimentos.map((est) => (
            <LinhaEstabelecimento key={est.id} est={est} />
          ))}
        </div>
      )}
    </div>
  )
}

function CardEstabelecimento({ est }: { est: Estabelecimento }) {
  const badge = getStatusBadge(est.status)
  const isPending = est.status === 'em_analise'
  const isBlocked = est.status === 'blocked'
  const isExcluido = est.status === 'excluido'
  const nomeExibicao = est.nome_fantasia || est.nome

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 text-lg truncate">{nomeExibicao}</h3>
          <p className="text-sm text-gray-500 truncate">/{est.slug}</p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
              {badge.label}
            </span>
            <span className="text-xs text-gray-400">{est.owner_user_id ? '🔗 Vinculado' : '📌 Sem dono'}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <AcoesEstabelecimentoAdmin
          estabelecimentoId={est.id}
          nomeExibicao={nomeExibicao}
          isPending={isPending}
          isBlocked={isBlocked}
          isExcluido={isExcluido}
          temDono={!!est.owner_user_id}
        />

        <Link
          href={linkPublico(est)}
          target="_blank"
          className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
        >
          👁️ Ver
        </Link>

        <Link
          href={`/admin/estabelecimentos/${est.id}/analisar`}
          className="inline-flex items-center gap-1 bg-neutral-700 hover:bg-neutral-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
        >
          🔍 Analisar
        </Link>
      </div>
    </div>
  )
}

function LinhaEstabelecimento({ est }: { est: Estabelecimento }) {
  const badge = getStatusBadge(est.status)
  const isPending = est.status === 'em_analise'
  const isBlocked = est.status === 'blocked'
  const isExcluido = est.status === 'excluido'
  const nomeExibicao = est.nome_fantasia || est.nome

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-100 bg-white px-4 py-3 shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold text-gray-900">{nomeExibicao}</h3>
          <span className={`shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        </div>
        <p className="truncate text-xs text-gray-400">
          /{est.slug} · {est.owner_user_id ? '🔗 Vinculado' : '📌 Sem dono'}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <AcoesEstabelecimentoAdmin
          estabelecimentoId={est.id}
          nomeExibicao={nomeExibicao}
          isPending={isPending}
          isBlocked={isBlocked}
          isExcluido={isExcluido}
          temDono={!!est.owner_user_id}
        />

        <Link
          href={linkPublico(est)}
          target="_blank"
          className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
        >
          👁️ Ver
        </Link>

        <Link
          href={`/admin/estabelecimentos/${est.id}/analisar`}
          className="inline-flex items-center gap-1 bg-neutral-700 hover:bg-neutral-800 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
        >
          🔍 Analisar
        </Link>
      </div>
    </div>
  )
}
