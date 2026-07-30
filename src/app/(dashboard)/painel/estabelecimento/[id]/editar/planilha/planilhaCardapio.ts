import * as XLSX from 'xlsx'
import type { createClient } from '@/lib/supabase/client'

// Tipos mínimos, estruturalmente compatíveis com Categoria/ItemCardapio
// de CardapioTab.tsx — não importa de lá pra não criar acoplamento com
// os campos de promoção/complemento/etc que esse módulo não usa.
export interface CategoriaPlanilha {
  id: string
  nome: string
}

export interface ItemPlanilha {
  id: string
  nome: string
  descricao: string | null
  preco: number
  categoria_id: string
  disponivel: boolean
}

const CABECALHO = ['Categoria', 'Nome do item', 'Descrição', 'Preço', 'Disponível', 'ID'] as const

// ─────────────────────────────────────────────
// EXPORTAR
// ─────────────────────────────────────────────

/**
 * Monta a planilha com uma linha por item (agrupados por categoria, na
 * ordem em que já aparecem no cardápio). A coluna "ID" fica oculta — só
 * serve pra casar a linha com o item já existente quando a planilha
 * voltar num "Subir planilha"; sem itens ainda, sobra só o cabeçalho,
 * servindo de modelo em branco.
 */
export function gerarPlanilhaCardapio(categorias: CategoriaPlanilha[], itens: ItemPlanilha[]) {
  const linhas: (string | number)[][] = [[...CABECALHO]]

  for (const cat of categorias) {
    const itensDaCategoria = itens.filter((i) => i.categoria_id === cat.id)
    for (const item of itensDaCategoria) {
      linhas.push([
        cat.nome,
        item.nome,
        item.descricao || '',
        item.preco,
        item.disponivel ? 'Sim' : 'Não',
        item.id,
      ])
    }
  }

  const planilha = XLSX.utils.aoa_to_sheet(linhas)
  planilha['!cols'] = [{ wch: 22 }, { wch: 28 }, { wch: 40 }, { wch: 10 }, { wch: 12 }, { wch: 1, hidden: true }]

  const livro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(livro, planilha, 'Cardápio')
  return livro
}

export function baixarPlanilhaCardapio(categorias: CategoriaPlanilha[], itens: ItemPlanilha[], nomeArquivo: string) {
  const livro = gerarPlanilhaCardapio(categorias, itens)
  XLSX.writeFile(livro, nomeArquivo)
}

// ─────────────────────────────────────────────
// LER O ARQUIVO SUBIDO
// ─────────────────────────────────────────────

export interface LinhaPlanilhaLida {
  /** Número da linha no Excel (1 = cabeçalho), só pra mensagem de erro. */
  linha: number
  id: string | null
  categoriaNome: string
  nome: string
  descricao: string
  preco: number
  disponivel: boolean
}

export interface ResultadoLeituraPlanilha {
  linhas: LinhaPlanilhaLida[]
  erros: { linha: number; motivo: string }[]
}

function normalizarTexto(v: unknown): string {
  return String(v ?? '').trim()
}

function normalizarPreco(v: unknown): number | null {
  if (typeof v === 'number') return v
  const texto = normalizarTexto(v).replace(/R\$\s?/i, '')
  if (!texto) return null
  // "1.234,56" (formato BR) → "1234.56" · "45,00" → "45.00" · "45.00" já ok
  const normalizado = texto.includes(',') ? texto.replace(/\./g, '').replace(',', '.') : texto
  const num = parseFloat(normalizado)
  return Number.isFinite(num) ? num : null
}

function normalizarDisponivel(v: unknown): boolean {
  const texto = normalizarTexto(v).toLowerCase()
  if (!texto) return true // célula em branco = disponível, por padrão
  return ['sim', 'yes', 'true', '1', 'disponível', 'disponivel'].includes(texto)
}

