import { createClient } from '@/lib/supabase/server'
import PropagandasManager from './PropagandasManager'
import AdminPageHeader from '@/components/admin/AdminPageHeader'

export default async function AdminPropagandasPage() {
  const supabase = await createClient()

  const { data: propagandas } = await supabase
    .from('propagandas')
    .select('*')
    .order('ordem', { ascending: true })

  return (
    <div>
      <AdminPageHeader
        titulo="Propaganda"
        descricao="Cards não invasivos exibidos no meio do feed — nunca pop-up ou modal."
      />
      <div className="mt-6">
        <PropagandasManager propagandasIniciais={propagandas || []} />
      </div>
    </div>
  )
}
