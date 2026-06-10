// src/app/painel/page.tsx
'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { DashboardTab } from './components/DashboardTab'
import { CardapioTab } from './components/cardapio/CardapioTab'
import { PerfilTab } from './components/PerfilTab'
import { ConfiguracoesTab } from './components/ConfiguracoesTab'
import { useCardapio } from './components/cardapio/hooks/useCardapio'

const TEMAS_PADRAO = ['raiz-brasileira']

const OPCOES_IDIOMAS = [
  { cod: 'pt', nome: 'Português', bandeira: '🇧🇷' },
  { cod: 'en', nome: 'Inglês', bandeira: '🇺🇸' },
  { cod: 'es', nome: 'Espanhol', bandeira: '🇪🇸' },
]

function capitalizarTexto(texto: string): string {
  if (!texto) return ''
  return texto
    .toLowerCase()
    .replace(/(?:^|\s)\S/g, (l) => l.toUpperCase())
}

function formatarEndereco(
  tipoLogradouro: string | null,
  logradouro: string | null,
  numero: string | null
): string {
  const partes: string[] = []
  if (tipoLogradouro) partes.push(capitalizarTexto(tipoLogradouro))
  if (logradouro) partes.push(capitalizarTexto(logradouro))
  if (numero) partes.push(numero.trim())
  return partes.join(', ').trim()
}

