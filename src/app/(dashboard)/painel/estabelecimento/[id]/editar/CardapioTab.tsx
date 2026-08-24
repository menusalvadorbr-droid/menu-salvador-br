'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ChevronRight, Plus, Download, Upload, Globe } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { logSupabaseError } from '@/lib/supabase/logError'
import ImageUpload from '@/app/(dashboard)/painel/components/ImageUpload'
import { baixarPlanilhaCardapio } from './planilha/planilhaCardapio'
import SubirPlanilhaModal from './planilha/SubirPlanilhaModal'
import { baixarPlanilhaTraducao, type TraducaoExistente } from './planilha/planilhaTraducao'
import SubirPlanilhaTraducaoModal from './planilha/SubirPlanilhaTraducaoModal'
import ItemRow from './ItemRow'
import ModalItem from './ModalItem'
import BlocoTraducoes from './BlocoTraducoes'
import {
  IDIOMAS_SUPORTADOS, type Idioma, type TraducoesCampos, type TraducoesNome,
  type Categoria, type VariacaoItem, type GrupoComplemento, type ItemCardapio, type Alergeno,
} from './cardapioTipos'

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
  const [gruposEstabelecimento, setGruposEstabelecimento] = useState<GrupoComplemento[]>([])
  const [gruposVinculadosIds, setGruposVinculadosIds] = useState<string[]>([])
  const [grupoEditandoIndex, setGrupoEditandoIndex] = useState<number | null>(null)
  const [salvandoGrupo, setSalvandoGrupo] = useState(false)
  // Editor progressivo — as seções de tamanhos/grupos só aparecem abertas
  // de cara quando o item editado já tem algo configurado; senão ficam
  // atrás de um link, pra não poluir o formulário de item por padrão.
  const [mostrarVariacoes, setMostrarVariacoes] = useState(false)
  const [mostrarGrupos, setMostrarGrupos] = useState(false)
  // Grupo(s) extra vinculado(s) por opção (opcao_grupo_complemento) — ex:
  // escolher "Carne X" dentro de "Proteína base" libera o grupo "Ponto da
  // carne". Carregado sob demanda quando o dono expande essa opção.
  const [gruposExtrasPorOpcao, setGruposExtrasPorOpcao] = useState<Record<string, string[]>>({})
  const [opcoesExtraExpandidas, setOpcoesExtraExpandidas] = useState<string[]>([])

  // UI – nova categoria (campo fica escondido atrás de um botão, só
  // aparece quando o dono clica "Adicionar categoria" — layout pensado
  // pra celular, onde um formulário sempre visível ocupa espaço demais)
  const [novaCategoria, setNovaCategoria]       = useState('')
  const [criandoCategoria, setCriandoCategoria] = useState(false)
  const [erroCategoria, setErroCategoria]       = useState<string | null>(null)
  const [mostrarFormCategoria, setMostrarFormCategoria] = useState(false)

  // UI – novo item: primeiro escolhe a categoria (campo compacto atrás de
  // um botão), só depois abre o modal completo com os dados do item.
  const [mostrarSeletorItemCategoria, setMostrarSeletorItemCategoria] = useState(false)
  const [categoriaParaNovoItem, setCategoriaParaNovoItem] = useState('')

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
      const { data: gruposData } = await supabase
        .from('grupos_complementos')
        .select('id, nome, selecao_minima, selecao_maxima, ordem, opcoes_complemento(id, item_id, preco_adicional, exibir_preco, ordem, itens_cardapio(nome))')
        .eq('estabelecimento_id', estabelecimentoId)
        .order('ordem', { ascending: true })

      setGruposEstabelecimento(
        (gruposData || []).map((g: any) => ({
          id: g.id,
          nome: g.nome,
          selecaoMinima: String(g.selecao_minima ?? 0),
          selecaoMaxima: String(g.selecao_maxima ?? 1),
          opcoes: (g.opcoes_complemento || [])
            .sort((a: any, b: any) => a.ordem - b.ordem)
            .map((o: any) => ({
              id: o.id,
              itemId: o.item_id,
              itemNome: o.itens_cardapio?.nome || '',
              precoAdicional: String(o.preco_adicional ?? 0).replace('.', ','),
              exibirPreco: o.exibir_preco ?? true,
            })),
        }))
      )

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
  async function criarCategoria(): Promise<boolean> {
    const nome = novaCategoria.trim()
    if (!nome) return false
    if (!menuId) {
      setErroCategoria('Menu não carregado ainda. Aguarde.')
      return false
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

    let sucesso = false
    if (error) {
      logSupabaseError('Erro ao criar categoria', error)
      setErroCategoria('Erro ao criar: ' + error.message)
    } else {
      setNovaCategoria('')
      await carregar()
      sucesso = true
    }
    setCriandoCategoria(false)
    return sucesso
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
    } catch (err: any) {
      logSupabaseError('Erro ao salvar traduções da categoria', err)
      setErro('Erro ao salvar traduções: ' + err.message)
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
      setAlergenosSel(data?.map((a: any) => a.allergen_id) || [])
      const variacoesDoItem = (item.variacoes || []).map((v) => ({ id: v.id, nome: v.nome, preco: v.preco.toString().replace('.', ',') }))
      setVariacoes(variacoesDoItem)
      setMostrarVariacoes(variacoesDoItem.length > 0)

      const { data: vinculos } = await supabase
        .from('item_grupo_complemento')
        .select('grupo_id')
        .eq('item_id', item.id)

      const vinculadosDoItem = (vinculos || []).map((v: any) => v.grupo_id)
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
    setGrupoEditandoIndex(null)
    setOpcoesExtraExpandidas([])
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

  // Expande/recolhe o "+ Vincular grupo obrigatório extra" de uma opção —
  // carrega os vínculos já existentes na primeira vez que abre (não a
  // cada render), igual ao resto do editor (busca sob demanda).
  async function toggleExtraDaOpcao(opcaoId: string) {
    const jaExpandida = opcoesExtraExpandidas.includes(opcaoId)
    if (jaExpandida) {
      setOpcoesExtraExpandidas((prev) => prev.filter((id) => id !== opcaoId))
      return
    }
    setOpcoesExtraExpandidas((prev) => [...prev, opcaoId])
    if (!(opcaoId in gruposExtrasPorOpcao)) {
      const { data } = await supabase
        .from('opcao_grupo_complemento')
        .select('grupo_id')
        .eq('opcao_id', opcaoId)
      setGruposExtrasPorOpcao((prev) => ({ ...prev, [opcaoId]: (data || []).map((v: { grupo_id: string }) => v.grupo_id) }))
    }
  }

  // Vínculo condicional opção → grupo extra (opcao_grupo_complemento) —
  // grava na hora, igual toggleVinculoGrupo, mas essa relação é por
  // opção específica, não pelo item inteiro, então não dá pra esperar o
  // "Salvar alterações do grupo" (que nem sabe qual opção é essa).
  async function toggleGrupoExtra(opcaoId: string, grupoId: string) {
    const atuais = gruposExtrasPorOpcao[opcaoId] || []
    const vinculado = atuais.includes(grupoId)
    setGruposExtrasPorOpcao((prev) => ({
      ...prev,
      [opcaoId]: vinculado ? atuais.filter((id) => id !== grupoId) : [...atuais, grupoId],
    }))
    if (vinculado) {
      await supabase.from('opcao_grupo_complemento').delete().eq('opcao_id', opcaoId).eq('grupo_id', grupoId)
    } else {
      await supabase.from('opcao_grupo_complemento').insert({ opcao_id: opcaoId, grupo_id: grupoId })
    }
  }

  // Abre um grupo em branco pra criar (ainda não existe no banco).
  function iniciarNovoGrupo() {
    setGruposEstabelecimento((prev) => [...prev, { nome: '', selecaoMinima: '0', selecaoMaxima: '1', opcoes: [] }])
    setGrupoEditandoIndex(gruposEstabelecimento.length)
  }

  function atualizarCampoGrupoEditando(campo: 'nome' | 'selecaoMinima' | 'selecaoMaxima', valor: string) {
    if (grupoEditandoIndex === null) return
    setGruposEstabelecimento((prev) =>
      prev.map((g, i) => (i === grupoEditandoIndex ? { ...g, [campo]: valor } : g))
    )
  }

  function adicionarOpcaoNoGrupoEditando() {
    if (grupoEditandoIndex === null) return
    setGruposEstabelecimento((prev) =>
      prev.map((g, i) => (i === grupoEditandoIndex ? { ...g, opcoes: [...g.opcoes, { itemId: '', precoAdicional: '', exibirPreco: true }] } : g))
    )
  }

  function atualizarOpcaoNoGrupoEditando(opcaoIndex: number, campo: 'itemId' | 'precoAdicional' | 'exibirPreco', valor: string | boolean) {
    if (grupoEditandoIndex === null) return
    setGruposEstabelecimento((prev) =>
      prev.map((g, i) =>
        i === grupoEditandoIndex
          ? { ...g, opcoes: g.opcoes.map((o, j) => (j === opcaoIndex ? { ...o, [campo]: valor } : o)) }
          : g
      )
    )
  }

  function removerOpcaoNoGrupoEditando(opcaoIndex: number) {
    if (grupoEditandoIndex === null) return
    setGruposEstabelecimento((prev) =>
      prev.map((g, i) => (i === grupoEditandoIndex ? { ...g, opcoes: g.opcoes.filter((_, j) => j !== opcaoIndex) } : g))
    )
  }

  // Grava de verdade no banco — afeta todos os itens que usam esse grupo,
  // por isso é uma ação separada do salvamento do item.
  async function salvarGrupoEstabelecimento(index: number) {
    const g = gruposEstabelecimento[index]
    if (!g.nome.trim()) { setErro('Nome do grupo é obrigatório.'); return }

    setSalvandoGrupo(true)
    setErro(null)

    try {
      let grupoId = g.id

      if (grupoId) {
        const { error } = await supabase
          .from('grupos_complementos')
          .update({
            nome: g.nome.trim(),
            selecao_minima: parseInt(g.selecaoMinima) || 0,
            selecao_maxima: parseInt(g.selecaoMaxima) || 1,
          })
          .eq('id', grupoId)
        if (error) throw new Error(error.message)
      } else {
        const { data, error } = await supabase
          .from('grupos_complementos')
          .insert({
            estabelecimento_id: estabelecimentoId,
            nome: g.nome.trim(),
            selecao_minima: parseInt(g.selecaoMinima) || 0,
            selecao_maxima: parseInt(g.selecaoMaxima) || 1,
            ordem: gruposEstabelecimento.length,
          })
          .select('id')
          .single()
        if (error) throw new Error(error.message)
        grupoId = data.id
        // Grupo novo: já deixa vinculado a este item, senão o dono cria e
        // some da tela sem perceber que precisa marcar o checkbox.
        setGruposVinculadosIds((prev) => [...prev, grupoId!])
      }

      // Opções: upsert (preserva o id das que já existiam) + apaga só as
      // removidas da lista — não é mais delete-then-insert de tudo, porque
      // isso trocava o id de toda opção a cada salvamento do grupo e
      // quebrava (por CASCADE) qualquer vínculo de grupo extra
      // (opcao_grupo_complemento) que já tivesse sido configurado nela,
      // mesmo quando essa opção específica nem tinha mudado.
      const opcoesValidas = g.opcoes
        .filter((o) => o.itemId)
        .map((o, j) => ({
          ...(o.id ? { id: o.id } : {}),
          grupo_id: grupoId,
          item_id: o.itemId,
          preco_adicional: parseFloat((o.precoAdicional || '0').replace(',', '.')) || 0,
          exibir_preco: o.exibirPreco,
          ordem: j,
        }))

      const idsMantidos = opcoesValidas.filter((o): o is typeof o & { id: string } => !!o.id).map((o) => o.id)
      const { data: opcoesNoBanco } = await supabase.from('opcoes_complemento').select('id').eq('grupo_id', grupoId)
      const idsParaApagar = (opcoesNoBanco || []).map((r) => r.id).filter((id) => !idsMantidos.includes(id))
      if (idsParaApagar.length > 0) {
        await supabase.from('opcoes_complemento').delete().in('id', idsParaApagar)
      }

      if (opcoesValidas.length > 0) {
        const { error: opcoesError } = await supabase.from('opcoes_complemento').upsert(opcoesValidas)
        if (opcoesError) throw new Error(opcoesError.message)
      }

      setGrupoEditandoIndex(null)

      // Recarrega a lista de grupos do estabelecimento com os dados reais
      const { data: gruposData } = await supabase
        .from('grupos_complementos')
        .select('id, nome, selecao_minima, selecao_maxima, ordem, opcoes_complemento(id, item_id, preco_adicional, exibir_preco, ordem, itens_cardapio(nome))')
        .eq('estabelecimento_id', estabelecimentoId)
        .order('ordem', { ascending: true })

      setGruposEstabelecimento(
        (gruposData || []).map((gr: any) => ({
          id: gr.id,
          nome: gr.nome,
          selecaoMinima: String(gr.selecao_minima ?? 0),
          selecaoMaxima: String(gr.selecao_maxima ?? 1),
          opcoes: (gr.opcoes_complemento || [])
            .sort((a: any, b: any) => a.ordem - b.ordem)
            .map((o: any) => ({
              id: o.id,
              itemId: o.item_id,
              itemNome: o.itens_cardapio?.nome || '',
              precoAdicional: String(o.preco_adicional ?? 0).replace('.', ','),
              exibirPreco: o.exibir_preco ?? true,
            })),
        }))
      )
    } catch (err: any) {
      logSupabaseError('Erro ao salvar grupo de complemento', err)
      setErro('Erro ao salvar grupo: ' + err.message)
    } finally {
      setSalvandoGrupo(false)
    }
  }

  // Exclui o grupo de vez do estabelecimento — some de TODOS os itens
  // que o usavam, por isso pede confirmação bem explícita.
  async function excluirGrupoEstabelecimento(index: number) {
    const g = gruposEstabelecimento[index]
    if (!g.id) {
      // Ainda nem foi salvo — só remove da tela.
      setGruposEstabelecimento((prev) => prev.filter((_, i) => i !== index))
      setGrupoEditandoIndex(null)
      return
    }
    if (!confirm(`Excluir o grupo "${g.nome}"? Isso remove ele de TODOS os itens que o usam, não só deste.`)) return

    await supabase.from('grupos_complementos').delete().eq('id', g.id)
    setGruposEstabelecimento((prev) => prev.filter((_, i) => i !== index))
    setGruposVinculadosIds((prev) => prev.filter((id) => id !== g.id))
    setGrupoEditandoIndex(null)
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

      {/* TOOLBAR — pensada pra celular: linhas empilhadas, e as duas ações
          que abrem formulário (categoria/item) ficam escondidas atrás de
          um botão em vez de campo sempre visível ocupando espaço. */}
      {!readOnly && (
        <div className="space-y-3">
          {/* Planilha (cardápio + tradução) */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={baixarPlanilha}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition whitespace-nowrap"
            >
              <Download className="h-4 w-4" /> Baixar planilha
            </button>
            <button
              onClick={() => setModalPlanilhaAberto(true)}
              disabled={!menuId}
              className="flex items-center gap-1.5 border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition whitespace-nowrap"
            >
              <Upload className="h-4 w-4" /> Subir planilha
            </button>

            {/* Planilha de tradução — só faz sentido com pelo menos um
                idioma ativado em Configurações → Idiomas. */}
            {idiomasAtivos.length > 0 && (
              <>
                <button
                  onClick={baixarPlanilhaDeTraducao}
                  disabled={carregandoPlanilhaTraducao}
                  className="flex items-center gap-1.5 border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition whitespace-nowrap"
                >
                  <Globe className="h-4 w-4" /> Baixar traduções
                </button>
                <button
                  onClick={abrirModalPlanilhaTraducao}
                  disabled={!menuId || carregandoPlanilhaTraducao}
                  className="flex items-center gap-1.5 border border-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition whitespace-nowrap"
                >
                  <Globe className="h-4 w-4" /> Subir traduções
                </button>
              </>
            )}
          </div>

          {/* Categoria (esquerda) e item (direita) na mesma linha — só
              quebram pra linha de baixo se a tela não comportar as duas. */}
          <div className="flex flex-wrap items-start justify-between gap-3">
            {/* Nova categoria — botão revela o campo de nome */}
            {!mostrarFormCategoria ? (
              <button
                onClick={() => setMostrarFormCategoria(true)}
                disabled={!menuId}
                className="flex items-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-700 disabled:opacity-40 transition"
              >
                <Plus className="h-4 w-4" /> Adicionar categoria
              </button>
            ) : (
              <div className="flex flex-col gap-1">
                <div className="flex flex-wrap gap-2">
                  <input
                    value={novaCategoria}
                    onChange={e => setNovaCategoria(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') criarCategoria().then(ok => ok && setMostrarFormCategoria(false))
                    }}
                    placeholder="Nome da categoria…"
                    autoFocus
                    disabled={!menuId || criandoCategoria}
                    className="flex-1 min-w-[160px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 disabled:opacity-50 bg-white text-gray-900"
                  />
                  <button
                    onClick={() => criarCategoria().then(ok => ok && setMostrarFormCategoria(false))}
                    disabled={criandoCategoria || !novaCategoria.trim() || !menuId}
                    className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 transition whitespace-nowrap"
                  >
                    {criandoCategoria ? 'Salvando…' : 'Salvar'}
                  </button>
                  <button
                    onClick={() => { setMostrarFormCategoria(false); setNovaCategoria(''); setErroCategoria(null) }}
                    className="text-sm text-gray-500 hover:underline px-1"
                  >
                    Cancelar
                  </button>
                </div>
                {erroCategoria && (
                  <p className="text-xs text-red-500">{erroCategoria}</p>
                )}
                {!menuId && !loading && (
                  <p className="text-xs text-yellow-600">⚠️ Menu não localizado — recarregue a página</p>
                )}
              </div>
            )}

            {/* Novo item — primeiro escolhe a categoria, só depois abre o
                formulário completo com os dados do item */}
            {!mostrarSeletorItemCategoria ? (
              <button
                onClick={() => {
                  setCategoriaParaNovoItem(categorias[0]?.id || '')
                  setMostrarSeletorItemCategoria(true)
                }}
                disabled={categorias.length === 0}
                title={categorias.length === 0 ? 'Crie uma categoria primeiro' : ''}
                className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 transition"
              >
                <Plus className="h-4 w-4" /> Adicionar item
              </button>
            ) : (
              <div className="flex flex-wrap gap-2">
                <select
                  value={categoriaParaNovoItem}
                  onChange={(e) => setCategoriaParaNovoItem(e.target.value)}
                  autoFocus
                  className="flex-1 min-w-[160px] border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
                >
                  {categorias.map((cat) => (
                    <option key={cat.id} value={cat.id}>{cat.nome}</option>
                  ))}
                </select>
                <button
                  onClick={() => {
                    setMostrarSeletorItemCategoria(false)
                    abrirModal(undefined, categoriaParaNovoItem)
                  }}
                  disabled={!categoriaParaNovoItem}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-40 transition whitespace-nowrap"
                >
                  Continuar
                </button>
                <button
                  onClick={() => setMostrarSeletorItemCategoria(false)}
                  className="text-sm text-gray-500 hover:underline px-1"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ATALHO DE CATEGORIA — fica fixo e visível no topo ao rolar o
          cardápio, pra achar rápido numa lista grande sem perder a
          referência de onde se está. */}
      {categorias.length > 1 && (
        <div className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-gray-100 bg-white/95 py-2 backdrop-blur">
          <select
            value=""
            onChange={(e) => { if (e.target.value) irParaCategoria(e.target.value) }}
            className="flex-1 min-w-[160px] border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-700"
          >
            <option value="">Ir para categoria…</option>
            {categorias.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nome} ({itensDaCategoria(cat.id).length})
              </option>
            ))}
          </select>
          <button
            onClick={expandirTodas}
            className="text-xs font-medium text-gray-500 hover:text-orange-600 hover:underline whitespace-nowrap"
          >
            Expandir todas
          </button>
          <span className="text-gray-300">·</span>
          <button
            onClick={recolherTodas}
            className="text-xs font-medium text-gray-500 hover:text-orange-600 hover:underline whitespace-nowrap"
          >
            Recolher todas
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
          const expandida = categoriasExpandidas.has(cat.id)
          return (
            <div
              key={cat.id}
              ref={(el) => { categoriaRefs.current[cat.id] = el }}
              className="border border-gray-200 rounded-xl overflow-hidden shadow-sm scroll-mt-4"
            >
              {/* cabeçalho */}
              <div className="bg-gray-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-gray-200">
                {/* esquerda: nome + ações sobre a categoria em si */}
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  <button
                    onClick={() => toggleCategoriaExpandida(cat.id)}
                    aria-label={expandida ? 'Recolher categoria' : 'Expandir categoria'}
                    aria-expanded={expandida}
                    className="shrink-0 rounded-lg p-1 text-gray-400 transition hover:bg-gray-200 hover:text-gray-600"
                  >
                    <ChevronRight className={`h-4 w-4 transition-transform ${expandida ? 'rotate-90' : ''}`} />
                  </button>
                  {catEditandoNome === cat.id ? (
                    <>
                      <input
                        value={nomeCategoriaEdicao}
                        onChange={(e) => setNomeCategoriaEdicao(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && salvarNomeCategoria(cat.id)}
                        autoFocus
                        className="border border-gray-300 rounded-lg px-2 py-1 text-sm font-semibold text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                      />
                      <button
                        onClick={() => salvarNomeCategoria(cat.id)}
                        disabled={salvandoNomeCategoria || !nomeCategoriaEdicao.trim()}
                        className="text-xs font-semibold text-orange-600 hover:underline disabled:opacity-50"
                      >
                        {salvandoNomeCategoria ? 'salvando…' : 'salvar'}
                      </button>
                      <button
                        onClick={() => setCatEditandoNome(null)}
                        className="text-xs text-gray-500 hover:underline"
                      >
                        cancelar
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => toggleCategoriaExpandida(cat.id)}
                      className="font-semibold text-gray-800 transition hover:text-orange-600"
                    >
                      {cat.nome}
                    </button>
                  )}
                  <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                    {catItens.length} {catItens.length === 1 ? 'item' : 'itens'}
                  </span>
                  {!readOnly && catEditandoNome !== cat.id && (
                    <div className="flex items-center gap-3 text-xs">
                      <button
                        onClick={() => iniciarEdicaoNomeCategoria(cat)}
                        className="text-gray-500 hover:underline font-medium"
                        title="Renomear categoria"
                      >
                        ✏️ editar nome
                      </button>
                      <button
                        onClick={() => setCatEditandoFoto(catEditandoFoto === cat.id ? null : cat.id)}
                        className="text-gray-500 hover:underline font-medium"
                        title="Foto da categoria (navegação por cards no cardápio público)"
                      >
                        🖼️ {cat.foto_url ? 'foto' : 'add. foto'}
                      </button>
                      {idiomasAtivos.length > 0 && (
                        <button
                          onClick={() => abrirTraducoesCategoria(cat.id)}
                          className="text-gray-500 hover:underline font-medium"
                        >
                          🌐 Traduções
                        </button>
                      )}
                      <button
                        onClick={() => deletarCategoria(cat.id)}
                        className="text-red-400 hover:text-red-600 hover:underline"
                      >
                        remover categoria
                      </button>
                    </div>
                  )}
                </div>

                {/* direita: ação separada — adicionar algo dentro da categoria */}
                {!readOnly && (
                  <button
                    onClick={() => abrirModal(undefined, cat.id)}
                    className="shrink-0 text-orange-600 hover:underline font-medium text-xs"
                  >
                    + item
                  </button>
                )}
              </div>

              {/* painel inline da foto da categoria */}
              {catEditandoFoto === cat.id && (
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs font-medium text-gray-600 mb-2">
                    🖼️ Foto da categoria — {cat.nome}
                    <span className="ml-1 font-normal text-gray-400">(usada na navegação por cards no cardápio público)</span>
                  </p>
                  <ImageUpload
                    onUpload={(url) => salvarFotoCategoria(cat.id, url)}
                    onRemove={() => removerFotoCategoria(cat.id)}
                    currentImage={cat.foto_url}
                    label="Foto da categoria"
                    aspectRatio="16:9"
                    maxSize={2}
                  />
                </div>
              )}

              {/* painel inline de traduções da categoria */}
              {catEditandoTraducoes === cat.id && (
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                  <p className="text-xs font-medium text-gray-600 mb-2">🌐 Traduções — {cat.nome}</p>
                  <BlocoTraducoes
                    idiomasAtivos={idiomasAtivos}
                    campos={['nome']}
                    valores={traducoesCategoria}
                    onChange={(idi, _campo, valor) => atualizarTraducaoCategoria(idi, valor)}
                  />
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => salvarTraducoesCategoria(cat.id)}
                      disabled={salvandoTraducoesCategoria}
                      className="text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg px-3 py-1.5 disabled:opacity-50"
                    >
                      {salvandoTraducoesCategoria ? 'Salvando…' : 'Salvar traduções'}
                    </button>
                    <button
                      onClick={() => setCatEditandoTraducoes(null)}
                      className="text-xs text-gray-500 hover:underline px-1"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}

              {/* itens — só renderiza quando a categoria está expandida */}
              {expandida && (
                catItens.length === 0 ? (
                  <div className="px-4 py-6 text-sm text-gray-400 text-center">
                    Nenhum item — clique em &quot;+ item&quot; para adicionar
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
                )
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
          gruposEstabelecimento={gruposEstabelecimento}
          gruposVinculadosIds={gruposVinculadosIds}
          toggleVinculoGrupo={toggleVinculoGrupo}
          grupoEditandoIndex={grupoEditandoIndex}
          setGrupoEditandoIndex={setGrupoEditandoIndex}
          iniciarNovoGrupo={iniciarNovoGrupo}
          atualizarCampoGrupoEditando={atualizarCampoGrupoEditando}
          adicionarOpcaoNoGrupoEditando={adicionarOpcaoNoGrupoEditando}
          atualizarOpcaoNoGrupoEditando={atualizarOpcaoNoGrupoEditando}
          removerOpcaoNoGrupoEditando={removerOpcaoNoGrupoEditando}
          salvarGrupoEstabelecimento={salvarGrupoEstabelecimento}
          excluirGrupoEstabelecimento={excluirGrupoEstabelecimento}
          salvandoGrupo={salvandoGrupo}
          mostrarGrupos={mostrarGrupos}
          setMostrarGrupos={setMostrarGrupos}
          opcoesExtraExpandidas={opcoesExtraExpandidas}
          toggleExtraDaOpcao={toggleExtraDaOpcao}
          gruposExtrasPorOpcao={gruposExtrasPorOpcao}
          toggleGrupoExtra={toggleGrupoExtra}
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
