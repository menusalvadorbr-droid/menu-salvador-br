import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const baseUrl = "https://menu-salvador.com";

  // Carrega todas as culinárias
  const { data: culinarias } = await supabase
    .from("culinarias")
    .select("slug");

  // Carrega cidades
  const { data: cidades } = await supabase
    .from("cidades")
    .select("id");

  // Carrega bairros
  const { data: bairros } = await supabase
    .from("bairros")
    .select("id");

  // Carrega estabelecimentos
  const { data: estabelecimentos } = await supabase
    .from("estabelecimentos")
    .select("slug");

  const urls: string[] = [];

  // Página inicial
  urls.push(`${baseUrl}`);

  // Culinárias
  culinarias?.forEach((c) => {
    urls.push(`${baseUrl}/culinaria/${c.slug}`);
  });

  // Cidades
  cidades?.forEach((c) => {
    urls.push(`${baseUrl}/cidade/${c.id}`);
  });

  // Bairros
  bairros?.forEach((b) => {
    urls.push(`${baseUrl}/cidade/bairro/${b.id}`);
  });

  // Estabelecimentos
  estabelecimentos?.forEach((e) => {
    urls.push(`${baseUrl}/cardapio/${e.slug}`);
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
