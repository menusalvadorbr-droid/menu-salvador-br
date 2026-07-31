'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RECURSOS_PLANO } from '@/lib/recursosPlano'

interface Plano {
  id: string
  nome: string
  descricao: string | null
  preco: number
  recursos: string[]
  created_at: string
}

const FORM_PADRAO = {
  nome: '',
  descricao: '',
  preco: '',
  recursos: [] as string[],
}

export default function GerenciarPlanos() {
  const supabase = createClient()
  const [planos, setPlanos] = useState<Plano[]>([])
  const [loading, setLoading] = useState(true)
  const [editando, setEditando] = useState<Plano | null>(null)
  const [criando, setCriando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [form, setForm] = useState(FORM_PADRAO)

  useEffect(() => {
    carregarPlanos()
  }, [])

  async function carregarPlanos() {
    const { data } = await supabase.from('planos').select('*').order('created_at', { ascending: true })
    if (data) setPlanos(data)
    setLoading(false)
  }

  function toggleRecurso(slug: string) {
    setForm((prev) => ({
      ...prev,
      recursos: prev.recursos.includes(slug)
        ? prev.recursos.filter((r) => r !== slug)
        : [...prev.recursos, slug],
    }))
  }

  function iniciarCriacao() {
    setEditando(null)
    setForm(FORM_PADRAO)
    setErro(null)
    setCriando(true)
  }

  function iniciarEdicao(plano: Plano) {
    setEditando(plano)
    setForm({
      nome: plano.nome || '',
      descricao: plano.descricao || '',
      preco: plano.preco != null ? String(plano.preco).replace('.', ',') : '',
      recursos: plano.recursos || [],
    })
    setErro(null)
    setCriando(true)
  }

  function cancelar() {
    setCriando(false)
    setEditando(null)
    setForm(FORM_PADRAO)
    setErro(null)
  }

  async function salvarPlano(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)

    const nome = form.nome.trim()
    if (!nome) { setErro('Nome é obrigatório.'); return }
    const precoNum = parseFloat(form.preco.replace(',', '.'))
    if (isNaN(precoNum) || precoNum < 0) { setErro('Preço inválido.'); return }

    setSalvando(true)
    try {
      const dados = {
        nome,
        descricao: form.descricao.trim() || null,
        preco: precoNum,
        recursos: form.recursos,
      }

      const { error } = editando
        ? await supabase.from('planos').update(dados).eq('id', editando.id)
        : await supabase.from('planos').insert(dados)

      if (error) {
        setErro('Erro ao salvar plano: ' + error.message)
      } else {
        cancelar()
        await carregarPlanos()
      }
    } finally {
      setSalvando(false)
    }
  }

  async function deletarPlano(plano: Plano) {
    if (!confirm(`Remover o plano "${plano.nome}"? Estabelecimentos que estejam nesse plano perdem os recursos associados a ele.`)) return
    const { error } = await supabase.from('planos').delete().eq('id', plano.id)
    if (error) {
      alert('Erro ao remover: ' + error.message)
    } else {
      await carregarPlanos()
    }
  }

  if (loading) return <div className="py-10 text-center text-gray-400">Carregando planos…</div>

  return (
    <div className="space-y-6">
      {!criando && (
        <button
          onClick={iniciarCriacao}
          className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 transition"
        >
          + Criar plano
        </button>
      )}

      {criando && (
        <form onSubmit={salvarPlano} className="space-y-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-gray-800">{editando ? 'Editar plano' : 'Novo plano'}</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nome *</label>
              <input
                value={form.nome}
                onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                placeholder="Ex: Plano Essencial"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Preço (R$) *</label>
              <input
                value={form.preco}
                onChange={(e) => setForm((p) => ({ ...p, preco: e.target.value }))}
                placeholder="0,00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
            <textarea
              value={form.descricao}
              onChange={(e) => setForm((p) => ({ ...p, descricao: e.target.value }))}
              rows={2}
              placeholder="O que esse plano oferece, em poucas palavras…"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Recursos incluídos</label>
            <div className="space-y-2">
              {RECURSOS_PLANO.map((r) => (
                <label key={r.slug} className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.recursos.includes(r.slug)}
                    onChange={() => toggleRecurso(r.slug)}
                    className="w-4 h-4 mt-0.5 accent-orange-500"
                  />
                  <span>
                    <span className="block text-sm font-medium text-gray-800">{r.label}</span>
                    <span className="block text-xs text-gray-400">{r.descricao}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {erro && <p className="text-sm text-red-600">{erro}</p>}

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={salvando}
              className="bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-700 disabled:opacity-50 transition"
            >
              {salvando ? 'Salvando…' : editando ? 'Salvar alterações' : 'Criar plano'}
            </button>
            <button
              type="button"
              onClick={cancelar}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {planos.length > 0 ? (
          planos.map((plano) => (
            <div key={plano.id} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">{plano.nome}</h2>
              <p className="text-sm text-gray-500 mt-1">{plano.descricao}</p>
              <p className="text-3xl font-bold text-orange-600 mt-4">
                R$ {plano.preco?.toFixed(2) || '0,00'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {plano.recursos?.length || 0} recurso{plano.recursos?.length === 1 ? '' : 's'} incluído{plano.recursos?.length === 1 ? '' : 's'}
              </p>
              {plano.recursos && plano.recursos.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {plano.recursos.map((slug) => (
                    <span key={slug} className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                      {RECURSOS_PLANO.find((r) => r.slug === slug)?.label || slug}
                    </span>
                  ))}
                </div>
              )}
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => iniciarEdicao(plano)}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-600 transition"
                >
                  Editar
                </button>
                <button
                  onClick={() => deletarPlano(plano)}
                  className="bg-red-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-red-600 transition"
                >
                  Remover
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-3 text-center py-12 text-gray-500">
            <p className="text-lg">Nenhum plano cadastrado.</p>
          </div>
        )}
      </div>
    </div>
  )
}
