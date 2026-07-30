'use client'

/**
 * Círculo clicável — o próprio `<input type="color">` nativo, só
 * estilizado pra parecer uma bolinha (as pseudo-classes `::-webkit-
 * color-swatch`/`::-moz-color-swatch` são o "miolo" que o navegador
 * desenha por dentro do input; sem arredondar elas também, sobra um
 * quadrado dentro do círculo). Sem campo de texto pra digitar hex —
 * o valor só aparece como referência, não editável direto.
 */
export default function SeletorCor({
  label,
  valor,
  onChange,
  disabled,
}: {
  label: string
  valor: string
  onChange: (hex: string) => void
  disabled?: boolean
}) {
  return (
    <label className={`flex flex-col items-center gap-1.5 ${disabled ? 'opacity-60' : ''}`}>
      <input
        type="color"
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-12 w-12 cursor-pointer rounded-full border-2 border-white shadow [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-none [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-none [&::-webkit-color-swatch-wrapper]:p-0 disabled:cursor-not-allowed"
      />
      <span className="text-xs font-medium text-gray-600">{label}</span>
      <span className="font-mono text-[10px] text-gray-400">{valor}</span>
    </label>
  )
}
