import { NextResponse } from "next/server";
import { insightService } from "@/services/insightService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const { searchParams } = new URL(request.url);
  const priceParam = searchParams.get("price");
  const livePrice = priceParam ? Number(priceParam) : undefined;

  const report = await insightService.getReport(slug, livePrice);

  if (!report) {
    return NextResponse.json(
      { error: "Histórico insuficiente para gerar insights" },
      { status: 404 }
    );
  }

  return NextResponse.json(report);
}   