export default function PainelDono() {
  const router = useRouter()

  const [usuario, setUsuario] = useState<any>(null)
  const [estabelecimento, setEstabelecimento] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [abaAtiva, setAbaAtiva] = useState('dashboard')
  const [menuAberto, setMenuAberto] = useState(false)

  const {
    categorias,
    isLoading: loadingCardapio,
    updateItem,
    deleteItem,
    addItem,
    revalidate: revalidateCardapio,
  } = useCardapio(estabelecimento?.id)

  const [modeloVisual, setModeloVisual] = useState<'sem-foto' | 'foto-esquerda' | 'foto-topo'>('foto-esquerda')
  const [temaSelecionado, setTemaSelecionado] = useState('raiz-brasileira')
  const [temasDisponiveis, setTemasDisponiveis] = useState<any[]>([])
  const [temasPermitidos, setTemasPermitidos] = useState<string[]>(TEMAS_PADRAO)
  const [imagemFundo, setImagemFundo] = useState('')
  const [limitePlano, setLimitePlano] = useState(15)
  const [limiteGaleria, setLimiteGaleria] = useState(1)
  const [modelosQRDisponiveis, setModelosQRDisponiveis] = useState<any[]>([])
  const [modelosQRPermitidos, setModelosQRPermitidos] = useState<string[]>([])
  const [modeloQRSelecionado, setModeloQRSelecionado] = useState('classico')
  const [recursosAtivos, setRecursosAtivos] = useState<string[]>([])
  const [recursosPermitidos, setRecursosPermitidos] = useState<string[]>([])
  const [recursosDisponiveis, setRecursosDisponiveis] = useState<any[]>([])
  const [planosList, setPlanosList] = useState<any[]>([])

  const [idiomasSelecionados, setIdiomasSelecionados] = useState<string[]>(['pt'])

  const [perfil, setPerfil] = useState({
    cnpj: '',
    razao_social: '',
    nome_fantasia: '',
    endereco: '',
    bairro: '',
    cep: '',
    telefone: '',
    whatsapp: '',
    instagram: '',
    email: '',
    latitude: null as number | null,
    longitude: null as number | null,
    tipos_cozinha_ids: [] as number[],
  })
  const [editandoPerfil, setEditandoPerfil] = useState(false)
  const [salvandoPerfil, setSalvandoPerfil] = useState(false)
  const [buscandoCnpj, setBuscandoCnpj] = useState(false)

  const [horarios, setHorarios] = useState<any[]>([])
  const [whatsappMensagem, setWhatsappMensagem] = useState('')
  const [whatsappAtivo, setWhatsappAtivo] = useState(false)

  const carregarEstabelecimento = useCallback(async (id: string) => {
    const { data, error } = await supabase
      .from('estabelecimentos')
      .select('*')
      .eq('id', id)
      .single()
    if (error || !data) return

    setEstabelecimento(data)
    setPerfil({
      cnpj: data.cnpj || '',
      razao_social: data.razao_social || '',
      nome_fantasia: data.nome_fantasia || data.nome || '',
      endereco: data.endereco || '',
      bairro: data.bairro || '',
      cep: data.cep || '',
      telefone: data.telefone || '',
      whatsapp: data.whatsapp || '',
      instagram: data.instagram || '',
      email: data.email || '',
      latitude: data.latitude || null,
      longitude: data.longitude || null,
      tipos_cozinha_ids: [],
    })
    setWhatsappMensagem(data.whatsapp_config?.mensagem_padrao || 'Olá! Vim pelo cardápio digital.')
    setWhatsappAtivo(data.whatsapp_config?.ativo ?? !!data.whatsapp)
    setIdiomasSelecionados(data.idiomas_ativos || ['pt'])
    setImagemFundo(data.imagem_fundo || '')

    const { data: tiposVinculados } = await supabase
      .from('estabelecimento_tipos_cozinha')
      .select('tipo_cozinha_id')
      .eq('estabelecimento_id', id)
    setPerfil(prev => ({ ...prev, tipos_cozinha_ids: tiposVinculados?.map(t => t.tipo_cozinha_id) || [] }))

    await carregarLayoutSalvo(data.id)
    await carregarTemasEPlano(data.id, data.plano_id)
    await carregarModelosQR(data.id, data.plano_id)
    await carregarRecursos(data.id, data.plano_id)
    await carregarHorarios(data.id)
  }, [])

  const carregarLayoutSalvo = async (estabId: string) => {
    const { data: menu } = await supabase
      .from('menus')
      .select('layout_cardapio, tema')
      .eq('estabelecimento_id', estabId)
      .eq('ativo', true)
      .single()
    if (menu?.layout_cardapio) setModeloVisual(menu.layout_cardapio)
    if (menu?.tema) setTemaSelecionado(menu.tema)
  }

  const carregarTemasEPlano = async (estabId: string, planoId?: string) => {
    let idPlano = planoId
    if (!idPlano) {
      const { data: e } = await supabase.from('estabelecimentos').select('plano_id').eq('id', estabId).single()
      idPlano = e?.plano_id
    }
    if (idPlano) {
      const { data: plano } = await supabase.from('planos').select('temas_permitidos, limite_itens, recursos_permitidos, limite_galeria').eq('id', idPlano).single()
      if (plano) {
        setTemasPermitidos(plano.temas_permitidos || TEMAS_PADRAO)
        setLimitePlano(plano.limite_itens || 15)
        setRecursosPermitidos(plano.recursos_permitidos || [])
        setLimiteGaleria(plano.limite_galeria || 1)
      }
    } else {
      const { data: pg } = await supabase.from('planos').select('temas_permitidos, limite_itens, recursos_permitidos, limite_galeria').eq('slug', 'gratis').single()
      if (pg) {
        setTemasPermitidos(pg.temas_permitidos || TEMAS_PADRAO)
        setLimitePlano(pg.limite_itens || 15)
        setRecursosPermitidos(pg.recursos_permitidos || [])
        setLimiteGaleria(pg.limite_galeria || 1)
      }
    }
    const { data: todos } = await supabase.from('temas').select('*')
    if (todos) setTemasDisponiveis(todos)
  }

  const carregarModelosQR = async (estabId: string, planoId?: string) => {
    let idPlano = planoId
    if (!idPlano) {
      const { data: e } = await supabase.from('estabelecimentos').select('plano_id').eq('id', estabId).single()
      idPlano = e?.plano_id
    }
    if (idPlano) {
      const { data: p } = await supabase.from('planos').select('modelos_qrcode_permitidos').eq('id', idPlano).single()
      if (p) setModelosQRPermitidos(p.modelos_qrcode_permitidos || [])
    } else {
      const { data: pg } = await supabase.from('planos').select('modelos_qrcode_permitidos').eq('slug', 'gratis').single()
      if (pg) setModelosQRPermitidos(pg.modelos_qrcode_permitidos || [])
    }
    const { data: todos } = await supabase.from('modelos_qrcode').select('*')
    if (todos) setModelosQRDisponiveis(todos)
    if (estabId) {
      const { data: e } = await supabase.from('estabelecimentos').select('qrcode_modelo').eq('id', estabId).single()
      if (e?.qrcode_modelo) setModeloQRSelecionado(e.qrcode_modelo)
    }
  }

  const carregarRecursos = async (estabId: string, planoId?: string) => {
    const { data: estab } = await supabase.from('estabelecimentos').select('recursos_ativos').eq('id', estabId).single()
    if (estab?.recursos_ativos && estab.recursos_ativos.length > 0) {
      setRecursosAtivos(estab.recursos_ativos)
    } else {
      const { data: plano } = await supabase.from('planos').select('recursos_permitidos').eq('id', planoId).single()
      const padrao = plano?.recursos_permitidos || []
      setRecursosAtivos(padrao)
      await supabase.from('estabelecimentos').update({ recursos_ativos: padrao }).eq('id', estabId)
    }
  }

  const carregarHorarios = async (estabId: string) => {
    const { data } = await supabase.from('horarios_funcionamento').select('*').eq('estabelecimento_id', estabId).order('dia_semana')
    const DIAS_SEMANA = [0, 1, 2, 3, 4, 5, 6]
    setHorarios(DIAS_SEMANA.map(dia => data?.find(h => h.dia_semana === dia) || { dia_semana: dia, horario_abertura: '08:00', horario_fechamento: '18:00', fechado: false, estabelecimento_id: estabId }))
  }

  const buscarCnpj = async (cnpjNumeros: string) => {
    if (cnpjNumeros.length !== 14) return
    setBuscandoCnpj(true)
    try {
      const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjNumeros}`)
      if (!res.ok) throw new Error('CNPJ não encontrado')
      const data = await res.json()
      if (data) {
        const enderecoCompleto = formatarEndereco(data.descricao_tipo_de_logradouro || null, data.logradouro || null, data.numero || null)
        setPerfil(prev => ({
          ...prev,
          cnpj: cnpjNumeros,
          razao_social: data.razao_social || '',
          nome_fantasia: data.nome_fantasia || data.razao_social || '',
          endereco: enderecoCompleto,
          bairro: capitalizarTexto(data.bairro || ''),
          cep: data.cep || '',
          telefone: data.ddd_telefone_1 || '',
          whatsapp: '',
          instagram: '',
          email: '',
          latitude: data.estabelecimento?.latitude ? parseFloat(data.estabelecimento.latitude) : prev.latitude,
          longitude: data.estabelecimento?.longitude ? parseFloat(data.estabelecimento.longitude) : prev.longitude,
        }))
        alert('Dados preenchidos automaticamente. Verifique e corrija se necessário.')
      }
    } catch (error) {
      console.error(error)
      alert('Erro ao consultar CNPJ. Verifique o número digitado.')
    } finally {
      setBuscandoCnpj(false)
    }
  }

  const handleNovaCategoria = async () => {
    const nome = prompt('Nome da nova categoria:')
    if (!nome || !estabelecimento) return
    let { data: menu } = await supabase.from('menus').select('id').eq('estabelecimento_id', estabelecimento.id).eq('ativo', true).single()
    if (!menu) {
      const { data: novoMenu, error: erroMenu } = await supabase.from('menus').insert({ estabelecimento_id: estabelecimento.id, nome: 'Cardápio Principal', tema: 'raiz-brasileira', ativo: true }).select('id').single()
      if (erroMenu || !novoMenu) { alert('Erro ao criar menu: ' + erroMenu?.message); return }
      menu = novoMenu
    }
    await supabase.from('categorias').insert({ menu_id: menu.id, nome, ordem: categorias.length })
    revalidateCardapio()
  }

  const handleRenomearCategoria = async (catId: string, novoNome: string) => {
    await supabase.from('categorias').update({ nome: novoNome }).eq('id', catId)
    revalidateCardapio()
  }

  const handleExcluirCategoria = async (catId: string) => {
    await supabase.from('categorias').delete().eq('id', catId)
    revalidateCardapio()
  }

  const handleAdicionarItem = async (categoriaId: string) => {
    const nome = prompt('Nome do item:')
    if (!nome) return
    const preco = parseFloat(prompt('Preço (ex: 19.90):') || '0')
    if (isNaN(preco)) return
    await addItem(categoriaId, { nome, preco, disponivel: true, tags: [], promocao_ativa: false, delivery_disponivel: false })
  }

  const handleTogglePromocao = async (itemId: string, ativaAtual: boolean) => {
    await updateItem(itemId, { promocao_ativa: !ativaAtual })
  }

  const handleTogglePublicar = async (itemId: string, disponivelAtual: boolean) => {
    const publicados = categorias.reduce((t, c) => t + (c.itens_cardapio?.filter((i: any) => i.disponivel).length || 0), 0)
    if (!disponivelAtual && publicados >= limitePlano) {
      alert(`Limite de ${limitePlano} itens. Faça upgrade.`)
      return
    }
    await updateItem(itemId, { disponivel: !disponivelAtual })
  }

  const salvarLayoutCardapio = async (layout: string) => {
    setModeloVisual(layout as any)
    if (!estabelecimento) return
    const { data: menu } = await supabase.from('menus').select('id').eq('estabelecimento_id', estabelecimento.id).eq('ativo', true).single()
    if (menu) await supabase.from('menus').update({ layout_cardapio: layout }).eq('id', menu.id)
  }

  const alterarTema = async (slug: string) => {
    setTemaSelecionado(slug)
    if (!estabelecimento) return
    await supabase.from('menus').update({ tema: slug }).eq('estabelecimento_id', estabelecimento.id)
  }

  const alterarFundo = async (url: string | null) => {
    setImagemFundo(url || '')
    await supabase.from('estabelecimentos').update({ imagem_fundo: url }).eq('id', estabelecimento.id)
    setEstabelecimento((prev: any) => ({ ...prev, imagem_fundo: url }))
  }

  const toggleRecurso = async (slug: string) => {
    const novos = recursosAtivos.includes(slug) ? recursosAtivos.filter(r => r !== slug) : [...recursosAtivos, slug]
    setRecursosAtivos(novos)
    await supabase.from('estabelecimentos').update({ recursos_ativos: novos }).eq('id', estabelecimento.id)
  }

  const alterarModeloQR = async (slug: string) => {
    setModeloQRSelecionado(slug)
    if (!estabelecimento) return
    await supabase.from('estabelecimentos').update({ qrcode_modelo: slug }).eq('id', estabelecimento.id)
  }

  const salvarIdiomas = async (novosIdiomas: string[]) => {
    setIdiomasSelecionados(novosIdiomas)
    if (!estabelecimento) return
    await supabase.from('estabelecimentos').update({ idiomas_ativos: novosIdiomas }).eq('id', estabelecimento.id)
  }

  const salvarPerfil = async () => {
    if (!estabelecimento) return
    setSalvandoPerfil(true)
    const { error: updateError } = await supabase.from('estabelecimentos').update({
      cnpj: perfil.cnpj, razao_social: perfil.razao_social, nome_fantasia: perfil.nome_fantasia,
      endereco: perfil.endereco, bairro: perfil.bairro, cep: perfil.cep,
      telefone: perfil.telefone, whatsapp: perfil.whatsapp, instagram: perfil.instagram,
      email: perfil.email, nome: perfil.nome_fantasia, latitude: perfil.latitude, longitude: perfil.longitude,
    }).eq('id', estabelecimento.id)
    if (updateError) { alert('Erro ao salvar perfil: ' + updateError.message); setSalvandoPerfil(false); return }

    const { data: tiposAtuais } = await supabase.from('estabelecimento_tipos_cozinha').select('tipo_cozinha_id').eq('estabelecimento_id', estabelecimento.id)
    const idsAtuais = tiposAtuais?.map(t => t.tipo_cozinha_id) || []
    const idsNovos = perfil.tipos_cozinha_ids || []
    const paraRemover = idsAtuais.filter(id => !idsNovos.includes(id))
    const paraAdicionar = idsNovos.filter(id => !idsAtuais.includes(id))
    if (paraRemover.length) await supabase.from('estabelecimento_tipos_cozinha').delete().eq('estabelecimento_id', estabelecimento.id).in('tipo_cozinha_id', paraRemover)
    if (paraAdicionar.length) await supabase.from('estabelecimento_tipos_cozinha').insert(paraAdicionar.map(tipo_id => ({ estabelecimento_id: estabelecimento.id, tipo_cozinha_id: tipo_id })))

    setEstabelecimento((prev: any) => ({ ...prev, ...perfil, nome: perfil.nome_fantasia }))
    alert('Perfil atualizado!')
    setEditandoPerfil(false)
    setSalvandoPerfil(false)
  }

  const salvarFotoCapa = async (url: string) => { await supabase.from('estabelecimentos').update({ foto_capa: url }).eq('id', estabelecimento.id); setEstabelecimento((prev: any) => ({ ...prev, foto_capa: url })) }
  const salvarLogo = async (url: string) => { await supabase.from('estabelecimentos').update({ logo_url: url }).eq('id', estabelecimento.id); setEstabelecimento((prev: any) => ({ ...prev, logo_url: url })) }
  const atualizarGaleria = async (urls: string[]) => { await supabase.from('estabelecimentos').update({ galeria_fotos: urls }).eq('id', estabelecimento.id); setEstabelecimento((prev: any) => ({ ...prev, galeria_fotos: urls })) }
  const salvarHorario = async (dia: any) => { if (!estabelecimento?.id) return; await supabase.from('horarios_funcionamento').upsert({ estabelecimento_id: estabelecimento.id, dia_semana: dia.dia_semana, horario_abertura: dia.horario_abertura, horario_fechamento: dia.horario_fechamento, fechado: dia.fechado }, { onConflict: 'estabelecimento_id,dia_semana' }) }
  const salvarWhatsAppConfig = async () => { await supabase.from('estabelecimentos').update({ whatsapp_config: { mensagem_padrao: whatsappMensagem, ativo: whatsappAtivo } }).eq('id', estabelecimento.id); alert('Configurações do WhatsApp salvas!') }
  const salvarDescricao = async (descricao: string) => { await supabase.from('estabelecimentos').update({ descricao }).eq('id', estabelecimento.id); setEstabelecimento((prev: any) => ({ ...prev, descricao })) }

  useEffect(() => {
    const userData = localStorage.getItem('usuario')
    if (!userData) { router.push('/login'); return }
    const user = JSON.parse(userData)
    setUsuario(user)
    if (user.estabelecimento_id) carregarEstabelecimento(user.estabelecimento_id)
    else if (user.estabelecimentos?.id) carregarEstabelecimento(user.estabelecimentos.id)
    else router.push('/login')
    setLoading(false)
  }, [router, carregarEstabelecimento])

  useEffect(() => {
    supabase.from('planos').select('*').then(({ data }) => setPlanosList(data || []))
    supabase.from('recursos_menu').select('*').then(({ data }) => setRecursosDisponiveis(data || []))
  }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>
  if (!usuario) return null

  const navItems = [
    { key: 'dashboard', icon: '📊', label: 'Dashboard' },
    { key: 'cardapio', icon: '📋', label: 'Cardápio' },
    { key: 'perfil', icon: '🏢', label: 'Perfil' },
    { key: 'config', icon: '⚙️', label: 'Configurações' },
  ]

  return (
    <div className="min-h-screen bg-[#fef9e8]">
      <header className="bg-white shadow-sm px-4 md:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => setMenuAberto(!menuAberto)} className="md:hidden text-2xl">☰</button>
          <span className="text-2xl">🏪</span>
          <div>
            <h1 className="text-lg md:text-xl font-bold">{estabelecimento?.nome_fantasia || estabelecimento?.nome || 'Meu Estabelecimento'}</h1>
            <p className="text-xs md:text-sm text-gray-600">Olá, {usuario.nome}!</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {estabelecimento?.qrcode_short_url && <Link href={`/menu/${estabelecimento.qrcode_short_url}`} target="_blank" className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm">👁️ Ver</Link>}
          <button onClick={() => { localStorage.removeItem('usuario'); router.push('/login') }} className="text-red-600 text-sm">Sair</button>
        </div>
      </header>

      <div className="flex">
        <aside className={`fixed top-0 left-0 z-50 w-60 bg-white min-h-screen shadow-lg transition-transform duration-300 md:relative md:translate-x-0 ${menuAberto ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-4 flex justify-between items-center md:hidden">
            <span className="font-bold">Menu</span>
            <button onClick={() => setMenuAberto(false)} className="text-2xl">✕</button>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map(aba => (
              <button key={aba.key} onClick={() => { setAbaAtiva(aba.key); setMenuAberto(false) }} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 ${abaAtiva === aba.key ? 'bg-orange-100 text-orange-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>
                {aba.icon} {aba.label}
              </button>
            ))}
          </nav>
        </aside>
        {menuAberto && <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setMenuAberto(false)} />}

        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {abaAtiva === 'dashboard' && (
            <DashboardTab
              estabelecimento={estabelecimento}
              categorias={categorias}
              limitePlano={limitePlano}
              recursosDisponiveis={recursosDisponiveis}
              recursosAtivos={recursosAtivos}
              recursosPermitidos={recursosPermitidos}
              toggleRecurso={toggleRecurso}
              planosList={planosList}
              limiteGaleria={limiteGaleria}
            />
          )}

          {abaAtiva === 'cardapio' && (
            <CardapioTab
              categorias={categorias}
              modeloVisual={modeloVisual}
              temaSelecionado={temaSelecionado}
              backgroundImageAtual={imagemFundo}
              temasDisponiveis={temasDisponiveis}
              temasPermitidos={temasPermitidos}
              limitePlano={limitePlano}
              idiomasSelecionados={idiomasSelecionados}
              onSalvarLayout={salvarLayoutCardapio}
              onSalvarTema={alterarTema}
              onSalvarBackgroundImage={alterarFundo}
              onNovaCategoria={handleNovaCategoria}
              onAdicionarItem={handleAdicionarItem}
              onAtualizarItem={updateItem}
              onExcluirItem={deleteItem}
              onTogglePromocao={handleTogglePromocao}
              onPublicarItem={handleTogglePublicar}
              onRenomearCategoria={handleRenomearCategoria}
              onExcluirCategoria={handleExcluirCategoria}
            />
          )}

          {abaAtiva === 'perfil' && (
            <PerfilTab
              estabelecimento={estabelecimento}
              perfil={perfil}
              setPerfil={setPerfil}
              editandoPerfil={editandoPerfil}
              setEditandoPerfil={setEditandoPerfil}
              salvandoPerfil={salvandoPerfil}
              buscandoCnpj={buscandoCnpj}
              onBuscarCnpj={buscarCnpj}
              onSalvarPerfil={salvarPerfil}
              onSalvarFotoCapa={salvarFotoCapa}
              onSalvarLogo={salvarLogo}
              onAtualizarGaleria={atualizarGaleria}
              limiteGaleria={limiteGaleria}
            />
          )}

          {abaAtiva === 'config' && (
            <ConfiguracoesTab
              idiomasSelecionados={idiomasSelecionados}
              onSalvarIdiomas={salvarIdiomas}
              opcoesIdiomas={OPCOES_IDIOMAS}
              horarios={horarios}
              setHorarios={setHorarios}
              onSalvarHorario={salvarHorario}
              whatsappMensagem={whatsappMensagem}
              setWhatsappMensagem={setWhatsappMensagem}
              whatsappAtivo={whatsappAtivo}
              setWhatsappAtivo={setWhatsappAtivo}
              onSalvarWhatsAppConfig={salvarWhatsAppConfig}
              usuario={usuario}
              estabelecimento={estabelecimento}
              onSalvarDescricao={salvarDescricao}
            />
          )}
        </main>
      </div>
    </div>
  )
}