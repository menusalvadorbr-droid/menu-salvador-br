'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// Prefixos que NÃO são estabelecimentos/cidades públicas (rotas do sistema)
const PREFIXOS_SISTEMA = [
  'painel', 'admin', 'login', 'signup', 'claim', 'estabelecimentos',
  'definir-senha', 'recuperar-acesso', 'reset-password', 'unauthorized', 'menu',
]

/**
 * Resolve os nomes reais (nome_fantasia, nome da cidade/bairro/culinária) para
 * exibir no breadcrumb, em vez de derivar um texto aproximado a partir do slug
 * da URL (ex: "bar-do-zeca" virando "Bar Do Zeca" mesmo quando o nome_fantasia
 * cadastrado é diferente, como "Bar do Zezinho").
 */
function useNomesReais(segments: string[]) {
  const [nomes, setNomes] = useState<Record<number, string>>({})

  useEffect(() => {
    let cancelado = false

    async function resolver() {
      if (segments.length === 0) {
        setNomes({})
        return
      }

      const supabase = createClient()
      const novosNomes: Record<number, string> = {}

      // /cidade/[cidade]/[bairro]/[tipo]/[slug]  → página pública do estabelecimento
      if (segments.length === 4 && !PREFIXOS_SISTEMA.includes(segments[0])) {
        const { data } = await supabase
          .from('estabelecimentos')
          .select('nome_fantasia, nome')
          .eq('slug', segments[3])
          .maybeSingle()
        if (data) novosNomes[3] = data.nome_fantasia || data.nome
      }

      // /cardapio/[slug]
      if (segments[0] === 'cardapio' && segments[1]) {
        const { data } = await supabase
          .from('estabelecimentos')
          .select('nome_fantasia, nome')
          .eq('slug', segments[1])
          .maybeSingle()
        if (data) novosNomes[1] = data.nome_fantasia || data.nome
      }

      // /painel/estabelecimento/[id]/...
      if (segments[0] === 'painel' && segments[1] === 'estabelecimento' && segments[2]) {
        const { data } = await supabase
          .from('estabelecimentos')
          .select('nome_fantasia, nome')
          .eq('id', segments[2])
          .maybeSingle()
        if (data) novosNomes[2] = data.nome_fantasia || data.nome
      }

      // /cidade/[id]  (perfil de cidade)
      if (segments[0] === 'cidade' && segments[1] && segments[1] !== 'bairro') {
        const { data } = await supabase.from('cidades').select('nome').eq('id', segments[1]).maybeSingle()
        if (data) novosNomes[1] = data.nome
      }

      // /cidade/bairro/[id]
      if (segments[0] === 'cidade' && segments[1] === 'bairro' && segments[2]) {
        const { data } = await supabase.from('bairros').select('nome').eq('id', segments[2]).maybeSingle()
        if (data) novosNomes[2] = data.nome
      }

      // /culinaria/[slug]
      if (segments[0] === 'culinaria' && segments[1]) {
        const { data } = await supabase.from('culinarias').select('nome').eq('slug', segments[1]).maybeSingle()
        if (data) novosNomes[1] = data.nome
      }

      if (!cancelado) setNomes(novosNomes)
    }

    resolver()
    return () => {
      cancelado = true
    }
  }, [segments.join('/')])

  return nomes
}

export default function Breadcrumb() {
  const pathname = usePathname()
  const segments = pathname.split('/').filter(Boolean)
  const nomesReais = useNomesReais(segments)

  // Se estiver na home, não exibe breadcrumb
  if (segments.length === 0) return null

  return (
    <nav className="text-xs text-gray-400 py-2 px-4 bg-white border-b border-gray-100">
      <ol className="flex flex-wrap items-center gap-1 max-w-7xl mx-auto">
        <li>
          <Link href="/" className="hover:text-gray-600 transition">Home</Link>
        </li>
        {segments.map((seg, i) => {
          const href = '/' + segments.slice(0, i + 1).join('/')
          const isLast = i === segments.length - 1

          // Usa o nome real resolvido do banco (nome_fantasia etc.) quando
          // disponível; caso contrário cai para o texto derivado do slug.
          const label = nomesReais[i] || seg.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

          return (
            <li key={i} className="flex items-center">
              <span className="mx-1 text-gray-300">/</span>
              {isLast ? (
                <span className="text-gray-700 font-medium">{label}</span>
              ) : (
                <Link href={href} className="hover:text-gray-600 transition">
                  {label}
                </Link>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
