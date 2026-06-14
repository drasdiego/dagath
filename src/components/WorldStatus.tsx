import HudPanel from "@/components/HudPanel";
import type { WorldState } from "@/services/worldService";

type WorldCell = {
  key: string;
  title: string;
  variant?: "default" | "accent" | "gold";
  caption: string;
  content: React.ReactNode;
};

const CAPTION_CLASS = "font-body text-xs font-medium text-ink-2 px-1";

export default function WorldStatus({ world }: { world: WorldState }) {
  const { fissures, events, baro, news } = world;

  const cells: WorldCell[] = [];

  if (fissures) {
    cells.push({
      key: "fissures",
      title: `Fendas abertas · ${fissures.total}`,
      variant: "accent",
      caption: "Missões que abrem relíquias agora",
      content: (
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-1.5">
            {fissures.byTier.map((tier) => (
              <span
                key={tier.tier}
                className="font-mono text-[10px] uppercase border border-line-2 px-1.5 py-0.5 text-ink-1"
              >
                {tier.tier} <span className="text-cyan">{tier.count}</span>
              </span>
            ))}
          </div>
          <p className="font-mono text-[10px] uppercase text-ink-3">
            {fissures.steelPathCount} Steel Path · {fissures.railjackCount} Railjack
          </p>
          <div className="flex flex-col divide-y divide-line-1 border-t border-line-1">
            {fissures.endingSoon.map((fissure) => (
              <div key={`${fissure.node}-${fissure.tier}`} className="flex items-center gap-2 py-2">
                <span className="font-mono text-[10px] uppercase text-cyan w-14 shrink-0">
                  {fissure.tier}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-xs text-ink-0 truncate">{fissure.node}</p>
                  <p className="font-mono text-[9px] uppercase text-ink-3">
                    {fissure.mission} · {fissure.enemy}
                    {fissure.steelPath && " · Steel Path"}
                  </p>
                </div>
                <span className="font-mono text-xs text-gold shrink-0">
                  {fissure.remainingMinutes} min
                </span>
              </div>
            ))}
          </div>
        </div>
      ),
    });
  }

  if (events || baro) {
    cells.push({
      key: "events",
      title: "Eventos e visitas",
      caption: "Eventos ativos e a visita do mercador do Void",
      content: (
        <div className="flex flex-col gap-3">
          {events?.map((event) => (
            <div key={event.name} className="flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <p className="font-body text-sm text-ink-0">{event.name}</p>
                {event.remainingDays !== null && event.remainingDays > 0 && (
                  <span className="font-mono text-[10px] text-ink-3 shrink-0">
                    {event.remainingDays} dias restantes
                  </span>
                )}
              </div>
              {event.place && (
                <p className="font-mono text-[10px] uppercase text-ink-3">{event.place}</p>
              )}
              {event.progressPct !== null && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-bg-2">
                    <div
                      className="h-1 bg-cyan"
                      style={{ width: `${Math.min(100, event.progressPct)}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-cyan">{event.progressPct}%</span>
                </div>
              )}
              {event.mainRewards.length > 0 && (
                <p className="font-body text-xs text-ink-2">
                  Recompensa: {event.mainRewards.join(", ")}
                </p>
              )}
            </div>
          ))}

          {baro && (
            <div className="border-t border-line-1 pt-3 flex items-center gap-3">
              <span
                className={`font-mono text-[9px] uppercase tracking-[0.15em] px-1.5 py-0.5 shrink-0 ${
                  baro.status === "na_estacao"
                    ? "bg-gold-faint text-gold"
                    : "bg-bg-2 text-ink-2"
                }`}
              >
                {baro.status === "na_estacao" ? "Na estação" : "A caminho"}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-ink-0">Baro Ki'Teer</p>
                <p className="font-mono text-[10px] uppercase text-ink-3">
                  {baro.location} · {baro.whenText}
                  {baro.inventoryCount > 0 && ` · ${baro.inventoryCount} itens`}
                </p>
              </div>
            </div>
          )}
        </div>
      ),
    });
  }

  if (news && news.length > 0) {
    cells.push({
      key: "news",
      title: "Notícias",
      caption: "Notícias oficiais do Warframe",
      content: (
        <ul className="flex flex-col divide-y divide-line-1">
          {news.map((item) => (
            <li key={item.link} className="py-2 first:pt-0 last:pb-0">
              <a
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-2"
              >
                <span className="font-mono text-[9px] uppercase border border-line-2 px-1.5 py-0.5 text-ink-2 shrink-0 mt-0.5">
                  {item.kind}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-sm text-ink-0 group-hover:text-cyan transition-colors leading-snug">
                    {item.title}
                  </p>
                  <p className="font-mono text-[10px] text-ink-3">
                    {item.daysAgo === 0 ? "hoje" : `há ${item.daysAgo} dias`}
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (cells.length === 0) return null;

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 items-stretch">
        {cells.map((cell) => (
          <div key={cell.key} className="flex flex-col h-full">
            <HudPanel title={cell.title} variant={cell.variant} className="flex-1">
              {cell.content}
            </HudPanel>
            <p className={`sm:hidden ${CAPTION_CLASS} mt-2`}>{cell.caption}</p>
          </div>
        ))}
      </div>
      <div className="hidden sm:grid sm:grid-cols-3 gap-3 mt-2">
        {cells.map((cell) => (
          <p key={cell.key} className={CAPTION_CLASS}>{cell.caption}</p>
        ))}
      </div>
    </div>
  );
}