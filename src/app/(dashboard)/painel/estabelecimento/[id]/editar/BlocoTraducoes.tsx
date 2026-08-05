import { IDIOMA_LABEL, type Idioma, type TraducoesCampos, type TraducoesNome } from './cardapioTipos'

// ─────────────────────────────────────────────
// BLOCO DE TRADUÇÕES — reutilizado no item (nome + descrição) e na
// categoria (só nome, já que categoria não tem descrição em português).
// ─────────────────────────────────────────────
export default function BlocoTraducoes({
  idiomasAtivos, campos, valores, onChange,
}: {
  idiomasAtivos: Idioma[]
  campos: ('nome' | 'descricao')[]
  valores: TraducoesCampos | TraducoesNome
  onChange: (idioma: Idioma, campo: 'nome' | 'descricao', valor: string) => void
}) {
  return (
    <div className="space-y-3">
      {idiomasAtivos.map((idi) => (
        <div key={idi} className="rounded-lg border border-gray-200 p-3 space-y-2">
          <p className="text-xs font-semibold text-gray-600">{IDIOMA_LABEL[idi]}</p>
          {campos.includes('nome') && (
            <input
              value={(valores as TraducoesCampos)[idi]?.nome || ''}
              onChange={(e) => onChange(idi, 'nome', e.target.value)}
              placeholder="Nome traduzido"
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
            />
          )}
          {campos.includes('descricao') && (
            <textarea
              value={(valores as TraducoesCampos)[idi]?.descricao || ''}
              onChange={(e) => onChange(idi, 'descricao', e.target.value)}
              placeholder="Descrição traduzida"
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white text-gray-900"
            />
          )}
        </div>
      ))}
    </div>
  )
}
