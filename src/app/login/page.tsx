'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const TIPOS_COZINHA = [
  { value: 'baiana', label: '🥘 Baiana' },
  { value: 'acaraje', label: '🫘 Acarajé' },
  { value: 'brasileira', label: '🇧🇷 Brasileira' },
  { value: 'italiana', label: '🍝 Italiana' },
  { value: 'japonesa', label: '🍣 Japonesa' },
  { value: 'hamburguer', label: '🍔 Hambúrguer' },
  { value: 'contemporanea', label: '🍽️ Contemporânea' },
]

const TIPOS_ESTABELECIMENTO = [
  { value: 'restaurante', label: '🍽️ Restaurante' },
  { value: 'bar', label: '🍺 Bar' },
  { value: 'cafeteria', label: '☕ Cafeteria' },
  { value: 'banca_acaraje', label: '🫘 Banca de Acarajé' },
  { value: 'foodtruck', label: '🚚 Food Truck' },
  { value: 'lanchonete', label: '🥪 Lanchonete' },
]

export default function LoginPage() {
  const router = useRouter()
  const [modo, setModo] = useState<'login' | 'cadastro'>('login')
  const [loading, setLoading] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  const [form, setForm] = useState({
    email: '',
    senha: '',
    nome: '',
    nomeEstabelecimento: '',
    bairro: '',
    tipoCozinha: 'baiana',
    tipoEstabelecimento: 'restaurante',
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErro('')
    try {
      const { data: usuario, error } = await supabase
        .from('usuarios')
        .select('*, estabelecimentos(*)')
        .eq('email', form.email)
        .eq('senha', form.senha)
        .single()
      if (error || !usuario) {
        setErro('Email ou senha incorretos!')
        setLoading(false)
        return
      }
      localStorage.setItem('usuario', JSON.stringify(usuario))
      router.push('/painel')
    } catch (e: any) {
      setErro('Erro ao fazer login: ' + e.message)
    }
    setLoading(false)
  }

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErro('')
    setSucesso('')
    try {
      const { data: existente } = await supabase
        .from('usuarios')
        .select('id')
        .eq('email', form.email)
        .single()
      if (existente) {
        setErro('Este email já está cadastrado!')
        setLoading(false)
        return
      }

      const slug =
        form.nomeEstabelecimento
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') + '-' + Math.random().toString(36).substring(2, 6)

      const shortUrl = Math.random().toString(36).substring(2, 10)

      const { data: planoGratis } = await supabase
        .from('planos')
        .select('id')
        .eq('slug', 'gratis')
        .single()

      const { data: estabelecimento, error: erroEstab } = await supabase
        .from('estabelecimentos')
        .insert({
          nome: form.nomeEstabelecimento,
          slug,
          tipo_cozinha: form.tipoCozinha,
          tipo_estabelecimento: form.tipoEstabelecimento,
          bairro: form.bairro,
          endereco: form.bairro,
          qrcode_short_url: shortUrl,
          plano_id: planoGratis?.id || null,
          ativo: true,
        })
        .select()
        .single()
      if (erroEstab) {
        setErro('Erro ao criar estabelecimento: ' + erroEstab.message)
        setLoading(false)
        return
      }

      await supabase.from('menus').insert({
        estabelecimento_id: estabelecimento.id,
        nome: 'Cardápio Principal',
        tema: 'raiz-brasileira',
      })

      const { data: usuario, error: erroUser } = await supabase
        .from('usuarios')
        .insert({
          email: form.email,
          senha: form.senha,
          nome: form.nome,
          estabelecimento_id: estabelecimento.id,
        })
        .select()
        .single()
      if (erroUser) {
        setErro('Erro ao criar usuário: ' + erroUser.message)
        setLoading(false)
        return
      }

      setSucesso('✅ Cadastro realizado com sucesso! Redirecionando...')
      localStorage.setItem('usuario', JSON.stringify({ ...usuario, estabelecimentos: estabelecimento }))
      setTimeout(() => router.push('/painel'), 2000)
    } catch (e: any) {
      setErro('Erro: ' + e.message)
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-600 to-red-700 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6 text-white text-center">
          <h1 className="text-3xl font-bold mb-1">menu.salvador.br</h1>
          <p className="opacity-90">{modo === 'login' ? 'Faça login no seu painel' : 'Cadastre seu estabelecimento'}</p>
        </div>
        <div className="flex border-b">
          <button
            onClick={() => setModo('login')}
            className={`flex-1 py-3 font-medium ${modo === 'login' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}
          >
            🔐 Login
          </button>
          <button
            onClick={() => setModo('cadastro')}
            className={`flex-1 py-3 font-medium ${modo === 'cadastro' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-gray-500'}`}
          >
            ✨ Cadastro
          </button>
        </div>
        {modo === 'login' ? (
          <form onSubmit={handleLogin} className="p-6 space-y-4">
            <input type="email" required placeholder="seu@email.com" className="w-full border-2 border-gray-300 rounded-lg px-4 py-3" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            <input type="password" required placeholder="Sua senha" className="w-full border-2 border-gray-300 rounded-lg px-4 py-3" value={form.senha} onChange={e => setForm({...form, senha: e.target.value})} />
            {erro && <div className="text-red-600 text-sm">{erro}</div>}
            <button disabled={loading} className="w-full bg-orange-600 text-white py-3 rounded-lg font-semibold hover:bg-orange-700 disabled:opacity-50">
              {loading ? '⏳ Entrando...' : '🔐 Entrar'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCadastro} className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
            <input type="text" required placeholder="Seu nome completo" className="w-full border-2 border-gray-300 rounded-lg px-4 py-3" value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} />
            <input type="email" required placeholder="seu@email.com" className="w-full border-2 border-gray-300 rounded-lg px-4 py-3" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
            <input type="password" required placeholder="Crie uma senha" className="w-full border-2 border-gray-300 rounded-lg px-4 py-3" value={form.senha} onChange={e => setForm({...form, senha: e.target.value})} />
            <hr />
            <input type="text" required placeholder="Nome do Estabelecimento" className="w-full border-2 border-gray-300 rounded-lg px-4 py-3" value={form.nomeEstabelecimento} onChange={e => setForm({...form, nomeEstabelecimento: e.target.value})} />
            <input type="text" required placeholder="Bairro" className="w-full border-2 border-gray-300 rounded-lg px-4 py-3" value={form.bairro} onChange={e => setForm({...form, bairro: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <select className="w-full border-2 border-gray-300 rounded-lg px-4 py-3" value={form.tipoCozinha} onChange={e => setForm({...form, tipoCozinha: e.target.value})}>
                {TIPOS_COZINHA.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <select className="w-full border-2 border-gray-300 rounded-lg px-4 py-3" value={form.tipoEstabelecimento} onChange={e => setForm({...form, tipoEstabelecimento: e.target.value})}>
                {TIPOS_ESTABELECIMENTO.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            {erro && <div className="text-red-600 text-sm">{erro}</div>}
            {sucesso && <div className="text-green-600 text-sm">{sucesso}</div>}
            <button disabled={loading} className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-50">
              {loading ? '⏳ Cadastrando...' : '✨ Criar Conta Grátis'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}