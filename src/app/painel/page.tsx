'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import QRCode from 'react-qr-code'
import { ImageUpload } from '@/components/upload/ImageUpload'

const TEMAS_PADRAO = ['raiz-brasileira']

// ----------------------------------------------------------------
// Subcomponentes
// ----------------------------------------------------------------

function DashboardCards({ estabelecimento, categorias, limitePlano }: { estabelecimento: any; categorias: any[]; limitePlano: number }) {
  const publicados = categorias.reduce((total, cat) => total + (cat.itens_cardapio || []).filter((i: any) => i.disponivel).length, 0)
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <div className="bg-white rounded-xl p-6 shadow-sm"><p className="text-gray-500 text-sm">Scans QR Code</p><p className="text-3xl font-bold text-blue-600">{estabelecimento?.scans_qrcode || 0}</p></div>
      <div className="bg-white rounded-xl p-6 shadow-sm"><p className="text-gray-500 text-sm">Itens Publicados</p><p className="text-3xl font-bold text-orange-600">{publicados} <span className="text-lg text-gray-400">/ {limitePlano}</span></p>{publicados >= limitePlano && <p className="text-xs text-red-500 mt-1">Limite atingido. Faça upgrade.</p>}</div>
      <div className="bg-white rounded-xl p-6 shadow-sm"><p className="text-gray-500 text-sm">Categorias</p><p className="text-3xl font-bold text-purple-600">{categorias.length}</p></div>
    </div>
  )
}

