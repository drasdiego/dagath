import { warframeStat } from "@/integrations/warframeStat";

export type ComponentDrops = {
  name: string;
  itemCount: number;
  ducats: number | null;
  relics: { name: string; bestChance: number }[];
};

export type ItemDrops = {
  name: string;
  vaulted: boolean | null;
  introduced: string | null;
  components: ComponentDrops[];
};

function baseRelicName(location: string): string {
  return location.replace(/\s*\((Intact|Exceptional|Flawless|Radiant)\)\s*$/i, "").trim();
}

export const dropService = {
  async getItemDrops(marketName: string): Promise<ItemDrops | null> {
    try {
      const queryName = marketName.replace(/\s+Set$/i, "").trim();
      const item = await warframeStat.getItemData(queryName);

      const components: ComponentDrops[] = (item.components ?? [])
        .map((component) => {
          const relicMap = new Map<string, number>();

          for (const drop of component.drops ?? []) {
            if (!drop.location.toLowerCase().includes("relic")) continue;
            const base = baseRelicName(drop.location);
            const chance = drop.chance ?? 0;
            const existing = relicMap.get(base);
            if (existing === undefined || chance > existing) {
              relicMap.set(base, chance);
            }
          }

          return {
            name: component.name,
            itemCount: component.itemCount ?? 1,
            ducats: component.ducats ?? null,
            relics: Array.from(relicMap.entries())
              .map(([name, bestChance]) => ({ name, bestChance }))
              .sort((a, b) => b.bestChance - a.bestChance)
              .slice(0, 6),
          };
        })
        .filter((component) => component.relics.length > 0);

      if (components.length === 0 && item.vaulted === undefined) return null;

      return {
        name: item.name,
        vaulted: item.vaulted ?? null,
        introduced: item.introduced?.name ?? null,
        components,
      };
    } catch {
      return null;
    }
  },
};