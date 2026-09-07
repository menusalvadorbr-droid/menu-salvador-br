# Cardápio V2 — Visão do Cardápio Ideal

## Contexto
O Cardápio V1 (Menu Salvador) cresceu por correções pontuais e acumulou dívida técnica:
editor monolítico (~1000 linhas, 35 states), salvamento em 5 escritas não-transacionais,
promoção fragmentada em 3 mecanismos paralelos, variação/complemento funcionando só no
carrinho do cliente (não em garçom/balcão/caixa/estoque).

O Cardápio V2 é construído do zero, em paralelo ao V1 (que continua existindo), no
**mesmo projeto** (não outro repositório), com isolamento por pasta/rota/prefixo de tabela.

## Princípio geral
Construir o cardápio em si primeiro, bem feito, com tudo liberado. Sistema de planos e
travas de monetização ficam para depois — o único cuidado necessário agora é preparar o
terreno para não precisar reescrever nada quando esse momento chegar.

## Isolamento em relação ao V1
- Rotas: `app/gerenciar/cardapio-v2/...` e `app/[slug]/cardapio-v2/...`
- Tabelas Supabase com prefixo `cardapio_v2_`
- Código em `lib/cardapio-v2/` e `components/cardapio-v2/`
- `CLAUDE.md` do projeto orientando a nunca editar arquivos do V1 ao trabalhar no V2

## Modelo de dados (schema novo)
- `cardapio_v2_cardapios` — suporta múltiplos cardápios por estabelecimento (ex:
  presencial e delivery como cardápios distintos, ou um só marcado para os dois)
- `cardapio_v2_categorias` — com ordem customizável
- `cardapio_v2_itens` — nome, descrição, foto, preço
- `cardapio_v2_variacoes` — tamanho/preço, como entidade própria do item (não do carrinho)
- `cardapio_v2_grupos_complemento` — reutilizáveis entre itens, com regras de
  mínimo/máximo de escolha
- `cardapio_v2_regras_exibicao` — disponibilidade + promoção + destaque unificados numa
  única tabela (resolve a fragmentação em 3 mecanismos do V1)
- Tabela de traduções com campo `origem` (`manual` | `ia`) — mesmo campo aguenta
  tradução manual hoje e automática por IA depois, sem mudar schema
- Preço por canal (`item_precos: item_id, canal, preco`) se um mesmo item variar de
  preço entre presencial e delivery

## Editor (painel de controle)
- Componentes pequenos e isolados por responsabilidade: `ItemForm`, `VariacaoEditor`,
  `GrupoComplementoEditor`, `CategoriaManager`, `TraducaoEditor`
- Salvamento transacional via uma única RPC/stored procedure no Supabase (item +
  variações + complementos numa chamada só, não 5 escritas soltas)
- Preview ao vivo enquanto edita
- Reordenação de categorias/itens por drag-and-drop
- Toggle rápido de disponibilidade direto na lista, sem abrir o formulário completo

## Exibição pública (cliente via QR)
- Server-rendered, leve, otimizado para carregar rápido em 4G
- Alérgenos e tradução nativos no cadastro do item (não plugados depois)
- QR do estabelecimento (QR por mesa fica fora do escopo do cardápio — é feature de
  outro módulo, ver abaixo)

## Funcionalidades do cardápio em si (sem depender de plano/pagamento)
- Categorias e itens completos, com foto, descrição, preço
- Variação de tamanho/preço funcionando igual em qualquer lugar que o dado for lido
- Grupos de complemento reutilizáveis, com regras de escolha
- Disponibilidade e promoção agendada (uma única fonte de verdade)
- Alérgenos e observação nutricional
- Tradução manual (e, no campo já preparado, futura tradução automática)
- Tags livres por item
- Cardápio delivery como vitrine (mostra itens/preço por canal, sem carrinho)
- Contagem simples de acesso ao QR

## Fora do escopo do cardápio (pertence a outro módulo)
- QR por mesa + chamar garçom
- Carrinho e fechamento de pedido (presencial ou delivery)
- AI Waiter Chat / integração com IA no WhatsApp
- Qualquer coisa de plano, trial, ou permissão granular por função

Essas features existem no roadmap do produto, mas não devem ser desenhadas dentro do
cardápio agora — evita reabrir a complexidade de plano/permissão que travou a decisão
anterior.

## O único gancho para o futuro (não é sistema de plano, é um hábito)
Toda função do cardápio que algum dia pode virar paga passa por um único ponto de
checagem, mesmo que hoje sempre libere:

```ts
// lib/cardapio-v2/permissoes.ts
export function podeUsar(estabelecimento, chaveFuncao: string): boolean {
  return true; // hardcoded por enquanto
}
```

As telas do cardápio chamam `podeUsar()` em vez de assumir acesso livre. Quando um
sistema de plano de fato for construído, a mudança acontece inteira dentro dessa função
— nenhuma tela do cardápio precisa ser tocada.

## Ordem de construção sugerida
1. Schema novo (`cardapio_v2_*`) + RPC transacional de salvamento
2. Página pública de exibição (sem editor — popular dado manualmente no Supabase Studio
   primeiro, validar layout e performance)
3. Editor completo, componentizado, plugando na RPC
4. Gerar QR do estabelecimento apontando para a rota nova
5. Piloto com 1 estabelecimento real, rodando em paralelo ao V1

- Armazenamento de imagem: Cloudflare R2. Nunca usar Cloudinary no V2.
- Transformação de imagem (resize, crop, conversão de formato/qualidade): Cloudflare Image Transformations, apontando para a origem no R2. Nunca usar o otimizador de imagem padrão do Vercel/Next.js sem passar por um loader customizado que gere URLs da Cloudflare.
- Motivo: a URL da Cloudflare (R2 + Image Transformations) é a fonte única de verdade da imagem em todo o sistema — cardápio público, painel do dono, AI Waiter Chat no WhatsApp. Não criar um caminho de imagem paralelo amarrado a um componente específico do frontend.
- Se usar o componente `<Image>` do Next.js: configurar `loader: "custom"` apontando para a URL `cdn-cgi/image` da Cloudflare. Nunca deixar no loader padrão do Vercel.


### Escopo — não confundir com o V1
- O Cardápio V1 continua em Cloudinary e não é migrado.
- Não usar o código de imagem do V1 como referência de padrão ao escrever código novo do V2 — são arquiteturas diferentes coexistindo no mesmo repositório. tudo novo de imagens agora será na cloudflare