import { NextResponse } from "next/server";
import { codexService } from "@/services/codex/codexService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Inspeção do conhecimento coletivo, protegida por ADMIN_PASSWORD. Apoio à
// validação da escrita do Codex enquanto os painéis (Sprint 4) não existem.
export async function GET(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const provided = request.headers.get("x-admin-password");

  if (!adminPassword || provided !== adminPassword) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const entries = await codexService.listRecent(50);
  return NextResponse.json({ entries });
}
