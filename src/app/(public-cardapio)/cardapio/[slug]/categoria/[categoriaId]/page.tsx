import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import CarrinhoProvider from '@/modules/pedidos/customer/CarrinhoProvider'
import { TraducaoProvider, Texto, TextoInterface, SeletorIdioma, type TraducaoRow, type TraducaoInterfaceRow } from '@/components/public/TraducaoCardapio'
import BotaoVoltarCategorias from '@/components/public/BotaoVoltarCategorias'
import CategoriaItensClient from '@/components/public/CategoriaItensClient'
import { obterFonteTema } from '@/lib/fontesTema'

interface TemaConfigParcial {
  cor_primaria?: string
  cor_secundaria?: string
  cor_fundo?: string
  cor_texto?: string
  cor_borda?: string
  fonte?: string
  card_raio?: number
}

interface CardapioConfigParcial {
  foto_posicao?: 'left' | 'right' | 'top' | 'none'
  mostrar_codigo?: boolean
  mostrar_alergenos?: boolean
}

// ─────────────────────────────────────────────────────────────
// SEO
// ─────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; categoriaId: string }>
}): Promise<Metadata> {
  const { slug, categoriaId } = await params
  const supabase = await createClient()
  const [{ data: est }, { data: categoria }] = await Promise.all([
    supabase.from('estabelecimentos').select('nome, nome_fantasia').eq('slug', slug).eq('status', 'active').eq('ativo', true).limit(1).single(),
    supabase.from('categorias').select('nome').eq('id', categoriaId).maybeSingle(),
  ])
  if (!est) return { title: 'Cardápio Digital' }
  const nome = est.nome_fantasia || est.nome
  return {
    title: categoria ? `${categoria.nome} — ${nome}` : `${nome} — Cardápio Digital`,
    robots: { index: true, follow: true },
  }
}

