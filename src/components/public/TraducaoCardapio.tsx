'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'

export type IdiomaCardapio = 'pt' | 'en' | 'fr' | 'es'

const IDIOMAS_SUPORTADOS: readonly IdiomaCardapio[] = ['en', 'fr', 'es']
const IDIOMA_SIGLA: Record<IdiomaCardapio, string> = { pt: 'PT', en: 'EN', fr: 'FR', es: 'ES' }

/**
 * Só chamada no cliente (dentro de um efeito, nunca no initializer do
 * useState nem durante o render). Olha navigator.languages em ordem de
 * preferência do usuário e usa a primeira que bater com 'pt' ou com um dos
 * idiomas ativados pra esse cardápio — sem isso, um estabelecimento que só
 * ativou 'es' não deveria mudar o idioma pra alguém com o navegador em
 * inglês, por exemplo.
 */
function detectarIdiomaNavegador(idiomasAtivos: string[]): IdiomaCardapio | null {
  if (typeof navigator === 'undefined') return null
  const candidatos = navigator.languages && navigator.languages.length > 0 ? navigator.languages : [navigator.language]

  for (const cand of candidatos) {
    if (!cand) continue
    const base = cand.slice(0, 2).toLowerCase()
    if (base === 'pt') return 'pt'
    if ((IDIOMAS_SUPORTADOS as readonly string[]).includes(base) && idiomasAtivos.includes(base)) {
      return base as IdiomaCardapio
    }
  }
  return null
}

export interface TraducaoRow {
  tipo_registro: 'item' | 'categoria'
  registro_id: string
  idioma: string
  campo: 'nome' | 'descricao'
  valor: string
}

/**
 * Texto fixo da interface da plataforma (rótulos, botões, dias da semana)
 * — diferente de TraducaoRow, que é conteúdo específico de um
 * estabelecimento (nome/descrição de item ou categoria). Uma chave só,
 * traduzida uma vez pelo admin geral em /admin/traducoes-interface, vale
 * pra qualquer cardápio da plataforma.
 */
export interface TraducaoInterfaceRow {
  chave: string
  idioma: string
  valor: string
}

interface TraducaoContextValue {
  idioma: IdiomaCardapio
  setIdioma: (idioma: IdiomaCardapio) => void
  traduzir: (tipo: 'item' | 'categoria', id: string, campo: 'nome' | 'descricao', original: string) => string
  traduzirInterface: (chave: string, original: string, vars?: Record<string, string | number>) => string
}

const TraducaoContext = createContext<TraducaoContextValue | null>(null)

/**
 * Envolve a página pública do cardápio. Guarda a escolha de idioma em
 * localStorage com chave por slug (não misturar preferência entre
 * estabelecimentos diferentes). Primeira renderização é sempre 'pt' — o
 * valor salvo (ou, na ausência dele, o idioma detectado do navegador) só é
 * lido depois de montar no cliente, então pode haver uma troca visível
 * logo após o carregamento; é o comportamento esperado pra uma preferência
 * guardada/detectada só no navegador, sem existir no servidor pra
 * renderizar de primeira.
 */
export function TraducaoProvider({
  slug,
  idiomasAtivos,
  traducoes,
  traducoesInterface = [],
  children,
}: {
  slug: string
  idiomasAtivos: string[]
  traducoes: TraducaoRow[]
  traducoesInterface?: TraducaoInterfaceRow[]
  children: React.ReactNode
}) {
  const [idioma, setIdiomaState] = useState<IdiomaCardapio>('pt')
  const chave = `idioma-cardapio:${slug}`

  useEffect(() => {
    // Leitura de localStorage/navigator não pode ir num initializer de
    // useState (não existe 'window'/'navigator' no servidor) — precisa ser
    // depois de montar, senão a primeira renderização no cliente diverge
    // da renderização do servidor (hydration mismatch). O flash de 'pt'
    // até esse efeito rodar é esperado, é o preço de decidir isso só no
    // navegador.
    const salvo = window.localStorage.getItem(chave)
    if (salvo === 'pt' || (salvo && idiomasAtivos.includes(salvo))) {
      // Preferência salva manualmente sempre vence a detecção — quem já
      // escolheu uma vez não deve ser sobrescrito nas próximas visitas.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIdiomaState(salvo as IdiomaCardapio)
      return
    }

    // Sem preferência salva: detecta pelo navegador e usa só como idioma
    // inicial dessa visita — não grava em localStorage sozinho, pra não
    // virar uma "escolha manual" antes que o usuário realmente escolha
    // alguma coisa pelo SeletorIdioma.
    const detectado = detectarIdiomaNavegador(idiomasAtivos)
    if (detectado) {
      setIdiomaState(detectado)
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

  const mapaInterface = useMemo(() => {
    const m = new Map<string, string>()
    for (const t of traducoesInterface) {
      m.set(`${t.idioma}:${t.chave}`, t.valor)
    }
    return m
  }, [traducoesInterface])

  function traduzir(tipo: 'item' | 'categoria', id: string, campo: 'nome' | 'descricao', original: string) {
    if (idioma === 'pt') return original
    return mapa.get(`${idioma}:${tipo}:${id}:${campo}`) || original
  }

  // `vars` faz substituição simples de token — {min}/{max}/{hora}/etc no
  // texto (traduzido ou o original em português de fallback) viram o
  // valor passado. Cobre os poucos textos fixos que têm uma parte
  // dinâmica (ex: "Abre às {hora}", "escolha {min} a {max} · obrigatório"),
  // sem precisar de uma lib de i18n inteira só por causa desses casos.
  function traduzirInterface(chave: string, original: string, vars?: Record<string, string | number>) {
    const base = idioma === 'pt' ? original : mapaInterface.get(`${idioma}:${chave}`) || original
    if (!vars) return base
    return Object.entries(vars).reduce((acc, [k, v]) => acc.replaceAll(`{${k}}`, String(v)), base)
  }

  return (
    <TraducaoContext.Provider value={{ idioma, setIdioma, traduzir, traduzirInterface }}>
      {children}
    </TraducaoContext.Provider>
  )
}

export function useTraducao(): TraducaoContextValue {
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

/**
 * Mesma ideia de `Texto`, mas pra texto fixo da interface (não vem do
 * banco por estabelecimento) — rótulos, botões, dias da semana etc.
 * `children` é o texto original em português, usado como fallback quando
 * a chave ainda não tem tradução cadastrada pro idioma atual.
 */
export function TextoInterface({
  chave,
  vars,
  children,
}: {
  chave: string
  vars?: Record<string, string | number>
  children: string
}) {
  const { traduzirInterface } = useTraducao()
  return <>{traduzirInterface(chave, children, vars)}</>
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
