import { warframeStat } from "@/integrations/warframeStat";

export type FissureTierCount = {
  tier: string;
  tierNum: number;
  count: number;
};

export type FissureHighlight = {
  node: string;
  mission: string;
  enemy: string;
  tier: string;
  steelPath: boolean;
  railjack: boolean;
  remainingMinutes: number;
};

export type EventSummary = {
  name: string;
  place: string | null;
  tooltip: string | null;
  remainingDays: number | null;
  progressPct: number | null;
  mainRewards: string[];
};

export type BaroSummary = {
  status: "na_estacao" | "a_caminho";
  location: string;
  whenText: string;
  inventoryCount: number;
};

export type NewsSummary = {
  title: string;
  link: string;
  daysAgo: number;
  kind: "Atualização" | "Prime Access" | "Transmissão" | "Geral";
};

export type WorldState = {
  fissures: {
    total: number;
    steelPathCount: number;
    railjackCount: number;
    byTier: FissureTierCount[];
    endingSoon: FissureHighlight[];
  } | null;
  events: EventSummary[] | null;
  baro: BaroSummary | null;
  news: NewsSummary[] | null;
};

function minutesUntil(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000);
}

function daysUntil(iso: string): number {
  return Math.round(minutesUntil(iso) / 1440);
}

function formatRelative(iso: string): string {
  const minutes = minutesUntil(iso);
  if (minutes < 60) return `em ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `em ${hours}h`;
  return `em ${Math.round(hours / 24)} dias`;
}

export const worldService = {
  async getWorldState(): Promise<WorldState> {
    const [fissuresResult, eventsResult, baroResult, newsResult] = await Promise.allSettled([
      warframeStat.getFissures(),
      warframeStat.getEvents(),
      warframeStat.getVoidTrader(),
      warframeStat.getNews(),
    ]);

    let fissures: WorldState["fissures"] = null;
    if (fissuresResult.status === "fulfilled") {
      const active = fissuresResult.value.filter(
        (fissure) => minutesUntil(fissure.expiry) > 0
      );

      const tierMap = new Map<string, FissureTierCount>();
      for (const fissure of active) {
        const existing = tierMap.get(fissure.tier);
        if (existing) existing.count += 1;
        else tierMap.set(fissure.tier, { tier: fissure.tier, tierNum: fissure.tierNum, count: 1 });
      }

      fissures = {
        total: active.length,
        steelPathCount: active.filter((fissure) => fissure.isHard).length,
        railjackCount: active.filter((fissure) => fissure.isStorm).length,
        byTier: Array.from(tierMap.values()).sort((a, b) => a.tierNum - b.tierNum),
        endingSoon: active
          .sort((a, b) => minutesUntil(a.expiry) - minutesUntil(b.expiry))
          .slice(0, 3)
          .map((fissure) => ({
            node: fissure.node,
            mission: fissure.missionType,
            enemy: fissure.enemy,
            tier: fissure.tier,
            steelPath: Boolean(fissure.isHard),
            railjack: Boolean(fissure.isStorm),
            remainingMinutes: minutesUntil(fissure.expiry),
          })),
      };
    }

    let events: WorldState["events"] = null;
    if (eventsResult.status === "fulfilled") {
      events = eventsResult.value.map((event) => {
        const raw = event as unknown as {
          description: string;
          tooltip?: string;
          node?: string;
          victimNode?: string;
          expiry?: string;
          currentScore?: number;
          maximumScore?: number;
          rewards?: { items?: string[] }[];
        };

        const progressPct =
          typeof raw.currentScore === "number" &&
          typeof raw.maximumScore === "number" &&
          raw.maximumScore > 0
            ? Math.round((raw.currentScore / raw.maximumScore) * 100)
            : null;

        return {
          name: raw.description,
          place: raw.node ?? raw.victimNode ?? null,
          tooltip: raw.tooltip ?? null,
          remainingDays: raw.expiry ? daysUntil(raw.expiry) : null,
          progressPct,
          mainRewards: (raw.rewards ?? [])
            .flatMap((reward) => reward.items ?? [])
            .slice(0, 3),
        };
      });
    }

    let baro: WorldState["baro"] = null;
    if (baroResult.status === "fulfilled") {
      const trader = baroResult.value;
      const arrived = minutesUntil(trader.activation) <= 0;
      const gone = minutesUntil(trader.expiry) <= 0;

      if (arrived && !gone) {
        baro = {
          status: "na_estacao",
          location: trader.location,
          whenText: `sai ${formatRelative(trader.expiry)}`,
          inventoryCount: trader.inventory?.length ?? 0,
        };
      } else if (!arrived) {
        baro = {
          status: "a_caminho",
          location: trader.location,
          whenText: `chega ${formatRelative(trader.activation)}`,
          inventoryCount: 0,
        };
      }
    }

    let news: WorldState["news"] = null;
    if (newsResult.status === "fulfilled") {
      news = newsResult.value
        .filter((item) => new Date(item.date).getFullYear() > 2020)
        .sort((a, b) => b.date.localeCompare(a.date))
        .slice(0, 4)
        .map((item) => {
          const raw = item as unknown as {
            message: string;
            link: string;
            date: string;
            update?: boolean;
            primeAccess?: boolean;
            stream?: boolean;
            translations?: { pt?: string };
          };
          return {
            title: raw.translations?.pt ?? raw.message,
            link: raw.link,
            daysAgo: Math.max(0, -daysUntil(raw.date)),
            kind: raw.update
              ? ("Atualização" as const)
              : raw.primeAccess
              ? ("Prime Access" as const)
              : raw.stream
              ? ("Transmissão" as const)
              : ("Geral" as const),
          };
        });
    }

    return { fissures, events, baro, news };
  },
};