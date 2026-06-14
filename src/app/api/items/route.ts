import { NextResponse } from "next/server";
import { warframeMarket, WFM_ASSETS_URL } from "@/integrations/warframeMarket";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") ?? "";

  if (query.trim().length < 2) {
    return NextResponse.json({ query, count: 0, results: [] });
  }

  try {
    const items = await warframeMarket.searchItems(query, 25);

    return NextResponse.json({
      query,
      count: items.length,
      results: items.map((item) => ({
        slug: item.slug,
        name: item.i18n.en.name,
        maxRank: item.maxRank ?? null,
        vaulted: item.vaulted ?? null,
        thumb: item.i18n.en.thumb ? `${WFM_ASSETS_URL}${item.i18n.en.thumb}` : null,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao consultar o catálogo", detail: String(error) },
      { status: 502 }
    );
  }
}