'use client'

import Image from 'next/image'
import { getOptimizedCloudinaryUrl } from '@/lib/cloudinary'
import { Texto, TextoInterface } from './TraducaoCardapio'
import ItemClicavel, { PararPropagacaoClique } from './ItemClicavel'
import BotaoAdicionarCarrinho from '@/modules/pedidos/customer/BotaoAdicionarCarrinho'
import { resolverVariacoes, resolverGrupos, alergenosDoItem, fmtPrecoCardapio, fotoLayout, type ItemCardapioBruto } from '@/lib/resolverItemCardapio'

/**
 * Uma linha do Modelo Lista — extraído de cardapio/[slug]/page.tsx pra ser
 * reaproveitado tanto na renderização "eager" de sempre quanto na "lazy"
 * das faixas expansíveis (FaixasCategorias.tsx). Ver ItemCatalogoCard.tsx
 * pro equivalente do Modelo Catálogo.
 */
export default function ItemListaLinha({
  item,
  corP,
  corT,
  corS,
  corBd,
  mostrarCodigo,
  mostrarAlergenos,
  fotoPosicao,
  cliqueExpandeAtivado,
  carrinhoAtivado,
}: {
  item: ItemCardapioBruto
  corP: string
  corT: string
  corS: string
  corBd: string
  mostrarCodigo: boolean
  mostrarAlergenos: boolean
  fotoPosicao: 'left' | 'right' | 'top' | 'none'
  cliqueExpandeAtivado: boolean
  carrinhoAtivado: boolean
}) {
  const fl = fotoLayout(fotoPosicao)
  // Pede ao Cloudinary já no formato exibido (16:9 pra foto acima,
  // quadrado pros outros) — antes pedia sempre quadrado e o CSS cortava
  // de novo por cima pra caber na caixa larga da posição "acima",
  // cortando a foto duas vezes (uma no Cloudinary, outra no object-cover).
  const foto = fotoPosicao === 'top'
    ? getOptimizedCloudinaryUrl(item.foto_url, 400, 225, 'fill')
    : getOptimizedCloudinaryUrl(item.foto_url, 200, 200, 'fill')
  const algArr = alergenosDoItem(item)
  const promoOk = item.promo_status === 'active' && item.preco_promocional != null
  const precoPromocional = item.preco_promocional ?? item.preco
  const variacoes = item.variacoes_item || []
  const temVariacoes = variacoes.length > 0
  // "a partir de" só usa o campo Preço* quando ele foi preenchido de
  // propósito pra isso (rótulo do próprio editor); sem preço-base, mostra
  // a lista de tamanhos com cada preço, como já era antes do carrinho.
  const precoBaseValido = item.preco > 0

  return (
    <div className="p-4 group hover:bg-black/[.02] transition">
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
        <div className={`flex ${fl.flex} gap-4 items-start`}>

          {/* FOTO */}
          {fotoPosicao !== 'none' && foto && (
            <div className={`${fl.sz} relative flex-shrink-0 rounded-xl overflow-hidden bg-gray-100`}>
              <Image src={foto} alt={item.nome} fill
                className="object-cover group-hover:scale-105 transition duration-300"
                sizes={fl.sizes} unoptimized loading="lazy" />
            </div>
          )}

          {/* CONTEÚDO */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">

              {/* Nome + badges */}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  {mostrarCodigo && item.codigo && (
                    <span className="font-mono text-xs px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${corP}18`, color: corP }}>
                      #{item.codigo}
                    </span>
                  )}
                  <h3 className="font-semibold text-sm" style={{ color: corT }}>
                    <Texto tipo="item" id={item.id} campo="nome">{item.nome}</Texto>
                  </h3>
                  {promoOk && (
                    <span className="text-xs px-2 py-0.5 rounded-full font-medium text-white"
                      style={{ backgroundColor: corP }}>
                      🔥 <TextoInterface chave="promocao_badge">Promoção</TextoInterface>
                    </span>
                  )}
                  {item.delivery_disponivel && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                      🛵 <TextoInterface chave="delivery_badge">Delivery</TextoInterface>
                    </span>
                  )}
                </div>
                {item.descricao && (
                  <p className="text-xs leading-relaxed opacity-70" style={{ color: corT }}>
                    <Texto tipo="item" id={item.id} campo="descricao">{item.descricao}</Texto>
                  </p>
                )}
                {/* GRUPOS DE COMPLEMENTOS — prévia do que existe, na própria
                    linha do item (borda + fundo levemente colorido, separada
                    da descrição). A escolha de verdade (com validação de
                    mín./máx.) acontece no seletor aberto pelo botão de
                    adicionar, não aqui. */}
                {item.item_grupo_complemento && item.item_grupo_complemento.length > 0 && (
                  <div className="mt-2 space-y-1.5">
                    {[...item.item_grupo_complemento]
                      .sort((a: { ordem: number }, b: { ordem: number }) => a.ordem - b.ordem)
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      .filter((v: any) => v.grupos_complementos)
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      .map((v: any) => {
                        const g = v.grupos_complementos
                        return (
                          <div key={g.id} className="rounded-lg px-2.5 py-1.5"
                            style={{ backgroundColor: `${corP}0d`, border: `1px solid ${corBd}` }}>
                            <p className="text-[11px] font-semibold" style={{ color: corT }}>
                              {g.nome}
                              <span className="font-normal opacity-60">
                                {' — '}
                                {g.selecao_minima > 0 ? (
                                  g.selecao_minima === g.selecao_maxima ? (
                                    <TextoInterface chave="grupo_escolha_obrigatorio" vars={{ min: g.selecao_minima }}>
                                      {'escolha {min} · obrigatório'}
                                    </TextoInterface>
                                  ) : (
                                    <TextoInterface chave="grupo_escolha_intervalo_obrigatorio" vars={{ min: g.selecao_minima, max: g.selecao_maxima }}>
                                      {'escolha {min} a {max} · obrigatório'}
                                    </TextoInterface>
                                  )
                                ) : (
                                  <TextoInterface chave="grupo_opcional_ate" vars={{ max: g.selecao_maxima }}>
                                    {'opcional · até {max}'}
                                  </TextoInterface>
                                )}
                              </span>
                            </p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {(g.opcoes_complemento || [])
                                .sort((a: { ordem: number }, b: { ordem: number }) => a.ordem - b.ordem)
                                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                                .map((o: any) => {
                                  const nomeOpcao = o.itens_cardapio?.nome || '(item removido)'
                                  // exibir_preco = false força esconder o valor mesmo que
                                  // preco_adicional seja > 0 — decisão do dono por opção.
                                  const label = o.exibir_preco === false || !(o.preco_adicional > 0)
                                    ? nomeOpcao
                                    : `${nomeOpcao} (+R$ ${fmtPrecoCardapio(o.preco_adicional)})`
                                  return (
                                    <span key={o.id} className="text-[11px] px-1.5 py-0.5 rounded-full"
                                      style={{ backgroundColor: corS, border: `1px solid ${corBd}`, color: corT }}>
                                      {label}
                                    </span>
                                  )
                                })}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                )}
                {/* ALÉRGENOS */}
                {mostrarAlergenos && algArr.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {algArr.map((a) => (
                      <span key={a.id}
                        className="flex items-center gap-0.5 text-xs px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fde68a' }}
                        title={`Alérgeno: ${a.nome}`}>
                        {a.icone && <span>{a.icone}</span>}
                        {a.nome}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* PREÇO */}
              <div className="text-right flex-shrink-0">
                {temVariacoes && !precoBaseValido ? (
                  // Sem Preço* preenchido, mostra a lista de tamanhos com
                  // cada preço em vez de um "a partir de" sem base real.
                  <div className="space-y-0.5">
                    {[...variacoes]
                      .sort((a, b) => a.preco - b.preco)
                      .map((v) => (
                        <div key={v.id} className="flex items-baseline justify-end gap-2 text-xs">
                          <span className="opacity-60" style={{ color: corT }}>{v.nome}</span>
                          <span className="font-bold text-sm" style={{ color: corP }}>R$ {fmtPrecoCardapio(v.preco)}</span>
                        </div>
                      ))}
                  </div>
                ) : (
                  <>
                    {temVariacoes ? (
                      <div className="text-xs opacity-60" style={{ color: corT }}><TextoInterface chave="a_partir_de">a partir de</TextoInterface></div>
                    ) : (
                      promoOk && (
                        <div className="text-xs text-gray-400 line-through">
                          R$ {fmtPrecoCardapio(item.preco)}
                        </div>
                      )
                    )}
                    <div className="text-base font-bold" style={{ color: corP }}>
                      R$ {fmtPrecoCardapio(temVariacoes ? item.preco : (promoOk ? precoPromocional : item.preco))}
                    </div>
                  </>
                )}
                {/* stopPropagation — clicar em "adicionar" não deve também
                    abrir o painel do ItemClicavel que embrulha a linha toda.
                    Item com variação/complemento abre o seletor em vez de
                    adicionar direto — ver BotaoAdicionarCarrinho. Só aparece
                    com o carrinho ativado em Configurações → Recursos do
                    cardápio. */}
                {carrinhoAtivado && (
                  <PararPropagacaoClique>
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
            </div>
          </div>
        </div>
      </ItemClicavel>
    </div>
  )
}
