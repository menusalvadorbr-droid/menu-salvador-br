import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import EstablishmentCard from '@/components/public/EstablishmentCard'
import SectionHeading from '@/components/public/SectionHeading'
import StatusPill from '@/components/public/StatusPill'
import { isEstabelecimentoAberto } from '@/lib/statusAberto'
import Hero from '@/features/home/Hero'
import { PromocoesCarrossel } from '@/features/home/PromocoesCarrossel'
import ExploradorEstabelecimentos from '@/features/home/ExploradorEstabelecimentos'
import BotaoFlutuante from '@/features/home/BotaoFlutuante'

// ============================================================
// FUNÇÕES DE DETECÇÃO
// ============================================================

async function isTipo(cidade: string, termo: string) {
  const supabase = await createClient()
  const { count } = await supabase
    .from('estabelecimentos')
    .select('*', { count: 'exact', head: true })
    .eq('cidade', cidade)
    .eq('tipo_estabelecimento', termo)
    .limit(1)
  return (count ?? 0) > 0
}

async function isCidade(nome: string) {
  const supabase = await createClient()
  const { count } = await supabase
    .from('estabelecimentos')
    .select('*', { count: 'exact', head: true })
    .eq('cidade', nome)
    .limit(1)
  return (count ?? 0) > 0
}

// ============================================================
// COMPONENTE PRINCIPAL (ÚNICA FUNÇÃO Page)
// ============================================================

export default async function Page({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params

  // --- HOME ---
  if (!slug || slug.length === 0) {
    return <HomePage />
  }

  // --- 4 segmentos: estabelecimento ---
  if (slug.length === 4) {
    const [cidade, bairro, tipo, slugEst] = slug
    return <EstabelecimentoPage cidade={cidade} bairro={bairro} tipo={tipo} slug={slugEst} />
  }

  // --- 3 segmentos: tipo no bairro ---
  if (slug.length === 3) {
    const [cidade, bairro, tipo] = slug
    return <TipoNoBairroPage cidade={cidade} bairro={bairro} tipo={tipo} />
  }

  // --- 2 segmentos: cidade+tipo ou cidade+bairro ---
  if (slug.length === 2) {
    const [primeiro, segundo] = slug
    if (await isTipo(primeiro, segundo)) {
      return <TipoNaCidadePage cidade={primeiro} tipo={segundo} />
    } else {
      return <BairroPage cidade={primeiro} bairro={segundo} />
    }
  }

  // --- 1 segmento: cidade ou bairro ---
  if (slug.length === 1) {
    const [nome] = slug
    if (await isCidade(nome)) {
      return <CidadePage cidade={nome} />
    } else {
      return <BairroPage bairro={nome} />
    }
  }

  notFound()
}

// ============================================================
// PÁGINAS (Home, Cidade, Bairro, Tipo, Estabelecimento)
// ============================================================

// -------- HOME --------
async function HomePage() {
  const supabase = await createClient()
  const { count: totalEstabs } = await supabase
    .from('estabelecimentos')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')
    .eq('ativo', true)

  const { data: destaques } = await supabase
    .from('estabelecimentos')
    .select('*')
    .eq('status', 'active')
    .eq('ativo', true)
    .order('destaque', { ascending: false })
    .limit(30)

  return (
    <div>
      <Hero totalScans={0} totalEstabs={totalEstabs || 0} />
      <PromocoesCarrossel />
      <ExploradorEstabelecimentos estabelecimentosIniciais={destaques || []} />
      <BotaoFlutuante />
    </div>
  )
}

// -------- CIDADE --------
async function CidadePage({ cidade }: { cidade: string }) {
  const supabase = await createClient()
  const { data: tipos } = await supabase
    .from('estabelecimentos')
    .select('tipo_estabelecimento')
    .eq('cidade', cidade)
    .eq('status', 'active')
    .eq('ativo', true)

  const tiposUnicos = [...new Set(tipos?.map((t: any) => t.tipo_estabelecimento).filter(Boolean))] as string[]

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeading title={cidade} subtitle="Explore por categoria" />
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3">
        {tiposUnicos.map((tipo) => (
          <Link
            key={tipo}
            href={`/${cidade}/${tipo}`}
            className="group rounded-2xl border border-neutral-100 bg-white p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-md hover:border-orange-200"
          >
            <div className="mb-2 text-3xl">🍽️</div>
            <h2 className="text-sm font-semibold capitalize text-neutral-800 group-hover:text-orange-600">
              {tipo}
            </h2>
            <p className="mt-1 text-xs text-neutral-400">Ver estabelecimentos</p>
          </Link>
        ))}
        {tiposUnicos.length === 0 && (
          <p className="col-span-full py-12 text-center text-neutral-500">
            Nenhuma categoria encontrada nesta cidade.
          </p>
        )}
      </div>
    </div>
  )
}

