import { createClient } from '@/lib/supabase/server'
import PropagandasManager from './PropagandasManager'

export default async function AdminPropagandasPage() {
  const supabase = await createClient()

  const { data: propagandas } = await supabase
    .from('propagandas')
    .select('*')
    .order('ordem', { ascending: true })

  return (
    <div>
      <h1 className="text-2xl font-bold text-neutral-900">Propaganda</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Cards não invasivos exibidos no meio do feed — nunca pop-up ou modal.
      </p>
      <div className="mt-6">
        <PropagandasManager propagandasIniciais={propagandas || []} />
      </div>
    </div>
  )
}
