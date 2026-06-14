import type { GenericBestOffer, GenericItem, Item, SetPart } from "@/types";
import { warframeMarket, WFM_ASSETS_URL } from "@/integrations/warframeMarket";
import type { WfmOrder } from "@/integrations/warframeMarket";

const MARKET_SLUGS: Record<string, string> = {
  "khora-prime": "khora_prime_set",
};

const MOCK_ALIASES: Record<string, string> = {
  khora_prime_set: "khora-prime",
};

function generateSeries(n: number, base: number, drift: [number, number]): number[] {
  const out: number[] = [];
  let v = base;
  const [trend, jitter] = drift;
  for (let i = 0; i < n; i++) {
    v += trend + Math.sin(i * 0.7 + n) * jitter + Math.cos(i * 0.31) * jitter * 0.6;
    out.push(Math.max(120, Math.round(v)));
  }
  return out;
}

function buildMessage(itemName: string, rank: number | null, seller: string, plat: number): string {
  const label = rank !== null ? `${itemName} (rank ${rank})` : itemName;
  return `/w ${seller} Hi! I want to buy: "${label}" for ${plat} platinum. (warframe.market)`;
}

function toGenericBestOffer(itemName: string, order: WfmOrder | null): GenericBestOffer | null {
  if (!order) return null;
  const rank = typeof order.rank === "number" ? order.rank : null;
  return {
    seller: order.user.ingameName,
    plat: order.platinum,
    online: order.user.status !== "offline",
    reputation: order.user.reputation,
    rank,
    message: buildMessage(itemName, rank, order.user.ingameName, order.platinum),
  };
}

