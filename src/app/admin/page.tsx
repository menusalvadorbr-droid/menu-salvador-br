'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

// ----------------------------------------------------------------
// Subcomponentes
// ----------------------------------------------------------------

function LoginForm({ onLogin }: { onLogin: (senha: string) => void }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (senha === 'admin123') {
      onLogin(senha)
    } else {
      setErro('Senha incorreta!')
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-2xl font-bold text-gray-800">Painel Admin</h1>
          <p className="text-gray-600 text-sm mt-1">menu.salvador.br</p>
        </div>
        <input
          type="password"
          placeholder="Digite a senha..."
          className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 mb-4"
          value={senha}
          onChange={(e) => { setSenha(e.target.value); setErro(''); }}
        />
        {erro && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{erro}</div>}
        <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700">
          Entrar
        </button>
      </form>
    </div>
  )
}

function DashboardCards({ stats }: { stats: { total: number; ativos: number; inativos: number; scans: number } }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
      {[
        { label: 'Total', value: stats.total, color: '' },
        { label: 'Ativos', value: stats.ativos, color: 'text-green-600' },
        { label: 'Inativos', value: stats.inativos, color: 'text-red-600' },
        { label: 'Scans QR', value: stats.scans, color: 'text-blue-600' },
      ].map((item) => (
        <div key={item.label} className="bg-white p-6 rounded-xl shadow-sm">
          <p className="text-gray-500 text-sm">{item.label}</p>
          <p className={`text-3xl font-bold ${item.color}`}>{item.value}</p>
        </div>
      ))}
    </div>
  )
}

