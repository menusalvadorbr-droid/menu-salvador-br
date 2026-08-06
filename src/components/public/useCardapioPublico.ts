'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { lerCache, escreverCache, derivarRefItens, type CategoriaCache } from '@/lib/cardapioCache'
import {
  buscarReferenciaCardapio,
  buscarItensPorIds,
  buscarCardapioInicial,
} from '@/app/(public-cardapio)/cardapio/[slug]/cardapioPublicoActions'
import { buscarItensCategoriaPublica } from '@/app/(public-cardapio)/cardapio/[slug]/buscarItensCategoria'
import type { ItemCardapioBruto } from '@/lib/resolverItemCardapio'

export interface DadosIniciaisServidor {
  menuId: string | null
  categorias: CategoriaCache[]
  itensPorCategoria: Record<string, ItemCardapioBruto[]>
}

interface UseCardapioPublicoOpts {
  estabelecimentoId: string
  /** true = modo Pílulas: carrega o cardápio inteiro de cara (é assim
   *  que esse modo sempre funcionou). false/omitido = Faixas/Cards: só
   *  busca a categoria quando `garantirCategoria` é chamado — cardápio
   *  grande não carrega tudo de uma vez. */
  eager?: boolean
  /** Só o modo Pílulas passa isso — dado que acabou de sair do servidor
   *  neste mesmo request, então não tem porquê rodar checagem de entrada
   *  em cima dele (não tem como estar desatualizado). */
  dadosIniciaisServidor?: DadosIniciaisServidor
}

/**
 * Cache persistente (localStorage, sem expiração por tempo) do cardápio
 * público + Realtime — objetivo é reduzir consulta repetida ao banco sem
 * arriscar mostrar dado desatualizado. Duas camadas de frescor:
 *
 * 1. Checagem de entrada: toda vez que o hook monta com cache já
 *    guardado, compara id+updated_at de cada item/categoria contra o que
 *    tem em mãos (buscarReferenciaCardapio, consulta leve — sem foto/
 *    descrição/joins). O que mudou ou é novo ganha um fetch completo só
 *    dele (buscarItensPorIds); o que sumiu é removido do cache; o que
 *    não mudou nem é tocado.
 * 2. Realtime: enquanto a aba fica aberta, INSERT/UPDATE/DELETE em
 *    itens_cardapio/categorias chegam ao vivo, substituindo qualquer
 *    checagem por tempo — ninguém precisa perguntar "mudou?" de novo até
 *    a próxima entrada.
 *
 * Sem persistência entre estabelecimentos diferentes (chave própria por
 * estabelecimentoId) nem expiração por idade — o cache pode durar dias,
 * porque frescor não depende de prazo, depende dessas duas checagens.
 */
