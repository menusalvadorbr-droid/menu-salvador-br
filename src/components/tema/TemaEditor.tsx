'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, ZoomIn, EyeOff } from 'lucide-react'

interface Tema {
  id: string
  nome: string
  config: any
  ativo: boolean
}

// Configuração por estabelecimento — salva em estabelecimentos.cardapio_config
interface CardapioConfig {
  foto_posicao: 'left' | 'right' | 'top' | 'none'
  mostrar_codigo: boolean
  mostrar_alergenos: boolean
  titulo: string
}

interface TemaEditorProps {
  estabelecimentoId: string
  temaAtualId: string | null
  readOnly?: boolean
  onTemaChange?: (temaId: string) => void
}

const ITENS_PREVIEW = [
  {
    id: '1',
    nome: 'Salmão Grelhado',
    descricao: 'Salmão grelhado com legumes salteados e molho de ervas.',
    preco: 45.0,
    codigo: '042',
    foto_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&auto=format&fit=crop',
    alergenos: ['🐟 Peixe', '🌾 Glúten'],
    promocao_ativa: true,
    preco_promocional: 38.0,
  },
  {
    id: '2',
    nome: 'Mousse de Feta',
    descricao: 'Mousse leve de queijo feta com mel e nozes.',
    preco: 34.0,
    codigo: '021',
    foto_url: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=400&auto=format&fit=crop',
    alergenos: ['🥛 Leite', '🌰 Nozes'],
    promocao_ativa: false,
    preco_promocional: null,
  },
  {
    id: '3',
    nome: 'Risoto de Cogumelos',
    descricao: 'Risoto cremoso com cogumelos frescos e parmesão.',
    preco: 52.0,
    codigo: '019',
    foto_url: 'https://images.unsplash.com/photo-1476124369491-e7addf5db371?w=400&auto=format&fit=crop',
    alergenos: ['🥛 Lactose', '🌾 Glúten'],
    promocao_ativa: false,
    preco_promocional: null,
  },
]

const DEFAULT_CONFIG: CardapioConfig = {
  foto_posicao: 'left',
  mostrar_codigo: true,
  mostrar_alergenos: true,
  titulo: '',
}

