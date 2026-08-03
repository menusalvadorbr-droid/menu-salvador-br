'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  obterFichaTecnica,
  criarFichaTecnica,
  atualizarFichaTecnica,
  calcularComposicao,
  adicionarItemComposicao,
  removerItemComposicao,
  listarPassos,
  salvarPassos,
  calcularQL,
  calcularCmvPercentual,
  alergenosHerdados,
  listarFichasTecnicas,
  type DadosFichaTecnica,
  type DadosItemComposicao,
} from '../fichaTecnicaRepository'
import { listarInsumos, listarItensCardapioSimples } from '../estoqueRepository'
import { converterParaUnidadeDoInsumo, unidadesCompativeisComInsumo, unidadesDaMesmaFamilia } from '../conversaoUnidade'
import type {
  FichaTecnica,
  Insumo,
  ComposicaoCalculada,
  AlergenoHerdado,
  UnidadeInsumo,
  StatusFichaTecnica,
  TipoItemFicha,
} from '../types'

interface ItemCardapioSimples {
  id: string
  nome: string
  categoria: string
}

const UNIDADES: UnidadeInsumo[] = ['un', 'kg', 'g', 'l', 'ml']

const CABECALHO_VAZIO = {
  nome: '',
  cardapioItemId: '',
  skuPlu: '',
  categoriaVenda: '',
  tempoPreparoMin: '',
  precoVenda: '',
  cmvAlvoPercentual: '30',
  rendimentoQtd: '1',
  rendimentoUnidade: 'un' as UnidadeInsumo,
  status: 'ativa' as StatusFichaTecnica,
}

