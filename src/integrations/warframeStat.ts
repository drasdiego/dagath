const BASE_URL = "https://api.warframestat.us";

export type WsFissure = {
  id: string;
  node: string;
  missionType: string;
  enemy: string;
  tier: string;
  tierNum: number;
  expiry: string;
  eta: string;
  active: boolean;
  isHard?: boolean;
  isStorm?: boolean;
};

export type WsEvent = {
  id: string;
  description: string;
  tooltip?: string;
  node?: string;
  victimNode?: string;
  expiry?: string;
  eta?: string;
  active: boolean;
  rewards?: { asString?: string }[];
};

export type WsVoidTraderItem = {
  item: string;
  ducats: number;
  credits: number;
};

export type WsVoidTrader = {
  id: string;
  character: string;
  location: string;
  active: boolean;
  activation: string;
  expiry: string;
  startString: string;
  endString: string;
  inventory: WsVoidTraderItem[];
};

export type WsNews = {
  id: string;
  message: string;
  link: string;
  date: string;
  update?: boolean;
  primeAccess?: boolean;
  stream?: boolean;
  eta?: string;
};

export type WsDrop = {
  location: string;
  type?: string;
  rarity?: string;
  chance?: number;
};

export type WsComponent = {
  name: string;
  description?: string;
  itemCount?: number;
  ducats?: number;
  drops?: WsDrop[];
};

export type WsItemData = {
  name: string;
  category?: string;
  type?: string;
  description?: string;
  wikiaUrl?: string;
  masteryReq?: number;
  vaulted?: boolean;
  introduced?: { name?: string; date?: string };
  drops?: WsDrop[];
  components?: WsComponent[];
};

async function request<T>(path: string, revalidateSeconds = 60): Promise<T> {
  const separator = path.includes("?") ? "&" : "?";
  const response = await fetch(`${BASE_URL}${path}${separator}language=pt`, {
    headers: {
      "User-Agent": "Dagath/0.1 (plataforma de consulta da comunidade; contato: drasdiego)",
      "Accept": "application/json",
    },
    next: { revalidate: revalidateSeconds },
  });

  if (!response.ok) {
    throw new Error(`WarframeStat API: ${response.status} em ${path}`);
  }

  return (await response.json()) as T;
}

export const warframeStat = {
  async getFissures(): Promise<WsFissure[]> {
    return request<WsFissure[]>("/pc/fissures");
  },

  async getEvents(): Promise<WsEvent[]> {
    return request<WsEvent[]>("/pc/events");
  },

  async getVoidTrader(): Promise<WsVoidTrader> {
    return request<WsVoidTrader>("/pc/voidTrader");
  },

  async getNews(): Promise<WsNews[]> {
    return request<WsNews[]>("/pc/news");
  },

  async getItemData(name: string): Promise<WsItemData> {
    return request<WsItemData>(
      `/items/${encodeURIComponent(name)}/?by=name`,
      3600
    );
  },
};