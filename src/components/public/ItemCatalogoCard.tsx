'use client'

import Image from 'next/image'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'
import { Texto, TextoInterface } from './TraducaoCardapio'
import ItemClicavel, { PararPropagacaoClique } from './ItemClicavel'
import BotaoAdicionarCarrinho from '@/modules/pedidos/customer/BotaoAdicionarCarrinho'
import { resolverVariacoes, resolverGrupos, alergenosDoItem, fmtPrecoCardapio, type ItemCardapioBruto } from '@/lib/resolverItemCardapio'

/**
 * Um card do Modelo Catálogo (grid) — extraído de cardapio/[slug]/page.tsx
 * pra ser reaproveitado tanto na renderização "eager" de sempre (todas as
 * categorias já montadas de uma vez) quanto na renderização "lazy" das
 * faixas expansíveis (FaixasCategorias.tsx, que busca os itens de uma
 * categoria só quando ela é aberta) — mesmo card nos dois casos, muda só
 * de onde o `item` vem.
 */
export default function ItemCatalogoCard({
  item,
  corP,
  corT,
  corS,
  corBd,
  cardRaio,
  mostrarAlergenos,
  cliqueExpandeAtivado,
  carrinhoAtivado,
}: {
  item: ItemCardapioBruto
  corP: string
  corT: string
  corS: string
  corBd: string
  cardRaio: string
  mostrarAlergenos: boolean
  cliqueExpandeAtivado: boolean
  carrinhoAtivado: boolean
}) {
  const foto = getOptimizedCloudinaryUrl(item.foto_url, 300, 300, 'fill')
  const algArr = alergenosDoItem(item)
  const promoOk = item.promo_status === 'active' && item.preco_promocional != null
  const precoPromocional = item.preco_promocional ?? item.preco
  const pct = promoOk ? Math.round((1 - precoPromocional / item.preco) * 100) : 0
  const variacoes = item.variacoes_item || []
  const temVariacoes = variacoes.length > 0
  // "a partir de" só usa o campo Preço* quando ele foi preenchido de
  // propósito pra isso (rótulo do próprio editor); sem preço-base, não
  // tem "a partir de" que fazer sentido, cai pro menor preço entre os
  // tamanhos.
  const precoBaseValido = item.preco > 0
  const menorPrecoVariacao = temVariacoes ? Math.min(...variacoes.map((v) => v.preco)) : null

  return (
    <div
      className="overflow-hidden shadow-sm transition hover:scale-105 hover:shadow-lg"
      style={{ backgroundColor: corS, border: `1px solid ${corBd}`, borderRadius: cardRaio }}
    >
      <ItemClicavel
        ativado={cliqueExpandeAtivado}
        id={item.id}
        nome={item.nome}
        descricao={item.descricao}
        fotoUrl={item.foto_url}
        preco={item.preco}
        precoPromocional={promoOk ? item.preco_promocional : null}
        alergenos={algArr}
        mostrarAlergenos={mostrarAlergenos}
        corP={corP} corT={corT} corS={corS} corBd={corBd}
        carrinhoAtivado={carrinhoAtivado}
        variacoes={resolverVariacoes(item)}
        grupos={resolverGrupos(item)}
      >
        {/* FOTO — altura fixa, cortada pra preencher */}
        <div className="relative h-32 bg-gray-100">
          {foto ? (
            <Image src={foto} alt={item.nome} fill
              className="object-cover" sizes="(max-width: 640px) 50vw, 25vw" unoptimized loading="lazy" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
          )}
          {pct > 0 && (
            <span className="absolute top-1 left-1 text-white text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: corP }}>-{pct}%</span>
          )}
        </div>

        {/* NOME + DESCRIÇÃO — centralizados */}
        <div className="p-3 text-center">
          <h3 className="font-semibold text-sm" style={{ color: corT }}>
            <Texto tipo="item" id={item.id} campo="nome">{item.nome}</Texto>
          </h3>
          {item.descricao && (
            <p className="text-xs opacity-60 mt-1 line-clamp-2" style={{ color: corT }}>
              <Texto tipo="item" id={item.id} campo="descricao">{item.descricao}</Texto>
            </p>
          )}

          {/* PREÇO — etiqueta/pill, não só texto */}
          {promoOk && (
            <p className="text-xs text-gray-400 line-through mt-2">R$ {fmtPrecoCardapio(item.preco)}</p>
          )}
          <div className={`inline-block rounded-full px-3 py-1 text-sm font-bold text-white ${promoOk ? 'mt-1' : 'mt-2'}`}
            style={{ backgroundColor: corP }}>
            {temVariacoes && precoBaseValido && <span className="mr-1 text-[10px] font-normal opacity-80"><TextoInterface chave="a_partir_de">a partir de</TextoInterface></span>}
            R$ {fmtPrecoCardapio(
              temVariacoes
                ? (precoBaseValido ? item.preco : menorPrecoVariacao!)
                : (promoOk ? precoPromocional : item.preco)
            )}
          </div>
        </div>
      </ItemClicavel>

      {/* Botão de comprar — fora do wrapper clicável, não abre o painel.
          Item com variação/complemento abre o seletor em vez de adicionar
          direto — ver BotaoAdicionarCarrinho. Só aparece com o carrinho
          ativado em Configurações → Recursos do cardápio; desligado, o
          cardápio fica só informativo. */}
      {carrinhoAtivado && (
        <PararPropagacaoClique className="px-3 pb-3 flex justify-center">
          <BotaoAdicionarCarrinho
            id={item.id}
            nome={item.nome}
            preco={item.preco}
            precoPromocional={promoOk ? item.preco_promocional : null}
            corDestaque={corP}
            variacoes={resolverVariacoes(item)}
            grupos={resolverGrupos(item)}
          />
        </PararPropagacaoClique>
      )}
    </div>
  )
}
