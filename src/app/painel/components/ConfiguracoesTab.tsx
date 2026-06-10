// src/app/painel/components/ConfiguracoesTab.tsx
'use client'

import { useState } from 'react'
import { RichTextEditor } from '@/components/ui/RichTextEditor'

interface ConfiguracoesTabProps {
  idiomasSelecionados: string[]
  onSalvarIdiomas: (idiomas: string[]) => void
  opcoesIdiomas: { cod: string; nome: string; bandeira: string }[]
  horarios: any[]
  setHorarios: (horarios: any[]) => void
  onSalvarHorario: (dia: any) => void
  whatsappMensagem: string
  setWhatsappMensagem: (msg: string) => void
  whatsappAtivo: boolean
  setWhatsappAtivo: (ativo: boolean) => void
  onSalvarWhatsAppConfig: () => void
  usuario: any
  estabelecimento: any
  onSalvarDescricao: (descricao: string) => Promise<void>
}

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function ConfiguracoesTab({
  idiomasSelecionados,
  onSalvarIdiomas,
  opcoesIdiomas,
  horarios,
  setHorarios,
  onSalvarHorario,
  whatsappMensagem,
  setWhatsappMensagem,
  whatsappAtivo,
  setWhatsappAtivo,
  onSalvarWhatsAppConfig,
  usuario,
  estabelecimento,
  onSalvarDescricao,
}: ConfiguracoesTabProps) {
  const [descricao, setDescricao] = useState(estabelecimento?.descricao || '')
  const [salvandoDesc, setSalvandoDesc] = useState(false)

  const toggleIdioma = (cod: string) => {
    const nova = idiomasSelecionados.includes(cod)
      ? idiomasSelecionados.filter(i => i !== cod)
      : [...idiomasSelecionados, cod]
    onSalvarIdiomas(nova)
  }

  const handleHorarioChange = (index: number, campo: string, valor: any) => {
    const novos = [...horarios]
    novos[index] = { ...novos[index], [campo]: valor }
    setHorarios(novos)
  }

  const handleSalvarDescricao = async () => {
    setSalvandoDesc(true)
    await onSalvarDescricao(descricao)
    setSalvandoDesc(false)
    alert('Descrição salva com sucesso!')
  }

  return (
    <div className="space-y-8">
      <h2 className="text-xl md:text-2xl font-bold text-gray-800">⚙️ Configurações</h2>

      {/* Idiomas */}
      <div className="bg-white p-6 rounded-xl border">
        <h3 className="font-bold text-lg mb-3">🌐 Idiomas do Cardápio</h3>
        <p className="text-sm text-gray-600 mb-4">
          Selecione os idiomas que deseja disponibilizar para seus clientes.
        </p>
        <div className="flex flex-wrap gap-3">
          {opcoesIdiomas.map((idioma) => (
            <label key={idioma.cod} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={idiomasSelecionados.includes(idioma.cod)}
                onChange={() => toggleIdioma(idioma.cod)}
                className="rounded"
              />
              <span className="text-sm">{idioma.bandeira} {idioma.nome}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Horários */}
      <div className="bg-white p-6 rounded-xl border">
        <h3 className="font-bold text-lg mb-3">🕒 Horários de Funcionamento</h3>
        <div className="space-y-2">
          {horarios.map((dia, idx) => (
            <div key={dia.dia_semana} className="flex items-center gap-3 flex-wrap">
              <span className="w-10 font-medium text-sm">{DIAS_SEMANA[dia.dia_semana]}</span>
              <input
                type="time"
                className="border rounded px-2 py-1 text-sm"
                value={dia.horario_abertura || ''}
                onChange={e => handleHorarioChange(idx, 'horario_abertura', e.target.value)}
                disabled={dia.fechado}
              />
              <span className="text-sm">às</span>
              <input
                type="time"
                className="border rounded px-2 py-1 text-sm"
                value={dia.horario_fechamento || ''}
                onChange={e => handleHorarioChange(idx, 'horario_fechamento', e.target.value)}
                disabled={dia.fechado}
              />
              <label className="flex items-center gap-1 text-sm">
                <input
                  type="checkbox"
                  checked={dia.fechado || false}
                  onChange={e => {
                    const novos = [...horarios]
                    novos[idx] = { ...novos[idx], fechado: e.target.checked }
                    setHorarios(novos)
                  }}
                />
                Fechado
              </label>
              <button
                onClick={() => onSalvarHorario(dia)}
                className="text-orange-600 text-sm hover:underline"
              >
                Salvar
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* WhatsApp */}
      <div className="bg-white p-6 rounded-xl border">
        <h3 className="font-bold text-lg mb-3">💬 WhatsApp</h3>
        <div className="flex items-center gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={whatsappAtivo}
              onChange={e => setWhatsappAtivo(e.target.checked)}
            />
            <span className="text-sm">Ativar botão flutuante do WhatsApp</span>
          </label>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Mensagem padrão</label>
          <textarea
            className="w-full border rounded px-3 py-2 text-sm"
            rows={3}
            value={whatsappMensagem}
            onChange={e => setWhatsappMensagem(e.target.value)}
            placeholder="Olá! Vim pelo cardápio digital."
          />
        </div>
        <button
          onClick={onSalvarWhatsAppConfig}
          className="mt-3 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm"
        >
          Salvar configurações do WhatsApp
        </button>
      </div>

      {/* Descrição do Estabelecimento (com TipTap) */}
      <div className="bg-white p-6 rounded-xl border">
        <h3 className="font-bold text-lg mb-3">📝 Descrição</h3>
        <p className="text-sm text-gray-600 mb-4">
          Esta descrição aparecerá no perfil público do seu estabelecimento.
        </p>
        <RichTextEditor
          content={descricao}
          onChange={setDescricao}
          placeholder="Conte a história do seu restaurante..."
        />
        <button
          onClick={handleSalvarDescricao}
          disabled={salvandoDesc}
          className="mt-3 bg-green-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50"
        >
          {salvandoDesc ? 'Salvando...' : 'Salvar Descrição'}
        </button>
      </div>
    </div>
  )
}