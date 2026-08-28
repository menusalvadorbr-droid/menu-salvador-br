'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { gerarCodigoPix } from '@/lib/pix/gerarCodigoPix'
import QrCodeEstilizado from '@/app/(dashboard)/painel/components/ui/QrCodeEstilizado'

type TipoChavePix = 'cpf' | 'cnpj' | 'email' | 'telefone' | 'aleatoria'

const TIPOS_CHAVE: { valor: TipoChavePix; label: string; placeholder: string }[] = [
  { valor: 'cpf', label: 'CPF', placeholder: '000.000.000-00' },
  { valor: 'cnpj', label: 'CNPJ', placeholder: '00.000.000/0000-00' },
  { valor: 'email', label: 'E-mail', placeholder: 'seuemail@exemplo.com' },
  { valor: 'telefone', label: 'Telefone', placeholder: '+5571999999999' },
  { valor: 'aleatoria', label: 'Chave aleatória', placeholder: '123e4567-e89b-...' },
]

interface PixTabProps {
  estabelecimento: {
    id: string
    nome?: string
    nome_fantasia?: string | null
    cidade_id?: string | null
    chave_pix?: string | null
    tipo_chave_pix?: string | null
  }
  readOnly?: boolean
}

export default function PixTab({ estabelecimento, readOnly }: PixTabProps) {
  const supabase = createClient()

  const [tipoChave, setTipoChave] = useState<TipoChavePix>((estabelecimento.tipo_chave_pix as TipoChavePix) || 'cpf')
  const [chavePix, setChavePix] = useState(estabelecimento.chave_pix || '')
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [cidadeNome, setCidadeNome] = useState<string | null>(null)
  const [carregandoCidade, setCarregandoCidade] = useState(true)

  useEffect(() => {
    if (!estabelecimento.cidade_id) {
      Promise.resolve().then(() => setCarregandoCidade(false))
      return
    }
    supabase
      .from('cidades')
      .select('nome')
      .eq('id', estabelecimento.cidade_id)
      .maybeSingle()
      .then(({ data }: { data: { nome: string } | null }) => {
        setCidadeNome(data?.nome || null)
        setCarregandoCidade(false)
      })
  }, [estabelecimento.cidade_id, supabase])

  async function salvar() {
    if (readOnly) return
    setSalvando(true)
    setMensagem(null)
    const { error } = await supabase
      .from('estabelecimentos')
      .update({ chave_pix: chavePix.trim() || null, tipo_chave_pix: tipoChave })
      .eq('id', estabelecimento.id)
    setSalvando(false)
    setMensagem(error ? 'Erro ao salvar: ' + error.message : 'Salvo!')
    setTimeout(() => setMensagem(null), 2000)
  }

  const preview =
    chavePix.trim() && cidadeNome
      ? gerarCodigoPix({
          chavePix,
          nomeRecebedor: estabelecimento.nome_fantasia || estabelecimento.nome || '',
          cidade: cidadeNome,
          valor: 1,
          codigoPedido: 'TESTE1',
        })
      : null

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-lg font-semibold mb-1">💳 Recebimento via Pix</h3>
        <p className="text-sm text-gray-400 mb-4">
          Cadastre sua chave Pix para que o sistema gere, sozinho, o QR code e o código &quot;copia e cola&quot; de
          cada pedido — sem gateway de pagamento, sem taxa. O cliente vê o código na própria tela de acompanhamento
          do pedido quando escolhe Pix como forma de pagamento.
        </p>
      </div>

      <div className="border-b border-gray-100 pb-6">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Sua chave Pix</h4>
        <div className="flex flex-col gap-2 max-w-md">
          <select
            value={tipoChave}
            onChange={(e) => setTipoChave(e.target.value as TipoChavePix)}
            disabled={readOnly}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          >
            {TIPOS_CHAVE.map((t) => (
              <option key={t.valor} value={t.valor}>
                {t.label}
              </option>
            ))}
          </select>
          <input
            value={chavePix}
            onChange={(e) => setChavePix(e.target.value)}
            placeholder={TIPOS_CHAVE.find((t) => t.valor === tipoChave)?.placeholder}
            disabled={readOnly}
            className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
          />
          <button
            onClick={salvar}
            disabled={readOnly || salvando}
            className="self-start rounded-lg bg-neutral-900 px-4 py-2 text-xs font-medium text-white disabled:opacity-50"
          >
            {salvando ? 'Salvando...' : 'Salvar chave Pix'}
          </button>
          {mensagem && <p className="text-xs text-gray-600">{mensagem}</p>}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Testar antes de publicar</h4>
        {!estabelecimento.cidade_id && !carregandoCidade && (
          <p className="text-xs text-amber-700">
            Cadastre a cidade do estabelecimento em Dados básicos antes de configurar o Pix — a cidade é obrigatória
            no código gerado.
          </p>
        )}
        {estabelecimento.cidade_id && !chavePix.trim() && (
          <p className="text-xs text-gray-400">Preencha a chave acima para ver o preview.</p>
        )}
        {preview && (
          <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
            <QrCodeEstilizado data={preview.copiaCola} width={160} height={160} />
            <div className="flex-1">
              <p className="mb-1 text-xs text-gray-400">
                Escaneie com o app do seu banco para conferir se abre a cobrança de R$ 1,00 com o nome e a cidade
                certos. Este preview não é um pedido real.
              </p>
              <textarea
                readOnly
                value={preview.copiaCola}
                rows={3}
                className="w-full rounded-lg border border-gray-200 bg-gray-50 px-2 py-1.5 text-xs text-gray-600"
              />
            </div>
          </div>
        )}
        {estabelecimento.cidade_id && chavePix.trim() && cidadeNome && !preview && (
          <p className="text-xs text-red-600">Não foi possível gerar um Pix válido com esses dados — confira a chave.</p>
        )}
      </div>
    </div>
  )
}