// -------- TIPO NA CIDADE (ex: /salvador/restaurante) --------
async function TipoNaCidadePage({ cidade, tipo }: { cidade: string; tipo: string }) {
  const supabase = await createClient()
  const { data: estabelecimentos } = await supabase
    .from('estabelecimentos')
    .select('*')
    .eq('cidade', cidade)
    .eq('tipo_estabelecimento', tipo)
    .eq('status', 'active')
    .eq('ativo', true)
    .order('destaque', { ascending: false })

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeading
        title={`${tipo} em ${cidade}`}
        subtitle={`${estabelecimentos?.length || 0} estabelecimentos encontrados`}
      />
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {estabelecimentos?.map((est) => (
          <EstablishmentCard
            key={est.id}
            estabelecimento={est}
            href={`/${cidade}/${est.bairro}/${est.tipo_estabelecimento}/${est.slug}`}
          />
        ))}
        {estabelecimentos?.length === 0 && (
          <p className="col-span-full py-12 text-center text-neutral-500">
            Nenhum estabelecimento encontrado com esses filtros.
          </p>
        )}
      </div>
    </div>
  )
}

// -------- BAIRRO (com ou sem cidade) --------
async function BairroPage({ cidade, bairro }: { cidade?: string; bairro: string }) {
  const supabase = await createClient()
  let query = supabase
    .from('estabelecimentos')
    .select('*')
    .eq('bairro', bairro)
    .eq('status', 'active')
    .eq('ativo', true)

  if (cidade) query = query.eq('cidade', cidade)

  const { data: estabelecimentos } = await query
    .order('destaque', { ascending: false })
    .order('nome', { ascending: true })

  const baseLink = cidade ? `/${cidade}/${bairro}` : `/${bairro}`

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeading
        title={`${bairro}${cidade ? `, ${cidade}` : ''}`}
        subtitle={`${estabelecimentos?.length || 0} estabelecimentos encontrados`}
      />
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {estabelecimentos?.map((est) => (
          <EstablishmentCard
            key={est.id}
            estabelecimento={est}
            href={`${baseLink}/${est.tipo_estabelecimento}/${est.slug}`}
          />
        ))}
        {estabelecimentos?.length === 0 && (
          <p className="col-span-full py-12 text-center text-neutral-500">
            Nenhum estabelecimento encontrado neste bairro.
          </p>
        )}
      </div>
    </div>
  )
}

// -------- TIPO NO BAIRRO (ex: /salvador/pituba/restaurante) --------
async function TipoNoBairroPage({ cidade, bairro, tipo }: { cidade: string; bairro: string; tipo: string }) {
  const supabase = await createClient()
  const { data: estabelecimentos } = await supabase
    .from('estabelecimentos')
    .select('*')
    .eq('cidade', cidade)
    .eq('bairro', bairro)
    .eq('tipo_estabelecimento', tipo)
    .eq('status', 'active')
    .eq('ativo', true)
    .order('destaque', { ascending: false })

  const baseLink = `/${cidade}/${bairro}/${tipo}`

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <SectionHeading
        title={`${tipo} – ${bairro}, ${cidade}`}
        subtitle={`${estabelecimentos?.length || 0} estabelecimentos encontrados`}
      />
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
        {estabelecimentos?.map((est) => (
          <EstablishmentCard key={est.id} estabelecimento={est} href={`${baseLink}/${est.slug}`} />
        ))}
        {estabelecimentos?.length === 0 && (
          <p className="col-span-full py-12 text-center text-neutral-500">
            Nenhum estabelecimento encontrado com esses filtros.
          </p>
        )}
      </div>
    </div>
  )
}

// ============================================================
// ESTABELECIMENTO (página completa) – CORRIGIDO
// ============================================================

