import { warframeStat } from "@/integrations/warframeStat";

// Atributos de arma vindos do warframestat.us, para consolidar na ficha de item
// o que o catálogo de mercado não traz (crítico, status, cadência, etc.).
// Leitura defensiva: só expõe o que existe, nunca preenche valores ausentes.
export type WeaponStats = {
  type: string | null;
  masteryReq: number | null;
  criticalChance: number | null; // fração 0-1
  criticalMultiplier: number | null;
  statusChance: number | null; // fração 0-1
  fireRate: number | null;
  totalDamage: number | null;
  magazineSize: number | null;
  reloadTime: number | null;
  disposition: number | null; // 1-5
  wikiUrl: string | null;
};

const WEAPON_CATEGORIES = new Set([
  "Primary",
  "Secondary",
  "Melee",
  "Arch-Gun",
  "Arch-Melee",
]);

function num(value: number | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export const weaponService = {
  async getStats(name: string): Promise<WeaponStats | null> {
    const lookup = name.replace(/\s+set$/i, "").trim();
    if (!lookup) return null;

    try {
      const data = await warframeStat.getItemData(lookup);

      const isWeapon =
        (data.category !== undefined && WEAPON_CATEGORIES.has(data.category)) ||
        num(data.criticalChance) !== null ||
        num(data.fireRate) !== null;

      if (!isWeapon) return null;

      return {
        type: data.type ?? null,
        masteryReq: num(data.masteryReq),
        criticalChance: num(data.criticalChance),
        criticalMultiplier: num(data.criticalMultiplier),
        statusChance: num(data.procChance),
        fireRate: num(data.fireRate),
        totalDamage: num(data.totalDamage),
        magazineSize: num(data.magazineSize),
        reloadTime: num(data.reloadTime),
        disposition: num(data.disposition),
        wikiUrl: data.wikiaUrl ?? null,
      };
    } catch {
      return null;
    }
  },
};
