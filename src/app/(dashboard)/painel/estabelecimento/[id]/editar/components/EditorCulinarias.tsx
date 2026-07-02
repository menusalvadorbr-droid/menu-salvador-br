"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface Culinaria {
  id: string;
  nome: string;
  emoji?: string | null;
}

export default function EditorCulinarias({ estabelecimentoId }: { estabelecimentoId: string }) {
  const supabase = createClient();
  const [culinarias, setCulinarias] = useState<Culinaria[]>([]);
  const [selecionadas, setSelecionadas] = useState<string[]>([]);

  useEffect(() => {
    async function carregar() {
      const { data: todas } = await supabase.from("culinarias").select("*");
      setCulinarias(todas || []);

      const { data: atuais } = await supabase
        .from("estabelecimentos_culinarias")
        .select("culinaria_id")
        .eq("estabelecimento_id", estabelecimentoId);

      setSelecionadas((atuais || []).map((c) => c.culinaria_id));
    }

    carregar();
  }, []);

  async function toggle(culinariaId: string) {
    const novaLista = selecionadas.includes(culinariaId)
      ? selecionadas.filter((id) => id !== culinariaId)
      : [...selecionadas, culinariaId];

    setSelecionadas(novaLista);

    await supabase.from("estabelecimentos_culinarias").delete().eq("estabelecimento_id", estabelecimentoId);
    await supabase.from("estabelecimentos_culinarias").insert(
      novaLista.map((id) => ({
        estabelecimento_id: estabelecimentoId,
        culinaria_id: id,
      }))
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4 text-gray-900">🍜 Culinárias do estabelecimento</h3>
      <p className="text-sm text-gray-500 mb-4">
        Selecione as culinárias que descrevem seu cardápio. Isso ajuda os clientes a te encontrar
        nas páginas de busca por tipo de culinária.
      </p>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {culinarias.map((c) => (
          <button
            key={c.id}
            onClick={() => toggle(c.id)}
            className={`p-3 border rounded-xl flex items-center gap-2 text-sm font-medium transition ${
              selecionadas.includes(c.id)
                ? "border-orange-500 bg-orange-50 text-orange-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}
          >
            {c.emoji && <span className="text-xl">{c.emoji}</span>}
            <span>{c.nome}</span>
          </button>
        ))}
        {culinarias.length === 0 && (
          <p className="col-span-full text-sm text-gray-400 py-6 text-center">
            Nenhuma culinária cadastrada no sistema ainda.
          </p>
        )}
      </div>
    </div>
  );
}
