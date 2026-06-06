// src/app/admin/planos/teste/page.tsx
'use client';

import { useState } from 'react';

// Listas pré-definidas para demonstração
const TEMAS_DISPONIVEIS = [
  { slug: 'raiz-brasileira', nome: 'Raiz Brasileira' },
  { slug: 'escuro', nome: 'Escuro' },
  { slug: 'claro', nome: 'Claro' },
  { slug: 'tropical', nome: 'Tropical' },
];

const MODELOS_QR = [
  { slug: 'classico', nome: 'Clássico' },
  { slug: 'moderno', nome: 'Moderno' },
  { slug: 'redondo', nome: 'Redondo' },
  { slug: 'neon', nome: 'Neon' },
];

const RECURSOS = [
  { slug: 'delivery', nome: 'Delivery' },
  { slug: 'reservas', nome: 'Reservas Online' },
  { slug: 'fidelidade', nome: 'Programa de Fidelidade' },
  { slug: 'cupons', nome: 'Cupons de Desconto' },
];

const IDIOMAS = [
  { cod: 'pt', nome: 'Português' },
  { cod: 'en', nome: 'Inglês' },
  { cod: 'fr', nome: 'Francês' },
];

export default function TestPlanPage() {
  // Estado do plano simulado
  const [plano, setPlano] = useState({
    limiteItens: 15,
    limiteGaleria: 1,
    permiteFotosItens: true,
    recursosPermitidos: ['delivery'],
    idiomasPermitidos: ['pt'],
    temasPermitidos: ['raiz-brasileira'],
    modelosQRPermitidos: ['classico'],
  });

  // Atualizadores
  const toggleRecurso = (slug: string) => {
    setPlano(prev => ({
      ...prev,
      recursosPermitidos: prev.recursosPermitidos.includes(slug)
        ? prev.recursosPermitidos.filter(r => r !== slug)
        : [...prev.recursosPermitidos, slug],
    }));
  };

  const toggleIdioma = (cod: string) => {
    setPlano(prev => ({
      ...prev,
      idiomasPermitidos: prev.idiomasPermitidos.includes(cod)
        ? prev.idiomasPermitidos.filter(i => i !== cod)
        : [...prev.idiomasPermitidos, cod],
    }));
  };

  const toggleTema = (slug: string) => {
    setPlano(prev => ({
      ...prev,
      temasPermitidos: prev.temasPermitidos.includes(slug)
        ? prev.temasPermitidos.filter(t => t !== slug)
        : [...prev.temasPermitidos, slug],
    }));
  };

  const toggleModeloQR = (slug: string) => {
    setPlano(prev => ({
      ...prev,
      modelosQRPermitidos: prev.modelosQRPermitidos.includes(slug)
        ? prev.modelosQRPermitidos.filter(m => m !== slug)
        : [...prev.modelosQRPermitidos, slug],
    }));
  };

  // Verificações úteis
  const deliveryAtivo = plano.recursosPermitidos.includes('delivery');
  const temMultiIdiomas = plano.idiomasPermitidos.length > 1;
  const podeGaleria = plano.limiteGaleria > 0;

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <h1 className="text-3xl font-bold">🧪 Simulador de Funcionalidades por Plano</h1>
      <p className="text-gray-600">
        Ajuste os parâmetros abaixo para simular um plano e veja como as restrições afetariam o painel do dono e o menu público.
      </p>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Formulário de configuração do plano */}
        <div className="bg-white rounded-xl shadow p-6 space-y-6">
          <h2 className="text-xl font-semibold">⚙️ Configurações do Plano</h2>

          {/* Limite de itens */}
          <div>
            <label className="block font-medium">Limite de itens no cardápio</label>
            <input
              type="number"
              value={plano.limiteItens}
              onChange={(e) => setPlano({ ...plano, limiteItens: parseInt(e.target.value) || 0 })}
              className="w-full border rounded px-3 py-2 mt-1"
            />
            <p className="text-xs text-gray-500">0 = ilimitado</p>
          </div>

          {/* Limite de galeria */}
          <div>
            <label className="block font-medium">Limite de imagens na galeria</label>
            <input
              type="number"
              value={plano.limiteGaleria}
              onChange={(e) => setPlano({ ...plano, limiteGaleria: parseInt(e.target.value) || 0 })}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>

          {/* Permitir fotos nos itens */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={plano.permiteFotosItens}
              onChange={(e) => setPlano({ ...plano, permiteFotosItens: e.target.checked })}
            />
            <span>Permitir fotos nos itens do cardápio</span>
          </label>

          {/* Recursos (delivery, reservas, etc.) */}
          <fieldset className="border p-4 rounded-lg">
            <legend className="font-medium">Recursos disponíveis</legend>
            <div className="space-y-2">
              {RECURSOS.map(r => (
                <label key={r.slug} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={plano.recursosPermitidos.includes(r.slug)}
                    onChange={() => toggleRecurso(r.slug)}
                  />
                  {r.nome}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Idiomas */}
          <fieldset className="border p-4 rounded-lg">
            <legend className="font-medium">Idiomas permitidos</legend>
            <div className="flex gap-4">
              {IDIOMAS.map(idioma => (
                <label key={idioma.cod} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={plano.idiomasPermitidos.includes(idioma.cod)}
                    onChange={() => toggleIdioma(idioma.cod)}
                  />
                  {idioma.nome}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Temas */}
          <fieldset className="border p-4 rounded-lg">
            <legend className="font-medium">Temas permitidos</legend>
            <div className="grid grid-cols-2 gap-2">
              {TEMAS_DISPONIVEIS.map(tema => (
                <label key={tema.slug} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={plano.temasPermitidos.includes(tema.slug)}
                    onChange={() => toggleTema(tema.slug)}
                  />
                  {tema.nome}
                </label>
              ))}
            </div>
          </fieldset>

          {/* Modelos QR Code */}
          <fieldset className="border p-4 rounded-lg">
            <legend className="font-medium">Modelos de QR Code permitidos</legend>
            <div className="grid grid-cols-2 gap-2">
              {MODELOS_QR.map(modelo => (
                <label key={modelo.slug} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={plano.modelosQRPermitidos.includes(modelo.slug)}
                    onChange={() => toggleModeloQR(modelo.slug)}
                  />
                  {modelo.nome}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Preview das restrições no painel do dono */}
        <div className="bg-gray-50 rounded-xl shadow p-6 space-y-6">
          <h2 className="text-xl font-semibold">📋 Preview: Como o dono enxerga</h2>

          {/* Cardápio */}
          <div className="border-b pb-4">
            <h3 className="font-bold">Meu Cardápio</h3>
            <p className="text-sm text-gray-600">Limite de itens: {plano.limiteItens === 0 ? 'Ilimitado' : plano.limiteItens}</p>
            {!plano.permiteFotosItens && (
              <p className="text-xs text-red-500">🔒 Upload de fotos bloqueado – apenas layout sem foto disponível</p>
            )}
            {temMultiIdiomas && (
              <p className="text-xs text-green-600">✅ Traduções disponíveis para: {plano.idiomasPermitidos.filter(i => i !== 'pt').join(', ')}</p>
            )}
          </div>

          {/* Galeria */}
          <div className="border-b pb-4">
            <h3 className="font-bold">Galeria de fotos</h3>
            <p>Limite: {plano.limiteGaleria === 0 ? 'nenhuma imagem' : `${plano.limiteGaleria} imagens`}</p>
            {!podeGaleria && <p className="text-xs text-red-500">🔒 Upgrade necessário para adicionar fotos à galeria</p>}
          </div>

          {/* Delivery */}
          <div className="border-b pb-4">
            <h3 className="font-bold">Delivery</h3>
            {deliveryAtivo ? (
              <p className="text-green-600">✅ Ativo – botões de adicionar aparecem no menu digital</p>
            ) : (
              <p className="text-red-600">❌ Indisponível neste plano</p>
            )}
          </div>

          {/* Temas e QR Code */}
          <div className="border-b pb-4">
            <h3 className="font-bold">Personalização</h3>
            <p>Temas disponíveis: {plano.temasPermitidos.length}</p>
            <p>Modelos QR: {plano.modelosQRPermitidos.length}</p>
          </div>

          {/* Resumo JSON (opcional) */}
          <details>
            <summary className="cursor-pointer text-sm text-gray-500">Ver configuração completa</summary>
            <pre className="text-xs bg-gray-200 p-2 rounded mt-2 overflow-auto">
              {JSON.stringify(plano, null, 2)}
            </pre>
          </details>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 Esta página serve apenas para teste. As configurações definidas aqui <strong>não</strong> são salvas no banco de dados. 
          Integre a lógica de verificação de permissões no painel do dono e no menu público usando os valores reais do plano.
        </p>
      </div>
    </div>
  );
}