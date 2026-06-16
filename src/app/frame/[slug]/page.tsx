import Link from "next/link";
import { notFound } from "next/navigation";
import { frameService } from "@/services/frameService";
import { compareService } from "@/services/compareService";
import HudPanel from "@/components/HudPanel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function FramePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const frame = await frameService.getBySlug(slug);

  if (!frame) notFound();

  const suggestions = await compareService.suggestTargets(frame);

  const stats = [
    frame.health !== null && { label: "Vida", value: frame.health },
    frame.shield !== null && { label: "Escudo", value: frame.shield },
    frame.armor !== null && { label: "Armadura", value: frame.armor },
    frame.masteryReq !== null && { label: "Mastery", value: frame.masteryReq },
  ].filter(Boolean) as { label: string; value: number }[];

  return (
    <main className="mx-auto max-w-[1680px] px-6 py-10 flex flex-col gap-6">
      <section className="hud-panel hud-panel--accent hud-panel--clipped flex flex-col gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3">
          Codex · {frame.name}
        </p>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[9px] uppercase border border-line-cyan px-1.5 py-0.5 text-cyan">
            Warframe
          </span>
          {frame.isPrime && (
            <span className="font-mono text-[9px] uppercase border border-gold px-1.5 py-0.5 text-gold">
              Prime
            </span>
          )}
          {frame.introduced && (
            <span className="font-mono text-[9px] uppercase border border-line-2 px-1.5 py-0.5 text-ink-2">
              {frame.introduced}
            </span>
          )}
        </div>

        <h1 className="font-display text-4xl lg:text-5xl font-semibold text-ink-0 leading-none">
          {frame.name}
        </h1>

        {frame.description && (
          <p className="font-body text-sm text-ink-2 max-w-3xl leading-relaxed">
            {frame.description}
          </p>
        )}

        {stats.length > 0 && (
          <div className="flex items-center gap-6 flex-wrap pt-1">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">
                  {stat.label}
                </p>
                <p className="font-display text-lg font-semibold text-gold tabular-nums">
                  {stat.value}
                </p>
              </div>
            ))}
            {frame.wikiUrl && (
              <a
                href={frame.wikiUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="border border-line-2 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-2 hover:border-line-cyan hover:text-cyan transition-colors"
              >
                Wiki ↗
              </a>
            )}
          </div>
        )}
      </section>

      {suggestions.length > 0 && (
        <HudPanel title="Comparar este Warframe">
          <p className="font-body text-xs text-ink-2 mb-3">
            Em dúvida sobre qual escolher? A Dagath compara para o seu objetivo e dá o veredito.
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((target) => (
              <Link
                key={target.slug}
                href={`/compare?a=${frame.slug}&b=${target.slug}`}
                className="border border-line-2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-cyan hover:border-line-cyan hover:bg-cyan-faint transition-colors"
              >
                vs {target.name}
              </Link>
            ))}
          </div>
        </HudPanel>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        {frame.passive && (
          <HudPanel title="Passiva">
            <p className="font-body text-sm text-ink-1 leading-relaxed whitespace-pre-line">
              {frame.passive}
            </p>
          </HudPanel>
        )}

        {frame.abilities.length > 0 && (
          <HudPanel title="Habilidades" variant="accent">
            <div className="flex flex-col gap-4">
              {frame.abilities.map((ability, index) => (
                <div
                  key={ability.name}
                  className={index > 0 ? "border-t border-line-1 pt-4" : ""}
                >
                  <p className="font-display text-sm font-semibold uppercase tracking-wide text-cyan">
                    {ability.name}
                  </p>
                  <p className="font-body text-sm text-ink-1 mt-1 leading-relaxed whitespace-pre-line">
                    {ability.description}
                  </p>
                </div>
              ))}
            </div>
          </HudPanel>
        )}
      </div>
    </main>
  );
}
