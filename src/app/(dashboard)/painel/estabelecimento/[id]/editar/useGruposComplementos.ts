'use client'

import { useCallback, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logSupabaseError } from '@/lib/supabase/logError'
import type { GrupoComplemento } from './cardapioTipos'

// Shape cru devolvido pela query de grupos_complementos (com o embed de
// opcoes_complemento + itens_cardapio).
interface OpcaoComplementoRow {
  id: string
  item_id: string
  preco_adicional: number | null
  exibir_preco: boolean | null
  ordem: number
  itens_cardapio: { nome: string } | null
}

interface GrupoComplementoRow {
  id: string
  nome: string
  selecao_minima: number | null
  selecao_maxima: number | null
  ordem: number
  opcoes_complemento: OpcaoComplementoRow[] | null
}

function mapearGruposComplemento(gruposData: GrupoComplementoRow[] | null): GrupoComplemento[] {
  return (gruposData || []).map((g) => ({
    id: g.id,
    nome: g.nome,
    selecaoMinima: String(g.selecao_minima ?? 0),
    selecaoMaxima: String(g.selecao_maxima ?? 1),
    opcoes: (g.opcoes_complemento || [])
      .sort((a, b) => a.ordem - b.ordem)
      .map((o) => ({
        id: o.id,
        itemId: o.item_id,
        itemNome: o.itens_cardapio?.nome || '',
        precoAdicional: String(o.preco_adicional ?? 0).replace('.', ','),
        exibirPreco: o.exibir_preco ?? true,
      })),
  }))
}

/**
 * Grupos de complementos reutilizáveis (fase 2 do módulo cardápio) —
 * extraído de CardapioTab.tsx: é a parte mais isolável do arquivo (lógica
 * pura, sem JSX), mas tem 2 pontos de acoplamento real com o estado do
 * modal de item (que continua no componente pai, é dele mesmo):
 * - `gruposVinculadosIds`/`aoVincularGrupoNovo`: criar um grupo novo já
 *   deixa ele vinculado ao item que está sendo editado, senão o dono cria
 *   e some da tela sem perceber que precisa marcar o checkbox.
 * - `aoDesvincularGrupo`: excluir um grupo precisa tirar ele da lista de
 *   vinculados do item em edição também.
 * - `setErro`: continua sendo o mesmo banner de erro único do topo da
 *   aba, compartilhado com o resto do CardapioTab.
 */
export function useGruposComplementos({
  estabelecimentoId,
  setErro,
  aoVincularGrupoNovo,
  aoDesvincularGrupo,
}: {
  estabelecimentoId: string
  setErro: (msg: string | null) => void
  aoVincularGrupoNovo: (grupoId: string) => void
  aoDesvincularGrupo: (grupoId: string) => void
}) {
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [gruposEstabelecimento, setGruposEstabelecimento] = useState<GrupoComplemento[]>([])
  const [grupoEditandoIndex, setGrupoEditandoIndex] = useState<number | null>(null)
  const [salvandoGrupo, setSalvandoGrupo] = useState(false)
  const [gruposExtrasPorOpcao, setGruposExtrasPorOpcao] = useState<Record<string, string[]>>({})
  const [opcoesExtraExpandidas, setOpcoesExtraExpandidas] = useState<string[]>([])

  // useCallback com identidade estável (só muda se estabelecimentoId
  // mudar) — CardapioTab.tsx chama isto de dentro do próprio
  // useCallback de carregarDados(), então precisa de uma referência
  // estável na lista de dependências pra não recarregar em loop (o
  // objeto `grupos` retornado por este hook é recriado a cada render,
  // mas esta função específica não).
  const carregarGrupos = useCallback(async () => {
    const { data } = await supabase
      .from('grupos_complementos')
      .select('id, nome, selecao_minima, selecao_maxima, ordem, opcoes_complemento(id, item_id, preco_adicional, exibir_preco, ordem, itens_cardapio(nome))')
      .eq('estabelecimento_id', estabelecimentoId)
      .order('ordem', { ascending: true })
    setGruposEstabelecimento(mapearGruposComplemento(data as unknown as GrupoComplementoRow[] | null))
  }, [supabase, estabelecimentoId])

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
  // grava na hora, diferente do vínculo item→grupo (que só grava quando
  // o item é salvo), porque essa relação é por opção específica, não pelo
  // item inteiro, então não dá pra esperar o "Salvar alterações do grupo"
  // (que nem sabe qual opção é essa).
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
        aoVincularGrupoNovo(grupoId!)
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
      await carregarGrupos()
    } catch (err: unknown) {
      logSupabaseError('Erro ao salvar grupo de complemento', err)
      setErro('Erro ao salvar grupo: ' + (err instanceof Error ? err.message : String(err)))
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
    aoDesvincularGrupo(g.id)
    setGrupoEditandoIndex(null)
  }

  // Usado ao abrir o modal de item (novo ou existente) — nenhum grupo
  // deve ficar "em edição" nem opção "extra" expandida de uma sessão
  // anterior do modal.
  function resetarEdicao() {
    setGrupoEditandoIndex(null)
    setOpcoesExtraExpandidas([])
  }

  return {
    gruposEstabelecimento,
    grupoEditandoIndex,
    setGrupoEditandoIndex,
    resetarEdicao,
    salvandoGrupo,
    gruposExtrasPorOpcao,
    opcoesExtraExpandidas,
    carregarGrupos,
    toggleExtraDaOpcao,
    toggleGrupoExtra,
    iniciarNovoGrupo,
    atualizarCampoGrupoEditando,
    adicionarOpcaoNoGrupoEditando,
    atualizarOpcaoNoGrupoEditando,
    removerOpcaoNoGrupoEditando,
    salvarGrupoEstabelecimento,
    excluirGrupoEstabelecimento,
  }
}
