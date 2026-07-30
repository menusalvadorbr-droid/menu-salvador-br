import * as XLSX from 'xlsx'
import type { createClient } from '@/lib/supabase/client'

const IDIOMAS_CONHECIDOS = ['en', 'fr', 'es'] as const
export type IdiomaTraducao = (typeof IDIOMAS_CONHECIDOS)[number]

export interface CategoriaTraducao {
  id: string
  nome: string
}

export interface ItemTraducao {
  id: string
  nome: string
  descricao: string | null
  categoria_id: string
}

export interface TraducaoExistente {
  tipo_registro: string
  registro_id: string
  idioma: string
  campo: string
  valor: string
}

// ─────────────────────────────────────────────
// EXPORTAR
// ─────────────────────────────────────────────

function montarCabecalho(idiomasAtivos: string[]): string[] {
  const base = ['Categoria/Item', 'Nome (PT)', 'Descrição (PT)']
  for (const idi of idiomasAtivos) {
    base.push(`Nome (${idi.toUpperCase()})`, `Descrição (${idi.toUpperCase()})`)
  }
  // "Tipo Registro" + "ID" ficam ocultas — só servem pra casar a linha de
  // volta com a categoria/item certo quando a planilha voltar.
  base.push('Tipo Registro', 'ID')
  return base
}

/**
 * Uma linha por categoria + uma linha por item, com só as colunas dos
 * idiomas ativos no estabelecimento (Configurações → Idiomas). Categoria
 * não tem campo de descrição pra traduzir — a coluna "Descrição" fica em
 * branco nessas linhas, mesma estrutura só que sem valor.
 */
export function gerarPlanilhaTraducao(
  categorias: CategoriaTraducao[],
  itens: ItemTraducao[],
  idiomasAtivos: string[],
  traducoesExistentes: TraducaoExistente[]
) {
  const mapaTrad = new Map(
    traducoesExistentes.map((t) => [`${t.tipo_registro}|${t.registro_id}|${t.idioma}|${t.campo}`, t.valor])
  )
  const trad = (tipo: string, id: string, idioma: string, campo: string) =>
    mapaTrad.get(`${tipo}|${id}|${idioma}|${campo}`) || ''

  const cabecalho = montarCabecalho(idiomasAtivos)
  const linhas: string[][] = [cabecalho]

  for (const cat of categorias) {
    const linhaCategoria: string[] = [cat.nome, cat.nome, '']
    for (const idi of idiomasAtivos) {
      linhaCategoria.push(trad('categoria', cat.id, idi, 'nome'), '')
    }
    linhaCategoria.push('categoria', cat.id)
    linhas.push(linhaCategoria)

    const itensDaCategoria = itens.filter((i) => i.categoria_id === cat.id)
    for (const item of itensDaCategoria) {
      const linhaItem: string[] = [cat.nome, item.nome, item.descricao || '']
      for (const idi of idiomasAtivos) {
        linhaItem.push(trad('item', item.id, idi, 'nome'), trad('item', item.id, idi, 'descricao'))
      }
      linhaItem.push('item', item.id)
      linhas.push(linhaItem)
    }
  }

  const planilha = XLSX.utils.aoa_to_sheet(linhas)
  const totalCols = cabecalho.length
  const cols: { wch: number; hidden?: boolean }[] = Array.from({ length: totalCols }, (_, i) => ({
    wch: i < 3 ? 24 : 20,
  }))
  cols[totalCols - 2] = { wch: 1, hidden: true }
  cols[totalCols - 1] = { wch: 1, hidden: true }
  planilha['!cols'] = cols

  const livro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(livro, planilha, 'Traduções')
  return livro
}

export function baixarPlanilhaTraducao(
  categorias: CategoriaTraducao[],
  itens: ItemTraducao[],
  idiomasAtivos: string[],
  traducoesExistentes: TraducaoExistente[],
  nomeArquivo: string
) {
  const livro = gerarPlanilhaTraducao(categorias, itens, idiomasAtivos, traducoesExistentes)
  XLSX.writeFile(livro, nomeArquivo)
}

// ─────────────────────────────────────────────
// LER O ARQUIVO SUBIDO
// ─────────────────────────────────────────────

