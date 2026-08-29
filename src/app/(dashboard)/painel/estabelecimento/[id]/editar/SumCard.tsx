export default function SumCard({ num, label, cor }: { num: number; label: string; cor: 'yellow' | 'green' | 'gray' }) {
  const cls = {
    yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-600',
  }[cor]
  return (
    <div className={`border rounded-xl px-4 py-3 ${cls}`}>
      <div className="text-2xl font-bold">{num}</div>
      <div className="text-xs mt-0.5 leading-snug">{label}</div>
    </div>
  )
}
