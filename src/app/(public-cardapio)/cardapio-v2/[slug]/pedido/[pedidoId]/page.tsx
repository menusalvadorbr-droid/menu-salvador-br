import { notFound } from 'next/navigation'
import { createPublicClient } from '@/lib/supabase/publicServer'
import AcompanharPedido from '@/app/(public-cardapio)/cardapio/[slug]/pedido/[pedidoId]/AcompanharPedido'

// Página de acompanhamento do pedido feito no Cardápio V2 — mesmo
// componente do V1 (AcompanharPedido.tsx é genérico: lê pedidos_acompanhamento
// por id, sem nada específico do domínio de cardápio), só com basePath
// trocado pra o link "Voltar ao cardápio" cair em /cardapio-v2 em vez de
// /cardapio.
export default async function AcompanharPedidoV2Page({
  params,
}: {
  params: Promise<{ slug: string; pedidoId: string }>
}) {
  const { slug, pedidoId } = await params
  const supabase = createPublicClient()

  const { data: est } = await supabase
    .from('estabelecimentos_publico')
    .select('nome, nome_fantasia, chave_pix, cidades(nome)')
    .eq('slug', slug)
    .eq('status', 'active')
    .eq('ativo', true)
    .limit(1)
    .single()
  if (!est) notFound()

  const nomeEstabelecimento = est.nome_fantasia || est.nome
  const cidades = est.cidades as { nome: string }[] | { nome: string } | null
  const cidadeNome = (Array.isArray(cidades) ? cidades[0]?.nome : cidades?.nome) || null

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-8">
      <AcompanharPedido
        slug={slug}
        pedidoId={pedidoId}
        nomeEstabelecimento={nomeEstabelecimento}
        chavePix={est.chave_pix}
        cidade={cidadeNome}
        basePath="/cardapio-v2"
        cardapioQuery="?canal=delivery"
      />
    </div>
  )
}
