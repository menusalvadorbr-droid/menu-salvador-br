import Image from 'next/image'
import { TextoInterface, SeletorIdioma } from './TraducaoCardapio'

export interface CardapioHeroProps {
  corPrimaria: string
  heroComImagem: boolean
  heroGradiente: string
  heroImagemUrl?: string | null
  logoUrl?: string | null
  titulo: string
  bairro?: string | null
  // Já resolvido pelo chamador (join da lista de tipos de cozinha) — cai no
  // texto padrão traduzível quando vazio.
  culinaria?: string
  totalItens: number
  totalCategorias: number
  endereco?: string | null
  numero?: string | null
  idiomasAtivos?: string[]
}

/**
 * Bloco de identidade do topo do cardápio (logo, título, endereço) — com
 * fundo em cor sólida (padrão) ou foto + véu configurados no tema.
 *
 * Extraído de /cardapio/[slug]/page.tsx pra ser o MESMO componente usado no
 * preview do editor de tema (PreviewTemaCardapio → TemaEditor,
 * GerenciarTemas). Antes o preview reimplementava esse bloco com layout
 * diferente (título centralizado numa caixa de altura fixa) enquanto o
 * real ancora título/logo no topo numa caixa de altura variável — como o
 * véu (gradienteHeroImagem) é um degradê que protege mais embaixo do que
 * em cima, o mesmo véu podia parecer legível no preview (texto no meio,
 * mais protegido) e sair ilegível no cardápio de verdade (texto no topo,
 * quase sem véu ali). Usar o componente de verdade nos dois lugares elimina
 * essa divergência de uma vez, em vez de manter dois desenhos que podem
 * derivar de novo no futuro.
 */
export default function CardapioHero({
  corPrimaria,
  heroComImagem,
  heroGradiente,
  heroImagemUrl,
  logoUrl,
  titulo,
  bairro,
  culinaria,
  totalItens,
  totalCategorias,
  endereco,
  numero,
  idiomasAtivos = [],
}: CardapioHeroProps) {
  return (
    <div
      className="p-5"
      style={
        heroComImagem
          ? {
              backgroundImage: `${heroGradiente}, url(${heroImagemUrl})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: '#ffffff',
            }
          : undefined
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          {logoUrl && (
            <div
              className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-full border-2"
              style={{ borderColor: heroComImagem ? '#ffffff' : corPrimaria }}
            >
              <Image src={logoUrl} alt={titulo} fill className="object-cover" sizes="56px" unoptimized priority />
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold" style={{ color: heroComImagem ? '#ffffff' : corPrimaria }}>
              {titulo}
            </h1>
            <p className="text-sm opacity-70">
              {bairro}
              {' · '}
              {culinaria || <TextoInterface chave="culinaria_variada">Culinária variada</TextoInterface>}
            </p>
            <p className="mt-0.5 text-xs opacity-50">
              {totalItens} <TextoInterface chave="itens_label">itens</TextoInterface> · {totalCategorias}{' '}
              <TextoInterface chave="categorias_label">categorias</TextoInterface>
            </p>
            {endereco && <p className="mt-1 text-xs opacity-60">📍 {[endereco, numero].filter(Boolean).join(', ')}</p>}
          </div>
        </div>
        <SeletorIdioma idiomasAtivos={idiomasAtivos} />
      </div>
    </div>
  )
}
