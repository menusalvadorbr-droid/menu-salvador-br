import MeusPedidos from '@/modules/pedidos/customer/MeusPedidos'

export default async function MeusPedidosV2Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <MeusPedidos slug={slug} basePath="/cardapio-v2" cardapioQuery="?canal=delivery" />
    </div>
  )
}
