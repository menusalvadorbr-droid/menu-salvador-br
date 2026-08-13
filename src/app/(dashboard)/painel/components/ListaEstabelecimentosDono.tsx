'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Building2, Eye, EyeOff, ExternalLink, Settings, LayoutGrid, List } from 'lucide-react'
import { ExcluirEstabelecimentoButton } from './ExcluirEstabelecimentoButton'

const COR_TERRACOTA = '#C1541F'
const COR_AZULEJO = '#2B5C73'
const COR_OCRE = '#B8860B'
const COR_FUNDO = '#FBF7F0'
const COR_TEXTO = '#2A2420'

interface Estabelecimento {
  id: string
  nome: string
  nome_fantasia: string | null
  slug: string
  status: string
  foto_capa: string | null
  ativo: boolean | null
  bairro: string | null
  bairros?: { slug: string } | null
  cidades?: { slug: string } | null
  tipos_estabelecimento?: { slug: string } | null
  estabelecimento_tipos_cozinha?: { tipos_cozinha: { nome: string } | null }[] | null
}

export default function ListaEstabelecimentosDono({
  estabelecimentos,
  toggleOcultar,
}: {
  estabelecimentos: Estabelecimento[]
  toggleOcultar: (formData: FormData) => void | Promise<void>
}) {
  const [visualizacao, setVisualizacao] = useState<'card' | 'lista'>('card')

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-400">
          {estabelecimentos.length} estabelecimento{estabelecimentos.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-1 rounded-lg border border-black/5 bg-white p-1">
          <button
            onClick={() => setVisualizacao('card')}
            className="rounded-md p-1.5 transition"
            style={visualizacao === 'card' ? { backgroundColor: `${COR_TERRACOTA}18`, color: COR_TERRACOTA } : { color: '#9CA3AF' }}
            title="Ver em cards"
            aria-pressed={visualizacao === 'card'}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
          <button
            onClick={() => setVisualizacao('lista')}
            className="rounded-md p-1.5 transition"
            style={visualizacao === 'lista' ? { backgroundColor: `${COR_TERRACOTA}18`, color: COR_TERRACOTA } : { color: '#9CA3AF' }}
            title="Ver em lista"
            aria-pressed={visualizacao === 'lista'}
          >
            <List className="h-4 w-4" />
          </button>
        </div>
      </div>

      {visualizacao === 'card' ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {estabelecimentos.map((est) => (
            <CardEstabelecimento key={est.id} est={est} toggleOcultar={toggleOcultar} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {estabelecimentos.map((est) => (
            <LinhaEstabelecimento key={est.id} est={est} toggleOcultar={toggleOcultar} />
          ))}
        </div>
      )}
    </div>
  )
}

function statusDe(est: Estabelecimento) {
  const emAnalise = est.status === 'em_analise'
  const isAtivo = est.ativo !== false && est.status === 'active'
  const cor = isAtivo ? COR_TERRACOTA : emAnalise ? COR_OCRE : '#9CA3AF'
  const texto = isAtivo ? 'Ativo' : emAnalise ? 'Em análise' : 'Inativo'
  return { emAnalise, isAtivo, cor, texto }
}

function culinariasDe(est: Estabelecimento) {
  return (est.estabelecimento_tipos_cozinha || [])
    .map((v) => v.tipos_cozinha?.nome)
    .filter(Boolean)
    .join(', ')
}

// Mesmo padrão de GridEstabelecimentos/EstablishmentCard: URL de 4 segmentos
// só quando dá pra montar ela inteira, senão cai pra /cardapio/slug — link de
// 1 segmento sozinho (/slug) não é rota reconhecida (a rota coringa interpreta
// como página de cidade e dá 404).
function linkPublico(est: Estabelecimento) {
  const cidadeSlug = est.cidades?.slug
  const bairroSlug = est.bairros?.slug
  const tipoSlug = est.tipos_estabelecimento?.slug
  return cidadeSlug && bairroSlug && tipoSlug
    ? `/${cidadeSlug}/${bairroSlug}/${tipoSlug}/${est.slug}`
    : `/cardapio/${est.slug}`
}

function CardEstabelecimento({
  est,
  toggleOcultar,
}: {
  est: Estabelecimento
  toggleOcultar: (formData: FormData) => void | Promise<void>
}) {
  const nomeExibicao = est.nome_fantasia || est.nome
  const { emAnalise, isAtivo, cor, texto } = statusDe(est)
  const culinarias = culinariasDe(est)

  return (
    <div className="flex overflow-hidden rounded-xl border border-black/5 bg-white shadow-sm transition-shadow duration-300 hover:shadow-md">
      <div className="w-1.5 shrink-0" style={{ backgroundColor: cor }} />
      <div className="flex-1">
        {est.foto_capa ? (
          <div className="relative h-36 overflow-hidden">
            <img src={est.foto_capa} alt={nomeExibicao} className="h-full w-full object-cover" />
            {!isAtivo && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                <span className="rounded-full px-3 py-1 text-xs font-semibold text-white" style={{ backgroundColor: cor }}>
                  {emAnalise ? 'Em análise' : 'Oculto'}
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-36 items-center justify-center" style={{ backgroundColor: COR_FUNDO }}>
            <Building2 className="h-14 w-14" style={{ color: '#D8CFC0' }} />
          </div>
        )}

        <div className="p-5">
          <div className="mb-1 flex items-start justify-between gap-2">
            <h3 className="truncate text-base font-semibold" style={{ color: COR_TEXTO }}>{nomeExibicao}</h3>
            <span className="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold" style={{ color: cor, backgroundColor: `${cor}18` }}>
              {texto}
            </span>
          </div>

          <div className="mb-4 space-y-0.5 text-sm text-neutral-500">
            {est.bairro && <p>{est.bairro}</p>}
            {culinarias && <p>{culinarias}</p>}
            <p className="text-xs text-neutral-400">/{est.slug}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2 border-t border-neutral-100 pt-3">
            <Link
              href={`/painel/estabelecimento/${est.id}/gerenciar`}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-white transition hover:brightness-110"
              style={{ backgroundColor: COR_AZULEJO }}
            >
              <Settings className="h-4 w-4" />
              Gerenciar
            </Link>

            <div className="flex items-center gap-1">
              <form action={toggleOcultar}>
                <input type="hidden" name="id" value={est.id} />
                <input type="hidden" name="ativo" value={String(isAtivo)} />
                <button
                  type="submit"
                  className={`rounded-lg p-2 transition ${isAtivo ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                  title={isAtivo ? 'Ocultar do diretório' : 'Mostrar no diretório'}
                >
                  {isAtivo ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </form>

              <ExcluirEstabelecimentoButton estabelecimentoId={est.id} nomeExibicao={nomeExibicao} />

              <Link
                href={linkPublico(est)}
                target="_blank"
                className="rounded-lg bg-neutral-100 p-2 text-neutral-600 transition hover:bg-neutral-200"
                title="Ver página pública"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function LinhaEstabelecimento({
  est,
  toggleOcultar,
}: {
  est: Estabelecimento
  toggleOcultar: (formData: FormData) => void | Promise<void>
}) {
  const nomeExibicao = est.nome_fantasia || est.nome
  const { emAnalise, isAtivo, cor, texto } = statusDe(est)
  const culinarias = culinariasDe(est)

  return (
    <div className="flex items-center gap-4 rounded-xl border border-black/5 bg-white px-4 py-3 shadow-sm">
      <div className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: cor }} />

      {est.foto_capa ? (
        <img src={est.foto_capa} alt={nomeExibicao} className="h-11 w-11 shrink-0 rounded-lg object-cover" />
      ) : (
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg" style={{ backgroundColor: COR_FUNDO }}>
          <Building2 className="h-5 w-5" style={{ color: '#D8CFC0' }} />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h3 className="truncate text-sm font-semibold" style={{ color: COR_TEXTO }}>{nomeExibicao}</h3>
          <span className="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold" style={{ color: cor, backgroundColor: `${cor}18` }}>
            {texto}
          </span>
        </div>
        <p className="truncate text-xs text-neutral-400">
          {[est.bairro, culinarias].filter(Boolean).join(' · ') || `/${est.slug}`}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1">
        <Link
          href={`/painel/estabelecimento/${est.id}/gerenciar`}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium text-white transition hover:brightness-110"
          style={{ backgroundColor: COR_AZULEJO }}
        >
          <Settings className="h-3.5 w-3.5" />
          Gerenciar
        </Link>

        <form action={toggleOcultar}>
          <input type="hidden" name="id" value={est.id} />
          <input type="hidden" name="ativo" value={String(isAtivo)} />
          <button
            type="submit"
            className={`rounded-lg p-1.5 transition ${isAtivo ? 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
            title={isAtivo ? 'Ocultar do diretório' : 'Mostrar no diretório'}
          >
            {isAtivo ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </form>

        <ExcluirEstabelecimentoButton estabelecimentoId={est.id} nomeExibicao={nomeExibicao} />

        <Link
          href={linkPublico(est)}
          target="_blank"
          className="rounded-lg bg-neutral-100 p-1.5 text-neutral-600 transition hover:bg-neutral-200"
          title="Ver página pública"
        >
          <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>
    </div>
  )
}
