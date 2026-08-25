-- Bug real encontrado ao vivo: a Meta manda duas notificações de webhook
-- pra cada mensagem (confirmado nos logs, sempre em par, ~0,5s de
-- diferença — comportamento normal da Cloud API). A checagem de
-- idempotência em whatsappHandler.ts é "lê os wamids já salvos, depois
-- decide" — não atômica, então as duas notificações concorrentes podem
-- ambas passar pela checagem antes de qualquer uma delas gravar. As duas
-- processam a mesma mensagem, e quem grava por último vence — se uma
-- falhar (rede, erro transitório) e terminar depois da que teve sucesso,
-- o cliente recebe/fica com a resposta de fallback mesmo a IA tendo
-- respondido certo. Ficava mascarado enquanto o processamento era lento
-- (thinking mode ligado), raramente colidindo na prática; expôs assim
-- que a geração ficou mais rápida.
--
-- Fix: reivindica o wamid aqui, atomicamente, ANTES de processar — se o
-- insert falhar (unique violation), outra invocação já está cuidando
-- dessa mensagem, e a atual só retorna sem fazer nada. Constraint do
-- banco garante isso mesmo sob concorrência real, diferente de checar em
-- JS. Só o processamento assíncrono (service role) grava aqui — sem
-- policy de RLS pro painel, mesmo padrão de whatsapp_conversas.
create table if not exists public.whatsapp_wamids_processados (
  wamid text primary key,
  created_at timestamptz not null default now()
);

alter table public.whatsapp_wamids_processados enable row level security;
