import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const baseUrl = "https://menu-salvador.com";

  // Carrega tipos de culinária
  const { data: tiposCozinha } = await supabase
    .from("tipos_cozinha")
    .select("slug");

  // Carrega cidades (cobertura)
  const { data: cidades } = await supabase.from("cidades").select("slug");

  // Carrega bairros, com o slug da cidade a que pertencem
  const { data: bairros } = await supabase
    .from("bairros")
    .select("slug, cidades(slug)");

  // Carrega estabelecimentos com o suficiente pra montar a URL canônica
  // de 4 segmentos — sem cidade/bairro/tipo resolvidos (ex: pendente de
  // curadoria de bairro, ver /admin/estabelecimentos/pendencias), cai
  // pra URL simples do cardápio em vez de ficar de fora do sitemap.
  const { data: estabelecimentos } = await supabase
    .from("estabelecimentos")
    .select("slug, cidades(slug), bairros(slug), tipos_estabelecimento(slug)")
    .eq("status", "active")
    .eq("ativo", true);

  const urls: string[] = [];

  // Página inicial
  urls.push(`${baseUrl}`);

  // Tipos de culinária
  tiposCozinha?.forEach((t) => {
    urls.push(`${baseUrl}/culinaria/${t.slug}`);
  });

  // Cidades
  cidades?.forEach((c) => {
    urls.push(`${baseUrl}/${c.slug}`);
  });

  // Bairros
  bairros?.forEach((b) => {
    const cidadeSlug = (Array.isArray(b.cidades) ? b.cidades[0] : b.cidades)?.slug;
    if (cidadeSlug) urls.push(`${baseUrl}/${cidadeSlug}/${b.slug}`);
  });

  // Estabelecimentos — URL canônica de 4 segmentos quando cidade/bairro/
  // tipo estão todos resolvidos, senão a URL simples do cardápio.
  estabelecimentos?.forEach((e) => {
    const cidadeSlug = (Array.isArray(e.cidades) ? e.cidades[0] : e.cidades)?.slug;
    const bairroSlug = (Array.isArray(e.bairros) ? e.bairros[0] : e.bairros)?.slug;
    const tipoSlug = (Array.isArray(e.tipos_estabelecimento) ? e.tipos_estabelecimento[0] : e.tipos_estabelecimento)?.slug;

    const url =
      cidadeSlug && bairroSlug && tipoSlug
        ? `${baseUrl}/${cidadeSlug}/${bairroSlug}/${tipoSlug}/${e.slug}`
        : `${baseUrl}/cardapio/${e.slug}`;
    urls.push(url);
  });

  // Monta o XML
  const xml = `
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      ${urls
        .map(
          (url) => `
        <url>
          <loc>${url}</loc>
          <changefreq>daily</changefreq>
          <priority>0.8</priority>
        </url>
      `
        )
        .join("")}
    </urlset>
  `;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
}