export default function TemaEditor({
  estabelecimentoId,
  temaAtualId,
  readOnly = false,
  onTemaChange,
}: TemaEditorProps) {
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [temas, setTemas]         = useState<Tema[]>([])
  const [loading, setLoading]     = useState(true)
  const [selecionado, setSelecionado] = useState<string | null>(temaAtualId)
  const [salvando, setSalvando]   = useState(false)
  const [mensagem, setMensagem]   = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null)
  const [modalItem, setModalItem] = useState<any>(null)

  // Opções por estabelecimento
  const [cfg, setCfg] = useState<CardapioConfig>(DEFAULT_CONFIG)
  const [cfgDirty, setCfgDirty] = useState(false)

  // Carregar temas + config do estabelecimento
  useEffect(() => {
    async function init() {
      const [{ data: tData }, { data: estData }] = await Promise.all([
        supabase.from('temas').select('*').eq('ativo', true).order('nome'),
        supabase.from('estabelecimentos')
          .select('cardapio_config, nome_fantasia, nome')
          .eq('id', estabelecimentoId)
          .single(),
      ])
      setTemas(tData || [])

      if (estData) {
        const saved: Partial<CardapioConfig> = estData.cardapio_config || {}
        setCfg({
          foto_posicao:       saved.foto_posicao       ?? 'left',
          mostrar_codigo:     saved.mostrar_codigo      !== false,
          mostrar_alergenos:  saved.mostrar_alergenos   !== false,
          titulo:             saved.titulo              ?? (estData.nome_fantasia || estData.nome || ''),
        })
      }
      setLoading(false)
    }
    init()
  }, [estabelecimentoId])

  function updCfg(partial: Partial<CardapioConfig>) {
    setCfg(prev => ({ ...prev, ...partial }))
    setCfgDirty(true)
  }

  // Salvar tema
  async function selecionarTema(temaId: string) {
    if (readOnly || salvando) return
    setSalvando(true)
    setMensagem(null)
    const { error } = await supabase
      .from('estabelecimentos')
      .update({ tema_atual_id: temaId })
      .eq('id', estabelecimentoId)
    if (error) {
      setMensagem({ tipo: 'error', texto: 'Erro ao salvar tema: ' + error.message })
    } else {
      setSelecionado(temaId)
      if (onTemaChange) onTemaChange(temaId)
      // não mostrar mensagem aqui — vai mostrar junto ao salvar config
    }
    setSalvando(false)
  }

  // Salvar configurações de exibição do cardápio
  async function salvarConfig() {
    if (readOnly || salvando) return
    setSalvando(true)
    setMensagem(null)
    const { error } = await supabase
      .from('estabelecimentos')
      .update({ cardapio_config: cfg })
      .eq('id', estabelecimentoId)
    setSalvando(false)
    if (error) {
      setMensagem({ tipo: 'error', texto: 'Erro ao salvar configurações: ' + error.message })
    } else {
      setCfgDirty(false)
      setMensagem({ tipo: 'success', texto: '✅ Configurações salvas! O cardápio público foi atualizado.' })
      setTimeout(() => setMensagem(null), 4000)
    }
  }

  const temaAtual = temas.find(t => t.id === selecionado) || temas[0]
  const config    = temaAtual?.config || {}
  const corP  = config.cor_primaria   || '#f97316'
  const corS  = config.cor_secundaria || '#ffffff'
  const corF  = config.cor_fundo      || '#f9fafb'
  const corT  = config.cor_texto      || '#1f2937'
  const corBd = config.cor_borda      || `${corP}30`

  const fmt = (v: number) => v?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  if (loading) return <div className="py-10 text-center text-gray-400">Carregando temas…</div>

  if (temas.length === 0) return (
    <div className="py-10 text-center text-gray-400">
      Nenhum tema disponível. Peça ao super-admin para criar temas.
    </div>
  )

  return (
    <div className="space-y-5">

      {/* Feedback */}
      {mensagem && (
        <div className={`rounded-xl px-4 py-3 text-sm ${mensagem.tipo === 'success'
          ? 'bg-green-50 text-green-700 border border-green-200'
          : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {mensagem.texto}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* ── CONTROLES (esquerda) ── */}
        <div className="space-y-4 order-2 xl:order-1">

          {/* Seleção de tema */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">🎨 Tema de cores</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {temas.map(tema => {
                const c = tema.config || {}
                const sel = selecionado === tema.id
                return (
                  <button
                    key={tema.id}
                    onClick={() => selecionarTema(tema.id)}
                    disabled={readOnly || salvando}
                    className={`relative p-3 rounded-xl border-2 text-left transition-all
                      ${sel ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}
                      ${readOnly ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Prévia de cores */}
                      <div className="flex gap-0.5 flex-shrink-0">
                        <div className="w-5 h-8 rounded-l-md border border-gray-200"
                          style={{ backgroundColor: c.cor_fundo || '#f9fafb' }} />
                        <div className="w-5 h-8 border-t border-b border-gray-200"
                          style={{ backgroundColor: c.cor_secundaria || '#ffffff' }} />
                        <div className="w-5 h-8 rounded-r-md border border-gray-200"
                          style={{ backgroundColor: c.cor_primaria || '#f97316' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-800 truncate">{tema.nome}</p>
                        <p className="text-xs text-gray-400 truncate">{c.cor_primaria || ''}</p>
                      </div>
                      {sel && <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Opções de exibição */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">🖼️ Opções do cardápio</h3>

            {/* Posição da foto */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-600 mb-2">Posição da foto</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {([
                  { value: 'left',  label: 'Esquerda' },
                  { value: 'right', label: 'Direita'  },
                  { value: 'top',   label: 'Acima'    },
                  { value: 'none',  label: 'Sem foto', icon: <EyeOff className="w-3 h-3" /> },
                ] as const).map(op => (
                  <button
                    key={op.value}
                    onClick={() => updCfg({ foto_posicao: op.value })}
                    disabled={readOnly}
                    className={`flex items-center justify-center gap-1 py-2 text-xs font-medium rounded-lg border transition
                      ${cfg.foto_posicao === op.value
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'}
                      ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {op.icon}
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkboxes */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-600 mb-2">Exibir no cardápio</label>
              <div className="flex flex-wrap gap-5">
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cfg.mostrar_codigo}
                    onChange={e => updCfg({ mostrar_codigo: e.target.checked })}
                    disabled={readOnly}
                    className="w-4 h-4 accent-orange-500"
                  />
                  Código do item <span className="text-gray-400 text-xs">(#042)</span>
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={cfg.mostrar_alergenos}
                    onChange={e => updCfg({ mostrar_alergenos: e.target.checked })}
                    disabled={readOnly}
                    className="w-4 h-4 accent-orange-500"
                  />
                  Alérgenos <span className="text-gray-400 text-xs">(⚠️ ANVISA)</span>
                </label>
              </div>
            </div>

            {/* Título */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-600 mb-1">Título do cardápio</label>
              <input
                type="text"
                value={cfg.titulo}
                onChange={e => updCfg({ titulo: e.target.value })}
                disabled={readOnly}
                placeholder="Ex: Cardápio do Bar do Zé"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900 disabled:opacity-60"
              />
            </div>

            {/* Botão salvar */}
            {!readOnly && (
              <button
                onClick={salvarConfig}
                disabled={salvando || !cfgDirty}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold disabled:opacity-40 transition flex items-center justify-center gap-2"
              >
                {salvando
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Salvando…</>
                  : cfgDirty ? '💾 Salvar configurações' : '✓ Salvo'
                }
              </button>
            )}
          </div>

        </div>

        {/* ── PREVIEW (direita) ── */}
        <div className="order-1 xl:order-2">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">📱 Preview do cardápio</span>
              <span className="text-xs text-gray-400">tema: {temaAtual?.nome}</span>
            </div>
            <div className="p-4">
              <div
                className="mx-auto max-w-sm rounded-2xl overflow-hidden shadow-lg border"
                style={{ backgroundColor: corF, color: corT, borderColor: corBd }}
              >
                {/* Cabeçalho */}
                <div className="p-4 border-b" style={{ backgroundColor: corS, borderColor: corBd }}>
                  <h3 className="text-base font-bold text-center" style={{ color: corP }}>
                    🍽️ {cfg.titulo || 'Cardápio'}
                  </h3>
                </div>

                {/* Promoções no topo (preview) */}
                {ITENS_PREVIEW.some(i => i.promocao_ativa) && (
                  <div style={{ backgroundColor: `${corP}12` }} className="px-3 pt-3 pb-1">
                    <p className="text-xs font-semibold mb-2" style={{ color: corP }}>🔥 Promoções</p>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {ITENS_PREVIEW.filter(i => i.promocao_ativa).map(item => (
                        <div key={item.id}
                          className="flex-shrink-0 w-28 rounded-xl overflow-hidden border"
                          style={{ backgroundColor: corS, borderColor: corBd }}
                        >
                          <div className="relative">
                            <img src={item.foto_url} alt={item.nome}
                              className="w-full h-16 object-cover" />
                            <span className="absolute top-1 left-1 text-xs text-white px-1.5 py-0.5 rounded-full font-semibold"
                              style={{ backgroundColor: corP }}>
                              -{Math.round((1 - item.preco_promocional! / item.preco) * 100)}%
                            </span>
                          </div>
                          <div className="p-1.5">
                            <p className="text-xs font-medium truncate" style={{ color: corT }}>{item.nome}</p>
                            <p className="text-xs line-through text-gray-400">R$ {fmt(item.preco)}</p>
                            <p className="text-xs font-bold" style={{ color: corP }}>R$ {fmt(item.preco_promocional!)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Itens */}
                <div className="p-3 space-y-3">
                  {ITENS_PREVIEW.map(item => {
                    const fp = cfg.foto_posicao
                    const flexDir = fp === 'right' ? 'flex-row-reverse' : fp === 'top' ? 'flex-col' : 'flex-row'
                    const fotoSz  = fp === 'top' ? 'w-full h-28' : 'w-20 h-20'

                    return (
                      <div key={item.id} className="rounded-xl p-3 shadow-sm"
                        style={{ backgroundColor: corS, border: `1px solid ${corBd}` }}>
                        <div className={`flex ${flexDir} gap-3 items-start`}>
                          {fp !== 'none' && (
                            <div className={`flex-shrink-0 ${fotoSz} relative rounded-lg overflow-hidden bg-gray-100`}>
                              <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover" />
                              <button onClick={() => setModalItem(item)}
                                className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-black/50 text-white flex items-center justify-center">
                                <ZoomIn className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-1">
                              <div className="flex flex-wrap items-center gap-1">
                                {cfg.mostrar_codigo && (
                                  <span className="text-xs font-mono px-1.5 py-0.5 rounded"
                                    style={{ backgroundColor: `${corP}18`, color: corP }}>
                                    #{item.codigo}
                                  </span>
                                )}
                                <span className="text-xs font-medium" style={{ color: corT }}>{item.nome}</span>
                                {item.promocao_ativa && (
                                  <span className="text-xs px-1.5 py-0.5 rounded-full text-white"
                                    style={{ backgroundColor: corP }}>🔥</span>
                                )}
                              </div>
                              <div className="text-right flex-shrink-0">
                                {item.promocao_ativa && item.preco_promocional ? (
                                  <>
                                    <div className="text-xs text-gray-400 line-through">R$ {fmt(item.preco)}</div>
                                    <div className="text-xs font-bold" style={{ color: corP }}>R$ {fmt(item.preco_promocional)}</div>
                                  </>
                                ) : (
                                  <div className="text-xs font-bold" style={{ color: corP }}>R$ {fmt(item.preco)}</div>
                                )}
                              </div>
                            </div>
                            <p className="text-xs opacity-60 mt-1 line-clamp-2" style={{ color: corT }}>{item.descricao}</p>
                            {cfg.mostrar_alergenos && item.alergenos.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {item.alergenos.map(a => (
                                  <span key={a} className="text-xs px-1.5 py-0.5 rounded-full"
                                    style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}>
                                    {a}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox preview */}
      {modalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setModalItem(null)}>
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="relative">
              <img src={modalItem.foto_url} alt={modalItem.nome}
                className="w-full max-h-[60vh] object-contain bg-gray-100" />
              <button onClick={() => setModalItem(null)}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center">✕</button>
            </div>
            <div className="p-4">
              <h4 className="font-semibold text-gray-800">{modalItem.nome}</h4>
              <p className="text-sm text-gray-500 mt-1">{modalItem.descricao}</p>
              <p className="text-sm font-bold text-orange-600 mt-1">R$ {fmt(modalItem.preco)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
