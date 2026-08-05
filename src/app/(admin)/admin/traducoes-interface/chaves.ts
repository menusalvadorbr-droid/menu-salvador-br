// Catálogo de todos os textos fixos da interface pública do cardápio (dias
// da semana, rótulos, botões etc.) — o texto em português aqui é só
// referência pro admin traduzir; o texto que realmente aparece pra quem
// visita com idioma=pt continua sendo o hardcoded em cada componente, não
// este. Se um texto for alterado no componente, atualizar aqui também
// (chave igual, senão a tradução salva não bate mais com nada).
export interface ChaveInterface {
  chave: string
  textoPt: string
}

export interface GrupoChaves {
  grupo: string
  chaves: ChaveInterface[]
}

export const GRUPOS_CHAVES: GrupoChaves[] = [
  {
    grupo: 'Geral (reaproveitado em várias telas)',
    chaves: [
      { chave: 'fechar', textoPt: 'Fechar' },
      { chave: 'adicionar', textoPt: 'Adicionar' },
      { chave: 'cancelar', textoPt: 'Cancelar' },
      { chave: 'total_label', textoPt: 'Total' },
      { chave: 'encerrando_breve', textoPt: 'Encerrando em breve' },
      { chave: 'a_partir_de', textoPt: 'a partir de' },
      { chave: 'reivindicar_titulo', textoPt: 'Esse é o seu estabelecimento?' },
      { chave: 'reivindicar_botao', textoPt: 'Reivindicar' },
    ],
  },
  {
    grupo: 'Página do cardápio',
    chaves: [
      { chave: 'culinaria_variada', textoPt: 'Culinária variada' },
      { chave: 'itens_label', textoPt: 'itens' },
      { chave: 'categorias_label', textoPt: 'categorias' },
      { chave: 'voltar_perfil', textoPt: 'Voltar ao perfil' },
      { chave: 'voltar_categorias', textoPt: 'Categorias' },
      { chave: 'reivindicar_texto_cardapio', textoPt: 'Reivindique pra editar o cardápio.' },
      { chave: 'promocoes_hoje', textoPt: 'Promoções de hoje' },
      { chave: 'nenhum_item_disponivel', textoPt: 'Nenhum item disponível' },
      { chave: 'volte_em_breve', textoPt: 'Volte em breve!' },
      { chave: 'promocao_badge', textoPt: 'Promoção' },
      { chave: 'delivery_badge', textoPt: 'Delivery' },
      { chave: 'rodape_aviso', textoPt: 'Cardápio sujeito a alterações. Alérgenos: consulte o atendente em caso de dúvida.' },
    ],
  },
  {
    grupo: 'Status "aberto/fechado"',
    chaves: [
      { chave: 'aberto_agora', textoPt: 'Aberto agora' },
      { chave: 'fechado', textoPt: 'Fechado' },
      { chave: 'abre_as', textoPt: 'Abre às {hora}' },
    ],
  },
  {
    grupo: 'Item clicável / seletor de tamanho e complemento',
    chaves: [
      { chave: 'escolha_tamanho', textoPt: 'Escolha o tamanho' },
      { chave: 'tamanho_label', textoPt: 'Tamanho' },
      { chave: 'obrigatorio_label', textoPt: 'obrigatório' },
      { chave: 'escolha_um_tamanho', textoPt: 'Escolha um tamanho.' },
      { chave: 'grupo_escolha_obrigatorio', textoPt: 'escolha {min} · obrigatório' },
      { chave: 'grupo_escolha_intervalo_obrigatorio', textoPt: 'escolha {min} a {max} · obrigatório' },
      { chave: 'grupo_opcional_ate', textoPt: 'opcional · até {max}' },
      { chave: 'escolha_exatamente', textoPt: 'Escolha exatamente {min} em "{grupo}".' },
      { chave: 'escolha_ate', textoPt: 'Escolha até {max} em "{grupo}".' },
      { chave: 'escolha_entre', textoPt: 'Escolha entre {min} e {max} em "{grupo}".' },
    ],
  },
  {
    grupo: 'Sacola / carrinho',
    chaves: [
      { chave: 'minha_sacola', textoPt: 'Minha Sacola' },
      { chave: 'sacola_vazia', textoPt: 'Sacola vazia' },
      { chave: 'diminuir_quantidade', textoPt: 'Diminuir quantidade' },
      { chave: 'aumentar_quantidade', textoPt: 'Aumentar quantidade' },
      { chave: 'remover_item', textoPt: 'Remover item' },
      { chave: 'finalizar_pedido', textoPt: 'Finalizar Pedido' },
      { chave: 'item_singular', textoPt: 'item' },
    ],
  },
  {
    grupo: 'Finalizar pedido',
    chaves: [
      { chave: 'como_vai_ser', textoPt: 'Como vai ser?' },
      { chave: 'opcao_mesa', textoPt: 'Estou na mesa' },
      { chave: 'opcao_retirada', textoPt: 'Vou retirar' },
      { chave: 'opcao_entrega', textoPt: 'Entrega' },
      { chave: 'seu_nome', textoPt: 'Seu nome *' },
      { chave: 'numero_mesa', textoPt: 'Número da mesa' },
      { chave: 'endereco_entrega', textoPt: 'Endereço de entrega *' },
      { chave: 'taxa_entrega_aviso', textoPt: 'A taxa de entrega, se houver, é combinada direto com o estabelecimento.' },
      { chave: 'forma_pagamento', textoPt: 'Forma de pagamento' },
      { chave: 'observacoes_label', textoPt: 'Observações' },
      { chave: 'enviando', textoPt: 'Enviando...' },
      { chave: 'confirmar_pedido', textoPt: 'Confirmar pedido' },
      { chave: 'pedido_enviado_titulo', textoPt: 'Pedido enviado!' },
      { chave: 'pedido_enviado_texto', textoPt: 'O estabelecimento já recebeu seu pedido e vai confirmar em instantes.' },
      { chave: 'pedido_whatsapp_titulo', textoPt: 'Pedido enviado via WhatsApp' },
      {
        chave: 'pedido_whatsapp_texto',
        textoPt:
          'O sistema está temporariamente indisponível, então enviamos seu pedido direto pelo WhatsApp do estabelecimento — e ele será sincronizado automaticamente assim que a conexão voltar.',
      },
    ],
  },
  {
    grupo: 'Chamar garçom',
    chaves: [
      { chave: 'garcom_chamado', textoPt: 'Garçom chamado!' },
      { chave: 'chamar_garcom', textoPt: 'Chamar garçom' },
    ],
  },
  {
    grupo: 'Promoções com contador / galeria',
    chaves: [
      { chave: 'ultimos_minutos', textoPt: 'Últimos minutos!' },
      { chave: 'nenhuma_foto', textoPt: 'Nenhuma foto disponível.' },
    ],
  },
  {
    grupo: 'Perfil do estabelecimento',
    chaves: [
      { chave: 'tipo_estabelecimento_fallback', textoPt: 'Restaurante' },
      { chave: 'reivindicar_texto_perfil', textoPt: 'Reivindique o perfil para editar informações, fotos e cardápio.' },
      { chave: 'secao_sobre', textoPt: 'Sobre' },
      { chave: 'endereco_label', textoPt: 'Endereço' },
      { chave: 'endereco_nao_informado', textoPt: 'Endereço não informado' },
      { chave: 'secao_cardapio', textoPt: 'Cardápio' },
      { chave: 'ver_cardapio_completo', textoPt: 'Ver cardápio completo' },
      { chave: 'secao_fotos', textoPt: 'Fotos' },
      { chave: 'secao_horarios', textoPt: 'Horários' },
      { chave: 'dia_domingo', textoPt: 'Domingo' },
      { chave: 'dia_segunda', textoPt: 'Segunda' },
      { chave: 'dia_terca', textoPt: 'Terça' },
      { chave: 'dia_quarta', textoPt: 'Quarta' },
      { chave: 'dia_quinta', textoPt: 'Quinta' },
      { chave: 'dia_sexta', textoPt: 'Sexta' },
      { chave: 'dia_sabado', textoPt: 'Sábado' },
      { chave: 'horarios_nao_cadastrados', textoPt: 'Horários não cadastrados.' },
      { chave: 'secao_localizacao', textoPt: 'Localização' },
      { chave: 'abrir_google_maps', textoPt: 'Abrir no Google Maps' },
      { chave: 'secao_comodidades', textoPt: 'Comodidades' },
      { chave: 'aceita_pets', textoPt: 'Aceita pets' },
      { chave: 'estacionamento_proprio', textoPt: 'Estacionamento próprio' },
      { chave: 'estacionamento_manobrista', textoPt: 'Manobrista' },
      { chave: 'estacionamento_rua', textoPt: 'Estacionamento na rua' },
      { chave: 'estacionamento_sem', textoPt: 'Sem estacionamento' },
      { chave: 'secao_contato', textoPt: 'Contato' },
      { chave: 'contato_nao_informado', textoPt: 'Contato não informado' },
      { chave: 'secao_promocoes', textoPt: 'Promoções' },
      { chave: 'secao_avaliacoes_google', textoPt: 'Avaliações do Google' },
      { chave: 'avaliacoes_via_google', textoPt: 'avaliações via Google' },
      { chave: 'avaliacoes_fornecidas_por', textoPt: 'Avaliações fornecidas pelo' },
    ],
  },
]

export const IDIOMAS: { codigo: 'en' | 'fr' | 'es'; label: string }[] = [
  { codigo: 'en', label: 'EN' },
  { codigo: 'fr', label: 'FR' },
  { codigo: 'es', label: 'ES' },
]
