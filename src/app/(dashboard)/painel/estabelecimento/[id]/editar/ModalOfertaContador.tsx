'use client'

import ImageUpload from '@/app/(dashboard)/painel/components/ImageUpload'
import { Toggle } from './CardapioUI'

const DIAS_SEMANA_ABREV = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Mesma forma de ItemCardapioSimples em PromocoesTab.tsx — precisa bater
// exatamente, porque adicionarItemNoCombo é a mesma função passada por lá.
interface ItemComboBusca {
  id: string
  nome: string
  preco: number
  foto_url: string | null
}

interface LinhaCombo {
  itemCardapioId: string
  nome: string
  quantidade: string
}

export default function ModalOfertaContador({
  editando,
  erroOferta,
  ofNome, setOfNome,
  ofDescricao, setOfDescricao,
  ofFotoUrl, setOfFotoUrl,
  ofPrecoDe, setOfPrecoDe,
  ofPrecoPor, setOfPrecoPor,
  ofCardLargo, setOfCardLargo,
  ofAtivo, setOfAtivo,
  ofRecorrente, setOfRecorrente,
  ofDiasSemana, toggleDiaSemanaOferta,
  ofHoraInicio, setOfHoraInicio,
  ofHoraFim, setOfHoraFim,
  ofInicioEm, setOfInicioEm,
  ofFimEm, setOfFimEm,
  ofExibirInicio, setOfExibirInicio,
  ofExibirFim, setOfExibirFim,
  ofAlertaMinutos, setOfAlertaMinutos,
  ofTemPrazo, setOfTemPrazo,
  itensCardapioTodos,
  ofComporItens, setOfComporItens,
  ofItensCombo,
  buscaItemCombo, setBuscaItemCombo,
  somaItensCombo,
  adicionarItemNoCombo,
  atualizarQuantidadeNoCombo,
  removerItemDoCombo,
  limparItensCombo,
  salvandoOferta,
  onSalvar,
  onFechar,
}: {
  editando: boolean
  erroOferta: string | null
  ofNome: string; setOfNome: (v: string) => void
  ofDescricao: string; setOfDescricao: (v: string) => void
  ofFotoUrl: string; setOfFotoUrl: (v: string) => void
  ofPrecoDe: string; setOfPrecoDe: (v: string) => void
  ofPrecoPor: string; setOfPrecoPor: (v: string) => void
  ofCardLargo: boolean; setOfCardLargo: (v: boolean) => void
  ofAtivo: boolean; setOfAtivo: (v: boolean) => void
  ofRecorrente: boolean; setOfRecorrente: (v: boolean) => void
  ofDiasSemana: number[]; toggleDiaSemanaOferta: (dia: number) => void
  ofHoraInicio: string; setOfHoraInicio: (v: string) => void
  ofHoraFim: string; setOfHoraFim: (v: string) => void
  ofInicioEm: string; setOfInicioEm: (v: string) => void
  ofFimEm: string; setOfFimEm: (v: string) => void
  ofExibirInicio: string; setOfExibirInicio: (v: string) => void
  ofExibirFim: string; setOfExibirFim: (v: string) => void
  ofAlertaMinutos: string; setOfAlertaMinutos: (v: string) => void
  ofTemPrazo: boolean; setOfTemPrazo: (v: boolean) => void
  itensCardapioTodos: ItemComboBusca[]
  ofComporItens: boolean; setOfComporItens: (v: boolean) => void
  ofItensCombo: LinhaCombo[]
  buscaItemCombo: string; setBuscaItemCombo: (v: string) => void
  somaItensCombo: number
  adicionarItemNoCombo: (item: ItemComboBusca) => void
  atualizarQuantidadeNoCombo: (itemCardapioId: string, quantidade: string) => void
  removerItemDoCombo: (itemCardapioId: string) => void
  limparItensCombo: () => void
  salvandoOferta: boolean
  onSalvar: () => void
  onFechar: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          <h2 className="font-semibold text-gray-900">
            {editando ? 'Editar promoção' : 'Nova promoção com contador'}
          </h2>
          <button
            onClick={onFechar}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 text-lg transition"
          >
            ✕
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5 space-y-4 flex-1">
          {erroOferta && (
            <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 text-sm">
              {erroOferta}
            </div>
          )}

          <ImageUpload
            onUpload={setOfFotoUrl}
            onRemove={() => setOfFotoUrl('')}
            currentImage={ofFotoUrl || null}
            label="Foto da promoção"
            aspectRatio="16:9"
            maxSize={2}
          />

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Nome <span className="text-red-400">*</span>
            </label>
            <input
              value={ofNome}
              onChange={(e) => setOfNome(e.target.value)}
              placeholder="Ex: Combo casal, Happy hour"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Descrição</label>
            <textarea
              value={ofDescricao}
              onChange={(e) => setOfDescricao(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
            />
          </div>

          {/* Compor com itens do cardápio — só aparece se o
              estabelecimento já tiver algum item cadastrado; senão o
              formulário segue exatamente como sempre foi (nome/preço/
              foto livres). */}
          {itensCardapioTodos.length > 0 && (
            <div className="rounded-xl border border-gray-200 p-3 space-y-3">
              <Toggle
                checked={ofComporItens}
                onChange={(v) => { setOfComporItens(v); if (!v) limparItensCombo() }}
                label="Compor com itens do cardápio (ex: Combo)"
              />
              {ofComporItens && (
                <div className="space-y-2">
                  {ofItensCombo.length > 0 && (
                    <div className="space-y-1.5">
                      {ofItensCombo.map((li) => (
                        <div key={li.itemCardapioId} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
                          <span className="flex-1 text-sm text-gray-700 truncate">{li.nome}</span>
                          <input
                            value={li.quantidade}
                            onChange={(e) => atualizarQuantidadeNoCombo(li.itemCardapioId, e.target.value)}
                            className="w-14 border border-gray-200 rounded-lg px-2 py-1 text-xs text-center bg-white text-gray-900"
                          />
                          <button
                            onClick={() => removerItemDoCombo(li.itemCardapioId)}
                            className="text-red-400 hover:text-red-600 text-xs px-1"
                            title="Remover"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="relative">
                    <input
                      value={buscaItemCombo}
                      onChange={(e) => setBuscaItemCombo(e.target.value)}
                      placeholder="Buscar item do cardápio…"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
                    />
                    {buscaItemCombo.trim() && (
                      <div className="absolute z-10 mt-1 w-full max-h-40 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg">
                        {itensCardapioTodos
                          .filter(
                            (i) =>
                              i.nome.toLowerCase().includes(buscaItemCombo.trim().toLowerCase()) &&
                              !ofItensCombo.some((li) => li.itemCardapioId === i.id)
                          )
                          .slice(0, 8)
                          .map((i) => (
                            <button
                              key={i.id}
                              onClick={() => adicionarItemNoCombo(i)}
                              className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-orange-50 transition"
                            >
                              {i.nome} <span className="text-gray-400 text-xs">R$ {i.preco.toFixed(2)}</span>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                  {somaItensCombo > 0 && (
                    <p className="text-xs text-gray-500">
                      Soma dos itens: R$ {somaItensCombo.toFixed(2)}{' '}
                      <button
                        type="button"
                        onClick={() => setOfPrecoDe(somaItensCombo.toFixed(2).replace('.', ','))}
                        className="text-orange-600 hover:underline font-medium"
                      >
                        usar como Preço &quot;de&quot;
                      </button>
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Preço &quot;de&quot; <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                value={ofPrecoDe}
                onChange={(e) => setOfPrecoDe(e.target.value)}
                placeholder="0,00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Preço &quot;por&quot; <span className="text-red-400">*</span>
              </label>
              <input
                value={ofPrecoPor}
                onChange={(e) => setOfPrecoPor(e.target.value)}
                placeholder="0,00"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-5">
            <Toggle checked={ofCardLargo} onChange={setOfCardLargo} label="Card largo (dobro da largura)" />
            <Toggle checked={ofAtivo} onChange={setOfAtivo} label="Ativo" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Tem prazo definido?</label>
            <div className="flex gap-2">
              {([
                { valor: true, label: 'Sim' },
                { valor: false, label: 'Não' },
              ] as const).map((op) => (
                <button
                  key={String(op.valor)}
                  type="button"
                  onClick={() => setOfTemPrazo(op.valor)}
                  className={`flex-1 py-2 rounded-xl border-2 text-sm font-medium transition ${
                    ofTemPrazo === op.valor
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>
            {!ofTemPrazo && (
              <p className="mt-1.5 text-xs text-gray-400">
                Fica sempre disponível, sem contador — ideal pra Combos e itens fixos.
              </p>
            )}
          </div>

          {ofTemPrazo && (
          <div className="rounded-xl border border-gray-200 p-3 space-y-3">
            <Toggle checked={ofRecorrente} onChange={setOfRecorrente} label="Recorrente (repete toda semana)" />

            {ofRecorrente ? (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">Dias da semana</label>
                  <div className="flex gap-1.5">
                    {DIAS_SEMANA_ABREV.map((label, dia) => (
                      <button
                        key={dia}
                        type="button"
                        onClick={() => toggleDiaSemanaOferta(dia)}
                        className={`w-9 h-9 rounded-lg text-xs font-semibold border transition ${
                          ofDiasSemana.includes(dia)
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Hora início</label>
                    <input
                      type="time"
                      value={ofHoraInicio}
                      onChange={(e) => setOfHoraInicio(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Hora fim</label>
                    <input
                      type="time"
                      value={ofHoraFim}
                      onChange={(e) => setOfHoraFim(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-400">
                  Hora fim menor ou igual à hora início = janela cruza a meia-noite (ex: 22:00–02:00).
                </p>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Início <span className="text-gray-400 font-normal">(opcional — vazio = já começou)</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={ofInicioEm}
                    onChange={(e) => setOfInicioEm(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Fim <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={ofFimEm}
                    onChange={(e) => setOfFimEm(e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
                  />
                </div>
              </div>
            )}
          </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Exibir a partir de <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="datetime-local"
                value={ofExibirInicio}
                onChange={(e) => setOfExibirInicio(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Exibir até <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="datetime-local"
                value={ofExibirFim}
                onChange={(e) => setOfExibirFim(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 -mt-2">
            Enquanto estiver dentro dessa janela mas fora do horário ativo, a promoção aparece apagada
            com um aviso de quando fica disponível, em vez do contador.
          </p>

          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Alerta de urgência (minutos)</label>
            <input
              type="number"
              min={1}
              value={ofAlertaMinutos}
              onChange={(e) => setOfAlertaMinutos(e.target.value)}
              className="w-28 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
            />
            <p className="text-xs text-gray-400 mt-1">
              A partir de quantos minutos antes de encerrar o contador vira âmbar/urgente.
            </p>
          </div>
        </div>

        <div className="flex gap-3 px-6 py-4 border-t border-gray-100 flex-shrink-0">
          <button
            onClick={onFechar}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onSalvar}
            disabled={salvandoOferta}
            className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {salvandoOferta
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Salvando…</>
              : editando ? '✓ Salvar alterações' : '✓ Criar promoção'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
