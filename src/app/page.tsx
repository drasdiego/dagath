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

// Sigilo da Cephalon: presença discreta da inteligência que assina a leitura.
// Geometria Orokin de traço fino, não decoração ruidosa.
function CephalonSigil() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinejoin="miter" aria-hidden="true">
      <path d="M12 2 L21 12 L12 22 L3 12 Z" />
      <path d="M12 7 L16.5 12 L12 17 L7.5 12 Z" />
      <circle cx="12" cy="12" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
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

// A recomendação principal, dita pela Cephalon. Autoria, voz e o porquê em
// destaque: o jogador sente uma inteligência orientando, não um widget.
function PrimeDirective({ opportunity }: { opportunity: Opportunity | null }) {
  if (!opportunity) {
    return (
      <section className="hud-panel hud-panel--gold hud-panel--clipped flex flex-col gap-3 p-7">
        <div className="flex items-center gap-2 text-ink-3">
          <span className="text-cyan"><CephalonSigil /></span>
          <span className="font-mono text-[10px] uppercase tracking-[0.3em]">Cephalon Dagath</span>
        </div>
        <h2 className="font-display text-2xl lg:text-3xl font-semibold text-ink-0 leading-tight">
          O Sistema Origem está calmo, Tenno
        </h2>
        <p className="font-body text-sm text-ink-1 max-w-2xl leading-relaxed">
          Não vejo nenhuma caçada urgente agora. Bom momento para farmar relíquias, montar uma build, ou me perguntar qual o próximo passo da sua jornada.
        </p>
      </section>
    );
  }

  return (
    <section className="hud-panel hud-panel--gold hud-panel--clipped p-7">
      <div className="flex items-center gap-2 text-ink-3">
        <span className="text-cyan"><CephalonSigil /></span>
        <span className="font-mono text-[10px] uppercase tracking-[0.3em]">
          Cephalon Dagath · o que fazer agora
        </span>
      </div>

      <div className="mt-5 flex items-start gap-5">
        {opportunity.thumb ? (
          <img
            src={opportunity.thumb}
            alt={opportunity.name}
            width={72}
            height={72}
            className="shrink-0 border border-line-1 bg-bg-2/50 p-1"
          />
        ) : (
          <span className="w-[72px] h-[72px] border border-line-1 shrink-0" />
        )}

        <div className="flex-1 min-w-0 flex flex-col gap-2.5">
          <h2 className="font-display text-2xl lg:text-4xl font-semibold text-ink-0 leading-[1.05]">
            {opportunity.title}
          </h2>
          <p className="font-body text-sm text-ink-1 leading-relaxed max-w-2xl">
            <span className="text-ink-0">{opportunity.name}.</span> {opportunity.detail}
          </p>
          <div className="flex items-center gap-5 mt-1">
            <span className="font-display text-2xl font-semibold text-gold tabular-nums">
              {opportunity.currentPrice}p
            </span>
            <Link
              href={`/item/${opportunity.slug}`}
              className="font-mono text-[10px] uppercase tracking-[0.15em] text-cyan hover:text-gold transition-colors border-b border-line-cyan pb-0.5"
            >
              Abrir no Codex →
            </Link>
          </div>
        </div>
      </div>
    </section>
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
    <main className="mx-auto max-w-[1680px] px-6 py-10 flex flex-col gap-7">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3 mb-1">
          // Transmissão da Orbiter
        </p>
        <h1 className="font-display text-2xl font-semibold uppercase tracking-widest text-ink-0">
          {greeting()}
        </h1>
        <p className="font-body text-xs text-ink-2 mt-1">
          {formatToday()} ·{" "}
          {pulse ? (
            <span className="text-cyan">Estou lendo o Void e o mercado em tempo real</span>
          ) : (
            <span className="text-down">Sem sinal do mercado · leitura de exemplo</span>
          )}
        </p>
      </div>

      {/* 1 e 2. Dagath recomenda o que fazer agora, e por quê */}
      <PrimeDirective opportunity={directive} />

      {/* 3. Sua jornada, como contexto pessoal */}
      <JourneyPanel />

      {/* 4. O mundo reage e oferece oportunidades */}
      <WorldStatus world={world} />

      {moreOpportunities.length > 0 && (
        <OpportunityList opportunities={moreOpportunities} title="Mais caçadas que valem a pena hoje" />
      )}

      {/* 5. Mercado como ferramenta de apoio (recolhido) */}
      <details className="group flex flex-col gap-3">
        <summary className="flex cursor-pointer select-none items-center gap-2 font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3 transition-colors hover:text-cyan [&::-webkit-details-marker]:hidden">
          <span className="inline-block transition-transform group-open:rotate-90">›</span>
          Mercado · ferramenta de apoio
        </summary>

        <div className="mt-3 flex flex-col gap-6">
          {trends && (
            <CaptionedRow
              cells={[
                {
                  key: "gainers",
                  title: "Aquecendo no mercado",
                  variant: "accent",
                  caption: `Subiram de preço nas últimas ${trends.windowLabel}.`,
                  content: <TrendList items={trends.topGainers} emptyMessage="Nada esquentando agora." />,
                },
                {
                  key: "losers",
                  title: "Esfriando",
                  caption: `Caíram de preço nas últimas ${trends.windowLabel}.`,
                  content: <TrendList items={trends.topLosers} emptyMessage="Nada esfriando agora." />,
                },
              ]}
            />
          )}

          {pulse ? (
            <>
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
            </>
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
        </div>
      </details>
    </main>
  );
}