async function EstabelecimentoPage({
  cidade,
  bairro,
  tipo,
  slug,
}: {
  cidade: string
  bairro: string
  tipo: string
  slug: string
}) {
  const supabase = await createClient()

  console.log('🔍 Buscando estabelecimento:', { cidade, bairro, tipo, slug })

  // 1. Tentar buscar usando todos os filtros (mais específico)
  let query = supabase
    .from('estabelecimentos')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .eq('ativo', true)

  if (cidade) query = query.eq('cidade', cidade)
  if (bairro) query = query.eq('bairro', bairro)
  if (tipo) query = query.eq('tipo_estabelecimento', tipo)

  // Usar maybeSingle para evitar erro se não houver resultado
  const { data: est, error } = await query.maybeSingle()

  // Se encontrou, exibe
  if (est) {
    console.log('✅ Encontrado com todos os filtros:', est.nome)
    return <EstabelecimentoDetalhes est={est} />
  }

  // Se houve erro (ex: coluna não existe), loga e tenta fallback
  if (error) {
    console.error('❌ Erro ao buscar estabelecimento (detalhes):', JSON.stringify(error, null, 2))
    // Se o erro for de coluna, tentar sem o filtro de tipo
    if (error.code === '42703' || error.message?.includes('column')) {
      console.warn('⚠️ Coluna pode não existir. Tentando buscar sem filtro de tipo...')
      // Tenta sem o filtro de tipo
      const fallbackQuery = supabase
        .from('estabelecimentos')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'active')
        .eq('ativo', true)

      if (cidade) fallbackQuery.eq('cidade', cidade)
      if (bairro) fallbackQuery.eq('bairro', bairro)

      const { data: fallbackEst, error: fallbackError } = await fallbackQuery.maybeSingle()
      if (fallbackEst) {
        console.log('✅ Encontrado sem filtro de tipo:', fallbackEst.nome)
        return <EstabelecimentoDetalhes est={fallbackEst} />
      }
      if (fallbackError) {
        console.error('❌ Erro no fallback:', JSON.stringify(fallbackError, null, 2))
      }
    }
  }

  // 2. Fallback: buscar apenas por slug (mais tolerante)
  console.log('🔄 Tentando buscar apenas por slug...')
  const { data: estBySlug, error: slugError } = await supabase
    .from('estabelecimentos')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .eq('ativo', true)
    .maybeSingle()

  if (estBySlug) {
    console.log('✅ Encontrado apenas por slug:', estBySlug.nome)
    return <EstabelecimentoDetalhes est={estBySlug} />
  }

  if (slugError) {
    console.error('❌ Erro ao buscar apenas por slug:', JSON.stringify(slugError, null, 2))
  }

  // Se nada funcionar, retorna 404
  notFound()
}

// ============================================================
// COMPONENTE DE DETALHES DO ESTABELECIMENTO
// ============================================================

