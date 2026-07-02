'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logSupabaseError } from '@/lib/supabase/logError'
import { UserPlus, UserX, Shield, User, Trash2 } from 'lucide-react'

interface Funcionario {
  id: string
  user_id: string
  email: string
  nome: string
  cargo: string
  ativo: boolean
}

interface FuncionariosTabProps {
  estabelecimentoId: string
}

const CARGOS = [
  { value: 'gerente', label: 'Gerente', icon: '👔' },
  { value: 'caixa', label: 'Caixa', icon: '💰' },
  { value: 'garcom', label: 'Garçom', icon: '🍽️' },
  { value: 'cozinha', label: 'Cozinha', icon: '👨‍🍳' },
]

export default function FuncionariosTab({ estabelecimentoId }: FuncionariosTabProps) {
  const supabase = createClient()
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [email, setEmail] = useState('')
  const [cargo, setCargo] = useState('garcom')
  const [nome, setNome] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [atualizandoCargo, setAtualizandoCargo] = useState<string | null>(null)

  const carregarFuncionarios = async () => {
    setLoading(true)
    setError(null)

    const { data, error } = await supabase
      .from('funcionarios')
      .select(`
        id,
        cargo,
        ativo,
        user_id,
        usuarios:user_id (email, nome)
      `)
      .eq('estabelecimento_id', estabelecimentoId)

    if (error) {
      logSupabaseError('Erro ao carregar funcionários:', error)
      setError('Erro ao carregar funcionários')
      setLoading(false)
      return
    }

    const formatted = data?.map((f: any) => ({
      id: f.id,
      user_id: f.user_id,
      email: f.usuarios?.email || 'Sem email',
      nome: f.usuarios?.nome || 'Sem nome',
      cargo: f.cargo,
      ativo: f.ativo,
    })) || []

    setFuncionarios(formatted)
    setLoading(false)
  }

  useEffect(() => {
    carregarFuncionarios()
  }, [estabelecimentoId])

  const handleConvidar = async (e: React.FormEvent) => {
    e.preventDefault()
    setSalvando(true)
    setError(null)

    if (!email || !nome || !cargo) {
      setError('Preencha todos os campos.')
      setSalvando(false)
      return
    }

    try {
      // O convite cria de fato uma credencial em auth.users (via service role,
      // só no servidor) e envia um e-mail para o funcionário definir a senha.
      const res = await fetch('/api/funcionarios/convidar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estabelecimentoId, email, nome, cargo }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Erro ao convidar funcionário.')
      }

      setEmail('')
      setNome('')
      setCargo('garcom')
      setMostrarForm(false)
      await carregarFuncionarios()
    } catch (err: any) {
      console.error('Erro ao convidar:', err)
      setError(err.message || 'Erro ao convidar funcionário.')
    } finally {
      setSalvando(false)
    }
  }

  const handleTrocarCargo = async (funcionarioId: string, novoCargo: string) => {
    setAtualizandoCargo(funcionarioId)

    // Atualização otimista: já reflete na tela antes da resposta do servidor,
    // pra trocar o cargo parecer instantâneo.
    setFuncionarios((prev) =>
      prev.map((f) => (f.id === funcionarioId ? { ...f, cargo: novoCargo } : f))
    )

    const { error } = await supabase
      .from('funcionarios')
      .update({ cargo: novoCargo })
      .eq('id', funcionarioId)

    if (error) {
      alert('Erro ao trocar cargo: ' + error.message)
      await carregarFuncionarios() // desfaz a atualização otimista em caso de erro
    }

    setAtualizandoCargo(null)
  }

  const handleRemover = async (funcionarioId: string) => {
    if (!confirm('Remover este funcionário?')) return

    const { error } = await supabase
      .from('funcionarios')
      .delete()
      .eq('id', funcionarioId)

    if (error) {
      alert('Erro ao remover: ' + error.message)
      return
    }

    await carregarFuncionarios()
  }

  if (loading) {
    return <div className="text-gray-400 text-center py-8">Carregando funcionários...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-white">👥 Funcionários</h3>
        <button
          onClick={() => setMostrarForm(!mostrarForm)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Convidar funcionário
        </button>
      </div>

      {error && (
        <div className="bg-red-900/50 border border-red-700 text-red-200 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {mostrarForm && (
        <form onSubmit={handleConvidar} className="bg-gray-800 p-4 rounded-xl border border-gray-700 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Nome completo"
              className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
              required
            />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail"
              className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
              required
            />
            <select
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white"
            >
              {CARGOS.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.icon} {c.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={salvando}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition disabled:opacity-50"
            >
              {salvando ? 'Convidando...' : 'Convidar'}
            </button>
            <button
              type="button"
              onClick={() => setMostrarForm(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {funcionarios.length === 0 ? (
        <div className="bg-gray-800 rounded-xl p-8 text-center text-gray-400">
          <p>Nenhum funcionário cadastrado.</p>
          <p className="text-sm">Convide funcionários para ajudar na gestão.</p>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
          <table className="w-full text-sm">
            <thead className="bg-gray-700/50">
              <tr>
                <th className="px-4 py-3 text-left text-gray-300 font-medium">Nome</th>
                <th className="px-4 py-3 text-left text-gray-300 font-medium">E-mail</th>
                <th className="px-4 py-3 text-left text-gray-300 font-medium">Cargo</th>
                <th className="px-4 py-3 text-left text-gray-300 font-medium">Status</th>
                <th className="px-4 py-3 text-right text-gray-300 font-medium">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {funcionarios.map((f) => {
                return (
                  <tr key={f.id} className="hover:bg-gray-700/30">
                    <td className="px-4 py-3 text-white">{f.nome}</td>
                    <td className="px-4 py-3 text-gray-300">{f.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={f.cargo}
                        onChange={(e) => handleTrocarCargo(f.id, e.target.value)}
                        disabled={atualizandoCargo === f.id}
                        className="bg-blue-900/50 text-blue-300 text-xs px-2 py-1 rounded-full border-none cursor-pointer disabled:opacity-50"
                      >
                        {CARGOS.map((c) => (
                          <option key={c.value} value={c.value} className="bg-gray-800 text-white">
                            {c.icon} {c.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${f.ativo ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'}`}>
                        {f.ativo ? '✅ Ativo' : '❌ Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => handleRemover(f.id)}
                        className="text-red-400 hover:text-red-300 transition"
                        title="Remover funcionário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}