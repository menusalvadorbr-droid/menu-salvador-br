'use client'

export default function ModalConfigurarPromocao({
  itemNome,
  itemCodigo,
  tipoDesc,
  setTipoDesc,
  descValor,
  setDescValor,
  promoInicio,
  setPromoInicio,
  promoFim,
  setPromoFim,
  erro,
  precoBase,
  precoComDesconto,
  salvando,
  onAtivar,
  onFechar,
}: {
  itemNome: string
  itemCodigo: string | null
  tipoDesc: 'pct' | 'fixed'
  setTipoDesc: (v: 'pct' | 'fixed') => void
  descValor: string
  setDescValor: (v: string) => void
  promoInicio: string
  setPromoInicio: (v: string) => void
  promoFim: string
  setPromoFim: (v: string) => void
  erro: string | null
  precoBase: number
  precoComDesconto: number
  salvando: boolean
  onAtivar: () => void
  onFechar: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">

        {/* header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-semibold text-gray-900">Configurar promoção</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {itemCodigo ? `#${itemCodigo} · ` : ''}{itemNome}
            </p>
          </div>
          <button onClick={onFechar} className="w-8 h-8 rounded-full hover:bg-gray-100 text-gray-400 flex items-center justify-center transition">✕</button>
        </div>

        <div className="px-6 py-5 space-y-5">

          {erro && <div className="bg-red-50 text-red-700 border border-red-200 rounded-lg px-3 py-2 text-sm">{erro}</div>}

          {/* tipo de desconto */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-2">Tipo de desconto</label>
            <div className="flex gap-3">
              {(['pct', 'fixed'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setTipoDesc(t)}
                  className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-medium transition ${
                    tipoDesc === t
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  {t === 'pct' ? '% Percentual' : 'R$ Valor fixo'}
                </button>
              ))}
            </div>
          </div>

          {/* atalhos percentual */}
          {tipoDesc === 'pct' && (
            <div className="flex gap-2">
              {[10, 15, 20, 30, 50].map(p => (
                <button
                  key={p}
                  onClick={() => setDescValor(p.toString())}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition ${
                    descValor === p.toString()
                      ? 'bg-orange-100 border-orange-400 text-orange-700'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {p}%
                </button>
              ))}
            </div>
          )}

          {/* valor */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {tipoDesc === 'pct' ? 'Desconto (%)' : 'Desconto (R$)'}
            </label>
            <div className="relative">
              <input
                value={descValor}
                onChange={e => setDescValor(e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-2xl font-bold text-center bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400"
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                {tipoDesc === 'pct' ? '%' : 'R$'}
              </span>
            </div>
          </div>

          {/* comparação de preços */}
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-5 py-4">
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Preço atual</p>
              <p className="text-base text-gray-500 line-through">R$ {precoBase.toFixed(2)}</p>
            </div>
            <div className="text-gray-400">→</div>
            <div className="text-center">
              <p className="text-xs text-gray-400 mb-1">Com promoção</p>
              <p className="text-xl font-bold text-orange-600">
                R$ {(precoComDesconto > 0 ? precoComDesconto : 0).toFixed(2)}
              </p>
            </div>
          </div>

          {/* datas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Início</label>
              <input
                type="date"
                value={promoInicio}
                onChange={e => setPromoInicio(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Término <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <input
                type="date"
                value={promoFim}
                onChange={e => setPromoFim(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              />
            </div>
          </div>
          {promoFim && (
            <p className="text-xs text-gray-400">
              Desativa automaticamente após {promoFim}.
            </p>
          )}
        </div>

        {/* footer */}
        <div className="flex gap-3 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onFechar}
            className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            onClick={onAtivar}
            disabled={salvando || precoComDesconto <= 0}
            className="flex-1 py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {salvando
              ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Ativando…</>
              : '🔥 Ativar promoção'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
