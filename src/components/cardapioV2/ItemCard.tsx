import Image from 'next/image'
import { getCloudflareImageUrl } from '@/lib/cloudflareImage'
import { resolverEstadoExibicao } from '@/modules/cardapioV2/regrasExibicao'
import { precoPorCanal } from '@/modules/cardapioV2/publicoRepository'
import { variacoesParaCarrinho, gruposParaCarrinho } from '@/modules/cardapioV2/carrinhoAdapter'
import type {
  CanalCardapioV2,
  CardapioV2Alergeno,
  CardapioV2Cardapio,
  CardapioV2GrupoComplementoResolvido,
  CardapioV2ItemCompleto,
} from '@/modules/cardapioV2/types'
import BotaoAdicionarCarrinho from '@/modules/pedidos/customer/BotaoAdicionarCarrinho'
import PrecoComVariacao from './PrecoComVariacao'
import SelosAlergeno from './SelosAlergeno'

const CLASSES_POR_POSICAO = {
  left: 'flex-row',
  right: 'flex-row-reverse',
  top: 'flex-col',
  none: '',
} as const

export default function ItemCard({
  item,
  canal,
  alergenos,
  cardapio,
  agora,
  gruposComplemento,
  carrinhoAtivo = false,
}: {
  item: CardapioV2ItemCompleto
  canal: CanalCardapioV2
  alergenos: CardapioV2Alergeno[]
  cardapio: CardapioV2Cardapio
  agora: Date
  // Só precisa vir preenchido quando carrinhoAtivo — a página de exibição
  // só-leitura (sem canal=delivery) não passa nada disso.
  gruposComplemento?: CardapioV2GrupoComplementoResolvido[]
  carrinhoAtivo?: boolean
}) {
  const estado = resolverEstadoExibicao(item.regras, agora)
  if (!estado.disponivel) return null

  // Catálogo: card vertical, foto sempre em cima (independe da posição
  // configurada, que só se aplica ao formato Lista — ver AparenciaEditor.tsx).
  const catalogo = cardapio.formato_exibicao === 'catalogo'
  const posicao = catalogo ? 'top' : cardapio.foto_item_posicao
  const temFoto = posicao !== 'none' && !!item.foto_url
  // Miniatura já vem redimensionada pela Cloudflare Image Transformations
  // (ver README.md) — 2x a largura exibida, pra ficar nítido em tela
  // retina sem baixar o arquivo original inteiro em cada card. Esquerda/
  // direita fica em 80px (h-20/w-20) — intermediário entre o V1 (96px) e o
  // que o V2 tinha antes (64px).
  const fotoGrande = catalogo || posicao === 'top'
  const fotoUrl = getCloudflareImageUrl(item.foto_url, { width: fotoGrande ? 800 : 160, height: fotoGrande ? 800 : 160 })

  return (
    <div className={`group flex gap-3 rounded-xl border border-neutral-200 bg-white p-3 ${catalogo ? 'flex-col' : CLASSES_POR_POSICAO[posicao]}`}>
      {temFoto && (
        <div
          className={`relative shrink-0 overflow-hidden rounded-lg bg-neutral-100 ${
            catalogo ? 'aspect-square w-full' : posicao === 'top' ? 'h-32 w-full' : 'h-20 w-20'
          }`}
        >
          <Image
            src={fotoUrl!}
            alt={item.nome}
            fill
            className="object-cover transition duration-300 group-hover:scale-105 group-active:scale-105"
            sizes={fotoGrande ? '100vw' : '80px'}
            unoptimized
          />
        </div>
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold text-neutral-900">
            {item.nome}
            {estado.destaque && (
              <span
                className="ml-1.5 rounded px-1.5 py-0.5 text-[10px] font-medium"
                style={{ backgroundColor: `${cardapio.cor_primaria}20`, color: cardapio.cor_primaria }}
              >
                Destaque
              </span>
            )}
          </h3>
        </div>
        {item.descricao && <p className="mt-0.5 text-xs text-neutral-500">{item.descricao}</p>}
        {cardapio.info_nutricional_ativado && item.observacao_nutricional && (
          <p className="mt-0.5 text-[11px] italic text-neutral-400">{item.observacao_nutricional}</p>
        )}
        <div className="mt-1.5 flex items-center justify-between gap-2">
          <PrecoComVariacao item={item} canal={canal} precoPromocional={estado.precoPromocional} />
          {carrinhoAtivo && (
            <BotaoAdicionarCarrinho
              id={item.id}
              nome={item.nome}
              preco={precoPorCanal(item.preco_base, item.precos_canal, canal)}
              precoPromocional={estado.precoPromocional}
              corDestaque={cardapio.cor_primaria}
              variacoes={variacoesParaCarrinho(item)}
              grupos={gruposParaCarrinho(item, gruposComplemento ?? [])}
            />
          )}
        </div>
        {cardapio.alergenos_ativado && <SelosAlergeno alergenoIds={item.alergeno_ids} alergenos={alergenos} />}
        {cardapio.tags_ativado && item.tags.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] text-emerald-700">
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
