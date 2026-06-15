import { warframeStat, type WsWarframe } from "@/integrations/warframeStat";

// Camada de Warframes (frames), com dados do warframestat.us. Cobre todos os
// frames (base, Prime e novos), independentemente de serem negociáveis no
// mercado. Complementa o catálogo do warframe.market, que só tem itens de trade.
export type FrameAbility = {
  name: string;
  description: string;
};

export type Frame = {
  slug: string;
  name: string;
  description: string | null;
  passive: string | null;
  abilities: FrameAbility[];
  health: number | null;
  shield: number | null;
  armor: number | null;
  sprintSpeed: number | null;
  masteryReq: number | null;
  wikiUrl: string | null;
  isPrime: boolean;
  introduced: string | null;
};

const TTL_MS = 24 * 60 * 60 * 1000;
let cache: { data: WsWarframe[]; at: number } | null = null;

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function clean(text: string | undefined): string | null {
  if (!text) return null;
  // Remove marcações de cor do warframestat (ex.: <DT_FIRE_COLOR>).
  const stripped = text.replace(/<[^>]+>/g, "").trim();
  return stripped.length > 0 ? stripped : null;
}

function toFrame(source: WsWarframe): Frame {
  return {
    slug: toSlug(source.name),
    name: source.name,
    description: clean(source.description),
    passive: clean(source.passiveDescription),
    abilities: (source.abilities ?? []).map((ability) => ({
      name: ability.name,
      description: clean(ability.description) ?? "",
    })),
    health: source.health ?? null,
    shield: source.shield ?? null,
    armor: source.armor ?? null,
    sprintSpeed: source.sprintSpeed ?? null,
    masteryReq: source.masteryReq ?? null,
    wikiUrl: source.wikiaUrl ?? null,
    isPrime: Boolean(source.isPrime),
    introduced: source.introduced?.name ?? null,
  };
}

async function loadFrames(): Promise<WsWarframe[]> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;
  const data = await warframeStat.getWarframes();
  const frames = data.filter(
    (frame) => Boolean(frame?.name) && (frame.category ?? "Warframes") === "Warframes"
  );
  cache = { data: frames, at: Date.now() };
  return frames;
}

export const frameService = {
  async search(query: string, limit = 8): Promise<Frame[]> {
    const normalized = query.trim().toLowerCase();
    if (normalized.length < 2) return [];

    const frames = await loadFrames();
    return frames
      .filter((frame) => frame.name.toLowerCase().includes(normalized))
      .sort((a, b) => {
        const aStarts = a.name.toLowerCase().startsWith(normalized) ? 0 : 1;
        const bStarts = b.name.toLowerCase().startsWith(normalized) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return a.name.length - b.name.length;
      })
      .slice(0, limit)
      .map(toFrame);
  },

  async getBySlug(slug: string): Promise<Frame | null> {
    const frames = await loadFrames();
    const found = frames.find((frame) => toSlug(frame.name) === slug);
    return found ? toFrame(found) : null;
  },

  // Encontra o frame mencionado em texto livre (para o grounding da Cephalon).
  async findMentioned(text: string): Promise<Frame | null> {
    const lowered = text.toLowerCase();
    const frames = await loadFrames();

    let best: WsWarframe | null = null;
    let bestLength = 0;
    for (const frame of frames) {
      const name = frame.name.toLowerCase();
      if (name.length >= 3 && lowered.includes(name) && name.length > bestLength) {
        best = frame;
        bestLength = name.length;
      }
    }

    return best ? toFrame(best) : null;
  },
};
