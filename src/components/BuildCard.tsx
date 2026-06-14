import type { Build } from "@/types";

const FLAVOR_LABELS = {
  popular: "Popular",
  steel:   "Steel Path",
  endgame: "Endgame",
  econ:    "Econômica",
};

const FLAVOR_COLORS = {
  popular: "text-cyan border-line-cyan",
  steel:   "text-gold border-line-gold",
  endgame: "text-down border-down",
  econ:    "text-ink-2 border-line-2",
};

type BuildCardProps = {
  build: Build;
};

export default function BuildCard({ build }: BuildCardProps) {
  const flavor = FLAVOR_COLORS[build.flavor];
  const label  = FLAVOR_LABELS[build.flavor];

  return (
    <div className="hud-panel flex flex-col gap-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className={`font-mono text-[9px] uppercase border px-1.5 py-0.5 ${flavor}`}>
            {label}
          </span>
          <p className="font-display text-base font-semibold text-ink-0 mt-1">{build.name}</p>
          <p className="font-mono text-[10px] text-ink-3">by {build.author} · {build.votes.toLocaleString("pt-BR")} votos</p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-[10px] text-ink-3">Forma</p>
          <p className="font-display text-xl font-semibold text-cyan">{build.forma}</p>
          <p className="font-mono text-[9px] text-ink-3">MR {build.mr}</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {Object.entries(build.stats).map(([key, val]) => (
          <div key={key} className="flex flex-col items-center gap-1">
            <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink-3">{key.slice(0, 3)}</p>
            <p className="font-display text-lg font-semibold text-ink-0">{val}</p>
            <div className="w-full h-0.5 bg-line-1">
              <div
                className="h-full bg-cyan"
                style={{ width: `${Math.min(100, (val / 500) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-1">
        {build.mods.map((mod) => (
          <span key={mod.name} className="font-mono text-[9px] border border-line-2 px-1.5 py-0.5 text-ink-1">
            {mod.name} {mod.rank > 0 && <span className="text-ink-3">R{mod.rank}</span>}
          </span>
        ))}
      </div>

      <p className="font-body text-xs text-ink-2 border-t border-line-1 pt-3">{build.notes}</p>
    </div>
  );
}