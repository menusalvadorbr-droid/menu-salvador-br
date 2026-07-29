'use client'

import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import type { GrupoResolvido, VariacaoResolvida } from './tiposSelecao'
import type { ComplementoSelecionado, VariacaoSelecionada } from '../types'

interface SeletorItemModalProps {
  nome: string
  precoBase: number
  precoPromocionalBase?: number | null
  variacoes: VariacaoResolvida[]
  grupos: GrupoResolvido[]
  corDestaque: string
  onFechar: () => void
  onConfirmar: (selecao: {
    preco: number
    variacao?: VariacaoSelecionada | null
    complementos?: ComplementoSelecionado[]
  }) => void
}

function fmt(v: number) {
  return v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// Anda pelos grupos "base" do item e, pra cada opção já escolhida que tem
// grupo(s) extra vinculados (opcao_grupo_complemento), acrescenta esses
// grupos também — recursivo, então uma opção de um grupo extra pode por
// sua vez liberar outro grupo extra. `vistos` evita duplicar um grupo que
// apareça por mais de um caminho.
function gruposAplicaveis(base: GrupoResolvido[], selecoes: Record<string, string[]>): GrupoResolvido[] {
  const resultado: GrupoResolvido[] = []
  const vistos = new Set<string>()

  function visitar(grupos: GrupoResolvido[]) {
    for (const grupo of grupos) {
      if (vistos.has(grupo.id)) continue
      vistos.add(grupo.id)
      resultado.push(grupo)
      const escolhidos = selecoes[grupo.id] || []
      for (const opcao of grupo.opcoes) {
        if (escolhidos.includes(opcao.id) && opcao.gruposExtras.length > 0) {
          visitar(opcao.gruposExtras)
        }
      }
    }
  }

  visitar(base)
  return resultado
}

function mensagemErro(grupo: GrupoResolvido): string {
  const { selecaoMinima: min, selecaoMaxima: max } = grupo
  if (min === max) return `Escolha exatamente ${min} em "${grupo.nome}".`
  if (min === 0) return `Escolha até ${max} em "${grupo.nome}".`
  return `Escolha entre ${min} e ${max} em "${grupo.nome}".`
}

export default function SeletorItemModal({
  nome,
  precoBase,
  precoPromocionalBase,
  variacoes,
  grupos,
  corDestaque,
  onFechar,
  onConfirmar,
}: SeletorItemModalProps) {
  const [variacaoId, setVariacaoId] = useState<string | null>(variacoes[0]?.id ?? null)
  const [selecoes, setSelecoes] = useState<Record<string, string[]>>({})
  const [tentouEnviar, setTentouEnviar] = useState(false)

  const aplicaveis = useMemo(() => gruposAplicaveis(grupos, selecoes), [grupos, selecoes])

  const erros = useMemo(() => {
    const mapa: Record<string, string> = {}
    for (const grupo of aplicaveis) {
      const qtd = (selecoes[grupo.id] || []).length
      if (qtd < grupo.selecaoMinima || qtd > grupo.selecaoMaxima) {
        mapa[grupo.id] = mensagemErro(grupo)
      }
    }
    return mapa
  }, [aplicaveis, selecoes])

  const variacaoSelecionada = variacoes.find((v) => v.id === variacaoId) || null
  const precoComplementos = aplicaveis.reduce((soma, grupo) => {
    const escolhidos = selecoes[grupo.id] || []
    return (
      soma +
      escolhidos.reduce((s, opcaoId) => {
        const opcao = grupo.opcoes.find((o) => o.id === opcaoId)
        return s + (opcao?.precoAdicional || 0)
      }, 0)
    )
  }, 0)
  // Preço promocional só faz sentido pro preço-base — uma vez escolhida
  // uma variação, o preço dela já é o específico daquele tamanho, sem
  // conceito de "variação promocional" no modelo de dados hoje.
  const precoBaseComPromo =
    precoPromocionalBase && precoPromocionalBase < precoBase ? precoPromocionalBase : precoBase
  const precoUnidade = (variacaoSelecionada ? variacaoSelecionada.preco : precoBaseComPromo) + precoComplementos

  function alternarOpcao(grupo: GrupoResolvido, opcaoId: string) {
    setSelecoes((prev) => {
      const atuais = prev[grupo.id] || []
      if (grupo.selecaoMaxima === 1) {
        return { ...prev, [grupo.id]: atuais.includes(opcaoId) && grupo.selecaoMinima === 0 ? [] : [opcaoId] }
      }
      if (atuais.includes(opcaoId)) {
        return { ...prev, [grupo.id]: atuais.filter((id) => id !== opcaoId) }
      }
      if (atuais.length >= grupo.selecaoMaxima) return prev
      return { ...prev, [grupo.id]: [...atuais, opcaoId] }
    })
  }

  function confirmar() {
    const semVariacaoValida = variacoes.length > 0 && !variacaoId
    if (semVariacaoValida || Object.keys(erros).length > 0) {
      setTentouEnviar(true)
      return
    }

    const complementos: ComplementoSelecionado[] = aplicaveis.flatMap((grupo) =>
      (selecoes[grupo.id] || []).map((opcaoId) => {
        const opcao = grupo.opcoes.find((o) => o.id === opcaoId)!
        return {
          grupoId: grupo.id,
          grupoNome: grupo.nome,
          opcaoId: opcao.id,
          opcaoNome: opcao.nome,
          precoAdicional: opcao.precoAdicional,
        }
      })
    )

    onConfirmar({
      preco: precoUnidade,
      variacao: variacaoSelecionada,
      complementos,
    })
  }

  // Portal pro <body> — mesmo motivo do painel de "clique expande"
  // (ItemClicavel.tsx): esse botão pode estar dentro do card do Modelo
  // Catálogo, que tem hover:scale-105 (transform). Um transform no
  // ancestral vira o "containing block" de qualquer descendente
  // position:fixed, quebrando o overlay.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center" onClick={onFechar}>
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-neutral-100 bg-white px-5 py-4">
          <h2 className="text-base font-bold text-neutral-900">{nome}</h2>
          <button
            onClick={onFechar}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/5 text-neutral-500 hover:bg-black/10"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 p-5">
          {variacoes.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-neutral-800">
                Tamanho <span className="font-normal text-red-500">· obrigatório</span>
              </p>
              <div className="space-y-1.5">
                {variacoes.map((v) => (
                  <label
                    key={v.id}
                    className={`flex cursor-pointer items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                      variacaoId === v.id ? 'border-orange-400 bg-orange-50' : 'border-neutral-200'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="variacao"
                        checked={variacaoId === v.id}
                        onChange={() => setVariacaoId(v.id)}
                        className="accent-orange-500"
                      />
                      {v.nome}
                    </span>
                    <span className="font-semibold text-neutral-700">R$ {fmt(v.preco)}</span>
                  </label>
                ))}
              </div>
              {tentouEnviar && !variacaoId && (
                <p className="mt-1 text-xs font-medium text-red-600">Escolha um tamanho.</p>
              )}
            </div>
          )}

          {aplicaveis.map((grupo) => {
            const escolhidos = selecoes[grupo.id] || []
            const rotulo =
              grupo.selecaoMinima > 0
                ? grupo.selecaoMinima === grupo.selecaoMaxima
                  ? `escolha ${grupo.selecaoMinima} · obrigatório`
                  : `escolha ${grupo.selecaoMinima} a ${grupo.selecaoMaxima} · obrigatório`
                : `opcional · até ${grupo.selecaoMaxima}`

            return (
              <div key={grupo.id}>
                <p className="mb-2 text-sm font-semibold text-neutral-800">
                  {grupo.nome} <span className="font-normal text-neutral-400">· {rotulo}</span>
                </p>
                <div className="space-y-1.5">
                  {grupo.opcoes.map((opcao) => {
                    const marcado = escolhidos.includes(opcao.id)
                    const noLimite = !marcado && grupo.selecaoMaxima > 1 && escolhidos.length >= grupo.selecaoMaxima
                    return (
                      <label
                        key={opcao.id}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
                          marcado ? 'border-orange-400 bg-orange-50' : 'border-neutral-200'
                        } ${noLimite ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
                      >
                        <span className="flex items-center gap-2">
                          <input
                            type={grupo.selecaoMaxima === 1 ? 'radio' : 'checkbox'}
                            checked={marcado}
                            disabled={noLimite}
                            onChange={() => alternarOpcao(grupo, opcao.id)}
                            className="accent-orange-500"
                          />
                          {opcao.nome}
                        </span>
                        {opcao.exibirPreco && opcao.precoAdicional > 0 && (
                          <span className="font-semibold text-neutral-700">+R$ {fmt(opcao.precoAdicional)}</span>
                        )}
                      </label>
                    )
                  })}
                </div>
                {tentouEnviar && erros[grupo.id] && (
                  <p className="mt-1 text-xs font-medium text-red-600">{erros[grupo.id]}</p>
                )}
              </div>
            )
          })}
        </div>

        <div className="sticky bottom-0 border-t border-neutral-100 bg-white p-4">
          <button
            onClick={confirmar}
            className="w-full rounded-lg py-3 text-sm font-semibold text-white transition hover:opacity-90"
            style={{ backgroundColor: corDestaque }}
          >
            Adicionar · R$ {fmt(precoUnidade)}
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
