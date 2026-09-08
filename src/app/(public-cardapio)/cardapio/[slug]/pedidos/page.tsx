import MeusPedidos from '@/modules/pedidos/customer/MeusPedidos'

export default async function MeusPedidosPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <MeusPedidos slug={slug} />
    </div>
  )
}
