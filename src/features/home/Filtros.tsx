'use client';

import { useState } from 'react';

const BAIRROS = [
  'Barra', 'Rio Vermelho', 'Pelourinho', 'Itapuã',
  'Pituba', 'Stella Maris', 'Ondina', 'Amaralina',
  'Boca do Rio', 'Caminho das Árvores', 'Comércio'
];

const TIPOS_COZINHA = [
  { value: 'baiana', label: '🥘 Baiana' },
  { value: 'acaraje', label: '🫘 Acarajé' },
  { value: 'italiana', label: '🍝 Italiana' },
  { value: 'japonesa', label: '🍣 Japonesa' },
  { value: 'brasileira', label: '🇧🇷 Brasileira' },
  { value: 'hamburguer', label: '🍔 Hambúrguer' },
  { value: 'contemporanea', label: '🍽️ Contemporânea' }
];

interface FiltrosProps {
  bairro: string;
  tipoCozinha: string;
  onChange: (filtros: { bairro: string; tipoCozinha: string }) => void;
}

export default function Filtros({ bairro, tipoCozinha, onChange }: FiltrosProps) {
  return (
    <div className="bg-white shadow-sm sticky top-0 z-30 border-b">
      <div className="container mx-auto px-4 py-3 flex gap-3 overflow-x-auto">
        <select
          className="border-2 border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:border-orange-300 transition"
          value={bairro}
          onChange={(e) => onChange({ bairro: e.target.value, tipoCozinha })}
        >
          <option value="">📍 Todos os bairros</option>
          {BAIRROS.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>

        <select
          className="border-2 border-gray-200 rounded-full px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:border-orange-300 transition"
          value={tipoCozinha}
          onChange={(e) => onChange({ bairro, tipoCozinha: e.target.value })}
        >
          <option value="">🍳 Todas as cozinhas</option>
          {TIPOS_COZINHA.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>

        {(bairro || tipoCozinha) && (
          <button
            onClick={() => onChange({ bairro: '', tipoCozinha: '' })}
            className="text-sm text-red-500 hover:text-red-700 font-medium whitespace-nowrap"
          >
            ✕ Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}