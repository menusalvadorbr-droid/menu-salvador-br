'use client'

import { useEffect, useState } from 'react'
import { demonstrativoSessao } from '../caixaRepository'
import type { DemonstrativoSessao, GrupoMesaDemonstrativo } from '../types'
import { formatarReais } from '@/lib/moeda'
import { caixaTema } from '../caixaTema'

const fmtDataHora = (iso: string | null) => (iso ? new Date(iso).toLocaleString('pt-BR') : '—')
const fmtHora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'

// Tela e impressão usam a mesma paleta clara agora — só o que realmente
// muda no print fica aqui (evitar sombra gastando tinta à toa, e não
// quebrar um card no meio entre duas páginas).
const painelImprimivel = `${caixaTema.painel} print:break-inside-avoid print:shadow-none`

/**
 * Demonstrativo completo de uma sessão de caixa — reaproveitado tanto pra
 * sessão já fechada (a partir de HistoricoCaixa.tsx) quanto pra sessão em
 * andamento (a partir da própria tela do caixa aberto). "Exportar PDF" usa
 * o print nativo do navegador (Salvar como PDF) — sem lib nova pra isso, o
 * projeto já não tinha nenhuma dedicada a PDF.
 */
export default function DemonstrativoSessaoCaixa({ sessaoId }: { sessaoId: string }) {
  const [dados, setDados] = useState<DemonstrativoSessao | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    demonstrativoSessao(sessaoId)
      .then(setDados)
      .catch((err) => setErro(err instanceof Error ? err.message : 'Erro ao carregar demonstrativo'))
      .finally(() => setCarregando(false))
  }, [sessaoId])

  if (carregando) return <div className="py-12 text-center text-neutral-500">Carregando demonstrativo...</div>
  if (erro) return <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>
  if (!dados) return null

  const { sessao } = dados

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-lg font-bold text-neutral-900">🧾 Demonstrativo de caixa</h1>
        <button
          onClick={() => window.print()}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${caixaTema.botaoVerde}`}
        >
          🖨️ Exportar / Imprimir PDF
        </button>
      </div>

      {/* Cabeçalho da sessão */}
      <div className={`${painelImprimivel} p-5 print:p-0`}>
        <h2 className="mb-3 hidden text-xl font-bold print:block">Demonstrativo de caixa</h2>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Campo label="Aberto em" valor={fmtDataHora(sessao.aberto_em)} />
          <Campo label="Aberto por" valor={dados.abertoPorNome || '—'} />
          <Campo label="Valor de abertura" valor={`R$ ${formatarReais(sessao.valor_abertura)}`} />
          <Campo
            label="Fechado em"
            valor={sessao.status === 'fechado' ? fmtDataHora(sessao.fechado_em) : 'Sessão ainda aberta'}
          />
          <Campo label="Fechado por" valor={dados.fechadoPorNome || '—'} />
          <Campo
            label="Valor esperado"
            valor={sessao.valor_esperado != null ? `R$ ${formatarReais(sessao.valor_esperado)}` : '—'}
          />
          <Campo
            label="Valor informado"
            valor={sessao.valor_fechamento != null ? `R$ ${formatarReais(sessao.valor_fechamento)}` : '—'}
          />
          <Campo
            label="Diferença"
            valor={sessao.diferenca != null ? `R$ ${formatarReais(sessao.diferenca)}` : '—'}
            destaque={
              sessao.diferenca == null ? undefined : sessao.diferenca === 0 ? 'ok' : sessao.diferenca > 0 ? 'positivo' : 'negativo'
            }
          />
        </div>
      </div>

      {/* Grupos por mesa — recolhidos por padrão, clique expande */}
      {dados.gruposMesa.map((grupo) => (
        <GrupoMesaSecao key={grupo.mesaId} grupo={grupo} />
      ))}

      {/* Pedidos avulsos */}
      {dados.pedidosAvulsos.length > 0 && (
        <div className={`${painelImprimivel} p-5`}>
          <h3 className="mb-3 text-sm font-semibold text-neutral-900">🧾 Pedidos avulsos (balcão / retirada / entrega)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-neutral-500">
                <tr>
                  <th className="pb-1 pr-2 font-medium">Pedido</th>
                  <th className="pb-1 pr-2 font-medium">Feito às</th>
                  <th className="pb-1 pr-2 font-medium">Entregue às</th>
                  <th className="pb-1 pr-2 font-medium">Pago às</th>
                  <th className="pb-1 pr-2 font-medium">Funcionário</th>
                  <th className="pb-1 pr-2 font-medium">Forma</th>
                  <th className="pb-1 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {dados.pedidosAvulsos.map((p) => (
                  <tr key={p.id}>
                    <td className="py-1 pr-2 font-mono text-neutral-600">#{p.numero}</td>
                    <td className="py-1 pr-2 text-neutral-600">{fmtHora(p.criadoEm)}</td>
                    <td className="py-1 pr-2 text-neutral-600">{fmtHora(p.entregueEm)}</td>
                    <td className="py-1 pr-2 text-neutral-600">{fmtHora(p.pagoEm)}</td>
                    <td className="py-1 pr-2 text-neutral-600">{p.funcionario || '—'}</td>
                    <td className="py-1 pr-2 text-neutral-600">{p.metodoPagamento || '—'}</td>
                    <td className="py-1 text-right font-semibold text-neutral-900">R$ {formatarReais(p.valor)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Total por forma de pagamento */}
      <div className={`${painelImprimivel} p-5`}>
        <h3 className="mb-3 text-sm font-semibold text-neutral-900">💰 Total por forma de pagamento</h3>
        <div className="space-y-1 text-sm">
          {Object.entries(dados.totalPorFormaPagamento).map(([forma, valor]) => (
            <div key={forma} className="flex justify-between">
              <span className="text-neutral-600">{forma}</span>
              <span className="font-semibold text-neutral-900">R$ {formatarReais(valor)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-neutral-200 pt-1 text-base font-bold text-neutral-900">
            <span>Total geral</span>
            <span>R$ {formatarReais(dados.totalGeral)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function Campo({
  label,
  valor,
  destaque,
}: {
  label: string
  valor: string
  destaque?: 'ok' | 'positivo' | 'negativo'
}) {
  const cor =
    destaque === 'ok'
      ? 'text-emerald-700'
      : destaque === 'positivo'
        ? 'text-sky-700'
        : destaque === 'negativo'
          ? 'text-red-700'
          : 'text-neutral-900'
  return (
    <div>
      <p className="text-xs text-neutral-500">{label}</p>
      <p className={`font-semibold ${cor}`}>{valor}</p>
    </div>
  )
}

/**
 * Seção de uma mesa — recolhida por padrão (só cabeçalho com indicador e
 * total), clique expande pra ver os pedidos e pagamentos, mesmo padrão já
 * usado nas linhas da lista de vendas (VendaSessaoRow). No print/PDF o
 * conteúdo aparece sempre, independente do estado na tela.
 */
function GrupoMesaSecao({ grupo }: { grupo: GrupoMesaDemonstrativo }) {
  const [aberto, setAberto] = useState(false)

  return (
    <div className={`${painelImprimivel} p-5`}>
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        className="flex w-full items-center justify-between gap-3 text-left print:pointer-events-none"
      >
        <span className="flex items-center gap-2">
          <span className="text-xs text-neutral-500 print:hidden">{aberto ? '▼' : '▶'}</span>
          <h3 className="text-sm font-semibold text-neutral-900">🍽️ Mesa {grupo.numeroMesa}</h3>
        </span>
        <span className="flex items-center gap-2">
          <span className="text-xs text-neutral-500">R$ {formatarReais(grupo.totalPedidos)}</span>
          {grupo.quitada ? (
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${caixaTema.badgeSucesso}`}>
              ✅ Quitada
            </span>
          ) : (
            <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${caixaTema.badgeAlerta}`}>
              ⚠️ Pendente — faltam R$ {formatarReais(grupo.totalPedidos - grupo.totalPagamentos)}
            </span>
          )}
        </span>
      </button>

      <div className={`${aberto ? 'mt-3 block' : 'hidden'} print:mt-3 print:block`}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-neutral-500">
              <tr>
                <th className="pb-1 pr-2 font-medium">Pedido</th>
                <th className="pb-1 pr-2 font-medium">Feito às</th>
                <th className="pb-1 pr-2 font-medium">Entregue às</th>
                <th className="pb-1 pr-2 font-medium">Pago às</th>
                <th className="pb-1 pr-2 font-medium">Funcionário</th>
                <th className="pb-1 text-right font-medium">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {grupo.pedidos.map((p) => (
                <tr key={p.id}>
                  <td className="py-1 pr-2 font-mono text-neutral-600">#{p.numero}</td>
                  <td className="py-1 pr-2 text-neutral-600">{fmtHora(p.criadoEm)}</td>
                  <td className="py-1 pr-2 text-neutral-600">{fmtHora(p.entregueEm)}</td>
                  <td className="py-1 pr-2 text-neutral-600">{fmtHora(p.pagoEm)}</td>
                  <td className="py-1 pr-2 text-neutral-600">{p.funcionario || '—'}</td>
                  <td className="py-1 text-right font-semibold text-neutral-900">R$ {formatarReais(p.valor)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-neutral-200">
                <td colSpan={5} className="pt-1 text-right text-neutral-500">
                  Total dos pedidos
                </td>
                <td className="pt-1 text-right font-bold text-neutral-900">R$ {formatarReais(grupo.totalPedidos)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {grupo.pagamentos.length > 0 && (
          <div className="mt-3 border-t border-dashed border-neutral-200 pt-3">
            <p className="mb-1 text-xs font-semibold text-neutral-500">Pagamentos</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-left text-neutral-500">
                  <tr>
                    <th className="pb-1 pr-2 font-medium">Horário</th>
                    <th className="pb-1 pr-2 font-medium">Pago por</th>
                    <th className="pb-1 pr-2 font-medium">Forma</th>
                    <th className="pb-1 pr-2 font-medium">Registrado por</th>
                    <th className="pb-1 text-right font-medium">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {grupo.pagamentos.map((pg) => (
                    <tr key={pg.id}>
                      <td className="py-1 pr-2 text-neutral-600">{fmtHora(pg.horario)}</td>
                      <td className="py-1 pr-2 text-neutral-600">{pg.nomePagador || '—'}</td>
                      <td className="py-1 pr-2 text-neutral-600">{pg.formaPagamento || '—'}</td>
                      <td className="py-1 pr-2 text-neutral-600">{pg.funcionario || '—'}</td>
                      <td className="py-1 text-right font-semibold text-neutral-900">R$ {formatarReais(pg.valor)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-neutral-200">
                    <td colSpan={4} className="pt-1 text-right text-neutral-500">
                      Total pago
                    </td>
                    <td className="pt-1 text-right font-bold text-neutral-900">R$ {formatarReais(grupo.totalPagamentos)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
