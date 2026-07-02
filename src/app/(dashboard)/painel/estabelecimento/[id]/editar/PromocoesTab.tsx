'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ItemCardapio {
  id: string
  nome: string
  preco: number
  codigo: string | null
  foto_url: string | null
  categoria_id: string
  promo_status: 'none' | 'pending' | 'active' | 'paused' | null
  preco_promocional: number | null
  promo_desconto_pct: number | null
  promo_inicio: string | null
  promo_fim: string | null
}

interface PromocoesTabProps {
  estabelecimentoId: string
  readOnly?: boolean
}

type ModalModo = 'configurar' | 'pausar' | null

export default function PromocoesTab({ estabelecimentoId, readOnly }: PromocoesTabProps) {
  const supabase = createClient()
  const [itens, setItens]       = useState<ItemCardapio[]>([])
  const [loading, setLoading]   = useState(true)
  const [erro, setErro]         = useState<string | null>(null)
  const [toast, setToast]       = useState<string | null>(null)

  // modal de configuração de promoção
  const [modalModo, setModalModo]       = useState<ModalModo>(null)
  const [itemModal, setItemModal]       = useState<ItemCardapio | null>(null)
  const [tipoDesc, setTipoDesc]         = useState<'pct' | 'fixed'>('pct')
  const [descValor, setDescValor]       = useState('')
  const [promoInicio, setPromoInicio]   = useState('')
  const [promoFim, setPromoFim]         = useState('')
  const [recorrente, setRecorrente]     = useState(false)
  const [salvando, setSalvando]         = useState(false)

  const carregar = useCallback(async () => {
    setLoading(true)
    // buscar todos os itens do estabelecimento que têm algum status de promoção
    const { data: menus } = await supabase
      .from('menus')
      .select('id')
      .eq('estabelecimento_id', estabelecimentoId)
      .eq('ativo', true)
      .maybeSingle()

    if (!menus?.id) { setLoading(false); return }

    const { data: cats } = await supabase
      .from('categorias')
      .select('id')
      .eq('menu_id', menus.id)

    if (!cats?.length) { setItens([]); setLoading(false); return }

    const catIds = cats.map((c: any) => c.id)
    const { data } = await supabase
      .from('itens_cardapio')
      .select('id, nome, preco, codigo, foto_url, categoria_id, promo_status, preco_promocional, promo_desconto_pct, promo_inicio, promo_fim')
      .in('categoria_id', catIds)
      .not('promo_status', 'eq', 'none')
      .order('nome')

    setItens((data as ItemCardapio[]) || [])
    setLoading(false)
  }, [estabelecimentoId])

  useEffect(() => { carregar() }, [carregar])

  function mostrarToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }

  // ── abrir modal de configuração ──────────
  function abrirConfigurar(item: ItemCardapio) {
    setItemModal(item)
    setModalModo('configurar')
    setTipoDesc('pct')
    setDescValor(item.promo_desconto_pct?.toString() || '20')
    setPromoInicio(item.promo_inicio || new Date().toISOString().split('T')[0])
    setPromoFim(item.promo_fim || '')
    setRecorrente(false)
  }

  // ── salvar configuração e ativar ─────────
  async function ativarPromocao() {
    if (!itemModal) return
    const val = parseFloat(descValor.replace(',', '.'))
    if (isNaN(val) || val <= 0) { setErro('Valor de desconto inválido.'); return }

    setSalvando(true)
    setErro(null)

    let precoPromo: number
    if (tipoDesc === 'pct') {
      precoPromo = parseFloat((itemModal.preco * (1 - val / 100)).toFixed(2))
    } else {
      precoPromo = parseFloat((itemModal.preco - val).toFixed(2))
    }
    if (precoPromo <= 0) { setErro('Preço promocional inválido.'); setSalvando(false); return }

    const { error } = await supabase
      .from('itens_cardapio')
      .update({
        promo_status: 'active',
        preco_promocional: precoPromo,
        promo_desconto_pct: tipoDesc === 'pct' ? val : null,
        promo_inicio: promoInicio || null,
        promo_fim: promoFim || null,
        promocao_ativa: true, 
      })
      .eq('id', itemModal.id)

    setSalvando(false)
    if (error) { setErro('Erro ao ativar promoção: ' + error.message); return }
    setModalModo(null)
    mostrarToast(`✅ Promoção ativada para "${itemModal.nome}"`)
    carregar()
  }

  // ── pausar ───────────────────────────────
  async function pausarPromocao(item: ItemCardapio) {
  if (readOnly) return
  await supabase
    .from('itens_cardapio')
    .update({ 
      promo_status: 'paused',
      promocao_ativa: false   // ← ADICIONE ESTA LINHA
    })
    .eq('id', item.id)
  mostrarToast(`⏸ Promoção pausada. Configuração mantida.`)
  carregar()
}

  // ── retomar ──────────────────────────────
  async function retomarPromocao(item: ItemCardapio) {
  if (readOnly) return
  await supabase
    .from('itens_cardapio')
    .update({ 
      promo_status: 'active',
      promocao_ativa: true   // ← ADICIONE ESTA LINHA
    })
    .eq('id', item.id)
  mostrarToast(`▶️ Promoção de "${item.nome}" reativada`)
  carregar()
}

  // ── remover ──────────────────────────────
  async function removerPromocao(item: ItemCardapio) {
  if (readOnly || !confirm('Remover a promoção deste item?')) return
  await supabase
    .from('itens_cardapio')
    .update({
      promo_status: 'none',
      preco_promocional: null,
      promo_desconto_pct: null,
      promo_inicio: null,
      promo_fim: null,
      promocao_ativa: false,   // ← ADICIONE ESTA LINHA
    })
    .eq('id', item.id)
  carregar()
}

  // ── cálculo ao vivo do preço ─────────────
  const precoBase = itemModal?.preco || 0
  const descNum = parseFloat(descValor.replace(',', '.')) || 0
  const precoComDesconto = tipoDesc === 'pct'
    ? precoBase * (1 - descNum / 100)
    : precoBase - descNum

  // ── grupos ───────────────────────────────
  const pendentes = itens.filter(i => i.promo_status === 'pending')
  const ativas    = itens.filter(i => i.promo_status === 'active')
  const pausadas  = itens.filter(i => i.promo_status === 'paused')

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-gray-400">
      <div className="animate-spin w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full mr-3" />
      Carregando promoções...
    </div>
  )

  return (
    <div className="space-y-6">

      {/* toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl animate-fade-in">
          {toast}
        </div>
      )}

      {/* erro */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
          {erro}
          <button onClick={() => setErro(null)} className="text-red-400 ml-4">✕</button>
        </div>
      )}

      {/* sumário */}
      <div className="grid grid-cols-3 gap-3">
        <SumCard num={pendentes.length} label="Pendente de configuração" cor={pendentes.length > 0 ? 'yellow' : 'gray'} />
        <SumCard num={ativas.length}    label="Ativas no cardápio"        cor={ativas.length > 0 ? 'green' : 'gray'} />
        <SumCard num={pausadas.length}  label="Pausadas"                  cor="gray" />
      </div>

      {itens.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🏷️</p>
          <p className="font-medium">Nenhum item marcado como promoção</p>
          <p className="text-sm">Use o ícone 🏷️ na aba Cardápio para marcar um item</p>
        </div>
      )}

      {/* pendentes */}
      {pendentes.length > 0 && (
        <PromoGrupo
          titulo="Pendentes — aguardando configuração"
          hint="Estes itens foram marcados como promoção mas ainda não têm desconto definido. Não aparecem para o cliente até serem configurados."
          cor="yellow"
          itens={pendentes}
          readOnly={!!readOnly}
          renderAcoes={(item) => (
            <button
              onClick={() => abrirConfigurar(item)}
              className="flex items-center gap-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg transition"
            >
              ⚙️ Configurar
            </button>
          )}
        />
      )}

      {/* ativas */}
      {ativas.length > 0 && (
        <PromoGrupo
          titulo="Ativas no cardápio"
          cor="green"
          itens={ativas}
          readOnly={!!readOnly}
          renderAcoes={(item) => (
            <div className="flex gap-2">
              <button
                onClick={() => abrirConfigurar(item)}
                className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-2 py-1.5 rounded-lg transition"
              >
                ✏️ Editar
              </button>
              <button
                onClick={() => pausarPromocao(item)}
                className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-2 py-1.5 rounded-lg transition"
              >
                ⏸ Pausar
              </button>
              <button
                onClick={() => removerPromocao(item)}
                className="text-xs text-red-400 hover:text-red-600 border border-red-100 px-2 py-1.5 rounded-lg transition"
              >
                🗑️
              </button>
            </div>
          )}
        />
      )}

      {/* pausadas */}
      {pausadas.length > 0 && (
        <PromoGrupo
          titulo="Pausadas"
          hint="Configuração salva. Não aparecem para o cliente até retomar."
          cor="gray"
          itens={pausadas}
          readOnly={!!readOnly}
          renderAcoes={(item) => (
            <div className="flex gap-2">
              <button
                onClick={() => retomarPromocao(item)}
                className="flex items-center gap-1.5 text-xs font-semibold bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition"
              >
                ▶️ Retomar
              </button>
              <button
                onClick={() => removerPromocao(item)}
                className="text-xs text-red-400 hover:text-red-600 border border-red-100 px-2 py-1.5 rounded-lg transition"
              >
                🗑️
              </button>
            </div>
          )}
        />
      )}

      {/* ── MODAL DE CONFIGURAÇÃO ── */}
      {modalModo === 'configurar' && itemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-900">Configurar promoção</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {itemModal.codigo ? `#${itemModal.codigo} · ` : ''}{itemModal.nome}
                </p>
              </div>
              <button onClick={() => setModalModo(null)} className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 flex items-center justify-center transition">✕</button>
            </div>

            <div className="px-6 py-5 space-y-5">

              {erro && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 text-sm">{erro}</div>}

              {/* tipo de desconto */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Tipo de desconto</label>
                <div className="flex gap-3">
                  {(['pct', 'fixed'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTipoDesc(t)}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition ${
                        tipoDesc === t
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {t === 'pct' ? '% Percentual' : 'R$ Valor fixo'}
                    </button>
                  ))}
                </div>
              </div>

              {/* atalhos percentual */}
              {tipoDesc === 'pct' && (
                <div className="flex gap-2">
                  {[10, 15, 20, 30, 50].map(p => (
                    <button
                      key={p}
                      onClick={() => setDescValor(p.toString())}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition ${
                        descValor === p.toString()
                          ? 'bg-orange-100 border-orange-400 text-orange-700'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {p}%
                    </button>
                  ))}
                </div>
              )}

              {/* valor */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {tipoDesc === 'pct' ? 'Desconto (%)' : 'Desconto (R$)'}
                </label>
                <div className="relative">
                  <input
                    value={descValor}
                    onChange={e => setDescValor(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-2xl font-bold text-center bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="0"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    {tipoDesc === 'pct' ? '%' : 'R$'}
                  </span>
                </div>
              </div>

              {/* comparação de preços */}
              <div className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-4">
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-1">Preço atual</p>
                  <p className="text-base text-gray-500 line-through">R$ {precoBase.toFixed(2)}</p>
                </div>
                <div className="text-gray-400">→</div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 mb-1">Com promoção</p>
                  <p className="text-xl font-bold text-orange-600">
                    R$ {(precoComDesconto > 0 ? precoComDesconto : 0).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* datas */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Início</label>
                  <input
                    type="date"
                    value={promoInicio}
                    onChange={e => setPromoInicio(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Término <span className="text-gray-400 font-normal">(opcional)</span>
                  </label>
                  <input
                    type="date"
                    value={promoFim}
                    onChange={e => setPromoFim(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  />
                </div>
              </div>
              {promoFim && (
                <p className="text-xs text-gray-400">
                  Desativa automaticamente após {promoFim}.
                </p>
              )}
            </div>

            {/* footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button
                onClick={() => setModalModo(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
              >
                Cancelar
              </button>
              <button
                onClick={ativarPromocao}
                disabled={salvando || precoComDesconto <= 0}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {salvando
                  ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Ativando…</>
                  : '🔥 Ativar promoção'
                }
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ─────────────────────────────────────────────
// SUBCOMPONENTES
// ─────────────────────────────────────────────
function SumCard({ num, label, cor }: { num: number; label: string; cor: 'yellow' | 'green' | 'gray' }) {
  const cls = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    green:  'bg-green-50 border-green-200 text-green-700',
    gray:   'bg-gray-50 border-gray-200 text-gray-600',
  }[cor]
  return (
    <div className={`border rounded-xl px-4 py-3 ${cls}`}>
      <div className="text-2xl font-bold">{num}</div>
      <div className="text-xs mt-0.5 leading-snug">{label}</div>
    </div>
  )
}

function PromoGrupo({ titulo, hint, cor, itens, readOnly, renderAcoes }: {
  titulo: string; hint?: string; cor: string
  itens: ItemCardapio[]; readOnly: boolean
  renderAcoes: (item: ItemCardapio) => React.ReactNode
}) {
  const borderCor = cor === 'yellow' ? 'border-yellow-200' : cor === 'green' ? 'border-green-200' : 'border-gray-200'
  const headBg    = cor === 'yellow' ? 'bg-yellow-50'      : cor === 'green' ? 'bg-green-50'      : 'bg-gray-50'

  return (
    <div className={`border ${borderCor} rounded-xl overflow-hidden`}>
      <div className={`${headBg} px-4 py-3 border-b ${borderCor}`}>
        <h3 className="font-semibold text-gray-800 text-sm">{titulo} <span className="text-gray-400 font-normal">({itens.length})</span></h3>
        {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      </div>
      <div className="divide-y divide-gray-100">
        {itens.map(item => (
          <div key={item.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition ${cor === 'paused' ? 'opacity-55' : ''}`}>
            <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-100 flex items-center justify-center text-gray-400">
              {item.foto_url ? <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover" /> : '🍽️'}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                {item.codigo && <span className="font-mono text-xs text-gray-400">#{item.codigo}</span>}
                <span className="text-sm font-medium text-gray-800 truncate">{item.nome}</span>
              </div>
              <div className="text-xs text-gray-400 mt-0.5">
                {item.promo_desconto_pct
                  ? `-${item.promo_desconto_pct}% · `
                  : item.preco_promocional ? `R$ ${item.preco_promocional.toFixed(2)} · ` : ''}
                {item.promo_fim ? `até ${new Date(item.promo_fim).toLocaleDateString('pt-BR')}` : 'sem data de término'}
              </div>
            </div>
            <div className="text-right flex-shrink-0">
              {item.preco_promocional ? (
                <>
                  <div className="text-xs text-gray-400 line-through">R$ {item.preco?.toFixed(2)}</div>
                  <div className="text-sm font-bold text-orange-600">R$ {item.preco_promocional.toFixed(2)}</div>
                </>
              ) : (
                <div className="text-sm font-bold text-gray-800">R$ {item.preco?.toFixed(2)}</div>
              )}
            </div>
            {!readOnly && <div className="flex-shrink-0">{renderAcoes(item)}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}