export default function FichaTecnicaForm({
  estabelecimentoId,
  fichaTecnicaId,
  onVoltar,
}: {
  estabelecimentoId: string
  fichaTecnicaId: string | null
  onVoltar: () => void
}) {
  const [id, setId] = useState<string | null>(fichaTecnicaId)
  const [carregando, setCarregando] = useState(true)
  const [salvandoCabecalho, setSalvandoCabecalho] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const [cabecalho, setCabecalho] = useState(CABECALHO_VAZIO)
  const [itensCardapio, setItensCardapio] = useState<ItemCardapioSimples[]>([])
  const [insumos, setInsumos] = useState<Insumo[]>([])
  const [outrasFichas, setOutrasFichas] = useState<FichaTecnica[]>([])
  const [composicao, setComposicao] = useState<ComposicaoCalculada | null>(null)
  const [passos, setPassos] = useState<string[]>([])
  const [alergenos, setAlergenos] = useState<AlergenoHerdado[]>([])

  const [tipoNovo, setTipoNovo] = useState<TipoItemFicha>('insumo')
  const [insumoIdNovo, setInsumoIdNovo] = useState('')
  const [subFichaIdNovo, setSubFichaIdNovo] = useState('')
  const [qtdBrutaNovo, setQtdBrutaNovo] = useState('')
  const [unidadeNovo, setUnidadeNovo] = useState<UnidadeInsumo>('un')
  const [fatorCorrecaoNovo, setFatorCorrecaoNovo] = useState('1')
  const [enviandoItem, setEnviandoItem] = useState(false)

  const carregarDetalhes = useCallback(
    async (fichaId: string) => {
      const [ficha, comp, listaPassos, listaAlergenos] = await Promise.all([
        obterFichaTecnica(fichaId),
        calcularComposicao(fichaId),
        listarPassos(fichaId),
        alergenosHerdados(fichaId),
      ])
      if (ficha) {
        setCabecalho({
          nome: ficha.nome,
          cardapioItemId: ficha.cardapio_item_id || '',
          skuPlu: ficha.sku_plu || '',
          categoriaVenda: ficha.categoria_venda || '',
          tempoPreparoMin: ficha.tempo_preparo_min != null ? String(ficha.tempo_preparo_min) : '',
          precoVenda: ficha.preco_venda != null ? String(ficha.preco_venda).replace('.', ',') : '',
          cmvAlvoPercentual: String(ficha.cmv_alvo_percentual).replace('.', ','),
          rendimentoQtd: String(ficha.rendimento_qtd).replace('.', ','),
          rendimentoUnidade: ficha.rendimento_unidade,
          status: ficha.status,
        })
      }
      setComposicao(comp)
      setPassos(listaPassos.map((p) => p.descricao))
      setAlergenos(listaAlergenos)
    },
    []
  )

  useEffect(() => {
    let cancelado = false
    async function carregar() {
      setCarregando(true)
      try {
        const [itens, listaInsumos, todasFichas] = await Promise.all([
          listarItensCardapioSimples(estabelecimentoId),
          listarInsumos(estabelecimentoId),
          listarFichasTecnicas(estabelecimentoId),
        ])
        if (cancelado) return
        setItensCardapio(itens)
        setInsumos(listaInsumos)
        setOutrasFichas(todasFichas.filter((f) => f.id !== fichaTecnicaId))
        if (fichaTecnicaId) await carregarDetalhes(fichaTecnicaId)
      } catch (err) {
        if (!cancelado) setErro(err instanceof Error ? err.message : 'Erro ao carregar ficha técnica')
      } finally {
        if (!cancelado) setCarregando(false)
      }
    }
    carregar()
    return () => {
      cancelado = true
    }
  }, [estabelecimentoId, fichaTecnicaId, carregarDetalhes])

  async function handleSalvarCabecalho() {
    if (!cabecalho.nome.trim()) return
    setSalvandoCabecalho(true)
    setErro(null)
    const dados: DadosFichaTecnica = {
      cardapioItemId: cabecalho.cardapioItemId || null,
      nome: cabecalho.nome.trim(),
      skuPlu: cabecalho.skuPlu.trim() || null,
      categoriaVenda: cabecalho.categoriaVenda.trim() || null,
      tempoPreparoMin: cabecalho.tempoPreparoMin.trim() ? Number(cabecalho.tempoPreparoMin) : null,
      precoVenda: cabecalho.precoVenda.trim() ? parseFloat(cabecalho.precoVenda.replace(',', '.')) : null,
      cmvAlvoPercentual: parseFloat(cabecalho.cmvAlvoPercentual.replace(',', '.')) || 0,
      rendimentoQtd: parseFloat(cabecalho.rendimentoQtd.replace(',', '.')) || 1,
      rendimentoUnidade: cabecalho.rendimentoUnidade,
      status: cabecalho.status,
    }
    try {
      if (id) {
        await atualizarFichaTecnica(id, dados)
      } else {
        const novoId = await criarFichaTecnica(estabelecimentoId, dados)
        setId(novoId)
        await carregarDetalhes(novoId)
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível salvar a ficha técnica')
    } finally {
      setSalvandoCabecalho(false)
    }
  }

  async function handleAdicionarItem() {
    if (!id) return
    const qtd = parseFloat(qtdBrutaNovo.replace(',', '.'))
    if (!qtd || qtd <= 0) return
    if (tipoNovo === 'insumo' && !insumoIdNovo) return
    if (tipoNovo === 'sub_ficha' && !subFichaIdNovo) return

    setErro(null)

    // Confere se dá pra converter a unidade escolhida pra unidade do insumo
    // ANTES de gravar — assim uma linha com unidade incompatível nunca
    // chega a existir na composição (não precisa desfazer depois).
    if (tipoNovo === 'insumo') {
      const insumo = insumos.find((i) => i.id === insumoIdNovo)
      if (insumo) {
        try {
          converterParaUnidadeDoInsumo(1, unidadeNovo, insumo)
        } catch (err) {
          setErro(err instanceof Error ? err.message : 'Unidade incompatível com esse insumo')
          return
        }
      }
    }

    setEnviandoItem(true)
    const dados: DadosItemComposicao = {
      tipo: tipoNovo,
      insumoId: tipoNovo === 'insumo' ? insumoIdNovo : null,
      subFichaId: tipoNovo === 'sub_ficha' ? subFichaIdNovo : null,
      qtdBruta: qtd,
      unidade: unidadeNovo,
      fatorCorrecao: parseFloat(fatorCorrecaoNovo.replace(',', '.')) || 1,
      ordem: composicao?.itens.length || 0,
    }
    try {
      await adicionarItemComposicao(id, dados)
      const [comp, listaAlergenos] = await Promise.all([calcularComposicao(id), alergenosHerdados(id)])
      setComposicao(comp)
      setAlergenos(listaAlergenos)
      setInsumoIdNovo('')
      setSubFichaIdNovo('')
      setQtdBrutaNovo('')
      setFatorCorrecaoNovo('1')
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Não foi possível adicionar o item')
    } finally {
      setEnviandoItem(false)
    }
  }

  async function handleRemoverItem(itemId: string) {
    if (!id) return
    try {
      await removerItemComposicao(itemId)
      const [comp, listaAlergenos] = await Promise.all([calcularComposicao(id), alergenosHerdados(id)])
      setComposicao(comp)
      setAlergenos(listaAlergenos)
    } catch (err) {
      alert(`Não foi possível remover o item: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  async function handleSalvarPassos() {
    if (!id) return
    try {
      await salvarPassos(
        id,
        passos.filter((p) => p.trim()).map((descricao) => ({ descricao: descricao.trim() }))
      )
      setPassos(passos.filter((p) => p.trim()))
    } catch (err) {
      alert(`Não foi possível salvar o modo de preparo: ${err instanceof Error ? err.message : 'erro desconhecido'}`)
    }
  }

  if (carregando) {
    return <div className="py-12 text-center text-neutral-400">Carregando ficha técnica...</div>
  }

  const qlPreview = qtdBrutaNovo.trim()
    ? calcularQL(parseFloat(qtdBrutaNovo.replace(',', '.')) || 0, parseFloat(fatorCorrecaoNovo.replace(',', '.')) || 1)
    : null

  // Só oferece no seletor as unidades que realmente convertem pra esse
  // insumo/sub-ficha — evita escolher uma combinação que ia travar com erro
  // de conversão ao tentar adicionar.
  const insumoSelecionadoNovo = tipoNovo === 'insumo' ? insumos.find((i) => i.id === insumoIdNovo) : undefined
  const subFichaSelecionadaNovo = tipoNovo === 'sub_ficha' ? outrasFichas.find((f) => f.id === subFichaIdNovo) : undefined
  const opcoesUnidade: UnidadeInsumo[] = insumoSelecionadoNovo
    ? unidadesCompativeisComInsumo(insumoSelecionadoNovo)
    : subFichaSelecionadaNovo
      ? unidadesDaMesmaFamilia(subFichaSelecionadaNovo.rendimento_unidade)
      : UNIDADES

  const precoVendaNum = cabecalho.precoVenda.trim() ? parseFloat(cabecalho.precoVenda.replace(',', '.')) : null
  const cmvAlvoNum = parseFloat(cabecalho.cmvAlvoPercentual.replace(',', '.')) || 0
  const cmvCalculado = composicao ? calcularCmvPercentual(composicao.custoTotal, precoVendaNum) : null

  return (
    <div className="space-y-4">
      <button onClick={onVoltar} className="text-sm text-neutral-500 hover:text-orange-600">
        ← Voltar para fichas técnicas
      </button>

      {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>}

      {/* CABEÇALHO */}
      <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-sm font-semibold text-neutral-700">Dados básicos</h3>
        <div className="flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Nome
            <input
              value={cabecalho.nome}
              onChange={(e) => setCabecalho((f) => ({ ...f, nome: e.target.value }))}
              placeholder="Ex: Molho especial da casa"
              className="w-56 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Item do cardápio vinculado
            <select
              value={cabecalho.cardapioItemId}
              onChange={(e) => setCabecalho((f) => ({ ...f, cardapioItemId: e.target.value }))}
              className="w-56 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            >
              <option value="">Nenhum (sub-ficha / preparo interno)</option>
              {itensCardapio.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nome} · {item.categoria}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            SKU / PLU
            <input
              value={cabecalho.skuPlu}
              onChange={(e) => setCabecalho((f) => ({ ...f, skuPlu: e.target.value }))}
              className="w-28 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Categoria de venda
            <input
              value={cabecalho.categoriaVenda}
              onChange={(e) => setCabecalho((f) => ({ ...f, categoriaVenda: e.target.value }))}
              className="w-40 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Tempo de preparo (min)
            <input
              type="number"
              value={cabecalho.tempoPreparoMin}
              onChange={(e) => setCabecalho((f) => ({ ...f, tempoPreparoMin: e.target.value }))}
              className="w-28 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Preço de venda
            <input
              type="text"
              inputMode="decimal"
              value={cabecalho.precoVenda}
              onChange={(e) => setCabecalho((f) => ({ ...f, precoVenda: e.target.value }))}
              placeholder="Ex: 39,90"
              className="w-28 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            CMV alvo (%)
            <input
              type="text"
              inputMode="decimal"
              value={cabecalho.cmvAlvoPercentual}
              onChange={(e) => setCabecalho((f) => ({ ...f, cmvAlvoPercentual: e.target.value }))}
              className="w-24 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Rende
            <div className="flex gap-1">
              <input
                type="text"
                inputMode="decimal"
                value={cabecalho.rendimentoQtd}
                onChange={(e) => setCabecalho((f) => ({ ...f, rendimentoQtd: e.target.value }))}
                className="w-16 rounded-lg border border-neutral-200 bg-white px-2 py-2 text-sm text-neutral-900"
              />
              <select
                value={cabecalho.rendimentoUnidade}
                onChange={(e) => setCabecalho((f) => ({ ...f, rendimentoUnidade: e.target.value as UnidadeInsumo }))}
                className="rounded-lg border border-neutral-200 bg-white px-2 py-2 text-sm text-neutral-900"
              >
                {UNIDADES.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
          </label>
          <label className="flex flex-col gap-1 text-xs text-neutral-500">
            Status
            <select
              value={cabecalho.status}
              onChange={(e) => setCabecalho((f) => ({ ...f, status: e.target.value as StatusFichaTecnica }))}
              className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900"
            >
              <option value="ativa">ativa</option>
              <option value="inativa">inativa</option>
            </select>
          </label>
          <button
            onClick={handleSalvarCabecalho}
            disabled={salvandoCabecalho || !cabecalho.nome.trim()}
            className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {salvandoCabecalho ? 'Salvando...' : id ? 'Salvar dados básicos' : 'Criar ficha técnica'}
          </button>
        </div>
      </div>

      {!id ? (
        <p className="rounded-xl border border-dashed border-neutral-200 p-6 text-center text-sm text-neutral-400">
          Salve os dados básicos acima para poder montar a composição, o modo de preparo e ver os alérgenos herdados.
        </p>
      ) : (
        <>
          {/* COMPOSIÇÃO */}
          <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-neutral-700">Composição</h3>

            <div className="mb-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-100 text-left text-xs uppercase text-neutral-400">
                  <tr>
                    <th className="py-1.5 pr-3">Item</th>
                    <th className="py-1.5 pr-3">QB</th>
                    <th className="py-1.5 pr-3">FC</th>
                    <th className="py-1.5 pr-3">QL</th>
                    <th className="py-1.5 pr-3">Custo</th>
                    <th className="py-1.5"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-50">
                  {(composicao?.itens || []).map((item) => (
                    <tr key={item.id}>
                      <td className="py-1.5 pr-3 text-neutral-900">
                        {item.tipo === 'sub_ficha' && <span className="mr-1 text-xs text-neutral-400">🧩</span>}
                        {item.nome}
                      </td>
                      <td className="py-1.5 pr-3 text-neutral-500">{item.qtdBruta} {item.unidade}</td>
                      <td className="py-1.5 pr-3 text-neutral-500">{item.fatorCorrecao}</td>
                      <td className="py-1.5 pr-3 text-neutral-500">{item.qtdLiquida.toFixed(3)} {item.unidade}</td>
                      <td className="py-1.5 pr-3 font-medium text-neutral-900">R$ {item.custoItem.toFixed(2)}</td>
                      <td className="py-1.5 text-right">
                        <button onClick={() => handleRemoverItem(item.id)} className="text-xs text-red-500 hover:underline">
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                  {(composicao?.itens || []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-4 text-center text-neutral-400">Nenhum item na composição ainda.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-end gap-2 border-t border-neutral-100 pt-3">
              <label className="flex flex-col gap-1 text-xs text-neutral-500">
                Tipo
                <select
                  value={tipoNovo}
                  onChange={(e) => {
                    setTipoNovo(e.target.value as TipoItemFicha)
                    setInsumoIdNovo('')
                    setSubFichaIdNovo('')
                    setUnidadeNovo('un')
                  }}
                  className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-900"
                >
                  <option value="insumo">Insumo</option>
                  <option value="sub_ficha">Sub-ficha</option>
                </select>
              </label>
              {tipoNovo === 'insumo' ? (
                <label className="flex flex-col gap-1 text-xs text-neutral-500">
                  Insumo
                  <select
                    value={insumoIdNovo}
                    onChange={(e) => {
                      setInsumoIdNovo(e.target.value)
                      const insumo = insumos.find((i) => i.id === e.target.value)
                      if (insumo) setUnidadeNovo(insumo.unidade)
                    }}
                    className="w-44 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-900"
                  >
                    <option value="">Selecione...</option>
                    {insumos.map((i) => (
                      <option key={i.id} value={i.id}>{i.nome}</option>
                    ))}
                  </select>
                </label>
              ) : (
                <label className="flex flex-col gap-1 text-xs text-neutral-500">
                  Sub-ficha
                  <select
                    value={subFichaIdNovo}
                    onChange={(e) => {
                      setSubFichaIdNovo(e.target.value)
                      const subFicha = outrasFichas.find((f) => f.id === e.target.value)
                      if (subFicha) setUnidadeNovo(subFicha.rendimento_unidade)
                    }}
                    className="w-44 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-900"
                  >
                    <option value="">Selecione...</option>
                    {outrasFichas.map((f) => (
                      <option key={f.id} value={f.id}>{f.nome}</option>
                    ))}
                  </select>
                </label>
              )}
              <label className="flex flex-col gap-1 text-xs text-neutral-500">
                Qtd bruta
                <input
                  type="text"
                  inputMode="decimal"
                  value={qtdBrutaNovo}
                  onChange={(e) => setQtdBrutaNovo(e.target.value)}
                  className="w-20 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-900"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs text-neutral-500">
                Unidade
                <select
                  value={unidadeNovo}
                  onChange={(e) => setUnidadeNovo(e.target.value as UnidadeInsumo)}
                  className="rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-900"
                >
                  {opcoesUnidade.map((u) => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
                {insumoSelecionadoNovo && opcoesUnidade.length === 1 && (
                  <span className="text-[11px] text-neutral-400">
                    Cadastre a equivalência do insumo pra usar outra unidade aqui
                  </span>
                )}
              </label>
              <label className="flex flex-col gap-1 text-xs text-neutral-500">
                Fator correção
                <input
                  type="text"
                  inputMode="decimal"
                  value={fatorCorrecaoNovo}
                  onChange={(e) => setFatorCorrecaoNovo(e.target.value)}
                  className="w-20 rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-sm text-neutral-900"
                />
              </label>
              {qlPreview != null && (
                <span className="pb-2 text-xs text-neutral-400">QL: {qlPreview.toFixed(3)} {unidadeNovo}</span>
              )}
              <button
                onClick={handleAdicionarItem}
                disabled={enviandoItem}
                className="rounded-lg bg-orange-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
              >
                Adicionar
              </button>
            </div>
          </div>

          {/* CUSTO / CMV */}
          <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-neutral-700">Custo e CMV</h3>
            <div className="flex flex-wrap gap-6 text-sm">
              <div>
                <p className="text-xs text-neutral-400">Custo total da composição</p>
                <p className="text-lg font-bold text-neutral-900">R$ {(composicao?.custoTotal || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="text-xs text-neutral-400">CMV calculado</p>
                <p
                  className={`text-lg font-bold ${
                    cmvCalculado == null
                      ? 'text-neutral-400'
                      : cmvCalculado <= cmvAlvoNum
                        ? 'text-green-600'
                        : 'text-red-600'
                  }`}
                >
                  {cmvCalculado != null ? `${cmvCalculado.toFixed(1)}%` : '—'}
                </p>
              </div>
              <div>
                <p className="text-xs text-neutral-400">CMV alvo</p>
                <p className="text-lg font-bold text-neutral-500">{cmvAlvoNum.toFixed(1)}%</p>
              </div>
              {composicao && cabecalho.rendimentoQtd && (
                <div>
                  <p className="text-xs text-neutral-400">Custo por {cabecalho.rendimentoUnidade}</p>
                  <p className="text-lg font-bold text-neutral-900">
                    R$ {(composicao.custoTotal / (parseFloat(cabecalho.rendimentoQtd.replace(',', '.')) || 1)).toFixed(2)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* MODO DE PREPARO */}
          <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-neutral-700">Modo de preparo</h3>
            <div className="space-y-2">
              {passos.map((passo, indice) => (
                <div key={indice} className="flex items-center gap-2">
                  <span className="w-5 text-right text-xs text-neutral-400">{indice + 1}.</span>
                  <input
                    value={passo}
                    onChange={(e) => setPassos((prev) => prev.map((p, i) => (i === indice ? e.target.value : p)))}
                    className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900"
                  />
                  <button
                    onClick={() => setPassos((prev) => prev.filter((_, i) => i !== indice))}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setPassos((prev) => [...prev, ''])}
                className="rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50"
              >
                + Passo
              </button>
              <button
                onClick={handleSalvarPassos}
                className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-700"
              >
                Salvar modo de preparo
              </button>
            </div>
          </div>

          {/* ALÉRGENOS HERDADOS */}
          <div className="rounded-2xl border border-neutral-100 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-sm font-semibold text-neutral-700">
              Alérgenos <span className="font-normal text-neutral-400">(calculado a partir da composição)</span>
            </h3>
            {alergenos.length === 0 ? (
              <p className="text-sm text-neutral-400">Nenhum alérgeno identificado na composição atual.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {alergenos.map((a) => (
                  <span
                    key={a.id}
                    className="flex items-center gap-1.5 rounded-full border-2 border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700"
                  >
                    {a.icone && <span className="text-sm leading-none">{a.icone}</span>}
                    {a.nome}
                    {!a.direto && a.origem && <span className="font-normal text-red-500">· herdado de {a.origem}</span>}
                  </span>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
