import type { Insumo, UnidadeInsumo } from './types'

type Familia = 'massa' | 'volume' | 'unidade'

const FAMILIA: Record<UnidadeInsumo, Familia> = {
  kg: 'massa',
  g: 'massa',
  l: 'volume',
  ml: 'volume',
  un: 'unidade',
}

const UNIDADES_DA_FAMILIA: Record<Familia, UnidadeInsumo[]> = {
  massa: ['kg', 'g'],
  volume: ['l', 'ml'],
  unidade: ['un'],
}

/** Todas as unidades que convertem sozinhas (sem equivalência) com a
 *  unidade dada — ex: 'kg' → ['kg', 'g']. */
export function unidadesDaMesmaFamilia(unidade: UnidadeInsumo): UnidadeInsumo[] {
  return UNIDADES_DA_FAMILIA[FAMILIA[unidade]]
}

/**
 * Unidades que dá pra escolher numa linha de composição pra esse insumo
 * sem cair no erro de conversão — a própria família da unidade cadastrada
 * nele, mais a família da equivalência, se houver. Usado pra já não
 * oferecer no seletor uma unidade que ia travar ao tentar adicionar.
 */
export function unidadesCompativeisComInsumo(
  insumo: Pick<Insumo, 'unidade' | 'equivalencia_unidade'>
): UnidadeInsumo[] {
  const unidades = new Set<UnidadeInsumo>(unidadesDaMesmaFamilia(insumo.unidade))
  if (insumo.equivalencia_unidade) {
    for (const u of unidadesDaMesmaFamilia(insumo.equivalencia_unidade)) unidades.add(u)
  }
  return Array.from(unidades)
}

// Quantos "g" tem em 1 kg, quantos "ml" tem em 1 l — conversão métrica
// universal, não depende do produto (por isso não precisa de cadastro).
const FATOR_PARA_UNIDADE_BASE: Record<UnidadeInsumo, number> = {
  kg: 1000,
  g: 1,
  l: 1000,
  ml: 1,
  un: 1,
}

/**
 * Converte entre unidades da mesma família (kg↔g, l↔ml, ou a mesma
 * unidade). Lança erro se as famílias forem diferentes — essa função não
 * sabe nada sobre o produto, só faz aritmética métrica.
 */
export function converterUnidadeMetrica(qtd: number, de: UnidadeInsumo, para: UnidadeInsumo): number {
  if (de === para) return qtd
  if (FAMILIA[de] !== FAMILIA[para]) {
    throw new Error(`Não é possível converter ${de} para ${para} sem uma equivalência cadastrada.`)
  }
  return (qtd * FATOR_PARA_UNIDADE_BASE[de]) / FATOR_PARA_UNIDADE_BASE[para]
}

/**
 * Converte uma quantidade informada numa ficha técnica (ex: "300 g") para
 * a unidade em que o insumo tem custo e estoque cadastrados (ex: "un",
 * quando o insumo é comprado em ovos ou latas). kg↔g e l↔ml convertem
 * sozinhos; cruzar unidade↔peso/volume só é possível se o insumo tiver a
 * equivalência cadastrada (ex: "1 un = 50 g").
 */
export function converterParaUnidadeDoInsumo(
  qtd: number,
  unidadeInformada: UnidadeInsumo,
  insumo: Pick<Insumo, 'nome' | 'unidade' | 'equivalencia_qtd' | 'equivalencia_unidade'>
): number {
  const base = insumo.unidade
  if (unidadeInformada === base) return qtd

  if (FAMILIA[unidadeInformada] === FAMILIA[base]) {
    return converterUnidadeMetrica(qtd, unidadeInformada, base)
  }

  if (insumo.equivalencia_qtd && insumo.equivalencia_unidade) {
    if (FAMILIA[unidadeInformada] === FAMILIA[insumo.equivalencia_unidade]) {
      const qtdNaUnidadeEquivalencia = converterUnidadeMetrica(qtd, unidadeInformada, insumo.equivalencia_unidade)
      return qtdNaUnidadeEquivalencia / insumo.equivalencia_qtd
    }
  }

  throw new Error(
    `Cadastre a equivalência do insumo "${insumo.nome}" (ex: 1 ${base} = X ${unidadeInformada}) para usar essa unidade na composição.`
  )
}
