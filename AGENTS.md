<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Cardápio V2 — isolamento do V1

O Cardápio V2 (visão em `cardapio-v2-visao.md`) é construído do zero, em paralelo ao
Cardápio V1, que continua em produção e não deve ser tocado.

Ao trabalhar em qualquer arquivo sob `src/modules/cardapioV2/`, `src/components/cardapioV2/`,
`src/app/**/cardapio-v2/**` ou em tabelas `cardapio_v2_*`:

- **Nunca ler, importar ou modificar** código/tabelas do V1: `CardapioTab.tsx` e as demais
  abas em `src/app/(dashboard)/painel/estabelecimento/[id]/editar/`, tabelas `menus`,
  `categorias`, `itens_cardapio`, `src/lib/resolverItemCardapio.ts`, `src/lib/cardapioCache.ts`.
- **Utilitários genéricos/externos continuam liberados para reuso**, por não serem código
  de domínio do cardápio: `ImageUpload.tsx`, `GaleriaUpload.tsx`, `src/lib/cloudinary.ts`,
  `src/lib/supabase/*`, `useEstabelecimentoGerenciar`.
- Se uma tarefa parecer exigir tocar em algo do V1, pare e confirme com o usuário antes.
