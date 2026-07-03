'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import ImageUpload from '@/app/(dashboard)/painel/components/ImageUpload'

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────
interface ItemCardapio {
  id: string
  nome: string
  preco: number
  codigo: string | null
  foto_url: string | null
  promo_status: 'none' | 'pending' | 'active' | 'paused' | null
  preco_promocional: number | null
  promo_desconto_pct: number | null
  promo_inicio: string | null
  promo_fim: string | null
}

interface SpecialOffer {
  id: string
  nome: string
  descricao: string | null
  foto_url: string | null
  preco_de: number | null
  preco_por: number
  inicio_em: string | null
  fim_em: string | null
  recorrente: boolean
  dias_semana: number[]
  hora_inicio: string | null
  hora_fim: string | null
  alerta_minutos: number
  ativo: boolean
}

interface PromocoesTabProps {
  estabelecimentoId: string
  readOnly?: boolean
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────
const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const fmt = (v: number) => v?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function fmtDateTime(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

function statusOffer(o: SpecialOffer): 'ativa' | 'encerrada' | 'agendada' | 'sem_data' {
  const now = new Date()
  if (o.recorrente) return 'ativa' // recorrentes sempre aparecem como ativas
  if (!o.inicio_em && !o.fim_em) return 'sem_data'
  if (o.inicio_em && new Date(o.inicio_em) > now) return 'agendada'
  if (o.fim_em && new Date(o.fim_em) < now) return 'encerrada'
  return 'ativa'
}

// Monta um datetime local no formato ISO para o banco
function toISOLocal(date: string, time: string): string | null {
  if (!date) return null
  const t = time || '00:00'
  // cria a data no fuso local e converte para ISO
  const d = new Date(`${date}T${t}:00`)
  return d.toISOString()
}

// Extrai data e hora de um ISO string para os inputs
function fromISO(iso: string | null): { date: string; time: string } {
  if (!iso) return { date: '', time: '' }
  const d = new Date(iso)
  const date = d.toLocaleDateString('sv') // 'sv' = YYYY-MM-DD
  const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  return { date, time }
}

// ─────────────────────────────────────────────
// FORMULÁRIO VAZIO
// ─────────────────────────────────────────────
const FORM_VAZIO = {
  nome: '',
  descricao: '',
  foto_url: '',
  preco_de: '',
  preco_por: '',
  recorrente: false,
  dias_semana: [] as number[],
  hora_inicio: '18:00',
  hora_fim: '20:00',
  inicio_date: '',
  inicio_time: '18:00',
  fim_date: '',
  fim_time: '23:00',
  alerta_minutos: 30,
}

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export default function PromocoesTab({ estabelecimentoId, readOnly }: PromocoesTabProps) {
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  // dados
  const [itens, setItens]           = useState<ItemCardapio[]>([])
  const [offers, setOffers]         = useState<SpecialOffer[]>([])
  const [loading, setLoading]       = useState(true)
  const [erro, setErro]             = useState<string | null>(null)
  const [toast, setToast]           = useState<string | null>(null)
  const [salvando, setSalvando]     = useState(false)

  // modal promoção de item (configurar desconto)
  const [modalItem, setModalItem]   = useState<ItemCardapio | null>(null)
  const [tipoDesc, setTipoDesc]     = useState<'pct' | 'fixed'>('pct')
  const [descValor, setDescValor]   = useState('20')
  const [iInicio, setIInicio]       = useState({ date: '', time: '' })
  const [iFim, setIFim]             = useState({ date: '', time: '' })

  // modal promoção avulsa
  const [modalOffer, setModalOffer] = useState<SpecialOffer | null | 'novo'>(null)
  const [form, setForm]             = useState({ ...FORM_VAZIO })

  // ── CARREGAR ──────────────────────────────
  const carregar = useCallback(async () => {
    setLoading(true)

    // itens com promoção
    const { data: menus } = await supabase
      .from('menus')
      .select('id')
      .eq('estabelecimento_id', estabelecimentoId)
      .order('created_at', { ascending: true })
      .limit(1)

    const menuId = menus?.[0]?.id
    if (menuId) {
      const { data: cats } = await supabase
        .from('categorias').select('id').eq('menu_id', menuId)
      const catIds = (cats || []).map((c: any) => c.id)
      if (catIds.length) {
        const { data } = await supabase
          .from('itens_cardapio')
          .select('id, nome, preco, codigo, foto_url, promo_status, preco_promocional, promo_desconto_pct, promo_inicio, promo_fim')
          .in('categoria_id', catIds)
          .not('promo_status', 'in', '("none",null)')
          .order('nome')
        setItens((data as ItemCardapio[]) || [])
      }
    }

    // promoções avulsas
    const { data: offData } = await supabase
      .from('special_offers')
      .select('*')
      .eq('estabelecimento_id', estabelecimentoId)
      .order('created_at', { ascending: false })
    setOffers((offData as SpecialOffer[]) || [])

    setLoading(false)
  }, [estabelecimentoId, supabase])

  useEffect(() => { carregar() }, [carregar])

  function toast_(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(null), 3500)
  }

  // ── ITEM: configurar desconto ─────────────
  function abrirItem(item: ItemCardapio) {
    setModalItem(item)
    setTipoDesc('pct')
    setDescValor(item.promo_desconto_pct?.toString() || '20')
    setIInicio(fromISO(item.promo_inicio))
    setIFim(fromISO(item.promo_fim))
  }

  async function salvarItem() {
    if (!modalItem) return
    const val = parseFloat(descValor.replace(',', '.'))
    if (isNaN(val) || val <= 0) { setErro('Desconto inválido.'); return }

    const precoPromo = tipoDesc === 'pct'
      ? parseFloat((modalItem.preco * (1 - val / 100)).toFixed(2))
      : parseFloat((modalItem.preco - val).toFixed(2))
    if (precoPromo <= 0) { setErro('Preço promocional inválido.'); return }

    setSalvando(true)
    const { error } = await supabase
      .from('itens_cardapio')
      .update({
        promo_status: 'active',
        preco_promocional: precoPromo,
        promo_desconto_pct: tipoDesc === 'pct' ? val : null,
        promo_inicio: toISOLocal(iInicio.date, iInicio.time),
        promo_fim:    toISOLocal(iFim.date,    iFim.time),
      })
      .eq('id', modalItem.id)

    setSalvando(false)
    if (error) { setErro('Erro: ' + error.message); return }
    setModalItem(null)
    toast_('✅ Promoção ativada')
    carregar()
  }

  async function pausarItem(item: ItemCardapio) {
    await supabase.from('itens_cardapio')
      .update({ promo_status: item.promo_status === 'paused' ? 'active' : 'paused' })
      .eq('id', item.id)
    carregar()
  }

  async function removerItem(item: ItemCardapio) {
    if (!confirm('Remover promoção deste item?')) return
    await supabase.from('itens_cardapio')
      .update({ promo_status: 'none', preco_promocional: null, promo_desconto_pct: null, promo_inicio: null, promo_fim: null })
      .eq('id', item.id)
    toast_('Promoção removida')
    carregar()
  }

  // ── OFFER: abrir formulário ───────────────
  function abrirNovaOffer() {
    setForm({ ...FORM_VAZIO })
    setModalOffer('novo')
    setErro(null)
  }

  function abrirEditarOffer(o: SpecialOffer) {
    const ini = fromISO(o.inicio_em)
    const fim = fromISO(o.fim_em)
    setForm({
      nome: o.nome,
      descricao: o.descricao || '',
      foto_url: o.foto_url || '',
      preco_de: o.preco_de?.toString() || '',
      preco_por: o.preco_por?.toString() || '',
      recorrente: o.recorrente,
      dias_semana: o.dias_semana || [],
      hora_inicio: o.hora_inicio || '18:00',
      hora_fim: o.hora_fim || '20:00',
      inicio_date: ini.date,
      inicio_time: ini.time || '18:00',
      fim_date: fim.date,
      fim_time: fim.time || '23:00',
      alerta_minutos: o.alerta_minutos || 30,
    })
    setModalOffer(o)
    setErro(null)
  }

  function updForm(partial: Partial<typeof FORM_VAZIO>) {
    setForm(prev => ({ ...prev, ...partial }))
  }

  function toggleDia(d: number) {
    setForm(prev => ({
      ...prev,
      dias_semana: prev.dias_semana.includes(d)
        ? prev.dias_semana.filter(x => x !== d)
        : [...prev.dias_semana, d],
    }))
  }

  async function salvarOffer() {
    if (!form.nome.trim()) { setErro('Nome é obrigatório.'); return }
    const precoPor = parseFloat(form.preco_por.replace(',', '.'))
    if (isNaN(precoPor) || precoPor <= 0) { setErro('Preço é obrigatório.'); return }
    if (form.recorrente && form.dias_semana.length === 0) {
      setErro('Selecione pelo menos um dia da semana.'); return
    }

    setSalvando(true)
    setErro(null)

    const payload: any = {
      estabelecimento_id: estabelecimentoId,
      nome: form.nome.trim(),
      descricao: form.descricao.trim() || null,
      foto_url: form.foto_url || null,
      preco_de: form.preco_de ? parseFloat(form.preco_de.replace(',', '.')) : null,
      preco_por: precoPor,
      recorrente: form.recorrente,
      dias_semana: form.recorrente ? form.dias_semana : [],
      hora_inicio: form.recorrente ? form.hora_inicio : null,
      hora_fim:    form.recorrente ? form.hora_fim    : null,
      inicio_em: !form.recorrente ? toISOLocal(form.inicio_date, form.inicio_time) : null,
      fim_em:    !form.recorrente ? toISOLocal(form.fim_date,    form.fim_time)    : null,
      alerta_minutos: form.alerta_minutos,
      ativo: true,
    }

    let error: any
    if (modalOffer === 'novo') {
      ;({ error } = await supabase.from('special_offers').insert(payload))
    } else {
      ;({ error } = await supabase.from('special_offers')
        .update(payload).eq('id', (modalOffer as SpecialOffer).id))
    }

    setSalvando(false)
    if (error) { setErro('Erro ao salvar: ' + error.message); return }
    setModalOffer(null)
    toast_(modalOffer === 'novo' ? '✅ Promoção avulsa criada!' : '✅ Promoção atualizada')
    carregar()
  }

  async function toggleOffer(o: SpecialOffer) {
    await supabase.from('special_offers').update({ ativo: !o.ativo }).eq('id', o.id)
    carregar()
  }

  async function deletarOffer(o: SpecialOffer) {
    if (!confirm(`Excluir "${o.nome}"?`)) return
    await supabase.from('special_offers').delete().eq('id', o.id)
    toast_('Promoção excluída')
    carregar()
  }

  // ── cálculo ao vivo ───────────────────────
  const precoBase     = modalItem?.preco || 0
  const descNum       = parseFloat(descValor.replace(',', '.')) || 0
  const precoComDesc  = tipoDesc === 'pct'
    ? precoBase * (1 - descNum / 100)
    : precoBase - descNum

  // grupos de itens
  const pendentes = itens.filter(i => i.promo_status === 'pending')
  const ativas    = itens.filter(i => i.promo_status === 'active')
  const pausadas  = itens.filter(i => i.promo_status === 'paused')

  // grupos de offers
  const offersAtivas    = offers.filter(o => o.ativo && statusOffer(o) !== 'encerrada')
  const offersEncerradas = offers.filter(o => !o.ativo || statusOffer(o) === 'encerrada')

  if (loading) return (
    <div className="flex items-center justify-center py-16 text-gray-400">
      <div className="animate-spin w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full mr-3" />
      Carregando promoções...
    </div>
  )

  return (
    <div className="space-y-6">

      {/* TOAST */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-xl">
          {toast}
        </div>
      )}

      {/* ERRO */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
          {erro}
          <button onClick={() => setErro(null)} className="ml-4 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* SUMÁRIO */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SumCard num={pendentes.length}      label="Pendentes"        cor={pendentes.length > 0 ? 'yellow' : 'gray'} />
        <SumCard num={ativas.length}         label="Itens ativos"     cor={ativas.length > 0 ? 'green' : 'gray'} />
        <SumCard num={pausadas.length}       label="Pausados"         cor="gray" />
        <SumCard num={offersAtivas.length}   label="Promoções avulsas" cor={offersAtivas.length > 0 ? 'orange' : 'gray'} />
      </div>

      {/* ══════════════════════════════════════
          SEÇÃO 1: PROMOÇÕES AVULSAS
      ══════════════════════════════════════ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-base font-semibold text-gray-800">Promoções avulsas</h2>
            <p className="text-xs text-gray-400 mt-0.5">Sem categoria, sem estar no cardápio fixo. Aparecem no topo do cardápio público durante o período ativo.</p>
          </div>
          {!readOnly && (
            <button
              onClick={abrirNovaOffer}
              className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
            >
              <span className="text-base leading-none">+</span> Nova promoção
            </button>
          )}
        </div>

        {offersAtivas.length === 0 && offersEncerradas.length === 0 ? (
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center text-gray-400">
            <p className="text-3xl mb-2">🏷️</p>
            <p className="font-medium">Nenhuma promoção avulsa</p>
            <p className="text-sm">Crie promoções de happy hour, combos e ofertas especiais com horário definido</p>
          </div>
        ) : (
          <div className="space-y-3">
            {offersAtivas.map(o => <OfferRow key={o.id} o={o} readOnly={!!readOnly}
              onEditar={() => abrirEditarOffer(o)}
              onToggle={() => toggleOffer(o)}
              onDeletar={() => deletarOffer(o)} />)}
            {offersEncerradas.length > 0 && (
              <details className="mt-2">
                <summary className="text-xs text-gray-400 cursor-pointer select-none py-1">
                  {offersEncerradas.length} promoção(ões) encerrada(s) ou desativada(s)
                </summary>
                <div className="mt-2 space-y-2">
                  {offersEncerradas.map(o => <OfferRow key={o.id} o={o} readOnly={!!readOnly}
                    onEditar={() => abrirEditarOffer(o)}
                    onToggle={() => toggleOffer(o)}
                    onDeletar={() => deletarOffer(o)} />)}
                </div>
              </details>
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          SEÇÃO 2: ITENS DO CARDÁPIO COM PROMOÇÃO
      ══════════════════════════════════════ */}
      <div>
        <h2 className="text-base font-semibold text-gray-800 mb-1">Itens do cardápio em promoção</h2>
        <p className="text-xs text-gray-400 mb-3">Itens marcados com 🏷️ na aba Cardápio.</p>

        {itens.length === 0 ? (
          <div className="border border-gray-200 rounded-xl p-6 text-center text-gray-400 text-sm">
            Nenhum item marcado como promoção. Use o ícone 🏷️ na aba Cardápio.
          </div>
        ) : (
          <div className="space-y-3">
            {pendentes.length > 0 && (
              <GrupoItens titulo="Pendentes — aguardando configuração"
                hint="Marcados mas sem desconto definido. Não aparecem para o cliente."
                cor="yellow" itens={pendentes} readOnly={!!readOnly}
                onConfigurar={abrirItem} onPausar={pausarItem} onRemover={removerItem} />
            )}
            {ativas.length > 0 && (
              <GrupoItens titulo="Ativos no cardápio" cor="green" itens={ativas}
                readOnly={!!readOnly}
                onConfigurar={abrirItem} onPausar={pausarItem} onRemover={removerItem} />
            )}
            {pausadas.length > 0 && (
              <GrupoItens titulo="Pausados" cor="gray" itens={pausadas}
                readOnly={!!readOnly}
                onConfigurar={abrirItem} onPausar={pausarItem} onRemover={removerItem} />
            )}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════
          MODAL: CONFIGURAR DESCONTO DE ITEM
      ══════════════════════════════════════ */}
      {modalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <h2 className="font-semibold text-gray-900">Configurar promoção</h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {modalItem.codigo ? `#${modalItem.codigo} · ` : ''}{modalItem.nome}
                </p>
              </div>
              <button onClick={() => setModalItem(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 flex items-center justify-center">✕</button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* tipo */}
              <div className="flex gap-2">
                {(['pct', 'fixed'] as const).map(t => (
                  <button key={t} onClick={() => setTipoDesc(t)}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition ${
                      tipoDesc === t ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    {t === 'pct' ? '% Percentual' : 'R$ Valor fixo'}
                  </button>
                ))}
              </div>

              {/* atalhos */}
              {tipoDesc === 'pct' && (
                <div className="flex gap-2">
                  {[10, 15, 20, 30, 50].map(p => (
                    <button key={p} onClick={() => setDescValor(p.toString())}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition ${
                        descValor === p.toString() ? 'bg-orange-100 border-orange-400 text-orange-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                      {p}%
                    </button>
                  ))}
                </div>
              )}

              {/* valor + comparação */}
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <input value={descValor} onChange={e => setDescValor(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="0" />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    {tipoDesc === 'pct' ? '%' : 'R$'}
                  </span>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-400 line-through">R$ {fmt(precoBase)}</div>
                  <div className="text-lg font-bold text-orange-600">
                    R$ {fmt(Math.max(0, precoComDesc))}
                  </div>
                </div>
              </div>

              {/* horário de início e fim com data + hora */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Período da promoção <span className="text-gray-400 font-normal">(data e hora)</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Início</p>
                    <input type="date" value={iInicio.date}
                      onChange={e => setIInicio(p => ({ ...p, date: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-1" />
                    <input type="time" value={iInicio.time}
                      onChange={e => setIInicio(p => ({ ...p, time: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Fim <span className="text-gray-400">(opcional)</span></p>
                    <input type="date" value={iFim.date}
                      onChange={e => setIFim(p => ({ ...p, date: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-1" />
                    <input type="time" value={iFim.time}
                      onChange={e => setIFim(p => ({ ...p, time: e.target.value }))}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                  </div>
                </div>
                {iFim.date && iFim.time && (
                  <p className="text-xs text-orange-600 mt-1.5">
                    ⏰ Desativa automaticamente em {iFim.date.split('-').reverse().join('/')} às {iFim.time}h
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
              <button onClick={() => setModalItem(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={salvarItem} disabled={salvando || precoComDesc <= 0}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition flex items-center justify-center gap-2">
                {salvando ? <><Spin />Ativando…</> : '🔥 Ativar promoção'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════
          MODAL: CRIAR / EDITAR PROMOÇÃO AVULSA
      ══════════════════════════════════════ */}
      {modalOffer !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[92vh] flex flex-col">

            {/* header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
              <div>
                <h2 className="font-semibold text-gray-900 text-lg">
                  {modalOffer === 'novo' ? 'Nova promoção avulsa' : 'Editar promoção'}
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Aparece no carrossel do topo do cardápio durante o período ativo
                </p>
              </div>
              <button onClick={() => setModalOffer(null)}
                className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 flex items-center justify-center text-lg">✕</button>
            </div>

            {/* corpo */}
            <div className="overflow-y-auto px-6 py-4 space-y-4 flex-1">

              {erro && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{erro}</div>
              )}

              {/* foto */}
              <ImageUpload
                onUpload={url => updForm({ foto_url: url })}
                onRemove={() => updForm({ foto_url: '' })}
                currentImage={form.foto_url || null}
                label="Foto da promoção (opcional)"
                aspectRatio="16:9"
                maxSize={3}
              />

              {/* nome */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Nome da promoção <span className="text-red-400">*</span>
                </label>
                <input value={form.nome} onChange={e => updForm({ nome: e.target.value })}
                  placeholder="ex: Happy hour — Chopp duplo, Combo Petisco + Bebida"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900" />
              </div>

              {/* descrição */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
                <textarea value={form.descricao}
                  onChange={e => updForm({ descricao: e.target.value })}
                  placeholder="ex: 2 choppas 600ml por R$15. Disponível apenas na área do bar."
                  rows={2}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900" />
              </div>

              {/* preços */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Preço de <span className="text-gray-400">(riscado, opcional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">R$</span>
                    <input value={form.preco_de} onChange={e => updForm({ preco_de: e.target.value })}
                      placeholder="0,00"
                      className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Preço por <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">R$</span>
                    <input value={form.preco_por} onChange={e => updForm({ preco_por: e.target.value })}
                      placeholder="0,00"
                      className="w-full border border-gray-200 rounded-lg pl-8 pr-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900" />
                  </div>
                </div>
              </div>

              {/* preview de preço */}
              {form.preco_por && (
                <div className="flex items-center gap-3 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
                  {form.preco_de && (
                    <span className="text-sm text-gray-400 line-through">R$ {form.preco_de}</span>
                  )}
                  <span className="text-xl font-bold text-orange-600">R$ {form.preco_por}</span>
                  {form.preco_de && parseFloat(form.preco_por) > 0 && parseFloat(form.preco_de) > 0 && (
                    <span className="ml-auto text-xs font-semibold bg-orange-600 text-white px-2 py-1 rounded-full">
                      -{Math.round((1 - parseFloat(form.preco_por.replace(',','.')) / parseFloat(form.preco_de.replace(',','.'))) * 100)}% off
                    </span>
                  )}
                </div>
              )}

              {/* tipo de vigência */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">Tipo de vigência</label>
                <div className="flex gap-2">
                  <button onClick={() => updForm({ recorrente: false })}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition ${
                      !form.recorrente ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    📅 Pontual
                    <span className="block text-xs font-normal opacity-70 mt-0.5">data e hora específicas</span>
                  </button>
                  <button onClick={() => updForm({ recorrente: true })}
                    className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition ${
                      form.recorrente ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                    🔁 Recorrente
                    <span className="block text-xs font-normal opacity-70 mt-0.5">repete toda semana</span>
                  </button>
                </div>
              </div>

              {/* vigência PONTUAL */}
              {!form.recorrente && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Período</label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Início</p>
                      <input type="date" value={form.inicio_date}
                        onChange={e => updForm({ inicio_date: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-1" />
                      <input type="time" value={form.inicio_time}
                        onChange={e => updForm({ inicio_time: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Fim <span className="text-gray-400">(opcional)</span></p>
                      <input type="date" value={form.fim_date}
                        onChange={e => updForm({ fim_date: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 mb-1" />
                      <input type="time" value={form.fim_time}
                        onChange={e => updForm({ fim_time: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                  </div>
                  {form.fim_date && form.fim_time && (
                    <p className="text-xs text-orange-600 mt-1.5">
                      ⏰ Desativa em {form.fim_date.split('-').reverse().join('/')} às {form.fim_time}h
                    </p>
                  )}
                </div>
              )}

              {/* vigência RECORRENTE */}
              {form.recorrente && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-2">Dias da semana</label>
                    <div className="flex gap-1.5">
                      {DIAS.map((d, i) => (
                        <button key={i} onClick={() => toggleDia(i)}
                          className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${
                            form.dias_semana.includes(i)
                              ? 'bg-orange-100 border-orange-400 text-orange-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                          {d}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Horário início</label>
                      <input type="time" value={form.hora_inicio}
                        onChange={e => updForm({ hora_inicio: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Horário fim</label>
                      <input type="time" value={form.hora_fim}
                        onChange={e => updForm({ hora_fim: e.target.value })}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
                    </div>
                  </div>
                  {form.hora_inicio && form.hora_fim && form.dias_semana.length > 0 && (
                    <p className="text-xs text-gray-500 bg-gray-50 rounded-lg px-3 py-2">
                      🔁 Ativa {form.dias_semana.map(d => DIAS[d]).join(', ')} das {form.hora_inicio}h às {form.hora_fim}h
                    </p>
                  )}
                </div>
              )}

              {/* alerta de encerramento */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2">
                  Alerta de encerramento
                  <span className="text-gray-400 font-normal ml-1">— avisa o cliente no cardápio</span>
                </label>
                <div className="flex gap-2">
                  {[15, 30, 45, 60].map(m => (
                    <button key={m} onClick={() => updForm({ alerta_minutos: m })}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${
                        form.alerta_minutos === m
                          ? 'bg-orange-100 border-orange-400 text-orange-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
                      {m}min
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  O cardápio mostrará um alerta quando faltarem {form.alerta_minutos} minutos para encerrar
                </p>
              </div>

            </div>

            {/* footer */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
              <button onClick={() => setModalOffer(null)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
                Cancelar
              </button>
              <button onClick={salvarOffer} disabled={salvando}
                className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition flex items-center justify-center gap-2">
                {salvando ? <><Spin />Salvando…</> : modalOffer === 'novo' ? '✓ Criar promoção' : '✓ Salvar alterações'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ─────────────────────────────────────────────
// ROW DE PROMOÇÃO AVULSA
// ─────────────────────────────────────────────
function OfferRow({ o, readOnly, onEditar, onToggle, onDeletar }: {
  o: SpecialOffer; readOnly: boolean
  onEditar: () => void; onToggle: () => void; onDeletar: () => void
}) {
  const fmt = (v: number) => v?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const st = statusOffer(o)
  const stCls = {
    ativa:     'bg-green-100 text-green-700',
    agendada:  'bg-blue-100 text-blue-700',
    encerrada: 'bg-gray-100 text-gray-500',
    sem_data:  'bg-orange-100 text-orange-700',
  }[st]
  const stLabel = { ativa: 'Ativa', agendada: 'Agendada', encerrada: 'Encerrada', sem_data: 'Sempre ativa' }[st]

  const DIAS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

  return (
    <div className={`flex items-center gap-3 p-3 rounded-xl border transition ${!o.ativo ? 'opacity-50 bg-gray-50 border-gray-200' : 'bg-white border-gray-200 hover:border-gray-300'}`}>
      {/* thumb */}
      <div className="w-14 h-14 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-100 flex items-center justify-center">
        {o.foto_url ? <img src={o.foto_url} alt={o.nome} className="w-full h-full object-cover" /> : <span className="text-2xl">🏷️</span>}
      </div>

      {/* info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-gray-800 truncate">{o.nome}</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${stCls}`}>{stLabel}</span>
        </div>
        {o.descricao && <p className="text-xs text-gray-400 truncate mt-0.5">{o.descricao}</p>}
        <div className="flex items-center gap-3 mt-1 flex-wrap">
          <div className="flex items-baseline gap-1.5">
            {o.preco_de && <span className="text-xs text-gray-400 line-through">R$ {fmt(o.preco_de)}</span>}
            <span className="text-sm font-bold text-orange-600">R$ {fmt(o.preco_por)}</span>
          </div>
          <span className="text-xs text-gray-400">
            {o.recorrente
              ? `🔁 ${o.dias_semana?.map(d => DIAS[d]).join(', ')} · ${o.hora_inicio}–${o.hora_fim}`
              : o.inicio_em
                ? `📅 ${new Date(o.inicio_em).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}${o.fim_em ? ` → ${new Date(o.fim_em).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}` : ''}`
                : 'Sem data definida'
            }
          </span>
        </div>
      </div>

      {/* ações */}
      {!readOnly && (
        <div className="flex gap-1 flex-shrink-0">
          <button onClick={onEditar} title="Editar"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-500 hover:bg-gray-100 transition">✏️</button>
          <button onClick={onToggle} title={o.ativo ? 'Desativar' : 'Ativar'}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${o.ativo ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-100'}`}>
            {o.ativo ? '✅' : '⏸'}
          </button>
          <button onClick={onDeletar} title="Excluir"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 transition">🗑️</button>
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// GRUPO DE ITENS DO CARDÁPIO
// ─────────────────────────────────────────────
function GrupoItens({ titulo, hint, cor, itens, readOnly, onConfigurar, onPausar, onRemover }: {
  titulo: string; hint?: string; cor: 'yellow' | 'green' | 'gray'
  itens: ItemCardapio[]; readOnly: boolean
  onConfigurar: (i: ItemCardapio) => void
  onPausar: (i: ItemCardapio) => void
  onRemover: (i: ItemCardapio) => void
}) {
  const fmt = (v: number) => v?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const bdr = { yellow: 'border-yellow-200', green: 'border-green-200', gray: 'border-gray-200' }[cor]
  const hbg = { yellow: 'bg-yellow-50', green: 'bg-green-50', gray: 'bg-gray-50' }[cor]
  return (
    <div className={`border ${bdr} rounded-xl overflow-hidden`}>
      <div className={`${hbg} px-4 py-3 border-b ${bdr}`}>
        <h3 className="text-sm font-semibold text-gray-800">{titulo} <span className="text-gray-400 font-normal">({itens.length})</span></h3>
        {hint && <p className="text-xs text-gray-500 mt-0.5">{hint}</p>}
      </div>
      <div className="divide-y divide-gray-100">
        {itens.map(item => {
          const pausado = item.promo_status === 'paused'
          const fimIso = item.promo_fim
          const fimLabel = fimIso
            ? new Date(fimIso).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })
            : null
          return (
            <div key={item.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition ${pausado ? 'opacity-55' : ''}`}>
              <div className="w-10 h-10 rounded-lg border border-gray-200 flex-shrink-0 bg-gray-100 flex items-center justify-center overflow-hidden">
                {item.foto_url ? <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover" /> : '🍽️'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  {item.codigo && <span className="font-mono text-xs text-gray-400">#{item.codigo}</span>}
                  <span className="text-sm font-medium text-gray-800 truncate">{item.nome}</span>
                </div>
                <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                  {item.promo_desconto_pct ? `-${item.promo_desconto_pct}% · ` : ''}
                  {fimLabel && <span className="text-orange-600">⏰ até {fimLabel}</span>}
                  {!fimLabel && item.promo_inicio && <span>a partir de {new Date(item.promo_inicio).toLocaleString('pt-BR', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' })}</span>}
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                {item.preco_promocional ? (
                  <>
                    <div className="text-xs text-gray-400 line-through">R$ {fmt(item.preco)}</div>
                    <div className="text-sm font-bold text-orange-600">R$ {fmt(item.preco_promocional)}</div>
                  </>
                ) : (
                  <div className="text-sm font-bold text-gray-800">R$ {fmt(item.preco)}</div>
                )}
              </div>
              {!readOnly && (
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => onConfigurar(item)} title="Configurar"
                    className="w-8 h-8 rounded-lg text-gray-500 hover:bg-gray-100 flex items-center justify-center transition">✏️</button>
                  <button onClick={() => onPausar(item)} title={pausado ? 'Retomar' : 'Pausar'}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition ${pausado ? 'text-green-600 bg-green-50 hover:bg-green-100' : 'text-gray-400 hover:bg-gray-100'}`}>
                    {pausado ? '▶️' : '⏸'}
                  </button>
                  <button onClick={() => onRemover(item)} title="Remover"
                    className="w-8 h-8 rounded-lg text-red-400 hover:bg-red-50 flex items-center justify-center transition">🗑️</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// UTILITÁRIOS VISUAIS
// ─────────────────────────────────────────────
function SumCard({ num, label, cor }: { num: number; label: string; cor: 'yellow' | 'green' | 'orange' | 'gray' }) {
  const cls = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    green:  'bg-green-50 border-green-200 text-green-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    gray:   'bg-gray-50 border-gray-200 text-gray-600',
  }[cor]
  return (
    <div className={`border rounded-xl px-4 py-3 ${cls}`}>
      <div className="text-2xl font-bold">{num}</div>
      <div className="text-xs mt-0.5 leading-snug">{label}</div>
    </div>
  )
}

function Spin() {
  return <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
}