const KHORA_PRIME: Item = {
  id: "khora-prime",
  name: "Khora Prime",
  category: "Warframe",
  rarity: "Prime",
  mr: 10,
  tier: "S",
  tags: ["Whip", "Beast", "Control", "Steel Path"],
  description:
    "Variante Prime de Khora. Convoca Venari como companheira felina e tece correntes para imobilizar e dilacerar inimigos. Build de farm e controle de área extremamente versátil.",
  releaseCycle: "Vaulted soon · Saída prevista 3 semanas",
  popularity: 92,
  parts: [
    { name: "Blueprint",  plat: 24,  ducats: 15,  drop: "Lith K9 · Comum" },
    { name: "Neuroptics", plat: 38,  ducats: 65,  drop: "Meso E7 · Incomum" },
    { name: "Chassis",    plat: 26,  ducats: 25,  drop: "Neo D5 · Comum" },
    { name: "Systems",    plat: 95,  ducats: 100, drop: "Axi K11 · Raro" },
  ],
  market: {
    setLow: 215, setAvg: 244, setHigh: 289, sellers: 132, sellers7d: 487,
    rank0Low: 215, rank0Avg: 244, rankMaxLow: 320, rankMaxAvg: 358,
    weeklyTrend: -3.4, monthlyTrend: -8.1, quarterlyTrend: 11.2,
    recommendation: {
      label: "Comprar agora", tone: "buy",
      reason: "Preço caiu 8% no último mês com vault próxima. Histórico mostra alta de 60-90% em 30 dias pós-vault.",
    },
  },
  bestOffer: {
    seller: "Tenno_Sora", online: true, plat: 210, platform: "PC", rep: 4.9, trades: 318,
    message: '/w Tenno_Sora Hi! I want to buy: "Khora Prime Set" for 210 platinum. (warframe.market)',
  },
  series90: generateSeries(90, 264, [-0.45, 6]),
  series30: generateSeries(30, 252, [-0.6, 4.5]),
  series7: generateSeries(7, 244, [-0.5, 3]),
  builds: [
    {
      flavor: "popular", name: "Strangledome Control", author: "vexis_ttv",
      votes: 18420, forma: 5, mr: 10,
      tags: ["Survival", "Defense", "Beginner-friendly"],
      polarities: ["v", "v", "d", "d", "r", "v", "d", "dash"],
      mods: [
        { name: "Primed Continuity",   rank: 10, pol: "v" },
        { name: "Stretch",             rank: 5,  pol: "d" },
        { name: "Augur Reach",         rank: 5,  pol: "d" },
        { name: "Transient Fortitude", rank: 5,  pol: "v" },
        { name: "Blind Rage",          rank: 9,  pol: "r" },
        { name: "Streamline",          rank: 5,  pol: "d" },
        { name: "Vitality",            rank: 10, pol: "v" },
        { name: "Adaptation",          rank: 10, pol: "dash" },
      ],
      exilus: { name: "Cunning Drift", rank: 5, pol: "dash" },
      aura: { name: "Corrosive Projection", rank: 5, pol: "d" },
      stats: { strength: 199, range: 250, duration: 188, efficiency: 145 },
      notes: "Build padrão para servers de Khora. Strangledome cobre lanes inteiras, Venari mantém procs de slash. Use Energy Nexus ou Arcane Energize.",
    },
    {
      flavor: "steel", name: "Steel Path Apex Dome", author: "noctari",
      votes: 9810, forma: 7, mr: 12,
      tags: ["Steel Path", "Endurance"],
      polarities: ["v", "v", "v", "d", "r", "d", "v", "d"],
      mods: [
        { name: "Primed Continuity",   rank: 10, pol: "v" },
        { name: "Augur Reach",         rank: 5,  pol: "d" },
        { name: "Stretch",             rank: 5,  pol: "d" },
        { name: "Transient Fortitude", rank: 5,  pol: "v" },
        { name: "Umbral Intensify",    rank: 10, pol: "v" },
        { name: "Umbral Vitality",     rank: 10, pol: "v" },
        { name: "Adaptation",          rank: 10, pol: "dash" },
        { name: "Blind Rage",          rank: 9,  pol: "r" },
      ],
      exilus: { name: "Power Drift", rank: 5, pol: "dash" },
      aura: { name: "Growing Power", rank: 5, pol: "v" },
      stats: { strength: 261, range: 235, duration: 175, efficiency: 130 },
      notes: "Para SP Circuit e endurance. Umbral set + Adaptation aguenta nukers nível 200+. Venari em Healing mode em maps abertos.",
    },
    {
      flavor: "endgame", name: "Whipclaw Crit Burst", author: "Hadronic",
      votes: 7233, forma: 6, mr: 14,
      tags: ["Whipclaw", "Eidolon-style burst", "Helminth"],
      polarities: ["v", "v", "v", "r", "r", "d", "d", "dash"],
      mods: [
        { name: "Energy Conversion",   rank: 5,  pol: "v" },
        { name: "Power Drift",         rank: 5,  pol: "dash" },
        { name: "Umbral Intensify",    rank: 10, pol: "v" },
        { name: "Blind Rage",          rank: 9,  pol: "r" },
        { name: "Augur Secrets",       rank: 5,  pol: "v" },
        { name: "Transient Fortitude", rank: 5,  pol: "v" },
        { name: "Streamline",          rank: 5,  pol: "d" },
        { name: "Molt Augmented",      rank: 30, pol: "d" },
      ],
      exilus: { name: "Pyromaniac", rank: 3, pol: "dash" },
      aura: { name: "Power Donation", rank: 5, pol: "v" },
      stats: { strength: 412, range: 100, duration: 180, efficiency: 165 },
      notes: "Helminth: substituir Ensnare por Roar. Whipclaw 1-shots em SP comum. Combo com Pillage build separada para survivability.",
    },
    {
      flavor: "econ", name: "Econômica · 0 Forma", author: "drycake",
      votes: 4120, forma: 0, mr: 8,
      tags: ["0 Forma", "Iniciante"],
      polarities: ["-", "-", "v", "-", "-", "-", "d", "-"],
      mods: [
        { name: "Continuity",  rank: 5,  pol: "v" },
        { name: "Stretch",     rank: 5,  pol: "d" },
        { name: "Intensify",   rank: 5,  pol: "v" },
        { name: "Streamline",  rank: 5,  pol: "d" },
        { name: "Vitality",    rank: 10, pol: "v" },
        { name: "Redirection", rank: 10, pol: "d" },
        { name: "Steel Fiber", rank: 10, pol: "d" },
        { name: "Flow",        rank: 5,  pol: "v" },
      ],
      exilus: null,
      aura: { name: "Corrosive Projection", rank: 5, pol: "d" },
      stats: { strength: 130, range: 155, duration: 130, efficiency: 130 },
      notes: "Sem Forma e usando apenas mods básicos. Suficiente para Sortie 1-3 e Steel Path com squad. Sobe gradualmente.",
    },
  ],
  relics: [
    { name: "Lith K9",  part: "Blueprint",  rarity: "Comum",   intact: 25.33, radiant: 16.67, vaulted: false },
    { name: "Meso E7",  part: "Neuroptics", rarity: "Incomum", intact: 11.00, radiant: 20.00, vaulted: false },
    { name: "Neo D5",   part: "Chassis",    rarity: "Comum",   intact: 25.33, radiant: 16.67, vaulted: false },
    { name: "Axi K11",  part: "Systems",    rarity: "Raro",    intact: 2.00,  radiant: 10.00, vaulted: false },
  ],
  decision: {
    verdict: "buy", verdictLabel: "Comprar agora", confidence: 0.84,
    roi30d: { plat: 120, pct: 56 },
    roi90d: { plat: 165, pct: 76 },
    summary: "Vault em ~21 dias somada a queda recente de 8% cria janela rara. Histórico de Saryn/Octavia/Nidus pós-vault: valorização média +65% em 30d, +120% em 90d.",
    catalysts: [
      { tone: "up",   text: "Vault confirmada em ~21 dias" },
      { tone: "up",   text: "Preço 8.1% abaixo da média mensal" },
      { tone: "up",   text: "Wishlist global cresceu 23% esta semana" },
      { tone: "down", text: "Saryn Prime (peer) caiu 4% — risco macro" },
    ],
  },
  trend: {
    delta7d: -3.4, delta30d: -8.1, delta90d: 11.2,
    proj30d: 48, proj90d: 76,
    sentiment: "bullish", sentimentLabel: "Bullish · pré-vault",
  },
  liquidity: {
    score: 82, level: "Alta", sellTimeMin: 12,
    weeklyVolume: 487, spreadPct: 28,
    note: "Set vende em minutos. Partes individuais (Systems) demoram mais.",
  },
  demand: {
    score: 88, level: "Forte", wishlist: 12840,
    wishlistDelta7d: 23.1, buyersPerSeller: 3.6,
    note: "3.6 compradores por vendedor ativo. Maior demanda em PC seguido por PS.",
  },
  synergies: [
    { name: "Venari",               type: "Companion", reason: "Pet exclusivo — escala com mods de Khora",          tier: "core" },
    { name: "Strangledome Augment", type: "Mod",       reason: "Procs adicionais de slash · meta endurance",        tier: "core" },
    { name: "Pillage (Helminth)",   type: "Helminth",  reason: "Substituir Ensnare em builds econômicas",           tier: "helm" },
    { name: "Arcane Energize R5",   type: "Arcane",    reason: "Sustenta Strangledome em SP endurance",             tier: "arcane" },
    { name: "Primed Continuity",    type: "Mod",       reason: "+55% duração — Strangledome cobre map inteiro",     tier: "mod" },
    { name: "Molt Augmented",       type: "Arcane",    reason: "+60% strength quando combinado com Roar helminth",  tier: "arcane" },
  ],
  progressionImpact: {
    fitsProfile: true,
    mrRange: { min: 10, current: 22, fitNote: "Ideal para você (MR22)" },
    unlocks: [
      { kind: "Mastery", text: "+6,000 affinity rumo a MR23" },
      { kind: "Build",   text: "Habilita 3 builds top-meta para Steel Path" },
      { kind: "Farm",    text: "Khora Strangledome é o farm meta de Mãe Tokens" },
    ],
    nextStep: "Após adquirir, complete Whispers in the Wall para Dante + Architech synergy.",
  },
};

