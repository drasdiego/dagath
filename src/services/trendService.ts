import { getSql, ensureSchema } from "@/lib/postgres";
import type { MarketTrends, TrendMover } from "@/types";

type JoinedRow = {
  item_id: string;
  slug: string | null;
  name: string | null;
  thumb: string | null;
  cur_avg: number;
  prev_avg: number;
  cur_orders: number;
  prev_orders: number;
  cur_volume: number;
};

type TotalsRow = {
  collected_at: string;
  total_orders: number;
  total_volume: number;
};

// Comparar janelas largas, não os últimos 5 minutos: isso transforma ruído em tendência.
const TARGET_GAP_MS = 6 * 60 * 60 * 1000; // janela alvo de comparação
const MIN_GAP_MS = 60 * 60 * 1000; // gap mínimo para a tendência ser confiável
const MIN_PRICE = 15; // ignora itens muito baratos, onde % vira ruído
const MIN_ORDERS = 2; // amostra mínima por janela (o feed de 4h é esparso por item)
const MAX_DELTA_PCT = 100; // descarta variações absurdas (anúncio fora da curva)

function pctChange(current: number, previous: number): number {
  if (previous === 0) return 0;
  return ((current - previous) / previous) * 100;
}

function windowLabel(minutes: number): string {
  if (minutes >= 2880) {
    return `${Math.round(minutes / 1440)} dias`;
  }
  if (minutes >= 90) {
    return `${Math.round(minutes / 60)} horas`;
  }
  return `${Math.max(1, minutes)} minutos`;
}

export const trendService = {
  async getTrends(): Promise<MarketTrends | null> {
    const sql = await getSql();
    await ensureSchema();

    const timesResult = await sql<{ collected_at: string }>`
      SELECT DISTINCT collected_at
      FROM price_snapshots
      ORDER BY collected_at DESC
    `;
    const times = timesResult.rows.map((row) => row.collected_at);
    if (times.length < 2) return null;

    const currentAt = times[0];
    const currentMs = Date.parse(currentAt);

    // Só compara com snapshots distantes o suficiente. Sem isso, é ruído de 5 min.
    const candidates = times.filter(
      (time) => currentMs - Date.parse(time) >= MIN_GAP_MS
    );
    if (candidates.length === 0) return null;

    const targetMs = currentMs - TARGET_GAP_MS;
    let previousAt = candidates[0];
    let bestDiff = Math.abs(Date.parse(previousAt) - targetMs);
    for (const time of candidates) {
      const diff = Math.abs(Date.parse(time) - targetMs);
      if (diff < bestDiff) {
        bestDiff = diff;
        previousAt = time;
      }
    }

    const joined = await sql<JoinedRow>`
      SELECT
        cur.item_id,
        cur.slug,
        cur.name,
        cur.thumb,
        cur.avg_plat   AS cur_avg,
        prev.avg_plat  AS prev_avg,
        cur.orders     AS cur_orders,
        prev.orders    AS prev_orders,
        cur.plat_volume AS cur_volume
      FROM price_snapshots cur
      INNER JOIN price_snapshots prev
        ON prev.item_id = cur.item_id
       AND prev.collected_at = ${previousAt}
      WHERE cur.collected_at = ${currentAt}
    `;

    const movers: TrendMover[] = joined.rows
      .map((row) => ({
        itemId: row.item_id,
        slug: row.slug,
        name: row.name,
        thumb: row.thumb,
        curAvg: Number(row.cur_avg),
        prevAvg: Number(row.prev_avg),
        curOrders: Number(row.cur_orders),
        prevOrders: Number(row.prev_orders),
        curVolume: Number(row.cur_volume),
      }))
      .filter(
        (row) =>
          row.prevAvg >= MIN_PRICE &&
          row.curAvg >= MIN_PRICE &&
          row.curOrders >= MIN_ORDERS &&
          row.prevOrders >= MIN_ORDERS
      )
      .map((row) => ({
        itemId: row.itemId,
        slug: row.slug,
        name: row.name,
        thumb: row.thumb,
        avgPlat: row.curAvg,
        prevAvgPlat: row.prevAvg,
        deltaPct: pctChange(row.curAvg, row.prevAvg),
        orders: row.curOrders,
        platVolume: row.curVolume,
      }))
      .filter((mover) => Math.abs(mover.deltaPct) <= MAX_DELTA_PCT);

    const topGainers = movers
      .filter((mover) => mover.deltaPct > 0)
      .sort((a, b) => b.deltaPct - a.deltaPct)
      .slice(0, 5);

    const topLosers = movers
      .filter((mover) => mover.deltaPct < 0)
      .sort((a, b) => a.deltaPct - b.deltaPct)
      .slice(0, 5);

    const totalsResult = await sql<TotalsRow>`
      SELECT
        collected_at,
        SUM(orders)::int      AS total_orders,
        SUM(plat_volume)::int AS total_volume
      FROM price_snapshots
      WHERE collected_at IN (${currentAt}, ${previousAt})
      GROUP BY collected_at
    `;
    const currentTotals = totalsResult.rows.find((row) => row.collected_at === currentAt);
    const previousTotals = totalsResult.rows.find((row) => row.collected_at === previousAt);

    const minutesBetween = Math.round((currentMs - Date.parse(previousAt)) / 60000);

    return {
      currentAt,
      previousAt,
      minutesBetween,
      windowLabel: windowLabel(minutesBetween),
      topGainers,
      topLosers,
      totals: {
        orders: Number(currentTotals?.total_orders ?? 0),
        ordersDeltaPct: pctChange(
          Number(currentTotals?.total_orders ?? 0),
          Number(previousTotals?.total_orders ?? 0)
        ),
        platVolume: Number(currentTotals?.total_volume ?? 0),
        platVolumeDeltaPct: pctChange(
          Number(currentTotals?.total_volume ?? 0),
          Number(previousTotals?.total_volume ?? 0)
        ),
      },
    };
  },
};
