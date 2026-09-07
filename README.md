# Menu Salvador BR

diretório de bares e restaurantes em Salvador.

## Imagens — Cardápio V2

- Armazenamento de imagem: Cloudflare R2. Nunca usar Cloudinary no V2.
- Transformação de imagem (resize, crop, conversão de formato/qualidade): Cloudflare Image Transformations, apontando para a origem no R2. Nunca usar o otimizador de imagem padrão do Vercel/Next.js sem passar por um loader customizado que gere URLs da Cloudflare.
- Motivo: a URL da Cloudflare (R2 + Image Transformations) é a fonte única de verdade da imagem em todo o sistema — cardápio público, painel do dono, AI Waiter Chat no WhatsApp. Não criar um caminho de imagem paralelo amarrado a um componente específico do frontend.
- Se usar o componente `<Image>` do Next.js: configurar `loader: "custom"` apontando para a URL `cdn-cgi/image` da Cloudflare. Nunca deixar no loader padrão do Vercel.


### Escopo — não confundir com o V1
- O Cardápio V1 continua em Cloudinary e não é migrado.
- Não usar o código de imagem do V1 como referência de padrão ao escrever código novo do V2 — são arquiteturas diferentes coexistindo no mesmo repositório. tudo novo de imagens agora será na cloudflare