export async function lerPlanilhaCardapio(arquivo: File): Promise<ResultadoLeituraPlanilha> {
  const bytes = await arquivo.arrayBuffer()
  const livro = XLSX.read(bytes, { type: 'array' })
  const planilha = livro.Sheets[livro.SheetNames[0]]
  const linhasBrutas = XLSX.utils.sheet_to_json(planilha, { header: 1, blankrows: false }) as unknown[][]

  if (linhasBrutas.length === 0) {
    return { linhas: [], erros: [{ linha: 0, motivo: 'A planilha está vazia.' }] }
  }

  const cabecalho = linhasBrutas[0].map((c) => normalizarTexto(c).toLowerCase())
  const idxCategoria = cabecalho.indexOf('categoria')
  const idxNome = cabecalho.indexOf('nome do item')
  const idxDescricao = cabecalho.indexOf('descrição')
  const idxPreco = cabecalho.indexOf('preço')
  const idxDisponivel = cabecalho.indexOf('disponível')
  const idxId = cabecalho.indexOf('id')

  if (idxCategoria === -1 || idxNome === -1) {
    return {
      linhas: [],
      erros: [{ linha: 0, motivo: 'A planilha precisa ter pelo menos as colunas "Categoria" e "Nome do item".' }],
    }
  }

  const linhas: LinhaPlanilhaLida[] = []
  const erros: { linha: number; motivo: string }[] = []

  for (let i = 1; i < linhasBrutas.length; i++) {
    const bruta = linhasBrutas[i]
    const categoriaNome = normalizarTexto(bruta[idxCategoria])
    const nome = normalizarTexto(bruta[idxNome])
    if (!categoriaNome && !nome) continue // linha em branco

    const numeroLinha = i + 1
    if (!categoriaNome) { erros.push({ linha: numeroLinha, motivo: 'Categoria em branco.' }); continue }
    if (!nome) { erros.push({ linha: numeroLinha, motivo: 'Nome do item em branco.' }); continue }

    const preco = idxPreco !== -1 ? normalizarPreco(bruta[idxPreco]) : 0
    if (preco === null || preco < 0) {
      erros.push({ linha: numeroLinha, motivo: `Preço inválido: "${bruta[idxPreco] ?? ''}".` })
      continue
    }

    linhas.push({
      linha: numeroLinha,
      id: idxId !== -1 ? normalizarTexto(bruta[idxId]) || null : null,
      categoriaNome,
      nome,
      descricao: idxDescricao !== -1 ? normalizarTexto(bruta[idxDescricao]) : '',
      preco,
      disponivel: idxDisponivel !== -1 ? normalizarDisponivel(bruta[idxDisponivel]) : true,
    })
  }

  return { linhas, erros }
}

// ─────────────────────────────────────────────
// COMPARAR COM O QUE JÁ EXISTE
// ─────────────────────────────────────────────

export interface PlanoAplicacao {
  categoriasNovas: string[]
  itensNovos: { linha: LinhaPlanilhaLida; categoriaNome: string }[]
  itensAlterados: { itemId: string; linha: LinhaPlanilhaLida; mudancas: string[] }[]
  itensSemMudanca: number
}

/**
 * Casa cada linha com um item já existente por ID (coluna oculta) — se
 * não bater com nenhum (planilha editada por fora, ID apagado, linha
 * digitada do zero...), cai pro nome dentro da mesma categoria, pra não
 * duplicar item só porque a coluna oculta sumiu. Só o que sobrar sem
 * casar nenhum dos dois vira item novo.
 *
 * Nome não é um campo atualizado (só descrição/preço/disponível, como
 * pedido) — mesmo casando por ID, um nome diferente na planilha não
 * renomeia o item; é só usado pra decidir se é um item novo ou não.
 */
