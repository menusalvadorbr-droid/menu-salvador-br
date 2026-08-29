'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logSupabaseError } from '@/lib/supabase/logError'
import { calcularPrecoPromocional } from '@/lib/promocaoItem'
import { ALERGENOS_FALLBACK } from '@/lib/alergenos'
import { baixarPlanilhaCardapio } from './planilha/planilhaCardapio'
import SubirPlanilhaModal from './planilha/SubirPlanilhaModal'
import { baixarPlanilhaTraducao, type TraducaoExistente } from './planilha/planilhaTraducao'
import SubirPlanilhaTraducaoModal from './planilha/SubirPlanilhaTraducaoModal'
import ModalItem from './ModalItem'
import { useGruposComplementos } from './useGruposComplementos'
import CardapioToolbar from './CardapioToolbar'
import CategoriaBloco from './CategoriaBloco'
import {
  IDIOMAS_SUPORTADOS, type Idioma, type TraducoesCampos, type TraducoesNome,
  type Categoria, type VariacaoItem, type ItemCardapio, type Alergeno,
} from './cardapioTipos'

interface CardapioTabProps {
  estabelecimentoId: string
  readOnly?: boolean
}

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
  // Fase 1 do módulo cardápio: variações de tamanho/preço (pizzaria,
  // marmita) — funcionalidade opt-in por estabelecimento, não altera
  // nada pra quem não ativar.
  const [variacoesAtivado, setVariacoesAtivado] = useState(false)
  const [variacoes, setVariacoes] = useState<VariacaoItem[]>([])
  // Fase 2 do módulo cardápio: grupos de complementos (marmita, adicionais)
  // — REUTILIZÁVEIS: um grupo pertence ao estabelecimento inteiro, os
  // itens só escolhem quais grupos usar (item_grupo_complemento).
  const [complementosAtivado, setComplementosAtivado] = useState(false)
  // Tradução manual do cardápio (EN/FR/ES) — opt-in por estabelecimento via
  // Configurações → Idiomas. Sem idioma ativo, nada disso aparece.
  const [idiomasAtivos, setIdiomasAtivos] = useState<Idioma[]>([])
  const [catEditandoTraducoes, setCatEditandoTraducoes] = useState<string | null>(null)
  const [traducoesCategoria, setTraducoesCategoria] = useState<TraducoesNome>({})
  const [salvandoTraducoesCategoria, setSalvandoTraducoesCategoria] = useState(false)
  const [catEditandoNome, setCatEditandoNome] = useState<string | null>(null)
  const [nomeCategoriaEdicao, setNomeCategoriaEdicao] = useState('')
  const [salvandoNomeCategoria, setSalvandoNomeCategoria] = useState(false)
  // Foto representativa da categoria — usada pela navegação por categoria
  // em cards no cardápio público (Configurações → Tema → Navegação de
  // categoria). Opcional, painel inline igual o de traduções.
  const [catEditandoFoto, setCatEditandoFoto] = useState<string | null>(null)
  const [gruposVinculadosIds, setGruposVinculadosIds] = useState<string[]>([])
  // Editor progressivo — as seções de tamanhos/grupos só aparecem abertas
  // de cara quando o item editado já tem algo configurado; senão ficam
  // atrás de um link, pra não poluir o formulário de item por padrão.
  const [mostrarVariacoes, setMostrarVariacoes] = useState(false)
  const [mostrarGrupos, setMostrarGrupos] = useState(false)

  // Grupos de complementos reutilizáveis (fase 2) — extraído pro hook
  // useGruposComplementos.ts; gruposVinculadosIds acima continua aqui
  // porque é estado do ITEM em edição, não do grupo em si (ver comentário
  // no próprio hook sobre os 2 pontos de acoplamento).
  const grupos = useGruposComplementos({
    estabelecimentoId,
    setErro,
    aoVincularGrupoNovo: (grupoId) => setGruposVinculadosIds((prev) => [...prev, grupoId]),
    aoDesvincularGrupo: (grupoId) => setGruposVinculadosIds((prev) => prev.filter((id) => id !== grupoId)),
  })

  // Estado do mini-formulário "nova categoria"/"selecionar categoria pro
  // novo item" foi pra dentro de CardapioToolbar.tsx — só as ações finais
  // (criarCategoria, abrirModal) continuam aqui.

  // UI – categorias expansíveis: por padrão todas fechadas (menos rolagem
  // em cardápios com muita categoria/item); cada uma abre/fecha
  // independente pelo próprio cabeçalho, e os chips de atalho logo acima
  // da lista abrem + rolam até a categoria escolhida.
  const [categoriasExpandidas, setCategoriasExpandidas] = useState<Set<string>>(new Set())
  const categoriaRefs = useRef<Record<string, HTMLDivElement | null>>({})

  // Comportamento de acordeão: abrir uma categoria fecha a que estava
  // aberta antes — só uma fica expandida por vez ao clicar. "Expandir
  // todas" continua existindo como ação explícita à parte, que quebra essa
  // regra de propósito quando o dono realmente quer ver tudo de uma vez.
  function toggleCategoriaExpandida(id: string) {
    setCategoriasExpandidas((prev) => (prev.has(id) ? new Set() : new Set([id])))
  }

  function irParaCategoria(id: string) {
    setCategoriasExpandidas(new Set([id]))
    categoriaRefs.current[id]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function expandirTodas() {
    setCategoriasExpandidas(new Set(categorias.map((c) => c.id)))
  }

  function recolherTodas() {
    setCategoriasExpandidas(new Set())
  }

  // UI – planilha (baixar/subir cardápio em massa)
  const [modalPlanilhaAberto, setModalPlanilhaAberto] = useState(false)
  const [mensagemPlanilha, setMensagemPlanilha] = useState<string | null>(null)

  // UI – planilha de tradução (baixar/subir traduções em massa)
  const [modalPlanilhaTraducaoAberto, setModalPlanilhaTraducaoAberto] = useState(false)
  const [traducoesParaPlanilha, setTraducoesParaPlanilha] = useState<TraducaoExistente[]>([])
  const [carregandoPlanilhaTraducao, setCarregandoPlanilhaTraducao] = useState(false)

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
  const [traducoesItem, setTraducoesItem] = useState<TraducoesCampos>({})

  // ── CARREGAR ──────────────────────────────
  // Corpo real da busca, sem mexer em loading/erro no início — os dois já
  // nascem nos valores certos (true/null) no useState, então resetá-los nessa
  // função seria um setState síncrono redundante logo na primeira execução
  // (a que dispara no efeito de montagem, mais abaixo). O carregar() (função
  // seguinte) é quem reseta loading/erro, para as chamadas manuais depois de
  // criar/editar/excluir, onde a tela já pode estar com loading=false ou um
  // erro antigo na tela.
  const carregarDados = useCallback(async () => {
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
          // 23505 = violou a unique constraint em estabelecimento_id —
          // outra chamada concorrente (ex: duplo-mount de efeito do React
          // StrictMode) já criou o menu entre o SELECT acima e este
          // INSERT. Não é erro de verdade: reconsulta e segue, em vez de
          // travar a tela — a constraint garante que só existe um mesmo.
          if (createErr.code === '23505') {
            const { data: menuAposCorrida } = await supabase
              .from('menus')
              .select('id')
              .eq('estabelecimento_id', estabelecimentoId)
              .limit(1)
            mid = menuAposCorrida && menuAposCorrida.length > 0 ? menuAposCorrida[0].id : null
          } else {
            logSupabaseError('Erro ao criar menu', createErr)
            setErro('Erro ao criar menu: ' + createErr.message)
            setLoading(false)
            return
          }
        } else {
          mid = (novosMenus && novosMenus.length > 0) ? novosMenus[0].id : null
        }
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
          setItens([])
        } else {
          const itemIds = (items || []).map((i: ItemCardapio) => i.id)
          const variacoesPorItem: Record<string, { id: string; nome: string; preco: number }[]> = {}

          if (itemIds.length > 0) {
            const { data: todasVariacoes } = await supabase
              .from('variacoes_item')
              .select('id, item_id, nome, preco')
              .in('item_id', itemIds)
              .order('ordem', { ascending: true })

            for (const v of todasVariacoes || []) {
              if (!variacoesPorItem[v.item_id]) variacoesPorItem[v.item_id] = []
              variacoesPorItem[v.item_id].push({ id: v.id, nome: v.nome, preco: v.preco })
            }
          }

          setItens(
            ((items as ItemCardapio[]) || []).map((i) => ({ ...i, variacoes: variacoesPorItem[i.id] || [] }))
          )
        }
      } else {
        setItens([])
      }

      // 3b. Estabelecimento ativou variações de tamanho/preço e/ou grupos de complementos?
      const { data: estConfig } = await supabase
        .from('estabelecimentos')
        .select('cardapio_variacoes_ativado, cardapio_complementos_ativado, idiomas_ativos')
        .eq('id', estabelecimentoId)
        .maybeSingle()
      setVariacoesAtivado(!!estConfig?.cardapio_variacoes_ativado)
      setComplementosAtivado(!!estConfig?.cardapio_complementos_ativado)
      setIdiomasAtivos(
        ((estConfig?.idiomas_ativos || []) as string[]).filter((i): i is Idioma =>
          IDIOMAS_SUPORTADOS.includes(i as Idioma)
        )
      )

      // 3c. Grupos de complementos reutilizáveis do estabelecimento (ex:
      // "Guarnições" — a mesma lista de 21 opções compartilhada por todas
      // as proteínas, em vez de recriada item por item).
      await grupos.carregarGrupos()

      // 4. Alergenos
      const { data: algs } = await supabase
        .from('allergens')
        .select('*')
        .order('nome', { ascending: true })
      setAlergenos(algs?.length ? algs : ALERGENOS_FALLBACK)

    } catch (e: unknown) {
      setErro('Erro inesperado: ' + (e instanceof Error ? e.message : String(e)))
    } finally {
      setLoading(false)
    }
    // `grupos` (o objeto retornado pelo hook) é recriado a cada render;
    // depender dele inteiro recarregaria em loop. grupos.carregarGrupos
    // já é estável (useCallback dentro do próprio hook) — dependência certa.
  }, [estabelecimentoId, supabase, grupos.carregarGrupos]) // eslint-disable-line react-hooks/exhaustive-deps

  // Wrapper usado pelas ações manuais (criar/editar/excluir categoria ou
  // item, grupos de complementos etc.) — essas sim precisam resetar loading
  // e erro de verdade, porque nesse ponto a tela já pode estar com
  // loading=false ou com um erro antigo ainda visível.
  const carregar = useCallback(async () => {
    setLoading(true)
    setErro(null)
    await carregarDados()
  }, [carregarDados])

  useEffect(() => { carregarDados() }, [carregarDados])

  // ── CRIAR CATEGORIA ──────────────────────
  // Retorna se deu certo — o botão "Salvar" do formulário revelável usa
  // isso pra só fechar o campo quando a categoria realmente foi criada.
  async function criarCategoria(nome: string): Promise<{ ok: boolean; erro?: string }> {
    if (!menuId) return { ok: false, erro: 'Menu não carregado ainda. Aguarde.' }

    const { error } = await supabase
      .from('categorias')
      .insert({
        nome,
        menu_id: menuId,
        ordem: categorias.length,
      })

    if (error) {
      logSupabaseError('Erro ao criar categoria', error)
      return { ok: false, erro: 'Erro ao criar: ' + error.message }
    }
    await carregar()
    return { ok: true }
  }

  async function deletarCategoria(id: string) {
    if (!confirm('Remover esta categoria e todos os seus itens?')) return
    await supabase.from('categorias').delete().eq('id', id)
    carregar()
  }

  // ── PLANILHA (baixar/subir em massa) ─────
  function baixarPlanilha() {
    const nomeArquivo = `cardapio-${new Date().toISOString().slice(0, 10)}.xlsx`
    baixarPlanilhaCardapio(categorias, itens, nomeArquivo)
  }

  async function aoConcluirPlanilha() {
    await carregar()
    setMensagemPlanilha('✅ Planilha aplicada com sucesso!')
    setTimeout(() => setMensagemPlanilha(null), 4000)
  }

  // ── PLANILHA DE TRADUÇÃO (baixar/subir em massa) ─────
  // Busca avulsa, sob demanda — diferente do resto da tela, que carrega
  // tradução item por item só quando o dono abre aquele item específico
  // pra editar. Baixar/subir a planilha precisa de todas de uma vez.
  async function buscarTraducoesExistentes(): Promise<TraducaoExistente[]> {
    const { data, error } = await supabase
      .from('traducoes')
      .select('tipo_registro, registro_id, idioma, campo, valor')
      .eq('estabelecimento_id', estabelecimentoId)
    if (error) {
      logSupabaseError('Erro ao buscar traduções', error)
      return []
    }
    return data || []
  }

  async function baixarPlanilhaDeTraducao() {
    setCarregandoPlanilhaTraducao(true)
    const traducoesExistentes = await buscarTraducoesExistentes()
    const nomeArquivo = `traducoes-${new Date().toISOString().slice(0, 10)}.xlsx`
    baixarPlanilhaTraducao(categorias, itens, idiomasAtivos, traducoesExistentes, nomeArquivo)
    setCarregandoPlanilhaTraducao(false)
  }

  async function abrirModalPlanilhaTraducao() {
    setCarregandoPlanilhaTraducao(true)
    const traducoesExistentes = await buscarTraducoesExistentes()
    setTraducoesParaPlanilha(traducoesExistentes)
    setCarregandoPlanilhaTraducao(false)
    setModalPlanilhaTraducaoAberto(true)
  }

  async function aoConcluirPlanilhaTraducao() {
    await carregar()
    setMensagemPlanilha('✅ Traduções aplicadas com sucesso!')
    setTimeout(() => setMensagemPlanilha(null), 4000)
  }

  // ── RENOMEAR CATEGORIA (nome em português, inline) ──
  function iniciarEdicaoNomeCategoria(cat: Categoria) {
    setCatEditandoNome(cat.id)
    setNomeCategoriaEdicao(cat.nome)
  }

  async function salvarNomeCategoria(id: string) {
    const nome = nomeCategoriaEdicao.trim()
    if (!nome) return
    setSalvandoNomeCategoria(true)
    const { error } = await supabase.from('categorias').update({ nome }).eq('id', id)
    if (error) {
      logSupabaseError('Erro ao renomear categoria', error)
      setErro('Erro ao renomear categoria: ' + error.message)
    } else {
      setCatEditandoNome(null)
      await carregar()
    }
    setSalvandoNomeCategoria(false)
  }

  // ── FOTO DA CATEGORIA (painel inline) ──
  async function salvarFotoCategoria(id: string, fotoUrl: string) {
    const { error } = await supabase.from('categorias').update({ foto_url: fotoUrl }).eq('id', id)
    if (error) {
      logSupabaseError('Erro ao salvar foto da categoria', error)
      setErro('Erro ao salvar foto da categoria: ' + error.message)
      return
    }
    await carregar()
  }

  async function removerFotoCategoria(id: string) {
    const { error } = await supabase.from('categorias').update({ foto_url: null }).eq('id', id)
    if (error) {
      logSupabaseError('Erro ao remover foto da categoria', error)
      setErro('Erro ao remover foto da categoria: ' + error.message)
      return
    }
    await carregar()
  }

  // ── TRADUÇÕES DA CATEGORIA (painel inline) ──
  async function abrirTraducoesCategoria(categoriaId: string) {
    if (catEditandoTraducoes === categoriaId) {
      setCatEditandoTraducoes(null)
      return
    }
    const vazio: TraducoesNome = {}
    for (const idi of idiomasAtivos) vazio[idi] = { nome: '' }

    const { data } = await supabase
      .from('traducoes')
      .select('idioma, valor')
      .eq('tipo_registro', 'categoria')
      .eq('registro_id', categoriaId)
      .eq('campo', 'nome')

    for (const t of data || []) {
      if (IDIOMAS_SUPORTADOS.includes(t.idioma as Idioma)) {
        vazio[t.idioma as Idioma] = { nome: t.valor }
      }
    }

    setTraducoesCategoria(vazio)
    setCatEditandoTraducoes(categoriaId)
  }

  function atualizarTraducaoCategoria(idioma: Idioma, valor: string) {
    setTraducoesCategoria((prev) => ({ ...prev, [idioma]: { nome: valor } }))
  }

  async function salvarTraducoesCategoria(categoriaId: string) {
    setSalvandoTraducoesCategoria(true)
    try {
      await supabase.from('traducoes').delete().eq('tipo_registro', 'categoria').eq('registro_id', categoriaId)

      const linhas = idiomasAtivos
        .map((idi) => ({ idioma: idi, nome: (traducoesCategoria[idi]?.nome || '').trim() }))
        .filter((l) => l.nome)
        .map((l) => ({
          estabelecimento_id: estabelecimentoId,
          tipo_registro: 'categoria',
          registro_id: categoriaId,
          idioma: l.idioma,
          campo: 'nome',
          valor: l.nome,
        }))

      if (linhas.length > 0) {
        const { error } = await supabase.from('traducoes').upsert(linhas, {
          onConflict: 'tipo_registro,registro_id,idioma,campo',
        })
        if (error) throw new Error(error.message)
      }
      setCatEditandoTraducoes(null)
    } catch (err: unknown) {
      logSupabaseError('Erro ao salvar traduções da categoria', err)
      setErro('Erro ao salvar traduções: ' + (err instanceof Error ? err.message : String(err)))
    } finally {
      setSalvandoTraducoesCategoria(false)
    }
  }

  // ── ABRIR MODAL ──────────────────────────
  // `categoriaPadrao` é usada pelo fluxo "+ Item" da toolbar, que pede a
  // categoria antes de abrir o formulário — sem isso o modal sempre
  // cairia na primeira categoria da lista.
  async function abrirModal(item?: ItemCardapio, categoriaPadrao?: string) {
    setItemEditando(item || null)
    setFNome(item?.nome || '')
    setFDesc(item?.descricao || '')
    setFPreco(item?.preco?.toString().replace('.', ',') || '')
    setFCodigo(item?.codigo || '')
    setFCatId(item?.categoria_id || categoriaPadrao || (categorias[0]?.id ?? ''))
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
      setAlergenosSel(data?.map((a: { allergen_id: string }) => a.allergen_id) || [])
      const variacoesDoItem = (item.variacoes || []).map((v) => ({ id: v.id, nome: v.nome, preco: v.preco.toString().replace('.', ',') }))
      setVariacoes(variacoesDoItem)
      setMostrarVariacoes(variacoesDoItem.length > 0)

      const { data: vinculos } = await supabase
        .from('item_grupo_complemento')
        .select('grupo_id')
        .eq('item_id', item.id)

      const vinculadosDoItem = (vinculos || []).map((v: { grupo_id: string }) => v.grupo_id)
      setGruposVinculadosIds(vinculadosDoItem)
      setMostrarGrupos(vinculadosDoItem.length > 0)

      const traducoesIniciais: TraducoesCampos = {}
      for (const idi of idiomasAtivos) traducoesIniciais[idi] = { nome: '', descricao: '' }
      if (idiomasAtivos.length > 0) {
        const { data: trads } = await supabase
          .from('traducoes')
          .select('idioma, campo, valor')
          .eq('tipo_registro', 'item')
          .eq('registro_id', item.id)
        for (const t of trads || []) {
          if (!IDIOMAS_SUPORTADOS.includes(t.idioma as Idioma)) continue
          const idi = t.idioma as Idioma
          if (!traducoesIniciais[idi]) traducoesIniciais[idi] = { nome: '', descricao: '' }
          const campo: 'nome' | 'descricao' | null = t.campo === 'nome' || t.campo === 'descricao' ? t.campo : null
          if (campo) traducoesIniciais[idi]![campo] = t.valor
        }
      }
      setTraducoesItem(traducoesIniciais)
    } else {
      setAlergenosSel([])
      setVariacoes([])
      setGruposVinculadosIds([])
      setMostrarVariacoes(false)
      setMostrarGrupos(false)
      const vazio: TraducoesCampos = {}
      for (const idi of idiomasAtivos) vazio[idi] = { nome: '', descricao: '' }
      setTraducoesItem(vazio)
    }
    grupos.resetarEdicao()
    setModalAberto(true)
  }

  function atualizarTraducaoItem(idioma: Idioma, campo: 'nome' | 'descricao', valor: string) {
    setTraducoesItem((prev) => ({
      ...prev,
      [idioma]: { nome: prev[idioma]?.nome || '', descricao: prev[idioma]?.descricao || '', [campo]: valor },
    }))
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
      precoPromo = calcularPrecoPromocional(precoNum, fPromoTipo, descNum)
      if (precoPromo === null) { setErro('Preço promocional inválido.'); setSalvando(false); return }
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
        if (error) throw new Error(error.message)
      } else {
        const { data, error } = await supabase
          .from('itens_cardapio')
          .insert(dados)
          .select('id')
          .single()
        if (error) throw new Error(error.message)
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

      // variações de tamanho/preço (fase 1 do módulo cardápio)
      if (itemId) {
        await supabase.from('variacoes_item').delete().eq('item_id', itemId)
        const variacoesValidas = variacoes
          .filter((v) => v.nome.trim() && v.preco.trim())
          .map((v, i) => ({
            item_id: itemId,
            nome: v.nome.trim(),
            preco: parseFloat(v.preco.replace(',', '.')) || 0,
            ordem: i,
          }))
        if (variacoesValidas.length > 0) {
          const { error: variacoesError } = await supabase.from('variacoes_item').insert(variacoesValidas)
          if (variacoesError) {
            // Não interrompe o salvamento do item por causa disso — o item
            // já foi salvo com sucesso, só avisa que as variações falharam.
            logSupabaseError('Erro ao salvar variações', variacoesError)
            setErro('Item salvo, mas houve erro ao salvar as variações de tamanho: ' + variacoesError.message)
          }
        }
      }

      // grupos de complementos (fase 2) — só grava os VÍNCULOS deste item
      // com grupos que já existem no estabelecimento; criar/editar o
      // conteúdo de um grupo é uma ação à parte (salvarGrupoEstabelecimento),
      // porque o grupo é compartilhado entre vários itens.
      if (itemId) {
        await supabase.from('item_grupo_complemento').delete().eq('item_id', itemId)
        if (gruposVinculadosIds.length > 0) {
          const { error: vinculoError } = await supabase.from('item_grupo_complemento').insert(
            gruposVinculadosIds.map((grupoId, i) => ({ item_id: itemId, grupo_id: grupoId, ordem: i }))
          )
          if (vinculoError) {
            logSupabaseError('Erro ao vincular grupos de complementos', vinculoError)
            setErro('Item salvo, mas houve erro ao vincular os grupos de complementos: ' + vinculoError.message)
          }
        }
      }

      // traduções (EN/FR/ES) — mesmo padrão de sempre: apaga tudo e reinsere
      // só o que está preenchido.
      if (itemId && idiomasAtivos.length > 0) {
        await supabase.from('traducoes').delete().eq('tipo_registro', 'item').eq('registro_id', itemId)

        const linhasTraducao = idiomasAtivos.flatMap((idi) => {
          const t = traducoesItem[idi] || { nome: '', descricao: '' }
          const linhas: { estabelecimento_id: string; tipo_registro: string; registro_id: string; idioma: string; campo: string; valor: string }[] = []
          if (t.nome.trim()) {
            linhas.push({ estabelecimento_id: estabelecimentoId, tipo_registro: 'item', registro_id: itemId!, idioma: idi, campo: 'nome', valor: t.nome.trim() })
          }
          if (t.descricao.trim()) {
            linhas.push({ estabelecimento_id: estabelecimentoId, tipo_registro: 'item', registro_id: itemId!, idioma: idi, campo: 'descricao', valor: t.descricao.trim() })
          }
          return linhas
        })

        if (linhasTraducao.length > 0) {
          const { error: erroTraducoes } = await supabase.from('traducoes').upsert(linhasTraducao, {
            onConflict: 'tipo_registro,registro_id,idioma,campo',
          })
          if (erroTraducoes) {
            logSupabaseError('Erro ao salvar traduções', erroTraducoes)
            setErro('Item salvo, mas houve erro ao salvar as traduções: ' + erroTraducoes.message)
          }
        }
      }

      // Itens só renderizam com a categoria expandida (ver comentário perto
      // de `expandida &&` mais abaixo) — o botão "+ item" do cabeçalho da
      // categoria abre o modal sem expandir nada, então sem isto o item
      // salvava normal mas ficava invisível numa seção fechada, parecendo
      // que "não salvou".
      setCategoriasExpandidas(new Set([fCatId]))

      fecharModal()
      await carregar()
    } catch (err: unknown) {
      logSupabaseError('Erro ao salvar item', err)
      setErro('Erro ao salvar: ' + (err instanceof Error ? err.message : JSON.stringify(err)))
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

  // ── VARIAÇÕES DE TAMANHO/PREÇO (fase 1) ──
  function adicionarVariacao() {
    setVariacoes((prev) => [...prev, { nome: '', preco: '' }])
  }

  function atualizarVariacao(index: number, campo: 'nome' | 'preco', valor: string) {
    setVariacoes((prev) => prev.map((v, i) => (i === index ? { ...v, [campo]: valor } : v)))
  }

  function removerVariacao(index: number) {
    setVariacoes((prev) => prev.filter((_, i) => i !== index))
  }

  // ── GRUPOS DE COMPLEMENTOS REUTILIZÁVEIS (fase 2) ──

  // Liga/desliga o grupo pra ESTE item (só estado local — grava de
  // verdade quando o item é salvo, igual alérgenos/variações).
  function toggleVinculoGrupo(grupoId: string) {
    setGruposVinculadosIds((prev) =>
      prev.includes(grupoId) ? prev.filter((id) => id !== grupoId) : [...prev, grupoId]
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

      {mensagemPlanilha && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
          {mensagemPlanilha}
        </div>
      )}

      <CardapioToolbar
        readOnly={readOnly}
        loading={loading}
        menuId={menuId}
        categorias={categorias}
        idiomasAtivos={idiomasAtivos}
        carregandoPlanilhaTraducao={carregandoPlanilhaTraducao}
        itensPorCategoria={(catId) => itensDaCategoria(catId).length}
        onBaixarPlanilha={baixarPlanilha}
        onAbrirModalPlanilha={() => setModalPlanilhaAberto(true)}
        onBaixarPlanilhaTraducao={baixarPlanilhaDeTraducao}
        onAbrirModalPlanilhaTraducao={abrirModalPlanilhaTraducao}
        onCriarCategoria={criarCategoria}
        onAdicionarItem={(catId) => abrirModal(undefined, catId)}
        onIrParaCategoria={irParaCategoria}
        onExpandirTodas={expandirTodas}
        onRecolherTodas={recolherTodas}
      />

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
          const expandida = categoriasExpandidas.has(cat.id)
          return (
            <CategoriaBloco
              key={cat.id}
              cat={cat}
              catItens={catItens}
              expandida={expandida}
              readOnly={readOnly}
              idiomasAtivos={idiomasAtivos}
              refCallback={(el) => { categoriaRefs.current[cat.id] = el }}
              onToggleExpandida={() => toggleCategoriaExpandida(cat.id)}
              catEditandoNome={catEditandoNome}
              nomeCategoriaEdicao={nomeCategoriaEdicao}
              setNomeCategoriaEdicao={setNomeCategoriaEdicao}
              salvandoNomeCategoria={salvandoNomeCategoria}
              onIniciarEdicaoNomeCategoria={iniciarEdicaoNomeCategoria}
              onSalvarNomeCategoria={salvarNomeCategoria}
              onCancelarEdicaoNome={() => setCatEditandoNome(null)}
              catEditandoFoto={catEditandoFoto}
              onToggleFotoCategoria={(id) => setCatEditandoFoto(catEditandoFoto === id ? null : id)}
              onSalvarFotoCategoria={salvarFotoCategoria}
              onRemoverFotoCategoria={removerFotoCategoria}
              catEditandoTraducoes={catEditandoTraducoes}
              traducoesCategoria={traducoesCategoria}
              onAbrirTraducoesCategoria={abrirTraducoesCategoria}
              onAtualizarTraducaoCategoria={atualizarTraducaoCategoria}
              onSalvarTraducoesCategoria={salvarTraducoesCategoria}
              salvandoTraducoesCategoria={salvandoTraducoesCategoria}
              onCancelarTraducoes={() => setCatEditandoTraducoes(null)}
              onDeletarCategoria={deletarCategoria}
              onAdicionarItem={(catId) => abrirModal(undefined, catId)}
              onEditarItem={(item) => abrirModal(item)}
              onToggleDisponivel={toggleDisponivel}
              onTogglePromo={marcarPromo}
              onDeletarItem={deletarItem}
            />
          )
        })
      )}

      {/* MODAL DE EDIÇÃO */}
      {modalAberto && (
        <ModalItem
          item={itemEditando}
          categorias={categorias}
          alergenos={alergenos}
          itensDisponiveis={itens}
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
          variacoesAtivado={variacoesAtivado}
          variacoes={variacoes}
          adicionarVariacao={adicionarVariacao}
          atualizarVariacao={atualizarVariacao}
          removerVariacao={removerVariacao}
          mostrarVariacoes={mostrarVariacoes}
          setMostrarVariacoes={setMostrarVariacoes}
          complementosAtivado={complementosAtivado}
          gruposEstabelecimento={grupos.gruposEstabelecimento}
          gruposVinculadosIds={gruposVinculadosIds}
          toggleVinculoGrupo={toggleVinculoGrupo}
          grupoEditandoIndex={grupos.grupoEditandoIndex}
          setGrupoEditandoIndex={grupos.setGrupoEditandoIndex}
          iniciarNovoGrupo={grupos.iniciarNovoGrupo}
          atualizarCampoGrupoEditando={grupos.atualizarCampoGrupoEditando}
          adicionarOpcaoNoGrupoEditando={grupos.adicionarOpcaoNoGrupoEditando}
          atualizarOpcaoNoGrupoEditando={grupos.atualizarOpcaoNoGrupoEditando}
          removerOpcaoNoGrupoEditando={grupos.removerOpcaoNoGrupoEditando}
          salvarGrupoEstabelecimento={grupos.salvarGrupoEstabelecimento}
          excluirGrupoEstabelecimento={grupos.excluirGrupoEstabelecimento}
          salvandoGrupo={grupos.salvandoGrupo}
          mostrarGrupos={mostrarGrupos}
          setMostrarGrupos={setMostrarGrupos}
          opcoesExtraExpandidas={grupos.opcoesExtraExpandidas}
          toggleExtraDaOpcao={grupos.toggleExtraDaOpcao}
          gruposExtrasPorOpcao={grupos.gruposExtrasPorOpcao}
          toggleGrupoExtra={grupos.toggleGrupoExtra}
          idiomasAtivos={idiomasAtivos}
          traducoesItem={traducoesItem}
          atualizarTraducaoItem={atualizarTraducaoItem}
        />
      )}

      {modalPlanilhaAberto && menuId && (
        <SubirPlanilhaModal
          menuId={menuId}
          categorias={categorias}
          itens={itens}
          onFechar={() => setModalPlanilhaAberto(false)}
          onConcluido={aoConcluirPlanilha}
        />
      )}

      {modalPlanilhaTraducaoAberto && (
        <SubirPlanilhaTraducaoModal
          estabelecimentoId={estabelecimentoId}
          categorias={categorias}
          itens={itens}
          traducoesExistentes={traducoesParaPlanilha}
          onFechar={() => setModalPlanilhaTraducaoAberto(false)}
          onConcluido={aoConcluirPlanilhaTraducao}
        />
      )}
    </div>
  )
}
