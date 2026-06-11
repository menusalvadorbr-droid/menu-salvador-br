// src/app/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { PromocoesCarrossel } from '@/features/home/PromocoesCarrossel'

type Estabelecimento = {
  id: string
  nome: string
  nome_fantasia: string
  slug: string
  bairro: string
  tipo_cozinha: string | null
  tipo_estabelecimento: string
  foto_capa: string | null
  logo_url: string | null
  destaque: boolean
  ativo: boolean
  descricao: string | null
  qrcode_short_url: string
}

type Modulo = {
  slug: string
  nome: string
  ativo: boolean
}

export default function HomePage() {
  const [estabelecimentos, setEstabelecimentos] = useState<Estabelecimento[]>([])
  const [filtrados, setFiltrados] = useState<Estabelecimento[]>([])
  const [loading, setLoading] = useState(true)
  const [bairros, setBairros] = useState<string[]>([])
  const [tiposCozinha, setTiposCozinha] = useState<{ id: number; nome: string; slug: string; icone: string }[]>([])
  const [tiposEstabelecimento, setTiposEstabelecimento] = useState<string[]>([])

  // Filtros
  const [busca, setBusca] = useState('')
  const [bairroSelecionado, setBairroSelecionado] = useState('')
  const [tipoCozinhaSelecionado, setTipoCozinhaSelecionado] = useState('')
  const [tipoEstabelecimentoSelecionado, setTipoEstabelecimentoSelecionado] = useState('')

  // Módulos e configurações
  const [modulos, setModulos] = useState<Modulo[]>([])
  const [heroBgImage, setHeroBgImage] = useState('')
  const [heroFontColor, setHeroFontColor] = useState('#ffffff')
  const [bannerTopoTexto, setBannerTopoTexto] = useState('')
  const [bannerSticky, setBannerSticky] = useState(false)
  const [footerHtml, setFooterHtml] = useState('')
  const [botaoLink, setBotaoLink] = useState('')
  const [botaoTexto, setBotaoTexto] = useState('')

  // Carregar módulos e configurações
  useEffect(() => {
    const carregarModulosEConfig = async () => {
      const { data: modulosData } = await supabase.from('modulos_home').select('*')
      if (modulosData) setModulos(modulosData)

      const { data: configData } = await supabase.from('configuracoes').select('*')
      const conf: Record<string, string> = {}
      configData?.forEach((c: any) => { conf[c.chave] = c.valor })

      setHeroBgImage(conf['hero_background_image'] || '')
      setHeroFontColor(conf['hero_font_color'] || '#ffffff')
      setBannerTopoTexto(conf['banner_topo_texto'] || '')
      setBannerSticky(conf['banner_topo_sticky'] === 'true')
      setFooterHtml(conf['footer_html'] || '<p>© 2025 Menu Salvador – Todos os direitos reservados.</p>')
      setBotaoLink(conf['botao_flutuante_link'] || 'https://wa.me/5571999999999')
      setBotaoTexto(conf['botao_flutuante_texto'] || '💬 WhatsApp')
    }
    carregarModulosEConfig()
  }, [])

  // Carregar estabelecimentos e listas de filtro
  useEffect(() => {
    const carregarEstabelecimentos = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('estabelecimentos')
        .select('id, nome, nome_fantasia, slug, bairro, tipo_cozinha, tipo_estabelecimento, foto_capa, logo_url, destaque, ativo, descricao, qrcode_short_url')
        .eq('ativo', true)
        .order('destaque', { ascending: false })
        .order('nome', { ascending: true })

      if (error) {
        console.error(error)
        setLoading(false)
        return
      }

      if (data) {
        setEstabelecimentos(data)
        setFiltrados(data)

        const bairrosUnicos = [...new Set(data.map(est => est.bairro).filter(Boolean))] as string[]
        setBairros(bairrosUnicos.sort())

        const tiposUnicos = [...new Set(data.map(est => est.tipo_estabelecimento).filter(Boolean))] as string[]
        setTiposEstabelecimento(tiposUnicos.sort())
      }
      setLoading(false)
    }

    const carregarTiposCozinha = async () => {
      const { data } = await supabase
        .from('tipos_cozinha')
        .select('id, nome, slug, icone')
        .eq('ativo', true)
        .order('ordem', { ascending: true })
      if (data) setTiposCozinha(data)
    }

    carregarEstabelecimentos()
    carregarTiposCozinha()
  }, [])

  // Filtrar estabelecimentos
  useEffect(() => {
    const aplicarFiltros = async () => {
      let query = supabase
        .from('estabelecimentos')
        .select(`
          id, nome, nome_fantasia, slug, bairro, tipo_cozinha, tipo_estabelecimento,
          foto_capa, logo_url, destaque, ativo, descricao, qrcode_short_url
        `)
        .eq('ativo', true)

      if (bairroSelecionado) query = query.eq('bairro', bairroSelecionado)
      if (tipoEstabelecimentoSelecionado) query = query.eq('tipo_estabelecimento', tipoEstabelecimentoSelecionado)
      if (busca) query = query.ilike('nome', `%${busca}%`)

      if (tipoCozinhaSelecionado) {
        const tipo = tiposCozinha.find(t => t.nome === tipoCozinhaSelecionado || t.slug === tipoCozinhaSelecionado)
        if (tipo) {
          const { data: ids } = await supabase
            .from('estabelecimento_tipos_cozinha')
            .select('estabelecimento_id')
            .eq('tipo_cozinha_id', tipo.id)
          const listaIds = ids?.map(i => i.estabelecimento_id) || []
          if (listaIds.length) query = query.in('id', listaIds)
          else {
            setFiltrados([])
            return
          }
        }
      }

      const { data } = await query.order('destaque', { ascending: false }).order('nome', { ascending: true })
      setFiltrados(data || [])
    }

    aplicarFiltros()
  }, [busca, bairroSelecionado, tipoCozinhaSelecionado, tipoEstabelecimentoSelecionado, tiposCozinha])

  const limparFiltros = () => {
    setBusca('')
    setBairroSelecionado('')
    setTipoCozinhaSelecionado('')
    setTipoEstabelecimentoSelecionado('')
  }

  const temFiltrosAtivos = busca || bairroSelecionado || tipoCozinhaSelecionado || tipoEstabelecimentoSelecionado

  const moduloAtivo = (slug: string) => {
    const modulo = modulos.find(m => m.slug === slug)
    return modulo ? modulo.ativo : true
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🍽️</div>
          <p className="text-gray-600">Carregando estabelecimentos...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Banner Topo */}
      {moduloAtivo('banner_topo') && bannerTopoTexto && (
        <div className={`${bannerSticky ? 'sticky top-0 z-40' : ''} bg-yellow-100 text-yellow-800 text-center py-2 text-sm`}>
          {bannerTopoTexto}
        </div>
      )}

      {/* Hero Section (sem filtros) */}
      {moduloAtivo('hero') && (
        <div
          className="relative text-white bg-cover bg-center min-h-[250px] md:min-h-[300px] flex items-center"
          style={{
            backgroundImage: heroBgImage ? `url(${heroBgImage})` : 'linear-gradient(to right, #f97316, #dc2626)',
            color: heroFontColor,
          }}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div className="container mx-auto px-4 text-center relative z-10">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">Descubra sabores de Salvador</h1>
            <p className="text-lg md:text-xl opacity-90 mb-0">Os melhores restaurantes, bares e petiscos em um só lugar</p>
          </div>
        </div>
      )}

      {/* Filtros (independentes do Hero) */}
      {moduloAtivo('filtros') && (
        <div className="container mx-auto px-4 py-6">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex flex-wrap gap-3 items-end">
              {/* Campo de busca por nome */}
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Buscar</label>
                <input
                  type="text"
                  placeholder="Nome do estabelecimento..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2"
                />
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Bairro</label>
                <select
                  value={bairroSelecionado}
                  onChange={(e) => setBairroSelecionado(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-white"
                >
                  <option value="">Todos os bairros</option>
                  {bairros.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Tipo de Cozinha</label>
                <select
                  value={tipoCozinhaSelecionado}
                  onChange={(e) => setTipoCozinhaSelecionado(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-white"
                >
                  <option value="">Todos os tipos</option>
                  {tiposCozinha.map(t => <option key={t.id} value={t.nome}>{t.icone} {t.nome}</option>)}
                </select>
              </div>
              <div className="flex-1 min-w-[150px]">
                <label className="block text-xs font-medium text-gray-500 mb-1">Categoria</label>
                <select
                  value={tipoEstabelecimentoSelecionado}
                  onChange={(e) => setTipoEstabelecimentoSelecionado(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 bg-white"
                >
                  <option value="">Todos os tipos</option>
                  {tiposEstabelecimento.map(tipo => {
                    let label = tipo
                    if (tipo === 'banca_acaraje') label = 'Banca de Acarajé'
                    if (tipo === 'foodtruck') label = 'Food Truck'
                    if (tipo === 'lanchonete') label = 'Lanchonete'
                    return <option key={tipo} value={tipo}>{label}</option>
                  })}
                </select>
              </div>
              {temFiltrosAtivos && (
                <button onClick={limparFiltros} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
                  Limpar filtros
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo principal (promoções + grid) */}
      <div className="container mx-auto px-4 pb-6">
        {moduloAtivo('promocoes') && (
          <div className="mb-8">
            <PromocoesCarrossel />
          </div>
        )}

        {moduloAtivo('grid_estabelecimentos') && (
          <div className="mt-6">
            {filtrados.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">😕</div>
                <p className="text-gray-500 text-lg">Nenhum estabelecimento encontrado com os filtros selecionados.</p>
                <button onClick={limparFiltros} className="mt-4 text-orange-600 hover:underline">Limpar filtros</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filtrados.map((est) => (
                  <Link key={est.id} href={`/estabelecimento/${est.slug}`} className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                    <div className="relative h-40 w-full bg-gray-200">
                      {est.foto_capa ? (
                        <img src={est.foto_capa} alt={est.nome_fantasia || est.nome} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-orange-100 to-red-100">🏪</div>
                      )}
                      {est.destaque && <div className="absolute top-2 right-2 bg-yellow-500 text-white text-xs font-bold px-2 py-1 rounded-full">⭐ Destaque</div>}
                    </div>
                    <div className="p-4">
                      <div className="flex items-center gap-3">
                        {est.logo_url ? (
                          <img src={est.logo_url} alt="Logo" className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">
                            {est.tipo_estabelecimento === 'banca_acaraje' ? '🫘' : est.tipo_estabelecimento === 'bar' ? '🍺' : '🍽️'}
                          </div>
                        )}
                        <div>
                          <h3 className="font-bold text-gray-800 line-clamp-1">{est.nome_fantasia || est.nome}</h3>
                          <p className="text-xs text-gray-500">{est.bairro}</p>
                        </div>
                      </div>
                      {est.descricao && <p className="text-sm text-gray-600 mt-2 line-clamp-2">{est.descricao}</p>}
                      <div className="mt-3 flex flex-wrap gap-1">
                        {est.tipo_cozinha && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">{est.tipo_cozinha}</span>}
                        {est.tipo_estabelecimento && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {est.tipo_estabelecimento === 'banca_acaraje' ? 'Acarajé' :
                             est.tipo_estabelecimento === 'foodtruck' ? 'Food Truck' :
                             est.tipo_estabelecimento === 'lanchonete' ? 'Lanchonete' : est.tipo_estabelecimento}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Botão Flutuante */}
      {moduloAtivo('botao_flutuante') && (
        <a
          href={botaoLink}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-40 bg-green-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center text-2xl hover:bg-green-600 transition"
        >
          {botaoTexto}
        </a>
      )}

      {/* Footer */}
      {moduloAtivo('footer') && (
        <footer className="bg-gray-100 py-6 mt-8 border-t">
          <div className="container mx-auto px-4 text-center">
            <div dangerouslySetInnerHTML={{ __html: footerHtml }} />
          </div>
        </footer>
      )}
    </main>
  )
}