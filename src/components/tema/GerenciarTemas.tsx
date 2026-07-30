'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import ImageUpload from '@/app/(dashboard)/painel/components/ImageUpload'
import SeletorCor from './SeletorCor'
import SeletorFonte from './SeletorFonte'
import PreviewTemaCardapio, { CONFIG_TEMA_PADRAO, type ConfigTemaPreview } from './PreviewTemaCardapio'

interface Tema {
  id: string
  nome: string
  slug: string
  descricao: string | null
  preview_image_url: string | null
  config: Partial<ConfigTemaPreview> & Record<string, unknown>
  tipo: 'free' | 'premium'
  ativo: boolean
  created_at: string
}

const FORM_PADRAO = {
  nome: '',
  slug: '',
  descricao: '',
  preview_image_url: '',
  tipo: 'free' as 'free' | 'premium',
  ativo: true,
  config: CONFIG_TEMA_PADRAO,
}

export default function GerenciarTemas() {
  const supabase = createClient()
  const [temas, setTemas] = useState<Tema[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<Tema | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [form, setForm] = useState(FORM_PADRAO)

  useEffect(() => {
    carregarTemas()
  }, [])

  async function carregarTemas() {
    const { data } = await supabase.from('temas').select('*').order('created_at', { ascending: false })
    if (data) setTemas(data)
    setLoading(false)
  }

  function updConfig(partial: Partial<ConfigTemaPreview>) {
    setForm((prev) => ({ ...prev, config: { ...prev.config, ...partial } }))
  }

  async function salvarTema(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    try {
      const dados = {
        nome: form.nome,
        slug: form.slug,
        descricao: form.descricao || null,
        preview_image_url: form.preview_image_url || null,
        config: form.config,
        tipo: form.tipo,
        ativo: form.ativo,
      }

      const { error } = editando
        ? await supabase.from('temas').update(dados).eq('id', editando.id)
        : await supabase.from('temas').insert(dados)

      if (error) {
        alert('Erro ao salvar tema: ' + error.message)
      } else {
        setEditando(null)
        setForm(FORM_PADRAO)
        carregarTemas()
      }
    } finally {
      setSalvando(false)
    }
  }

  function editarTema(tema: Tema) {
    setEditando(tema)
    setForm({
      nome: tema.nome || '',
      slug: tema.slug || '',
      descricao: tema.descricao || '',
      preview_image_url: tema.preview_image_url || '',
      tipo: tema.tipo,
      ativo: tema.ativo,
      // Temas antigos não têm os campos novos (fonte, hero, raio) — mescla
      // com o padrão em vez de deixar undefined quebrando os controles.
      config: { ...CONFIG_TEMA_PADRAO, ...(tema.config || {}) },
    })
  }

  async function deletarTema(id: string) {
    if (!confirm('Remover este tema?')) return
    const { error } = await supabase.from('temas').delete().eq('id', id)
    if (error) alert('Erro ao remover: ' + error.message)
    else carregarTemas()
  }

  if (loading) return <div className="py-10 text-center text-gray-400">Carregando…</div>

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">🎨 Gerenciar Temas</h2>

      <form onSubmit={salvarTema} className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* ── CONTROLES ── */}
        <div className="order-2 space-y-4 xl:order-1">
          <div className="space-y-3 rounded-lg border bg-white p-4 shadow">
            <h3 className="font-semibold">{editando ? 'Editar tema' : 'Novo tema'}</h3>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <input
                value={form.nome}
                onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                placeholder="Nome"
                className="rounded border p-2"
                required
              />
              <input
                value={form.slug}
                onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                placeholder="Slug (ex: moderno)"
                className="rounded border p-2"
                required
              />
              <input
                value={form.descricao}
                onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
                placeholder="Descrição"
                className="rounded border p-2"
              />
              <input
                value={form.preview_image_url}
                onChange={(e) => setForm((p) => ({ ...p, preview_image_url: e.target.value }))}
                placeholder="URL da imagem de prévia (miniatura na lista)"
                className="rounded border p-2"
              />
              <select
                value={form.tipo}
                onChange={(e) => setForm((p) => ({ ...p, tipo: e.target.value as 'free' | 'premium' }))}
                className="rounded border p-2"
              >
                <option value="free">Grátis</option>
                <option value="premium">Premium</option>
              </select>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm((p) => ({ ...p, ativo: e.target.checked }))}
                />
                Ativo
              </label>
            </div>
          </div>

          {/* Cores */}
          <div className="space-y-3 rounded-lg border bg-white p-4 shadow">
            <h3 className="text-sm font-semibold text-gray-700">Cores</h3>
            <div className="flex flex-wrap gap-4">
              <SeletorCor label="Primária" valor={form.config.cor_primaria} onChange={(v) => updConfig({ cor_primaria: v })} />
              <SeletorCor label="Secundária" valor={form.config.cor_secundaria} onChange={(v) => updConfig({ cor_secundaria: v })} />
              <SeletorCor label="Fundo" valor={form.config.cor_fundo} onChange={(v) => updConfig({ cor_fundo: v })} />
              <SeletorCor label="Texto" valor={form.config.cor_texto} onChange={(v) => updConfig({ cor_texto: v })} />
              <SeletorCor label="Borda" valor={form.config.cor_borda} onChange={(v) => updConfig({ cor_borda: v })} />
            </div>
          </div>

          {/* Fonte */}
          <div className="space-y-2 rounded-lg border bg-white p-4 shadow">
            <h3 className="text-sm font-semibold text-gray-700">Fonte</h3>
            <SeletorFonte valor={form.config.fonte} onChange={(v) => updConfig({ fonte: v })} />
          </div>

          {/* Fundo do hero */}
          <div className="space-y-3 rounded-lg border bg-white p-4 shadow">
            <h3 className="text-sm font-semibold text-gray-700">Fundo do hero (cabeçalho do cardápio)</h3>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updConfig({ hero_modo: 'cor' })}
                className={`rounded-lg border py-2 text-sm font-medium transition ${
                  form.config.hero_modo === 'cor' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Cor sólida
              </button>
              <button
                type="button"
                onClick={() => updConfig({ hero_modo: 'imagem' })}
                className={`rounded-lg border py-2 text-sm font-medium transition ${
                  form.config.hero_modo === 'imagem' ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                Imagem
              </button>
            </div>

            {form.config.hero_modo === 'imagem' && (
              <div className="space-y-4 pt-2">
                <ImageUpload
                  label="Foto de fundo do hero"
                  aspectRatio="16:9"
                  currentImage={form.config.hero_imagem_url}
                  onUpload={(url) => updConfig({ hero_imagem_url: url })}
                  onRemove={() => updConfig({ hero_imagem_url: null })}
                />
                <div>
                  <label className="mb-1 flex items-center justify-between text-xs font-medium text-gray-600">
                    <span>Escurecimento sobre a foto (véu)</span>
                    <span className="font-mono text-gray-400">{form.config.hero_veu_opacidade}%</span>
                  </label>
                  <input
                    type="range"
                    min={20}
                    max={100}
                    value={form.config.hero_veu_opacidade}
                    onChange={(e) => updConfig({ hero_veu_opacidade: Number(e.target.value) })}
                    className="w-full accent-orange-500"
                  />
                  <p className="mt-1 text-[11px] text-gray-400">
                    Travado num mínimo de 20% pra garantir que o texto por cima da foto continue legível.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Arredondamento dos cards */}
          <div className="space-y-2 rounded-lg border bg-white p-4 shadow">
            <label className="mb-1 flex items-center justify-between text-sm font-semibold text-gray-700">
              <span>Arredondamento dos cards</span>
              <span className="font-mono text-xs font-normal text-gray-400">{form.config.card_raio}px</span>
            </label>
            <input
              type="range"
              min={0}
              max={40}
              value={form.config.card_raio}
              onChange={(e) => updConfig({ card_raio: Number(e.target.value) })}
              className="w-full accent-orange-500"
            />
          </div>

          <button
            type="submit"
            disabled={salvando}
            className="w-full rounded bg-orange-600 px-4 py-2.5 font-semibold text-white transition hover:bg-orange-700 disabled:opacity-50"
          >
            {salvando ? 'Salvando…' : editando ? 'Atualizar tema' : 'Criar tema'}
          </button>
          {editando && (
            <button
              type="button"
              onClick={() => {
                setEditando(null)
                setForm(FORM_PADRAO)
              }}
              className="w-full rounded bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
            >
              Cancelar edição
            </button>
          )}
        </div>

        {/* ── PREVIEW AO VIVO ── */}
        <div className="order-1 xl:order-2">
          <div className="sticky top-4 space-y-2">
            <p className="text-center text-xs font-medium uppercase tracking-wider text-gray-400">📱 Preview ao vivo</p>
            <PreviewTemaCardapio config={form.config} titulo={form.nome || 'Cardápio'} />
          </div>
        </div>
      </form>

      {/* ── LISTA DE TEMAS ── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {temas.map((tema) => (
          <div key={tema.id} className="rounded-lg border bg-white p-4 shadow">
            {tema.preview_image_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tema.preview_image_url} alt={tema.nome} className="mb-2 h-32 w-full rounded object-cover" />
            )}
            <h3 className="font-bold">{tema.nome}</h3>
            <p className="text-sm text-gray-500">{tema.descricao}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`rounded px-2 py-0.5 text-xs ${tema.tipo === 'premium' ? 'bg-amber-100 text-amber-800' : 'bg-gray-100'}`}>
                {tema.tipo === 'premium' ? '🔒 Premium' : 'Grátis'}
              </span>
              <span className={`rounded px-2 py-0.5 text-xs ${tema.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {tema.ativo ? 'Ativo' : 'Inativo'}
              </span>
              {tema.config?.fonte && <span className="text-xs text-gray-400">{tema.config.fonte}</span>}
            </div>
            <div className="mt-2 flex gap-2">
              <button onClick={() => editarTema(tema)} className="text-sm text-blue-600 hover:underline">Editar</button>
              <button onClick={() => deletarTema(tema.id)} className="text-sm text-red-600 hover:underline">Remover</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