async function EstabelecimentoDetalhes({ est }: { est: any }) {
  const supabase = await createClient()

  // Buscar horários de funcionamento
  const { data: horarios } = await supabase
    .from('horarios_funcionamento')
    .select('*')
    .eq('estabelecimento_id', est.id)
    .order('dia_semana')

  const galeriaFotos: string[] = est.galeria_fotos || []
  const statusAberto = isEstabelecimentoAberto(horarios || [])

  const enderecoCompleto = est.endereco
    ? `${est.endereco}, ${est.bairro}, ${est.cidade || 'Salvador'}, BA`
    : `${est.bairro}, ${est.cidade || 'Salvador'}, BA`

  const mapUrl = est.latitude && est.longitude
    ? `https://maps.google.com/maps?q=${est.latitude},${est.longitude}&z=16&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(enderecoCompleto)}&output=embed`

  const nomeExibicao = est.nome_fantasia || est.nome
  const cidade = est.cidade || 'Salvador'
  const bairro = est.bairro

  return (
    <div className="pb-16">
      <div className="mx-auto max-w-5xl px-4 pt-6">
        {/* Hero – primeira foto da galeria */}
        {galeriaFotos.length > 0 && (
          <div className="mb-6 h-64 w-full overflow-hidden rounded-2xl md:h-80">
            <img src={galeriaFotos[0]} alt={nomeExibicao} className="h-full w-full object-cover" />
          </div>
        )}

        {/* Card principal */}
        <div className="mb-6 rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            {est.logo_url && (
              <img
                src={est.logo_url}
                alt={nomeExibicao}
                className="h-16 w-16 rounded-full border border-neutral-200 object-cover"
              />
            )}
            <div className="flex-1 space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-neutral-900">{nomeExibicao}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-neutral-600">
                <span className="capitalize">{est.tipo_estabelecimento || 'Restaurante'}</span>
                {est.tipo_cozinha && (
                  <>
                    <span className="text-neutral-300">•</span>
                    <span>{est.tipo_cozinha}</span>
                  </>
                )}
                {statusAberto.exibir && (
                  <StatusPill aberto={statusAberto.aberto} mensagem={statusAberto.texto} />
                )}
              </div>
            </div>
          </div>
          {est.descricao && (
            <div
              className="prose prose-sm mt-4 max-w-none text-sm leading-relaxed text-neutral-700"
              dangerouslySetInnerHTML={{ __html: est.descricao }}
            />
          )}
        </div>

        {/* Seções */}
        <div className="overflow-hidden rounded-2xl border border-neutral-100 bg-white shadow-sm">
          <div className="space-y-8 p-6">
            {/* Sobre */}
            <div>
              <h2 className="mb-4 text-lg font-semibold text-neutral-800">📝 Sobre</h2>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-neutral-700">Endereço</h3>
                  <p className="text-sm text-neutral-700">{est.endereco || 'Endereço não informado'}</p>
                  <p className="text-xs text-neutral-500">{bairro} - {cidade}, BA</p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-neutral-700">Contato</h3>
                  <div className="space-y-1 text-sm text-neutral-700">
                    {est.telefone && <p>📞 {est.telefone}</p>}
                    {est.whatsapp && <p>💬 {est.whatsapp}</p>}
                    {!est.telefone && !est.whatsapp && (
                      <p className="text-neutral-400">Contato não informado</p>
                    )}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <h3 className="mb-2 text-sm font-semibold text-neutral-700">Localização</h3>
                  <div className="h-56 w-full overflow-hidden rounded-xl border border-neutral-200">
                    <iframe
                      src={mapUrl}
                      width="100%"
                      height="100%"
                      style={{ border: 'none' }}
                      loading="lazy"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Cardápio */}
            <div>
              <h2 className="mb-2 text-lg font-semibold text-neutral-800">📋 Cardápio</h2>
              <Link
                href={`/cardapio/${est.slug}`}
                className="inline-block rounded-full bg-orange-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700"
              >
                Ver cardápio completo →
              </Link>
            </div>

            {/* Fotos */}
            <div>
              <h2 className="mb-2 text-lg font-semibold text-neutral-800">📸 Fotos</h2>
              {galeriaFotos.length > 0 ? (
                <div className="columns-2 gap-3 space-y-3 md:columns-3">
                  {galeriaFotos.map((url, i) => (
                    <img
                      key={i}
                      src={url}
                      alt={`Foto ${i + 1}`}
                      className="w-full rounded-xl border border-neutral-200 object-cover"
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-neutral-500">Nenhuma foto disponível.</p>
              )}
            </div>

            {/* Horários */}
            <div>
              <h2 className="mb-2 text-lg font-semibold text-neutral-800">🕒 Horários</h2>
              {horarios && horarios.length > 0 ? (
                <div className="space-y-3">
                  {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map((dia, idx) => {
                    const periodos = horarios.filter((h: any) => h.dia_semana === idx)
                    const hoje = new Date().getDay() === idx
                    const todosFechados = periodos.every((h: any) => h.fechado)
                    return (
                      <div
                        key={idx}
                        className={`rounded-xl p-3 text-sm ${
                          hoje ? 'border border-orange-200 bg-orange-50' : 'border border-neutral-100 bg-neutral-50'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className="font-medium">{hoje && '👉 '}{dia}</span>
                          <div className="text-right">
                            {todosFechados ? (
                              <span className="text-red-500">Fechado</span>
                            ) : (
                              periodos.map((h: any, i: number) => (
                                <div key={i} className="text-neutral-700">
                                  {h.horario_abertura?.substring(0, 5) || '--'} – {h.horario_fechamento?.substring(0, 5) || '--'}
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-neutral-500">Horários não cadastrados.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}