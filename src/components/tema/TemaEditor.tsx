'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Check, ZoomIn, EyeOff, ChevronRight } from 'lucide-react'
import { obterFonteTema } from '@/lib/fontesTema'
import { gradienteHeroImagem } from '@/lib/temaHero'
import { CONFIG_TEMA_PADRAO } from './PreviewTemaCardapio'

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
    categoria: 'Pratos principais',
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
    categoria: 'Sobremesas',
    nome: 'Mousse de Feta',
    descricao: 'Mousse leve de queijo feta com mel e nozes.',
    preco: 34.0,
    codigo: '021',
    foto_url: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=400&auto=format&fit=crop',
    alergenos: ['🥛 Leite', '🌰 Nozes'],
    promocao_ativa: false,
    preco_promocional: null,
    // Exemplo de item com tamanhos, só pro preview mostrar a mesma regra
    // do cardápio público: "a partir de" usa o Preço* (aqui, 34) quando
    // preenchido; sem ele, mostraria a lista de tamanhos em vez disso.
    variacoes: [
      { id: 'v1', nome: 'Individual', preco: 34.0 },
      { id: 'v2', nome: 'Para compartilhar', preco: 58.0 },
    ],
  },
  {
    id: '3',
    categoria: 'Pratos principais',
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

// Ordem fixa (não derivada de ITENS_PREVIEW) pra não depender da ordem de
// declaração dos itens acima — só pra agrupar o preview por categoria e
// mostrar a Navegação de categoria (pílulas/faixas) refletindo a escolha.
const CATEGORIAS_PREVIEW = ['Pratos principais', 'Sobremesas'] as const

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
  const [formato, setFormato] = useState<'lista' | 'catalogo'>('lista')
  const [navegacaoCategoria, setNavegacaoCategoria] = useState<'pilulas' | 'faixas' | 'cards'>('pilulas')
  const [cfgDirty, setCfgDirty] = useState(false)

  // Só do preview — qual categoria está "ativa" (pílulas) ou "aberta"
  // (faixas), pra Navegação de categoria também aparecer refletida aqui,
  // igual as outras opções. Não é salvo em lugar nenhum.
  const [categoriaAtivaPreview, setCategoriaAtivaPreview] = useState<string>(CATEGORIAS_PREVIEW[0])
  const [categoriaAbertaPreview, setCategoriaAbertaPreview] = useState<string>(CATEGORIAS_PREVIEW[0])

  // Carregar temas + config do estabelecimento
  useEffect(() => {
    async function init() {
      const [{ data: tData }, { data: estData }] = await Promise.all([
        supabase.from('temas').select('*').eq('ativo', true).order('nome'),
        supabase.from('estabelecimentos')
          .select('cardapio_config, cardapio_formato, cardapio_navegacao_categoria, nome_fantasia, nome')
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
        setFormato(estData.cardapio_formato === 'catalogo' ? 'catalogo' : 'lista')
        setNavegacaoCategoria(
          estData.cardapio_navegacao_categoria === 'faixas'
            ? 'faixas'
            : estData.cardapio_navegacao_categoria === 'cards'
              ? 'cards'
              : 'pilulas'
        )
      }
      setLoading(false)
    }
    init()
  }, [estabelecimentoId])

  function updCfg(partial: Partial<CardapioConfig>) {
    setCfg(prev => ({ ...prev, ...partial }))
    setCfgDirty(true)
  }

  function updFormato(novo: 'lista' | 'catalogo') {
    setFormato(novo)
    setCfgDirty(true)
  }

  function updNavegacaoCategoria(novo: 'pilulas' | 'faixas' | 'cards') {
    setNavegacaoCategoria(novo)
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
      .update({ cardapio_config: cfg, cardapio_formato: formato, cardapio_navegacao_categoria: navegacaoCategoria })
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
  // Campos que só o tema em si controla (definidos em /admin/temas) —
  // temas antigos não têm essas chaves ainda, daí o merge com o padrão.
  const cfgTema = { ...CONFIG_TEMA_PADRAO, ...config }
  const fonteTema = obterFonteTema(cfgTema.fonte)
  const heroComImagem = cfgTema.hero_modo === 'imagem' && !!cfgTema.hero_imagem_url
  const heroGradiente = gradienteHeroImagem(corF, cfgTema.hero_veu_opacidade)
  const raioCard = `${cfgTema.card_raio}px`

  const fmt = (v: number) => v?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  // Extraído pra reaproveitar nos dois modos de Navegação de categoria
  // (pílulas filtram por categoria ativa, faixas mostram por categoria
  // aberta) sem duplicar o JSX do card duas vezes cada um.
  function renderCardCatalogo(item: (typeof ITENS_PREVIEW)[number]) {
    const temVariacoes = !!item.variacoes && item.variacoes.length > 0
    const precoBaseValido = item.preco > 0
    const menorPrecoVariacao = temVariacoes ? Math.min(...item.variacoes!.map(v => v.preco)) : null

    return (
      <div key={item.id} className="overflow-hidden shadow-sm"
        style={{ backgroundColor: corS, border: `1px solid ${corBd}`, borderRadius: raioCard }}>
        <div className="relative h-20 bg-gray-100">
          <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover" />
          {item.promocao_ativa && (
            <span className="absolute top-1 left-1 text-xs text-white px-1.5 py-0.5 rounded-full font-semibold"
              style={{ backgroundColor: corP }}>
              -{Math.round((1 - item.preco_promocional! / item.preco) * 100)}%
            </span>
          )}
        </div>
        <div className="p-2 text-center">
          <p className="text-xs font-semibold truncate" style={{ color: corT }}>{item.nome}</p>
          {item.promocao_ativa ? (
            <>
              <p className="text-xs text-gray-400 line-through mt-1">R$ {fmt(item.preco)}</p>
              <div className="inline-block rounded-full px-2 py-0.5 text-xs font-bold text-white mt-0.5"
                style={{ backgroundColor: corP }}>
                R$ {fmt(item.preco_promocional!)}
              </div>
            </>
          ) : (
            <div className="inline-block rounded-full px-2 py-0.5 text-xs font-bold text-white mt-1"
              style={{ backgroundColor: corP }}>
              {temVariacoes && precoBaseValido && (
                <span className="mr-0.5 text-[9px] font-normal opacity-80">a partir de</span>
              )}
              R$ {fmt(temVariacoes ? (precoBaseValido ? item.preco : menorPrecoVariacao!) : item.preco)}
            </div>
          )}
        </div>
      </div>
    )
  }

  function renderLinhaLista(item: (typeof ITENS_PREVIEW)[number]) {
    const fp = cfg.foto_posicao
    const flexDir = fp === 'right' ? 'flex-row-reverse' : fp === 'top' ? 'flex-col' : 'flex-row'
    const fotoSz  = fp === 'top' ? 'w-full h-28' : 'w-20 h-20'

    return (
      <div key={item.id} className="p-3 shadow-sm"
        style={{ backgroundColor: corS, border: `1px solid ${corBd}`, borderRadius: raioCard }}>
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
  }

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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {temas.map(tema => {
                const c = tema.config || {}
                const sel = selecionado === tema.id
                return (
                  <button
                    key={tema.id}
                    onClick={() => selecionarTema(tema.id)}
                    disabled={readOnly || salvando}
                    title={tema.nome}
                    className={`relative flex items-center gap-2 rounded-lg border-2 p-1.5 text-left transition-all
                      ${sel ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'}
                      ${readOnly ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {/* Prévia de cores */}
                    <div className="flex gap-0.5 flex-shrink-0">
                      <div className="w-3 h-6 rounded-l-sm border border-gray-200"
                        style={{ backgroundColor: c.cor_fundo || '#f9fafb' }} />
                      <div className="w-3 h-6 border-t border-b border-gray-200"
                        style={{ backgroundColor: c.cor_secundaria || '#ffffff' }} />
                      <div className="w-3 h-6 rounded-r-sm border border-gray-200"
                        style={{ backgroundColor: c.cor_primaria || '#f97316' }} />
                    </div>
                    <p className="flex-1 min-w-0 truncate text-xs font-medium text-gray-800">{tema.nome}</p>
                    {sel && <Check className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Opções de exibição */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">🖼️ Opções do cardápio</h3>

            {/* Formato do cardápio */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-600 mb-2">Formato</label>
              <div className="grid grid-cols-2 gap-2">
                {([
                  { value: 'lista', label: 'Lista' },
                  { value: 'catalogo', label: 'Catálogo' },
                ] as Array<{ value: 'lista' | 'catalogo'; label: string }>).map(op => (
                  <button
                    key={op.value}
                    onClick={() => updFormato(op.value)}
                    disabled={readOnly}
                    className={`flex items-center justify-center gap-1 py-2 text-xs font-medium rounded-lg border transition
                      ${formato === op.value
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'}
                      ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Navegação de categoria — independente do Formato (Lista/Catálogo):
                qualquer combinação funciona. */}
            <div className="mb-5">
              <label className="block text-xs font-medium text-gray-600 mb-2">Navegação de categoria</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {([
                  { value: 'pilulas', label: 'Pílulas fixas no topo' },
                  { value: 'faixas', label: 'Faixas expansíveis' },
                  { value: 'cards', label: 'Cards de categoria com foto' },
                ] as Array<{ value: 'pilulas' | 'faixas' | 'cards'; label: string }>).map(op => (
                  <button
                    key={op.value}
                    onClick={() => updNavegacaoCategoria(op.value)}
                    disabled={readOnly}
                    className={`flex items-center justify-center gap-1 py-2 text-xs font-medium rounded-lg border transition
                      ${navegacaoCategoria === op.value
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'}
                      ${readOnly ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {op.label}
                  </button>
                ))}
              </div>
              <p className="mt-1.5 text-[11px] text-gray-400">
                {navegacaoCategoria === 'faixas'
                  ? 'Faixas expansíveis carregam os itens de cada categoria só quando ela é aberta — mais leve pra cardápios grandes.'
                  : navegacaoCategoria === 'cards'
                    ? 'Mostra um grid de categorias com foto antes da lista; clicar leva pra uma página própria daquela categoria, que carrega só os itens dela — a mais leve pra cardápios grandes.'
                    : 'Pílulas fixas já carregam o cardápio inteiro de uma vez.'}
              </p>
            </div>

            {/* Posição da foto — só faz sentido no formato Lista; o Catálogo
                já é sempre foto acima, em grid. */}
            {formato === 'lista' && (
              <div className="mb-5">
                <label className="block text-xs font-medium text-gray-600 mb-2">Posição da foto</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {([
                    { value: 'left', label: 'Esquerda' },
                    { value: 'right', label: 'Direita' },
                    { value: 'top', label: 'Acima' },
                    { value: 'none', label: 'Sem foto', icon: <EyeOff className="w-3 h-3" /> },
                  ] as Array<{ value: CardapioConfig['foto_posicao']; label: string; icon?: ReactNode }>).map(op => (
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
                      {op.icon ? op.icon : null}
                      {op.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">📱 Preview do cardápio</span>
              {/* Formato, navegação de categoria etc. já se controlam em
                  "Opções do cardápio" à esquerda — não repete o controle
                  aqui, só mostra o que está selecionado (evita os dois
                  ficarem fora de sincronia, ou o dono clicar em dois
                  lugares diferentes pra mudar a mesma coisa). */}
              <span className="text-xs text-gray-400">
                {temaAtual?.nome} · {formato === 'catalogo' ? 'Catálogo' : 'Lista'}
              </span>
            </div>
            <div className="flex justify-center p-4">
              {/* Moldura de celular — tamanho sempre fixo (largura e
                  altura), pra não esticar/encolher conforme a seleção
                  (formato, navegação de categoria etc. mudam quanto
                  conteúdo cabe). O que muda de tamanho rola por dentro da
                  "tela", como um celular de verdade. */}
              <div className="relative w-[300px] shrink-0 rounded-[2.5rem] border-[10px] border-neutral-900 bg-neutral-900 shadow-xl">
                <div className="absolute left-1/2 top-0 z-10 h-5 w-28 -translate-x-1/2 rounded-b-xl bg-neutral-900" />
                <div
                  className={`h-[600px] overflow-y-auto rounded-[1.75rem] ${fonteTema.className}`}
                  style={{ backgroundColor: corF, color: corT }}
                >
                {/* Cabeçalho / hero — cor sólida (padrão) ou foto + degradê
                    até cor_fundo, conforme configurado no tema em
                    /admin/temas. Mesmo comportamento da página pública. */}
                <div
                  className="p-4 border-b text-center"
                  style={
                    heroComImagem
                      ? {
                          backgroundImage: `${heroGradiente}, url(${cfgTema.hero_imagem_url})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          borderColor: corBd,
                          color: '#ffffff',
                        }
                      : { backgroundColor: corS, borderColor: corBd }
                  }
                >
                  <h3 className="text-base font-bold" style={{ color: heroComImagem ? '#ffffff' : corP }}>
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
                          className="flex-shrink-0 w-28 overflow-hidden border"
                          style={{ backgroundColor: corS, borderColor: corBd, borderRadius: raioCard }}
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

                {/* Itens — agrupados por categoria, mostrando a Navegação
                    de categoria escolhida em "Opções do cardápio"
                    (pílulas fixas vs. faixas expansíveis), igual o
                    cardápio público faz de verdade. */}
                {navegacaoCategoria === 'cards' ? (
                  // Grid de cards de categoria — no cardápio de verdade,
                  // clicar leva pra uma página própria daquela categoria
                  // (que aí sim busca os itens); aqui é só a prévia do
                  // grid, sem itens embaixo, igual o comportamento real.
                  <div className="grid grid-cols-2 gap-2 p-3">
                    {CATEGORIAS_PREVIEW.map(catNome => {
                      const fotoCategoria = ITENS_PREVIEW.find(i => i.categoria === catNome)?.foto_url
                      return (
                        <div
                          key={catNome}
                          className="relative aspect-[16/9] overflow-hidden"
                          style={{ backgroundColor: corS, border: `1px solid ${corBd}`, borderRadius: raioCard }}
                        >
                          {fotoCategoria ? (
                            <img src={fotoCategoria} alt={catNome} className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-2xl">🍽️</div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                          <span className="absolute bottom-0 left-0 right-0 p-2 text-xs font-semibold text-white">
                            {catNome}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                ) : navegacaoCategoria === 'pilulas' ? (
                  <>
                    <div className="flex gap-1.5 overflow-x-auto px-3 pt-3">
                      {CATEGORIAS_PREVIEW.map(catNome => (
                        <button
                          key={catNome}
                          onClick={() => setCategoriaAtivaPreview(catNome)}
                          className="shrink-0 rounded-full px-2.5 py-1 text-xs font-medium transition"
                          style={
                            categoriaAtivaPreview === catNome
                              ? { backgroundColor: corP, color: '#ffffff' }
                              : { backgroundColor: corS, color: corT, border: `1px solid ${corBd}` }
                          }
                        >
                          {catNome}
                        </button>
                      ))}
                    </div>
                    {formato === 'catalogo' ? (
                      <div className="p-3 grid grid-cols-2 gap-3">
                        {ITENS_PREVIEW.filter(i => i.categoria === categoriaAtivaPreview).map(renderCardCatalogo)}
                      </div>
                    ) : (
                      <div className="p-3 space-y-3">
                        {ITENS_PREVIEW.filter(i => i.categoria === categoriaAtivaPreview).map(renderLinhaLista)}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3 space-y-2">
                    {CATEGORIAS_PREVIEW.map(catNome => {
                      const aberta = categoriaAbertaPreview === catNome
                      const itensCategoria = ITENS_PREVIEW.filter(i => i.categoria === catNome)
                      return (
                        <div key={catNome} className="overflow-hidden" style={{ border: `1px solid ${corBd}`, borderRadius: raioCard }}>
                          <button
                            onClick={() => setCategoriaAbertaPreview(aberta ? '' : catNome)}
                            className="flex w-full items-center justify-between px-3 py-2 text-xs font-semibold transition"
                            style={{ backgroundColor: corS, color: corT }}
                          >
                            {catNome}
                            <ChevronRight
                              className={`h-3.5 w-3.5 transition-transform ${aberta ? 'rotate-90' : ''}`}
                              style={{ color: corP }}
                            />
                          </button>
                          {aberta && (
                            formato === 'catalogo' ? (
                              <div className="grid grid-cols-2 gap-3 p-3">
                                {itensCategoria.map(renderCardCatalogo)}
                              </div>
                            ) : (
                              <div className="space-y-3 p-3">
                                {itensCategoria.map(renderLinhaLista)}
                              </div>
                            )
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
                </div>
                <div className="absolute bottom-1.5 left-1/2 h-1 w-24 -translate-x-1/2 rounded-full bg-neutral-600" />
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
