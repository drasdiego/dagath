import { NextResponse } from "next/server";
import { worldService } from "@/services/worldService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const worldState = await worldService.getWorldState();
  return NextResponse.json(worldState);
}