export function compararComEstado(
  linhas: LinhaPlanilhaLida[],
  categorias: CategoriaPlanilha[],
  itens: ItemPlanilha[]
): PlanoAplicacao {
  const categoriaPorNome = new Map(categorias.map((c) => [c.nome.trim().toLowerCase(), c]))
  const itemPorId = new Map(itens.map((i) => [i.id, i]))

  const categoriasNovasSet = new Set<string>()
  const itensNovos: PlanoAplicacao['itensNovos'] = []
  const itensAlterados: PlanoAplicacao['itensAlterados'] = []
  let itensSemMudanca = 0

  for (const linha of linhas) {
    const categoriaNomeNormalizado = linha.categoriaNome.trim()
    const catExistente = categoriaPorNome.get(categoriaNomeNormalizado.toLowerCase())
    if (!catExistente) categoriasNovasSet.add(categoriaNomeNormalizado)

    let itemExistente = linha.id ? itemPorId.get(linha.id) : undefined
    if (!itemExistente && catExistente) {
      itemExistente = itens.find(
        (i) => i.categoria_id === catExistente.id && i.nome.trim().toLowerCase() === linha.nome.trim().toLowerCase()
      )
    }

    if (!itemExistente) {
      itensNovos.push({ linha, categoriaNome: categoriaNomeNormalizado })
      continue
    }

    const mudancas: string[] = []
    if ((itemExistente.descricao || '').trim() !== linha.descricao.trim()) {
      mudancas.push('Descrição alterada')
    }
    if (Math.round(itemExistente.preco * 100) !== Math.round(linha.preco * 100)) {
      mudancas.push(`Preço: R$ ${itemExistente.preco.toFixed(2)} → R$ ${linha.preco.toFixed(2)}`)
    }
    if (itemExistente.disponivel !== linha.disponivel) {
      mudancas.push(`Disponibilidade: ${itemExistente.disponivel ? 'Sim' : 'Não'} → ${linha.disponivel ? 'Sim' : 'Não'}`)
    }

    if (mudancas.length > 0) {
      itensAlterados.push({ itemId: itemExistente.id, linha, mudancas })
    } else {
      itensSemMudanca++
    }
  }

  return {
    categoriasNovas: [...categoriasNovasSet],
    itensNovos,
    itensAlterados,
    itensSemMudanca,
  }
}

// ─────────────────────────────────────────────
// APLICAR (só chamado depois do dono confirmar)
// ─────────────────────────────────────────────

export async function aplicarPlanoPlanilha(
  supabase: ReturnType<typeof createClient>,
  params: {
    menuId: string
    categorias: CategoriaPlanilha[]
    itens: ItemPlanilha[]
    plano: PlanoAplicacao
  }
): Promise<{ erro?: string }> {
  const { menuId, categorias, itens, plano } = params

  const categoriaIdPorNome = new Map(categorias.map((c) => [c.nome.trim().toLowerCase(), c.id]))

  if (plano.categoriasNovas.length > 0) {
    const { data: criadas, error } = await supabase
      .from('categorias')
      .insert(
        plano.categoriasNovas.map((nome, i) => ({
          nome,
          menu_id: menuId,
          ordem: categorias.length + i,
        }))
      )
      .select('id, nome')
    if (error) return { erro: 'Erro ao criar categorias: ' + error.message }
    for (const c of criadas || []) categoriaIdPorNome.set(c.nome.trim().toLowerCase(), c.id)
  }

  if (plano.itensNovos.length > 0) {
    const contagemPorCategoria = new Map<string, number>()
    for (const item of itens) {
      contagemPorCategoria.set(item.categoria_id, (contagemPorCategoria.get(item.categoria_id) || 0) + 1)
    }

    const linhasParaInserir = plano.itensNovos.map(({ linha, categoriaNome }) => {
      const categoriaId = categoriaIdPorNome.get(categoriaNome.trim().toLowerCase())!
      const ordem = contagemPorCategoria.get(categoriaId) || 0
      contagemPorCategoria.set(categoriaId, ordem + 1)
      return {
        nome: linha.nome,
        descricao: linha.descricao || null,
        preco: linha.preco,
        categoria_id: categoriaId,
        disponivel: linha.disponivel,
        ordem,
      }
    })
    const { error } = await supabase.from('itens_cardapio').insert(linhasParaInserir)
    if (error) return { erro: 'Erro ao criar itens: ' + error.message }
  }

  if (plano.itensAlterados.length > 0) {
    const resultados = await Promise.all(
      plano.itensAlterados.map(({ itemId, linha }) =>
        supabase
          .from('itens_cardapio')
          .update({
            descricao: linha.descricao || null,
            preco: linha.preco,
            disponivel: linha.disponivel,
          })
          .eq('id', itemId)
      )
    )
    const comErro = resultados.find((r) => r.error)
    if (comErro?.error) return { erro: 'Erro ao atualizar itens: ' + comErro.error.message }
  }

  return {}
}
