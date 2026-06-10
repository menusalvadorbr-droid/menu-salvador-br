// src/app/admin/components/GerenciadorPlanos.tsx
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'

// Interface que resolve o erro "implicitly has an 'any' type"
interface GerenciadorPlanosProps {
  planos: any[]
  temas: any[]
  modelosQR: any[]
  recursos: any[]
  onUpdate: (planos: any[]) => void
}

export function GerenciadorPlanos({ planos, temas, modelosQR, recursos, onUpdate }: GerenciadorPlanosProps) {
  const [mostrarNovoPlano, setMostrarNovoPlano] = useState(false)
  const [novoPlanoNome, setNovoPlanoNome] = useState('')
  const [novoPlanoPreco, setNovoPlanoPreco] = useState(0)
  const [novoPlanoLimite, setNovoPlanoLimite] = useState(15)

  const atualizarPlanoLocal = (planoId: string, atualizacao: any) => {
    const novosPlanos = planos.map(p => p.id === planoId ? { ...p, ...atualizacao } : p)
    onUpdate(novosPlanos)
    return novosPlanos
  }

  const toggleTemaPlano = async (planoId: string, temaSlug: string, marcado: boolean) => {
    const plano = planos.find(p => p.id === planoId)
    const temasAtuais = plano.temas_permitidos || []
    const novosTemas = marcado ? temasAtuais.filter((t: string) => t !== temaSlug) : [...temasAtuais, temaSlug]
    atualizarPlanoLocal(planoId, { temas_permitidos: novosTemas })
    const { error } = await supabase.from('planos').update({ temas_permitidos: novosTemas }).eq('id', planoId)
    if (error) { alert('Erro: ' + error.message); onUpdate(planos) }
  }

  const toggleModeloQRPlano = async (planoId: string, modeloSlug: string, marcado: boolean) => {
    const plano = planos.find(p => p.id === planoId)
    const modelosAtuais = plano.modelos_qrcode_permitidos || []
    const novosModelos = marcado ? modelosAtuais.filter((m: string) => m !== modeloSlug) : [...modelosAtuais, modeloSlug]
    atualizarPlanoLocal(planoId, { modelos_qrcode_permitidos: novosModelos })
    const { error } = await supabase.from('planos').update({ modelos_qrcode_permitidos: novosModelos }).eq('id', planoId)
    if (error) { alert('Erro: ' + error.message); onUpdate(planos) }
  }

  const toggleRecursoPlano = async (planoId: string, recursoSlug: string, marcado: boolean) => {
    const plano = planos.find(p => p.id === planoId)
    const recursosAtuais = plano.recursos_permitidos || []
    const novosRecursos = marcado ? recursosAtuais.filter((r: string) => r !== recursoSlug) : [...recursosAtuais, recursoSlug]
    atualizarPlanoLocal(planoId, { recursos_permitidos: novosRecursos })
    const { error } = await supabase.from('planos').update({ recursos_permitidos: novosRecursos }).eq('id', planoId)
    if (error) { alert('Erro: ' + error.message); onUpdate(planos) }
  }

  const alterarLimitePlano = async (planoId: string, novoLimite: number) => {
    atualizarPlanoLocal(planoId, { limite_itens: novoLimite })
    const { error } = await supabase.from('planos').update({ limite_itens: novoLimite }).eq('id', planoId)
    if (error) { alert('Erro: ' + error.message); onUpdate(planos) }
  }

  const excluirPlano = async (id: string, nome: string) => {
    const { count } = await supabase.from('estabelecimentos').select('*', { count: 'exact', head: true }).eq('plano_id', id)
    if (count && count > 0) return alert(`Não é possível excluir "${nome}" porque há ${count} estabelecimento(s) vinculado(s).`)
    if (confirm(`Excluir plano "${nome}"?`)) {
      const novosPlanos = planos.filter(p => p.id !== id)
      onUpdate(novosPlanos)
      const { error } = await supabase.from('planos').delete().eq('id', id)
      if (error) { alert('Erro: ' + error.message); onUpdate(planos) }
    }
  }

  const criarPlano = async () => {
    if (!novoPlanoNome) return
    const slug = novoPlanoNome.toLowerCase().replace(/\s+/g, '-')
    const novoPlano = { nome: novoPlanoNome, slug, preco_mensal: novoPlanoPreco, limite_itens: novoPlanoLimite, temas_permitidos: [], modelos_qrcode_permitidos: [], recursos_permitidos: [] }
    const idTemp = Date.now().toString()
    onUpdate([...planos, { ...novoPlano, id: idTemp }])
    const { data, error } = await supabase.from('planos').insert(novoPlano).select().single()
    if (error) { alert('Erro ao criar: ' + error.message); onUpdate(planos) }
    else onUpdate(planos.map(p => p.id === idTemp ? data : p))
    setMostrarNovoPlano(false)
    setNovoPlanoNome('')
    setNovoPlanoPreco(0)
    setNovoPlanoLimite(15)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">💰 Gerenciar Planos</h2>
        <button onClick={() => setMostrarNovoPlano(true)} className="bg-orange-600 text-white px-4 py-2 rounded-lg">➕ Novo Plano</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {planos.map((plano: any) => (
          <div key={plano.id} className="bg-white rounded-xl p-6 shadow-sm">
            <h3 className="text-xl font-bold">{plano.nome}</h3>
            <p className="text-3xl font-bold text-orange-600 my-2">{plano.preco_mensal === 0 ? 'Grátis' : `R$ ${plano.preco_mensal}/mês`}</p>
            <div className="mb-4">
              <label className="text-sm">Itens máximos:</label>
              <input type="number" value={plano.limite_itens} onChange={e => alterarLimitePlano(plano.id, parseInt(e.target.value))} className="w-20 border rounded px-2 py-1 ml-2" />
            </div>
            <div className="mb-4">
              <h4 className="font-medium">Temas:</h4>
              {temas.map((tema: any) => {
                const marcado = plano.temas_permitidos?.includes(tema.slug) || false
                return (
                  <label key={tema.slug} className="flex items-center gap-2 py-1">
                    <input type="checkbox" checked={marcado} onChange={() => toggleTemaPlano(plano.id, tema.slug, marcado)} />
                    <span>{tema.nome}</span>
                  </label>
                )
              })}
            </div>
            <div className="mb-4">
              <h4 className="font-medium">QR Codes:</h4>
              {modelosQR.map((modelo: any) => {
                const marcado = plano.modelos_qrcode_permitidos?.includes(modelo.slug) || false
                return (
                  <label key={modelo.slug} className="flex items-center gap-2 py-1">
                    <input type="checkbox" checked={marcado} onChange={() => toggleModeloQRPlano(plano.id, modelo.slug, marcado)} />
                    <span>{modelo.nome}</span>
                  </label>
                )
              })}
            </div>
            <div className="mb-4">
              <h4 className="font-medium">Recursos:</h4>
              {recursos.map((recurso: any) => {
                const marcado = plano.recursos_permitidos?.includes(recurso.slug) || false
                return (
                  <label key={recurso.slug} className="flex items-center gap-2 py-1">
                    <input type="checkbox" checked={marcado} onChange={() => toggleRecursoPlano(plano.id, recurso.slug, marcado)} />
                    <span>{recurso.nome}</span>
                  </label>
                )
              })}
            </div>
            <button onClick={() => excluirPlano(plano.id, plano.nome)} className="text-red-600 text-sm">🗑️ Excluir</button>
          </div>
        ))}
      </div>
      {mostrarNovoPlano && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">Novo Plano</h3>
            <input type="text" placeholder="Nome" className="w-full border rounded px-3 py-2 mb-2" value={novoPlanoNome} onChange={e => setNovoPlanoNome(e.target.value)} />
            <input type="number" step="0.01" placeholder="Preço mensal" className="w-full border rounded px-3 py-2 mb-2" value={novoPlanoPreco} onChange={e => setNovoPlanoPreco(parseFloat(e.target.value))} />
            <input type="number" placeholder="Limite de itens" className="w-full border rounded px-3 py-2 mb-4" value={novoPlanoLimite} onChange={e => setNovoPlanoLimite(parseInt(e.target.value))} />
            <div className="flex gap-3">
              <button onClick={criarPlano} className="bg-orange-600 text-white px-4 py-2 rounded-lg">Criar</button>
              <button onClick={() => setMostrarNovoPlano(false)} className="border px-4 py-2 rounded-lg">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}