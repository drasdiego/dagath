import { NextResponse } from "next/server";
import { suggestionService } from "@/services/suggestionService";
import type { SuggestionMod } from "@/services/suggestionService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const itemSlug = String(body.itemSlug ?? "").trim();
    const itemName = String(body.itemName ?? "").trim();
    const author = body.author ? String(body.author).trim().slice(0, 40) : null;
    const rawMods = Array.isArray(body.mods) ? body.mods : [];

    if (!itemSlug || !itemName || rawMods.length === 0) {
      return NextResponse.json(
        { error: "Informe o item e ao menos um mod." },
        { status: 400 }
      );
    }

    const mods: SuggestionMod[] = rawMods
      .slice(0, 12)
      .map((mod: Record<string, unknown>) => ({
        modName: String(mod.modName ?? "").trim().slice(0, 60),
        modSlug: mod.modSlug ? String(mod.modSlug).trim() : null,
        role: String(mod.role ?? "Geral").trim().slice(0, 24),
        note: mod.note ? String(mod.note).trim().slice(0, 200) : null,
      }))
      .filter((mod: SuggestionMod) => mod.modName.length > 0);

    if (mods.length === 0) {
      return NextResponse.json(
        { error: "Os mods informados são inválidos." },
        { status: 400 }
      );
    }

    const id = suggestionService.create({ itemSlug, itemName, author, mods });
    return NextResponse.json({ ok: true, id });
  } catch {
    return NextResponse.json(
      { error: "Não foi possível registrar a sugestão." },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const adminPassword = process.env.ADMIN_PASSWORD;
  const provided = request.headers.get("x-admin-password");

  if (!adminPassword || provided !== adminPassword) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  return NextResponse.json({ pending: suggestionService.listPending() });
}