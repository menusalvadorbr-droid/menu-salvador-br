# Estado do Projeto — Menu Salvador

> Visão geral de produto + arquitetura + o que já foi feito + o que falta.
> Detalhe técnico do Cardápio V2 fica em `cardapio-v2-visao.md`; regras de
> isolamento V1/V2 ficam em `AGENTS.md`. Este arquivo é o mapa de cima.
> Atualizado em 2026-09-07.

## 1. O que é o produto

Menu Salvador é um diretório de bares/restaurantes de Salvador (menu.salvador.br)
com cardápio digital por QR code, pedidos e — na próxima fase — atendimento por
IA no WhatsApp.

**Estratégia de aquisição** (decidida nesta fase, ainda não em execução real):
- Sem time de vendas. Uma ferramenta de CRM **externa a este repositório** faz
  outreach convidando donos a reivindicar o estabelecimento num domínio raro
  (menu.salvador.br) e usar o **cardápio digital de graça**.
- Primeiro upsell depois da adesão: **delivery com carrinho + atendimento por
  IA no WhatsApp** — não é uma feature distante, é o próximo passo direto em
  cima do que já existe.
- Segundo upsell: um CRM de ofertas/contatos pro dono gerenciar sua própria
  base de clientes — ainda não desenhado ("analisar ainda").
- O contrato entre o CRM externo e o fluxo de reivindicação desta plataforma
  também ainda não foi decidido ("decidir depois").

**Fase atual**: elaboração — construir o produto inteiro, testado, em
ambiente simulado, antes de qualquer lançamento real com estabelecimento de
verdade. Não há cliente pagante nem uso real em produção ainda.

## 2. Arquitetura geral

- Next.js 16 (App Router, Turbopack), React 19, Supabase (Postgres + RLS +
  RPC), Tailwind 4.
- Grupos de rota: `(public)` (diretório/home), `(public-cardapio)` (cardápio
  do cliente final, V1 e V2), `(dashboard)/painel` (dono/equipe), `(admin)`
  (superadmin da plataforma), `(auth)` (login/signup).
- **V1 e V2 do cardápio coexistem no mesmo repositório.** V1 é o cardápio
  original, com dívida técnica conhecida (editor monolítico, salvamento não
  transacional, promoção fragmentada). V2 é reconstrução isolada, tabelas
  `cardapio_v2_*`, pensada pra V1 poder ser desligado quando V2 absorver tudo
  de bom que ele tem — ver `AGENTS.md` pra regra de isolamento (nunca tocar
  código/tabela do V1 a partir de uma tarefa do V2 sem confirmar antes).
- Infra **genérica** (não é "domínio do cardápio", é reaproveitável por
  qualquer um dos dois): `orders`, `pedidos_acompanhamento`,
  `src/modules/pedidos/**`, `fila_operador`, `CentralOperador.tsx`,
  `PainelComandas.tsx`, `funcionarios`, `estabelecimentos`, sistema de tema
  (`--brand-primary`/`--brand-secondary`, `TraducaoCardapio.tsx`).

## 3. Cardápio V2 — estado

Detalhe completo em `cardapio-v2-visao.md`. Resumo:
- Schema, editor (itens/variações/complementos/regras de exibição/tradução),
  exibição pública, aparência customizável e QR — completos.
- **Carrinho de delivery**: implementado nesta fase, reaproveitando 100% a
  infra de pedidos do cliente que já existia pro V1 (`CarrinhoProvider`,
  `useSacola`, `SacolaDrawer`, `FinalizarPedidoModal`, `BotaoAdicionarCarrinho`,
  `PixPagamentoCard`) — só a ponte de dados é nova
  (`src/modules/cardapioV2/carrinhoAdapter.ts`). Aceita Pix (QR aparece direto
  na confirmação do pedido, não só depois). Endereço com busca de CEP
  (ViaCEP). Cupom deixado só como campo pronto no schema (`orders.desconto`),
  sem lógica de validação — combinado explicitamente.
- **Histórico "Meus pedidos"**: por navegador (localStorage), sem conta de
  cliente — limitação conhecida e aceita (ver `pedidoAcompanhamentoStorage.ts`).
- **WhatsApp Embedded Signup**: UI completa (toggle admin +
  `ConexaoAutomaticaWhatsApp.tsx` no painel do dono), mas a integração real
  com a Meta ainda não existe — depende de aprovação como Tech Provider.
  Ativação é uma flag (`platform_settings.whatsapp_embedded_signup_ativado`),
  não vira código quando aprovar.
- **Carrinho nativo do WhatsApp**: adiado de propósito — só depois da
  aprovação da Meta. A IA no WhatsApp continua só respondendo dúvida (Q&A),
  sem montar pedido por conversa nesta fase.

