type KpiCardProps = {
  label: string;
  value: string;
  unit?: string;
  delta?: number;
  sub?: string;
};

export default function KpiCard({ label, value, unit, delta, sub }: KpiCardProps) {
  const state = delta === undefined ? "neutral" : delta >= 0 ? "up" : "down";

  const scanColor =
    state === "up" ? "var(--up)" : state === "down" ? "var(--down)" : "var(--cyan)";

  return (
    <div className="hud-panel flex flex-col gap-3 overflow-hidden">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-ink-2 truncate">
          {label}
        </span>
        <span
          className="font-mono text-[8px] uppercase tracking-[0.15em] text-ink-3 shrink-0"
          style={{ color: scanColor, opacity: 0.7 }}
        >
          {state === "up" ? "▲" : state === "down" ? "▼" : "●"}
        </span>
      </div>

      <div
        className="h-px w-full"
        style={{
          background: `linear-gradient(90deg, ${scanColor} 0%, ${scanColor} 30%, transparent 70%)`,
          opacity: 0.5,
        }}
      />

      <div className="flex items-baseline gap-1.5">
        <span className="font-display text-3xl font-semibold text-ink-0 tabular-nums tracking-tight">
          {value}
        </span>
        {unit && (
          <span className="font-mono text-[10px] text-ink-3 uppercase tracking-wider">{unit}</span>
        )}
      </div>

      {delta !== undefined ? (
        <div className="flex items-center gap-2">
          <span
            className="font-mono text-xs tabular-nums px-2 py-0.5"
            style={{
              color: scanColor,
              background:
                state === "up"
                  ? "var(--up-faint)"
                  : state === "down"
                  ? "var(--down-faint)"
                  : "var(--cyan-faint)",
            }}
          >
            {delta >= 0 ? "+" : ""}
            {delta.toFixed(1)}%
          </span>
          <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink-3">
            vs. anterior
          </span>
        </div>
      ) : sub ? (
        <span className="font-mono text-[10px] text-ink-3 leading-snug">{sub}</span>
      ) : null}
    </div>
  );
}