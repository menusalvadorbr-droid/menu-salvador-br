import type { CardapioV2Alergeno } from '@/modules/cardapioV2/types'

export default function SelosAlergeno({ alergenoIds, alergenos }: { alergenoIds: string[]; alergenos: CardapioV2Alergeno[] }) {
  if (alergenoIds.length === 0) return null

  const presentes = alergenos.filter((a) => alergenoIds.includes(a.id))
  if (presentes.length === 0) return null

  return (
    <div className="mt-1 flex flex-wrap gap-1">
      {presentes.map((a) => (
        <span key={a.id} className="rounded-full bg-neutral-100 px-2 py-0.5 text-[11px] text-neutral-600">
          {a.icone ? `${a.icone} ` : ''}
          {a.nome}
        </span>
      ))}
    </div>
  )
}
