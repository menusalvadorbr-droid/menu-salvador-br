import AdminPageHeader from '@/components/admin/AdminPageHeader'
import GerenciarPlanos from '@/components/admin/GerenciarPlanos'

export default function PlanosPage() {
  return (
    <div>
      <div className="mb-6">
        <AdminPageHeader titulo="Planos" />
      </div>

      <GerenciarPlanos />
    </div>
  )
}
