'use client'

import { useState, ReactNode } from 'react'

interface Tab {
  id: string
  label: string
  icon?: ReactNode
  content: ReactNode
}

interface TabsContainerProps {
  tabs: Tab[]
  defaultTab?: string
}

export default function TabsContainer({ tabs, defaultTab }: TabsContainerProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id || '')

  return (
    // Sem overflow-hidden aqui de propósito: ele quebra `position: sticky`
    // de qualquer coisa dentro do conteúdo da aba (cria um novo contexto de
    // scroll que o sticky não atravessa até a janela). As bordas
    // arredondadas ficam garantidas nos dois blocos internos em vez disso.
    <div className="rounded-2xl border border-neutral-100 bg-white text-gray-900 shadow-sm">
      <div className="rounded-t-2xl border-b border-neutral-100 bg-white">
        <nav className="flex gap-1 overflow-x-auto px-2 pt-2" aria-label="Tabs">
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
