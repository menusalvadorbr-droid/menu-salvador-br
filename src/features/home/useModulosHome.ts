import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface ModulosHome {
  modulosAtivos: string[];
  backgroundImage: string;
  fontColor: string;
}

export function useModulosHome() {
  const supabase = createClient();
  const [data, setData] = useState<ModulosHome>({
    modulosAtivos: [],
    backgroundImage: '',
    fontColor: '#ffffff',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      // Buscar módulos ativos
      const { data: modulos } = await supabase
        .from('modulos_home')
        .select('slug')
        .eq('ativo', true);

      // Buscar configurações
      const { data: configs } = await supabase
        .from('configuracoes')
        .select('*')
        .in('chave', ['hero_background_image', 'hero_font_color']);

      const backgroundImage =
        configs?.find((c: any) => c.chave === 'hero_background_image')?.valor || '';
      const fontColor =
        configs?.find((c: any) => c.chave === 'hero_font_color')?.valor || '#ffffff';

      setData({
        modulosAtivos: modulos?.map((m: any) => m.slug) || [],
        backgroundImage,
        fontColor,
      });
      setLoading(false);
    }
    fetchData();
  }, []);

  return { ...data, loading };
}