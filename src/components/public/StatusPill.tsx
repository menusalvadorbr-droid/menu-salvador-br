export default function StatusPill({
  aberto,
  mensagem,
}: {
  aberto: boolean
  mensagem: string
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${
        aberto ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
      }`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${aberto ? 'bg-green-500' : 'bg-red-500'}`} />
      {mensagem}
    </span>
  )
}
