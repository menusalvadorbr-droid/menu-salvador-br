'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logSupabaseError } from '@/lib/supabase/logError'
import ImageUpload from '@/app/(dashboard)/painel/components/ImageUpload'

// ─────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────
interface Categoria {
  id: string
  nome: string
  menu_id: string
  ordem: number
}

interface ItemCardapio {
  id: string
  nome: string
  descricao: string | null
  preco: number
  categoria_id: string
  disponivel: boolean
  codigo: string | null
  foto_url: string | null
  promo_status: 'none' | 'pending' | 'active' | 'paused' | null
  preco_promocional: number | null
  promo_desconto_pct: number | null
  promo_inicio: string | null
  promo_fim: string | null
  delivery_disponivel: boolean
  ordem: number
}

interface Alergeno {
  id: string
  nome: string
  icone: string
}

interface CardapioTabProps {
  estabelecimentoId: string
  readOnly?: boolean
}

// ─────────────────────────────────────────────
// ALERGENOS FALLBACK (ANVISA RDC 26/2015)
// ─────────────────────────────────────────────
const ALERGENOS_FALLBACK: Alergeno[] = [
  { id: 'gluten',     nome: 'Glúten',      icone: '🌾' },
  { id: 'crustaceos', nome: 'Crustáceos',  icone: '🦐' },
  { id: 'ovo',        nome: 'Ovo',         icone: '🥚' },
  { id: 'peixe',      nome: 'Peixe',       icone: '🐟' },
  { id: 'amendoim',   nome: 'Amendoim',    icone: '🥜' },
  { id: 'nozes',      nome: 'Nozes',       icone: '🌰' },
  { id: 'soja',       nome: 'Soja',        icone: '🫘' },
  { id: 'leite',      nome: 'Leite',       icone: '🥛' },
  { id: 'aipo',       nome: 'Aipo',        icone: '🥬' },
  { id: 'mostarda',   nome: 'Mostarda',    icone: '🟡' },
  { id: 'sesamo',     nome: 'Sésamo',      icone: '⚪' },
  { id: 'sulfitos',   nome: 'Sulfitos',    icone: '🍷' },
  { id: 'tremoco',    nome: 'Tremoço',     icone: '🫛' },
  { id: 'moluscos',   nome: 'Moluscos',    icone: '🐚' },
]

