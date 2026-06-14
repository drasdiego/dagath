import { db } from "@/lib/db";
import { marketPulseService } from "@/services/marketPulseService";

export type CollectResult = {
  collectedAt: string;
  itemsRecorded: number;
  totalOrders: number;
  totalRowsInDb: number;
};

const insertSnapshot = db.prepare(`
  INSERT INTO price_snapshots (
    collected_at, item_id, slug, name, thumb,
    orders, units, plat_volume, avg_plat,
    min_plat, max_plat, sell_orders, buy_orders
  ) VALUES (
    @collectedAt, @itemId, @slug, @name, @thumb,
    @orders, @units, @platVolume, @avgPlat,
    @minPlat, @maxPlat, @sellOrders, @buyOrders
  )
`);

const countRows = db.prepare(`SELECT COUNT(*) AS total FROM price_snapshots`);

export const snapshotService = {
  async collect(): Promise<CollectResult | null> {
    const aggregation = await marketPulseService.aggregateRecent();
    if (!aggregation) return null;

    const collectedAt = new Date().toISOString();

    const insertAll = db.transaction(() => {
      for (const stat of aggregation.stats) {
        insertSnapshot.run({
          collectedAt,
          itemId: stat.itemId,
          slug: stat.slug,
          name: stat.name,
          thumb: stat.thumb,
          orders: stat.orders,
          units: stat.units,
          platVolume: stat.platVolume,
          avgPlat: stat.avgPlat,
          minPlat: stat.minPlat,
          maxPlat: stat.maxPlat,
          sellOrders: stat.sellOrders,
          buyOrders: stat.buyOrders,
        });
      }
    });

    insertAll();

    const row = countRows.get() as { total: number };

    return {
      collectedAt,
      itemsRecorded: aggregation.stats.length,
      totalOrders: aggregation.totalOrders,
      totalRowsInDb: row.total,
    };
  },
};