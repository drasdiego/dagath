import { NextResponse } from "next/server";
import { warframeMarket } from "@/integrations/warframeMarket";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const [detail, set] = await Promise.all([
      warframeMarket.getItemDetail(slug),
      warframeMarket.getItemSet(slug).catch(() => null),
    ]);

    return NextResponse.json({
      detail,
      setItemCount: set?.items?.length ?? 0,
      setSample: set?.items?.slice(0, 2) ?? [],
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao inspecionar item", detail: String(error) },
      { status: 502 }
    );
  }
}