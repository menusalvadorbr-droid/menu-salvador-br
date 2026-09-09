-- Bug reportado: "duplicate key value violates unique constraint
-- caixa_sessoes_uma_aberta_por_estabelecimento" ao FECHAR o caixa (não ao
-- abrir). fecharCaixa() só faz um UPDATE de status 'aberto' -> 'fechado'
-- na sessão existente (caixaRepository.ts) — não existe nenhum INSERT
-- nesse fluxo, então o único jeito desse UPDATE esbarrar numa constraint
-- "só uma aberta por estabelecimento" é essa constraint não ser, de fato,
-- parcial (`where status = 'aberto'`): se foi criada pelo Table Editor
-- como um UNIQUE comum em (estabelecimento_id, status) — o que o editor
-- visual faz quando se marca duas colunas como "Unique" juntas, já que
-- criar um índice parcial exige SQL manual — ela também proíbe duas
-- linhas 'fechado' do mesmo estabelecimento. Isso nunca falha no primeiro
-- fechamento de caixa da vida do estabelecimento (ainda não existe nenhuma
-- linha 'fechado' antes dela), mas falha a partir do segundo fechamento em
-- diante, quando o UPDATE tenta gravar uma segunda linha (estabelecimento_id,
-- 'fechado') e colide com a primeira — bate exatamente com o sintoma
-- relatado (given caixa_sessoes não tem migration de criação neste
-- diretório, mesmo caso de estabelecimentos: schema nascido no Table
-- Editor, nunca com o índice parcial certo).
--
-- Substitui por um índice único parcial de verdade — só considera linhas
-- com status = 'aberto', então quantas sessões 'fechado' já existirem no
-- histórico do estabelecimento nunca colidem entre si; continua impedindo
-- duas sessões abertas ao mesmo tempo pro mesmo estabelecimento (a regra
-- de negócio que o nome da constraint sempre pretendeu).
--
-- `drop constraint` cobre o caso de ter sido criado como UNIQUE constraint
-- comum (fica registrado em pg_constraint E cria um índice com o mesmo
-- nome); `drop index` cobre o caso de já ter sido criado como índice solto.
-- Um dos dois é no-op dependendo de qual efetivamente existe.
alter table public.caixa_sessoes
  drop constraint if exists caixa_sessoes_uma_aberta_por_estabelecimento;

drop index if exists public.caixa_sessoes_uma_aberta_por_estabelecimento;

create unique index caixa_sessoes_uma_aberta_por_estabelecimento
  on public.caixa_sessoes (estabelecimento_id)
  where status = 'aberto';
