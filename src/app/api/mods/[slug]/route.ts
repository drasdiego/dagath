import { NextResponse } from "next/server";
import { modService } from "@/services/modService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const mods = await modService.getRecommendedMods(slug);

  if (!mods) {
    return NextResponse.json(
      { error: "Sem mods curados para este item" },
      { status: 404 }
    );
  }

  return NextResponse.json(mods);
}