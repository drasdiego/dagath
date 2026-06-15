import Link from "next/link";
import HudPanel from "@/components/HudPanel";
import KpiCard from "@/components/KpiCard";
import MoverList from "@/components/MoverList";
import PulseList from "@/components/PulseList";
import TrendList from "@/components/TrendList";
import OpportunityList from "@/components/OpportunityList";
import JourneyPanel from "@/components/JourneyPanel";
import WorldStatus from "@/components/WorldStatus";
import { dashboardService } from "@/services/dashboardService";
import { marketPulseService } from "@/services/marketPulseService";
import { trendService } from "@/services/trendService";
import { opportunityService } from "@/services/opportunityService";
import { worldService } from "@/services/worldService";
import type { Opportunity } from "@/services/opportunityService";

export const revalidate = 60;

const CAPTION_CLASS = "font-body text-xs font-medium text-ink-2 px-1";

function formatToday(): string {
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Bom dia, Tenno";
  if (hour >= 12 && hour < 18) return "Boa tarde, Tenno";
  return "Boa noite, Tenno";
}

type RowCell = {
  key: string;
  title: string;
  variant?: "default" | "accent" | "gold";
  caption: string;
  content: React.ReactNode;
};

function CaptionedRow({ cells }: { cells: RowCell[] }) {
  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 items-stretch">
        {cells.map((cell) => (
          <div key={cell.key} className="flex flex-col h-full">
            <HudPanel title={cell.title} variant={cell.variant} className="flex-1">
              {cell.content}
            </HudPanel>
            <p className={`sm:hidden ${CAPTION_CLASS} mt-2`}>{cell.caption}</p>
          </div>
        ))}
      </div>
      <div className="hidden sm:grid sm:grid-cols-2 gap-3 mt-2">
        {cells.map((cell) => (
          <p key={cell.key} className={CAPTION_CLASS}>{cell.caption}</p>
        ))}
      </div>
    </div>
  );
}

// Bloco focal do HUB: a prioridade do dia, não um relatório. Responde "o que
// fazer agora?" com a melhor oportunidade do momento, no tom de um Tenno
// veterano apontando a próxima caçada.
function PrimeDirective({ opportunity }: { opportunity: Opportunity | null }) {
  if (!opportunity) {
    return (
      <section className="hud-panel hud-panel--gold hud-panel--clipped flex flex-col gap-2">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3">
          // O que fazer agora
        </p>
        <h2 className="font-display text-2xl lg:text-3xl font-semibold uppercase tracking-wide text-ink-0">
          O Sistema Origem está calmo
        </h2>
        <p className="font-body text-sm text-ink-1 max-w-2xl leading-relaxed">
          Nenhuma caçada urgente no mercado agora, Tenno. Bom momento para farmar relíquias, montar uma build ou perguntar à Cephalon qual o próximo passo da sua jornada.
        </p>
      </section>
    );
  }

  return (
    <Link href={`/item/${opportunity.slug}`} className="block group">
      <section className="hud-panel hud-panel--gold hud-panel--clipped">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3">
          // O que fazer agora
        </p>
        <div className="mt-3 flex items-start gap-4">
          {opportunity.thumb ? (
            <img
              src={opportunity.thumb}
              alt={opportunity.name}
              width={64}
              height={64}
              className="shrink-0 border border-line-1 bg-bg-2/60 p-1"
            />
          ) : (
            <span className="w-16 h-16 border border-line-1 shrink-0" />
          )}
          <div className="flex-1 min-w-0 flex flex-col gap-1">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] px-1.5 py-0.5 bg-up-faint text-up w-fit">
              {opportunity.kind}
            </span>
            <h2 className="font-display text-2xl lg:text-3xl font-semibold text-ink-0 leading-tight group-hover:text-gold transition-colors">
              {opportunity.title}
            </h2>
            <p className="font-body text-sm text-ink-1">{opportunity.name}</p>
            <p className="font-body text-xs text-ink-3">{opportunity.detail}</p>
          </div>
          <div className="shrink-0 flex flex-col items-end gap-2">
            <p className="font-display text-3xl font-semibold text-gold tabular-nums">
              {opportunity.currentPrice}p
            </p>
            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-cyan group-hover:text-gold transition-colors">
              Abrir no Codex →
            </span>
          </div>
        </div>
      </section>
    </Link>
  );
}