export function useCardapioPublico({ estabelecimentoId, eager, dadosIniciaisServidor }: UseCardapioPublicoOpts) {
  const [categorias, setCategorias] = useState<CategoriaCache[]>(dadosIniciaisServidor?.categorias || [])
  const [itensPorCategoria, setItensPorCategoria] = useState<Record<string, ItemCardapioBruto[]>>(
    dadosIniciaisServidor?.itensPorCategoria || {}
  )
  const [carregandoInicial, setCarregandoInicial] = useState(!dadosIniciaisServidor)
  const [carregandoCategoriaId, setCarregandoCategoriaId] = useState<string | null>(null)
  const [menuId, setMenuId] = useState<string | null>(dadosIniciaisServidor?.menuId ?? null)

  const supabaseRef = useRef(createClient())
  // Espelham o estado mais recente pra uso dentro do listener de Realtime
  // (registrado uma vez, não pode depender de closure presa no valor de
  // quando foi criado) sem precisar re-registrar o canal a cada mudança.
  // Atualizados num efeito (não direto no corpo do render) — mutar
  // ref.current durante o render é um efeito colateral, proibido pelas
  // regras de hooks mais recentes.
  const categoriasRef = useRef(categorias)
  const itensPorCategoriaRef = useRef(itensPorCategoria)
  const eagerRef = useRef(eager)
  useEffect(() => {
    categoriasRef.current = categorias
    itensPorCategoriaRef.current = itensPorCategoria
    eagerRef.current = eager
  })

  const persistir = useCallback(
    (cats: CategoriaCache[], itens: Record<string, ItemCardapioBruto[]>) => {
      escreverCache(estabelecimentoId, { versao: 1, categorias: cats, itensPorCategoria: itens })
    },
    [estabelecimentoId]
  )

  // Junta itens novos/atualizados no estado (substitui por id se já
  // existia) — usado pela reconciliação e pelo Realtime (INSERT/UPDATE).
  const mesclarItens = useCallback(
    (novos: ItemCardapioBruto[]) => {
      if (novos.length === 0) return
      setItensPorCategoria((prev) => {
        const proximo = { ...prev }
        for (const item of novos) {
          const lista = proximo[item.categoria_id] ? [...proximo[item.categoria_id]] : []
          const idx = lista.findIndex((i) => i.id === item.id)
          if (idx >= 0) lista[idx] = item
          else lista.push(item)
          lista.sort((a, b) => a.ordem - b.ordem)
          proximo[item.categoria_id] = lista
        }
        persistir(categoriasRef.current, proximo)
        return proximo
      })
    },
    [persistir]
  )

  // Remove itens por id de onde quer que estejam — não depende de saber
  // a categoria de antemão (o DELETE do Realtime só garante o id na
  // carga útil). Cobre remoção de verdade E item que ficou indisponível,
  // mesmo efeito prático no cardápio público.
  const removerItens = useCallback(
    (ids: string[]) => {
      if (ids.length === 0) return
      const idsSet = new Set(ids)
      setItensPorCategoria((prev) => {
        const proximo: Record<string, ItemCardapioBruto[]> = {}
        for (const [catId, itens] of Object.entries(prev)) {
          proximo[catId] = itens.filter((i) => !idsSet.has(i.id))
        }
        persistir(categoriasRef.current, proximo)
        return proximo
      })
    },
    [persistir]
  )

  // Busca os itens de UMA categoria ainda não vista — chamado pelas
  // faixas expansíveis e pela página de categoria (Cards) ao abrir. Se
  // já está em cache (por reconciliação ou visita anterior), não faz
  // nada; quem quiser forçar já teria removido do cache antes.
  const garantirCategoria = useCallback(
    async (categoriaId: string) => {
      if (itensPorCategoriaRef.current[categoriaId]) return
      setCarregandoCategoriaId(categoriaId)
      const itens = await buscarItensCategoriaPublica(categoriaId)
      setItensPorCategoria((prev) => {
        const proximo = { ...prev, [categoriaId]: itens }
        persistir(categoriasRef.current, proximo)
        return proximo
      })
      setCarregandoCategoriaId((atual) => (atual === categoriaId ? null : atual))
    },
    [persistir]
  )

  // ── Reconciliação — diff contra a referência atual do servidor.
  // Recebe o estado "de partida" explícito (em vez de ler refs) porque é
  // chamada logo depois de popular o cache pela primeira vez na mesma
  // função assíncrona, antes de qualquer re-render sincronizar os refs.
  const reconciliar = useCallback(
    async (categoriasBase: CategoriaCache[], itensBase: Record<string, ItemCardapioBruto[]>) => {
      const referencia = await buscarReferenciaCardapio(estabelecimentoId)
      if (referencia.menuId) setMenuId(referencia.menuId)

      const catIdsAtuais = new Set(referencia.categorias.map((c) => c.id))
      const categoriasSumidasIds = categoriasBase.filter((c) => !catIdsAtuais.has(c.id)).map((c) => c.id)

      const refAtual = new Map(referencia.itensRef.map((r) => [r.id, r]))
      const refConhecida = derivarRefItens(itensBase)
      const categoriasCarregadas = new Set(Object.keys(itensBase))

      const idsNovosOuAlterados: string[] = []
      for (const [id, r] of refAtual) {
        if (refConhecida[id] !== r.updated_at) idsNovosOuAlterados.push(id)
      }
      const idsSumidos = Object.keys(refConhecida).filter((id) => !refAtual.has(id))

      setCategorias(referencia.categorias)

      if (categoriasSumidasIds.length > 0 || idsSumidos.length > 0) {
        setItensPorCategoria((prev) => {
          const proximo = { ...prev }
          for (const catId of categoriasSumidasIds) delete proximo[catId]
          for (const id of idsSumidos) {
            for (const catId of Object.keys(proximo)) {
              proximo[catId] = proximo[catId].filter((i) => i.id !== id)
            }
          }
          persistir(referencia.categorias, proximo)
          return proximo
        })
      } else {
        persistir(referencia.categorias, itensBase)
      }

      // Só busca completo de quem já estava carregado (categoria aberta/
      // vista antes) ou, no modo eager, de qualquer novo/alterado — uma
      // categoria nunca vista continua lazy, fica pro garantirCategoria.
      const idsParaBuscar = idsNovosOuAlterados.filter((id) => {
        if (eagerRef.current) return true
        const catId = refAtual.get(id)?.categoria_id
        return catId ? categoriasCarregadas.has(catId) : false
      })
      if (idsParaBuscar.length > 0) {
        const itensAtualizados = await buscarItensPorIds(idsParaBuscar)
        mesclarItens(itensAtualizados)
        const idsRetornados = new Set(itensAtualizados.map((i) => i.id))
        const idsQueSumiramNaBusca = idsParaBuscar.filter((id) => !idsRetornados.has(id))
        removerItens(idsQueSumiramNaBusca)
      }

      // Modo eager: categoria criada depois da última visita também
      // precisa ser buscada de cara — não existe "abrir a faixa" nesse
      // modo pra disparar isso sozinho.
      if (eagerRef.current) {
        const categoriasNovas = referencia.categorias.filter((c) => !categoriasBase.some((b) => b.id === c.id))
        for (const cat of categoriasNovas) {
          const itens = await buscarItensCategoriaPublica(cat.id)
          mesclarItens(itens)
        }
      }
    },
    [estabelecimentoId, mesclarItens, removerItens, persistir]
  )

  // ── Carga inicial ──────────────────────────────────────────────────
  useEffect(() => {
    let cancelado = false

    async function iniciar() {
      if (dadosIniciaisServidor) {
        persistir(dadosIniciaisServidor.categorias, dadosIniciaisServidor.itensPorCategoria)
        setCarregandoInicial(false)
        return
      }

      const cache = lerCache(estabelecimentoId)
      if (cache.categorias.length > 0) {
        if (cancelado) return
        setCategorias(cache.categorias)
        setItensPorCategoria(cache.itensPorCategoria)
        setCarregandoInicial(false)
        await reconciliar(cache.categorias, cache.itensPorCategoria)
        return
      }

      if (eager) {
        const dados = await buscarCardapioInicial(estabelecimentoId)
        if (cancelado) return
        setMenuId(dados.menuId)
        setCategorias(dados.categorias)
        setItensPorCategoria(dados.itensPorCategoria)
        persistir(dados.categorias, dados.itensPorCategoria)
        setCarregandoInicial(false)
        return
      }

      // Faixas/Cards sem nenhum cache ainda: só a referência leve
      // (categorias completas + menuId) — os itens de cada categoria só
      // são buscados quando ela for realmente aberta.
      const referencia = await buscarReferenciaCardapio(estabelecimentoId)
      if (cancelado) return
      setMenuId(referencia.menuId)
      setCategorias(referencia.categorias)
      persistir(referencia.categorias, {})
      setCarregandoInicial(false)
    }

    iniciar()
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estabelecimentoId])

  // ── Realtime — substitui qualquer checagem repetida por tempo durante
  // a visita; encerra a inscrição ao desmontar (sair da página). ──────
  useEffect(() => {
    if (!menuId) return
    const supabase = supabaseRef.current

    const canal = supabase
      .channel(`cardapio-publico-${estabelecimentoId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'categorias', filter: `menu_id=eq.${menuId}` },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            const idRemovido = (payload.old as { id?: string })?.id
            if (!idRemovido) return
            setCategorias((prev) => {
              const proximo = prev.filter((c) => c.id !== idRemovido)
              persistir(proximo, itensPorCategoriaRef.current)
              return proximo
            })
            setItensPorCategoria((prev) => {
              if (!(idRemovido in prev)) return prev
              const proximo = { ...prev }
              delete proximo[idRemovido]
              return proximo
            })
            return
          }
          const nova = payload.new as CategoriaCache
          setCategorias((prev) => {
            const idx = prev.findIndex((c) => c.id === nova.id)
            const proximo =
              idx >= 0 ? prev.map((c) => (c.id === nova.id ? nova : c)) : [...prev, nova].sort((a, b) => a.ordem - b.ordem)
            persistir(proximo, itensPorCategoriaRef.current)
            return proximo
          })
        }
      )
      .on(
        'postgres_changes',
        // Sem filtro server-side aqui de propósito: itens_cardapio não
        // tem estabelecimento_id direto (só categoria_id), e a lista de
        // categorias pode crescer durante a visita — filtrar pelo id de
        // categoria em `in.(...)` exigiria reabrir o canal a cada
        // categoria nova. Filtra client-side (`pertence`, abaixo) contra
        // as categorias já conhecidas.
        { event: '*', schema: 'public', table: 'itens_cardapio' },
        async (payload) => {
          if (payload.eventType === 'DELETE') {
            const idRemovido = (payload.old as { id?: string })?.id
            if (idRemovido) removerItens([idRemovido])
            return
          }
          const linha = payload.new as { id: string; categoria_id: string; disponivel: boolean }
          const pertence = categoriasRef.current.some((c) => c.id === linha.categoria_id)
          if (!pertence) return
          if (!linha.disponivel) {
            removerItens([linha.id])
            return
          }
          // Categoria nunca aberta nesta navegação: não busca agora,
          // garantirCategoria cuida disso quando for aberta.
          if (!eagerRef.current && !itensPorCategoriaRef.current[linha.categoria_id]) return
          const itensCompletos = await buscarItensPorIds([linha.id])
          if (itensCompletos.length > 0) mesclarItens(itensCompletos)
          else removerItens([linha.id]) // ficou indisponível entre o evento e a busca
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(canal)
    }
  }, [estabelecimentoId, menuId, persistir, mesclarItens, removerItens])

  return {
    categorias,
    itensPorCategoria,
    carregandoInicial,
    carregandoCategoriaId,
    garantirCategoria,
  }
}