export interface LinhaTraducaoLida {
  linha: number
  tipoRegistro: 'categoria' | 'item'
  registroId: string | null
  contexto: string // valor de "Categoria/Item" — nome da própria categoria, ou da categoria-pai do item
  nomePt: string
  traducoes: { idioma: string; nome: string; descricao: string }[]
}

export interface ResultadoLeituraTraducao {
  linhas: LinhaTraducaoLida[]
  erros: { linha: number; motivo: string }[]
}

function normalizarTexto(v: unknown): string {
  return String(v ?? '').trim()
}

function detectarColunasIdioma(cabecalho: string[]) {
  return IDIOMAS_CONHECIDOS.map((idi) => ({
    idioma: idi as string,
    idxNome: cabecalho.indexOf(`nome (${idi})`),
    idxDescricao: cabecalho.indexOf(`descrição (${idi})`),
  })).filter((c) => c.idxNome !== -1)
}

export async function lerPlanilhaTraducao(arquivo: File): Promise<ResultadoLeituraTraducao> {
  const bytes = await arquivo.arrayBuffer()
  const livro = XLSX.read(bytes, { type: 'array' })
  const planilha = livro.Sheets[livro.SheetNames[0]]
  const linhasBrutas = XLSX.utils.sheet_to_json(planilha, { header: 1, blankrows: false }) as unknown[][]

  if (linhasBrutas.length === 0) {
    return { linhas: [], erros: [{ linha: 0, motivo: 'A planilha está vazia.' }] }
  }

  const cabecalho = linhasBrutas[0].map((c) => normalizarTexto(c).toLowerCase())
  const idxContexto = cabecalho.indexOf('categoria/item')
  const idxNomePt = cabecalho.indexOf('nome (pt)')
  const idxTipo = cabecalho.indexOf('tipo registro')
  const idxId = cabecalho.indexOf('id')
  const colunasIdioma = detectarColunasIdioma(cabecalho)

  if (idxContexto === -1 || idxNomePt === -1 || idxTipo === -1) {
    return {
      linhas: [],
      erros: [{
        linha: 0,
        motivo: 'Essa planilha não parece ter sido gerada por "Baixar planilha de tradução" — faltam colunas obrigatórias.',
      }],
    }
  }

  if (colunasIdioma.length === 0) {
    return {
      linhas: [],
      erros: [{ linha: 0, motivo: 'Nenhuma coluna de idioma (Nome (EN)/(FR)/(ES)) encontrada na planilha.' }],
    }
  }

  const linhas: LinhaTraducaoLida[] = []
  const erros: { linha: number; motivo: string }[] = []

  for (let i = 1; i < linhasBrutas.length; i++) {
    const bruta = linhasBrutas[i]
    const contexto = normalizarTexto(bruta[idxContexto])
    const nomePt = normalizarTexto(bruta[idxNomePt])
    if (!contexto && !nomePt) continue // linha em branco

    const numeroLinha = i + 1
    const tipoTexto = normalizarTexto(bruta[idxTipo]).toLowerCase()
    if (tipoTexto !== 'categoria' && tipoTexto !== 'item') {
      erros.push({ linha: numeroLinha, motivo: 'Coluna oculta "Tipo Registro" ausente ou inválida — linha ignorada.' })
      continue
    }
    if (!nomePt) {
      erros.push({ linha: numeroLinha, motivo: 'Nome (PT) em branco.' })
      continue
    }

    linhas.push({
      linha: numeroLinha,
      tipoRegistro: tipoTexto,
      registroId: idxId !== -1 ? normalizarTexto(bruta[idxId]) || null : null,
      contexto,
      nomePt,
      traducoes: colunasIdioma.map(({ idioma, idxNome, idxDescricao }) => ({
        idioma,
        nome: normalizarTexto(bruta[idxNome]),
        descricao: idxDescricao !== -1 ? normalizarTexto(bruta[idxDescricao]) : '',
      })),
    })
  }

  return { linhas, erros }
}

// ─────────────────────────────────────────────
// COMPARAR COM O QUE JÁ EXISTE
// ─────────────────────────────────────────────

export interface UpsertTraducao {
  tipo_registro: string
  registro_id: string
  idioma: string
  campo: string
  valor: string
}

