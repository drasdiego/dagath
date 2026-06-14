const BASE_URL = "https://api.warframe.market/v2";
const BASE_URL_V1 = "https://api.warframe.market/v1";

export const WFM_ASSETS_URL = "https://warframe.market/static/assets/";

export type WfmUser = {
  ingameName: string;
  status: string;
  reputation: number;
  platform?: string;
};

export type WfmOrder = {
  id: string;
  type: "sell" | "buy";
  platinum: number;
  quantity: number;
  rank?: number;
  visible?: boolean;
  user: WfmUser;
};

export type WfmRecentOrder = WfmOrder & {
  itemId?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type WfmTopOrders = {
  buy: WfmOrder[];
  sell: WfmOrder[];
};

export type WfmItemI18n = {
  name: string;
  description?: string;
  icon?: string;
  thumb?: string;
  subIcon?: string;
  wikiLink?: string;
};

export type WfmItemShort = {
  id: string;
  slug: string;
  gameRef?: string;
  tags?: string[];
  maxRank?: number;
  vaulted?: boolean;
  ducats?: number;
  i18n: {
    en: WfmItemI18n;
  };
};

export type WfmItemFull = WfmItemShort & {
  tradingTax?: number;
  reqMasteryRank?: number;
  setRoot?: boolean;
  setParts?: string[];
  quantityInSet?: number;
};

export type WfmItemSet = {
  id: string;
  items: WfmItemFull[];
};

export type WfmStatEntry = {
  datetime: string;
  volume: number;
  min_price: number;
  max_price: number;
  avg_price: number;
  median: number;
  mod_rank?: number;
  open_price?: number;
  closed_price?: number;
  wa_price?: number;
  moving_avg?: number;
};

export type WfmStatistics = {
  statistics_closed?: {
    "48hours"?: WfmStatEntry[];
    "90days"?: WfmStatEntry[];
  };
  statistics_live?: {
    "48hours"?: WfmStatEntry[];
    "90days"?: WfmStatEntry[];
  };
};

type WfmEnvelope<T> = {
  apiVersion: string;
  data: T | null;
  error: unknown;
};

type WfmV1Envelope<T> = {
  payload: T | null;
};

const COMMON_HEADERS = {
  "User-Agent": "Dagath/0.1 (plataforma de consulta da comunidade; contato: drasdiego)",
  "Accept": "application/json",
  "Language": "en",
  "Platform": "pc",
  "Crossplay": "true",
};

async function request<T>(path: string, revalidateSeconds = 60): Promise<T> {
  const cacheConfig: RequestInit =
    revalidateSeconds === 0
      ? { cache: "no-store" }
      : { next: { revalidate: revalidateSeconds } };

  const response = await fetch(`${BASE_URL}${path}`, {
    headers: COMMON_HEADERS,
    ...cacheConfig,
  });

  if (!response.ok) {
    throw new Error(`Warframe Market API: ${response.status} em ${path}`);
  }

  const envelope = (await response.json()) as WfmEnvelope<T>;

  if (envelope.error || envelope.data === null) {
    throw new Error(`Warframe Market API: erro no payload de ${path}`);
  }

  return envelope.data;
}

async function requestV1<T>(path: string, revalidateSeconds = 3600): Promise<T> {
  const response = await fetch(`${BASE_URL_V1}${path}`, {
    headers: COMMON_HEADERS,
    next: { revalidate: revalidateSeconds },
  });

  if (!response.ok) {
    throw new Error(`Warframe Market API v1: ${response.status} em ${path}`);
  }

  const envelope = (await response.json()) as WfmV1Envelope<T>;

  if (envelope.payload === null || envelope.payload === undefined) {
    throw new Error(`Warframe Market API v1: erro no payload de ${path}`);
  }

  return envelope.payload;
}

const CATALOG_TTL_MS = 60 * 60 * 1000;
let catalogCache: { data: WfmItemShort[]; at: number } | null = null;

export const warframeMarket = {
  async getTopOrders(slug: string): Promise<WfmTopOrders> {
    return request<WfmTopOrders>(`/orders/item/${slug}/top`);
  },

  async getBestSellOrders(slug: string): Promise<WfmOrder[]> {
    const top = await this.getTopOrders(slug);
    return top.sell;
  },

  async getAllOrders(slug: string): Promise<WfmOrder[]> {
    return request<WfmOrder[]>(`/orders/item/${slug}`);
  },

  async getRecentOrders(): Promise<WfmRecentOrder[]> {
    return request<WfmRecentOrder[]>("/orders/recent", 0);
  },

  async getItemDetail(slug: string): Promise<WfmItemFull> {
    return request<WfmItemFull>(`/item/${slug}`, 3600);
  },

  async getItemSet(slug: string): Promise<WfmItemSet> {
    return request<WfmItemSet>(`/item/${slug}/set`, 3600);
  },

  async getItemStatistics(slug: string): Promise<WfmStatistics> {
    return requestV1<WfmStatistics>(`/items/${slug}/statistics`, 3600);
  },

  async getAllItems(): Promise<WfmItemShort[]> {
    if (catalogCache && Date.now() - catalogCache.at < CATALOG_TTL_MS) {
      return catalogCache.data;
    }
    const data = await request<WfmItemShort[]>("/items", 0);
    catalogCache = { data, at: Date.now() };
    return data;
  },

  async searchItems(query: string, limit = 10): Promise<WfmItemShort[]> {
    const items = await this.getAllItems();
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];

    return items
      .filter((item) => item.i18n?.en?.name?.toLowerCase().includes(normalized))
      .sort((a, b) => {
        const aName = a.i18n.en.name.toLowerCase();
        const bName = b.i18n.en.name.toLowerCase();
        const aStarts = aName.startsWith(normalized) ? 0 : 1;
        const bStarts = bName.startsWith(normalized) ? 0 : 1;
        if (aStarts !== bStarts) return aStarts - bStarts;
        return aName.length - bName.length;
      })
      .slice(0, limit);
  },
};