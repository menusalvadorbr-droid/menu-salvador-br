// src/app/painel/components/TagInput.tsx
'use client'

import { useState, KeyboardEvent } from 'react'

interface TagInputProps {
  value: string[]      // lista de tags
  onChange: (tags: string[]) => void
  placeholder?: string
}

export function TagInput({ value, onChange, placeholder = 'Adicionar tag...' }: TagInputProps) {
  const [input, setInput] = useState('')

  const addTag = () => {
    const tag = input.trim()
    if (tag && !value.includes(tag)) {
      onChange([...value, tag])
      setInput('')
    }
  }

  const removeTag = (tag: string) => {
    onChange(value.filter(t => t !== tag))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className="border rounded-lg p-2 bg-white">
      <div className="flex flex-wrap gap-1 mb-1">
        {value.map(tag => (
          <span key={tag} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-0.5 rounded-full">
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="text-gray-500 hover:text-red-500">×</button>
          </span>
        ))}
      </div>
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 outline-none text-sm bg-transparent"
        />
        <button type="button" onClick={addTag} className="text-orange-500 text-sm font-medium">+ Adicionar</button>
      </div>
    </div>
  )
}