function TabelaEstabelecimentos({
  estabelecimentos,
  onToggleStatus,
  onToggleDestaque,
  onExcluir,
}: {
  estabelecimentos: any[]
  onToggleStatus: (id: string, ativo: boolean) => void
  onToggleDestaque: (id: string, destaque: boolean) => void
  onExcluir: (id: string, nome: string) => void
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left p-4">Nome</th>
            <th className="text-left p-4">Bairro</th>
            <th className="text-left p-4">Tipo</th>
            <th className="text-left p-4">QR Code</th>
            <th className="text-left p-4">Scans</th>
            <th className="text-left p-4">Status</th>
            <th className="text-left p-4">Ações</th>
          </tr>
        </thead>
        <tbody>
          {estabelecimentos.map((est) => (
            <tr key={est.id} className="border-t hover:bg-gray-50">
              <td className="p-4 font-medium">{est.nome}</td>
              <td className="p-4 text-sm">{est.bairro}</td>
              <td className="p-4 text-sm">{est.tipo_cozinha}</td>
              <td className="p-4 text-xs font-mono">{est.qrcode_short_url || 'N/A'}</td>
              <td className="p-4 text-sm">{est.scans_qrcode || 0}</td>
              <td className="p-4">
                <button
                  onClick={() => onToggleStatus(est.id, est.ativo)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    est.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}
                >
                  {est.ativo ? 'Ativo' : 'Inativo'}
                </button>
              </td>
              <td className="p-4">
                <div className="flex gap-2">
                  <button onClick={() => onToggleDestaque(est.id, est.destaque)}
                    className={est.destaque ? 'text-yellow-500' : 'text-gray-400'} title="Destacar">⭐</button>
                  <a href={`/menu/${est.qrcode_short_url}`} target="_blank" className="text-blue-600 hover:text-blue-800" title="Ver cardápio">📱</a>
                  <button onClick={() => onExcluir(est.id, est.nome)} className="text-red-500 hover:text-red-700" title="Excluir">🗑️</button>
                </div>
              </td>
            </tr>
          ))}
          {estabelecimentos.length === 0 && (
            <tr>
              <td colSpan={7} className="p-4 text-center text-gray-500">Nenhum estabelecimento cadastrado.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

function GerenciadorPlanos({
  planos,
  temas,
  modelosQR,
  onToggleTema,
  onToggleModeloQR,
  onAlterarLimite,
}: {
  planos: any[]
  temas: any[]
  modelosQR: any[]
  onToggleTema: (planoId: string, temaSlug: string, marcado: boolean) => void
  onToggleModeloQR: (planoId: string, modeloSlug: string, marcado: boolean) => void
  onAlterarLimite: (planoId: string, novoLimite: number) => void
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {planos.map((plano) => (
        <div key={plano.id} className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-xl font-bold mb-2 text-gray-900">{plano.nome}</h3>
          <p className="text-3xl font-bold text-orange-600 mb-4">
            {plano.preco_mensal === 0 ? 'Grátis' : `R$ ${plano.preco_mensal}/mês`}
          </p>
          <div className="flex items-center gap-2 mb-4">
            <label className="text-sm font-medium text-gray-700">Itens máximos:</label>
            <input
              type="number"
              min={1}
              max={999}
              value={plano.limite_itens}
              onChange={(e) => onAlterarLimite(plano.id, parseInt(e.target.value) || 1)}
              className="w-20 border-2 border-gray-300 rounded-lg px-2 py-1 text-gray-900 text-center focus:border-orange-500 focus:ring-orange-200"
            />
          </div>

          {/* Temas */}
          <div className="mb-4">
            <h4 className="font-medium text-gray-700 mb-2">Temas disponíveis:</h4>
            {temas.map((tema) => {
              const marcado = plano.temas_permitidos?.includes(tema.slug) || false
              return (
                <label key={`${plano.id}-tema-${tema.slug}`} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={() => onToggleTema(plano.id, tema.slug, marcado)}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full inline-block border border-gray-300"
                      style={{ backgroundColor: tema.cores?.[0] || '#ccc' }}
                    />
                    <span className="text-gray-800 text-sm">{tema.nome}</span>
                  </span>
                  {!marcado && <span className="text-xs text-red-400 ml-1">(não incluso)</span>}
                </label>
              )
            })}
          </div>

          {/* Modelos de QR Code */}
          <div>
            <h4 className="font-medium text-gray-700 mb-2">QR Codes disponíveis:</h4>
            {modelosQR.map((modelo) => {
              const marcado = plano.modelos_qrcode_permitidos?.includes(modelo.slug) || false
              return (
                <label key={`${plano.id}-qr-${modelo.slug}`} className="flex items-center gap-2 py-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={() => onToggleModeloQR(plano.id, modelo.slug, marcado)}
                    className="rounded text-orange-600 focus:ring-orange-500"
                  />
                  <span className="flex items-center gap-2">
                    <span
                      className="w-5 h-5 rounded border"
                      style={{
                        backgroundColor: modelo.cor_fundo,
                        borderColor: modelo.cor_frente,
                        backgroundImage: modelo.estilo === 'pontilhado'
                          ? `radial-gradient(circle at 2px 2px, ${modelo.cor_frente} 1px, transparent 0)`
                          : 'none',
                        borderRadius: modelo.estilo === 'redondo' ? '4px' : '0',
                      }}
                    />
                    <span className="text-gray-800 text-sm">{modelo.nome}</span>
                  </span>
                  {!marcado && <span className="text-xs text-red-400 ml-1">(não incluso)</span>}
                </label>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

// ----------------------------------------------------------------
// Componente principal
// ----------------------------------------------------------------

export default function AdminPage() {
  const [logado, setLogado] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState('dashboard')
  const [estabelecimentos, setEstabelecimentos] = useState<any[]>([])
  const [planos, setPlanos] = useState<any[]>([])
  const [temas, setTemas] = useState<any[]>([])
  const [modelosQR, setModelosQR] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, ativos: 0, inativos: 0, scans: 0 })

  const carregarDados = useCallback(async () => {
    const { data } = await supabase
      .from('estabelecimentos')
      .select('*')
      .order('created_at', { ascending: false })
    if (data) {
      setEstabelecimentos(data)
      setStats({
        total: data.length,
        ativos: data.filter((e) => e.ativo).length,
        inativos: data.filter((e) => !e.ativo).length,
        scans: data.reduce((sum, e) => sum + (e.scans_qrcode || 0), 0),
      })
    }
  }, [])

  const carregarPlanosETemas = useCallback(async () => {
    const [{ data: planosData }, { data: temasData }, { data: modelosData }] = await Promise.all([
      supabase.from('planos').select('*'),
      supabase.from('temas').select('*'),
      supabase.from('modelos_qrcode').select('*'),
    ])
    if (planosData) setPlanos(planosData)
    if (temasData) setTemas(temasData)
    if (modelosData) setModelosQR(modelosData)
  }, [])

  useEffect(() => {
    if (logado) {
      carregarDados()
      carregarPlanosETemas()
    }
  }, [logado, carregarDados, carregarPlanosETemas])

  const toggleStatus = async (id: string, ativo: boolean) => {
    await supabase.from('estabelecimentos').update({ ativo: !ativo }).eq('id', id)
    carregarDados()
  }

  const toggleDestaque = async (id: string, destaque: boolean) => {
    await supabase.from('estabelecimentos').update({ destaque: !destaque }).eq('id', id)
    carregarDados()
  }

  const excluirEstabelecimento = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir "${nome}"?`)) {
      await supabase.from('estabelecimentos').delete().eq('id', id)
      carregarDados()
    }
  }

  const toggleTemaPlano = async (planoId: string, temaSlug: string, marcado: boolean) => {
    const planoCopia = planos.find((p) => p.id === planoId)
    if (!planoCopia) return

    const novosTemas = marcado
      ? planoCopia.temas_permitidos.filter((t: string) => t !== temaSlug)
      : [...(planoCopia.temas_permitidos || []), temaSlug]

    const { error } = await supabase
      .from('planos')
      .update({ temas_permitidos: novosTemas })
      .eq('id', planoId)

    if (!error) {
      carregarPlanosETemas()
    } else {
      alert('Erro ao atualizar temas: ' + error.message)
    }
  }

  const toggleModeloQRPlano = async (planoId: string, modeloSlug: string, marcado: boolean) => {
    const planoCopia = planos.find((p) => p.id === planoId)
    if (!planoCopia) return

    const novosModelos = marcado
      ? planoCopia.modelos_qrcode_permitidos.filter((m: string) => m !== modeloSlug)
      : [...(planoCopia.modelos_qrcode_permitidos || []), modeloSlug]

    const { error } = await supabase
      .from('planos')
      .update({ modelos_qrcode_permitidos: novosModelos })
      .eq('id', planoId)

    if (!error) {
      carregarPlanosETemas()
    } else {
      alert('Erro ao atualizar modelos de QR Code: ' + error.message)
    }
  }

  const alterarLimitePlano = async (planoId: string, novoLimite: number) => {
    const { error } = await supabase
      .from('planos')
      .update({ limite_itens: novoLimite })
      .eq('id', planoId)

    if (!error) {
      carregarPlanosETemas()
    } else {
      alert('Erro ao atualizar limite: ' + error.message)
    }
  }

  if (!logado) {
    return <LoginForm onLogin={(senha) => { if (senha === 'admin123') setLogado(true) }} />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold">⚙️ Painel Admin</h1>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-blue-600 text-sm hover:underline">Ver Site →</Link>
          <button onClick={() => setLogado(false)} className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm">Sair</button>
        </div>
      </header>

      <div className="flex">
        <aside className="w-64 bg-white min-h-screen shadow-sm p-4 space-y-1">
          {[
            { key: 'dashboard', icon: '📊', label: 'Dashboard' },
            { key: 'estabelecimentos', icon: '🏪', label: 'Estabelecimentos' },
            { key: 'novo', icon: '➕', label: 'Novo' },
            { key: 'planos', icon: '💰', label: 'Planos' },
          ].map((aba) => (
            <button
              key={aba.key}
              onClick={() => setAbaAtiva(aba.key)}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 ${
                abaAtiva === aba.key ? 'bg-orange-100 text-orange-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {aba.icon} {aba.label}
            </button>
          ))}
        </aside>

        <main className="flex-1 p-6">
          {abaAtiva === 'dashboard' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">📊 Dashboard</h2>
              <DashboardCards stats={stats} />
            </div>
          )}

          {abaAtiva === 'estabelecimentos' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">🏪 Estabelecimentos</h2>
              <TabelaEstabelecimentos
                estabelecimentos={estabelecimentos}
                onToggleStatus={toggleStatus}
                onToggleDestaque={toggleDestaque}
                onExcluir={excluirEstabelecimento}
              />
            </div>
          )}

          {abaAtiva === 'novo' && (
            <FormNovoEstabelecimento onSave={() => { carregarDados(); setAbaAtiva('estabelecimentos') }} />
          )}

          {abaAtiva === 'planos' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">💰 Gerenciar Planos e Temas</h2>
              <GerenciadorPlanos
                planos={planos}
                temas={temas}
                modelosQR={modelosQR}
                onToggleTema={toggleTemaPlano}
                onToggleModeloQR={toggleModeloQRPlano}
                onAlterarLimite={alterarLimitePlano}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

// ----------------------------------------------------------------
// Formulário de novo estabelecimento
// ----------------------------------------------------------------
function FormNovoEstabelecimento({ onSave }: { onSave: () => void }) {
  const [form, setForm] = useState({
    nome: '',
    tipo_cozinha: 'baiana',
    tipo_estabelecimento: 'restaurante',
    bairro: '',
    endereco: '',
    whatsapp: '',
    descricao: '',
    plano_id: '',
  })
  const [salvando, setSalvando] = useState(false)
  const [planosLocais, setPlanosLocais] = useState<any[]>([])

  useEffect(() => {
    supabase.from('planos').select('*').then(({ data }) => {
      if (data) setPlanosLocais(data)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nome || !form.bairro || !form.endereco) {
      alert('Preencha nome, bairro e endereço!')
      return
    }
    setSalvando(true)

    const slug = form.nome
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 6)

    const shortUrl = Math.random().toString(36).substring(2, 10)

    const { error } = await supabase.from('estabelecimentos').insert({
      nome: form.nome,
      slug,
      tipo_cozinha: form.tipo_cozinha,
      tipo_estabelecimento: form.tipo_estabelecimento,
      bairro: form.bairro,
      endereco: form.endereco,
      whatsapp: form.whatsapp,
      descricao: form.descricao,
      plano_id: form.plano_id || null,
      qrcode_short_url: shortUrl,
      ativo: true,
    })

    if (error) {
      alert('Erro ao cadastrar: ' + error.message)
    } else {
      onSave()
      setForm({
        nome: '',
        tipo_cozinha: 'baiana',
        tipo_estabelecimento: 'restaurante',
        bairro: '',
        endereco: '',
        whatsapp: '',
        descricao: '',
        plano_id: '',
      })
    }
    setSalvando(false)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">➕ Novo Estabelecimento</h2>
      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome *</label>
            <input type="text" required className="w-full border rounded-lg px-3 py-2" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bairro *</label>
            <input type="text" required className="w-full border rounded-lg px-3 py-2" value={form.bairro} onChange={e => setForm({...form, bairro: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Cozinha</label>
            <select className="w-full border rounded-lg px-3 py-2" value={form.tipo_cozinha} onChange={e => setForm({...form, tipo_cozinha: e.target.value})}>
              <option value="baiana">Baiana</option>
              <option value="acaraje">Acarajé</option>
              <option value="brasileira">Brasileira</option>
              <option value="italiana">Italiana</option>
              <option value="japonesa">Japonesa</option>
              <option value="hamburguer">Hambúrguer</option>
              <option value="contemporanea">Contemporânea</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Tipo de Estabelecimento</label>
            <select className="w-full border rounded-lg px-3 py-2" value={form.tipo_estabelecimento} onChange={e => setForm({...form, tipo_estabelecimento: e.target.value})}>
              <option value="restaurante">Restaurante</option>
              <option value="bar">Bar</option>
              <option value="cafeteria">Cafeteria</option>
              <option value="banca_acaraje">Banca de Acarajé</option>
              <option value="foodtruck">Food Truck</option>
              <option value="lanchonete">Lanchonete</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Endereço *</label>
            <input type="text" required className="w-full border rounded-lg px-3 py-2" value={form.endereco} onChange={e => setForm({...form, endereco: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">WhatsApp</label>
            <input type="text" className="w-full border rounded-lg px-3 py-2" value={form.whatsapp} onChange={e => setForm({...form, whatsapp: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Plano</label>
            <select className="w-full border rounded-lg px-3 py-2" value={form.plano_id} onChange={e => setForm({...form, plano_id: e.target.value})}>
              <option value="">Grátis (padrão)</option>
              {planosLocais.map((plano) => (
                <option key={plano.id} value={plano.id}>
                  {plano.nome} {plano.preco_mensal > 0 ? `- R$ ${plano.preco_mensal}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Descrição</label>
            <textarea rows={3} className="w-full border rounded-lg px-3 py-2" value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} />
          </div>
        </div>
        <button type="submit" disabled={salvando} className="mt-6 bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50">
          {salvando ? 'Salvando...' : '💾 Salvar Estabelecimento'}
        </button>
      </form>
    </div>
  )
}