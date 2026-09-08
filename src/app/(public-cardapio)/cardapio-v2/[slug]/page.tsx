import { createPublicClient } from '@/lib/supabase/publicServer'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { buscarCardapioPublico, registrarAcessoQr } from '@/modules/cardapioV2/publicoRepository'
import type { CanalCardapioV2 } from '@/modules/cardapioV2/types'
import CategoriaSecao from '@/components/cardapioV2/CategoriaSecao'
import NavegacaoCategoriasV2 from '@/components/cardapioV2/NavegacaoCategoriasV2'
import NavegacaoPilulasV2 from '@/components/cardapioV2/NavegacaoPilulasV2'
import CarrinhoProvider from '@/modules/pedidos/customer/CarrinhoProvider'
import { TraducaoProvider } from '@/components/public/TraducaoCardapio'
import { getCloudflareImageUrl } from '@/lib/cloudflareImage'
import { obterFonteTema } from '@/lib/fontesTema'

// Cardápio V2 — página pública (ver cardapio-v2-visao.md): sem editor, sem
// tema customizável na tela em si. O carrinho (canal=delivery) reaproveita
// inteiro o módulo genérico de pedidos do cliente (src/modules/pedidos/
// customer/*, o mesmo do V1) — ver carrinhoAdapter.ts pra a ponte entre o
// domínio do V2 (variações/grupos de complemento) e o formato que o
// carrinho espera. Sem cacheComponents habilitado no next.config, ler
// searchParams (canal) junto de generateStaticParams/revalidate derruba a
// rota com DYNAMIC_SERVER_USAGE em vez de só marcar como dinâmica — então,
// ao contrário do V1 (que não usa searchParams), esta rota fica
// full-dynamic, mesmo padrão de /cardapio/[slug]/categoria/[categoriaId].
interface PageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ canal?: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const supabase = createPublicClient()
  const { data: est } = await supabase
    .from('estabelecimentos_publico')
    .select('nome, nome_fantasia, descricao')
    .eq('slug', slug).eq('status', 'active').eq('ativo', true)
    .limit(1).single()

  if (!est) return { title: 'Cardápio Digital' }
  const nome = est.nome_fantasia || est.nome
  return { title: `${nome} — Cardápio`, robots: { index: true, follow: true } }
}