export default async function DashboardPage() {
  const dash = dashboardService.getData();
  const pulse = await marketPulseService.getPulse();
  const trends = await trendService.getTrends();
  const opportunities = await opportunityService.getOpportunities();
  const world = await worldService.getWorldState();

  const buyPressure = pulse && pulse.totalOrders > 0
    ? Math.round((pulse.buyOrders / pulse.totalOrders) * 100)
    : 0;

  const directive = opportunities && opportunities.length > 0 ? opportunities[0] : null;
  const moreOpportunities = opportunities ? opportunities.slice(1) : [];

  return (
    <main className="mx-auto max-w-[1680px] px-6 py-10 flex flex-col gap-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3 mb-1">
          // Transmissão da Orbiter
        </p>
        <h1 className="font-display text-2xl font-semibold uppercase tracking-widest text-ink-0">
          {greeting()}
        </h1>
        <p className="font-body text-xs text-ink-2 mt-1">
          Sistema Origem · {formatToday()} ·{" "}
          {pulse ? (
            <span className="text-cyan">Cephalon Dagath ao vivo, lendo o Void e o mercado</span>
          ) : (
            <span className="text-down">Sem sinal do mercado · exibindo leitura de exemplo</span>
          )}
        </p>
      </div>

      {/* 1. O que fazer agora */}
      <PrimeDirective opportunity={directive} />

      {/* 2. Oportunidades do dia */}
      {moreOpportunities.length > 0 && (
        <OpportunityList opportunities={moreOpportunities} title="Mais caçadas que valem a pena hoje" />
      )}

      {/* 3. Próximos objetivos · jornada do jogador */}
      <JourneyPanel />

      {/* 4. O que está rolando no Sistema Origem */}
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3 mb-2">
          // O que está rolando no Sistema Origem
        </p>
        <WorldStatus world={world} />
      </div>

      {/* 4. Descobertas: o mercado se mexendo */}
      {trends && (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3 mb-2">
            // Descobertas · o mercado está se mexendo
          </p>
          <CaptionedRow
            cells={[
              {
                key: "gainers",
                title: "Aquecendo no mercado",
                variant: "accent",
                caption: `Subiram de preço nas últimas ${trends.windowLabel}. Quem comprou antes, lucra.`,
                content: (
                  <TrendList
                    items={trends.topGainers}
                    emptyMessage="Nada esquentando agora."
                  />
                ),
              },
              {
                key: "losers",
                title: "Esfriando",
                caption: `Caíram de preço nas últimas ${trends.windowLabel}. Talvez a hora de garimpar.`,
                content: (
                  <TrendList
                    items={trends.topLosers}
                    emptyMessage="Nada esfriando agora."
                  />
                ),
              },
            ]}
          />
        </div>
      )}

      {/* 5. Mercado como ferramenta de apoio (recolhido por padrão) */}
      {pulse ? (
        <details className="group flex flex-col gap-3">
          <summary className="flex cursor-pointer select-none items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3 transition-colors hover:text-cyan [&::-webkit-details-marker]:hidden">
            <span className="inline-block transition-transform group-open:rotate-90">›</span>
            Mercado · ferramenta de apoio
          </summary>

          <div className="mt-3 flex flex-col gap-6">
            <CaptionedRow
              cells={[
                {
                  key: "traded",
                  title: "O que os Tenno estão caçando",
                  variant: "accent",
                  caption: "Itens com mais anúncios de compra e venda nas últimas 4 horas",
                  content: <PulseList items={pulse.topTraded} metric="orders" />,
                },
                {
                  key: "ticket",
                  title: "Tesouros por unidade",
                  caption: "Itens com o maior preço médio por unidade anunciada",
                  content: <PulseList items={pulse.topTicket} metric="ticket" />,
                },
              ]}
            />

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <KpiCard
                label="Ofertas no mercado"
                value={pulse.totalOrders.toLocaleString("pt-BR")}
                unit="ord"
                delta={trends ? trends.totals.ordersDeltaPct : undefined}
                sub={trends ? undefined : `${pulse.sellOrders} de venda · ${pulse.buyOrders} de compra`}
              />
              <KpiCard
                label="Platina circulando"
                value={pulse.platVolume.toLocaleString("pt-BR")}
                unit="plat"
                sub="soma do valor dos anúncios"
              />
              <KpiCard
                label="Tenno negociando"
                value={pulse.uniqueTraders.toLocaleString("pt-BR")}
                unit="usr"
                sub="pessoas diferentes com anúncios"
              />
              <KpiCard
                label="Pressão de compra"
                value={String(buyPressure)}
                unit="%"
                sub="parte dos anúncios que é de compra"
              />
            </div>
          </div>
        </details>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <HudPanel title="Aquecendo · Demo" variant="accent">
            <MoverList items={dash.topUp} />
          </HudPanel>
          <HudPanel title="Esfriando · Demo">
            <MoverList items={dash.topDown} />
          </HudPanel>
          <HudPanel title="Mais caçados · Demo">
            <MoverList items={dash.topVol} />
          </HudPanel>
        </div>
      )}
    </main>
  );
}
