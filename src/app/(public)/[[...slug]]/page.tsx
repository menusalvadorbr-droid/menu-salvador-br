import { supabase } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import Link from 'next/link'

// ============================================================
// FUNÇÃO AUXILIAR: STATUS ABERTO/FECHADO
// ============================================================

function getStatusAberto(horarios: any[]) {
  if (!horarios || horarios.length === 0) return null
  const agora = new Date()
  const diaSemana = agora.getDay()
  const horaAtual = agora.getHours() * 60 + agora.getMinutes()

  const horariosHoje = horarios.filter((h: any) => h.dia_semana === diaSemana && !h.fechado)
  if (horariosHoje.length === 0) return { aberto: false, mensagem: 'Fechado hoje' }

  const algumAberto = horariosHoje.some((h: any) => {
    const [hAbre, mAbre] = (h.horario_abertura || '00:00').split(':').map(Number)
    const [hFecha, mFecha] = (h.horario_fechamento || '00:00').split(':').map(Number)
    const abre = hAbre * 60 + mAbre
    const fecha = hFecha * 60 + mFecha
    return horaAtual >= abre && horaAtual < fecha
  })

  return algumAberto
    ? { aberto: true, mensagem: 'Aberto agora' }
    : { aberto: false, mensagem: 'Fechado' }
}

// ============================================================
// FUNÇÕES DE DETECÇÃO
// ============================================================

async function isTipo(cidade: string, termo: string) {
  const { count } = await supabase
    .from('estabelecimentos')
    .select('*', { count: 'exact', head: true })
    .eq('cidade', cidade)
    .eq('tipo_estabelecimento', termo)
    .limit(1)
  return (count ?? 0) > 0
}

