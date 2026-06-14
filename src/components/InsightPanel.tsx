import HudPanel from "@/components/HudPanel";
import type { InsightReport } from "@/services/insightService";

const TONE_STYLES = {
  up: {
    border: "border-up",
    badge: "bg-up-faint text-up",
    text: "text-up",
    dot: "var(--up)",
  },
  down: {
    border: "border-down",
    badge: "bg-down-faint text-down",
    text: "text-down",
    dot: "var(--down)",
  },
  neutral: {
    border: "border-line-2",
    badge: "bg-bg-2 text-ink-2",
    text: "text-ink-1",
    dot: "var(--cyan)",
  },
} as const;

export default function InsightPanel({ report }: { report: InsightReport }) {
  const verdictStyle = TONE_STYLES[report.verdict.tone];
  const confidence = Math.min(100, Math.max(0, report.insights.length * 25));

  return (
    <HudPanel title="Transmissão Dagath · Análise de 90 dias" variant="accent" clipped>
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span
            className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: verdictStyle.dot, boxShadow: `0 0 8px ${verdictStyle.dot}` }}
          />
          <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink-3">
            Análise concluída · {report.daysAnalyzed} dias · referência {report.currentPrice}p
          </span>
        </div>

        <div
          className="flex items-end justify-between gap-3 flex-wrap border-l-2 pl-4 py-1"
          style={{ borderColor: verdictStyle.dot }}
        >
          <div className="flex flex-col gap-0.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] text-ink-3">
              Veredito do sistema
            </span>
            <span className={`font-display text-2xl font-semibold uppercase tracking-wide ${verdictStyle.text}`}>
              {report.verdict.label}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">
              Confiança
            </span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1 bg-bg-3">
                <div
                  className="h-1"
                  style={{ width: `${confidence}%`, background: verdictStyle.dot }}
                />
              </div>
              <span className="font-mono text-xs tabular-nums" style={{ color: verdictStyle.dot }}>
                {confidence}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col">
          {report.insights.map((insight, index) => {
            const style = TONE_STYLES[insight.tone];
            return (
              <div
                key={insight.title}
                className={`flex items-start gap-3 py-2.5 ${
                  index > 0 ? "border-t border-line-1" : ""
                }`}
              >
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full shrink-0 mt-1.5"
                  style={{ background: style.dot, boxShadow: `0 0 6px ${style.dot}` }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className={`font-mono text-[9px] uppercase tracking-[0.15em] px-1.5 py-0.5 ${style.badge}`}>
                      {insight.kind}
                    </span>
                    <span className="font-body text-sm text-ink-0">{insight.title}</span>
                  </div>
                  <p className="font-body text-xs text-ink-3 leading-snug">{insight.detail}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-1 border-t border-line-1 pt-3 font-mono text-[10px] text-ink-3">
          <span>Semana <span className="text-ink-1 tabular-nums">{report.avg7}p</span></span>
          <span>Mês <span className="text-ink-1 tabular-nums">{report.avg30}p</span></span>
          <span>Mín 90d <span className="text-ink-1 tabular-nums">{report.min90}p</span></span>
          <span>Máx 90d <span className="text-ink-1 tabular-nums">{report.max90}p</span></span>
          <span>Negociações/dia <span className="text-ink-1 tabular-nums">{report.volumeAvg30}</span></span>
        </div>
      </div>
    </HudPanel>
  );
}