// ─────────────────────────────────────────────────────────────
// PÁGINA DE CATEGORIA — busca só os itens dessa categoria, não o cardápio
// inteiro. Destino da navegação por cards (Configurações → Tema →
// Navegação de categoria = Cards): cada categoria vira um card com foto na
// página principal, e só ao clicar é que os itens dela são buscados —
// importante pra cardápio grande, onde carregar tudo de uma vez pesaria.
// ─────────────────────────────────────────────────────────────
export default async function CategoriaCardapioPage({
  params,
}: {
  params: Promise<{ slug: string; categoriaId: string }>
}) {
  const supabase = await createClient()
  const { slug, categoriaId } = await params

  // 1. Estabelecimento — só os campos que essa página precisa (mais leve
  // que o select('*') da página principal, que carrega hero/bairro/etc.
  // que não aparecem aqui).
  const { data: est, error: estErr } = await supabase
    .from('estabelecimentos')
    .select('id, slug, nome, nome_fantasia, tema_atual_id, cardapio_config, cardapio_formato, cardapio_clique_expande_ativado, cardapio_carrinho_ativado, idiomas_ativos, whatsapp')
    .eq('slug', slug).eq('status', 'active').eq('ativo', true)
    .limit(1).single()
  if (estErr || !est) notFound()

  // 2. Tema (cores) — mesmo cálculo da página principal.
  let temaConfig: TemaConfigParcial = {}
  if (est.tema_atual_id) {
    const { data: tema } = await supabase
      .from('temas').select('config').eq('id', est.tema_atual_id).single()
    if (tema) temaConfig = tema.config || {}
  }
  const corP  = temaConfig.cor_primaria   || '#f97316'
  const corS  = temaConfig.cor_secundaria || '#ffffff'
  const corF  = temaConfig.cor_fundo      || '#f9fafb'
  const corT  = temaConfig.cor_texto      || '#1f2937'
  const corBd = temaConfig.cor_borda      || `${corP}30`
  const fonteTema = obterFonteTema(temaConfig.fonte)
  const cardRaio = `${Number.isFinite(temaConfig.card_raio) ? temaConfig.card_raio : 16}px`

  const cc: CardapioConfigParcial = est.cardapio_config || {}
  const fotoPosicao      = (cc.foto_posicao      ?? 'left') as 'left' | 'right' | 'top' | 'none'
  const mostrarCodigo    = cc.mostrar_codigo    !== false
  const mostrarAlergenos = cc.mostrar_alergenos !== false
  const layoutCardapio: 'lista' | 'catalogo' = est.cardapio_formato === 'catalogo' ? 'catalogo' : 'lista'
  const cliqueExpandeAtivado = !!est.cardapio_clique_expande_ativado
  const carrinhoAtivado = !!est.cardapio_carrinho_ativado
  const nomeEstabelecimento = est.nome_fantasia || est.nome

  // 3. Categoria — confere que pertence a um menu deste estabelecimento
  // (não só que o id existe) antes de mostrar qualquer coisa.
  const { data: menus } = await supabase
    .from('menus')
    .select('id')
    .eq('estabelecimento_id', est.id)
    .order('created_at', { ascending: true })
    .limit(1)
  const menu = menus?.[0] ?? null

  const { data: categoria } = await supabase
    .from('categorias')
    .select('*')
    .eq('id', categoriaId)
    .maybeSingle()
  if (!menu || !categoria || categoria.menu_id !== menu.id) notFound()

  // 4. Os itens dessa categoria NÃO são buscados aqui — CategoriaItensClient
  // (client component) cuida disso via useCardapioPublico (cache local +
  // Realtime), pra reaproveitar entre visitas em vez de bater no banco
  // de novo toda vez que essa página é aberta.

  // 5. Tradução manual do cardápio (EN/FR/ES) — mesmo padrão da página
  // principal, sem filtrar por categoria (a tabela já é por item).
  const idiomasAtivos: string[] = est.idiomas_ativos || []
  let traducoes: TraducaoRow[] = []
  let traducoesInterface: TraducaoInterfaceRow[] = []
  if (idiomasAtivos.length > 0) {
    const [{ data: trads }, { data: tradsInterface }] = await Promise.all([
      supabase
        .from('traducoes')
        .select('tipo_registro, registro_id, idioma, campo, valor')
        .eq('estabelecimento_id', est.id),
      supabase.from('traducoes_interface').select('chave, idioma, valor'),
    ])
    traducoes = trads || []
    traducoesInterface = tradsInterface || []
  }

  return (
    <TraducaoProvider slug={est.slug} idiomasAtivos={idiomasAtivos} traducoes={traducoes} traducoesInterface={traducoesInterface}>
    <CarrinhoProvider estabelecimentoId={est.id} slug={est.slug} whatsapp={est.whatsapp}>
    <div className={`min-h-screen ${fonteTema.className}`} style={{ backgroundColor: corF, color: corT }}>
      <div className="mx-auto max-w-3xl px-4 pt-6 pb-12">

        {/* ── BOTÃO "← CATEGORIAS" — sticky, sempre visível ao rolar,
            mais fácil de notar/tocar no celular que um link de texto. ── */}
        <BotaoVoltarCategorias href={`/cardapio/${est.slug}`} corF={corF} corP={corP} corBd={corBd} />

        {/* ── CABEÇALHO ── */}
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate" style={{ color: corP }}>
              <Texto tipo="categoria" id={categoria.id} campo="nome">{categoria.nome}</Texto>
            </h1>
            <p className="text-xs opacity-50 truncate">{nomeEstabelecimento}</p>
          </div>
          <SeletorIdioma idiomasAtivos={idiomasAtivos} />
        </div>

        {/* ── ITENS ── */}
        <CategoriaItensClient
          estabelecimentoId={est.id}
          categoriaId={categoria.id}
          layoutCardapio={layoutCardapio}
          corP={corP} corT={corT} corS={corS} corBd={corBd}
          cardRaio={cardRaio}
          mostrarCodigo={mostrarCodigo}
          mostrarAlergenos={mostrarAlergenos}
          fotoPosicao={fotoPosicao}
          cliqueExpandeAtivado={cliqueExpandeAtivado}
          carrinhoAtivado={carrinhoAtivado}
        />

        {/* RODAPÉ */}
        <p className="mt-8 text-center text-xs opacity-40" style={{ color: corT }}>
          <TextoInterface chave="rodape_aviso">
            Cardápio sujeito a alterações. Alérgenos: consulte o atendente em caso de dúvida.
          </TextoInterface>
        </p>
      </div>
    </div>
    </CarrinhoProvider>
    </TraducaoProvider>
  )
}
