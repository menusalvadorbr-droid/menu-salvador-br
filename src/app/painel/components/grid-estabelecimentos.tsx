'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import EstabelecimentoCard from '../estabelecimento-card';

interface Estabelecimento {
  id: string;
  slug: string;
  nome_fantasia: string;
  bairro: string;
  foto_capa: string | null;
  logo_url: string | null;
  destaque: boolean;
  tipos_cozinha: { id: string; nome: string; icone: string }[];
}

interface Props {
  estabelecimentos: Estabelecimento[];
  bairros: string[];
  tiposCozinha: { id: string; nome: string; icone: string }[];
}

export default function EstabelecimentosClient({ estabelecimentos, bairros, tiposCozinha }: Props) {
  const t = useTranslations('home');
  const [filtroBairro, setFiltroBairro] = useState('');
  const [filtroTipo, setFiltroTipo] = useState('');
  const [busca, setBusca] = useState('');

  const filtrados = useMemo(() => {
    return estabelecimentos.filter((est) => {
      if (filtroBairro && est.bairro !== filtroBairro) return false;
      if (
        filtroTipo &&
        !est.tipos_cozinha.some((t) => t.id === filtroTipo)
      )
        return false;
      if (
        busca &&
        !est.nome_fantasia.toLowerCase().includes(busca.toLowerCase())
      )
        return false;
      return true;
    });
  }, [estabelecimentos, filtroBairro, filtroTipo, busca]);

  return (
    <section className="container mx-auto px-4 py-10">
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <select
          className="p-2 border rounded"
          value={filtroBairro}
          onChange={(e) => setFiltroBairro(e.target.value)}
        >
          <option value="">{t('filterBairro')}</option>
          {bairros.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <select
          className="p-2 border rounded"
          value={filtroTipo}
          onChange={(e) => setFiltroTipo(e.target.value)}
        >
          <option value="">{t('filterTipo')}</option>
          {tiposCozinha.map((tc) => (
            <option key={tc.id} value={tc.id}>{tc.icone} {tc.nome}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          className="p-2 border rounded flex-1"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {filtrados.length === 0 ? (
        <p className="text-center text-gray-500">{t('noResults')}</p>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtrados.map((est) => (
            <EstabelecimentoCard key={est.id} estabelecimento={est} />
          ))}
        </div>
      )}
    </section>
  );
}