import { createClient } from '@/lib/supabase/client'

export interface DadosPixEstabelecimento {
  chavePix: string | null
  nomeFantasia: string
  cidade: string | null
}

/** Mesmos três campos que o checkout público já busca pra montar o Pix do
 *  cliente (ver AcompanharPedidoPage) — aqui na tabela base
 *  `estabelecimentos` (não a view `estabelecimentos_publico`), porque
 *  quem chama isso já é dono/funcionário autenticado, não visitante
 *  anônimo. */
export async function buscarDadosPixEstabelecimento(estabelecimentoId: string): Promise<DadosPixEstabelecimento> {
  const supabase = createClient()
  const { data } = await supabase
    .from('estabelecimentos')
    .select('nome, nome_fantasia, chave_pix, cidades(nome)')
    .eq('id', estabelecimentoId)
    .single()

  const cidades = data?.cidades as { nome: string }[] | { nome: string } | null
  const cidadeNome = (Array.isArray(cidades) ? cidades[0]?.nome : cidades?.nome) || null

  return {
    chavePix: data?.chave_pix || null,
    nomeFantasia: data?.nome_fantasia || data?.nome || '',
    cidade: cidadeNome,
  }
}
