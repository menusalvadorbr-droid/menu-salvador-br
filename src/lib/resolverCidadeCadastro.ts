import type { SupabaseClient } from '@supabase/supabase-js'
import { gerarSlug } from './slug'

export interface CidadeResolvida {
  id: string
  nome: string
}

/**
 * cidades é lista de cobertura curada pelo admin geral (/admin/tipos,
 * seção "Cidades") — não existe find-or-create aqui. CNPJ de fora dessa
 * lista precisa interromper o cadastro, não criar cidade nova sozinho.
 */
export class CidadeForaDeCoberturaError extends Error {
  constructor(municipio: string) {
    super(`menu.salvador ainda não atende "${municipio}" — fora da área de cobertura.`)
    this.name = 'CidadeForaDeCoberturaError'
  }
}

/**
 * Resolve o município devolvido pela BrasilAPI contra a tabela cidades,
 * comparando slug (mesmo algoritmo de src/lib/slug.ts) em vez de texto
 * cru — assim "Vitória da Conquista" (BrasilAPI) casa com "Vitória da
 * Conquista" (cadastrada) mesmo com pequenas diferenças de grafia.
 * Fora da lista: lança CidadeForaDeCoberturaError, quem chamar decide
 * como mostrar isso pro usuário.
 */
export async function resolverCidadeCobertura(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  municipio: string | null | undefined
): Promise<CidadeResolvida> {
  const municipioLimpo = (municipio || '').trim()
  if (!municipioLimpo) throw new CidadeForaDeCoberturaError('(cidade não informada)')

  const slug = gerarSlug(municipioLimpo)
  const { data } = await supabase.from('cidades').select('id, nome').eq('slug', slug).maybeSingle()
  if (!data) throw new CidadeForaDeCoberturaError(municipioLimpo)

  return data
}

/**
 * Casa o bairro solto que vem da Receita com a tabela oficial —
 * escopado pela cidade já resolvida, pra não repetir o bug de um bairro
 * de outra cidade ser escolhido só por coincidência de nome (ex:
 * "Itapuã" existe em mais de uma cidade da Bahia; sem esse escopo, um
 * estabelecimento de outra cidade podia cair no Itapuã de Salvador).
 * Sem match: retorna null, o formulário deixa o dono escolher manualmente.
 */
export async function encontrarBairroNaCidade(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any, any, any>,
  bairroCnpj: string | null | undefined,
  cidadeId: string
): Promise<string | null> {
  const bairroLimpo = (bairroCnpj || '').trim()
  if (!bairroLimpo) return null

  const alvo = gerarSlug(bairroLimpo)
  const { data } = await supabase
    .from('bairros')
    .select('id')
    .eq('cidade_id', cidadeId)
    .eq('slug', alvo)
    .maybeSingle()

  return data?.id || null
}
