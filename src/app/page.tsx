import HudPanel from "@/components/HudPanel";
import KpiCard from "@/components/KpiCard";
import MoverList from "@/components/MoverList";
import PulseList from "@/components/PulseList";
import TrendList from "@/components/TrendList";
import OpportunityList from "@/components/OpportunityList";
import WorldStatus from "@/components/WorldStatus";
import { dashboardService } from "@/services/dashboardService";
import { marketPulseService } from "@/services/marketPulseService";
import { trendService } from "@/services/trendService";
import { opportunityService } from "@/services/opportunityService";
import { worldService } from "@/services/worldService";

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

export default async function DashboardPage() {
  const dash = dashboardService.getData();
  const pulse = await marketPulseService.getPulse();
  const trends = await trendService.getTrends();
  const opportunities = await opportunityService.getOpportunities();
  const world = await worldService.getWorldState();

  const buyPressure = pulse && pulse.totalOrders > 0
    ? Math.round((pulse.buyOrders / pulse.totalOrders) * 100)
    : 0;

  return (
    <main className="mx-auto max-w-[1680px] px-6 py-10 flex flex-col gap-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3 mb-1">
          // Sistema Operacional
        </p>
        <h1 className="font-display text-2xl font-semibold uppercase tracking-widest text-ink-0">
          {greeting()}
        </h1>
        <p className="font-body text-xs text-ink-2 mt-1">
          Origin System · {formatToday()} ·{" "}
          {pulse ? (
            <>
              <span className="text-cyan">Dados ao vivo · warframe.market e warframestat.us</span>{" "}
              <span className="text-ink-3">· anúncios das últimas {pulse.windowHours}h · atualiza a cada minuto</span>
            </>
          ) : (
            <>
              <span className="text-down">Sem conexão com o mercado</span>{" "}
              <span className="text-ink-3">· exibindo dados demonstrativos</span>
            </>
          )}
        </p>
      </div>

      <WorldStatus world={world} />

      {opportunities && <OpportunityList opportunities={opportunities} />}

      {trends && (
        <CaptionedRow
          cells={[
            {
              key: "gainers",
              title: "Subindo de preço",
              variant: "accent",
              caption: `Preço médio subiu nas últimas ${trends.windowLabel}`,
              content: (
                <TrendList
                  items={trends.topGainers}
                  emptyMessage="Nenhuma alta relevante agora."
                />
              ),
            },
            {
              key: "losers",
              title: "Caindo de preço",
              caption: `Preço médio caiu nas últimas ${trends.windowLabel}`,
              content: (
                <TrendList
                  items={trends.topLosers}
                  emptyMessage="Nenhuma queda relevante agora."
                />
              ),
            },
          ]}
        />
      )}

      {pulse ? (
        <CaptionedRow
          cells={[
            {
              key: "traded",
              title: "Mais movimentados",
              variant: "accent",
              caption: "Itens com mais anúncios de compra e venda nas últimas 4 horas",
              content: <PulseList items={pulse.topTraded} metric="orders" />,
            },
            {
              key: "ticket",
              title: "Mais valiosos por unidade",
              caption: "Itens com o maior preço médio por unidade anunciada",
              content: <PulseList items={pulse.topTicket} metric="ticket" />,
            },
          ]}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <HudPanel title="Em alta · Demo" variant="accent">
            <MoverList items={dash.topUp} />
          </HudPanel>
          <HudPanel title="Em queda · Demo">
            <MoverList items={dash.topDown} />
          </HudPanel>
          <HudPanel title="Mais vendidos · Demo">
            <MoverList items={dash.topVol} />
          </HudPanel>
        </div>
      )}

      {pulse ? (
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3 mb-2">
            // Estado geral do mercado · últimas {pulse.windowHours}h
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <KpiCard
              label="Anúncios"
              value={pulse.totalOrders.toLocaleString("pt-BR")}
              unit="ord"
              delta={trends ? trends.totals.ordersDeltaPct : undefined}
              sub={trends ? undefined : `${pulse.sellOrders} de venda · ${pulse.buyOrders} de compra`}
            />
            <KpiCard
              label="Platina em movimento"
              value={pulse.platVolume.toLocaleString("pt-BR")}
              unit="plat"
              sub="soma do valor dos anúncios"
            />
            <KpiCard
              label="Jogadores negociando"
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
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <KpiCard label="Volume 24h · Demo" value={dash.pulse.volume24h.toLocaleString("pt-BR")} unit="plat" delta={dash.pulse.volumeDelta} />
          <KpiCard label="Transações 24h · Demo" value={dash.pulse.transactions.toLocaleString("pt-BR")} unit="tx" delta={dash.pulse.transactionsDelta} />
          <KpiCard label="Traders ativos · Demo" value={dash.pulse.activeTraders.toLocaleString("pt-BR")} unit="usr" delta={dash.pulse.activeTradersDelta} />
          <KpiCard label="Spread médio · Demo" value={dash.pulse.platSpread.toFixed(1)} unit="%" delta={-0.6} />
        </div>
      )}
    </main>
  );
}