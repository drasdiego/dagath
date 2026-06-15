import Link from "next/link";
import HudPanel from "@/components/HudPanel";
import type { Opportunity } from "@/services/opportunityService";

export default function OpportunityList({
  opportunities,
  title,
}: {
  opportunities: Opportunity[];
  title?: string;
}) {
  return (
    <HudPanel
      title={title ?? `Oportunidades detectadas · ${opportunities.length}`}
      variant="gold"
      clipped
    >
      {opportunities.length === 0 ? (
        <p className="font-body text-sm text-ink-2">
          Sem caçada urgente agora, Tenno. O mercado está dentro dos padrões. Bom momento para farmar ou montar build.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 items-stretch">
          {opportunities.map((opportunity) => (
            <Link
              key={opportunity.slug}
              href={`/item/${opportunity.slug}`}
              className="flex items-start gap-3 border border-line-1 p-3 hover:border-line-gold hover:bg-bg-2 transition-colors group h-full"
            >
              {opportunity.thumb ? (
                <img
                  src={opportunity.thumb}
                  alt={opportunity.name}
                  width={48}
                  height={48}
                  className="shrink-0 mt-0.5"
                />
              ) : (
                <span className="w-12 h-12 border border-line-1 shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="font-body text-sm text-ink-0 group-hover:text-gold transition-colors truncate">
                    {opportunity.name}
                  </span>
                  <span className="font-mono text-[9px] uppercase tracking-[0.15em] px-1.5 py-0.5 bg-up-faint text-up shrink-0">
                    {opportunity.kind}
                  </span>
                </div>
                <p className="font-body text-xs text-ink-1">{opportunity.title}</p>
                <p className="font-body text-xs text-ink-3 mt-0.5">{opportunity.detail}</p>
              </div>
              <span className="font-display text-lg font-semibold text-gold shrink-0">
                {opportunity.currentPrice}p
              </span>
            </Link>
          ))}
        </div>
      )}
    </HudPanel>
  );
}