import { db } from "@/lib/db";

export type RecommendedMod = {
  modName: string;
  modSlug: string | null;
  role: string;
  note: string | null;
  position: number;
};

export type RecommendedMods = {
  itemSlug: string;
  source: string | null;
  mods: RecommendedMod[];
};

const selectMods = db.prepare(`
  SELECT mod_name, mod_slug, role, note, position, source
  FROM recommended_mods
  WHERE item_slug = ?
  ORDER BY position ASC
`);

type ModRow = {
  mod_name: string;
  mod_slug: string | null;
  role: string;
  note: string | null;
  position: number;
  source: string | null;
};

export const modService = {
  getRecommendedMods(itemSlug: string): RecommendedMods | null {
    const rows = selectMods.all(itemSlug) as ModRow[];
    if (rows.length === 0) return null;

    return {
      itemSlug,
      source: rows[0].source,
      mods: rows.map((row) => ({
        modName: row.mod_name,
        modSlug: row.mod_slug,
        role: row.role,
        note: row.note,
        position: row.position,
      })),
    };
  },
};