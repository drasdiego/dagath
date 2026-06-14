import { NextResponse } from "next/server";
import { artColorService } from "@/services/artColorService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get("url");
  const color = await artColorService.getDominant(url);
  return NextResponse.json({ url, color });
}