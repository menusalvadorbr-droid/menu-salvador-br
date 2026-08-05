// Componentes pequenos e genéricos, reutilizados por ItemRow e ModalItem —
// nenhum tem estado ou lógica própria de cardápio, só apresentação.

export function Badge({ cor, children }: { cor: 'gray' | 'orange' | 'yellow' | 'blue'; children: React.ReactNode }) {
  const cls = {
    gray:   'bg-gray-100 text-gray-500',
    orange: 'bg-orange-100 text-orange-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    blue:   'bg-blue-100 text-blue-600',
  }[cor]
  return <span className={`text-xs px-1.5 py-0.5 rounded-full ${cls}`}>{children}</span>
}

export function Acao({ onClick, title, emoji, destaque, perigo }: {
  onClick: () => void; title: string; emoji: string; destaque?: boolean; perigo?: boolean
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-9 h-9 rounded-lg flex items-center justify-center text-base transition
        ${perigo    ? 'hover:bg-red-50 text-red-400'
        : destaque  ? 'bg-orange-50 text-orange-500 hover:bg-orange-100'
        :             'hover:bg-gray-100 text-gray-500'}`}
    >
      {emoji}
    </button>
  )
}

export function Toggle({ checked, onChange, label }: {
  checked: boolean; onChange: (v: boolean) => void; label: string
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <div
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${
          checked ? 'bg-orange-500' : 'bg-gray-200'
        }`}
      >
        <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-4' : ''
        }`} />
      </div>
      <span className="text-sm text-gray-700">{label}</span>
    </label>
  )
}
