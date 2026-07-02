'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logSupabaseError } from '@/lib/supabase/logError'

interface HorariosEditorProps {
  estabelecimentoId: string
  readOnly?: boolean
}

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const MAX_PERIODOS = 3

export default function HorariosEditor({ estabelecimentoId, readOnly = false }: HorariosEditorProps) {
  const supabase = createClient()
  const [horarios, setHorarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    carregarHorarios()
  }, [estabelecimentoId])

  async function carregarHorarios() {
    const { data, error } = await supabase
      .from('horarios_funcionamento')
      .select('*')
      .eq('estabelecimento_id', estabelecimentoId)
      .order('dia_semana')
      .order('horario_abertura')

    if (error) {
      logSupabaseError('Erro em HorariosEditor:', error)
      setLoading(false)
      return
    }

    if (!data || data.length === 0) {
      // Criar estrutura padrão (1 período por dia, aberto)
      const padrao = DIAS.map((_, index) => ({
        id: `temp-${index}`,
        dia_semana: index,
        horario_abertura: '08:00',
        horario_fechamento: '18:00',
        fechado: false,
      }))
      setHorarios(padrao)
    } else {
      setHorarios(data)
    }
    setLoading(false)
  }

  function adicionarPeriodo(diaIndex: number) {
    if (readOnly) return
    const dia = horarios.filter(h => h.dia_semana === diaIndex)
    if (dia.length >= MAX_PERIODOS) {
      alert(`Máximo de ${MAX_PERIODOS} períodos por dia.`)
      return
    }
    const ultimo = dia[dia.length - 1]
    const novoId = `temp-${Date.now()}-${diaIndex}`
    setHorarios([
      ...horarios,
      {
        id: novoId,
        dia_semana: diaIndex,
        horario_abertura: ultimo?.horario_fechamento || '12:00',
        horario_fechamento: somarHoras(ultimo?.horario_fechamento || '12:00', 2),
        fechado: false,
      },
    ])
  }

  function removerPeriodo(id: string) {
    if (readOnly) return
    const diaIndex = horarios.find(h => h.id === id)?.dia_semana
    const doDia = horarios.filter(h => h.dia_semana === diaIndex)
    if (doDia.length <= 1) {
      alert('Cada dia precisa ter pelo menos um período.')
      return
    }
    setHorarios(horarios.filter(h => h.id !== id))
  }

  function atualizarPeriodo(id: string, campo: string, valor: any) {
    if (readOnly) return
    setHorarios(horarios.map(h => (h.id === id ? { ...h, [campo]: valor } : h)))
  }

  function somarHoras(hora: string, horas: number): string {
    const [h, m] = hora.split(':').map(Number)
    const total = h + horas
    return `${String(total).padStart(2, '0')}:${String(m).padStart(2, '0')}`
  }

  async function salvarHorarios() {
    if (readOnly) return
    setSaving(true)
    setMessage(null)

    // Deleta todos os horários atuais
    await supabase.from('horarios_funcionamento').delete().eq('estabelecimento_id', estabelecimentoId)

    // Insere novos
    const registros = horarios.map(h => ({
      estabelecimento_id: estabelecimentoId,
      dia_semana: h.dia_semana,
      horario_abertura: h.horario_abertura + ':00',
      horario_fechamento: h.horario_fechamento + ':00',
      fechado: h.fechado || false,
    }))

    const { error } = await supabase.from('horarios_funcionamento').insert(registros)

    if (error) {
      setMessage('Erro ao salvar: ' + error.message)
    } else {
      setMessage('✅ Horários salvos com sucesso!')
    }
    setSaving(false)
  }

  if (loading) return <div className="text-gray-500">Carregando...</div>

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">🕒 Horários de Funcionamento</h3>
      <div className="space-y-4">
        {DIAS.map((dia, idx) => {
          const periodos = horarios.filter(h => h.dia_semana === idx)
          const todosFechados = periodos.every(h => h.fechado)
          const hoje = new Date().getDay() === idx

          return (
            <div key={idx} className={`p-4 rounded-xl border ${hoje ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className={`font-medium ${hoje ? 'text-orange-700' : ''}`}>
                    {hoje && '👉 '}{dia}
                  </span>
                  <label className="flex items-center gap-1 text-sm">
                    <input
                      type="checkbox"
                      checked={todosFechados}
                      onChange={(e) => {
                        const novoFechado = e.target.checked
                        setHorarios(horarios.map(h =>
                          h.dia_semana === idx ? { ...h, fechado: novoFechado } : h
                        ))
                      }}
                      disabled={readOnly}
                    />
                    Fechado
                  </label>
                </div>
                {!readOnly && !todosFechados && (
                  <button
                    onClick={() => adicionarPeriodo(idx)}
                    className="text-sm bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    + Adicionar período
                  </button>
                )}
              </div>

              {!todosFechados && (
                <div className="mt-3 space-y-2">
                  {periodos.map((h) => (
                    <div key={h.id} className="flex items-center gap-3">
                      <input
                        type="time"
                        value={h.horario_abertura?.substring(0, 5) || '08:00'}
                        onChange={(e) => atualizarPeriodo(h.id, 'horario_abertura', e.target.value)}
                        disabled={readOnly}
                        className="border border-gray-200 rounded px-2 py-1 text-sm bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
                      />
                      <span className="text-gray-400">—</span>
                      <input
                        type="time"
                        value={h.horario_fechamento?.substring(0, 5) || '18:00'}
                        onChange={(e) => atualizarPeriodo(h.id, 'horario_fechamento', e.target.value)}
                        disabled={readOnly}
                        className="border border-gray-200 rounded px-2 py-1 text-sm bg-white text-gray-900 disabled:bg-gray-100 disabled:text-gray-400"
                      />
                      {!readOnly && periodos.length > 1 && (
                        <button
                          onClick={() => removerPeriodo(h.id)}
                          className="text-red-500 hover:text-red-700 text-sm"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {todosFechados && <div className="mt-2 text-sm text-gray-400 italic">Fechado</div>}
            </div>
          )
        })}
      </div>

      {!readOnly && (
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={salvarHorarios}
            disabled={saving}
            className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar Horários'}
          </button>
          {message && <span className="text-sm">{message}</span>}
        </div>
      )}
    </div>
  )
}