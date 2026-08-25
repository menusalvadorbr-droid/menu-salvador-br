import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Termos de Serviço | menu.salvador',
  description: 'Termos de uso do menu.salvador — o que é a plataforma e as responsabilidades de cada parte.',
}

const EMAIL_CONTATO = 'menusalvadorbr@gmail.com'

export default function TermosDeServicoPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold text-neutral-900">Termos de Serviço</h1>
      <p className="mt-1 text-sm text-neutral-400">Última atualização: 25 de agosto de 2026</p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-neutral-700">
        <section>
          <h2 className="text-lg font-semibold text-neutral-900">O que é o menu.salvador</h2>
          <p className="mt-2">
            O <strong>menu.salvador</strong> é uma plataforma que reúne cardápios digitais de
            estabelecimentos (restaurantes, lanchonetes e afins), permitindo que clientes consultem o
            cardápio, façam pedidos e, quando disponível, conversem com um assistente de atendimento
            (pelo site e/ou WhatsApp) para tirar dúvidas sobre o cardápio. Ao usar o site, você concorda
            com estes termos.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">O que o menu.salvador não é</h2>
          <p className="mt-2">
            O menu.salvador é um intermediário entre você e o estabelecimento — não preparamos, vendemos
            nem entregamos comida. O preparo do pedido, a qualidade dos produtos, o prazo de entrega e o
            atendimento são responsabilidade do estabelecimento escolhido, não nossa.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">Responsabilidades do estabelecimento</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Manter o cardápio (itens, preços, disponibilidade) atualizado e correto</li>
            <li>Cumprir os pedidos recebidos pela plataforma</li>
            <li>Responder pela qualidade dos produtos e pelo atendimento prestado</li>
            <li>Usar os dados dos clientes só para operar os próprios pedidos, nunca repassá-los adiante</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">Responsabilidades do usuário</h2>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Fornecer informações corretas ao fazer um pedido (nome, telefone, endereço)</li>
            <li>Usar a plataforma só para fins legítimos, sem tentar fraudar pedidos ou o sistema</li>
            <li>Tratar o assistente de atendimento e a equipe dos estabelecimentos com respeito</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">Isenção de garantias</h2>
          <p className="mt-2">
            A plataforma é fornecida &quot;como está&quot;, sem garantias de disponibilidade ininterrupta
            ou de que o assistente de atendimento nunca cometerá erros. Fazemos o possível para manter o
            site no ar e as informações corretas, mas não garantimos que o serviço estará livre de
            falhas técnicas.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">Limitação de responsabilidade</h2>
          <p className="mt-2">
            O menu.salvador não se responsabiliza por prejuízos decorrentes da relação entre cliente e
            estabelecimento (atraso na entrega, qualidade do produto, cobrança incorreta feita pelo
            estabelecimento, etc.) — esses casos devem ser resolvidos diretamente com o estabelecimento
            responsável pelo pedido.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">Alterações nestes termos</h2>
          <p className="mt-2">
            Podemos atualizar estes termos periodicamente. Mudanças relevantes serão refletidas na data
            de &quot;última atualização&quot; no topo desta página.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900">Contato</h2>
          <p className="mt-2">
            Dúvidas sobre estes termos? Escreva para{' '}
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
