"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

interface TipoCozinha {
  id: number;
  nome: string;
  icone?: string | null;
}

const MAX_SELECOES = 3;

export default function EditorCulinarias({ estabelecimentoId }: { estabelecimentoId: string }) {
  const supabase = createClient();
  const [tiposCozinha, setTiposCozinha] = useState<TipoCozinha[]>([]);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [aviso, setAviso] = useState<string | null>(null);

  useEffect(() => {
    async function carregar() {
      const { data: todos } = await supabase
        .from("tipos_cozinha")
        .select("id, nome, icone")
        .eq("ativo", true)
        .order("ordem");
      setTiposCozinha(todos || []);

      const { data: atuais } = await supabase
        .from("estabelecimento_tipos_cozinha")
        .select("tipo_cozinha_id")
        .eq("estabelecimento_id", estabelecimentoId);

      setSelecionados((atuais || []).map((c) => c.tipo_cozinha_id));
    }

    carregar();
  }, []);

  async function toggle(tipoCozinhaId: number) {
    const jaSelecionado = selecionados.includes(tipoCozinhaId);

    if (!jaSelecionado && selecionados.length >= MAX_SELECOES) {
      setAviso(`Máximo de ${MAX_SELECOES} tipos de culinária. Remova um antes de adicionar outro.`);
      setTimeout(() => setAviso(null), 2500);
      return;
    }

    const novaLista = jaSelecionado
      ? selecionados.filter((id) => id !== tipoCozinhaId)
      : [...selecionados, tipoCozinhaId];

    setSelecionados(novaLista);
    setAviso(null);

    await supabase.from("estabelecimento_tipos_cozinha").delete().eq("estabelecimento_id", estabelecimentoId);
    await supabase.from("estabelecimento_tipos_cozinha").insert(
      novaLista.map((id) => ({
        estabelecimento_id: estabelecimentoId,
        tipo_cozinha_id: id,
      }))
    );
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-1 text-gray-900">🍜 Tipos de culinária</h3>
      <p className="text-sm text-gray-500 mb-1">
        Selecione até {MAX_SELECOES} tipos de culinária que descrevem seu cardápio. Isso ajuda os clientes a te
        encontrar nas páginas de busca por culinária.
      </p>
      <p className="text-xs text-gray-400 mb-4">
        {selecionados.length}/{MAX_SELECOES} selecionados
      </p>
      {aviso && (
        <p className="mb-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          {aviso}
        </p>
      )}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {tiposCozinha.map((t) => {
          const selecionado = selecionados.includes(t.id);
          const desabilitado = !selecionado && selecionados.length >= MAX_SELECOES;
          return (
            <button
              key={t.id}
              onClick={() => toggle(t.id)}
              disabled={desabilitado}
              className={`p-3 border rounded-xl flex items-center gap-2 text-sm font-medium transition ${
                selecionado
                  ? "border-orange-500 bg-orange-50 text-orange-700"
                  : desabilitado
                  ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed"
                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
              }`}
            >
              {t.icone && <span className="text-xl">{t.icone}</span>}
              <span>{t.nome}</span>
            </button>
          );
        })}
        {tiposCozinha.length === 0 && (
          <p className="col-span-full text-sm text-gray-400 py-6 text-center">
            Nenhum tipo de culinária cadastrado no sistema ainda.
          </p>
        )}
      </div>
    </div>
  );
}

