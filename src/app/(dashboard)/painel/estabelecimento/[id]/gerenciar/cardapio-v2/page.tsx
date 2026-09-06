'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FlaskConical, ListChecks, PackagePlus, QrCode, Settings2, Palette } from 'lucide-react'
import AbasResponsivas from '@/modules/cardapioV2/components/AbasResponsivas'
import EstadoCarregamento from '../EstadoCarregamento'
import { useEstabelecimentoGerenciar } from '../useEstabelecimentoGerenciar'
import CabecalhoGerenciar from '../CabecalhoGerenciar'
import { useCardapioV2Editor } from '@/modules/cardapioV2/hooks/useCardapioV2Editor'
import CategoriaManager from '@/modules/cardapioV2/components/CategoriaManager'
import ListaItens from '@/modules/cardapioV2/components/ListaItens'
import GrupoComplementoEditor from '@/modules/cardapioV2/components/GrupoComplementoEditor'
import PreviewAoVivo from '@/modules/cardapioV2/components/PreviewAoVivo'
import QrCodeV2 from '@/modules/cardapioV2/components/QrCodeV2'
import ConfiguracoesCardapio from '@/modules/cardapioV2/components/ConfiguracoesCardapio'
import AparenciaEditor from '@/modules/cardapioV2/components/AparenciaEditor'

// Cardápio V2 — editor da fase 3 (ver cardapio-v2-visao.md). Reaproveita só
// o shell do dashboard (useEstabelecimentoGerenciar, CabecalhoGerenciar —
// infraestrutura genérica usada por todo módulo, não código de domínio do
// Cardápio V1); as abas usam AbasResponsivas (próprio do V2, com menu ☰
// dedicado pra mobile) em vez do TabsContainer compartilhado, pra não
// alterar um componente usado pelo V1 e outros módulos. Todo o resto
// (componentes, tabelas, RPC) é próprio, sem nenhuma dependência do
// editor antigo.
export default function CardapioV2ModuloPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [contaAberta, setContaAberta] = useState(false)
  const {
    estabelecimento,
    usuarioNome,
    usuarioLogadoId,
    loading,
    acessoNegado,
    ehDonoOuGerente,
    podeEditar,
  } = useEstabelecimentoGerenciar(id)

  const estadoEspecial = EstadoCarregamento({ acessoNegado, loading, encontrado: !!estabelecimento })

  const editor = useCardapioV2Editor(id)
  const categoriaSelecionada = editor.categorias.find((c) => c.id === editor.categoriaSelecionadaId) ?? null

  if (estadoEspecial) return estadoEspecial

  const tabs = [
    {
      id: 'itens',
      label: 'Categorias e itens',
      icon: <ListChecks className="h-4 w-4" />,
      content: editor.carregando || !editor.cardapio ? (
        <p className="p-4 text-sm text-neutral-400">Carregando cardápio…</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 p-4 md:grid-cols-[280px_1fr]">
          <CategoriaManager
            estabelecimento={estabelecimento}
            cardapioId={editor.cardapio.id}
            categorias={editor.categorias}
            categoriaSelecionadaId={editor.categoriaSelecionadaId}
            onSelecionar={editor.setCategoriaSelecionadaId}
            onMudou={editor.recarregarCategorias}
          />
          <ListaItens estabelecimento={estabelecimento} categoriaId={editor.categoriaSelecionadaId} cardapio={editor.cardapio} />
        </div>
      ),
    },
    {
      id: 'complementos',
      label: 'Grupos de complemento',
      icon: <PackagePlus className="h-4 w-4" />,
      content: (
        <div className="p-4">
          <GrupoComplementoEditor estabelecimentoId={id} />
        </div>
      ),
    },
    {
      id: 'qrcode',
      label: 'QR Code',
      icon: <QrCode className="h-4 w-4" />,
      content: (
        <div className="p-4">
          <QrCodeV2 estabelecimentoId={id} slug={estabelecimento.slug} />
        </div>
      ),
    },
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: <Settings2 className="h-4 w-4" />,
      content: (
        <div className="p-4">
          {editor.cardapio ? (
            <ConfiguracoesCardapio cardapio={editor.cardapio} onAtualizado={editor.setCardapio} />
          ) : (
            <p className="text-sm text-neutral-400">Carregando…</p>
          )}
        </div>
      ),
    },
    {
      id: 'aparencia',
      label: 'Aparência',
      icon: <Palette className="h-4 w-4" />,
      // Controles + preview lado a lado, mesmo padrão de customizador ao
      // vivo do WordPress Customizer / editor de temas do Shopify: cada
      // ajuste aparece na hora do lado, "Salvar" é uma ação separada da
      // edição em si (ver AparenciaEditor.tsx).
      content: !editor.cardapio ? (
        <p className="p-4 text-sm text-neutral-400">Carregando…</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 p-4 lg:grid-cols-[360px_1fr]">
          <div className="flex flex-col gap-4">
            <AparenciaEditor cardapio={editor.cardapio} onAtualizado={editor.setCardapio} />
          </div>
          <div>
            {editor.categorias.length > 1 && (
              <select
                value={editor.categoriaSelecionadaId ?? ''}
                onChange={(e) => editor.setCategoriaSelecionadaId(e.target.value)}
                className="mb-3 w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm"
              >
                {editor.categorias.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.nome}</option>
                ))}
              </select>
            )}
            <PreviewAoVivo categoria={categoriaSelecionada} cardapio={editor.cardapio} />
          </div>
        </div>
      ),
    },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 p-4 text-neutral-900 md:p-6">
      <div className="mx-auto max-w-6xl">
        <CabecalhoGerenciar
          estabelecimento={estabelecimento}
          usuarioNome={usuarioNome}
          usuarioLogadoId={usuarioLogadoId}
          ehDonoOuGerente={ehDonoOuGerente}
          podeEditar={podeEditar}
          aoVoltar={() => router.push(`/painel/estabelecimento/${id}/gerenciar`)}
          tituloPagina={{ icone: <FlaskConical className="h-full w-full" />, texto: 'Cardápio V2 (piloto)' }}
          contaAberta={contaAberta}
          onAbrirConta={() => setContaAberta(true)}
          onFecharConta={() => setContaAberta(false)}
        />

        <AbasResponsivas tabs={tabs} defaultTab="itens" />
      </div>
    </div>
  )
}
