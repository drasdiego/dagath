import type { MarketPulse, RecentItemStat } from "@/types";
import { warframeMarket, WFM_ASSETS_URL } from "@/integrations/warframeMarket";

export type AggregationResult = {
  totalOrders: number;
  sellOrders: number;
  buyOrders: number;
  platVolume: number;
  uniqueTraders: number;
  stats: RecentItemStat[];
};

export const marketPulseService = {
  async aggregateRecent(): Promise<AggregationResult | null> {
    try {
      const [orders, catalog] = await Promise.all([
        warframeMarket.getRecentOrders(),
        warframeMarket.getAllItems(),
      ]);

      const catalogById = new Map(catalog.map((item) => [item.id, item]));
      const statsById = new Map<string, RecentItemStat>();
      // Base de preço separada da atividade: para itens com rank, só o rank 0 conta
      // no preço (misturar rank 0 e rank máximo gera "valor por unidade" sem sentido).
      const priceById = new Map<string, { volume: number; units: number }>();
      const traders = new Set<string>();
      let platVolume = 0;
      let sellOrders = 0;
      let buyOrders = 0;

      for (const order of orders) {
        traders.add(order.user.ingameName);
        const orderVolume = order.platinum * order.quantity;
        platVolume += orderVolume;
        if (order.type === "sell") sellOrders += 1;
        else buyOrders += 1;

        if (!order.itemId) continue;

        const catalogItem = catalogById.get(order.itemId);

        const existing = statsById.get(order.itemId);
        if (existing) {
          existing.orders += 1;
          existing.units += order.quantity;
          existing.platVolume += orderVolume;
          existing.minPlat = Math.min(existing.minPlat, order.platinum);
          existing.maxPlat = Math.max(existing.maxPlat, order.platinum);
          if (order.type === "sell") existing.sellOrders += 1;
          else existing.buyOrders += 1;
        } else {
          statsById.set(order.itemId, {
            itemId: order.itemId,
            slug: catalogItem?.slug ?? null,
            name: catalogItem?.i18n?.en?.name ?? null,
            thumb: catalogItem?.i18n?.en?.thumb
              ? `${WFM_ASSETS_URL}${catalogItem.i18n.en.thumb}`
              : null,
            orders: 1,
            units: order.quantity,
            platVolume: orderVolume,
            avgPlat: 0,
            minPlat: order.platinum,
            maxPlat: order.platinum,
            sellOrders: order.type === "sell" ? 1 : 0,
            buyOrders: order.type === "buy" ? 1 : 0,
          });
        }

        const ranked =
          typeof catalogItem?.maxRank === "number" && catalogItem.maxRank > 0;
        if (!ranked || order.rank === 0) {
          const price = priceById.get(order.itemId);
          if (price) {
            price.volume += orderVolume;
            price.units += order.quantity;
          } else {
            priceById.set(order.itemId, { volume: orderVolume, units: order.quantity });
          }
        }
      }

      const stats = Array.from(statsById.values())
        .filter((stat) => stat.name !== null)
        .map((stat) => {
          const price = priceById.get(stat.itemId);
          const avgPlat =
            price && price.units > 0
              ? Math.round(price.volume / price.units)
              : Math.round(stat.platVolume / stat.units);
          return { ...stat, avgPlat };
        });

      return {
        totalOrders: orders.length,
        sellOrders,
        buyOrders,
        platVolume,
        uniqueTraders: traders.size,
        stats,
      };
    } catch {
      return null;
    }
  },

  async getPulse(): Promise<MarketPulse | null> {
    const aggregation = await this.aggregateRecent();
    if (!aggregation) return null;

    const { stats } = aggregation;

    const topTraded = [...stats]
      .sort((a, b) => b.orders - a.orders || b.platVolume - a.platVolume)
      .slice(0, 5);

    const topPlatVolume = [...stats]
      .sort((a, b) => b.platVolume - a.platVolume)
      .slice(0, 5);

    const topTicket = [...stats]
      .filter((stat) => stat.orders >= 2)
      .sort((a, b) => b.avgPlat - a.avgPlat)
      .slice(0, 5);

    return {
      windowHours: 4,
      totalOrders: aggregation.totalOrders,
      sellOrders: aggregation.sellOrders,
      buyOrders: aggregation.buyOrders,
      platVolume: aggregation.platVolume,
      uniqueTraders: aggregation.uniqueTraders,
      topTraded,
      topPlatVolume,
      topTicket,
    };
  },
};
