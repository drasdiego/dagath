import { NextResponse } from "next/server";
import { trendService } from "@/services/trendService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const trends = trendService.getTrends();

  if (!trends) {
    return NextResponse.json(
      { error: "Histórico insuficiente, são necessários ao menos dois snapshots" },
      { status: 404 }
    );
  }

  return NextResponse.json(trends);
}