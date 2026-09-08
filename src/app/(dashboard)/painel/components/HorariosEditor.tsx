'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { logSupabaseError } from '@/lib/supabase/logError'
import { horarioAtualSalvador } from '@/lib/horarioSalvador'
import SeletorHorarios, { periodosPadrao, type PeriodoHorario } from '@/components/SeletorHorarios'

interface HorariosEditorProps {
  estabelecimentoId: string
  readOnly?: boolean
}

export default function HorariosEditor({ estabelecimentoId, readOnly = false }: HorariosEditorProps) {
  // FIX: cliente estabilizado com useRef — antes era recriado a cada
  // render, podendo causar comportamento inconsistente (ex: assinaturas
  // ou chamadas em andamento perdendo referência) em re-renders frequentes.
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current
  const [horarios, setHorarios] = useState<PeriodoHorario[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

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

    setHorarios(data && data.length > 0 ? data : periodosPadrao())
    setLoading(false)
  }

  useEffect(() => {
    carregarHorarios()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estabelecimentoId])

  async function salvarHorarios() {
    if (readOnly) return
    setSaving(true)
    setMessage(null)

    // Deleta todos os horários atuais
    await supabase.from('horarios_funcionamento').delete().eq('estabelecimento_id', estabelecimentoId)

    // Insere novos
    // Sempre normaliza pra HH:MM antes de gravar — o valor no estado pode
    // estar como "HH:MM" (campo que o usuário editou agora) ou "HH:MM:SS"
    // (campo carregado direto do banco e nunca tocado). Sem essa
    // normalização, o segundo caso vira "HH:MM:SS:00" ao somar ':00'.
    const registros = horarios.map((h) => ({
      estabelecimento_id: estabelecimentoId,
      dia_semana: h.dia_semana,
      horario_abertura: h.horario_abertura?.substring(0, 5) + ':00',
      horario_fechamento: h.horario_fechamento?.substring(0, 5) + ':00',
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

  // Sempre o dia da semana em Salvador, não no fuso de quem estiver
  // editando de outro lugar — mesma correção já feita na página pública
  // (ver src/lib/horarioSalvador.ts).
  const { diaSemana: diaSemanaHojeSalvador } = horarioAtualSalvador()

  return (
    <div>
      <h3 className="mb-4 text-lg font-semibold">🕒 Horários de Funcionamento</h3>

      <SeletorHorarios
        periodos={horarios}
        onChange={setHorarios}
        readOnly={readOnly}
        diaSemanaHoje={diaSemanaHojeSalvador}
      />

      {!readOnly && (
        <div className="mt-4 flex items-center gap-4">
          <button
            onClick={salvarHorarios}
            disabled={saving}
            className="rounded-lg bg-orange-600 px-6 py-2 text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Salvar Horários'}
          </button>
          {message && <span className="text-sm">{message}</span>}
        </div>
      )}
    </div>
  )
}
