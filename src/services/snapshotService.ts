import { getSql, ensureSchema } from "@/lib/postgres";
import { marketPulseService } from "@/services/marketPulseService";

export type CollectResult = {
  collectedAt: string;
  itemsRecorded: number;
  totalOrders: number;
  totalRowsInDb: number;
};

const COLUMNS = 13;

export const snapshotService = {
  async collect(): Promise<CollectResult | null> {
    const aggregation = await marketPulseService.aggregateRecent();
    if (!aggregation) return null;

    const collectedAt = new Date().toISOString();
    const sql = await getSql();
    await ensureSchema();

    if (aggregation.stats.length > 0) {
      // Insert em lote: uma única ida ao banco com VALUES parametrizado.
      const placeholders = aggregation.stats
        .map((_, row) => {
          const base = row * COLUMNS;
          const slots = Array.from({ length: COLUMNS }, (_, col) => `$${base + col + 1}`);
          return `(${slots.join(", ")})`;
        })
        .join(", ");

      const params: (string | number | null)[] = [];
      for (const stat of aggregation.stats) {
        params.push(
          collectedAt,
          stat.itemId,
          stat.slug,
          stat.name,
          stat.thumb,
          stat.orders,
          stat.units,
          stat.platVolume,
          stat.avgPlat,
          stat.minPlat,
          stat.maxPlat,
          stat.sellOrders,
          stat.buyOrders
        );
      }

      await sql.query(
        `INSERT INTO price_snapshots (
          collected_at, item_id, slug, name, thumb,
          orders, units, plat_volume, avg_plat,
          min_plat, max_plat, sell_orders, buy_orders
        ) VALUES ${placeholders}`,
        params
      );
    }

    const { rows } = await sql<{ total: number }>`
      SELECT COUNT(*)::int AS total FROM price_snapshots
    `;

    return {
      collectedAt,
      itemsRecorded: aggregation.stats.length,
      totalOrders: aggregation.totalOrders,
      totalRowsInDb: Number(rows[0]?.total ?? 0),
    };
  },
};
