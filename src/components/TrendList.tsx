import Link from "next/link";
import type { TrendMover } from "@/types";

type TrendListProps = {
  items: TrendMover[];
  emptyMessage: string;
};

export default function TrendList({ items, emptyMessage }: TrendListProps) {
  if (items.length === 0) {
    return <p className="font-body text-sm text-ink-2">{emptyMessage}</p>;
  }

  return (
    <ul className="flex flex-col">
      {items.map((item, i) => {
        const up = item.deltaPct >= 0;
        const accent = up ? "var(--up)" : "var(--down)";
        const accentFaint = up ? "var(--up-faint)" : "var(--down-faint)";
        return (
          <li
            key={item.itemId}
            className={`flex items-center gap-3 py-2.5 ${i > 0 ? "border-t border-line-1" : ""}`}
          >
            <span
              className="w-6 h-6 shrink-0 flex items-center justify-center font-mono text-[10px] tabular-nums"
              style={{
                color: accent,
                background: accentFaint,
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
                antes {item.prevAvgPlat}p · {item.orders} anúncios
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-sm text-gold tabular-nums">{item.avgPlat}p</span>
              <span
                className="font-mono text-xs tabular-nums px-1.5 py-0.5"
                style={{ color: accent, background: accentFaint }}
              >
                {up ? "+" : ""}
                {item.deltaPct.toFixed(1)}%
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}