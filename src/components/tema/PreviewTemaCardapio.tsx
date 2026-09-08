'use client'

import { obterFonteTema } from '@/lib/fontesTema'
import { gradienteHeroImagem } from '@/lib/temaHero'
import { TraducaoProvider } from '@/components/public/TraducaoCardapio'
import CardapioHero from '@/components/public/CardapioHero'

export interface ConfigTemaPreview {
  cor_primaria: string
  cor_secundaria: string
  cor_fundo: string
  cor_texto: string
  cor_borda: string
  fonte: string
  hero_modo: 'cor' | 'imagem'
  hero_imagem_url: string | null
  hero_veu_opacidade: number
  card_raio: number
}

// Reaproveitado tanto aqui quanto no editor do admin (GerenciarTemas) e
// na área do dono (TemaEditor) — um só lugar de verdade pros valores
// padrão, pra não desviar entre os três.
export const CONFIG_TEMA_PADRAO: ConfigTemaPreview = {
  cor_primaria: '#f97316',
  cor_secundaria: '#ffffff',
  cor_fundo: '#f9fafb',
  cor_texto: '#1f2937',
  cor_borda: '#e5e7eb',
  fonte: 'Inter',
  hero_modo: 'cor',
  hero_imagem_url: null,
  hero_veu_opacidade: 50,
  card_raio: 16,
}

const ITENS_PREVIEW = [
  {
    id: '1',
    nome: 'Salmão Grelhado',
    descricao: 'Salmão grelhado com legumes salteados e molho de ervas.',
    preco: 45.0,
    foto_url: 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=200&auto=format&fit=crop',
  },
  {
    id: '2',
    nome: 'Mousse de Feta',
    descricao: 'Mousse leve de queijo feta com mel e nozes.',
    preco: 34.0,
    foto_url: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=200&auto=format&fit=crop',
  },
]

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/**
 * Mockup de cardápio reagindo ao vivo aos controles do editor de tema —
 * mesma ideia de preview já usada em TemaEditor.tsx (dono do
 * estabelecimento escolhendo tema), mas com os campos novos que só o
 * tema em si controla: fonte, fundo do hero (cor ou imagem + véu) e
 * arredondamento dos cards.
 */
export default function PreviewTemaCardapio({
  config,
  titulo = 'Cardápio',
}: {
  config: ConfigTemaPreview
  titulo?: string
}) {
  const corP = config.cor_primaria
  const corS = config.cor_secundaria
  const corF = config.cor_fundo
  const corT = config.cor_texto
  const corBd = config.cor_borda
  const fonte = obterFonteTema(config.fonte)
  const heroComImagem = config.hero_modo === 'imagem' && !!config.hero_imagem_url
  const raio = `${config.card_raio}px`

  return (
    // TraducaoProvider só pra satisfazer o contrato do CardapioHero
    // (TextoInterface/SeletorIdioma) — sem idiomas ativos, idioma fica
    // travado em 'pt' e o seletor nem aparece, então nada muda visualmente
    // aqui, só evita o "useTraducao precisa estar dentro de..." em runtime.
    <TraducaoProvider slug="preview-tema" idiomasAtivos={[]} traducoes={[]}>
      <div
        className={`mx-auto max-w-sm overflow-hidden rounded-2xl p-3 ${fonte.className}`}
        style={{ backgroundColor: corF, color: corT }}
      >
        {/* Mesma estrutura do cabeçalho real (/cardapio/[slug]/page.tsx):
            card corS+borda envolvendo o CardapioHero — literalmente o mesmo
            componente, pra não haver mais divergência entre o que o dono vê
            aqui e o que sai no cardápio de verdade (ver comentário em
            CardapioHero.tsx). */}
        <div className="overflow-hidden rounded-2xl shadow" style={{ backgroundColor: corS, border: `1px solid ${corBd}` }}>
          <CardapioHero
            corPrimaria={corP}
            heroComImagem={heroComImagem}
            heroGradiente={gradienteHeroImagem(corF, config.hero_veu_opacidade)}
            heroImagemUrl={config.hero_imagem_url}
            titulo={`🍽️ ${titulo}`}
            bairro="Barra"
            culinaria="Contemporânea"
            totalItens={ITENS_PREVIEW.length}
            totalCategorias={1}
          />
        </div>

        {/* ITENS */}
        <div className="mt-3 space-y-3">
          {ITENS_PREVIEW.map((item) => (
            <div
              key={item.id}
              className="flex gap-3 overflow-hidden p-3 shadow-sm"
              style={{ backgroundColor: corS, border: `1px solid ${corBd}`, borderRadius: raio }}
            >
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden bg-gray-100" style={{ borderRadius: raio }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.foto_url} alt={item.nome} className="h-full w-full object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold" style={{ color: corT }}>{item.nome}</p>
                  <p className="flex-shrink-0 text-sm font-bold" style={{ color: corP }}>R$ {fmt(item.preco)}</p>
                </div>
                <p className="mt-0.5 line-clamp-2 text-xs opacity-60">{item.descricao}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </TraducaoProvider>
  )
}
