import useSWR from 'swr';
import { supabase } from '@/lib/supabase';

interface DadosCardapio {
  categorias: any[];
  isLoading: boolean;
  error: any;
  updateItem: (itemId: string, dados: any) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  addItem: (categoriaId: string, dados: any) => Promise<void>;
  revalidate: () => void;
}

const fetcher = async (estabelecimentoId: string) => {
  // Busca o menu ativo do estabelecimento
  const { data: menu, error: menuError } = await supabase
    .from('menus')
    .select('id')
    .eq('estabelecimento_id', estabelecimentoId)
    .eq('ativo', true)
    .single();

  if (menuError || !menu) return [];

  // Busca categorias com itens ordenados
  const { data: categorias, error: catError } = await supabase
    .from('categorias')
    .select('*, itens_cardapio(*)')
    .eq('menu_id', menu.id)
    .order('ordem');

  if (catError) throw catError;

  return categorias || [];
};

export function useCardapio(estabelecimentoId: string | undefined): DadosCardapio {
  const { data: categorias, error, isLoading, mutate } = useSWR(
    estabelecimentoId ? ['cardapio', estabelecimentoId] : null,
    () => fetcher(estabelecimentoId!),
    {
      revalidateOnFocus: false,
      dedupingInterval: 2000,
    }
  );

  const updateItem = async (itemId: string, dados: any) => {
    // Mutação otimista: atualiza a UI antes da resposta do servidor
    mutate(
      (current) =>
        current?.map((cat: any) => ({
          ...cat,
          itens_cardapio: cat.itens_cardapio?.map((item: any) =>
            item.id === itemId ? { ...item, ...dados } : item
          ),
        })),
      false
    );

    const { error: updateError } = await supabase
      .from('itens_cardapio')
      .update(dados)
      .eq('id', itemId);

    if (updateError) {
      // Reverte em caso de erro
      mutate();
      throw updateError;
    }

    mutate(); // Revalidação final
  };

  const deleteItem = async (itemId: string) => {
    mutate(
      (current) =>
        current?.map((cat: any) => ({
          ...cat,
          itens_cardapio: cat.itens_cardapio?.filter((item: any) => item.id !== itemId),
        })),
      false
    );

    const { error: deleteError } = await supabase
      .from('itens_cardapio')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      mutate();
      throw deleteError;
    }

    mutate();
  };

  const addItem = async (categoriaId: string, dados: any) => {
    const { data: newItem, error } = await supabase
      .from('itens_cardapio')
      .insert({ ...dados, categoria_id: categoriaId })
      .select()
      .single();

    if (error) throw error;

    // Adiciona o item na UI otimista
    mutate(
      (current) =>
        current?.map((cat: any) =>
          cat.id === categoriaId
            ? { ...cat, itens_cardapio: [...(cat.itens_cardapio || []), newItem] }
            : cat
        ),
      false
    );

    mutate();
  };

  const revalidate = () => mutate();

  return {
    categorias: categorias || [],
    isLoading,
    error,
    updateItem,
    deleteItem,
    addItem,
    revalidate,
  };
}