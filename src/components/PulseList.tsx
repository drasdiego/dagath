import Link from "next/link";
import type { RecentItemStat } from "@/types";

type PulseMetric = "orders" | "volume" | "ticket";

type PulseListProps = {
  items: RecentItemStat[];
  metric: PulseMetric;
};

function mainValue(item: RecentItemStat, metric: PulseMetric): string {
  switch (metric) {
    case "orders": return `${item.orders} anúncios`;
    case "volume": return `${item.platVolume.toLocaleString("pt-BR")}p`;
    case "ticket": return `${item.avgPlat.toLocaleString("pt-BR")}p / un`;
  }
}

function subValue(item: RecentItemStat, metric: PulseMetric): string {
  switch (metric) {
    case "orders": return `${item.units} unidades`;
    case "volume": return `${item.units} unidades`;
    case "ticket": return `${item.orders} anúncios`;
  }
}

export default function PulseList({ items, metric }: PulseListProps) {
  if (items.length === 0) {
    return <p className="font-body text-sm text-ink-2">Sem dados nas últimas horas.</p>;
  }

  return (
    <ul className="flex flex-col">
      {items.map((item, i) => {
        const top = i < 3;
        return (
          <li
            key={item.itemId}
            className={`flex items-center gap-3 py-2.5 ${i > 0 ? "border-t border-line-1" : ""}`}
          >
            <span
              className="w-6 h-6 shrink-0 flex items-center justify-center font-mono text-[10px] tabular-nums"
              style={{
                color: top ? "var(--cyan)" : "var(--ink-3)",
                background: top ? "var(--cyan-faint)" : "transparent",
                clipPath: "polygon(0 0, 100% 0, 100% 70%, 70% 100%, 0 100%)",
              }}
            >
              {String(i + 1).padStart(2, "0")}
            </span>

            {item.thumb ? (
              <img
                src={item.thumb}
                alt={item.name ?? ""}
                width={48}
                height={48}
                className="shrink-0 border border-line-1 bg-bg-2 p-0.5"
              />
            ) : (
              <span className="w-12 h-12 border border-line-1 shrink-0" />
            )}

            <div className="flex-1 min-w-0">
              {item.slug ? (
                <Link
                  href={`/item/${item.slug}`}
                  className="font-body text-sm text-ink-0 truncate block hover:text-cyan transition-colors"
                >
                  {item.name}
                </Link>
              ) : (
                <span className="font-body text-sm text-ink-0 truncate block">{item.name}</span>
              )}
              <p className="font-mono text-[9px] uppercase tracking-wide text-ink-3">
                {item.sellOrders} vendendo · {item.buyOrders} comprando
              </p>
            </div>

            <div className="text-right shrink-0">
              <p className="font-mono text-sm text-gold tabular-nums">{mainValue(item, metric)}</p>
              <p className="font-mono text-[10px] text-ink-3 tabular-nums">{subValue(item, metric)}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}