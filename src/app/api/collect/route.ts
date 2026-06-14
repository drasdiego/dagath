import { NextResponse } from "next/server";
import { snapshotService } from "@/services/snapshotService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await snapshotService.collect();

  if (!result) {
    return NextResponse.json(
      { error: "Falha ao coletar snapshot do mercado" },
      { status: 502 }
    );
  }

  return NextResponse.json(result);
}