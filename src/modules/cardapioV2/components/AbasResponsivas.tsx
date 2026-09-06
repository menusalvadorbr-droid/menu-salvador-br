'use client'

import { useState, type ReactNode } from 'react'
import { Menu, X, ChevronDown } from 'lucide-react'

interface Aba {
  id: string
  label: string
  icon?: ReactNode
  content: ReactNode
}

/**
 * Mesma ideia do TabsContainer (src/app/(dashboard)/painel/components/),
 * mas com menu ☰ dedicado pra mobile em vez de comprimir as abas numa
 * barra horizontal com scroll — o cardápio V2 tem 5 abas, cabe mal numa
 * tela pequena. Componente próprio do módulo em vez de alterar o
 * TabsContainer compartilhado (usado pelo V1 e outros módulos também).
 */
export default function AbasResponsivas({ tabs, defaultTab }: { tabs: Aba[]; defaultTab?: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '')
  const [menuAberto, setMenuAberto] = useState(false)
  const abaAtual = tabs.find((t) => t.id === activeTab) ?? tabs[0]

  return (
    <div className="rounded-2xl border border-neutral-100 bg-white text-gray-900 shadow-sm">
      {/* Desktop/tablet — barra horizontal, mesmo visual do TabsContainer */}
      <div className="hidden rounded-t-2xl border-b border-neutral-100 bg-white sm:block">
        <nav className="flex gap-1 overflow-x-auto px-2 pt-2" aria-label="Abas">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-lg border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'border-orange-500 bg-orange-50/60 text-orange-700'
                  : 'border-transparent text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Mobile — botão ☰ que abre a lista de abas */}
      <div className="relative border-b border-neutral-100 sm:hidden">
        <button
          onClick={() => setMenuAberto((v) => !v)}
          className="flex w-full items-center justify-between gap-2 px-4 py-3"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-orange-700">
            {abaAtual?.icon}
            {abaAtual?.label}
          </span>
          {menuAberto ? <X className="h-5 w-5 text-neutral-500" /> : <Menu className="h-5 w-5 text-neutral-500" />}
        </button>

        {menuAberto && (
          <nav className="border-t border-neutral-100" aria-label="Abas">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                  setMenuAberto(false)
                }}
                className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm font-medium ${
                  activeTab === tab.id ? 'bg-orange-50/60 text-orange-700' : 'text-neutral-600'
                }`}
              >
                {tab.icon}
                {tab.label}
                {activeTab === tab.id && <ChevronDown className="ml-auto h-4 w-4" />}
              </button>
            ))}
          </nav>
        )}
      </div>

      {/* Todas as abas ficam montadas (só escondidas via CSS), mesmo padrão
          do TabsContainer — trocar de aba não perde estado nem refaz busca
          de dados de quem já carregou. */}
      <div className="rounded-b-2xl p-3 text-gray-900 sm:p-6">
        {tabs.map((tab) => (
          <div key={tab.id} className={activeTab === tab.id ? 'block' : 'hidden'}>
            {tab.content}
          </div>
        ))}
      </div>
    </div>
  )
}