async function isCidade(nome: string) {
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
  const { data: destaques } = await supabase
    .from('estabelecimentos')
    .select('*')
    .eq('status', 'active')
    .eq('ativo', true)
    .order('destaque', { ascending: false })
    .limit(12)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <header className="mb-8">
          <h1 className="text-4xl font-bold tracking-tight">Descubra os melhores sabores</h1>
          <p className="text-gray-500 mt-2 text-sm">Bares, restaurantes e petiscos em Salvador</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {destaques?.map((est) => (
            <Link
              key={est.id}
              href={`/${est.cidade}/${est.bairro}/${est.tipo_estabelecimento}/${est.slug}`}
              className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition transform overflow-hidden"
            >
              {est.galeria_fotos?.[0] && (
                <div className="h-40 w-full overflow-hidden">
                  <img src={est.galeria_fotos[0]} alt={est.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-lg line-clamp-1">{est.nome_fantasia || est.nome}</h3>
                <p className="text-xs text-gray-500 mt-1">{est.bairro} • {est.tipo_cozinha || 'Cozinha variada'}</p>
                <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                  <span className="flex items-center gap-1 text-yellow-500">★★★★☆ <span className="text-gray-500">4.2</span></span>
                  <span className="uppercase tracking-wide">Destaque</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// -------- CIDADE --------
async function CidadePage({ cidade }: { cidade: string }) {
  const { data: tipos } = await supabase
    .from('estabelecimentos')
    .select('tipo_estabelecimento')
    .eq('cidade', cidade)
    .eq('status', 'active')
    .eq('ativo', true)

  const tiposUnicos = [...new Set(tipos?.map((t: any) => t.tipo_estabelecimento).filter(Boolean))] as string[]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold capitalize tracking-tight">{cidade}</h1>
        <p className="text-gray-500 mt-1 text-sm">Explore categorias</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
          {tiposUnicos.map((tipo) => (
            <Link
              key={tipo}
              href={`/${cidade}/${tipo}`}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center hover:shadow-md hover:-translate-y-1 transition transform"
            >
              <div className="text-3xl mb-2">🍽️</div>
              <h2 className="font-semibold capitalize text-sm">{tipo}</h2>
              <p className="text-xs text-gray-400 mt-1">Ver estabelecimentos</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// -------- TIPO NA CIDADE (ex: /salvador/restaurante) --------
async function TipoNaCidadePage({ cidade, tipo }: { cidade: string; tipo: string }) {
  const { data: estabelecimentos } = await supabase
    .from('estabelecimentos')
    .select('*')
    .eq('cidade', cidade)
    .eq('tipo_estabelecimento', tipo)
    .eq('status', 'active')
    .eq('ativo', true)
    .order('destaque', { ascending: false })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold capitalize tracking-tight">{tipo} em {cidade}</h1>
        <p className="text-gray-500 mt-1 text-sm">{estabelecimentos?.length || 0} estabelecimentos</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {estabelecimentos?.map((est) => (
            <Link
              key={est.id}
              href={`/${cidade}/${est.bairro}/${est.tipo_estabelecimento}/${est.slug}`}
              className="block bg-white rounded-2xl shadow-sm border p-4 hover:shadow-lg transition"
            >
              <h3 className="font-bold">{est.nome_fantasia || est.nome}</h3>
              <p className="text-sm text-gray-500">{est.bairro}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// -------- BAIRRO (com ou sem cidade) --------
async function BairroPage({ cidade, bairro }: { cidade?: string; bairro: string }) {
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold capitalize tracking-tight">{bairro}{cidade && `, ${cidade}`}</h1>
        <p className="text-gray-500 mt-1 text-sm">{estabelecimentos?.length || 0} estabelecimentos</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {estabelecimentos?.map((est) => (
            <Link
              key={est.id}
              href={`${baseLink}/${est.tipo_estabelecimento}/${est.slug}`}
              className="block bg-white rounded-2xl shadow-sm border p-4 hover:shadow-lg transition"
            >
              <h3 className="font-bold">{est.nome_fantasia || est.nome}</h3>
              <p className="text-sm text-gray-500">{est.tipo_estabelecimento}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// -------- TIPO NO BAIRRO (ex: /salvador/pituba/restaurante) --------
async function TipoNoBairroPage({ cidade, bairro, tipo }: { cidade: string; bairro: string; tipo: string }) {
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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold capitalize tracking-tight">{tipo} – {bairro}, {cidade}</h1>
        <p className="text-gray-500 mt-1 text-sm">{estabelecimentos?.length || 0} estabelecimentos</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {estabelecimentos?.map((est) => (
            <Link
              key={est.id}
              href={`${baseLink}/${est.slug}`}
              className="block bg-white rounded-2xl shadow-sm border p-4 hover:shadow-lg transition"
            >
              <h3 className="font-bold">{est.nome_fantasia || est.nome}</h3>
              <p className="text-sm text-gray-500">{est.bairro}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

// -------- ESTABELECIMENTO (página completa) --------
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
  // Buscar estabelecimento
  let query = supabase
    .from('estabelecimentos')
    .select('*')
    .eq('slug', slug)
    .eq('cidade', cidade)
    .eq('bairro', bairro)
    .eq('tipo_estabelecimento', tipo)
    .eq('status', 'active')
    .eq('ativo', true)

  const { data: est, error } = await query.single()
  if (error || !est) notFound()

  // Buscar horários
  const { data: horarios } = await supabase
    .from('horarios_funcionamento')
    .select('*')
    .eq('estabelecimento_id', est.id)
    .order('dia_semana')

  const galeriaFotos = est.galeria_fotos || []
  const statusAberto = getStatusAberto(horarios)

  const enderecoCompleto = est.endereco
    ? `${est.endereco}, ${bairro}, ${cidade}, BA`
    : `${bairro}, ${cidade}, BA`

  const mapUrl = est.latitude && est.longitude
    ? `https://maps.google.com/maps?q=${est.latitude},${est.longitude}&z=16&output=embed`
    : `https://maps.google.com/maps?q=${encodeURIComponent(enderecoCompleto)}&output=embed`

  const nomeExibicao = est.nome_fantasia || est.nome

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-4">
        {/* Breadcrumb */}
        <nav className="text-xs text-gray-400 mb-4 flex flex-wrap gap-1">
          <Link href="/" className="hover:text-gray-600">Home</Link>
          <span>/</span>
          <Link href={`/${cidade}`} className="hover:text-gray-600 capitalize">{cidade}</Link>
          <span>/</span>
          <Link href={`/${cidade}/${bairro}`} className="hover:text-gray-600 capitalize">{bairro}</Link>
          <span>/</span>
          <Link href={`/${cidade}/${bairro}/${tipo}`} className="hover:text-gray-600 capitalize">{tipo}</Link>
          <span>/</span>
          <span className="text-gray-700 font-medium">{nomeExibicao}</span>
        </nav>

        {/* Hero – primeira foto da galeria */}
        {galeriaFotos.length > 0 && (
          <div className="w-full h-64 md:h-80 rounded-2xl overflow-hidden mb-6">
            <img src={galeriaFotos[0]} alt={nomeExibicao} className="w-full h-full object-cover" />
          </div>
        )}

        {/* Card principal */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border border-gray-100">
          <div className="flex items-start gap-4">
            {est.logo_url && (
              <img src={est.logo_url} alt={nomeExibicao} className="w-16 h-16 rounded-full object-cover border border-gray-200" />
            )}
            <div className="flex-1 space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">{nomeExibicao}</h1>
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                <span className="capitalize">{tipo}</span>
                <span className="text-gray-400">•</span>
                <span>{est.tipo_cozinha || 'Cozinha'}</span>
                <span className="text-gray-400">•</span>
                <span className="flex items-center gap-1 text-yellow-500">★★★★☆ <span className="text-gray-500">4.3</span></span>
                {statusAberto && (
                  <span className={`ml-2 px-3 py-1 rounded-full text-xs font-semibold ${statusAberto.aberto ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {statusAberto.aberto ? '🟢' : '🔴'} {statusAberto.mensagem}
                  </span>
                )}
              </div>
            </div>
          </div>
          {est.descricao && (
            <div className="mt-4 text-gray-700 text-sm prose prose-sm max-w-none leading-relaxed" dangerouslySetInnerHTML={{ __html: est.descricao }} />
          )}
        </div>

        {/* Seções (sem abas interativas) */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
          <div className="p-6 space-y-8">
            {/* Sobre */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-4">📝 Sobre</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">Endereço</h3>
                  <p className="text-gray-700 text-sm">{est.endereco || 'Endereço não informado'}</p>
                  <p className="text-gray-500 text-xs">{bairro} - {cidade}, BA</p>
                </div>
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-700">Contato</h3>
                  <div className="space-y-1 text-sm text-gray-700">
                    {est.telefone && <p>📞 {est.telefone}</p>}
                    {est.whatsapp && <p>💬 {est.whatsapp}</p>}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Localização</h3>
                  <div className="w-full h-56 rounded-xl overflow-hidden border border-gray-200">
                    <iframe src={mapUrl} width="100%" height="100%" style={{ border: 'none' }} loading="lazy" allowFullScreen />
                  </div>
                </div>
              </div>
            </div>

            {/* Cardápio */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">📋 Cardápio</h2>
              <p className="text-gray-500 text-sm">Cardápio em breve. Em versões futuras, você pode integrar fotos de pratos, preços e destaques.</p>
            </div>

            {/* Fotos */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">📸 Fotos</h2>
              {galeriaFotos.length > 0 ? (
                <div className="columns-2 md:columns-3 gap-3 space-y-3">
                  {galeriaFotos.map((url: string, i: number) => (
                    <img key={i} src={url} alt={`Foto ${i+1}`} className="rounded-xl w-full object-cover border border-gray-200" />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">Nenhuma foto disponível.</p>
              )}
            </div>

            {/* Horários */}
            <div>
              <h2 className="text-lg font-semibold text-gray-800 mb-2">🕒 Horários</h2>
              {horarios && horarios.length > 0 ? (
                <div className="space-y-3">
                  {['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'].map((dia, idx) => {
                    const periodos = horarios.filter((h: any) => h.dia_semana === idx)
                    const hoje = new Date().getDay() === idx
                    const todosFechados = periodos.every((h: any) => h.fechado)
                    return (
                      <div key={idx} className={`p-3 rounded-xl text-sm ${hoje ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50 border border-gray-100'}`}>
                        <div className="flex justify-between items-start">
                          <span className="font-medium">{hoje && '👉 '}{dia}</span>
                          <div className="text-right">
                            {todosFechados ? <span className="text-red-500">Fechado</span> :
                              periodos.map((h: any, i: number) => (
                                <div key={i} className="text-gray-700">
                                  {h.horario_abertura?.substring(0,5) || '--'} – {h.horario_fechamento?.substring(0,5) || '--'}
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-6 text-sm">Horários não cadastrados.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}