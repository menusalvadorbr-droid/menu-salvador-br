'use client'

import { useState, useEffect } from 'react'
import { useModulosHome } from '@/features/home/useModulosHome'
import { supabase } from '@/lib/supabase'

import BannerTopo from '@/features/home/BannerTopo'
import Hero from '@/features/home/Hero'
import Filtros from '@/features/home/Filtros'
import GridEstabelecimentos from '@/features/home/GridEstabelecimentos'
import BotaoFlutuante from '@/features/home/BotaoFlutuante'
import Footer from '@/features/home/Footer'
import PromocoesCarrossel from '@/features/home/PromocoesCarrossel'

export default function Home() {
  const { modulosAtivos, backgroundImage, fontColor, loading } = useModulosHome()
  const [estabelecimentos, setEstabelecimentos] = useState<any[]>([])
  const [filtros, setFiltros] = useState({ bairro: '', tipoCozinha: '' })
  const [stats, setStats] = useState({ totalScans: 0, totalEstabs: 0 })

  useEffect(() => {
    carregarEstabelecimentos()
    carregarStats()
  }, [filtros])

  const carregarStats = async () => {
    const { data } = await supabase.from('estabelecimentos').select('scans_qrcode')
    if (data) {
      setStats({
        totalScans: data.reduce((sum: number, e: any) => sum + (e.scans_qrcode || 0), 0),
        totalEstabs: data.length,
      })
    }
  }

  const carregarEstabelecimentos = async () => {
    let query = supabase
      .from('estabelecimentos')
      .select('*')
      .eq('ativo', true)
      .order('destaque', { ascending: false })
      .order('scans_qrcode', { ascending: false })

    if (filtros.bairro) query = query.eq('bairro', filtros.bairro)
    if (filtros.tipoCozinha) query = query.eq('tipo_cozinha', filtros.tipoCozinha)

    const { data } = await query
    setEstabelecimentos(data || [])
  }

  if (loading) return <div className="min-h-screen bg-white"></div>

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      {modulosAtivos.includes('banner-topo') && <BannerTopo />}
      {modulosAtivos.includes('hero') && (
        <Hero
          backgroundImage={backgroundImage}
          fontColor={fontColor}
          totalScans={stats.totalScans}
          totalEstabs={stats.totalEstabs}
        />
      )}
      {modulosAtivos.includes('filtros') && (
        <Filtros bairro={filtros.bairro} tipoCozinha={filtros.tipoCozinha} onChange={setFiltros} />
      )}
      {modulosAtivos.includes('promocoes') && <PromocoesCarrossel />}
      {modulosAtivos.includes('grid') && (
        <section className="container mx-auto px-4 py-12">
          <h2 className="text-3xl font-bold text-gray-800 mb-8">
            {estabelecimentos.length} lugar{estabelecimentos.length !== 1 ? 'es' : ''} encontrado{estabelecimentos.length !== 1 ? 's' : ''}
          </h2>
          <GridEstabelecimentos estabelecimentos={estabelecimentos} />
        </section>
      )}
      {modulosAtivos.includes('botao-flutuante') && <BotaoFlutuante />}
      {modulosAtivos.includes('footer') && <Footer />}
    </main>
  )
}