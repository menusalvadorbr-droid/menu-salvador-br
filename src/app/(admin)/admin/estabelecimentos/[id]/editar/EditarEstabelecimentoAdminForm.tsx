'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { slugify } from '@/lib/utils'
import { atualizarEstabelecimentoAdmin } from './actions'

interface Bairro {
  id: string
  nome: string
  slug: string
}

interface EditarEstabelecimentoAdminFormProps {
  estabelecimento: {
    id: string
    slug: string
    nome_fantasia: string | null
    nome: string
    endereco: string | null
    numero: string | null
    cep: string | null
    bairro: string | null
    bairro_id: string | null
    cidade: string | null
    telefone: string | null
    whatsapp: string | null
    instagram: string | null
    tipo_estabelecimento: string | null
    tipo_logradouro: string | null
    link_google_maps: string | null
    latitude: number | null
    longitude: number | null
  }
  bairros: Bairro[]
  tiposEstabelecimento: { slug: string; nome: string; icone: string | null }[]
}

export default function EditarEstabelecimentoAdminForm({ estabelecimento, bairros, tiposEstabelecimento }: EditarEstabelecimentoAdminFormProps) {
  const router = useRouter()

  const [nomeFantasia, setNomeFantasia] = useState(estabelecimento.nome_fantasia || estabelecimento.nome || '')
  const [endereco, setEndereco] = useState(estabelecimento.endereco || '')
  const [numero, setNumero] = useState(estabelecimento.numero || '')
  const [cep, setCep] = useState(estabelecimento.cep || '')
  const [bairroId, setBairroId] = useState(estabelecimento.bairro_id || '')
  const [cidade, setCidade] = useState(estabelecimento.cidade || 'Salvador')
  const [slug, setSlug] = useState(estabelecimento.slug)
  const [telefone, setTelefone] = useState(estabelecimento.telefone || '')
  const [whatsapp, setWhatsapp] = useState(estabelecimento.whatsapp || '')
  const [instagram, setInstagram] = useState(estabelecimento.instagram || '')
  const [tipoEstabelecimento, setTipoEstabelecimento] = useState(estabelecimento.tipo_estabelecimento || '')
  const [tipoLogradouro, setTipoLogradouro] = useState(estabelecimento.tipo_logradouro || '')
  const [linkGoogleMaps, setLinkGoogleMaps] = useState(estabelecimento.link_google_maps || '')
  const [latitude, setLatitude] = useState(estabelecimento.latitude != null ? String(estabelecimento.latitude) : '')
  const [longitude, setLongitude] = useState(estabelecimento.longitude != null ? String(estabelecimento.longitude) : '')

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sucesso, setSucesso] = useState(false)

  const bairroSelecionado = bairros.find((b) => b.id === bairroId)
  const enderecoCompleto = [
    [[tipoLogradouro, endereco].filter(Boolean).join(' '), numero].filter(Boolean).join(', '),
    bairroSelecionado?.nome,
    cidade && `${cidade}, BA`,
  ]
    .filter(Boolean)
    .join(', ')
  const linkMaps =
    linkGoogleMaps.trim() ||
    (enderecoCompleto ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(enderecoCompleto)}` : null)
  const slugNormalizado = slugify(slug)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSucesso(false)
    setLoading(true)
    try {
      const resultado = await atualizarEstabelecimentoAdmin({
        estabelecimentoId: estabelecimento.id,
        nomeFantasia,
        endereco,
        numero,
        cep,
        bairroId: bairroId || null,
        bairroNome: bairroSelecionado?.nome || '',
        cidade,
        slug,
        telefone,
        whatsapp,
        instagram,
        tipoEstabelecimento,
        tipoLogradouro,
        linkGoogleMaps,
        latitude,
        longitude,
      })
      setSlug(resultado.slug)
      setSucesso(true)
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Nome fantasia *</label>
        <input
          type="text"
          required
          value={nomeFantasia}
          onChange={(e) => setNomeFantasia(e.target.value)}
          className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo de estabelecimento</label>
        <select
          value={tipoEstabelecimento}
          onChange={(e) => setTipoEstabelecimento(e.target.value)}
          className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        >
          <option value="">Selecione</option>
          {tiposEstabelecimento.map((t) => (
            <option key={t.slug} value={t.slug}>{t.icone ? `${t.icone} ` : ''}{t.nome}</option>
          ))}
          {tipoEstabelecimento && !tiposEstabelecimento.some((t) => t.slug === tipoEstabelecimento) && (
            <option value={tipoEstabelecimento}>{tipoEstabelecimento} (inativo)</option>
          )}
        </select>
      </div>

      <div className="pt-2 border-t border-neutral-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">Endereço</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Tipo de logradouro</label>
            <input
              type="text"
              value={tipoLogradouro}
              onChange={(e) => setTipoLogradouro(e.target.value)}
              placeholder="Rua, Avenida, Travessa…"
              className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-neutral-700 mb-1">Logradouro</label>
              <input
                type="text"
                value={endereco}
                onChange={(e) => setEndereco(e.target.value)}
                placeholder='Ex: "das Flores"'
                className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Número</label>
              <input
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Bairro</label>
            <select
              value={bairroId}
              onChange={(e) => setBairroId(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Selecione o bairro</option>
              {bairros.map((b) => (
                <option key={b.id} value={b.id}>{b.nome}</option>
              ))}
            </select>
            {!bairroId && (
              <p className="text-xs text-amber-600 mt-1">
                Sem bairro definido, o link público cai no formato simplificado (/cardapio/slug) em vez da URL completa.
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">CEP</label>
            <input
              type="text"
              value={cep}
              onChange={(e) => setCep(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Cidade</label>
            <input
              type="text"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {linkMaps && (
          <a
            href={linkMaps}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-orange-600 hover:underline"
          >
            📍 Conferir esse endereço no Google Maps
          </a>
        )}

        <div className="mt-3 grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Latitude (opcional)</label>
            <input
              type="text"
              inputMode="decimal"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="-12.9777"
              className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Longitude (opcional)</label>
            <input
              type="text"
              inputMode="decimal"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="-38.5016"
              className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <p className="col-span-2 text-xs text-neutral-400">
            Só afeta o mapa incorporado da página pública (não muda o endereço nem a página de resultados). Preenchidas,
            as coordenadas têm prevalência sobre o endereço no mapa.
          </p>
        </div>

        <div className="mt-3">
          <label className="block text-sm font-medium text-neutral-700 mb-1">Link do Google Maps (opcional)</label>
          <input
            type="text"
            value={linkGoogleMaps}
            onChange={(e) => setLinkGoogleMaps(e.target.value)}
            placeholder="https://www.google.com/maps/embed?pb=..."
            className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
          <p className="text-xs text-neutral-400 mt-1">
            Ordem de prevalência no mapa da página pública: endereço (padrão) → coordenadas acima, se preenchidas →
            este link, se preenchido (prevalece sobre os dois). Pra o mapa incorporado funcionar de verdade com este
            link (não só o botão de abrir), use o link de <strong>Google Maps → Compartilhar → Incorporar um
            mapa</strong> (a URL de dentro do <code>src</code> do iframe, contém "/maps/embed"). Um link comum de
            "Compartilhar local" só funciona como botão de abrir, não incorpora.
          </p>
        </div>
      </div>

      <div className="pt-2 border-t border-neutral-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400 mb-2">Contato</p>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Telefone</label>
            <input
              type="tel"
              value={telefone}
              onChange={(e) => setTelefone(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">WhatsApp</label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-neutral-700 mb-1">Instagram</label>
            <input
              type="text"
              value={instagram}
              onChange={(e) => setInstagram(e.target.value)}
              placeholder="@usuario"
              className="w-full border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <div className="pt-2 border-t border-neutral-100">
        <label className="block text-sm font-medium text-neutral-700 mb-1">Slug (endereço da página pública)</label>
        <div className="flex items-center gap-1 text-sm text-neutral-400 mb-1">
          <span>/</span>
          <input
            type="text"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            className="flex-1 border border-neutral-300 rounded-lg px-4 py-2 text-neutral-900 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
        {slugNormalizado !== estabelecimento.slug && (
          <p className="text-xs text-amber-600">
            Isso muda a URL pública para <strong>/{slugNormalizado}</strong> — links antigos param de funcionar.
          </p>
        )}
      </div>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-lg text-sm">{error}</div>}
      {sucesso && <div className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-lg text-sm">Salvo!</div>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-600 text-white py-3 rounded-lg font-medium hover:bg-orange-700 transition disabled:opacity-50"
      >
        {loading ? 'Salvando...' : 'Salvar alterações'}
      </button>
    </form>
  )
}
