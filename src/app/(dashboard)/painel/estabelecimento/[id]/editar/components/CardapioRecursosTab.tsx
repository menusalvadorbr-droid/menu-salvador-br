'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface CardapioRecursosTabProps {
  estabelecimento: {
    id: string
    cardapio_variacoes_ativado?: boolean
    cardapio_complementos_ativado?: boolean
    promocoes_contador_ativado?: boolean
    cardapio_clique_expande_ativado?: boolean
    cardapio_carrinho_ativado?: boolean
  }
  readOnly?: boolean
}

function ToggleRow({
  checked,
  onToggle,
  titulo,
  descricao,
  readOnly,
}: {
  checked: boolean
  onToggle: () => void
  titulo: string
  descricao: string
  readOnly?: boolean
}) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <label className="flex items-center gap-2 cursor-pointer select-none">
        <div
          role="switch"
          aria-checked={checked}
          onClick={() => !readOnly && onToggle()}
          className={`relative w-9 h-5 rounded-full transition-colors ${checked ? 'bg-orange-500' : 'bg-gray-200'} ${
            readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
          }`}
        >
          <div
            className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
              checked ? 'translate-x-4' : ''
            }`}
          />
        </div>
        <span className="text-sm font-medium text-gray-700">{titulo}</span>
      </label>
      <p className="text-xs text-gray-400 mt-1 ml-11">{descricao}</p>
    </div>
  )
}

export default function CardapioRecursosTab({ estabelecimento, readOnly }: CardapioRecursosTabProps) {
  const supabaseRef = useRef(createClient())
  const supabase = supabaseRef.current

  const [variacoesAtivado, setVariacoesAtivado] = useState(estabelecimento.cardapio_variacoes_ativado || false)
  const [complementosAtivado, setComplementosAtivado] = useState(estabelecimento.cardapio_complementos_ativado || false)
  const [promocoesContadorAtivado, setPromocoesContadorAtivado] = useState(estabelecimento.promocoes_contador_ativado || false)
  const [cliqueExpandeAtivado, setCliqueExpandeAtivado] = useState(estabelecimento.cardapio_clique_expande_ativado || false)
  const [carrinhoAtivado, setCarrinhoAtivado] = useState(estabelecimento.cardapio_carrinho_ativado || false)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<string | null>(null)

  async function salvar(novoVariacoes: boolean, novoComplementos: boolean, novoPromocoesContador: boolean, novoCliqueExpande: boolean, novoCarrinho: boolean) {
    if (readOnly) return
    setSalvando(true)
    setMensagem(null)
    const { error } = await supabase
      .from('estabelecimentos')
      .update({
        cardapio_variacoes_ativado: novoVariacoes,
        cardapio_complementos_ativado: novoComplementos,
        promocoes_contador_ativado: novoPromocoesContador,
        cardapio_clique_expande_ativado: novoCliqueExpande,
        cardapio_carrinho_ativado: novoCarrinho,
      })
      .eq('id', estabelecimento.id)

    setSalvando(false)
    setMensagem(error ? 'Erro ao salvar: ' + error.message : 'Salvo!')
    setTimeout(() => setMensagem(null), 2000)
  }

  return (
    <div>
      <h3 className="text-lg font-semibold mb-1">🍽️ Recursos avançados do cardápio</h3>
      <p className="text-sm text-gray-400 mb-4">
        Ative só o que seu negócio usa — nada muda pra quem deixar desligado.
      </p>

      <ToggleRow
        checked={variacoesAtivado}
        onToggle={() => {
          const novo = !variacoesAtivado
          setVariacoesAtivado(novo)
          salvar(novo, complementosAtivado, promocoesContadorAtivado, cliqueExpandeAtivado, carrinhoAtivado)
        }}
        readOnly={readOnly}
        titulo="Tamanhos/variações de preço"
        descricao='Pra pizzaria (P/M/G/Família) ou marmita (Para 1/Para 2) — adicione tamanhos com preços diferentes em cada item, na aba Cardápio.'
      />

      <ToggleRow
        checked={complementosAtivado}
        onToggle={() => {
          const novo = !complementosAtivado
          setComplementosAtivado(novo)
          salvar(variacoesAtivado, novo, promocoesContadorAtivado, cliqueExpandeAtivado, carrinhoAtivado)
        }}
        readOnly={readOnly}
        titulo="Grupos de complementos"
        descricao='Pra "monte sua marmita" (proteína + acompanhamentos) ou adicionais de pizza — crie grupos de opções reutilizáveis entre vários itens, na aba Cardápio.'
      />

      <ToggleRow
        checked={promocoesContadorAtivado}
        onToggle={() => {
          const novo = !promocoesContadorAtivado
          setPromocoesContadorAtivado(novo)
          salvar(variacoesAtivado, complementosAtivado, novo, cliqueExpandeAtivado, carrinhoAtivado)
        }}
        readOnly={readOnly}
        titulo="Promoções com contador"
        descricao="Cadastre combos e ofertas por tempo limitado (ex: happy hour) que não são itens do cardápio — aparecem no carrossel de promoções com contador regressivo, na aba Promoções."
      />

      <ToggleRow
        checked={cliqueExpandeAtivado}
        onToggle={() => {
          const novo = !cliqueExpandeAtivado
          setCliqueExpandeAtivado(novo)
          salvar(variacoesAtivado, complementosAtivado, promocoesContadorAtivado, novo, carrinhoAtivado)
        }}
        readOnly={readOnly}
        titulo="Clique expande"
        descricao="Tocar num item do cardápio público abre um painel com foto maior, descrição completa e alérgenos — funciona em qualquer tema, não só no Modelo Catálogo."
      />

      <ToggleRow
        checked={carrinhoAtivado}
        onToggle={() => {
          const novo = !carrinhoAtivado
          setCarrinhoAtivado(novo)
          salvar(variacoesAtivado, complementosAtivado, promocoesContadorAtivado, cliqueExpandeAtivado, novo)
        }}
        readOnly={readOnly}
        titulo="Carrinho de pedidos"
        descricao="Libera o botão de adicionar ao carrinho no cardápio público (no card comum e no painel de clique expande). Desligado, o cardápio fica só informativo, sem nenhum botão de adicionar."
      />

      {salvando && <p className="text-xs text-gray-400 mt-2">Salvando…</p>}
      {mensagem && <p className="text-xs text-green-600 mt-2">{mensagem}</p>}
    </div>
  )
}
