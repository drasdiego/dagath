export type Tier = "S" | "A" | "B" | "C";
export type Verdict = "buy" | "wait" | "farm" | "profit";
export type Sentiment = "bullish" | "neutral" | "bearish";
export type BuildFlavor = "popular" | "steel" | "endgame" | "econ";
export type InsightTone = "up" | "down";
export type Priority = "Alta" | "Média" | "Baixa";

export type ItemPart = {
  name: string;
  plat: number;
  ducats: number;
  drop: string;
};

export type MarketSummary = {
  setLow: number;
  setAvg: number;
  setHigh: number;
  sellers: number;
  sellers7d: number;
  rank0Low: number;
  rank0Avg: number;
  rankMaxLow: number;
  rankMaxAvg: number;
  weeklyTrend: number;
  monthlyTrend: number;
  quarterlyTrend: number;
  recommendation: { label: string; tone: Verdict; reason: string };
};

export type BestOffer = {
  seller: string;
  online: boolean;
  plat: number;
  platform: string;
  rep: number;
  trades: number;
  message: string;
};

export type Mod = {
  name: string;
  rank: number;
  pol: string;
};

export type Build = {
  flavor: BuildFlavor;
  name: string;
  author: string;
  votes: number;
  forma: number;
  mr: number;
  tags: string[];
  polarities: string[];
  mods: Mod[];
  exilus: Mod | null;
  aura: Mod;
  stats: { strength: number; range: number; duration: number; efficiency: number };
  notes: string;
};

export type Relic = {
  name: string;
  part: string;
  rarity: string;
  intact: number;
  radiant: number;
  vaulted: boolean;
};

export type Synergy = {
  name: string;
  type: string;
  reason: string;
  tier: string;
};

export type DecisionCatalyst = {
  tone: InsightTone;
  text: string;
};

export type Decision = {
  verdict: Verdict;
  verdictLabel: string;
  confidence: number;
  roi30d: { plat: number; pct: number };
  roi90d: { plat: number; pct: number };
  summary: string;
  catalysts: DecisionCatalyst[];
};

export type Trend = {
  delta7d: number;
  delta30d: number;
  delta90d: number;
  proj30d: number;
  proj90d: number;
  sentiment: Sentiment;
  sentimentLabel: string;
};

export type Liquidity = {
  score: number;
  level: string;
  sellTimeMin: number;
  weeklyVolume: number;
  spreadPct: number;
  note: string;
};

export type Demand = {
  score: number;
  level: string;
  wishlist: number;
  wishlistDelta7d: number;
  buyersPerSeller: number;
  note: string;
};

export type ProgressionUnlock = {
  kind: string;
  text: string;
};

export type ProgressionImpact = {
  fitsProfile: boolean;
  mrRange: { min: number; current: number; fitNote: string };
  unlocks: ProgressionUnlock[];
  nextStep: string;
};

export type Item = {
  id: string;
  name: string;
  category: string;
  rarity: string;
  mr: number;
  tier: Tier;
  tags: string[];
  description: string;
  releaseCycle: string;
  popularity: number;
  parts: ItemPart[];
  market: MarketSummary;
  bestOffer: BestOffer;
  series90: number[];
  series30: number[];
  series7: number[];
  builds: Build[];
  relics: Relic[];
  decision: Decision;
  trend: Trend;
  liquidity: Liquidity;
  demand: Demand;
  synergies: Synergy[];
  progressionImpact: ProgressionImpact;
};

export type Mover = {
  name: string;
  plat: number;
  delta: number;
  vol: number;
  tier: Tier;
};

export type FarmEntry = {
  rank: number;
  item: string;
  ppm: number;
  src: string;
  note: string;
};

export type NewsItem = {
  tag: string;
  title: string;
  time: string;
  blurb: string;
};

export type TrackerEntry = {
  item: string;
  target: number;
  current: number;
  status: string;
  trend: string;
};

export type GoalEntry = {
  kind: string;
  title: string;
  reason: string;
  prio: Priority;
};

export type DashboardData = {
  status: { server: string; latency: number; lastSync: string };
  pulse: {
    volume24h: number;
    volumeDelta: number;
    transactions: number;
    transactionsDelta: number;
    activeTraders: number;
    activeTradersDelta: number;
    platSpread: number;
  };
  topUp: Mover[];
  topDown: Mover[];
  topVol: Mover[];
  topFarms: FarmEntry[];
  news: NewsItem[];
  trackers: TrackerEntry[];
  progression: {
    mr: number;
    mrProgress: number;
    frames: number;
    framesTotal: number;
    weapons: number;
    weaponsTotal: number;
    quests: number;
    questsTotal: number;
    nextGoals: GoalEntry[];
  };
};

export type GenericOffer = {
  seller: string;
  plat: number;
  quantity: number;
  rank: number | null;
  reputation: number;
  status: string;
};

export type GenericBestOffer = {
  seller: string;
  plat: number;
  online: boolean;
  reputation: number;
  rank: number | null;
  message: string;
};

export type SetPart = {
  slug: string;
  name: string;
  thumb: string | null;
  quantityInSet: number;
  ducats: number | null;
};

export type GenericItem = {
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  thumb: string | null;
  maxRank: number | null;
  vaulted: boolean | null;
  tags: string[];
  reqMasteryRank: number | null;
  tradingTax: number | null;
  ducats: number | null;
  wikiLink: string | null;
  setParts: SetPart[] | null;
  market: {
    low: number;
    avg: number;
    high: number;
    sellersOnline: number;
  } | null;
  bestOffer: {
    seller: string;
    plat: number;
    online: boolean;
    reputation: number;
    message: string;
  } | null;
  rankOffers: {
    maxRank: number;
    rank0: GenericBestOffer | null;
    max: GenericBestOffer | null;
  } | null;
  sellOrders: GenericOffer[];
};

export type RecentItemStat = {
  itemId: string;
  slug: string | null;
  name: string | null;
  thumb: string | null;
  orders: number;
  units: number;
  platVolume: number;
  avgPlat: number;
  minPlat: number;
  maxPlat: number;
  sellOrders: number;
  buyOrders: number;
};

export type MarketPulse = {
  windowHours: number;
  totalOrders: number;
  sellOrders: number;
  buyOrders: number;
  platVolume: number;
  uniqueTraders: number;
  topTraded: RecentItemStat[];
  topPlatVolume: RecentItemStat[];
  topTicket: RecentItemStat[];
};

export type TrendMover = {
  itemId: string;
  slug: string | null;
  name: string | null;
  thumb: string | null;
  avgPlat: number;
  prevAvgPlat: number;
  deltaPct: number;
  orders: number;
  platVolume: number;
};

export type MarketTrends = {
  currentAt: string;
  previousAt: string;
  minutesBetween: number;
  windowLabel: string;
  topGainers: TrendMover[];
  topLosers: TrendMover[];
  totals: {
    orders: number;
    ordersDeltaPct: number;
    platVolume: number;
    platVolumeDeltaPct: number;
  };
};  