// ─────────────────────────────────────────────
// COMPONENTE PRINCIPAL
// ─────────────────────────────────────────────
export default function CardapioTab({ estabelecimentoId, readOnly }: CardapioTabProps) {
  // FIX: cliente estabilizado com useRef para não recriar a cada render
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [menuId, setMenuId]         = useState<string | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [itens, setItens]           = useState<ItemCardapio[]>([])
  const [alergenos, setAlergenos]   = useState<Alergeno[]>([])
  const [loading, setLoading]       = useState(true)
  const [erro, setErro]             = useState<string | null>(null)

  // UI – nova categoria
  const [novaCategoria, setNovaCategoria]       = useState('')
  const [criandoCategoria, setCriandoCategoria] = useState(false)
  const [erroCategoria, setErroCategoria]       = useState<string | null>(null)

  // UI – modal de edição
  const [modalAberto, setModalAberto]   = useState(false)
  const [itemEditando, setItemEditando] = useState<ItemCardapio | null>(null)
  const [fotoUrl, setFotoUrl]           = useState('')
  const [alergenosSel, setAlergenosSel] = useState<string[]>([])
  const [salvando, setSalvando]         = useState(false)

  // campos do formulário
  const [fNome, setFNome]           = useState('')
  const [fDesc, setFDesc]           = useState('')
  const [fPreco, setFPreco]         = useState('')
  const [fCodigo, setFCodigo]       = useState('')
  const [fCatId, setFCatId]         = useState('')
  const [fDisponivel, setFDisponivel] = useState(true)
  const [fDelivery, setFDelivery]   = useState(false)
  // estados de promoção no modal
  const [fPromo, setFPromo]             = useState(false)
  const [fPromoDesc, setFPromoDesc]     = useState('')
  const [fPromoTipo, setFPromoTipo]     = useState<'pct'|'fixed'>('pct')
  const [fPromoInicio, setFPromoInicio] = useState('')
  const [fPromoFim, setFPromoFim]       = useState('')

  // ── CARREGAR ──────────────────────────────
  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)

    try {
      // 1. Buscar menu ativo (sem tentar criar — deixar o servidor criar se necessário)
      let mid: string | null = null

      // FIX PGRST116: múltiplos menus retornados — usar .limit(1) + data[0]
      // em vez de .maybeSingle() / .single() que exigem exatamente 1 linha.
      // Também removemos o filtro .eq('ativo', true) pois a coluna pode não
      // existir no banco — pegamos o menu mais antigo do estabelecimento.
      const { data: menus, error: menuErr } = await supabase
        .from('menus')
        .select('id')
        .eq('estabelecimento_id', estabelecimentoId)
        .order('created_at', { ascending: true })
        .limit(1)

      if (menuErr) {
        logSupabaseError('Erro ao buscar menu', menuErr)
        setErro('Erro ao carregar menu: ' + menuErr.message)
        setLoading(false)
        return
      }

      const menuExistente = menus && menus.length > 0 ? menus[0] : null

      if (menuExistente) {
        mid = menuExistente.id
      } else {
        // Criar menu apenas se não existe nenhum para este estabelecimento
        const { data: novosMenus, error: createErr } = await supabase
          .from('menus')
          .insert({
            estabelecimento_id: estabelecimentoId,
            nome: 'Cardápio Principal',
            ativo: true,
          })
          .select('id')

        if (createErr) {
          logSupabaseError('Erro ao criar menu', createErr)
          setErro('Erro ao criar menu: ' + createErr.message)
          setLoading(false)
          return
        }
        mid = (novosMenus && novosMenus.length > 0) ? novosMenus[0].id : null
      }

      setMenuId(mid)

      if (!mid) {
        setLoading(false)
        return
      }

      // 2. Categorias
      const { data: cats, error: catsErr } = await supabase
        .from('categorias')
        .select('*')
        .eq('menu_id', mid)
        .order('ordem', { ascending: true })

      if (catsErr) {
        logSupabaseError('Erro ao buscar categorias', catsErr)
        setErro('Erro ao carregar categorias: ' + catsErr.message)
        setLoading(false)
        return
      }

      setCategorias(cats || [])

      // 3. Itens
      if (cats && cats.length > 0) {
        const ids = cats.map((c: Categoria) => c.id)
        const { data: items, error: itemsErr } = await supabase
          .from('itens_cardapio')
          .select('*')
          .in('categoria_id', ids)
          .order('ordem', { ascending: true })

        if (itemsErr) {
          logSupabaseError('Erro ao buscar itens', itemsErr)
        } else {
          setItens((items as ItemCardapio[]) || [])
        }
      } else {
        setItens([])
      }

      // 4. Alergenos
      const { data: algs } = await supabase
        .from('allergens')
        .select('*')
        .order('nome', { ascending: true })
      setAlergenos(algs?.length ? algs : ALERGENOS_FALLBACK)

    } catch (e: any) {
      setErro('Erro inesperado: ' + e.message)
    } finally {
      setLoading(false)
    }
  }, [estabelecimentoId, supabase])

  useEffect(() => { carregar() }, [carregar])

  // ── CRIAR CATEGORIA ──────────────────────
  async function criarCategoria() {
    const nome = novaCategoria.trim()
    if (!nome) return
    if (!menuId) {
      setErroCategoria('Menu não carregado ainda. Aguarde.')
      return
    }

    setCriandoCategoria(true)
    setErroCategoria(null)

    const { error } = await supabase
      .from('categorias')
      .insert({
        nome,
        menu_id: menuId,
        ordem: categorias.length,
      })

    if (error) {
      logSupabaseError('Erro ao criar categoria', error)
      setErroCategoria('Erro ao criar: ' + error.message)
    } else {
      setNovaCategoria('')
      await carregar()
    }
    setCriandoCategoria(false)
  }

  async function deletarCategoria(id: string) {
    if (!confirm('Remover esta categoria e todos os seus itens?')) return
    await supabase.from('categorias').delete().eq('id', id)
    carregar()
  }

  // ── ABRIR MODAL ──────────────────────────
  async function abrirModal(item?: ItemCardapio) {
    setItemEditando(item || null)
    setFNome(item?.nome || '')
    setFDesc(item?.descricao || '')
    setFPreco(item?.preco?.toString().replace('.', ',') || '')
    setFCodigo(item?.codigo || '')
    setFCatId(item?.categoria_id || (categorias[0]?.id ?? ''))
    setFDisponivel(item?.disponivel !== false)
    setFDelivery(item?.delivery_disponivel || false)
    setFotoUrl(item?.foto_url || '')
    setErro(null)
    // promoção
    const temPromoModal = item?.promo_status && item.promo_status !== 'none'
    setFPromo(!!temPromoModal)
    setFPromoDesc(item?.promo_desconto_pct?.toString() || '20')
    setFPromoTipo('pct')
    setFPromoInicio(item?.promo_inicio || '')
    setFPromoFim(item?.promo_fim || '')

    if (item?.id) {
      const { data } = await supabase
        .from('item_allergens')
        .select('allergen_id')
        .eq('item_id', item.id)
      setAlergenosSel(data?.map((a: any) => a.allergen_id) || [])
    } else {
      setAlergenosSel([])
    }
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setItemEditando(null)
    setErro(null)
  }

  // ── SALVAR ITEM ───────────────────────────
  async function salvarItem() {
    if (!fNome.trim()) { setErro('Nome é obrigatório.'); return }
    if (!fCatId)       { setErro('Selecione uma categoria.'); return }

    const precoStr = fPreco.replace(',', '.')
    const precoNum = parseFloat(precoStr)
    if (isNaN(precoNum) || precoNum < 0) { setErro('Preço inválido.'); return }

    setSalvando(true)
    setErro(null)

    // calcular promoção
    const descNum = parseFloat(fPromoDesc.replace(',', '.')) || 0
    let precoPromo: number | null = null
    let descPct: number | null = null
    if (fPromo && descNum > 0) {
      precoPromo = fPromoTipo === 'pct'
        ? parseFloat((precoNum * (1 - descNum / 100)).toFixed(2))
        : parseFloat((precoNum - descNum).toFixed(2))
      if (precoPromo <= 0) { setErro('Preço promocional inválido.'); setSalvando(false); return }
      descPct = fPromoTipo === 'pct' ? descNum : null
    }

    const dados = {
      nome: fNome.trim(),
      descricao: fDesc.trim() || null,
      preco: precoNum,
      categoria_id: fCatId,
      disponivel: fDisponivel,
      codigo: fCodigo.trim() || null,
      foto_url: fotoUrl || null,
      delivery_disponivel: fDelivery,
      ordem: itemEditando?.ordem ?? itens.filter(i => i.categoria_id === fCatId).length,
      // promoção
      promo_status: fPromo && descNum > 0 ? 'active' : (fPromo ? 'pending' : 'none'),
      preco_promocional: precoPromo,
      promo_desconto_pct: descPct,
      promo_inicio: fPromo && fPromoInicio ? fPromoInicio : null,
      promo_fim:    fPromo && fPromoFim    ? fPromoFim    : null,
    }

    try {
      let itemId = itemEditando?.id

      if (itemEditando) {
        const { error } = await supabase
          .from('itens_cardapio')
          .update(dados)
          .eq('id', itemEditando.id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('itens_cardapio')
          .insert(dados)
          .select('id')
          .single()
        if (error) throw error
        itemId = data.id
      }

      // alergenos
      if (itemId) {
        await supabase.from('item_allergens').delete().eq('item_id', itemId)
        if (alergenosSel.length > 0) {
          await supabase.from('item_allergens').insert(
            alergenosSel.map(aid => ({ item_id: itemId, allergen_id: aid }))
          )
        }
      }

      fecharModal()
      await carregar()
    } catch (err: any) {
      logSupabaseError('Erro ao salvar item', err)
      setErro('Erro ao salvar: ' + (err.message || JSON.stringify(err)))
    } finally {
      setSalvando(false)
    }
  }

  // ── AÇÕES INLINE ─────────────────────────
  async function toggleDisponivel(item: ItemCardapio) {
    if (readOnly) return
    await supabase
      .from('itens_cardapio')
      .update({ disponivel: !item.disponivel })
      .eq('id', item.id)
    carregar()
  }

  async function marcarPromo(item: ItemCardapio) {
    if (readOnly) return
    const temPromo = item.promo_status && item.promo_status !== 'none'
    await supabase
      .from('itens_cardapio')
      .update(temPromo
        ? { promo_status: 'none', preco_promocional: null, promo_desconto_pct: null, promo_inicio: null, promo_fim: null }
        : { promo_status: 'pending' }
      )
      .eq('id', item.id)
    carregar()
  }

  async function deletarItem(id: string) {
    if (!confirm('Remover este item permanentemente?')) return
    await supabase.from('itens_cardapio').delete().eq('id', id)
    carregar()
  }

  function toggleAlerg(id: string) {
    setAlergenosSel(prev =>
      prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
    )
  }

  // ─────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────
  if (loading) return (
    <div className="flex items-center justify-center py-16 text-gray-400">
      <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full mr-3" />
      Carregando cardápio...
    </div>
  )

  const itensDaCategoria = (catId: string) => itens.filter(i => i.categoria_id === catId)

  return (
    <div className="space-y-6">

      {/* ERRO GLOBAL */}
      {erro && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm flex items-center justify-between">
          {erro}
          <button onClick={() => setErro(null)} className="ml-4 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* TOOLBAR */}
      {!readOnly && (
        <div className="flex flex-wrap items-end gap-3">
          {/* Criar categoria */}
          <div className="flex flex-col gap-1">
            <div className="flex gap-2">
              <input
                value={novaCategoria}
                onChange={e => setNovaCategoria(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && criarCategoria()}
                placeholder="Nome da categoria…"
                disabled={!menuId || criandoCategoria}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 bg-white text-gray-900"
              />
              <button
                onClick={criarCategoria}
                disabled={criandoCategoria || !novaCategoria.trim() || !menuId}
                className="bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-40 transition whitespace-nowrap"
              >
                {criandoCategoria ? '…' : '+ Categoria'}
              </button>
            </div>
            {erroCategoria && (
              <p className="text-xs text-red-500">{erroCategoria}</p>
            )}
            {!menuId && !loading && (
              <p className="text-xs text-yellow-600">⚠️ Menu não localizado — recarregue a página</p>
            )}
          </div>

          <div className="flex-1" />

          {/* Novo item */}
          <button
            onClick={() => abrirModal()}
            disabled={categorias.length === 0}
            title={categorias.length === 0 ? 'Crie uma categoria primeiro' : ''}
            className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 transition flex items-center gap-2 whitespace-nowrap"
          >
            <span className="text-base leading-none">+</span> Adicionar item
          </button>
        </div>
      )}

      {/* LISTA DE CATEGORIAS */}
      {categorias.length === 0 ? (
        <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-4xl mb-3">🍽️</p>
          <p className="font-medium text-gray-500">Nenhuma categoria ainda</p>
          <p className="text-sm">Crie uma categoria acima para começar</p>
        </div>
      ) : (
        categorias.map(cat => {
          const catItens = itensDaCategoria(cat.id)
          return (
            <div key={cat.id} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
              {/* cabeçalho */}
              <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-800">{cat.nome}</span>
                  <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                    {catItens.length} {catItens.length === 1 ? 'item' : 'itens'}
                  </span>
                </div>
                {!readOnly && (
                  <div className="flex gap-3 text-xs">
                    <button
                      onClick={() => { setFCatId(cat.id); abrirModal() }}
                      className="text-orange-600 hover:underline font-medium"
                    >
                      + item
                    </button>
                    <button
                      onClick={() => deletarCategoria(cat.id)}
                      className="text-red-400 hover:text-red-600 hover:underline"
                    >
                      remover categoria
                    </button>
                  </div>
                )}
              </div>

              {/* itens */}
              {catItens.length === 0 ? (
                <div className="px-4 py-6 text-sm text-gray-400 text-center">
                  Nenhum item — clique em "+ item" para adicionar
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {catItens.map(item => (
                    <ItemRow
                      key={item.id}
                      item={item}
                      readOnly={!!readOnly}
                      onEditar={() => abrirModal(item)}
                      onToggleDisponivel={() => toggleDisponivel(item)}
                      onTogglePromo={() => marcarPromo(item)}
                      onDeletar={() => deletarItem(item.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          )
        })
      )}

      {/* MODAL DE EDIÇÃO */}
      {modalAberto && (
        <ModalItem
          item={itemEditando}
          categorias={categorias}
          alergenos={alergenos}
          fNome={fNome} setFNome={setFNome}
          fDesc={fDesc} setFDesc={setFDesc}
          fPreco={fPreco} setFPreco={setFPreco}
          fCodigo={fCodigo} setFCodigo={setFCodigo}
          fCatId={fCatId} setFCatId={setFCatId}
          fDisponivel={fDisponivel} setFDisponivel={setFDisponivel}
          fDelivery={fDelivery} setFDelivery={setFDelivery}
          fotoUrl={fotoUrl} setFotoUrl={setFotoUrl}
          alergenosSel={alergenosSel}
          toggleAlerg={toggleAlerg}
          salvando={salvando}
          erro={erro}
          onSalvar={salvarItem}
          onFechar={fecharModal}
          fPromo={fPromo} setFPromo={setFPromo}
          fPromoDesc={fPromoDesc} setFPromoDesc={setFPromoDesc}
          fPromoTipo={fPromoTipo} setFPromoTipo={setFPromoTipo}
          fPromoInicio={fPromoInicio} setFPromoInicio={setFPromoInicio}
          fPromoFim={fPromoFim} setFPromoFim={setFPromoFim}
        />
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// LINHA DO ITEM
// ─────────────────────────────────────────────
function ItemRow({ item, readOnly, onEditar, onToggleDisponivel, onTogglePromo, onDeletar }: {
  item: ItemCardapio; readOnly: boolean
  onEditar: () => void; onToggleDisponivel: () => void
  onTogglePromo: () => void; onDeletar: () => void
}) {
  const promoAtiva   = item.promo_status === 'active'
  const promoPendente = item.promo_status === 'pending'
  const promoPausada  = item.promo_status === 'paused'
  const temPromo      = promoAtiva || promoPendente || promoPausada

  return (
    <div className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition group ${!item.disponivel ? 'opacity-50' : ''}`}>
      {/* thumb */}
      <div className="w-11 h-11 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-100 flex items-center justify-center">
        {item.foto_url
          ? <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover" />
          : <span className="text-xl">🍽️</span>
        }
      </div>

      {/* info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          {item.codigo && (
            <span className="font-mono text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              #{item.codigo}
            </span>
          )}
          <span className={`text-sm font-medium text-gray-800 truncate ${!item.disponivel ? 'line-through text-gray-400' : ''}`}>
            {item.nome}
          </span>
        </div>
        {item.descricao && (
          <p className="text-xs text-gray-400 truncate max-w-sm mt-0.5">{item.descricao}</p>
        )}
        <div className="flex gap-1.5 mt-1 flex-wrap">
          {!item.disponivel   && <Badge cor="gray">Oculto</Badge>}
          {promoAtiva         && <Badge cor="orange">🔥 -{item.promo_desconto_pct}%</Badge>}
          {promoPendente      && <Badge cor="yellow">⏳ Aguarda config.</Badge>}
          {promoPausada       && <Badge cor="gray">⏸ Pausada</Badge>}
          {item.delivery_disponivel && <Badge cor="blue">🛵 Delivery</Badge>}
        </div>
      </div>

      {/* preço */}
      <div className="text-right flex-shrink-0 min-w-[64px]">
        {promoAtiva && item.preco_promocional ? (
          <>
            <div className="text-xs text-gray-400 line-through">
              R$ {item.preco?.toFixed(2)}
            </div>
            <div className="text-sm font-bold text-orange-600">
              R$ {item.preco_promocional.toFixed(2)}
            </div>
          </>
        ) : (
          <div className="text-sm font-bold text-gray-800">
            R$ {item.preco?.toFixed(2)}
          </div>
        )}
      </div>

      {/* ações — aparecem no hover */}
      {!readOnly && (
        <div className="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition">
          <Acao onClick={onEditar}          title="Editar"                         emoji="✏️" />
          <Acao onClick={onToggleDisponivel} title={item.disponivel ? 'Ocultar' : 'Exibir'} emoji={item.disponivel ? '👁️' : '🙈'} />
          <Acao onClick={onTogglePromo}     title={temPromo ? 'Remover promoção' : 'Marcar como promoção'} emoji={temPromo ? '🔥' : '🏷️'} destaque={temPromo} />
          <Acao onClick={onDeletar}         title="Remover"                        emoji="🗑️" perigo />
        </div>
      )}
    </div>
  )
}

function Badge({ cor, children }: { cor: 'gray' | 'orange' | 'yellow' | 'blue'; children: React.ReactNode }) {
  const cls = {
    gray:   'bg-gray-100 text-gray-500',
    orange: 'bg-orange-100 text-orange-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    blue:   'bg-blue-100 text-blue-600',
  }[cor]
  return <span className={`text-xs px-1.5 py-0.5 rounded-full ${cls}`}>{children}</span>
}

function Acao({ onClick, title, emoji, destaque, perigo }: {
  onClick: () => void; title: string; emoji: string; destaque?: boolean; perigo?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-8 h-8 rounded-lg flex items-center justify-center text-base transition
        ${perigo    ? 'hover:bg-red-50 text-red-400'
        : destaque  ? 'bg-orange-50 text-orange-500 hover:bg-orange-100'
        :             'hover:bg-gray-100 text-gray-500'}`}
    >
      {emoji}
    </button>
  )
}

// ─────────────────────────────────────────────
// MODAL DE EDIÇÃO
// ─────────────────────────────────────────────
function ModalItem({
  item, categorias, alergenos,
  fNome, setFNome, fDesc, setFDesc,
  fPreco, setFPreco, fCodigo, setFCodigo,
  fCatId, setFCatId, fDisponivel, setFDisponivel,
  fDelivery, setFDelivery, fotoUrl, setFotoUrl,
  alergenosSel, toggleAlerg,
  salvando, erro, onSalvar, onFechar,
  fPromo, setFPromo,
  fPromoDesc, setFPromoDesc,
  fPromoTipo, setFPromoTipo,
  fPromoInicio, setFPromoInicio,
  fPromoFim, setFPromoFim,
}: any) {
  // calcula preview do preço promocional em tempo real
  const precoBase = parseFloat((fPreco || '0').replace(',', '.')) || 0
  const descNum   = parseFloat((fPromoDesc || '0').replace(',', '.')) || 0
  const precoPromoPreview = fPromo && descNum > 0
    ? (fPromoTipo === 'pct'
        ? precoBase * (1 - descNum / 100)
        : precoBase - descNum)
    : null
  const algSelecionados = alergenos
    .filter((a: Alergeno) => alergenosSel.includes(a.id))
    .map((a: Alergeno) => `${a.icone} ${a.nome}`)
    .join(' · ')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <div>
            <h2 className="font-semibold text-gray-900 text-lg">
              {item ? 'Editar item' : 'Novo item'}
            </h2>
            {item && <p className="text-xs text-gray-400 mt-0.5">{item.nome}</p>}
          </div>
          <button
            onClick={onFechar}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-lg transition"
          >
            ✕
          </button>
        </div>

        {/* CORPO SCROLLÁVEL */}
        <div className="overflow-y-auto px-6 py-4 space-y-4 flex-1">

          {erro && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">
              {erro}
            </div>
          )}

          {/* FOTO */}
          <ImageUpload
            onUpload={setFotoUrl}
            onRemove={() => setFotoUrl('')}
            currentImage={fotoUrl || null}
            label="Foto do item"
            aspectRatio="square"
            maxSize={2}
          />

          {/* CÓDIGO + CATEGORIA */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Código <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                value={fCodigo}
                onChange={e => setFCodigo(e.target.value)}
                placeholder="ex: 042"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
              />
              <p className="text-xs text-gray-400 mt-1">Visível no cardápio e usado pelo garçom</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Categoria <span className="text-red-400">*</span>
              </label>
              <select
                value={fCatId}
                onChange={e => setFCatId(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
              >
                <option value="">Selecionar…</option>
                {categorias.map((c: Categoria) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
            </div>
          </div>

          {/* NOME */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nome do item <span className="text-red-400">*</span>
            </label>
            <input
              value={fNome}
              onChange={e => setFNome(e.target.value)}
              placeholder="Nome do item"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
            />
          </div>

          {/* DESCRIÇÃO */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
            <textarea
              value={fDesc}
              onChange={e => setFDesc(e.target.value)}
              placeholder="Ingredientes, modo de preparo, acompanhamentos…"
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
            />
          </div>

          {/* PREÇO */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Preço <span className="text-red-400">*</span>
            </label>
            <div className="relative w-40">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 pointer-events-none">
                R$
              </span>
              <input
                value={fPreco}
                onChange={e => setFPreco(e.target.value)}
                placeholder="0,00"
                className="w-full border border-gray-200 rounded-lg pl-9 pr-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
              />
            </div>
          </div>

          {/* ALERGENOS */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Alérgenos
              <span className="text-gray-400 font-normal ml-1">(ANVISA RDC 26/2015)</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {alergenos.map((a: Alergeno) => {
                const sel = alergenosSel.includes(a.id)
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => toggleAlerg(a.id)}
                    className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border-2 transition font-medium ${
                      sel
                        ? 'border-red-400 bg-red-50 text-red-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="text-sm leading-none">{a.icone}</span>
                    {a.nome}
                    {sel && <span className="text-red-500 text-xs ml-0.5">✓</span>}
                  </button>
                )
              })}
            </div>
            {alergenosSel.length > 0 && (
              <p className="text-xs text-gray-400 mt-2">
                {alergenosSel.length} selecionado{alergenosSel.length > 1 ? 's' : ''}: {algSelecionados}
              </p>
            )}
          </div>

          {/* TOGGLES DE STATUS */}
          <div className="flex flex-wrap gap-5 pt-2 border-t border-gray-100">
            <Toggle checked={fDisponivel} onChange={setFDisponivel} label="Disponível no cardápio" />
            <Toggle checked={fDelivery}   onChange={setFDelivery}   label="Disponível para delivery" />
            <Toggle checked={fPromo}      onChange={setFPromo}      label="Em promoção 🏷️" />
          </div>

          {/* CONFIGURAÇÃO DE PROMOÇÃO (inline, aparece quando toggle ativo) */}
          {fPromo && (
            <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 space-y-3">
              <p className="text-xs font-semibold text-orange-700">🔥 Configurar promoção</p>

              {/* Tipo */}
              <div className="flex gap-2">
                {(['pct', 'fixed'] as const).map(t => (
                  <button key={t} type="button"
                    onClick={() => setFPromoTipo(t)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium border transition ${
                      fPromoTipo === t
                        ? 'border-orange-500 bg-orange-100 text-orange-700'
                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}>
                    {t === 'pct' ? '% Percentual' : 'R$ Valor fixo'}
                  </button>
                ))}
              </div>

              {/* Atalhos percentual */}
              {fPromoTipo === 'pct' && (
                <div className="flex gap-1.5">
                  {[10, 15, 20, 30, 50].map(p => (
                    <button key={p} type="button"
                      onClick={() => setFPromoDesc(p.toString())}
                      className={`flex-1 py-1 rounded-lg text-xs font-medium border transition ${
                        fPromoDesc === p.toString()
                          ? 'bg-orange-200 border-orange-400 text-orange-800'
                          : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                      }`}>
                      {p}%
                    </button>
                  ))}
                </div>
              )}

              {/* Valor + preview */}
              <div className="flex gap-3 items-center">
                <div className="relative flex-1">
                  <input
                    value={fPromoDesc}
                    onChange={e => setFPromoDesc(e.target.value)}
                    placeholder={fPromoTipo === 'pct' ? 'ex: 20' : 'ex: 10,00'}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                    {fPromoTipo === 'pct' ? '%' : 'R$'}
                  </span>
                </div>
                {precoPromoPreview !== null && precoPromoPreview > 0 && (
                  <div className="text-right flex-shrink-0">
                    <div className="text-xs text-gray-400 line-through">R$ {precoBase.toFixed(2).replace('.', ',')}</div>
                    <div className="text-base font-bold text-orange-600">R$ {precoPromoPreview.toFixed(2).replace('.', ',')}</div>
                  </div>
                )}
              </div>

              {/* Datas */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Início</label>
                  <input type="date" value={fPromoInicio} onChange={e => setFPromoInicio(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Término <span className="text-gray-400">(opcional)</span></label>
                  <input type="date" value={fPromoFim} onChange={e => setFPromoFim(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white" />
                </div>
              </div>
              {fPromoFim && <p className="text-xs text-orange-600">Desativa automaticamente após {fPromoFim}.</p>}
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onFechar}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onSalvar}
            disabled={salvando}
            className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {salvando
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Salvando…</>
              : item ? '✓ Salvar alterações' : '✓ Criar item'
            }
          </button>
        </div>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────
// TOGGLE REUTILIZÁVEL
// ─────────────────────────────────────────────
function Toggle({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label: string
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
          checked ? 'bg-orange-500' : 'bg-gray-200'
        }`}
      >
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-4' : ''
        }`} />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}
