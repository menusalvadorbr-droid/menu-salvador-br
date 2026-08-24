import { createClient } from '@/lib/supabase/server'
import FiltrosClient from './FiltrosClient'

/** Só as listas (bairros, tipos de culinária) — rápido, carrega cedo.
 *  Os valores selecionados vêm da URL (FiltrosClient), não daqui. */
export default async function FiltrosSecao() {
  const supabase = await createClient()
  const [{ data: bairrosBrutos }, { data: tiposCozinha }] = await Promise.all([
    supabase.from('bairros').select('id, nome, slug, cidade_id, cidades(nome)').order('nome'),
    supabase.from('tipos_cozinha').select('id, nome, slug, icone').eq('ativo', true).order('ordem'),
  ])

  // Achata o embed de cidades numa única string aqui — evita repetir a
  // checagem "PostgREST devolve objeto ou array" em cada componente cliente
  // que só precisa do nome pra agrupar o <select>.
  const bairros = (bairrosBrutos || []).map((b) => ({
    id: b.id,
    nome: b.nome,
    slug: b.slug,
    cidadeId: b.cidade_id as string,
    nomeCidade: (Array.isArray(b.cidades) ? b.cidades[0]?.nome : (b.cidades as { nome: string } | null)?.nome) || '',
  }))

  return <FiltrosClient bairros={bairros} tiposCozinha={tiposCozinha || []} />
}
