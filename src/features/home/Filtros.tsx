'use client';

interface Bairro {
  id: string;
  nome: string;
  slug: string;
}

interface FiltrosProps {
  bairroId: string;
  bairros: Bairro[];
  temFiltroAtivo: boolean;
  onChangeBairro: (bairroId: string) => void;
  onLimpar: () => void;
}

export default function Filtros({ bairroId, bairros, temFiltroAtivo, onChangeBairro, onLimpar }: FiltrosProps) {
  return (
    <div className="border-b border-neutral-100 bg-white">
      <div className="container mx-auto flex items-center gap-3 overflow-x-auto px-4 py-3">
        <select
          className="rounded-full border-2 border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition hover:border-[var(--brand-primary)]/60"
          value={bairroId}
          onChange={(e) => onChangeBairro(e.target.value)}
        >
          <option value="">📍 Todos os bairros</option>
          {bairros.map((b) => (
            <option key={b.id} value={b.id}>{b.nome}</option>
          ))}
        </select>

        {temFiltroAtivo && (
          <button
            onClick={onLimpar}
            className="whitespace-nowrap text-sm font-medium text-red-500 hover:text-red-700"
          >
            ✕ Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}
