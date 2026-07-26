import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface ConfiguracoesHome {
  heroAtivado: boolean;
  bannerTopoAtivado: boolean;
  gridEstabelecimentosAtivado: boolean;
  footerAtivado: boolean;
  promocoesAtivado: boolean;
  filtrosAtivado: boolean;
  botaoFlutuanteAtivado: boolean;
}

const PADRAO: ConfiguracoesHome = {
  heroAtivado: true,
  bannerTopoAtivado: true,
  gridEstabelecimentosAtivado: true,
  footerAtivado: true,
  promocoesAtivado: true,
  filtrosAtivado: true,
  botaoFlutuanteAtivado: true,
};

/**
 * Lê a linha única de `configuracoes_home` (toggle por módulo da home,
 * controlado pelo admin geral da plataforma). Usa PADRAO enquanto carrega
 * ou se a linha ainda não existir no banco.
 */
export function useModulosHome() {
  const supabase = createClient();
  const [config, setConfig] = useState<ConfiguracoesHome>(PADRAO);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      const { data } = await supabase
        .from('configuracoes_home')
        .select('*')
        .eq('id', true)
        .maybeSingle();

      if (data) {
        setConfig({
          heroAtivado: data.hero_ativado ?? true,
          bannerTopoAtivado: data.banner_topo_ativado ?? true,
          gridEstabelecimentosAtivado: data.grid_estabelecimentos_ativado ?? true,
          footerAtivado: data.footer_ativado ?? true,
          promocoesAtivado: data.promocoes_ativado ?? true,
          filtrosAtivado: data.filtros_ativado ?? true,
          botaoFlutuanteAtivado: data.botao_flutuante_ativado ?? true,
        });
      }
      setLoading(false);
    }
    fetchData();
  }, []);

  return { ...config, loading };
}
