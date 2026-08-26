-- Marcador de "já mandei o cartão/link de localização nesta conversa" —
-- evita repetir a cada vez que o assunto de endereço volta na mesma
-- conversa em aberto. Reseta pra false quando a conversa é marcada como
-- resolvida (marcarConversaResolvida em atendimentoActions.ts), mesmo
-- controle já usado pra "precisa_humano" — reabrir a conversa depois disso
-- conta como conversa nova pra esse propósito.
alter table public.whatsapp_conversas
  add column if not exists localizacao_enviada boolean not null default false;