function ListaCategorias({ categorias, onAdicionarItem, onEditarItem, onPublicarItem, onExcluirItem, onInserirPromocao, onTogglePromocao, limitePlano }: any) {
  const publicados = categorias.reduce((t: number, c: any) => t + (c.itens_cardapio || []).filter((i: any) => i.disponivel).length, 0)
  const fmt = (v: number) => v?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'
  return (
    <div className="space-y-4">
      {categorias.map((cat: any) => (
        <div key={cat.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
          <div className="p-4 border-b flex items-center justify-between bg-gray-50">
            <h3 className="font-bold text-gray-900">{cat.nome}<span className="text-sm text-gray-500 ml-2 font-normal">({cat.itens_cardapio?.length || 0} itens)</span></h3>
            <button onClick={() => onAdicionarItem(cat.id)} className="text-orange-600 text-sm font-medium hover:underline">+ Adicionar Item</button>
          </div>
          <div className="divide-y">
            {cat.itens_cardapio?.length > 0 ? cat.itens_cardapio.map((item: any) => (
              <div key={item.id} className="p-4 hover:bg-gray-50 border-b last:border-b-0">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 rounded-lg bg-gray-200 flex-shrink-0 overflow-hidden">{item.foto_url ? <img src={item.foto_url} alt={item.nome} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>}</div>
                  {item.codigo && <span className="text-xs bg-gray-200 text-gray-600 px-2 py-0.5 rounded font-mono flex-shrink-0">#{item.codigo}</span>}
                  <span className="font-medium text-gray-800 flex-1 truncate">{item.nome}</span>
                  <span className="font-bold text-gray-900 flex-shrink-0">{item.promocao_ativa && item.preco_promocional ? <><span className="text-xs text-gray-400 line-through mr-1">R$ {fmt(item.preco)}</span><span className="text-green-600">R$ {fmt(item.preco_promocional)}</span></> : <span>R$ {fmt(item.preco)}</span>}</span>
                </div>
                {item.descricao && <p className="text-sm text-gray-500 ml-15 mb-2 pl-2">{item.descricao}</p>}
                <div className="flex items-center gap-2 ml-15 pl-2 flex-wrap">
                  <button onClick={() => onInserirPromocao(item)} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded hover:bg-purple-200 transition">🎉 {item.promocao_ativa ? 'Editar Promo' : 'Inserir Promo'}</button>
                  {item.promocao_ativa && <label className="flex items-center gap-1 text-xs cursor-pointer"><input type="checkbox" checked={item.promocao_ativa} onChange={() => onTogglePromocao(item.id, item.promocao_ativa)} className="rounded text-purple-600 focus:ring-purple-500" /><span className="text-green-600">Ativa</span></label>}
                  <span className="text-gray-300">|</span>
                  <button onClick={() => onEditarItem(item)} className="text-blue-500 hover:text-blue-700 transition text-sm" title="Editar item">✏️</button>
                  <button onClick={() => onPublicarItem(item.id, item.disponivel)} disabled={!item.disponivel && publicados >= limitePlano} className={`px-2 py-0.5 rounded-full text-xs font-medium ${item.disponivel ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed'}`} title={!item.disponivel && publicados >= limitePlano ? 'Limite atingido' : item.disponivel ? 'Despublicar' : 'Publicar'}>{item.disponivel ? '✓ Publicado' : '✕ Rascunho'}</button>
                  <button onClick={() => onExcluirItem(item.id)} className="text-red-500 hover:text-red-700 transition text-sm" title="Excluir item">🗑️</button>
                </div>
              </div>
            )) : <div className="p-4 text-center text-gray-400 text-sm">Nenhum item nesta categoria</div>}
          </div>
        </div>
      ))}
      {categorias.length === 0 && <div className="text-center py-12 text-gray-500"><p className="text-4xl mb-4">📋</p><p className="mb-2">Nenhuma categoria cadastrada</p></div>}
    </div>
  )
}

function SecaoAparencia({ temasDisponiveis, temasPermitidos, temaSelecionado, onAlterarTema }: any) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">🎨 Aparência do Cardápio</h2>
      <p className="text-gray-600 mb-6">Escolha um tema para o seu menu digital.</p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {temasDisponiveis.map((tema: any) => {
          const permitido = temasPermitidos.includes(tema.slug)
          const ativo = temaSelecionado === tema.slug
          return (
            <button key={tema.slug} disabled={!permitido} onClick={() => onAlterarTema(tema.slug)} className={`p-4 rounded-xl border-2 text-left transition ${ativo ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'} ${!permitido ? 'opacity-40 cursor-not-allowed' : ''}`}>
              <div className="flex gap-1 mb-3">{(tema.cores || ['#ccc']).slice(0,3).map((c: string) => <div key={c} className="w-5 h-5 rounded-full" style={{backgroundColor:c}} />)}</div>
              <p className="font-semibold text-gray-800">{tema.nome}</p>
              <p className="text-xs text-gray-500">{tema.descricao}</p>
              {!permitido && <span className="text-xs text-red-500 mt-1 block">🔒 Plano superior</span>}
              {ativo && <span className="text-xs text-orange-600 mt-1 block">✓ Em uso</span>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ConfiguracoesEstabelecimento({
  estabelecimento, setEstabelecimento, recursosAtivos, recursosPermitidos, toggleRecurso, recursosDisponiveis,
  temasDisponiveis, temasPermitidos, temaSelecionado, alterarTema,
  modelosQRDisponiveis, modelosQRPermitidos, modeloQRSelecionado, alterarModeloQR,
  usuario, planosList, limitePlano
}: any) {
  const [perfil, setPerfil] = useState({ nome: '', descricao: '', bairro: '', endereco: '', cep: '', telefone: '', email: '', instagram: '' })
  const [editando, setEditando] = useState(false)
  const [salvandoPerfil, setSalvandoPerfil] = useState(false)
  const [whatsappNumero, setWhatsappNumero] = useState('')
  const [whatsappMensagem, setWhatsappMensagem] = useState('')
  const [whatsappAtivo, setWhatsappAtivo] = useState(false)
  const [carregandoHorarios, setCarregandoHorarios] = useState(false)
  const [horarios, setHorarios] = useState<any[]>([])

  const DIAS_SEMANA = [
    { valor: 0, nome: 'Domingo' }, { valor: 1, nome: 'Segunda-feira' },
    { valor: 2, nome: 'Terça-feira' }, { valor: 3, nome: 'Quarta-feira' },
    { valor: 4, nome: 'Quinta-feira' }, { valor: 5, nome: 'Sexta-feira' },
    { valor: 6, nome: 'Sábado' },
  ]

  useEffect(() => {
    if (estabelecimento) {
      setPerfil({ nome: estabelecimento.nome || '', descricao: estabelecimento.descricao || '', bairro: estabelecimento.bairro || '', endereco: estabelecimento.endereco || '', cep: estabelecimento.cep || '', telefone: estabelecimento.telefone || '', email: estabelecimento.email || '', instagram: estabelecimento.instagram || '' })
      setWhatsappNumero(estabelecimento.whatsapp || '')
      setWhatsappMensagem(estabelecimento.whatsapp_config?.mensagem_padrao || 'Olá! Vim pelo cardápio digital.')
      setWhatsappAtivo(estabelecimento.whatsapp_config?.ativo ?? !!estabelecimento.whatsapp)
      carregarHorarios()
    }
  }, [estabelecimento])

  const carregarHorarios = async () => {
    if (!estabelecimento?.id) return
    setCarregandoHorarios(true)
    const { data } = await supabase.from('horarios_funcionamento').select('*').eq('estabelecimento_id', estabelecimento.id).order('dia_semana')
    const diasCompletos = DIAS_SEMANA.map(dia => {
      const encontrado = data?.find(h => h.dia_semana === dia.valor)
      return encontrado || { dia_semana: dia.valor, horario_abertura: '08:00', horario_fechamento: '18:00', fechado: false, estabelecimento_id: estabelecimento.id }
    })
    setHorarios(diasCompletos)
    setCarregandoHorarios(false)
  }

  const salvarHorarioDia = async (dia: any) => {
    if (!estabelecimento?.id) return
    await supabase.from('horarios_funcionamento').upsert({
      estabelecimento_id: estabelecimento.id,
      dia_semana: dia.dia_semana, horario_abertura: dia.horario_abertura,
      horario_fechamento: dia.horario_fechamento, fechado: dia.fechado,
    }, { onConflict: 'estabelecimento_id,dia_semana' })
  }

  const salvarPerfil = async () => { setSalvandoPerfil(true); await supabase.from('estabelecimentos').update(perfil).eq('id', estabelecimento.id); setSalvandoPerfil(false); setEditando(false) }
  const salvarWhatsApp = async () => { await supabase.from('estabelecimentos').update({ whatsapp: whatsappNumero, whatsapp_config: { mensagem_padrao: whatsappMensagem, ativo: whatsappAtivo } }).eq('id', estabelecimento.id); alert('Configurações de WhatsApp salvas!') }

  const salvarFotoCapa = async (url: string) => {
    await supabase.from('estabelecimentos').update({ foto_capa: url }).eq('id', estabelecimento.id)
    setEstabelecimento({ ...estabelecimento, foto_capa: url })
  }

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <div className="flex justify-between items-center mb-4"><h3 className="font-bold text-lg">📝 Perfil do Estabelecimento</h3>{!editando && <button onClick={() => setEditando(true)} className="text-blue-600 text-sm hover:underline">✏️ Editar</button>}</div>
        {editando ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(perfil).map(([campo, valor]) => (<div key={campo}><label className="block text-sm font-medium text-gray-700 capitalize">{campo}</label><input type="text" value={valor as string} onChange={(e) => setPerfil({ ...perfil, [campo]: e.target.value })} className="w-full border-2 border-gray-300 rounded-lg px-3 py-2" /></div>))}
            <div className="md:col-span-2 flex gap-3"><button onClick={salvarPerfil} disabled={salvandoPerfil} className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50">{salvandoPerfil ? 'Salvando...' : '💾 Salvar Perfil'}</button><button onClick={() => setEditando(false)} className="border px-4 py-2 rounded-lg">Cancelar</button></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">{Object.entries(perfil).map(([campo, valor]) => (<div key={campo}><span className="text-gray-500 capitalize">{campo}</span><p className="font-medium text-gray-800">{valor || 'Não informado'}</p></div>))}</div>
        )}
      </div>

      {/* Foto de Capa */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-4">🖼️ Foto de Capa</h3>
        <p className="text-sm text-gray-500 mb-4">Esta imagem aparecerá no topo do seu perfil, no cardápio digital e nos cards do diretório.</p>
        <ImageUpload onUpload={salvarFotoCapa} defaultImage={estabelecimento?.foto_capa || ''} />
      </div>

      {/* Horários de Funcionamento */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="font-bold text-lg mb-4">🕒 Horários de Funcionamento</h3>
        {carregandoHorarios ? (
          <p className="text-sm text-gray-500">Carregando...</p>
        ) : (
          <div className="space-y-3">
            {horarios.map((dia, idx) => (
              <div key={dia.dia_semana} className="flex items-center gap-3 text-sm p-2 rounded-lg hover:bg-gray-50">
                <span className="w-28 font-medium text-gray-700">{DIAS_SEMANA[idx].nome}</span>
                <label className="flex items-center gap-1 cursor-pointer">
                  <input type="checkbox" checked={dia.fechado} onChange={(e) => { const novos = [...horarios]; novos[idx].fechado = e.target.checked; setHorarios(novos); salvarHorarioDia(novos[idx]) }} className="rounded text-orange-600 focus:ring-orange-500" />
                  <span className="text-xs text-gray-500">Fechado</span>
                </label>
                {!dia.fechado && (
                  <div className="flex items-center gap-2">
                    <input type="time" value={dia.horario_abertura?.substring(0,5) || '08:00'} onChange={(e) => { const novos = [...horarios]; novos[idx].horario_abertura = e.target.value; setHorarios(novos); salvarHorarioDia(novos[idx]) }} className="border rounded px-2 py-1 text-xs" />
                    <span className="text-gray-400">às</span>
                    <input type="time" value={dia.horario_fechamento?.substring(0,5) || '18:00'} onChange={(e) => { const novos = [...horarios]; novos[idx].horario_fechamento = e.target.value; setHorarios(novos); salvarHorarioDia(novos[idx]) }} className="border rounded px-2 py-1 text-xs" />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm"><h3 className="font-bold text-lg mb-4">🎨 Preferências de Exibição</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><h4 className="font-medium text-gray-700 mb-2">Tema do Cardápio</h4><select value={temaSelecionado} onChange={(e) => alterarTema(e.target.value)} className="w-full border rounded-lg px-3 py-2">{temasDisponiveis.filter((t:any) => temasPermitidos.includes(t.slug)).map((t:any) => <option key={t.slug} value={t.slug}>{t.nome}</option>)}</select></div><div><h4 className="font-medium text-gray-700 mb-2">Modelo de QR Code</h4><select value={modeloQRSelecionado} onChange={(e) => alterarModeloQR(e.target.value)} className="w-full border rounded-lg px-3 py-2">{modelosQRDisponiveis.filter((m:any) => modelosQRPermitidos.includes(m.slug)).map((m:any) => <option key={m.slug} value={m.slug}>{m.nome}</option>)}</select></div></div></div>
      <div className="bg-white rounded-xl p-6 shadow-sm"><h3 className="font-bold text-lg mb-4">💬 WhatsApp para Pedidos</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Número</label><input type="text" value={whatsappNumero} onChange={(e) => setWhatsappNumero(e.target.value)} className="w-full border rounded-lg px-3 py-2" /></div><div><label className="block text-sm font-medium mb-1">Mensagem padrão</label><input type="text" value={whatsappMensagem} onChange={(e) => setWhatsappMensagem(e.target.value)} className="w-full border rounded-lg px-3 py-2" /></div></div><div className="flex items-center gap-4 mt-4"><label className="flex items-center gap-2"><input type="checkbox" checked={whatsappAtivo} onChange={(e) => setWhatsappAtivo(e.target.checked)} /><span className="text-sm">Ativar botão no menu</span></label><button onClick={salvarWhatsApp} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">💾 Salvar</button></div></div>
      <div className="bg-white rounded-xl p-6 shadow-sm"><h3 className="font-bold text-lg mb-4">🧩 Recursos Ativos</h3><div className="space-y-3">{recursosDisponiveis.map((recurso: any) => { const permitido = recursosPermitidos.includes(recurso.slug); const ativo = recursosAtivos.includes(recurso.slug); return <div key={recurso.slug} className={`p-3 rounded-lg border ${ativo ? 'border-green-300 bg-green-50' : 'border-gray-200'}`}><div className="flex justify-between items-center"><div><p className="font-medium">{recurso.nome}</p><p className="text-xs text-gray-500">{recurso.descricao}</p></div><button disabled={!permitido} onClick={() => toggleRecurso(recurso.slug)} className={`px-3 py-1 rounded-full text-xs font-medium ${ativo ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'} ${!permitido ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200'}`}>{ativo ? 'Ativo' : 'Inativo'}</button></div>{!permitido && <p className="text-xs text-red-500 mt-1">🔒 Não disponível no seu plano</p>}</div> })}</div></div>
      <div className="bg-white rounded-xl p-6 shadow-sm"><h3 className="font-bold text-lg mb-4">👤 Conta</h3><p className="text-sm"><span className="text-gray-500">Email:</span> {usuario?.email || 'Não disponível'}</p><button className="text-blue-600 hover:underline text-sm mt-2">Alterar senha</button></div>
      <div className="bg-white rounded-xl p-6 shadow-sm"><h3 className="font-bold text-lg mb-4">💳 Plano Atual</h3><p className="text-2xl font-bold text-orange-600">{estabelecimento?.plano_id ? (planosList.find((p: any) => p.id === estabelecimento.plano_id)?.nome || 'Plano personalizado') : 'Grátis'}</p><p className="text-sm text-gray-500 mt-1">{limitePlano} itens, {temasPermitidos.length} temas, {modelosQRPermitidos.length} QR codes</p><button className="mt-3 bg-orange-100 text-orange-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-200">⬆️ Fazer Upgrade</button></div>
    </div>
  )
}

export default function PainelDono() {
  const router = useRouter()
  const [usuario, setUsuario] = useState<any>(null)
  const [estabelecimento, setEstabelecimento] = useState<any>(null)
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [abaAtiva, setAbaAtiva] = useState('dashboard')

  const [mostrarModal, setMostrarModal] = useState(false)
  const [categoriaSelecionada, setCategoriaSelecionada] = useState('')
  const [modoEdicao, setModoEdicao] = useState(false)
  const [itemEditandoId, setItemEditandoId] = useState<string | null>(null)
  const [formItem, setFormItem] = useState({
    nome: '', descricao: '', preco: '', preco_promocional: '', promocao_ativa: false,
    promocao_titulo: '', desconto_percentual: '', disponivel: false, codigo: '',
    tags: '', foto_url: '', delivery_disponivel: false
  })
  const [novaCategoria, setNovaCategoria] = useState('')
  const [mostrarNovaCategoria, setMostrarNovaCategoria] = useState(false)

  const [temasPermitidos, setTemasPermitidos] = useState<string[]>(TEMAS_PADRAO)
  const [temaSelecionado, setTemaSelecionado] = useState('raiz-brasileira')
  const [temasDisponiveis, setTemasDisponiveis] = useState<any[]>([])
  const [limitePlano, setLimitePlano] = useState(15)

  const [modelosQRPermitidos, setModelosQRPermitidos] = useState<string[]>([])
  const [modelosQRDisponiveis, setModelosQRDisponiveis] = useState<any[]>([])
  const [modeloQRSelecionado, setModeloQRSelecionado] = useState('classico')

  const [recursosAtivos, setRecursosAtivos] = useState<string[]>([])
  const [recursosPermitidos, setRecursosPermitidos] = useState<string[]>([])
  const [recursosDisponiveis, setRecursosDisponiveis] = useState<any[]>([])

  const [planosList, setPlanosList] = useState<any[]>([])

  useEffect(() => {
    const userData = localStorage.getItem('usuario')
    if (!userData) { router.push('/login'); return }
    const user = JSON.parse(userData)
    setUsuario(user)
    if (user.estabelecimento_id) carregarEstabelecimento(user.estabelecimento_id)
    else if (user.estabelecimentos?.id) carregarEstabelecimento(user.estabelecimentos.id)
    else router.push('/login')
    setLoading(false)
  }, [])

  useEffect(() => {
    supabase.from('planos').select('*').then(({ data }) => { if (data) setPlanosList(data) })
    supabase.from('recursos_menu').select('*').then(({ data }) => { if (data) setRecursosDisponiveis(data) })
  }, [])

  const carregarEstabelecimento = async (id: string) => {
    const { data } = await supabase.from('estabelecimentos').select('*').eq('id', id).single()
    if (data) {
      setEstabelecimento(data)
      carregarCardapio(data.id)
      carregarTemasEPlano(data.id, data.plano_id)
      carregarModelosQR(data.id, data.plano_id)
      carregarRecursos(data.id, data.plano_id)
    }
  }

  const carregarCardapio = useCallback(async (estabId: string) => {
    const { data: menu } = await supabase.from('menus').select('id').eq('estabelecimento_id', estabId).eq('ativo', true).single()
    if (menu) { const { data: cats } = await supabase.from('categorias').select('*, itens_cardapio(*)').eq('menu_id', menu.id).order('ordem'); if (cats) setCategorias(cats) }
  }, [])

  const carregarTemasEPlano = async (estabId: string, planoId?: string) => {
    let idPlano = planoId; if (!idPlano) { const { data: e } = await supabase.from('estabelecimentos').select('plano_id').eq('id', estabId).single(); idPlano = e?.plano_id }
    if (idPlano) {
      const { data: plano } = await supabase.from('planos').select('temas_permitidos, limite_itens, recursos_permitidos').eq('id', idPlano).single()
      if (plano) { setTemasPermitidos(plano.temas_permitidos || TEMAS_PADRAO); setLimitePlano(plano.limite_itens || 15); setRecursosPermitidos(plano.recursos_permitidos || []) }
    } else {
      const { data: pg } = await supabase.from('planos').select('temas_permitidos, limite_itens, recursos_permitidos').eq('slug', 'gratis').single()
      if (pg) { setTemasPermitidos(pg.temas_permitidos || TEMAS_PADRAO); setLimitePlano(pg.limite_itens || 15); setRecursosPermitidos(pg.recursos_permitidos || []) }
    }
    const { data: todos } = await supabase.from('temas').select('*'); if (todos) setTemasDisponiveis(todos)
    const { data: menu } = await supabase.from('menus').select('tema').eq('estabelecimento_id', estabId).single(); if (menu?.tema) setTemaSelecionado(menu.tema)
  }

  const carregarModelosQR = async (estabId: string, planoId?: string) => {
    let idPlano = planoId; if (!idPlano) { const { data: e } = await supabase.from('estabelecimentos').select('plano_id').eq('id', estabId).single(); idPlano = e?.plano_id }
    if (idPlano) { const { data: p } = await supabase.from('planos').select('modelos_qrcode_permitidos').eq('id', idPlano).single(); if (p) setModelosQRPermitidos(p.modelos_qrcode_permitidos || []) }
    else { const { data: pg } = await supabase.from('planos').select('modelos_qrcode_permitidos').eq('slug', 'gratis').single(); if (pg) setModelosQRPermitidos(pg.modelos_qrcode_permitidos || []) }
    const { data: todos } = await supabase.from('modelos_qrcode').select('*'); if (todos) setModelosQRDisponiveis(todos)
    if (estabId) { const { data: e } = await supabase.from('estabelecimentos').select('qrcode_modelo').eq('id', estabId).single(); if (e?.qrcode_modelo) setModeloQRSelecionado(e.qrcode_modelo) }
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
    if (!recursosPermitidos.length && planoId) {
      const { data: plano } = await supabase.from('planos').select('recursos_permitidos').eq('id', planoId).single()
      if (plano) setRecursosPermitidos(plano.recursos_permitidos || [])
    }
  }

  const toggleRecurso = async (slug: string) => {
    const novos = recursosAtivos.includes(slug) ? recursosAtivos.filter(r => r !== slug) : [...recursosAtivos, slug]
    const { error } = await supabase.from('estabelecimentos').update({ recursos_ativos: novos }).eq('id', estabelecimento.id)
    if (!error) setRecursosAtivos(novos)
  }

  const publicarItem = async (itemId: string, disponivel: boolean) => {
    if (!disponivel) { const publicados = categorias.reduce((t, c) => t + (c.itens_cardapio || []).filter((i: any) => i.disponivel).length, 0); if (publicados >= limitePlano) { alert(`Limite de ${limitePlano} itens. Faça upgrade.`); return } }
    await supabase.from('itens_cardapio').update({ disponivel: !disponivel }).eq('id', itemId); carregarCardapio(estabelecimento.id)
  }

  const excluirItem = async (id: string) => { if (confirm('Excluir?')) { await supabase.from('itens_cardapio').delete().eq('id', id); carregarCardapio(estabelecimento.id) } }

  const abrirEdicao = (item: any) => {
    setFormItem({
      nome: item.nome, descricao: item.descricao || '', preco: item.preco?.toString() || '',
      preco_promocional: item.preco_promocional?.toString() || '', promocao_ativa: item.promocao_ativa,
      promocao_titulo: item.promocao_titulo || '', desconto_percentual: item.desconto_percentual?.toString() || '',
      disponivel: item.disponivel, codigo: item.codigo || '', tags: item.tags?.join(', ') || '',
      foto_url: item.foto_url || '', delivery_disponivel: item.delivery_disponivel || false
    })
    setCategoriaSelecionada(item.categoria_id); setItemEditandoId(item.id); setModoEdicao(true); setMostrarModal(true)
  }

  const abrirPromocao = (item: any) => abrirEdicao(item)
  const togglePromocao = async (itemId: string, ativa: boolean) => {
  await supabase.from('itens_cardapio').update({ promocao_ativa: !ativa }).eq('id', itemId)
  carregarCardapio(estabelecimento.id)
}
const salvarItem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!categoriaSelecionada || !formItem.nome || !formItem.preco) { alert('Preencha nome e preço!'); return }
    const tagsArray = formItem.tags ? formItem.tags.split(',').map((t: string) => t.trim()) : []
    const dados = {
      categoria_id: categoriaSelecionada, nome: formItem.nome, descricao: formItem.descricao,
      preco: parseFloat(formItem.preco), preco_promocional: formItem.preco_promocional ? parseFloat(formItem.preco_promocional) : null,
      promocao_ativa: formItem.promocao_ativa, promocao_titulo: formItem.promocao_titulo || null,
      desconto_percentual: formItem.desconto_percentual ? parseInt(formItem.desconto_percentual) : null,
      disponivel: formItem.disponivel, codigo: formItem.codigo || null, tags: tagsArray,
      foto_url: formItem.foto_url || null, delivery_disponivel: formItem.delivery_disponivel
    }
    const { error } = modoEdicao && itemEditandoId
      ? await supabase.from('itens_cardapio').update(dados).eq('id', itemEditandoId)
      : await supabase.from('itens_cardapio').insert(dados)
    if (error) { alert('Erro: ' + error.message) } else { setMostrarModal(false); limparForm(); carregarCardapio(estabelecimento.id) }
  }

  const criarCategoria = async () => {
    if (!novaCategoria || !estabelecimento) { alert('Digite um nome'); return }
    let { data: menu } = await supabase.from('menus').select('id').eq('estabelecimento_id', estabelecimento.id).eq('ativo', true).single()
    if (!menu) { const { data: novoMenu, error: erroMenu } = await supabase.from('menus').insert({ estabelecimento_id: estabelecimento.id, nome: 'Cardápio Principal', tema: 'raiz-brasileira', ativo: true }).select('id').single(); if (erroMenu) { alert('Erro ao criar menu: ' + erroMenu.message); return }; menu = novoMenu }
    const { error } = await supabase.from('categorias').insert({ menu_id: menu.id, nome: novaCategoria, ordem: categorias.length })
    if (error) { alert('Erro: ' + error.message) } else { setNovaCategoria(''); setMostrarNovaCategoria(false); carregarCardapio(estabelecimento.id) }
  }

  const alterarTema = async (slug: string) => { if (!estabelecimento) return; const { error } = await supabase.from('menus').update({ tema: slug }).eq('estabelecimento_id', estabelecimento.id); if (!error) setTemaSelecionado(slug) }
  const alterarModeloQR = async (slug: string) => { if (!estabelecimento) return; const { error } = await supabase.from('estabelecimentos').update({ qrcode_modelo: slug }).eq('id', estabelecimento.id); if (!error) setModeloQRSelecionado(slug) }

  const limparForm = () => {
    setFormItem({
      nome: '', descricao: '', preco: '', preco_promocional: '', promocao_ativa: false,
      promocao_titulo: '', desconto_percentual: '', disponivel: false, codigo: '',
      tags: '', foto_url: '', delivery_disponivel: false
    })
    setCategoriaSelecionada(''); setModoEdicao(false); setItemEditandoId(null)
  }

  const sair = () => { localStorage.removeItem('usuario'); router.push('/login') }

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p>Carregando...</p></div>
  if (!usuario) return null

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3"><span className="text-2xl">🏪</span><div><h1 className="text-xl font-bold text-gray-900">{estabelecimento?.nome || 'Meu Estabelecimento'}</h1><p className="text-sm text-gray-600">Olá, {usuario.nome}!</p></div></div>
        <div className="flex items-center gap-3">{estabelecimento?.qrcode_short_url && <Link href={`/menu/${estabelecimento.qrcode_short_url}`} target="_blank" className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">👁️ Ver Cardápio</Link>}<button onClick={sair} className="text-red-600 text-sm font-medium hover:underline">Sair</button></div>
      </header>
      <div className="flex">
        <aside className="w-60 bg-white min-h-screen shadow-sm p-4 space-y-1">
          {[{ key: 'dashboard', icon: '📊', label: 'Dashboard' },{ key: 'cardapio', icon: '📋', label: 'Meu Cardápio' },{ key: 'qrcode', icon: '📱', label: 'QR Code' },{ key: 'aparencia', icon: '🎨', label: 'Aparência' },{ key: 'recursos', icon: '🧩', label: 'Recursos' },{ key: 'config', icon: '⚙️', label: 'Configurações' }].map(aba => (
            <button key={aba.key} onClick={() => setAbaAtiva(aba.key)} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 ${abaAtiva === aba.key ? 'bg-orange-100 text-orange-700 font-medium' : 'text-gray-700 hover:bg-gray-100'}`}>{aba.icon} {aba.label}</button>
          ))}
        </aside>
        <main className="flex-1 p-6">
          {abaAtiva === 'dashboard' && <><h2 className="text-2xl font-bold mb-6">📊 Dashboard</h2><DashboardCards estabelecimento={estabelecimento} categorias={categorias} limitePlano={limitePlano} /></>}
          {abaAtiva === 'cardapio' && (
            <div>
              <div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold text-gray-900">📋 Meu Cardápio</h2><div className="flex gap-2"><button onClick={() => setMostrarNovaCategoria(true)} className="border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100">➕ Nova Categoria</button><button onClick={() => { setModoEdicao(false); setItemEditandoId(null); setMostrarModal(true) }} className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700">➕ Novo Item</button></div></div>
              <ListaCategorias categorias={categorias} onAdicionarItem={(catId: string) => { setCategoriaSelecionada(catId); setModoEdicao(false); setItemEditandoId(null); setMostrarModal(true) }} onEditarItem={abrirEdicao} onPublicarItem={publicarItem} onExcluirItem={excluirItem} onInserirPromocao={abrirPromocao} onTogglePromocao={togglePromocao} limitePlano={limitePlano} />
            </div>
          )}
          {abaAtiva === 'qrcode' && (
            <div><h2 className="text-2xl font-bold mb-6">📱 Meu QR Code</h2>
              {estabelecimento?.qrcode_short_url ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white rounded-xl p-6 shadow-sm"><h3 className="font-bold text-lg mb-4">Escolher Estilo</h3><div className="grid grid-cols-2 gap-4">{modelosQRDisponiveis.map((modelo) => { const permitido = modelosQRPermitidos.includes(modelo.slug); const ativo = modeloQRSelecionado === modelo.slug; return <button key={modelo.slug} disabled={!permitido} onClick={() => alterarModeloQR(modelo.slug)} className={`p-4 rounded-xl border-2 text-left transition ${ativo ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-gray-300'} ${!permitido ? 'opacity-40 cursor-not-allowed' : ''}`}><div className="flex gap-1 mb-2"><div className="w-6 h-6 rounded" style={{ backgroundColor: modelo.cor_frente }} /><div className="w-6 h-6 rounded" style={{ backgroundColor: modelo.cor_fundo, border: '1px solid #ddd' }} /></div><p className="font-semibold text-gray-800">{modelo.nome}</p><p className="text-xs text-gray-500">{modelo.descricao}</p>{!permitido && <span className="text-xs text-red-500">🔒 Plano superior</span>}</button> })}</div></div>
                  <div className="bg-white rounded-xl p-6 shadow-sm flex flex-col items-center justify-center">
                    <div style={{ background: modelosQRDisponiveis.find(m => m.slug === modeloQRSelecionado)?.cor_fundo || '#FFFFFF', padding: '1rem', borderRadius: '1rem' }}><QRCode value={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/menu/${estabelecimento.qrcode_short_url}`} size={200} bgColor={modelosQRDisponiveis.find(m => m.slug === modeloQRSelecionado)?.cor_fundo || '#FFFFFF'} fgColor={modelosQRDisponiveis.find(m => m.slug === modeloQRSelecionado)?.cor_frente || '#000000'} level="H" /></div>
                    <p className="mt-4 text-sm text-gray-600">menu.salvador.br/menu/{estabelecimento.qrcode_short_url}</p>
                    <button onClick={() => { navigator.clipboard.writeText(`menu.salvador.br/menu/${estabelecimento.qrcode_short_url}`); alert('Link copiado!') }} className="mt-2 bg-orange-600 text-white px-4 py-2 rounded-lg">📋 Copiar Link</button>
                  </div>
                </div>
              ) : <p className="text-gray-500">QR Code ainda não disponível.</p>}
            </div>
          )}
          {abaAtiva === 'aparencia' && <SecaoAparencia temasDisponiveis={temasDisponiveis} temasPermitidos={temasPermitidos} temaSelecionado={temaSelecionado} onAlterarTema={alterarTema} />}
          {abaAtiva === 'recursos' && (
            <div><h2 className="text-2xl font-bold mb-6">🧩 Recursos do Cardápio</h2>
              <div className="bg-white rounded-xl p-6 shadow-sm"><p className="text-gray-600 mb-4">Ative ou desative funcionalidades que aparecerão no seu menu digital.</p>
                <div className="space-y-3">
                  {recursosDisponiveis.map((recurso: any) => {
                    const permitido = recursosPermitidos.includes(recurso.slug)
                    const ativo = recursosAtivos.includes(recurso.slug)
                    return (
                      <div key={recurso.slug} className={`p-4 rounded-xl border-2 ${ativo ? 'border-green-500 bg-green-50' : 'border-gray-200'} ${!permitido ? 'opacity-50' : ''}`}>
                        <div className="flex justify-between items-center">
                          <div><p className="font-semibold text-gray-800">{recurso.nome}</p><p className="text-xs text-gray-500">{recurso.descricao}</p></div>
                          <button disabled={!permitido} onClick={() => toggleRecurso(recurso.slug)} className={`px-3 py-1 rounded-full text-xs font-medium ${ativo ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'} ${!permitido ? 'cursor-not-allowed' : ''}`}>{ativo ? 'Ativo' : 'Inativo'}</button>
                        </div>
                        {!permitido && <p className="text-xs text-red-500 mt-2">🔒 Não disponível no seu plano</p>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          )}
          {abaAtiva === 'config' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">⚙️ Configurações</h2>
              <ConfiguracoesEstabelecimento
                estabelecimento={estabelecimento} setEstabelecimento={setEstabelecimento}
                recursosAtivos={recursosAtivos} recursosPermitidos={recursosPermitidos}
                toggleRecurso={toggleRecurso} recursosDisponiveis={recursosDisponiveis}
                temasDisponiveis={temasDisponiveis} temasPermitidos={temasPermitidos}
                temaSelecionado={temaSelecionado} alterarTema={alterarTema}
                modelosQRDisponiveis={modelosQRDisponiveis} modelosQRPermitidos={modelosQRPermitidos}
                modeloQRSelecionado={modeloQRSelecionado} alterarModeloQR={alterarModeloQR}
                usuario={usuario} planosList={planosList} limitePlano={limitePlano}
              />
            </div>
          )}
        </main>
      </div>
      {mostrarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl">
            <h3 className="font-bold text-lg text-gray-900 mb-4">{modoEdicao ? '✏️ Editar Item' : '➕ Novo Item'}</h3>
            <form onSubmit={salvarItem} className="space-y-4">
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Categoria *</label><select required className="w-full border-2 border-gray-300 rounded-lg px-3 py-2" value={categoriaSelecionada} onChange={(e) => setCategoriaSelecionada(e.target.value)}><option value="">Selecione...</option>{categorias.map((cat: any) => <option key={cat.id} value={cat.id}>{cat.nome}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-semibold text-gray-700 mb-1">Nome *</label><input type="text" required className="w-full border-2 border-gray-300 rounded-lg px-3 py-2" value={formItem.nome} onChange={(e) => setFormItem({ ...formItem, nome: e.target.value })} /></div><div><label className="block text-sm font-semibold text-gray-700 mb-1">Preço Normal (R$) *</label><input type="text" inputMode="decimal" required className="w-full border-2 border-gray-300 rounded-lg px-3 py-2" value={formItem.preco} onChange={(e) => { let v = e.target.value.replace(',', '.'); v = v.replace(/[^0-9.]/g, ''); setFormItem({ ...formItem, preco: v }) }} placeholder="30,00" /></div></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-1">Descrição</label><textarea className="w-full border-2 border-gray-300 rounded-lg px-3 py-2" rows={2} value={formItem.descricao} onChange={(e) => setFormItem({ ...formItem, descricao: e.target.value })} /></div>
              <div><label className="block text-sm font-semibold text-gray-700 mb-2">Foto do prato</label><ImageUpload onUpload={(url: string) => setFormItem({ ...formItem, foto_url: url })} defaultImage={formItem.foto_url} /></div>
              <div className="bg-purple-50 p-4 rounded-lg space-y-3">
                <div className="flex items-center gap-2"><input type="checkbox" checked={formItem.promocao_ativa} onChange={(e) => setFormItem({ ...formItem, promocao_ativa: e.target.checked })} id="promo-ativa" className="rounded text-purple-600 focus:ring-purple-500" /><label htmlFor="promo-ativa" className="text-sm font-medium text-gray-700">Ativar promoção</label></div>
                {formItem.promocao_ativa && <div><label className="block text-sm font-medium mb-1">Preço Promocional (R$)</label><input type="text" inputMode="decimal" className="w-full border rounded-lg px-3 py-2" value={formItem.preco_promocional} onChange={(e) => { let v = e.target.value.replace(',', '.'); v = v.replace(/[^0-9.]/g, ''); setFormItem({ ...formItem, preco_promocional: v }) }} placeholder="25,00" /></div>}
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2"><input type="checkbox" checked={formItem.disponivel} onChange={(e) => setFormItem({ ...formItem, disponivel: e.target.checked })} /><span className="text-sm font-medium text-gray-700">Publicar no cardápio</span></label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={formItem.delivery_disponivel} onChange={(e) => setFormItem({ ...formItem, delivery_disponivel: e.target.checked })} /><span className="text-sm font-medium text-gray-700">🛵 Delivery</span></label>
              </div>
              <div className="flex gap-3"><button type="submit" className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700">{modoEdicao ? '💾 Atualizar' : '💾 Salvar'}</button><button type="button" onClick={() => { setMostrarModal(false); limparForm() }} className="flex-1 border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100">❌ Cancelar</button></div>
            </form>
          </div>
        </div>
      )}
      {mostrarNovaCategoria && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="font-bold text-lg text-gray-900 mb-4">➕ Nova Categoria</h3>
            <input type="text" className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 mb-4" placeholder="Nome da categoria" value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && criarCategoria()} />
            <div className="flex gap-3"><button onClick={criarCategoria} className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-700">✅ Criar</button><button onClick={() => { setMostrarNovaCategoria(false); setNovaCategoria('') }} className="flex-1 border-2 border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-100">❌ Cancelar</button></div>
          </div>
        </div>
      )}
    </div>
  )
}