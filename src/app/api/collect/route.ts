import { NextResponse } from "next/server";
import { snapshotService } from "@/services/snapshotService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Em produção a coleta só roda via Vercel Cron, que envia o header
// Authorization: Bearer ${CRON_SECRET}. Em dev, sem CRON_SECRET definido, a
// rota segue aberta para coleta manual.
function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const result = await snapshotService.collect();

  if (!result) {
    return NextResponse.json(
      { error: "Falha ao coletar snapshot do mercado" },
      { status: 502 }
    );
  }

  return NextResponse.json(result);
}
