import { NextResponse } from "next/server";
import { warframeStat } from "@/integrations/warframeStat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ name: string }> }
) {
  const { name } = await params;

  try {
    const item = await warframeStat.getItemData(decodeURIComponent(name));

    return NextResponse.json({
      name: item.name,
      category: item.category,
      vaulted: item.vaulted,
      introduced: item.introduced?.name ?? null,
      directDropsCount: item.drops?.length ?? 0,
      directDropsSample: item.drops?.slice(0, 3) ?? [],
      components: (item.components ?? []).map((component) => ({
        name: component.name,
        itemCount: component.itemCount,
        ducats: component.ducats,
        dropsCount: component.drops?.length ?? 0,
        dropsSample: component.drops?.slice(0, 3) ?? [],
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao consultar drops", detail: String(error) },
      { status: 502 }
    );
  }
}