import { getSql, ensureSchema } from "@/lib/postgres";
import { warframeMarket, WFM_ASSETS_URL } from "@/integrations/warframeMarket";

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

export type PricedMod = RecommendedMod & {
  referencePlat: number | null;
  thumb: string | null;
  description: string | null;
  maxRank: number | null;
};

export type PricedRecommendedMods = {
  itemSlug: string;
  source: string | null;
  mods: PricedMod[];
  totalPlat: number;
  pricedCount: number;
};

type ModRow = {
  mod_name: string;
  mod_slug: string | null;
  role: string;
  note: string | null;
  position: number;
  source: string | null;
};

async function referencePrice(modSlug: string): Promise<number | null> {
  try {
    const stats = await warframeMarket.getItemStatistics(modSlug);
    const baseline = (stats.statistics_closed?.["90days"] ?? [])
      .filter((entry) => entry.mod_rank === undefined || entry.mod_rank === 0)
      .sort((a, b) => a.datetime.localeCompare(b.datetime));

    const last = baseline[baseline.length - 1];
    return last ? Math.round(last.avg_price) : null;
  } catch {
    return null;
  }
}

async function modDetail(modSlug: string): Promise<{
  thumb: string | null;
  description: string | null;
  maxRank: number | null;
}> {
  try {
    const detail = await warframeMarket.getItemDetail(modSlug);
    const en = detail.i18n?.en;
    return {
      thumb: en?.thumb ? `${WFM_ASSETS_URL}${en.thumb}` : null,
      description: en?.description ?? null,
      maxRank: detail.maxRank ?? null,
    };
  } catch {
    return { thumb: null, description: null, maxRank: null };
  }
}

export const modService = {
  async getRecommendedMods(itemSlug: string): Promise<RecommendedMods | null> {
    const sql = await getSql();
    await ensureSchema();

    const { rows } = await sql<ModRow>`
      SELECT mod_name, mod_slug, role, note, position, source
      FROM recommended_mods
      WHERE item_slug = ${itemSlug}
      ORDER BY position ASC
    `;
    if (rows.length === 0) return null;

    return {
      itemSlug,
      source: rows[0].source,
      mods: rows.map((row) => ({
        modName: row.mod_name,
        modSlug: row.mod_slug,
        role: row.role,
        note: row.note,
        position: Number(row.position),
      })),
    };
  },

  async getRecommendedModsWithPrices(itemSlug: string): Promise<PricedRecommendedMods | null> {
    const base = await this.getRecommendedMods(itemSlug);
    if (!base) return null;

    const mods: PricedMod[] = [];
    let totalPlat = 0;
    let pricedCount = 0;

    for (const mod of base.mods) {
      let referencePlat: number | null = null;
      let detail = { thumb: null as string | null, description: null as string | null, maxRank: null as number | null };

      if (mod.modSlug) {
        [referencePlat, detail] = await Promise.all([
          referencePrice(mod.modSlug),
          modDetail(mod.modSlug),
        ]);
      }

      if (referencePlat !== null) {
        totalPlat += referencePlat;
        pricedCount += 1;
      }

      mods.push({ ...mod, referencePlat, ...detail });
    }

    return {
      itemSlug: base.itemSlug,
      source: base.source,
      mods,
      totalPlat,
      pricedCount,
    };
  },
};