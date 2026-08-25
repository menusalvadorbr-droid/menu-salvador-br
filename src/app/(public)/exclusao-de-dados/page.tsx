import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Exclusão de Dados | menu.salvador',
  description: 'Como solicitar a exclusão dos seus dados pessoais no menu.salvador.',
}

const EMAIL_CONTATO = 'menusalvadorbr@gmail.com'

export default function ExclusaoDeDadosPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-neutral-900">Exclusão de Dados</h1>
      <p className="mt-1 text-sm text-neutral-400">Última atualização: 25 de agosto de 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-neutral-700">
        <section>
          <p>
            Você pode pedir a exclusão dos seus dados pessoais (nome, telefone, endereço, histórico de
            pedidos e conversas com o assistente de atendimento) coletados pelo menu.salvador a qualquer
            momento.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">Se você é cliente</h2>
          <p className="mt-2">
            Envie um e-mail para{' '}
            <a href={`mailto:${EMAIL_CONTATO}`} className="font-medium text-orange-600 hover:underline">
              {EMAIL_CONTATO}
            </a>{' '}
            com o assunto <strong>&quot;Exclusão de dados&quot;</strong>, informando:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Seu nome completo</li>
            <li>O número de telefone usado no pedido (ou no WhatsApp)</li>
            <li>Se possível, o nome do estabelecimento onde você fez o pedido</li>
          </ul>
          <p className="mt-2">
            Vamos localizar e excluir seus dados pessoais em até 15 dias. Pedidos já concluídos podem
            manter um registro sem dados pessoais (só valores e itens, sem seu nome/telefone/endereço),
            para o estabelecimento manter o histórico financeiro exigido por lei.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">Se você é dono de um estabelecimento</h2>
          <p className="mt-2">
            Se você tem uma conta no painel do menu.salvador, pode excluir sua própria conta e todos os
            dados vinculados diretamente por lá, sem precisar de e-mail: entre no painel, vá em{' '}
            <Link href="/login" className="font-medium text-orange-600 hover:underline">
              Perfil
            </Link>{' '}
            → &quot;Privacidade e dados&quot; → &quot;Excluir minha conta&quot;. Essa ação é imediata e
            não pode ser desfeita.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">Dúvidas</h2>
          <p className="mt-2">
            Qualquer dúvida sobre esse processo, escreva para{' '}
            <a href={`mailto:${EMAIL_CONTATO}`} className="font-medium text-orange-600 hover:underline">
              {EMAIL_CONTATO}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  )
}
