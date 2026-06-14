import type { GenericItem } from "@/types";
import type { InsightReport } from "@/services/insightService";

type HeroBadge = {
  label: string;
  tone: "gold" | "cyan" | "neutral" | "up" | "down";
};

type HeroProps = {
  name: string;
  art: string | null;
  category: string;
  description: string | null;
  badges: HeroBadge[];
  tags: string[];
  generic: GenericItem | null;
  report: InsightReport | null;
  breadcrumb: string;
  accentColor: string | null;
};

const TONE_BORDER: Record<HeroBadge["tone"], string> = {
  gold: "border-gold text-gold",
  cyan: "border-line-cyan text-cyan",
  neutral: "border-line-2 text-ink-2",
  up: "border-up text-up",
  down: "border-down text-down",
};

const VERDICT = {
  up: {
    action: "Bom momento para comprar",
    color: "var(--up)",
    faint: "var(--up-faint)",
  },
  down: {
    action: "Momento de cautela",
    color: "var(--down)",
    faint: "var(--down-faint)",
  },
  neutral: {
    action: "Mercado estável",
    color: "var(--cyan)",
    faint: "var(--cyan-faint)",
  },
} as const;

function verdictReason(report: InsightReport): string {
  const vsAvg = report.avg30 > 0
    ? Math.round(((report.currentPrice - report.avg30) / report.avg30) * 100)
    : 0;

  if (report.verdict.tone === "up") {
    return `Custa ${report.currentPrice}p agora, ${Math.abs(vsAvg)}% ${vsAvg < 0 ? "abaixo" : "acima"} da média de 30 dias (${Math.round(report.avg30)}p). Os sinais do período pesam a favor.`;
  }
  if (report.verdict.tone === "down") {
    return `Custa ${report.currentPrice}p agora, contra ${Math.round(report.avg30)}p de média no mês. Os sinais sugerem esperar.`;
  }
  return `Preço de ${report.currentPrice}p alinhado com a média de 30 dias (${Math.round(report.avg30)}p). Sem movimento fora do padrão.`;
}

export default function Hero({
  name,
  art,
  category,
  description,
  badges,
  tags,
  generic,
  report,
  breadcrumb,
  accentColor,
}: HeroProps) {
  const hasMarket = Boolean(generic?.market);
  const verdict = report ? VERDICT[report.verdict.tone] : null;
  const glow = accentColor ?? verdict?.color ?? "var(--cyan)";
  const rankBased = Boolean(
    generic && typeof generic.maxRank === "number" && generic.maxRank > 0
  );

  const metrics = generic?.market
    ? [
        { label: "Mínimo ao vivo", value: `${generic.market.low}p`, accent: true },
        { label: "Média", value: `${generic.market.avg}p`, accent: false },
        { label: "Máximo", value: `${generic.market.high}p`, accent: false },
        { label: "Vendedores ativos", value: String(generic.market.sellersOnline), accent: false },
      ]
    : [];

  return (
    <section className="hud-panel hud-panel--accent hud-panel--clipped relative overflow-hidden">
      {accentColor && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 z-0"
          style={{
            background: `radial-gradient(ellipse 75% 95% at 14% -15%, ${accentColor}2b, transparent 60%)`,
          }}
        />
      )}

      <div className="relative z-10 flex flex-col gap-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3">{breadcrumb}</p>

        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {art && (
            <div className="relative shrink-0 mx-auto lg:mx-0">
              <div
                className="absolute inset-0 -z-10 blur-2xl opacity-30"
                style={{ background: `radial-gradient(circle at 50% 40%, ${glow}, transparent 70%)` }}
              />
              <img
                src={art}
                alt={name}
                width={200}
                height={200}
                className="w-44 h-44 lg:w-52 lg:h-52 object-contain border border-line-2 bg-bg-2/60 p-4"
              />
            </div>
          )}

          <div className="flex-1 min-w-0 flex flex-col gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              {badges.map((badge) => (
                <span
                  key={badge.label}
                  className={`font-mono text-[9px] uppercase border px-1.5 py-0.5 ${TONE_BORDER[badge.tone]}`}
                >
                  {badge.label}
                </span>
              ))}
            </div>

            <h1 className="font-display text-4xl lg:text-5xl font-semibold text-ink-0 leading-none">
              {name}
            </h1>

            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink-3">{category}</p>

            {description && (
              <p className="font-body text-sm text-ink-2 max-w-2xl leading-relaxed">{description}</p>
            )}

            {tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {tags.slice(0, 8).map((tag) => (
                  <span key={tag} className="font-mono text-[9px] text-ink-3 border border-line-1 px-1.5 py-0.5">
                    # {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {metrics.length > 0 && (
            <div className="shrink-0 lg:w-48 flex flex-col gap-3 lg:border-l lg:border-line-1 lg:pl-5">
              <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink-3">
                Régua operacional{rankBased ? " · rank 0" : ""}
              </p>
              {metrics.map((metric) => (
                <div key={metric.label} className="flex items-baseline justify-between gap-2">
                  <span className="font-mono text-[9px] uppercase tracking-wide text-ink-3">{metric.label}</span>
                  <span
                    className={`font-display font-semibold tabular-nums ${
                      metric.accent ? "text-gold text-xl" : "text-ink-1 text-sm"
                    }`}
                  >
                    {metric.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {verdict && hasMarket && report && (
          <div
            className="flex flex-col gap-1.5 border-l-2 pl-4 py-2"
            style={{ borderColor: verdict.color, background: `linear-gradient(90deg, ${verdict.faint}, transparent 70%)` }}
          >
            <div className="flex items-center gap-2">
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: verdict.color, boxShadow: `0 0 8px ${verdict.color}` }}
              />
              <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink-3">
                Veredito Dagath · o que fazer agora
              </span>
            </div>
            <p className="font-display text-2xl font-semibold uppercase tracking-wide" style={{ color: verdict.color }}>
              {verdict.action}
            </p>
            <p className="font-body text-sm text-ink-1 max-w-3xl leading-relaxed">{verdictReason(report)}</p>
          </div>
        )}
      </div>
    </section>
  );
}
