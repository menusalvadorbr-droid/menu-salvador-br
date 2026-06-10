'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = 'Descreva seu estabelecimento...',
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) return null

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Barra de ferramentas */}
      <div className="flex gap-1 border-b px-2 py-1 bg-gray-50 flex-wrap">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('bold') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}><strong>B</strong></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('italic') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}><em>I</em></button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('bulletList') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}>• Lista</button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`px-2 py-1 text-sm rounded ${editor.isActive('orderedList') ? 'bg-gray-300' : 'hover:bg-gray-200'}`}>1. Lista</button>
        <span className="border-l mx-1"></span>
        <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`px-2 py-1 text-sm rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : 'hover:bg-gray-200'}`}>⬅️</button>
        <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`px-2 py-1 text-sm rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : 'hover:bg-gray-200'}`}>⏺️</button>
        <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`px-2 py-1 text-sm rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : 'hover:bg-gray-200'}`}>➡️</button>
        <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={`px-2 py-1 text-sm rounded ${editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-300' : 'hover:bg-gray-200'}`}>📄</button>
      </div>
      <EditorContent editor={editor} className="prose max-w-none p-3 min-h-[150px] focus:outline-none" />
    </div>
  )
}