import { NextResponse } from "next/server";
import { consoleService } from "@/services/consoleService";
import { normalizeMemory } from "@/services/cephalonMemory";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cmd = searchParams.get("cmd") ?? "";

  const result = await consoleService.execute(cmd);

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as {
    cmd?: unknown;
    memory?: unknown;
  };

  const cmd = typeof body.cmd === "string" ? body.cmd : "";
  const memory = normalizeMemory(body.memory);

  const result = await consoleService.execute(cmd, memory);

  return NextResponse.json(result);
}
