'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type IdiomaCardapio = 'pt' | 'en' | 'fr' | 'es'

const IDIOMAS_SUPORTADOS: readonly IdiomaCardapio[] = ['en', 'fr', 'es']
const IDIOMA_SIGLA: Record<IdiomaCardapio, string> = { pt: 'PT', en: 'EN', fr: 'FR', es: 'ES' }

export interface TraducaoRow {
  tipo_registro: 'item' | 'categoria'
  registro_id: string
  idioma: string
  campo: 'nome' | 'descricao'
  valor: string
}

interface TraducaoContextValue {
  idioma: IdiomaCardapio
  setIdioma: (idioma: IdiomaCardapio) => void
  traduzir: (tipo: 'item' | 'categoria', id: string, campo: 'nome' | 'descricao', original: string) => string
}

const TraducaoContext = createContext<TraducaoContextValue | null>(null)

/**
 * Envolve a página pública do cardápio. Guarda a escolha de idioma em
 * localStorage com chave por slug (não misturar preferência entre
 * estabelecimentos diferentes). Primeira renderização é sempre 'pt' — o
 * valor salvo só é lido depois de montar no cliente, então pode haver uma
 * troca visível logo após o carregamento; é o comportamento esperado pra
 * uma preferência guardada só no navegador.
 */
export function TraducaoProvider({
  slug,
  idiomasAtivos,
  traducoes,
  children,
}: {
  slug: string
  idiomasAtivos: string[]
  traducoes: TraducaoRow[]
  children: React.ReactNode
}) {
  const [idioma, setIdiomaState] = useState<IdiomaCardapio>('pt')
  const chave = `idioma-cardapio:${slug}`

  useEffect(() => {
    // Leitura de localStorage não pode ir num initializer de useState (não
    // existe 'window' no servidor) — precisa ser depois de montar, senão a
    // primeira renderização no cliente diverge da renderização do servidor
    // (hydration mismatch). O flash de 'pt' até essa leitura rodar é
    // esperado, é o preço de guardar a preferência só no navegador.
    const salvo = window.localStorage.getItem(chave)
    if (salvo === 'pt' || (salvo && idiomasAtivos.includes(salvo))) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIdiomaState(salvo as IdiomaCardapio)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave])

  function setIdioma(novo: IdiomaCardapio) {
    setIdiomaState(novo)
    window.localStorage.setItem(chave, novo)
  }

  const mapa = useMemo(() => {
    const m = new Map<string, string>()
    for (const t of traducoes) {
      m.set(`${t.idioma}:${t.tipo_registro}:${t.registro_id}:${t.campo}`, t.valor)
    }
    return m
  }, [traducoes])

  function traduzir(tipo: 'item' | 'categoria', id: string, campo: 'nome' | 'descricao', original: string) {
    if (idioma === 'pt') return original
    return mapa.get(`${idioma}:${tipo}:${id}:${campo}`) || original
  }

  return (
    <TraducaoContext.Provider value={{ idioma, setIdioma, traduzir }}>
      {children}
    </TraducaoContext.Provider>
  )
}

function useTraducao(): TraducaoContextValue {
  const ctx = useContext(TraducaoContext)
  if (!ctx) throw new Error('useTraducao precisa estar dentro de um TraducaoProvider')
  return ctx
}

/**
 * Leaf component — o resto da árvore (categorias, itens) continua
 * renderizado no servidor; só esse texto específico entra num boundary de
 * client component pra poder ler o idioma escolhido.
 */
export function Texto({
  tipo,
  id,
  campo,
  children,
}: {
  tipo: 'item' | 'categoria'
  id: string
  campo: 'nome' | 'descricao'
  children: string
}) {
  const { traduzir } = useTraducao()
  return <>{traduzir(tipo, id, campo, children)}</>
}

/** Seletor por sigla de texto (PT · EN · FR · ES), sem bandeira. PT sempre disponível. */
export function SeletorIdioma({ idiomasAtivos }: { idiomasAtivos: string[] }) {
  const { idioma, setIdioma } = useTraducao()
  if (idiomasAtivos.length === 0) return null

  const opcoes: IdiomaCardapio[] = ['pt', ...IDIOMAS_SUPORTADOS.filter((i) => idiomasAtivos.includes(i))]

  return (
    <div className="flex items-center gap-1 text-xs font-medium">
      {opcoes.map((op, i) => (
        <span key={op} className="flex items-center gap-1">
          {i > 0 && <span className="opacity-30">·</span>}
          <button
            type="button"
            onClick={() => setIdioma(op)}
            className={idioma === op ? 'underline underline-offset-2' : 'opacity-50 hover:opacity-80'}
          >
            {IDIOMA_SIGLA[op]}
          </button>
        </span>
      ))}
    </div>
  )
}
