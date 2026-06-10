'use client'

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { DashboardAdmin } from './components/DashboardAdmin'
import { TabelaEstabelecimentos } from './components/TabelaEstabelecimentos'
import { FormNovoEstabelecimento } from './components/FormNovoEstabelecimento'
import { GerenciadorPlanos } from './components/GerenciadorPlanos'
import { GerenciarHome } from './components/GerenciarHome'
import { GerenciarTiposCozinha } from './components/GerenciarTiposCozinha'
import { EditarEstabelecimentoModal } from './components/EditarEstabelecimentoModal'
import { GerenciarTemas } from './components/GerenciarTemas'

export default function AdminPage() {
  const [logado, setLogado] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState('dashboard')
  const [estabelecimentos, setEstabelecimentos] = useState<any[]>([])
  const [planos, setPlanos] = useState<any[]>([])
  const [temas, setTemas] = useState<any[]>([])
  const [modelosQR, setModelosQR] = useState<any[]>([])
  const [recursos, setRecursos] = useState<any[]>([])
  const [stats, setStats] = useState({ total: 0, ativos: 0, inativos: 0, scans: 0 })
  const [ordenacao, setOrdenacao] = useState<{ coluna: string | null; direcao: 'asc' | 'desc' }>({
    coluna: null,
    direcao: 'asc',
  })
  const [estabelecimentoEditando, setEstabelecimentoEditando] = useState<any>(null)

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
    const [
      { data: planosData },
      { data: temasData },
      { data: modelosData },
      { data: recursosData },
    ] = await Promise.all([
      supabase.from('planos').select('*'),
      supabase.from('temas').select('*'),
      supabase.from('modelos_qrcode').select('*'),
      supabase.from('recursos_menu').select('*'),
    ])
    if (planosData) setPlanos(planosData)
    if (temasData) setTemas(temasData)
    if (modelosData) setModelosQR(modelosData)
    if (recursosData) setRecursos(recursosData)
  }, [])

  useEffect(() => {
    if (logado) {
      carregarDados()
      carregarPlanosETemas()
    }
  }, [logado, carregarDados, carregarPlanosETemas])

  // ✅ NOVO: atualiza temas e planos sempre que entrar nas abas "planos" ou "temas"
  useEffect(() => {
    if (logado && (abaAtiva === 'planos' || abaAtiva === 'temas')) {
      carregarPlanosETemas()
    }
  }, [abaAtiva, logado, carregarPlanosETemas])

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

  const handleOrdenar = (coluna: string) => {
    setOrdenacao(prev => ({
      coluna,
      direcao: prev.coluna === coluna && prev.direcao === 'asc' ? 'desc' : 'asc',
    }))
  }

  const estabelecimentosOrdenados = [...estabelecimentos].sort((a, b) => {
    if (!ordenacao.coluna) return 0
    const aVal = a[ordenacao.coluna]
    const bVal = b[ordenacao.coluna]
    if (typeof aVal === 'string') {
      return ordenacao.direcao === 'asc'
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal)
    }
    return ordenacao.direcao === 'asc'
      ? (aVal ?? 0) - (bVal ?? 0)
      : (bVal ?? 0) - (aVal ?? 0)
  })

  if (!logado) {
    return <LoginForm onLogin={() => setLogado(true)} />
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow-sm px-4 md:px-6 py-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-bold">⚙️ Painel Admin</h1>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-blue-600 text-sm hover:underline">Ver Site →</Link>
          <button onClick={() => setLogado(false)} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm">Sair</button>
        </div>
      </header>

      <div className="flex flex-col md:flex-row">
        <aside className="w-full md:w-64 bg-white min-h-screen shadow-sm p-4 space-y-1 overflow-x-auto">
          {[
            { key: 'dashboard', icon: '📊', label: 'Dashboard' },
            { key: 'estabelecimentos', icon: '🏪', label: 'Estabelecimentos' },
            { key: 'novo', icon: '➕', label: 'Novo' },
            { key: 'planos', icon: '💰', label: 'Planos' },
            { key: 'home', icon: '🏠', label: 'Página Inicial' },
            { key: 'tipos_cozinha', icon: '🍽️', label: 'Tipos de Cozinha' },
            { key: 'temas', icon: '🎨', label: 'Temas' },
          ].map((aba) => (
            <button
              key={aba.key}
              onClick={() => setAbaAtiva(aba.key)}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-2 transition-colors ${
                abaAtiva === aba.key ? 'bg-orange-100 text-orange-700 font-medium' : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {aba.icon} {aba.label}
            </button>
          ))}
        </aside>

        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {abaAtiva === 'dashboard' && (
            <DashboardAdmin stats={stats} estabelecimentos={estabelecimentos} />
          )}
          {abaAtiva === 'estabelecimentos' && (
            <div>
              <h2 className="text-2xl font-bold mb-6">🏪 Estabelecimentos</h2>
              <TabelaEstabelecimentos
                estabelecimentos={estabelecimentosOrdenados}
                planos={planos}
                ordenacao={ordenacao}
                onOrdenar={handleOrdenar}
                onToggleStatus={toggleStatus}
                onToggleDestaque={toggleDestaque}
                onExcluir={excluirEstabelecimento}
                onEditar={setEstabelecimentoEditando}
              />
            </div>
          )}
          {abaAtiva === 'novo' && (
            <FormNovoEstabelecimento onSave={() => { carregarDados(); setAbaAtiva('estabelecimentos') }} />
          )}
          {abaAtiva === 'planos' && (
            <GerenciadorPlanos
              planos={planos}
              temas={temas}
              modelosQR={modelosQR}
              recursos={recursos}
              onUpdate={setPlanos}
            />
          )}
          {abaAtiva === 'home' && <GerenciarHome />}
          {abaAtiva === 'tipos_cozinha' && <GerenciarTiposCozinha />}
          {abaAtiva === 'temas' && <GerenciarTemas />}
        </main>
      </div>

      {estabelecimentoEditando && (
        <EditarEstabelecimentoModal
          estabelecimento={estabelecimentoEditando}
          planos={planos}
          onClose={() => setEstabelecimentoEditando(null)}
          onSave={() => { carregarDados(); setEstabelecimentoEditando(null) }}
        />
      )}
    </div>
  )
}

function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (senha === 'admin123') {
      onLogin()
    } else {
      setErro('Senha incorreta!')
    }
  }
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-2xl shadow-lg w-full max-w-md">
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
          onChange={(e) => { setSenha(e.target.value); setErro('') }}
        />
        {erro && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{erro}</div>}
        <button type="submit" className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700">
          Entrar
        </button>
      </form>
    </div>
  )
}