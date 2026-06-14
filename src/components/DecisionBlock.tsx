import type { Decision, Trend, Liquidity, Demand } from "@/types";

type DecisionBlockProps = {
  decision: Decision;
  trend: Trend;
  liquidity: Liquidity;
  demand: Demand;
};

const VERDICT_COLORS = {
  buy:    { label: "text-up",   bg: "bg-up-faint" },
  wait:   { label: "text-gold", bg: "bg-gold-faint" },
  farm:   { label: "text-cyan", bg: "bg-cyan-faint" },
  profit: { label: "text-gold", bg: "bg-gold-faint" },
};

export default function DecisionBlock({ decision, trend, liquidity, demand }: DecisionBlockProps) {
  const colors = VERDICT_COLORS[decision.verdict];

  return (
    <div className="hud-panel hud-panel--accent hud-panel--clipped flex flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.3em] text-ink-3 mb-1">
            Dagath Intelligence · Camada de Decisão
          </p>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-2 mb-3">
            Cruzamento de mercado, demanda, vault schedule e seu perfil
          </p>
          <p className={`font-display text-3xl font-semibold uppercase ${colors.label}`}>
            {decision.verdictLabel}
          </p>
          <p className="font-body text-sm text-ink-1 mt-2 max-w-xl">
            {decision.summary}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">Confidence</p>
          <p className="font-display text-4xl font-semibold text-cyan">
            {Math.round(decision.confidence * 100)}
            <span className="text-lg text-ink-2">/100</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="hud-panel hud-panel--gold flex flex-col gap-1">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">ROI Esperado · 30d</p>
          <p className="font-display text-2xl font-semibold text-gold">+{decision.roi30d.plat} <span className="text-sm text-ink-3">plat</span></p>
          <p className="font-mono text-xs text-up">+{decision.roi30d.pct}%</p>
        </div>
        <div className="hud-panel hud-panel--gold flex flex-col gap-1">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">ROI Esperado · 90d</p>
          <p className="font-display text-2xl font-semibold text-gold">+{decision.roi90d.plat} <span className="text-sm text-ink-3">plat</span></p>
          <p className="font-mono text-xs text-up">+{decision.roi90d.pct}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="hud-panel flex flex-col gap-1">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">Tendência</p>
          <p className="font-mono text-xs text-cyan">{trend.sentimentLabel}</p>
          <p className={`font-display text-xl font-semibold ${trend.delta30d >= 0 ? "text-up" : "text-down"}`}>
            {trend.delta30d > 0 ? "+" : ""}{trend.delta30d}%
            <span className="font-mono text-[10px] text-ink-3 ml-1">30d</span>
          </p>
          <p className="font-mono text-[10px] text-ink-2">Projeção 30d: +{trend.proj30d}%</p>
        </div>
        <div className="hud-panel flex flex-col gap-1">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">Liquidez</p>
          <p className="font-mono text-xs text-up">{liquidity.level}</p>
          <p className="font-display text-xl font-semibold text-ink-0">
            {liquidity.score}
            <span className="font-mono text-[10px] text-ink-3 ml-1">score/100</span>
          </p>
          <p className="font-mono text-[10px] text-ink-2">Vende em ~{liquidity.sellTimeMin}min · {liquidity.weeklyVolume} vol/7d</p>
        </div>
        <div className="hud-panel flex flex-col gap-1">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">Demanda</p>
          <p className="font-mono text-xs text-up">{demand.level}</p>
          <p className="font-display text-xl font-semibold text-ink-0">
            {demand.buyersPerSeller}
            <span className="font-mono text-[10px] text-ink-3 ml-1">buy/sell ratio</span>
          </p>
          <p className="font-mono text-[10px] text-ink-2">
            Wishlist {demand.wishlist.toLocaleString("pt-BR")} · +{demand.wishlistDelta7d}% /7d
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">Catalisadores</p>
        {decision.catalysts.map((c, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className={`w-4 h-4 flex items-center justify-center font-mono text-xs font-semibold shrink-0 ${c.tone === "up" ? "text-up" : "text-down"}`}>
              {c.tone === "up" ? "+" : "−"}
            </span>
            <span className="font-body text-sm text-ink-1">{c.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}