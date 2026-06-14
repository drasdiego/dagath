import Link from "next/link";
import HudPanel from "@/components/HudPanel";
import type { PricedRecommendedMods } from "@/services/modService";

export default function ModsPanel({ recommended }: { recommended: PricedRecommendedMods }) {
  return (
    <HudPanel title="Mods recomendados" variant="accent" clipped>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {recommended.mods.map((mod) => (
          <div key={mod.position} className="relative group">
            <Link
              href={mod.modSlug ? `/item/${mod.modSlug}` : "#"}
              className="flex flex-col items-center gap-2 border border-line-2 bg-bg-2 p-3 h-full transition-all duration-200 group-hover:border-line-cyan group-hover:-translate-y-1 group-hover:shadow-[0_0_24px_-8px_var(--cyan-glow)]"
            >
              <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink-3">
                {String(mod.position).padStart(2, "0")} · {mod.role}
              </span>
              {mod.thumb ? (
                <img src={mod.thumb} alt={mod.modName} width={64} height={64} />
              ) : (
                <span className="w-16 h-16 border border-line-1" />
              )}
              <span className="font-body text-xs text-ink-0 text-center leading-tight">
                {mod.modName}
              </span>
              {mod.referencePlat !== null && (
                <span className="font-mono text-sm text-gold">~{mod.referencePlat}p</span>
              )}
            </Link>

            <div className="pointer-events-none absolute left-1/2 bottom-full z-20 mb-2 w-72 -translate-x-1/2 border border-line-cyan bg-bg-1 p-4 opacity-0 transition-opacity duration-150 group-hover:opacity-100 shadow-[0_8px_32px_-8px_rgba(0,0,0,0.8)]">
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="font-display text-sm font-semibold text-ink-0">{mod.modName}</p>
                {mod.maxRank !== null && (
                  <span className="font-mono text-[9px] uppercase text-cyan shrink-0">
                    Rank 0-{mod.maxRank}
                  </span>
                )}
              </div>
              <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-ink-3 mb-2">
                {mod.role}
                {mod.referencePlat !== null && ` · ~${mod.referencePlat}p`}
              </p>
              {mod.description && (
                <p className="font-body text-xs text-ink-1 leading-snug mb-2">{mod.description}</p>
              )}
              {mod.note && (
                <p className="font-body text-xs text-cyan leading-snug border-t border-line-1 pt-2">
                  Na build: {mod.note}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-between gap-3 border-t border-line-1 pt-3 mt-3 flex-wrap">
        <p className="font-body text-xs text-ink-3">
          {recommended.source} · passe o mouse para detalhes · clique para o preço ao vivo · valores de referência da última negociação no rank 0
        </p>
        {recommended.pricedCount > 0 && (
          <p className="font-body text-sm text-ink-1 shrink-0">
            Custo aproximado da build:{" "}
            <span className="font-display text-lg font-semibold text-gold">~{recommended.totalPlat}p</span>
          </p>
        )}
      </div>
    </HudPanel>
  );
}