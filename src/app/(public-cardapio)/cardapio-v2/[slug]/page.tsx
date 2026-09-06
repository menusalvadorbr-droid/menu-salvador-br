import { createPublicClient } from '@/lib/supabase/publicServer'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { buscarCardapioPublico, registrarAcessoQr } from '@/modules/cardapioV2/publicoRepository'
import type { CanalCardapioV2 } from '@/modules/cardapioV2/types'
import CategoriaSecao from '@/components/cardapioV2/CategoriaSecao'
import NavegacaoCategoriasV2 from '@/components/cardapioV2/NavegacaoCategoriasV2'
import { obterFonteTema } from '@/lib/fontesTema'

// Cardápio V2 — página pública mínima da Fase 2 (ver cardapio-v2-visao.md):
// sem editor, sem tema customizável, sem carrinho — só leitura, rápida em
// 4G. Mesmo padrão de ISR do V1 (revalidate + generateStaticParams vazio,
// obrigatório neste Next 16 ou a rota vira full-dynamic e ignora o cache).
export const revalidate = 120

export async function generateStaticParams() {
  return []
}

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
    .select('id, nome, nome_fantasia, logo_url')
    .eq('slug', slug).eq('status', 'active').eq('ativo', true)
    .limit(1).single()
  if (!est) notFound()

  const cardapioPublico = await buscarCardapioPublico(est.id, canal)

  // Insert fire-and-forget — não bloqueia a resposta pro visitante, e uma
  // falha aqui (rede, RLS) não pode derrubar a página de exibição.
  registrarAcessoQr(est.id).catch(() => {})

  const nomeExibido = cardapioPublico?.cardapio.titulo_exibicao || est.nome_fantasia || est.nome
  const agora = new Date()
  const corFundo = cardapioPublico?.cardapio.cor_fundo ?? '#F9FAFB'
  const corTexto = cardapioPublico?.cardapio.cor_texto ?? '#1F2937'
  const fonte = obterFonteTema(cardapioPublico?.cardapio.fonte)
  const capaUrl = cardapioPublico?.cardapio.capa_url
  const categoriasComItens = cardapioPublico?.categorias.filter((c) => c.itens.length > 0) ?? []

  return (
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
            />
          ))
        )}

        <p className="mt-8 text-center text-xs opacity-60" style={{ color: corTexto }}>
          Cardápio sujeito a alterações. Alérgenos: consulte o atendente em caso de dúvida.
        </p>
      </div>
    </div>
  )
}
