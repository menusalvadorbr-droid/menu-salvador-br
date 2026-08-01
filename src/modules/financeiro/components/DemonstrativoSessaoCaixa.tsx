'use client'

import { useEffect, useState } from 'react'
import { demonstrativoSessao } from '../caixaRepository'
import type { DemonstrativoSessao } from '../types'

const fmtDataHora = (iso: string | null) => (iso ? new Date(iso).toLocaleString('pt-BR') : '—')
const fmtHora = (iso: string | null) =>
  iso ? new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '—'

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

  if (carregando) return <div className="py-12 text-center text-neutral-400">Carregando demonstrativo...</div>
  if (erro) return <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</div>
  if (!dados) return null

  const { sessao } = dados

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between print:hidden">
        <h1 className="text-lg font-bold text-neutral-900">🧾 Demonstrativo de caixa</h1>
        <button
          onClick={() => window.print()}
          className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          🖨️ Exportar / Imprimir PDF
        </button>
      </div>

      {/* Cabeçalho da sessão */}
      <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm print:border-0 print:p-0 print:shadow-none">
        <h2 className="mb-3 hidden text-xl font-bold text-neutral-900 print:block">Demonstrativo de caixa</h2>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Campo label="Aberto em" valor={fmtDataHora(sessao.aberto_em)} />
          <Campo label="Aberto por" valor={dados.abertoPorNome || '—'} />
          <Campo label="Valor de abertura" valor={`R$ ${sessao.valor_abertura.toFixed(2)}`} />
          <Campo
            label="Fechado em"
            valor={sessao.status === 'fechado' ? fmtDataHora(sessao.fechado_em) : 'Sessão ainda aberta'}
          />
          <Campo label="Fechado por" valor={dados.fechadoPorNome || '—'} />
          <Campo
            label="Valor esperado"
            valor={sessao.valor_esperado != null ? `R$ ${sessao.valor_esperado.toFixed(2)}` : '—'}
          />
          <Campo
            label="Valor informado"
            valor={sessao.valor_fechamento != null ? `R$ ${sessao.valor_fechamento.toFixed(2)}` : '—'}
          />
          <Campo
            label="Diferença"
            valor={sessao.diferenca != null ? `R$ ${sessao.diferenca.toFixed(2)}` : '—'}
            destaque={
              sessao.diferenca == null ? undefined : sessao.diferenca === 0 ? 'ok' : sessao.diferenca > 0 ? 'positivo' : 'negativo'
            }
          />
        </div>
      </div>

      {/* Grupos por mesa */}
      {dados.gruposMesa.map((grupo) => (
        <div
          key={grupo.mesaId}
          className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm print:break-inside-avoid print:border print:shadow-none"
        >
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-neutral-800">🍽️ Mesa {grupo.numeroMesa}</h3>
            {grupo.quitada ? (
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700">
                ✅ Quitada
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                ⚠️ Pendente — faltam R$ {(grupo.totalPedidos - grupo.totalPagamentos).toFixed(2)}
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-neutral-400">
                <tr>
                  <th className="pb-1 pr-2 font-medium">Pedido</th>
                  <th className="pb-1 pr-2 font-medium">Feito às</th>
                  <th className="pb-1 pr-2 font-medium">Entregue às</th>
                  <th className="pb-1 pr-2 font-medium">Pago às</th>
                  <th className="pb-1 pr-2 font-medium">Funcionário</th>
                  <th className="pb-1 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {grupo.pedidos.map((p) => (
                  <tr key={p.id}>
                    <td className="py-1 pr-2 font-mono text-neutral-600">#{p.numero}</td>
                    <td className="py-1 pr-2 text-neutral-600">{fmtHora(p.criadoEm)}</td>
                    <td className="py-1 pr-2 text-neutral-600">{fmtHora(p.entregueEm)}</td>
                    <td className="py-1 pr-2 text-neutral-600">{fmtHora(p.pagoEm)}</td>
                    <td className="py-1 pr-2 text-neutral-600">{p.funcionario || '—'}</td>
                    <td className="py-1 text-right font-semibold text-neutral-900">R$ {p.valor.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-neutral-100">
                  <td colSpan={5} className="pt-1 text-right text-neutral-500">
                    Total dos pedidos
                  </td>
                  <td className="pt-1 text-right font-bold text-neutral-900">R$ {grupo.totalPedidos.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {grupo.pagamentos.length > 0 && (
            <div className="mt-3 border-t border-dashed border-neutral-200 pt-3">
              <p className="mb-1 text-xs font-semibold text-neutral-500">Pagamentos</p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="text-left text-neutral-400">
                    <tr>
                      <th className="pb-1 pr-2 font-medium">Horário</th>
                      <th className="pb-1 pr-2 font-medium">Pago por</th>
                      <th className="pb-1 pr-2 font-medium">Forma</th>
                      <th className="pb-1 pr-2 font-medium">Registrado por</th>
                      <th className="pb-1 text-right font-medium">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {grupo.pagamentos.map((pg) => (
                      <tr key={pg.id}>
                        <td className="py-1 pr-2 text-neutral-600">{fmtHora(pg.horario)}</td>
                        <td className="py-1 pr-2 text-neutral-600">{pg.nomePagador || '—'}</td>
                        <td className="py-1 pr-2 text-neutral-600">{pg.formaPagamento || '—'}</td>
                        <td className="py-1 pr-2 text-neutral-600">{pg.funcionario || '—'}</td>
                        <td className="py-1 text-right font-semibold text-neutral-900">R$ {pg.valor.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t border-neutral-100">
                      <td colSpan={4} className="pt-1 text-right text-neutral-500">
                        Total pago
                      </td>
                      <td className="pt-1 text-right font-bold text-neutral-900">
                        R$ {grupo.totalPagamentos.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Pedidos avulsos */}
      {dados.pedidosAvulsos.length > 0 && (
        <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm print:break-inside-avoid print:border print:shadow-none">
          <h3 className="mb-3 text-sm font-semibold text-neutral-800">🧾 Pedidos avulsos (balcão / retirada / entrega)</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead className="text-left text-neutral-400">
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
              <tbody className="divide-y divide-neutral-50">
                {dados.pedidosAvulsos.map((p) => (
                  <tr key={p.id}>
                    <td className="py-1 pr-2 font-mono text-neutral-600">#{p.numero}</td>
                    <td className="py-1 pr-2 text-neutral-600">{fmtHora(p.criadoEm)}</td>
                    <td className="py-1 pr-2 text-neutral-600">{fmtHora(p.entregueEm)}</td>
                    <td className="py-1 pr-2 text-neutral-600">{fmtHora(p.pagoEm)}</td>
                    <td className="py-1 pr-2 text-neutral-600">{p.funcionario || '—'}</td>
                    <td className="py-1 pr-2 text-neutral-600">{p.metodoPagamento || '—'}</td>
                    <td className="py-1 text-right font-semibold text-neutral-900">R$ {p.valor.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Total por forma de pagamento */}
      <div className="rounded-2xl border border-neutral-100 bg-white p-5 shadow-sm print:break-inside-avoid print:border print:shadow-none">
        <h3 className="mb-3 text-sm font-semibold text-neutral-800">💰 Total por forma de pagamento</h3>
        <div className="space-y-1 text-sm">
          {Object.entries(dados.totalPorFormaPagamento).map(([forma, valor]) => (
            <div key={forma} className="flex justify-between">
              <span className="text-neutral-600">{forma}</span>
              <span className="font-semibold text-neutral-900">R$ {valor.toFixed(2)}</span>
            </div>
          ))}
          <div className="flex justify-between border-t border-neutral-100 pt-1 text-base font-bold text-neutral-900">
            <span>Total geral</span>
            <span>R$ {dados.totalGeral.toFixed(2)}</span>
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
      ? 'text-green-600'
      : destaque === 'positivo'
        ? 'text-blue-600'
        : destaque === 'negativo'
          ? 'text-red-600'
          : 'text-neutral-900'
  return (
    <div>
      <p className="text-xs text-neutral-400">{label}</p>
      <p className={`font-semibold ${cor}`}>{valor}</p>
    </div>
  )
}
