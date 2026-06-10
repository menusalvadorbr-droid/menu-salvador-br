// src/app/painel/components/LanguageTabs.tsx
'use client'

interface LanguageTabsProps {
  active: string
  onChange: (lang: string) => void
  enabled: string[] // ['pt', 'en', 'es']
}

export function LanguageTabs({ active, onChange, enabled }: LanguageTabsProps) {
  const labels: Record<string, string> = {
    pt: '🇵🇹 PT',
    en: '🇺🇸 EN',
    es: '🇪🇸 ES',
  }
  return (
    <div className="flex gap-1 border-b mb-3">
      {enabled.map(lang => (
        <button
          key={lang}
          onClick={() => onChange(lang)}
          className={`px-3 py-1.5 text-sm font-medium rounded-t-lg transition ${
            active === lang
              ? 'bg-orange-100 text-orange-700 border-b-2 border-orange-500'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
          }`}
        >
          {labels[lang]}
        </button>
      ))}
    </div>
  )
}