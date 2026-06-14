import { db } from "@/lib/db";
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

const distinctTimes = db.prepare(`
  SELECT DISTINCT collected_at
  FROM price_snapshots
  ORDER BY collected_at DESC
`);

const joinedSnapshots = db.prepare(`
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
   AND prev.collected_at = @previousAt
  WHERE cur.collected_at = @currentAt
`);

const totalsByTime = db.prepare(`
  SELECT
    collected_at,
    SUM(orders)      AS total_orders,
    SUM(plat_volume) AS total_volume
  FROM price_snapshots
  WHERE collected_at IN (@currentAt, @previousAt)
  GROUP BY collected_at
`);

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
  getTrends(): MarketTrends | null {
    const times = (distinctTimes.all() as { collected_at: string }[]).map(
      (row) => row.collected_at
    );
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

    const rows = joinedSnapshots.all({ currentAt, previousAt }) as JoinedRow[];

    const movers: TrendMover[] = rows
      .filter(
        (row) =>
          row.prev_avg >= MIN_PRICE &&
          row.cur_avg >= MIN_PRICE &&
          row.cur_orders >= MIN_ORDERS &&
          row.prev_orders >= MIN_ORDERS
      )
      .map((row) => ({
        itemId: row.item_id,
        slug: row.slug,
        name: row.name,
        thumb: row.thumb,
        avgPlat: row.cur_avg,
        prevAvgPlat: row.prev_avg,
        deltaPct: pctChange(row.cur_avg, row.prev_avg),
        orders: row.cur_orders,
        platVolume: row.cur_volume,
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

    const totalsRows = totalsByTime.all({ currentAt, previousAt }) as TotalsRow[];
    const currentTotals = totalsRows.find((row) => row.collected_at === currentAt);
    const previousTotals = totalsRows.find((row) => row.collected_at === previousAt);

    const minutesBetween = Math.round((currentMs - Date.parse(previousAt)) / 60000);

    return {
      currentAt,
      previousAt,
      minutesBetween,
      windowLabel: windowLabel(minutesBetween),
      topGainers,
      topLosers,
      totals: {
        orders: currentTotals?.total_orders ?? 0,
        ordersDeltaPct: pctChange(
          currentTotals?.total_orders ?? 0,
          previousTotals?.total_orders ?? 0
        ),
        platVolume: currentTotals?.total_volume ?? 0,
        platVolumeDeltaPct: pctChange(
          currentTotals?.total_volume ?? 0,
          previousTotals?.total_volume ?? 0
        ),
      },
    };
  },
};
