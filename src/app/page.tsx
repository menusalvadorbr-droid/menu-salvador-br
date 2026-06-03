'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const BAIRROS = ['Barra', 'Rio Vermelho', 'Pelourinho', 'Itapuã', 'Pituba', 'Stella Maris', 'Ondina', 'Amaralina', 'Boca do Rio', 'Caminho das Árvores', 'Comércio']

const TIPOS_COZINHA = [
  { value: 'baiana', label: '🥘 Baiana' },
  { value: 'acaraje', label: '🫘 Acarajé' },
  { value: 'italiana', label: '🍝 Italiana' },
  { value: 'japonesa', label: '🍣 Japonesa' },
  { value: 'brasileira', label: '🇧🇷 Brasileira' },
  { value: 'hamburguer', label: '🍔 Hambúrguer' },
  { value: 'contemporanea', label: '🍽️ Contemporânea' }
]

const ICONES_TIPO: Record<string, string> = {
  banca_acaraje: '🫘',
  bar: '🍺',
  restaurante: '🍽️',
  cafeteria: '☕',
  foodtruck: '🚚',
  lanchonete: '🥪',
}

export default function Home() {
  const [estabelecimentos, setEstabelecimentos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtros, setFiltros] = useState({ bairro: '', tipoCozinha: '', busca: '' })
  const [stats, setStats] = useState({ totalScans: 0, totalEstabs: 0 })

  useEffect(() => { carregarEstabelecimentos() }, [filtros])
  useEffect(() => { carregarStats() }, [])

  const carregarStats = async () => {
    const { data } = await supabase.from('estabelecimentos').select('scans_qrcode')
    if (data) setStats({ totalScans: data.reduce((s: number, e: any) => s + (e.scans_qrcode || 0), 0), totalEstabs: data.length })
  }

  const carregarEstabelecimentos = async () => {
    setLoading(true)
    let query = supabase.from('estabelecimentos').select('*').eq('ativo', true).order('destaque', { ascending: false }).order('scans_qrcode', { ascending: false })
    if (filtros.bairro) query = query.eq('bairro', filtros.bairro)
    if (filtros.tipoCozinha) query = query.eq('tipo_cozinha', filtros.tipoCozinha)
    if (filtros.busca) query = query.ilike('nome', `%${filtros.busca}%`)
    const { data } = await query
    setEstabelecimentos(data || [])
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white">
      <div className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-2 px-4 text-center text-sm font-medium">
        🏪 É dono de restaurante? <Link href="/login" className="underline font-bold hover:text-yellow-200">Cadastre seu cardápio digital grátis</Link>
      </div>

      <section className="relative bg-gradient-to-br from-orange-600 via-red-500 to-yellow-500 text-white py-20 md:py-28 overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          <h1 className="text-5xl md:text-7xl font-black mb-4">menu<span className="text-yellow-300">.</span>salvador</h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-2xl mx-auto">Descubra onde comer agora mesmo. Escaneie o QR Code na mesa e veja o cardápio sem baixar nada.</p>
          <div className="flex justify-center gap-8 mb-8 text-white/80 text-sm">
            <span>📱 {stats.totalScans} scans hoje</span>
            <span>🏪 {stats.totalEstabs} estabelecimentos</span>
          </div>
          <div className="max-w-2xl mx-auto flex bg-white rounded-full shadow-2xl overflow-hidden">
            <input type="text" placeholder="Buscar restaurante, acarajé, bar..." className="flex-1 px-6 py-4 text-gray-800 outline-none text-lg" value={filtros.busca} onChange={e => setFiltros({...filtros, busca: e.target.value})} />
            <button className="bg-orange-500 hover:bg-orange-400 text-white px-8 py-4 font-semibold transition">🔍 Buscar</button>
          </div>
        </div>
      </section>

      <div className="bg-white shadow-sm sticky top-0 z-30 border-b">
        <div className="container mx-auto px-4 py-3 flex gap-3 overflow-x-auto">
          <select className="border-2 border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:border-orange-300 transition" value={filtros.bairro} onChange={e => setFiltros({...filtros, bairro: e.target.value})}>
            <option value="">📍 Todos os bairros</option>
            {BAIRROS.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <select className="border-2 border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:border-orange-300 transition" value={filtros.tipoCozinha} onChange={e => setFiltros({...filtros, tipoCozinha: e.target.value})}>
            <option value="">🍳 Todas as cozinhas</option>
            {TIPOS_COZINHA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          {(filtros.bairro || filtros.tipoCozinha || filtros.busca) && (
            <button onClick={() => setFiltros({bairro: '', tipoCozinha: '', busca: ''})} className="text-sm text-red-500 hover:text-red-700 font-medium whitespace-nowrap">✕ Limpar filtros</button>
          )}
        </div>
      </div>

      <section className="container mx-auto px-4 py-12">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm p-4 animate-pulse">
                <div className="h-48 bg-gray-200 rounded-xl mb-4"></div>
                <div className="h-6 bg-gray-200 w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-3xl font-bold text-gray-800">{estabelecimentos.length} lugar{estabelecimentos.length !== 1 ? 'es' : ''} encontrado{estabelecimentos.length !== 1 ? 's' : ''}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {estabelecimentos.map(est => (
                <Link key={est.id} href={`/estabelecimento/${est.slug}`} className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:border-orange-200">
                  <div className="relative h-48 bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center text-6xl">
                    {ICONES_TIPO[est.tipo_estabelecimento] || '🏪'}
                    {est.destaque && <span className="absolute top-3 left-3 bg-yellow-400 text-yellow-900 text-xs px-3 py-1 rounded-full font-bold shadow">⭐ Destaque</span>}
                    {est.scans_qrcode > 50 && <span className="absolute top-3 right-3 bg-black/40 text-white text-xs px-3 py-1 rounded-full backdrop-blur">🔥 Popular</span>}
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-xl text-gray-900 mb-1 group-hover:text-orange-600 transition">{est.nome}</h3>
                    <div className="flex items-center gap-2 text-gray-600 text-sm mb-2"><span>📍 {est.bairro}</span><span>•</span><span>{est.tipo_cozinha}</span></div>
                    <p className="text-gray-500 text-sm line-clamp-2 mb-3">{est.descricao || 'Cardápio digital disponível'}</p>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-orange-600 font-medium group-hover:underline">📱 Ver cardápio →</span>
                      {est.whatsapp && <span className="text-green-600">💬</span>}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </section>

      <footer className="bg-gray-900 text-white py-12 mt-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold mb-4">menu.salvador.br</h2>
          <p className="text-gray-400 mb-6">O diretório de cardápios digitais de Salvador</p>
          <div className="flex justify-center gap-6 text-sm">
            <Link href="/login" className="hover:text-orange-400">Sou Dono</Link>
            <Link href="/admin" className="hover:text-orange-400">Admin</Link>
            <span className="text-gray-500">© 2024</span>
          </div>
        </div>
      </footer>
    </main>
  )
}