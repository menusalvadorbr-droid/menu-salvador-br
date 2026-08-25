import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Privacidade | menu.salvador',
  description: 'Como o menu.salvador coleta, usa e protege os dados de quem faz pedidos pela plataforma.',
}

const EMAIL_CONTATO = 'menusalvadorbr@gmail.com'

export default function PoliticaDePrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-neutral-900">Política de Privacidade</h1>
      <p className="mt-1 text-sm text-neutral-400">Última atualização: 25 de agosto de 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-neutral-700">
        <section>
          <p>
            O <strong>menu.salvador</strong> é uma plataforma de cardápio digital que conecta clientes a
            estabelecimentos (restaurantes, lanchonetes e afins). Esta política explica quais dados
            coletamos quando você usa o site ou faz um pedido, para que servem e como você pode pedir
            para removê-los.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">Quais dados coletamos</h2>
          <p className="mt-2">
            Quando você faz um pedido pelo cardápio digital de um estabelecimento, ou conversa com o
            assistente de atendimento (inclusive pelo WhatsApp), podemos coletar:
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Nome</li>
            <li>Telefone (incluindo número de WhatsApp, quando o atendimento acontece por lá)</li>
            <li>Endereço de entrega, quando o pedido é para entrega</li>
            <li>Os itens do pedido e observações que você escrever</li>
            <li>Mensagens trocadas com o assistente de atendimento, quando aplicável</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">Para que usamos esses dados</h2>
          <p className="mt-2">Usamos esses dados exclusivamente para:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Processar e entregar o seu pedido ao estabelecimento correto</li>
            <li>Permitir que o estabelecimento entre em contato sobre o pedido, quando necessário</li>
            <li>Responder dúvidas sobre o cardápio pelo assistente de atendimento (site e/ou WhatsApp)</li>
            <li>Manter o histórico de pedidos, pro estabelecimento operar (ex: controle de estoque, caixa)</li>
          </ul>
          <p className="mt-2">
            Não usamos seus dados para nenhuma outra finalidade além dessas.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">Com quem compartilhamos</h2>
          <p className="mt-2">
            Seus dados de pedido ficam visíveis para o estabelecimento onde você pediu — é o que permite
            o pedido ser preparado e entregue. <strong>Não vendemos nem alugamos seus dados a terceiros.</strong>{' '}
            Não compartilhamos seus dados com outros estabelecimentos além daquele onde você fez o
            pedido.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">Como excluir seus dados</h2>
          <p className="mt-2">
            Você pode pedir a exclusão dos seus dados pessoais a qualquer momento. Veja o passo a passo
            na página{' '}
            <Link href="/exclusao-de-dados" className="font-medium text-orange-600 hover:underline">
              Exclusão de Dados
            </Link>
            , ou escreva direto para{' '}
            <a href={`mailto:${EMAIL_CONTATO}`} className="font-medium text-orange-600 hover:underline">
              {EMAIL_CONTATO}
            </a>
            . Se você é dono de um estabelecimento cadastrado, também pode excluir sua conta diretamente
            pelo painel, em Perfil → Privacidade e dados.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">Dúvidas</h2>
          <p className="mt-2">
            Qualquer dúvida sobre esta política ou sobre como tratamos seus dados, escreva para{' '}
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
