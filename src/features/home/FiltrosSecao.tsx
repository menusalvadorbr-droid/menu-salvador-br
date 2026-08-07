import { createClient } from '@/lib/supabase/server'
import FiltrosClient from './FiltrosClient'

/** Só as listas (bairros, tipos de culinária) — rápido, carrega cedo.
 *  Os valores selecionados vêm da URL (FiltrosClient), não daqui. */
export default async function FiltrosSecao() {
  const supabase = await createClient()
  const [{ data: bairros }, { data: tiposCozinha }] = await Promise.all([
    supabase.from('bairros').select('id, nome, slug').order('nome'),
    supabase.from('tipos_cozinha').select('id, nome, slug, icone').eq('ativo', true).order('ordem'),
  ])

  return <FiltrosClient bairros={bairros || []} tiposCozinha={tiposCozinha || []} />
}
