import { NextResponse } from "next/server";
import { warframeMarket, WFM_ASSETS_URL } from "@/integrations/warframeMarket";
import { frameService } from "@/services/frameService";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  if (query.trim().length < 2) {
    return NextResponse.json({ query, count: 0, results: [] });
  }

  // Mercado e frames em paralelo. Uma fonte falhando não derruba a outra.
  const [items, frames] = await Promise.all([
    warframeMarket.searchItems(query, 25).catch(() => []),
    frameService.search(query, 8).catch(() => []),
  ]);

  const itemResults = items.map((item) => ({
    kind: "item" as const,
    slug: item.slug,
    name: item.i18n.en.name,
    maxRank: item.maxRank ?? null,
    thumb: item.i18n.en.thumb ? `${WFM_ASSETS_URL}${item.i18n.en.thumb}` : null,
  }));

  // Consolida duplicatas: um frame negociável (ex.: Khora Prime) já aparece como
  // "X Set" no mercado. Nesses casos mantemos só o item de mercado (tem preço e
  // ficha completa, agora com habilidades). Frames sem set, como os base, ficam.
  const conceptKey = (name: string) => name.toLowerCase().replace(/\s+set$/, "").trim();
  const marketConcepts = new Set(itemResults.map((item) => conceptKey(item.name)));

  const frameResults = frames
    .filter((frame) => !marketConcepts.has(frame.name.toLowerCase()))
    .map((frame) => ({
      kind: "frame" as const,
      slug: frame.slug,
      name: frame.name,
      maxRank: null,
      thumb: null,
    }));

  // Frames (sem duplicata) primeiro: são as fichas que o catálogo de trade não cobre.
  const results = [...frameResults, ...itemResults];

  return NextResponse.json({ query, count: results.length, results });
}
