'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { SpecialOfferRow, SpecialOfferItemRow } from '@/lib/specialOffers'
import { CONFIG_TEMA_PADRAO } from '@/components/tema/PreviewTemaCardapio'
import { calcularPrecoPromocional } from '@/lib/promocaoItem'
import GerarPostInstagramModal from './GerarPostInstagramModal'
import SumCard from './SumCard'
import PromoGrupo from './PromoGrupo'
import ModalConfigurarPromocao from './ModalConfigurarPromocao'
import ModalOfertaContador from './ModalOfertaContador'

interface ItemCardapioSimples {
  id: string
  nome: string
  preco: number
  foto_url: string | null
}

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

const DIAS_SEMANA_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

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

  // ── Promoções com contador (special_offers) — feature independente,
  // opt-in via Configurações → Recursos do cardápio ──
  const [promocoesContadorAtivado, setPromocoesContadorAtivado] = useState(false)
  const [ofertas, setOfertas] = useState<SpecialOfferRow[]>([])
  const [modalOfertaAberto, setModalOfertaAberto] = useState(false)
  // Dados só usados pra gerar post pra Instagram (imagem no tema do
  // estabelecimento + legenda com hashtags de bairro/tipo/"Salvador").
  const [dadosEstabelecimento, setDadosEstabelecimento] = useState<{
    nome: string
    bairro: string | null
    tipoEstabelecimento: string | null
  }>({ nome: '', bairro: null, tipoEstabelecimento: null })
  const [coresTema, setCoresTema] = useState({
    corPrimaria: CONFIG_TEMA_PADRAO.cor_primaria,
    corSecundaria: CONFIG_TEMA_PADRAO.cor_secundaria,
    corFundo: CONFIG_TEMA_PADRAO.cor_fundo,
    corTexto: CONFIG_TEMA_PADRAO.cor_texto,
  })
  const [fonteTemaNome, setFonteTemaNome] = useState(CONFIG_TEMA_PADRAO.fonte)
  const [ofertaParaPost, setOfertaParaPost] = useState<SpecialOfferRow | null>(null)
  const [ofertaEditando, setOfertaEditando] = useState<SpecialOfferRow | null>(null)
  const [salvandoOferta, setSalvandoOferta] = useState(false)
  const [erroOferta, setErroOferta] = useState<string | null>(null)

  const [ofNome, setOfNome] = useState('')
  const [ofDescricao, setOfDescricao] = useState('')
  const [ofFotoUrl, setOfFotoUrl] = useState('')
  const [ofPrecoDe, setOfPrecoDe] = useState('')
  const [ofPrecoPor, setOfPrecoPor] = useState('')
  const [ofCardLargo, setOfCardLargo] = useState(false)
  const [ofAtivo, setOfAtivo] = useState(true)
  const [ofRecorrente, setOfRecorrente] = useState(false)
  const [ofDiasSemana, setOfDiasSemana] = useState<number[]>([])
  const [ofHoraInicio, setOfHoraInicio] = useState('')
  const [ofHoraFim, setOfHoraFim] = useState('')
  const [ofInicioEm, setOfInicioEm] = useState('')
  const [ofFimEm, setOfFimEm] = useState('')
  const [ofExibirInicio, setOfExibirInicio] = useState('')
  const [ofExibirFim, setOfExibirFim] = useState('')
  const [ofAlertaMinutos, setOfAlertaMinutos] = useState('30')
  // "Tem prazo definido?" — Não deixa explícito o que hoje já era possível
  // de forma implícita (período em branco = sempre ativo, sem contador):
  // ver calcularEstadoOferta() em src/lib/specialOffers.ts.
  const [ofTemPrazo, setOfTemPrazo] = useState(true)

  // Compor o combo com itens já cadastrados no cardápio — opcional, só
  // aparece se o estabelecimento já tiver algum item (special_offer_itens).
  const [itensCardapioTodos, setItensCardapioTodos] = useState<ItemCardapioSimples[]>([])
  const [ofComporItens, setOfComporItens] = useState(false)
  const [ofItensCombo, setOfItensCombo] = useState<{ itemCardapioId: string; nome: string; quantidade: string }[]>([])
  const [buscaItemCombo, setBuscaItemCombo] = useState('')

  const carregar = useCallback(async () => {
    setLoading(true)

    // Promoções com contador (special_offers) não dependem de menu/categoria
    // nenhuma — rodam antes, pra não ficar de fora nos "returns" cedo abaixo
    // (estabelecimento sem cardápio ainda pode ter promoção com contador).
    const { data: estConfig } = await supabase
      .from('estabelecimentos')
      .select('promocoes_contador_ativado, nome, nome_fantasia, bairro, tema_atual_id, tipos_estabelecimento(nome)')
      .eq('id', estabelecimentoId)
      .maybeSingle()
    setPromocoesContadorAtivado(!!estConfig?.promocoes_contador_ativado)
    setDadosEstabelecimento({
      nome: estConfig?.nome_fantasia || estConfig?.nome || '',
      bairro: estConfig?.bairro || null,
      // Nome de exibição (ex: "Banca de Acarajé"), não o slug técnico
      // (ex: "banca_acaraje") — vira hashtag na legenda do Instagram
      // (ver gerarLegendaPost em src/lib/instagramPost.ts).
      tipoEstabelecimento:
        (Array.isArray(estConfig?.tipos_estabelecimento) ? estConfig.tipos_estabelecimento[0] : estConfig?.tipos_estabelecimento)?.nome || null,
    })

    // Tema do estabelecimento — só pro gerador de post pra Instagram usar a
    // mesma cor/fonte já escolhida em Cardápio → Tema. Sem tema selecionado,
    // cai no padrão (mesmo fallback usado no preview do TemaEditor).
    if (estConfig?.tema_atual_id) {
      const { data: temaData } = await supabase
        .from('temas')
        .select('config')
        .eq('id', estConfig.tema_atual_id)
        .maybeSingle()
      const cfg = temaData?.config || {}
      setCoresTema({
        corPrimaria: cfg.cor_primaria || CONFIG_TEMA_PADRAO.cor_primaria,
        corSecundaria: cfg.cor_secundaria || CONFIG_TEMA_PADRAO.cor_secundaria,
        corFundo: cfg.cor_fundo || CONFIG_TEMA_PADRAO.cor_fundo,
        corTexto: cfg.cor_texto || CONFIG_TEMA_PADRAO.cor_texto,
      })
      setFonteTemaNome(cfg.fonte || CONFIG_TEMA_PADRAO.fonte)
    }

    const { data: ofertasData } = await supabase
      .from('special_offers')
      .select('*')
      .eq('estabelecimento_id', estabelecimentoId)
      .order('created_at', { ascending: false })
    setOfertas((ofertasData as SpecialOfferRow[]) || [])

    // buscar todos os itens do estabelecimento que têm algum status de promoção
    //
    // FIX: mesmo bug que já tinha sido corrigido em CardapioTab.tsx e nunca
    // replicado aqui — .eq('ativo', true) + .maybeSingle() falha (retorna
    // null) tanto quando a coluna/linha não bate 'ativo' quanto quando há
    // mais de um menu pro estabelecimento (PGRST116). Isso fazia a função
    // sair no primeiro "return" cedo, sem nunca chegar em itens_cardapio —
    // por isso item nenhum aparecia aqui, mesmo com promo_status = 'active'.
    const { data: menus } = await supabase
      .from('menus')
      .select('id')
      .eq('estabelecimento_id', estabelecimentoId)
      .order('created_at', { ascending: true })
      .limit(1)

    const menuId = menus?.[0]?.id
    if (!menuId) { setItensCardapioTodos([]); setLoading(false); return }

    const { data: cats } = await supabase
      .from('categorias')
      .select('id')
      .eq('menu_id', menuId)

    if (!cats?.length) { setItens([]); setItensCardapioTodos([]); setLoading(false); return }

    const catIds = cats.map((c: any) => c.id)
    const { data } = await supabase
      .from('itens_cardapio')
      .select('id, nome, preco, codigo, foto_url, categoria_id, promo_status, preco_promocional, promo_desconto_pct, promo_inicio, promo_fim')
      .in('categoria_id', catIds)
      .not('promo_status', 'eq', 'none')
      .order('nome')

    setItens((data as ItemCardapio[]) || [])

    // Todos os itens (sem filtro de promo_status) — base pra "Compor com
    // itens do cardápio" no combo. Só existe UI pra isso se essa lista não
    // vier vazia.
    const { data: todosOsItens } = await supabase
      .from('itens_cardapio')
      .select('id, nome, preco, foto_url')
      .in('categoria_id', catIds)
      .order('nome')
    setItensCardapioTodos((todosOsItens as ItemCardapioSimples[]) || [])

    setLoading(false)
  }, [estabelecimentoId])

  useEffect(() => { Promise.resolve().then(carregar) }, [carregar])

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

    const precoPromo = calcularPrecoPromocional(itemModal.preco, tipoDesc, val)
    if (precoPromo === null) { setErro('Preço promocional inválido.'); setSalvando(false); return }

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
        promocao_ativa: false,
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
        promocao_ativa: true,
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
        promocao_ativa: false,
      })
      .eq('id', item.id)
    carregar()
  }

  // ── PROMOÇÕES COM CONTADOR (special_offers) ──────────────────────
  function paraDatetimeLocal(iso: string | null): string {
    if (!iso) return ''
    const d = new Date(iso)
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  async function abrirModalOferta(oferta?: SpecialOfferRow) {
    setOfertaEditando(oferta || null)
    setOfNome(oferta?.nome || '')
    setOfDescricao(oferta?.descricao || '')
    setOfFotoUrl(oferta?.foto_url || '')
    setOfPrecoDe(oferta?.preco_de != null ? oferta.preco_de.toString().replace('.', ',') : '')
    setOfPrecoPor(oferta?.preco_por != null ? oferta.preco_por.toString().replace('.', ',') : '')
    setOfCardLargo(oferta?.card_largo || false)
    setOfAtivo(oferta?.ativo !== false)
    setOfRecorrente(oferta?.recorrente || false)
    setOfDiasSemana(oferta?.dias_semana || [])
    setOfHoraInicio(oferta?.hora_inicio?.slice(0, 5) || '')
    setOfHoraFim(oferta?.hora_fim?.slice(0, 5) || '')
    setOfInicioEm(paraDatetimeLocal(oferta?.inicio_em || null))
    setOfFimEm(paraDatetimeLocal(oferta?.fim_em || null))
    setOfExibirInicio(paraDatetimeLocal(oferta?.exibir_inicio || null))
    setOfExibirFim(paraDatetimeLocal(oferta?.exibir_fim || null))
    setOfAlertaMinutos(oferta?.alerta_minutos?.toString() || '30')
    // Sem prazo = a mesma combinação que calcularEstadoOferta() lê como
    // "sempre" (não recorrente e sem fim_em) — só isso vira "Não" aqui;
    // qualquer outra coisa (inclusive dado antigo/manual fora desse
    // padrão) volta marcado "Sim" por segurança.
    setOfTemPrazo(oferta ? !!(oferta.recorrente || oferta.fim_em) : true)
    setErroOferta(null)

    if (oferta) {
      const { data: itensDoCombo } = await supabase
        .from('special_offer_itens')
        .select('item_cardapio_id, quantidade')
        .eq('special_offer_id', oferta.id)
      const linhas = ((itensDoCombo || []) as Pick<SpecialOfferItemRow, 'item_cardapio_id' | 'quantidade'>[]).map((li) => {
        const item = itensCardapioTodos.find((i) => i.id === li.item_cardapio_id)
        return {
          itemCardapioId: li.item_cardapio_id,
          nome: item?.nome || '(item removido do cardápio)',
          quantidade: String(li.quantidade).replace('.', ','),
        }
      })
      setOfItensCombo(linhas)
      setOfComporItens(linhas.length > 0)
    } else {
      setOfItensCombo([])
      setOfComporItens(false)
    }
    setBuscaItemCombo('')

    setModalOfertaAberto(true)
  }

  function fecharModalOferta() {
    setModalOfertaAberto(false)
    setOfertaEditando(null)
    setErroOferta(null)
    setOfComporItens(false)
    setOfItensCombo([])
    setBuscaItemCombo('')
  }

  function toggleDiaSemanaOferta(dia: number) {
    setOfDiasSemana((prev) => (prev.includes(dia) ? prev.filter((d) => d !== dia) : [...prev, dia].sort()))
  }

  // ── COMBO: compor com itens do cardápio ──
  function adicionarItemNoCombo(item: ItemCardapioSimples) {
    if (ofItensCombo.some((li) => li.itemCardapioId === item.id)) return
    setOfItensCombo((prev) => [...prev, { itemCardapioId: item.id, nome: item.nome, quantidade: '1' }])
    setBuscaItemCombo('')
  }

  function atualizarQuantidadeNoCombo(itemCardapioId: string, quantidade: string) {
    setOfItensCombo((prev) => prev.map((li) => (li.itemCardapioId === itemCardapioId ? { ...li, quantidade } : li)))
  }

  function removerItemDoCombo(itemCardapioId: string) {
    setOfItensCombo((prev) => prev.filter((li) => li.itemCardapioId !== itemCardapioId))
  }

  function limparItensCombo() {
    setOfItensCombo([])
  }

  // Soma dos itens compostos × quantidade — só uma sugestão pro campo
  // "Preço de" (comparação "de/por"); o preço do combo em si (Preço "por")
  // continua sempre digitado manualmente.
  const somaItensCombo = ofItensCombo.reduce((soma, li) => {
    const item = itensCardapioTodos.find((i) => i.id === li.itemCardapioId)
    const qtd = parseFloat(li.quantidade.replace(',', '.')) || 0
    return soma + (item?.preco || 0) * qtd
  }, 0)

  async function salvarOferta() {
    if (readOnly) return
    if (!ofNome.trim()) { setErroOferta('Nome é obrigatório.'); return }
    const precoPorNum = parseFloat(ofPrecoPor.replace(',', '.'))
    if (isNaN(precoPorNum) || precoPorNum <= 0) { setErroOferta('Preço inválido.'); return }
    const precoDeNum = ofPrecoDe.trim() ? parseFloat(ofPrecoDe.replace(',', '.')) : null
    if (ofPrecoDe.trim() && (precoDeNum === null || isNaN(precoDeNum))) { setErroOferta('Preço "de" inválido.'); return }
    // Sem prazo definido: nenhuma das checagens de período abaixo se aplica
    // — a promoção fica sempre ativa (ver calcularEstadoOferta), então
    // recorrência/datas nem entram no formulário.
    if (ofTemPrazo && ofRecorrente && ofDiasSemana.length === 0) { setErroOferta('Selecione ao menos um dia da semana.'); return }
    if (ofTemPrazo && ofRecorrente && (!ofHoraInicio || !ofHoraFim)) { setErroOferta('Informe hora de início e fim.'); return }
    // "Início" é opcional aqui (ausente = já começou, sem limite inferior);
    // "Fim" é obrigatório — sem ele calcularEstadoOferta não tem como saber
    // quando a promoção conta como "ativa" (ver src/lib/specialOffers.ts).
    if (ofTemPrazo && !ofRecorrente && !ofFimEm) { setErroOferta('Informe a data/hora de fim.'); return }

    setSalvandoOferta(true)
    setErroOferta(null)

    const temPeriodoDefinido = ofTemPrazo
    const dados = {
      estabelecimento_id: estabelecimentoId,
      nome: ofNome.trim(),
      descricao: ofDescricao.trim() || null,
      foto_url: ofFotoUrl || null,
      preco_de: precoDeNum,
      preco_por: precoPorNum,
      card_largo: ofCardLargo,
      ativo: ofAtivo,
      recorrente: temPeriodoDefinido && ofRecorrente,
      dias_semana: temPeriodoDefinido && ofRecorrente ? ofDiasSemana : null,
      hora_inicio: temPeriodoDefinido && ofRecorrente ? ofHoraInicio : null,
      hora_fim: temPeriodoDefinido && ofRecorrente ? ofHoraFim : null,
      inicio_em: temPeriodoDefinido && !ofRecorrente && ofInicioEm ? new Date(ofInicioEm).toISOString() : null,
      fim_em: temPeriodoDefinido && !ofRecorrente && ofFimEm ? new Date(ofFimEm).toISOString() : null,
      exibir_inicio: ofExibirInicio ? new Date(ofExibirInicio).toISOString() : null,
      exibir_fim: ofExibirFim ? new Date(ofExibirFim).toISOString() : null,
      alerta_minutos: parseInt(ofAlertaMinutos) || 30,
    }

    let ofertaId = ofertaEditando?.id
    let error: { message: string } | null = null
    if (ofertaEditando) {
      ({ error } = await supabase.from('special_offers').update(dados).eq('id', ofertaEditando.id))
    } else {
      const resultado = await supabase.from('special_offers').insert(dados).select('id').single()
      error = resultado.error
      ofertaId = resultado.data?.id
    }

    if (error) {
      setSalvandoOferta(false)
      setErroOferta('Erro ao salvar: ' + error.message)
      return
    }

    // Itens do combo — apaga tudo e reinsere, mesmo padrão de bridge usado
    // no resto do projeto. Se "Compor com itens do cardápio" estiver
    // desligado (ou a lista vazia), só limpa o que houver — a promoção
    // volta a ser nome/preço/foto livres, sem vínculo nenhum.
    if (ofertaId) {
      await supabase.from('special_offer_itens').delete().eq('special_offer_id', ofertaId)
      if (ofComporItens && ofItensCombo.length > 0) {
        const linhas = ofItensCombo
          .map((li) => ({
            special_offer_id: ofertaId,
            item_cardapio_id: li.itemCardapioId,
            quantidade: parseFloat(li.quantidade.replace(',', '.')) || 1,
          }))
          .filter((li) => li.item_cardapio_id)
        if (linhas.length > 0) {
          const { error: itensError } = await supabase.from('special_offer_itens').insert(linhas)
          if (itensError) {
            setSalvandoOferta(false)
            setErroOferta('Promoção salva, mas houve erro ao salvar os itens do combo: ' + itensError.message)
            carregar()
            return
          }
        }
      }
    }

    setSalvandoOferta(false)
    fecharModalOferta()
    mostrarToast(ofertaEditando ? '✅ Promoção atualizada' : '✅ Promoção criada')
    carregar()
  }

  async function excluirOferta(oferta: SpecialOfferRow) {
    if (readOnly || !confirm(`Excluir a promoção "${oferta.nome}"?`)) return
    await supabase.from('special_offers').delete().eq('id', oferta.id)
    carregar()
  }

  async function toggleAtivoOferta(oferta: SpecialOfferRow) {
    if (readOnly) return
    const novoAtivo = !oferta.ativo
    await supabase.from('special_offers').update({ ativo: novoAtivo }).eq('id', oferta.id)
    mostrarToast(novoAtivo ? `▶️ "${oferta.nome}" reativada` : `⏸ "${oferta.nome}" pausada`)
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
        <ModalConfigurarPromocao
          itemNome={itemModal.nome}
          itemCodigo={itemModal.codigo}
          tipoDesc={tipoDesc}
          setTipoDesc={setTipoDesc}
          descValor={descValor}
          setDescValor={setDescValor}
          promoInicio={promoInicio}
          setPromoInicio={setPromoInicio}
          promoFim={promoFim}
          setPromoFim={setPromoFim}
          erro={erro}
          precoBase={precoBase}
          precoComDesconto={precoComDesconto}
          salvando={salvando}
          onAtivar={ativarPromocao}
          onFechar={() => setModalModo(null)}
        />
      )}

      {/* ── PROMOÇÕES COM CONTADOR (special_offers) — feature independente ── */}
      {promocoesContadorAtivado && (
        <div className="border-t border-gray-100 pt-6">
          <div className="flex items-center justify-between mb-3 gap-3">
            <div>
              <h3 className="font-semibold text-gray-800 text-sm">🎉 Promoções com contador</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Combos e ofertas por tempo limitado que não são itens do cardápio — aparecem no carrossel
                público com contador regressivo.
              </p>
            </div>
            {!readOnly && (
              <button
                onClick={() => abrirModalOferta()}
                className="flex-shrink-0 flex items-center gap-1.5 text-xs font-semibold bg-orange-600 hover:bg-orange-700 text-white px-3 py-1.5 rounded-lg transition"
              >
                + Nova promoção
              </button>
            )}
          </div>

          {ofertas.length === 0 ? (
            <div className="text-center py-10 text-gray-400 border-2 border-dashed border-gray-200 rounded-xl">
              <p className="text-3xl mb-2">🎉</p>
              <p className="text-sm">Nenhuma promoção com contador cadastrada</p>
            </div>
          ) : (
            <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
              {ofertas.map((oferta) => (
                <div
                  key={oferta.id}
                  className={`flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition ${!oferta.ativo ? 'opacity-55' : ''}`}
                >
                  <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-200 flex-shrink-0 bg-gray-100 flex items-center justify-center text-gray-400">
                    {oferta.foto_url
                      ? <img src={oferta.foto_url} alt={oferta.nome} className="w-full h-full object-cover" />
                      : '🎉'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <span className="text-sm font-medium text-gray-800 truncate">{oferta.nome}</span>
                      {!oferta.ativo && <span className="text-xs text-gray-400">(inativa)</span>}
                      {oferta.card_largo && <span className="text-xs text-gray-400">· card largo</span>}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {oferta.recorrente
                        ? `${(oferta.dias_semana || []).map((d) => DIAS_SEMANA_ABREV[d]).join(', ') || 'sem dias'} · ${oferta.hora_inicio?.slice(0, 5) || '--'}–${oferta.hora_fim?.slice(0, 5) || '--'}`
                        : oferta.fim_em
                          ? `${oferta.inicio_em ? new Date(oferta.inicio_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'já começou'} até ${new Date(oferta.fim_em).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}`
                          : 'sem data'}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {oferta.preco_de != null && (
                      <div className="text-xs text-gray-400 line-through">R$ {oferta.preco_de.toFixed(2)}</div>
                    )}
                    <div className="text-sm font-bold text-orange-600">R$ {oferta.preco_por.toFixed(2)}</div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {/* Não é uma ação de edição — não grava nada, só gera
                        arquivo local — por isso fica fora do !readOnly. */}
                    <button
                      onClick={() => setOfertaParaPost(oferta)}
                      title="Gerar post pra Instagram"
                      className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-2 py-1.5 rounded-lg transition"
                    >
                      📸
                    </button>
                    {!readOnly && (
                      <>
                        <button
                          onClick={() => abrirModalOferta(oferta)}
                          title="Editar"
                          className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-2 py-1.5 rounded-lg transition"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => toggleAtivoOferta(oferta)}
                          title={oferta.ativo ? 'Pausar' : 'Reativar'}
                          className="text-xs text-gray-500 hover:text-gray-700 border border-gray-200 px-2 py-1.5 rounded-lg transition"
                        >
                          {oferta.ativo ? '⏸' : '▶️'}
                        </button>
                        <button
                          onClick={() => excluirOferta(oferta)}
                          title="Excluir"
                          className="text-xs text-red-400 hover:text-red-600 border border-red-100 px-2 py-1.5 rounded-lg transition"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── MODAL DE PROMOÇÃO COM CONTADOR ── */}
      {modalOfertaAberto && (
        <ModalOfertaContador
          editando={!!ofertaEditando}
          erroOferta={erroOferta}
          ofNome={ofNome} setOfNome={setOfNome}
          ofDescricao={ofDescricao} setOfDescricao={setOfDescricao}
          ofFotoUrl={ofFotoUrl} setOfFotoUrl={setOfFotoUrl}
          ofPrecoDe={ofPrecoDe} setOfPrecoDe={setOfPrecoDe}
          ofPrecoPor={ofPrecoPor} setOfPrecoPor={setOfPrecoPor}
          ofCardLargo={ofCardLargo} setOfCardLargo={setOfCardLargo}
          ofAtivo={ofAtivo} setOfAtivo={setOfAtivo}
          ofRecorrente={ofRecorrente} setOfRecorrente={setOfRecorrente}
          ofDiasSemana={ofDiasSemana} toggleDiaSemanaOferta={toggleDiaSemanaOferta}
          ofHoraInicio={ofHoraInicio} setOfHoraInicio={setOfHoraInicio}
          ofHoraFim={ofHoraFim} setOfHoraFim={setOfHoraFim}
          ofInicioEm={ofInicioEm} setOfInicioEm={setOfInicioEm}
          ofFimEm={ofFimEm} setOfFimEm={setOfFimEm}
          ofExibirInicio={ofExibirInicio} setOfExibirInicio={setOfExibirInicio}
          ofExibirFim={ofExibirFim} setOfExibirFim={setOfExibirFim}
          ofAlertaMinutos={ofAlertaMinutos} setOfAlertaMinutos={setOfAlertaMinutos}
          ofTemPrazo={ofTemPrazo} setOfTemPrazo={setOfTemPrazo}
          itensCardapioTodos={itensCardapioTodos}
          ofComporItens={ofComporItens} setOfComporItens={setOfComporItens}
          ofItensCombo={ofItensCombo}
          buscaItemCombo={buscaItemCombo} setBuscaItemCombo={setBuscaItemCombo}
          somaItensCombo={somaItensCombo}
          adicionarItemNoCombo={adicionarItemNoCombo}
          atualizarQuantidadeNoCombo={atualizarQuantidadeNoCombo}
          removerItemDoCombo={removerItemDoCombo}
          limparItensCombo={limparItensCombo}
          salvandoOferta={salvandoOferta}
          onSalvar={salvarOferta}
          onFechar={fecharModalOferta}
        />
      )}

      {/* ── GERAR POST PRA INSTAGRAM ── */}
      {ofertaParaPost && (
        <GerarPostInstagramModal
          oferta={ofertaParaPost}
          cores={coresTema}
          fonteNome={fonteTemaNome}
          nomeEstabelecimento={dadosEstabelecimento.nome}
          bairro={dadosEstabelecimento.bairro}
          tipoEstabelecimento={dadosEstabelecimento.tipoEstabelecimento}
          onFechar={() => setOfertaParaPost(null)}
        />
      )}

    </div>
  )
}
