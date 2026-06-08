// src/app/painel/components/ConfiguracoesTab.tsx
'use client'

const DIAS_SEMANA = [
  { valor: 0, nome: 'Domingo' },
  { valor: 1, nome: 'Segunda' },
  { valor: 2, nome: 'Terça' },
  { valor: 3, nome: 'Quarta' },
  { valor: 4, nome: 'Quinta' },
  { valor: 5, nome: 'Sexta' },
  { valor: 6, nome: 'Sábado' },
]

interface ConfiguracoesTabProps {
  idiomasSelecionados: string[]
  onSalvarIdiomas: (novosIdiomas: string[]) => void
  opcoesIdiomas: Array<{ cod: string; nome: string; bandeira: string }>
  horarios: any[]
  setHorarios: React.Dispatch<React.SetStateAction<any[]>>
  onSalvarHorario: (dia: any) => void
  whatsappMensagem: string
  setWhatsappMensagem: (msg: string) => void
  whatsappAtivo: boolean
  setWhatsappAtivo: (ativo: boolean) => void
  onSalvarWhatsAppConfig: () => void
  usuario: any
}

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
}: ConfiguracoesTabProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">⚙️ Configurações</h2>
      <div className="space-y-8">
        {/* Idiomas */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4">🌐 Idiomas do Cardápio</h3>
          <p className="text-sm text-gray-500 mb-2">
            Selecione até 2 idiomas adicionais (Português é fixo).
          </p>
          <div className="flex flex-wrap gap-3">
            {opcoesIdiomas
              .filter((opt) => opt.cod !== 'pt')
              .map((opt) => (
                <label key={opt.cod} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={idiomasSelecionados.includes(opt.cod)}
                    onChange={(e) => {
                      let novos = e.target.checked
                        ? [...idiomasSelecionados, opt.cod]
                        : idiomasSelecionados.filter((c) => c !== opt.cod)
                      if (novos.length > 3) {
                        alert('Máximo de 2 idiomas adicionais.')
                        return
                      }
                      onSalvarIdiomas(novos)
                    }}
                    className="rounded"
                  />
                  <span>
                    {opt.bandeira} {opt.nome}
                  </span>
                </label>
              ))}
          </div>
        </div>

        {/* Horários de Funcionamento */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4">🕒 Horários de Funcionamento</h3>
          <div className="space-y-3">
            {horarios.map((dia, idx) => (
              <div key={dia.dia_semana} className="flex flex-wrap items-center gap-3 text-sm">
                <span className="w-24 font-medium">{DIAS_SEMANA[idx].nome}</span>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={dia.fechado}
                    onChange={(e) => {
                      const novos = [...horarios]
                      novos[idx].fechado = e.target.checked
                      setHorarios(novos)
                      onSalvarHorario(novos[idx])
                    }}
                  />
                  <span className="text-xs">Fechado</span>
                </label>
                {!dia.fechado && (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={dia.horario_abertura?.substring(0, 5)}
                      onChange={(e) => {
                        const novos = [...horarios]
                        novos[idx].horario_abertura = e.target.value
                        setHorarios(novos)
                        onSalvarHorario(novos[idx])
                      }}
                      className="border rounded px-2 py-1 w-28"
                    />
                    <span>às</span>
                    <input
                      type="time"
                      value={dia.horario_fechamento?.substring(0, 5)}
                      onChange={(e) => {
                        const novos = [...horarios]
                        novos[idx].horario_fechamento = e.target.value
                        setHorarios(novos)
                        onSalvarHorario(novos[idx])
                      }}
                      className="border rounded px-2 py-1 w-28"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* WhatsApp Config */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4">💬 WhatsApp</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Mensagem padrão</label>
              <input
                type="text"
                value={whatsappMensagem}
                onChange={(e) => setWhatsappMensagem(e.target.value)}
                className="w-full border rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={whatsappAtivo}
                  onChange={(e) => setWhatsappAtivo(e.target.checked)}
                />
                <span>Ativar botão no menu</span>
              </label>
              <button
                onClick={onSalvarWhatsAppConfig}
                className="bg-green-600 text-white px-4 py-2 rounded-lg"
              >
                💾 Salvar Configurações
              </button>
            </div>
          </div>
        </div>

        {/* Conta */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-lg mb-4">👤 Conta</h3>
          <p className="text-sm">
            <span className="text-gray-500">Email:</span> {usuario?.email}
          </p>
          <button className="text-blue-600 text-sm mt-2">Alterar senha</button>
        </div>
      </div>
    </div>
  )
}