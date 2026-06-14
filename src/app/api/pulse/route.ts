import { NextResponse } from "next/server";
import { marketPulseService } from "@/services/marketPulseService";

export async function GET() {
  const pulse = await marketPulseService.getPulse();

  if (!pulse) {
    return NextResponse.json({ error: "Falha ao agregar ordens recentes" }, { status: 502 });
  }

  return NextResponse.json(pulse);
}