const ITEMS: Record<string, Item> = {
  "khora-prime": KHORA_PRIME,
};

export const itemService = {
  resolveSlug(slug: string): string {
    return MOCK_ALIASES[slug] ?? slug;
  },

  getItem(slug: string): Item | null {
    return ITEMS[this.resolveSlug(slug)] ?? null;
  },

  async getItemLive(slug: string): Promise<Item | null> {
    const resolved = this.resolveSlug(slug);
    const base = ITEMS[resolved];
    if (!base) return null;

    const marketSlug = MARKET_SLUGS[resolved];
    if (!marketSlug) return base;

    try {
      const top = await warframeMarket.getTopOrders(marketSlug);
      const best = top.sell[0];
      if (!best) return base;

      const sellPrices = top.sell.map((order) => order.platinum);
      const setLow = Math.min(...sellPrices);
      const setAvg = Math.round(sellPrices.reduce((a, b) => a + b, 0) / sellPrices.length);
      const setHigh = Math.max(...sellPrices);

      return {
        ...base,
        market: {
          ...base.market,
          setLow,
          setAvg,
          setHigh,
        },
        bestOffer: {
          ...base.bestOffer,
          seller: best.user.ingameName,
          plat: best.platinum,
          online: best.user.status !== "offline",
          rep: best.user.reputation,
          message: buildMessage(`${base.name} Set`, null, best.user.ingameName, best.platinum),
        },
      };
    } catch {
      return base;
    }
  },

  async getGenericItem(slug: string): Promise<GenericItem | null> {
    try {
      const marketSlug = MARKET_SLUGS[slug] ?? slug;
      const detail = await warframeMarket.getItemDetail(marketSlug);
      const en = detail.i18n?.en;
      if (!en?.name) return null;

      const [ordersResult, setResult] = await Promise.allSettled([
        warframeMarket.getAllOrders(marketSlug),
        detail.setRoot
          ? warframeMarket.getItemSet(marketSlug)
          : Promise.resolve(null),
      ]);

      let market: GenericItem["market"] = null;
      let bestOffer: GenericItem["bestOffer"] = null;
      let rankOffers: GenericItem["rankOffers"] = null;
      let sellOrders: GenericItem["sellOrders"] = [];

      if (ordersResult.status === "fulfilled") {
        const active = ordersResult.value
          .filter(
            (order) =>
              order.type === "sell" &&
              (order.user.status === "ingame" || order.user.status === "online")
          )
          .sort((a, b) => a.platinum - b.platinum);

        if (active.length > 0) {
          const ranked = typeof detail.maxRank === "number" && detail.maxRank > 0;
          // Itens com rank usam só o rank 0 na régua. Misturar rank 0 e rank máximo gera média sem sentido.
          const headlineOrders = ranked
            ? active.filter((order) => order.rank === 0)
            : active;
          const baseOrders = headlineOrders.length > 0 ? headlineOrders : active;
          const prices = baseOrders.map((order) => order.platinum);
          market = {
            low: Math.min(...prices),
            avg: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
            high: Math.max(...prices),
            sellersOnline: baseOrders.length,
          };

          const best = active[0];
          const bestRank = typeof best.rank === "number" ? best.rank : null;

          bestOffer = {
            seller: best.user.ingameName,
            plat: best.platinum,
            online: best.user.status !== "offline",
            reputation: best.user.reputation,
            message: buildMessage(en.name, bestRank, best.user.ingameName, best.platinum),
          };

          if (typeof detail.maxRank === "number" && detail.maxRank > 0) {
            const cheapestRank0 = active.find((order) => order.rank === 0) ?? null;
            const cheapestMax = active.find((order) => order.rank === detail.maxRank) ?? null;

            rankOffers = {
              maxRank: detail.maxRank,
              rank0: toGenericBestOffer(en.name, cheapestRank0),
              max: toGenericBestOffer(en.name, cheapestMax),
            };
          }

          sellOrders = active.slice(0, 60).map((order) => ({
            seller: order.user.ingameName,
            plat: order.platinum,
            quantity: order.quantity,
            rank: typeof order.rank === "number" ? order.rank : null,
            reputation: order.user.reputation,
            status: order.user.status,
          }));
        }
      }

      let setParts: SetPart[] | null = null;
      if (setResult.status === "fulfilled" && setResult.value) {
        const parts = setResult.value.items
          .filter((part) => !part.setRoot && part.i18n?.en?.name)
          .map((part) => ({
            slug: part.slug,
            name: part.i18n.en.name,
            thumb: part.i18n.en.thumb ? `${WFM_ASSETS_URL}${part.i18n.en.thumb}` : null,
            quantityInSet: part.quantityInSet ?? 1,
            ducats: part.ducats ?? null,
          }));
        if (parts.length > 0) setParts = parts;
      }

      return {
        slug: detail.slug,
        name: en.name,
        description: en.description ?? null,
        icon: en.icon ? `${WFM_ASSETS_URL}${en.icon}` : null,
        thumb: en.thumb ? `${WFM_ASSETS_URL}${en.thumb}` : null,
        maxRank: detail.maxRank ?? null,
        vaulted: detail.vaulted ?? null,
        tags: detail.tags ?? [],
        reqMasteryRank: detail.reqMasteryRank ?? null,
        tradingTax: detail.tradingTax ?? null,
        ducats: detail.ducats ?? null,
        wikiLink: en.wikiLink ?? null,
        setParts,
        market,
        bestOffer,
        rankOffers,
        sellOrders,
      };
    } catch {
      return null;
    }
  },

  getPriceSeries(slug: string, range: "7d" | "30d" | "90d"): number[] {
    const item = ITEMS[this.resolveSlug(slug)];
    if (!item) return [];
    if (range === "7d") return item.series7;
    if (range === "90d") return item.series90;
    return item.series30;
  },
};