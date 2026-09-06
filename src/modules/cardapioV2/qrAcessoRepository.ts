import { createClient } from '@/lib/supabase/client'

/** Contagem simples de acesso ao QR (ver cardapio-v2-visao.md) — cada
 * scan gera 1 linha em cardapio_v2_qr_acessos (inserida pela própria
 * página pública, ver registrarAcessoQr em publicoRepository.ts). Aqui só
 * a leitura, restrita a dono/funcionário pela RLS da tabela. */
export async function contarAcessosQr(estabelecimentoId: string): Promise<number> {
  const supabase = createClient()
  const { count, error } = await supabase
    .from('cardapio_v2_qr_acessos')
    .select('*', { count: 'exact', head: true })
    .eq('estabelecimento_id', estabelecimentoId)

  // error do supabase-js é um objeto plano (PostgrestError), não Error —
  // lançar direto faz o overlay do Next mostrar "[object Object]" em vez
  // da mensagem real. Mesmo padrão de estoqueRepository.ts.
  if (error) throw new Error(error.message)
  return count ?? 0
}
