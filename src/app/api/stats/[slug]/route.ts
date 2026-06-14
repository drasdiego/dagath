import { NextResponse } from "next/server";
import { warframeMarket } from "@/integrations/warframeMarket";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  try {
    const stats = await warframeMarket.getItemStatistics(slug);

    const days90 = stats.statistics_closed?.["90days"] ?? [];
    const hours48 = stats.statistics_closed?.["48hours"] ?? [];

    return NextResponse.json({
      slug,
      days90Count: days90.length,
      hours48Count: hours48.length,
      firstDay: days90[0] ?? null,
      lastDay: days90[days90.length - 1] ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Falha ao consultar estatísticas", detail: String(error) },
      { status: 502 }
    );
  }
}