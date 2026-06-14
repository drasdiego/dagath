import type { Mover, Tier } from "@/types";

const TIER_COLORS: Record<Tier, string> = {
  S: "text-tier-s border-tier-s",
  A: "text-tier-a border-tier-a",
  B: "text-tier-b border-tier-b",
  C: "text-tier-c border-tier-c",
};

type MoverListProps = {
  items: Mover[];
};

export default function MoverList({ items }: MoverListProps) {
  return (
    <ul className="flex flex-col">
      {items.map((item, i) => {
        const up = item.delta >= 0;
        const accent = up ? "var(--up)" : "var(--down)";
        const accentFaint = up ? "var(--up-faint)" : "var(--down-faint)";
        return (
          <li
            key={item.name}
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
            <span
              className={`font-mono text-[9px] uppercase border px-1 shrink-0 ${TIER_COLORS[item.tier]}`}
            >
              {item.tier}
            </span>
            <span className="flex-1 font-body text-sm text-ink-0 truncate">
              {item.name}
            </span>
            <span className="font-mono text-xs text-ink-2 shrink-0 tabular-nums">
              vol {item.vol}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-sm text-gold tabular-nums">
                ◆ {item.plat.toLocaleString("pt-BR")}
              </span>
              <span
                className="font-mono text-xs tabular-nums px-1.5 py-0.5"
                style={{ color: accent, background: accentFaint }}
              >
                {up ? "+" : ""}
                {item.delta.toFixed(1)}%
              </span>
            </div>
          </li>
        );
      })}
    </ul>
  );
}