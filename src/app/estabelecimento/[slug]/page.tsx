'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import QRCode from 'react-qr-code'
import Lightbox from '@/components/ui/Lightbox'
import { isEstabelecimentoAberto } from '@/lib/statusAberto'

const DIAS_SEMANA = [
  { valor: 0, nome: 'Domingo' },
  { valor: 1, nome: 'Segunda-feira' },
  { valor: 2, nome: 'Terça-feira' },
  { valor: 3, nome: 'Quarta-feira' },
  { valor: 4, nome: 'Quinta-feira' },
  { valor: 5, nome: 'Sexta-feira' },
  { valor: 6, nome: 'Sábado' },
]

function getCloudinaryUrl(url: string | null, width: number, height: number): string {
  if (!url) return ''
  return url.replace('/upload/', `/upload/w_${width},h_${height},c_fill/`)
}

export default function PerfilEstabelecimento() {
  const params = useParams()
  const slug = params.slug as string

  const [estabelecimento, setEstabelecimento] = useState<any>(null)
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState('')
  const [modeloQR, setModeloQR] = useState<any>(null)
  const [horarios, setHorarios] = useState<any[]>([])
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const [statusAberto, setStatusAberto] = useState<{ aberto: boolean; texto: string; exibir: boolean }>({
    aberto: false,
    texto: '',
    exibir: false,
  })
  const [categoriaAberta, setCategoriaAberta] = useState<string | null>(null)
  const [mostrarCardapio, setMostrarCardapio] = useState(false)

  useEffect(() => {
    async function carregarEstabelecimento() {
      setLoading(true)
      const { data, error } = await supabase
        .from('estabelecimentos')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error || !data) {
        setErro('Estabelecimento não encontrado')
        setLoading(false)
        return
      }

      setEstabelecimento(data)

      supabase
        .from('estabelecimentos')
        .update({ visualizacoes: (data.visualizacoes || 0) + 1 })
        .eq('id', data.id)
        .then(() => {})

      if (data.qrcode_modelo) {
        const { data: modelo } = await supabase
          .from('modelos_qrcode')
          .select('*')
          .eq('slug', data.qrcode_modelo)
          .single()
        if (modelo) setModeloQR(modelo)
      } else {
        const { data: modeloPadrao } = await supabase
          .from('modelos_qrcode')
          .select('*')
          .eq('slug', 'classico')
          .single()
        if (modeloPadrao) setModeloQR(modeloPadrao)
      }

      const { data: horariosData } = await supabase
        .from('horarios_funcionamento')
        .select('*')
        .eq('estabelecimento_id', data.id)
        .order('dia_semana')
      setHorarios(horariosData || [])

      await carregarCardapio(data.id)
      setLoading(false)
    }

    if (slug) carregarEstabelecimento()
  }, [slug])

  useEffect(() => {
    setStatusAberto(isEstabelecimentoAberto(horarios))
    if (horarios.length > 0) {
      const interval = setInterval(() => {
        setStatusAberto(isEstabelecimentoAberto(horarios))
      }, 60000)
      return () => clearInterval(interval)
    }
  }, [horarios])

  const carregarCardapio = async (estabId: string) => {
    const { data: menu } = await supabase
      .from('menus')
      .select('id')
      .eq('estabelecimento_id', estabId)
      .eq('ativo', true)
      .single()

    if (menu) {
      const { data: cats } = await supabase
        .from('categorias')
        .select('*, itens_cardapio(*)')
        .eq('menu_id', menu.id)
        .order('ordem')

      if (cats) {
        const processadas = cats
          .map((cat: any) => ({
            ...cat,
            itens_cardapio: (cat.itens_cardapio || [])
              .filter((item: any) => item.disponivel)
              .sort((a: any, b: any) => a.ordem - b.ordem),
          }))
          .filter((cat: any) => cat.itens_cardapio.length > 0)

        const promocoes = processadas.filter(
          (cat: any) => cat.eh_promocao || cat.itens_cardapio.some((i: any) => i.promocao_ativa)
        )
        const normais = processadas.filter(
          (cat: any) => !cat.eh_promocao && !cat.itens_cardapio.some((i: any) => i.promocao_ativa)
        )

        setCategorias([...promocoes, ...normais])
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">🍽️</div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    )
  }

  if (erro || !estabelecimento) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center px-4">
          <div className="text-6xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-2">Estabelecimento não encontrado</h1>
          <Link href="/" className="text-orange-600 hover:underline">← Voltar para o diretório</Link>
        </div>
      </div>
    )
  }

  const frente = modeloQR?.cor_frente || '#000000'
  const fundo = modeloQR?.cor_fundo || '#FFFFFF'
  const urlQR = `menu.salvador.br/menu/${estabelecimento.qrcode_short_url}`
  const urlCapa = getCloudinaryUrl(estabelecimento?.foto_capa, 1200, 400)
  const googleMapsUrl = `https://maps.google.com/maps?q=${encodeURIComponent(
    `${estabelecimento.endereco}, ${estabelecimento.bairro}, Salvador, BA`
  )}&t=&z=16&ie=UTF8&iwloc=&output=embed`

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Banner de Status (Aberto/Fechado) */}
      {statusAberto.exibir && (
        <div className={`w-full py-2 px-4 text-center text-sm font-medium text-white ${
          statusAberto.aberto ? 'bg-green-600' : 'bg-red-600'
        }`}>
          {statusAberto.aberto ? '🟢' : '🔴'} {statusAberto.texto}
        </div>
      )}

      {/* Cabeçalho com foto de capa ou gradiente */}
      {urlCapa ? (
        <div className="relative w-full h-48 md:h-64 bg-cover bg-center" style={{ backgroundImage: `url(${urlCapa})` }}>
          <div className="absolute inset-0 bg-black/30" />
          <div className="container mx-auto px-4 py-6 relative z-10">
            <Link href="/" className="text-white/80 hover:text-white text-sm inline-flex items-center gap-1 mb-4">
              ← Voltar
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                {estabelecimento.tipo_estabelecimento === 'banca_acaraje' ? '🫘' :
                 estabelecimento.tipo_estabelecimento === 'bar' ? '🍺' :
                 estabelecimento.tipo_estabelecimento === 'restaurante' ? '🍽️' : '🏪'}
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">{estabelecimento.nome}</h1>
                <p className="text-white/80 text-sm">{estabelecimento.bairro} • {estabelecimento.tipo_cozinha}</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-br from-orange-600 to-red-700 text-white">
          <div className="container mx-auto px-4 py-6">
            <Link href="/" className="text-white/80 hover:text-white text-sm inline-flex items-center gap-1 mb-4">
              ← Voltar
            </Link>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">
                {estabelecimento.tipo_estabelecimento === 'banca_acaraje' ? '🫘' :
                 estabelecimento.tipo_estabelecimento === 'bar' ? '🍺' :
                 estabelecimento.tipo_estabelecimento === 'restaurante' ? '🍽️' : '🏪'}
              </div>
              <div>
                <h1 className="text-xl font-bold">{estabelecimento.nome}</h1>
                <p className="text-white/80 text-sm">{estabelecimento.bairro} • {estabelecimento.tipo_cozinha}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo principal */}
      <div className="container mx-auto px-4 py-6 max-w-3xl">
        {/* Seções superiores (Sobre, Localização, Horários, Mapa) - visíveis quando NÃO está mostrando cardápio */}
        {!mostrarCardapio && (
          <div className="space-y-6">
            {estabelecimento.descricao && (
              <div className="bg-white rounded-xl p-5 shadow-sm">
                <h2 className="text-lg font-bold text-gray-800 mb-3">📝 Sobre</h2>
                <p className="text-gray-600 leading-relaxed">{estabelecimento.descricao}</p>
              </div>
            )}

            {/* Localização e Contato */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-3">📍 Localização e Contato</h2>
              <div className="mb-4">
                <p className="text-gray-600">{estabelecimento.endereco}</p>
                <p className="text-sm text-gray-500">{estabelecimento.bairro} - Salvador/BA</p>
                {estabelecimento.cep && <p className="text-sm text-gray-400">CEP: {estabelecimento.cep}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {estabelecimento.whatsapp && (
                  <a href={`https://wa.me/55${estabelecimento.whatsapp.replace(/\D/g, '')}`} target="_blank"
                    className="flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-lg font-medium hover:bg-green-600 transition text-sm">
                    💬 WhatsApp
                  </a>
                )}
                {estabelecimento.instagram && (
                  <a href={`https://instagram.com/${estabelecimento.instagram.replace('@', '')}`} target="_blank"
                    className="flex items-center justify-center gap-2 bg-pink-500 text-white py-3 rounded-lg font-medium hover:bg-pink-600 transition text-sm">
                    📸 Instagram
                  </a>
                )}
                {estabelecimento.telefone && (
                  <a href={`tel:${estabelecimento.telefone}`}
                    className="flex items-center justify-center gap-2 bg-blue-500 text-white py-3 rounded-lg font-medium hover:bg-blue-600 transition text-sm">
                    📞 Ligar
                  </a>
                )}
                {estabelecimento.email && (
                  <a href={`mailto:${estabelecimento.email}`}
                    className="flex items-center justify-center gap-2 bg-gray-500 text-white py-3 rounded-lg font-medium hover:bg-gray-600 transition text-sm">
                    ✉️ Email
                  </a>
                )}
              </div>
            </div>

            {/* Horários */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-3">🕒 Horários</h2>
              <div className="space-y-2">
                {DIAS_SEMANA.map((dia) => {
                  const horario = horarios.find((h: any) => h.dia_semana === dia.valor)
                  const hoje = new Date().getDay() === dia.valor
                  return (
                    <div key={dia.valor}
                      className={`flex justify-between items-center text-sm p-2 rounded-lg ${hoje ? 'bg-orange-100 font-bold' : ''}`}>
                      <span className="text-gray-600 w-28">{hoje ? '👉 ' : ''}{dia.nome}</span>
                      {horario?.fechado ? (
                        <span className="text-red-500 font-medium">Fechado</span>
                      ) : (
                        <span className="font-medium text-gray-800">
                          {horario?.horario_abertura?.substring(0, 5) || '08:00'} -{' '}
                          {horario?.horario_fechamento?.substring(0, 5) || '18:00'}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="text-xs text-gray-400 mt-3">* Os horários podem variar em feriados.</p>
            </div>

            {/* Mapa */}
            <div className="bg-white rounded-xl p-5 shadow-sm">
              <h2 className="text-lg font-bold text-gray-800 mb-3">🗺️ Mapa</h2>
              <div className="w-full h-64 rounded-lg overflow-hidden">
                <iframe src={googleMapsUrl} width="100%" height="100%"
                  style={{ border: 'none', borderRadius: '8px' }}
                  title="Localização do estabelecimento" loading="lazy" />
              </div>
            </div>
          </div>
        )}

        {/* Botão CARDÁPIO (abaixo do mapa) */}
        <div className="mt-6 mb-6">
          <button
            onClick={() => {
              setMostrarCardapio(!mostrarCardapio)
              setCategoriaAberta(null)
              if (!mostrarCardapio) {
                setTimeout(() => {
                  document.getElementById('cardapio-section')?.scrollIntoView({ behavior: 'smooth' })
                }, 100)
              }
            }}
            className="w-full bg-orange-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-orange-700 transition shadow-lg flex items-center justify-center gap-2"
          >
            📋 {mostrarCardapio ? 'Fechar Cardápio' : 'Ver Cardápio Completo'}
          </button>
        </div>

        {/* Cardápio (expansível) */}
        {mostrarCardapio && (
          <div id="cardapio-section" className="bg-white rounded-xl p-5 shadow-sm mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4">📋 Cardápio</h2>
            {categorias.length > 0 ? (
              <div className="space-y-2">
                {categorias.map((cat: any) => {
                  const isOpen = categoriaAberta === cat.id
                  return (
                    <div key={cat.id} className="border border-gray-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setCategoriaAberta(isOpen ? null : cat.id)}
                        className="w-full p-4 flex justify-between items-center bg-gray-50 hover:bg-gray-100 transition"
                      >
                        <h3 className="font-bold text-gray-900 text-left">
                          {cat.nome}
                          <span className="text-sm text-gray-500 ml-2 font-normal">
                            ({cat.itens_cardapio?.length || 0} itens)
                          </span>
                        </h3>
                        <span className="text-gray-400 text-lg">{isOpen ? '▲' : '▼'}</span>
                      </button>
                      {isOpen && (
                        <div className="p-4 space-y-3">
                          {(cat.itens_cardapio || []).map((item: any) => {
                            const promocao = item.promocao_ativa && item.preco_promocional
                            return (
                              <div key={item.id}
                                className={`p-3 rounded-lg transition ${promocao ? 'bg-red-50 border border-red-200' : 'bg-gray-50 border border-gray-100'}`}>
                                <div className="flex justify-between items-start gap-3">
                                  <div className="flex-1">
                                    {item.foto_url && (
                                      <div className="w-full h-32 mb-2 rounded-lg overflow-hidden cursor-pointer"
                                        onClick={() => setLightboxSrc(item.foto_url)}>
                                        <img src={item.foto_url} alt={item.nome}
                                          className="w-full h-full object-cover hover:scale-105 transition" />
                                      </div>
                                    )}
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {item.codigo && (
                                        <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">#{item.codigo}</span>
                                      )}
                                      <h4 className="font-semibold text-gray-900 text-sm">{item.nome}</h4>
                                      {item.promocao_ativa && (
                                        <span className="text-xs bg-red-500 text-white px-1.5 py-0.5 rounded animate-pulse">
                                          {item.promocao_titulo || 'Promoção!'}
                                        </span>
                                      )}
                                    </div>
                                    {item.descricao && <p className="text-xs text-gray-500 mt-1">{item.descricao}</p>}
                                    {item.tags && item.tags.length > 0 && (
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        {item.tags.map((tag: string) => (
                                          <span key={tag} className="text-xs bg-white border px-1.5 py-0.5 rounded-full text-gray-500">{tag}</span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-right flex-shrink-0">
                                    {promocao ? (
                                      <>
                                        <div className="text-xs text-gray-400 line-through">R$ {item.preco?.toFixed(2)}</div>
                                        <div className="text-lg font-bold text-green-600">R$ {item.preco_promocional?.toFixed(2)}</div>
                                      </>
                                    ) : (
                                      <div className="text-base font-bold text-gray-900">R$ {item.preco?.toFixed(2)}</div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center text-gray-500">Nenhum item disponível no momento.</div>
            )}
          </div>
        )}

        {/* QR Code (apenas desktop) */}
        <div className="hidden md:block bg-white rounded-xl p-6 shadow-sm text-center">
          <h2 className="text-lg font-bold text-gray-800 mb-4">📱 Cardápio Digital</h2>
          <div className="bg-gray-100 p-4 rounded-xl inline-block">
            <QRCode value={`https://${urlQR}`} size={160} bgColor={fundo} fgColor={frente} level="H" />
          </div>
          <p className="text-sm text-gray-500 mt-2">{urlQR}</p>
        </div>
      </div>

      {/* Botão flutuante GRANDE - DELIVERY ou PEDIR */}
      {estabelecimento.whatsapp && (
        <div className="fixed bottom-4 right-4 z-50 md:bottom-6 md:right-6">
          {estabelecimento.recursos_ativos?.includes('delivery') ? (
            <Link
              href={`/menu/${estabelecimento.qrcode_short_url}`}
              className="bg-red-600 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-2 text-lg font-bold hover:bg-red-700 transition animate-bounce"
              title="Fazer Pedido Delivery"
            >
              🛵 DELIVERY
            </Link>
          ) : (
            <Link
              href={`/menu/${estabelecimento.qrcode_short_url}`}
              className="bg-red-600 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-2 text-lg font-bold hover:bg-red-700 transition"
              title="Ver Cardápio"
            >
              📱 PEDIR
            </Link>
          )}
        </div>
      )}

      {lightboxSrc && (
        <Lightbox src={lightboxSrc} alt="Foto do item" onClose={() => setLightboxSrc(null)} />
      )}
    </main>
  )
}