import { createClient } from '@/lib/supabase/client'

export interface ChamadoGarcom {
  id: string
  estabelecimento_id: string
  mesa: string
  status: 'pendente' | 'atendido'
  created_at: string
  atendido_em: string | null
}

export async function chamarGarcom(estabelecimentoId: string, mesa: string) {
  const supabase = createClient()
  const { error } = await supabase.from('chamados_garcom').insert({
    estabelecimento_id: estabelecimentoId,
    mesa,
    status: 'pendente',
  })
  if (error) throw new Error(error.message)
}

export async function listarChamadosPendentes(estabelecimentoId: string): Promise<ChamadoGarcom[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('chamados_garcom')
    .select('*')
    .eq('estabelecimento_id', estabelecimentoId)
    .eq('status', 'pendente')
    .order('created_at', { ascending: true })
  if (error) throw new Error(error.message)
  return data || []
}

export async function marcarChamadoAtendido(chamadoId: string) {
  const supabase = createClient()
  const { error } = await supabase
    .from('chamados_garcom')
    .update({ status: 'atendido', atendido_em: new Date().toISOString() })
    .eq('id', chamadoId)
  if (error) throw new Error(error.message)
}