## 4. Auditoria de design/UX — o que já foi corrigido

Nasceu de três análises de design (uma genérica e descartada por
contraditória, duas verificadas linha por linha contra o código real antes de
agir). Já corrigido:

- **Login/signup**: casca de marca (wordmark + gradiente `135deg,
  var(--brand-primary), var(--brand-secondary)`), `<label>` de verdade nos
  campos, `neutral-*` em vez de `gray-*`.
- **Rodapé/breadcrumb do cardápio**: removidos de `/cardapio` e
  `/cardapio-v2` (QR na mesa não precisa de trilha de navegação do site) —
  só um crédito discreto "Powered by menu.salvador" em 11px ficou.
- **Hero do cardápio unificado**: `CardapioHero.tsx` extraído e reaproveitado
  tanto na página real quanto no preview do editor de tema — antes eram dois
  layouts diferentes (título centralizado vs ancorado no topo) e o mesmo véu
  de opacidade podia parecer legível num e ilegível no outro. Corrigido de
  raiz ao virar o mesmo componente.
- **Carrinho**: zonas de toque de 28px → 44px, estado vazio com CTA em vez
  de texto solto.
- **Acessibilidade**: `role="dialog"` + `aria-modal` + `aria-label` em 21 dos
  23 modais do projeto; teclado (Enter/Espaço) nos 5 toggles `role="switch"`.
- **Arquitetura**: `LancarPedidoGarcom.tsx` (tela de lançar pedido da
  equipe) caiu de 713 para 457 linhas, dividido em
  `SeletorCardapioGarcom`/`PainelPagamentoGarcom`/`LinhaCarrinhoGarcom`/
  `estilosGarcom.ts` — testado ao vivo (mesa e Caixa/Pix) depois da mudança.

## 5. Pendente, por esforço

**Em andamento / próximo**:
- `alert()` nativo → `ConfirmarAcaoModal` (o componente já existe, ~47
  chamadas ainda usam o nativo do navegador).

**Baixo/médio esforço, ainda não iniciado**:
- Unificar os 3 padrões visuais de aba (`TabsContainer`, `AbasPainel` —
  pílula preta, foge da cor de marca —, `AbasResponsivas`).
- Unificar os 4 componentes de upload de imagem (dois arquivos chamados
  `ImageUpload.tsx` em pastas diferentes, mais `GaleriaUpload.tsx`, mais
  `UploadImagemV2.tsx`).
- Tema do cardápio via CSS variables num wrapper, em vez de props furadas
  por vários níveis de componente (vivido na prática construindo o carrinho
  V2 — `cardapio.cor_primaria` passa por 3 camadas só pra colorir um botão).

**Maior esforço / decisão de produto, não é só código**:
- Tokens de marca próprios (paleta inspirada em terracota/azulejo/creme) em
  vez do laranja-Tailwind genérico — é reposicionamento visual, não bug.
- `components/ui` de verdade (Button, Input, Modal, Toast, Tabs) — os itens
  de aba/upload/`alert()` acima deveriam nascer dentro disso, não corrigidos
  um a um.
- Contrato entre o CRM externo (outreach) e o fluxo de reivindicação desta
  plataforma — "decidir depois", ainda em aberto.
- CRM de ofertas/contatos pro dono (segundo upsell do roadmap) — "analisar
  ainda", sem desenho nenhum feito.
- Carrinho nativo do WhatsApp + atendimento por IA fazendo pedido por
  conversa — bloqueado até aprovação da Meta como Tech Provider.

## 6. Regras pra quem mexer no código depois

- `AGENTS.md`: nunca ler/importar/modificar código ou tabela de domínio do
  V1 (`CardapioTab.tsx`, abas de `editar/`, `menus`, `categorias`,
  `itens_cardapio`, `resolverItemCardapio.ts`, `cardapioCache.ts`) a partir
  de uma tarefa do V2 sem confirmar antes. Infra genérica (pedidos,
  funcionários, tema, upload) continua liberada pros dois.
- Usar `var(--brand-primary)`/`var(--brand-secondary)` em vez de
  `orange-600` hardcoded em código público novo.
- Imagem nova do V2: sempre Cloudflare R2 + Image Transformations, nunca
  Cloudinary (ver `README.md`).
- `podeUsar(estabelecimento, chaveFuncao)` é o único gancho de monetização
  futura — hoje sempre `true`, telas do cardápio já chamam por ele em vez de
  assumir acesso livre.
- Antes de considerar qualquer mudança pronta: `tsc --noEmit`, `eslint` nos
  arquivos tocados, `next build` — nessa ordem, sempre. Refactor de tela
  usada por equipe (garçom/caixa) pede teste ao vivo além disso.
