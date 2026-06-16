import Link from "next/link";
import HudPanel from "@/components/HudPanel";
import type { HardDecision } from "@/services/decisionService";

export default function HardDecisions({ decisions }: { decisions: HardDecision[] }) {
  if (decisions.length === 0) return null;

  return (
    <HudPanel title="Decisões difíceis · eu decido com você">
      <p className="font-body text-xs text-ink-2 mb-3">
        Dúvidas que travam muita gente. Toque numa e eu dou o veredito para o seu objetivo.
      </p>
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {decisions.map((decision) => (
          <Link
            key={decision.id}
            href={`/compare?a=${decision.aSlug}&b=${decision.bSlug}&goal=${encodeURIComponent(decision.goal)}`}
            className="flex items-center justify-between gap-3 border border-line-1 p-3 hover:border-line-cyan hover:bg-bg-2 transition-colors group"
          >
            <span className="font-body text-sm text-ink-0 group-hover:text-cyan transition-colors">
              {decision.question}
            </span>
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-cyan shrink-0">
              decidir →
            </span>
          </Link>
        ))}
      </div>
    </HudPanel>
  );
}
