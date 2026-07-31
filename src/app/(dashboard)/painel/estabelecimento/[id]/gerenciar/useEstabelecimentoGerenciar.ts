'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { logSupabaseError } from '@/lib/supabase/logError'

/**
 * Carregamento + checagem de acesso compartilhados entre as telas de
 * gerenciar (início, cardápio, gestão) — extraído daqui pra não triplicar
 * essa mesma lógica (autenticação, papel do usuário, RLS por cargo) em
 * cada uma das três páginas que agora existem nessa área.
 */
export function useEstabelecimentoGerenciar(id: string) {
  const router = useRouter()
  // Inicializador preguiçoso do useState (roda só na primeira renderização)
  // em vez de useRef — mesmo efeito de estabilizar a referência do cliente
  // entre renderizações, sem acessar `.current` durante o render (o que o
  // eslint-plugin-react-hooks passou a reportar como erro dentro de hooks).
  const [supabase] = useState(() => createClient())

  const [estabelecimento, setEstabelecimento] = useState<any>(null)
  const [usuarioLogadoId, setUsuarioLogadoId] = useState<string>('')
  const [usuarioNome, setUsuarioNome] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [cargo, setCargo] = useState<string | null>(null) // null = é o dono
  const [acessoNegado, setAcessoNegado] = useState(false)
  // Recursos do plano atribuído pelo admin (ex: 'qr_mesa') — não é algo
  // que o dono liga sozinho, é herdado daqui pra gatear módulos opcionais.
  const [recursosPlano, setRecursosPlano] = useState<string[]>([])

  useEffect(() => {
    async function carregar() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }
      setUsuarioLogadoId(user.id)
      // Mesmo campo já usado na saudação da tela de boas-vindas
      // (BemVindoPainel) — nome de exibição com fallback pro email.
      setUsuarioNome(user.user_metadata?.full_name || user.email || '')

      const { data, error } = await supabase
        .from('estabelecimentos')
        .select('*')
        .eq('id', id)
        .single()

      if (error || !data) {
        logSupabaseError('Erro ao carregar estabelecimento:', error)
        router.push('/painel')
        return
      }

      // Determinar o papel do usuário atual nesse estabelecimento:
      // dono (owner_user_id bate), super_admin (acesso total, sem
      // precisar de vínculo), funcionário (tem vínculo ativo) ou
      // nenhum dos três (acesso negado).
      if (data.owner_user_id === user.id) {
        setCargo(null) // dono enxerga tudo
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

        if (profile?.role === 'super_admin') {
          setCargo(null) // admin enxerga e edita como se fosse o dono
        } else {
          const { data: vinculo } = await supabase
            .from('funcionarios')
            .select('cargo')
            .eq('estabelecimento_id', id)
            .eq('user_id', user.id)
            .eq('ativo', true)
            .maybeSingle()

          if (!vinculo) {
            setAcessoNegado(true)
            setLoading(false)
            return
          }
          setCargo(vinculo.cargo)
        }
      }

      setEstabelecimento(data)

      if (data.plano_id) {
        const { data: plano } = await supabase
          .from('planos')
          .select('recursos')
          .eq('id', data.plano_id)
          .maybeSingle()
        setRecursosPlano(plano?.recursos || [])
      }

      setLoading(false)
    }

    carregar()
  }, [id, router])

  // Regras de visibilidade por papel:
  // - Dono (cargo === null) e Gerente: veem e editam tudo, inclusive
  //   dados administrativos do estabelecimento e a equipe.
  // - Caixa e Garçom: só consultam o cardápio (não editam).
  // - Cozinha: só consulta o cardápio também (sem tela de pedidos por
  //   enquanto — a operação de pedidos não está disponível nesse painel).
  const ehDonoOuGerente = cargo === null || cargo === 'gerente'
  const podeEditarCardapio = ehDonoOuGerente
  // Edição fica liberada tanto quando já está público ('active') quanto
  // durante a análise da reivindicação ('em_analise') — é exatamente
  // nesse segundo estado que o dono está preenchendo os dados pela
  // primeira vez. Só fica travado mesmo quando 'blocked'.
  const podeEditar = !!estabelecimento && (estabelecimento.status === 'active' || estabelecimento.status === 'em_analise')
  const emAnalise = estabelecimento?.status === 'em_analise'

  return {
    router,
    supabase,
    estabelecimento,
    setEstabelecimento,
    usuarioLogadoId,
    usuarioNome,
    loading,
    cargo,
    acessoNegado,
    ehDonoOuGerente,
    podeEditarCardapio,
    podeEditar,
    emAnalise,
    recursosPlano,
  }
}