export default async function CardapioV2Page({ params, searchParams }: PageProps) {
  const { slug } = await params
  const { canal: canalQuery } = await searchParams
  const canal: CanalCardapioV2 = canalQuery === 'delivery' ? 'delivery' : 'presencial'

  const supabase = createPublicClient()
  const { data: est } = await supabase
    .from('estabelecimentos_publico')
    .select('id, nome, nome_fantasia, logo_url, whatsapp, chave_pix, cidades(nome)')
    .eq('slug', slug).eq('status', 'active').eq('ativo', true)
    .limit(1).single()
  if (!est) notFound()

  // Mesmo formato de relação vindo do Postgrest já visto em outras leituras
  // públicas do projeto (array ou objeto solto, dependendo de como o
  // Supabase infere a FK) — normalizado aqui do mesmo jeito.
  const cidadesRel = est.cidades as { nome: string }[] | { nome: string } | null
  const cidadeNome = (Array.isArray(cidadesRel) ? cidadesRel[0]?.nome : cidadesRel?.nome) || null

  const cardapioPublico = await buscarCardapioPublico(est.id, canal)

  // Insert fire-and-forget — não bloqueia a resposta pro visitante, e uma
  // falha aqui (rede, RLS) não pode derrubar a página de exibição.
  registrarAcessoQr(est.id).catch(() => {})

  const nomeExibido = cardapioPublico?.cardapio.titulo_exibicao || est.nome_fantasia || est.nome
  const agora = new Date()
  const corFundo = cardapioPublico?.cardapio.cor_fundo ?? '#F9FAFB'
  const corTexto = cardapioPublico?.cardapio.cor_texto ?? '#1F2937'
  const fonte = obterFonteTema(cardapioPublico?.cardapio.fonte)
  // Capa vem do R2 (ver README.md) — redimensionada via Cloudflare Image
  // Transformations em vez de servir o arquivo original inteiro.
  const capaUrl = getCloudflareImageUrl(cardapioPublico?.cardapio.capa_url, { width: 1200, height: 448 })
  const categoriasComItens = cardapioPublico?.categorias.filter((c) => c.itens.length > 0) ?? []
  // Carrinho só faz sentido no canal delivery — a visão presencial (QR na
  // mesa) continua só-leitura, mesmo comportamento de antes.
  const carrinhoAtivo = canal === 'delivery'

  const conteudo = (
    <div className={`min-h-screen ${fonte.className}`} style={{ backgroundColor: corFundo, color: corTexto }}>
      {/* Fixo no topo — sem isso o botão ☰ some ao rolar até uma categoria
          mais embaixo, obrigando a rolar a página inteira de volta só pra
          trocar de categoria. */}
      <header className="sticky top-0 z-30 border-b border-black/5" style={{ backgroundColor: corFundo }}>
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          {est.logo_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={est.logo_url} alt={nomeExibido} className="h-10 w-10 rounded-full object-cover" />
          )}
          <h1 className="flex-1 truncate text-lg font-bold" style={{ color: corTexto }}>{nomeExibido}</h1>
          {cardapioPublico && (
            <NavegacaoCategoriasV2 categorias={categoriasComItens} corPrimaria={cardapioPublico.cardapio.cor_primaria} corTexto={corTexto} />
          )}
        </div>
      </header>

      {capaUrl && (
        <div className="relative h-40 w-full overflow-hidden sm:h-56">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={capaUrl} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="mx-auto max-w-2xl px-4 pb-12 pt-6">
        {/* Pílulas de categoria — recurso do cardápio grátis, sem gate de
            plano, convive com o ☰ do cabeçalho. */}
        {cardapioPublico && (
          <NavegacaoPilulasV2 categorias={categoriasComItens} corPrimaria={cardapioPublico.cardapio.cor_primaria} corFundo={corFundo} />
        )}

        {!cardapioPublico || cardapioPublico.categorias.every((c) => c.itens.length === 0) ? (
          <div className="rounded-2xl bg-white p-12 text-center shadow-sm">
            <p className="text-base font-medium text-neutral-700">Cardápio em preparação</p>
            <p className="mt-1 text-sm text-neutral-500">Volte em breve!</p>
          </div>
        ) : (
          cardapioPublico.categorias.map((categoria) => (
            <CategoriaSecao
              key={categoria.id}
              categoria={categoria}
              canal={canal}
              alergenos={cardapioPublico.alergenos}
              cardapio={cardapioPublico.cardapio}
              agora={agora}
              gruposComplemento={cardapioPublico.gruposComplemento}
              carrinhoAtivo={carrinhoAtivo}
            />
          ))
        )}

        <p className="mt-8 text-center text-xs opacity-60" style={{ color: corTexto }}>
          Cardápio sujeito a alterações. Alérgenos: consulte o atendente em caso de dúvida.
        </p>
      </div>
    </div>
  )

  if (!carrinhoAtivo) return conteudo

  // O carrinho (CarrinhoProvider → FinalizarPedidoModal/SacolaDrawer/etc.,
  // reaproveitado do V1) usa useTraducao() pros textos de interface — exige
  // um TraducaoProvider por fora mesmo sem o V2 ainda ter seletor de idioma
  // próprio na tela. idiomasAtivos/traducoes vazios mantêm o idioma sempre
  // 'pt' (traduzirInterface só devolve o texto original em português nesse
  // caso), sem mudar nada visível — só satisfaz o contrato do componente
  // reaproveitado.
  return (
    <TraducaoProvider slug={slug} idiomasAtivos={[]} traducoes={[]}>
      <CarrinhoProvider
        estabelecimentoId={est.id}
        slug={slug}
        whatsapp={est.whatsapp ?? undefined}
        basePath="/cardapio-v2"
        enderecoEstruturado
        chavePix={est.chave_pix}
        cidade={cidadeNome}
        nomeFantasia={nomeExibido}
      >
        {conteudo}
      </CarrinhoProvider>
    </TraducaoProvider>
  )
}