export interface PlanoTraducao {
  porIdioma: Record<string, { novas: number; alteradas: number }>
  linhasNaoEncontradas: { linha: number; descricao: string }[]
  upserts: UpsertTraducao[]
}

/**
 * Casa cada linha por ID (coluna oculta) — sem bater (planilha editada por
 * fora, ID apagado), cai pro nome dentro do contexto certo (categoria pelo
 * próprio nome; item pelo nome dentro da categoria indicada em "Categoria/
 * Item"). Célula de tradução em branco não apaga nada — só é considerada
 * quando tem valor preenchido, e só conta como mudança se for diferente do
 * que já está salvo.
 */
export function compararTraducoes(
  linhas: LinhaTraducaoLida[],
  categorias: CategoriaTraducao[],
  itens: ItemTraducao[],
  traducoesExistentes: TraducaoExistente[]
): PlanoTraducao {
  const catPorId = new Map(categorias.map((c) => [c.id, c]))
  const catPorNome = new Map(categorias.map((c) => [c.nome.trim().toLowerCase(), c]))
  const itemPorId = new Map(itens.map((i) => [i.id, i]))
  const mapaTrad = new Map(
    traducoesExistentes.map((t) => [`${t.tipo_registro}|${t.registro_id}|${t.idioma}|${t.campo}`, t.valor])
  )

  const porIdioma: PlanoTraducao['porIdioma'] = {}
  const upserts: UpsertTraducao[] = []
  const linhasNaoEncontradas: PlanoTraducao['linhasNaoEncontradas'] = []

  for (const linha of linhas) {
    let registroId: string | null = null

    if (linha.tipoRegistro === 'categoria') {
      const porId = linha.registroId ? catPorId.get(linha.registroId) : undefined
      const alvo = porId || catPorNome.get(linha.nomePt.trim().toLowerCase())
      registroId = alvo?.id || null
    } else {
      const porId = linha.registroId ? itemPorId.get(linha.registroId) : undefined
      const categoriaCtx = catPorNome.get(linha.contexto.trim().toLowerCase())
      const alvo =
        porId ||
        (categoriaCtx
          ? itens.find(
              (i) => i.categoria_id === categoriaCtx.id && i.nome.trim().toLowerCase() === linha.nomePt.trim().toLowerCase()
            )
          : undefined)
      registroId = alvo?.id || null
    }

    if (!registroId) {
      linhasNaoEncontradas.push({ linha: linha.linha, descricao: `${linha.contexto} → ${linha.nomePt}` })
      continue
    }

    const campos = linha.tipoRegistro === 'categoria' ? (['nome'] as const) : (['nome', 'descricao'] as const)

    for (const t of linha.traducoes) {
      for (const campo of campos) {
        const valor = (campo === 'nome' ? t.nome : t.descricao).trim()
        if (!valor) continue

        const chave = `${linha.tipoRegistro}|${registroId}|${t.idioma}|${campo}`
        const existente = mapaTrad.get(chave)
        if (existente === valor) continue

        if (!porIdioma[t.idioma]) porIdioma[t.idioma] = { novas: 0, alteradas: 0 }
        if (existente === undefined) porIdioma[t.idioma].novas++
        else porIdioma[t.idioma].alteradas++

        upserts.push({ tipo_registro: linha.tipoRegistro, registro_id: registroId, idioma: t.idioma, campo, valor })
      }
    }
  }

  return { porIdioma, linhasNaoEncontradas, upserts }
}

// ─────────────────────────────────────────────
// APLICAR (só chamado depois do dono confirmar)
// ─────────────────────────────────────────────

export async function aplicarPlanoTraducao(
  supabase: ReturnType<typeof createClient>,
  estabelecimentoId: string,
  plano: PlanoTraducao
): Promise<{ erro?: string }> {
  if (plano.upserts.length === 0) return {}

  const linhas = plano.upserts.map((u) => ({ estabelecimento_id: estabelecimentoId, ...u }))
  const { error } = await supabase
    .from('traducoes')
    .upsert(linhas, { onConflict: 'tipo_registro,registro_id,idioma,campo' })

  if (error) return { erro: error.message }
  return {}
}
