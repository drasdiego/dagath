import { warframeMarket } from "@/integrations/warframeMarket";
import type { WfmStatEntry } from "@/integrations/warframeMarket";

export type InsightTone = "up" | "down" | "neutral";

export type Insight = {
  tone: InsightTone;
  kind: string;
  title: string;
  detail: string;
};

export type InsightReport = {
  slug: string;
  currentPrice: number;
  avg7: number;
  avg30: number;
  min90: number;
  max90: number;
  volumeAvg7: number;
  volumeAvg30: number;
  daysAnalyzed: number;
  verdict: { label: string; tone: InsightTone };
  insights: Insight[];
};

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function pct(current: number, reference: number): number {
  if (reference === 0) return 0;
  return ((current - reference) / reference) * 100;
}

export const insightService = {
  async getReport(slug: string, livePrice?: number): Promise<InsightReport | null> {
    try {
      const stats = await warframeMarket.getItemStatistics(slug);
      const allDays = stats.statistics_closed?.["90days"] ?? [];

      const baseline: WfmStatEntry[] = allDays
        .filter((entry) => entry.mod_rank === undefined || entry.mod_rank === 0)
        .sort((a, b) => a.datetime.localeCompare(b.datetime));

      if (baseline.length < 14) return null;

      const last7 = baseline.slice(-7);
      const last30 = baseline.slice(-30);

      const avg7 = mean(last7.map((entry) => entry.avg_price));
      const avg30 = mean(last30.map((entry) => entry.avg_price));
      const min90 = Math.min(...baseline.map((entry) => entry.min_price));
      const max90 = Math.max(...baseline.map((entry) => entry.max_price));
      const volumeAvg7 = mean(last7.map((entry) => entry.volume));
      const volumeAvg30 = mean(last30.map((entry) => entry.volume));

      const currentPrice = livePrice ?? baseline[baseline.length - 1].avg_price;

      const insights: Insight[] = [];

      const vsAvg30 = pct(currentPrice, avg30);
      if (vsAvg30 <= -10) {
        insights.push({
          tone: "up",
          kind: "Oportunidade",
          title: `${Math.abs(vsAvg30).toFixed(0)}% mais barato que a média do mês`,
          detail: `Custa ${currentPrice}p agora, contra ${avg30.toFixed(0)}p de média nos últimos 30 dias.`,
        });
      } else if (vsAvg30 >= 10) {
        insights.push({
          tone: "down",
          kind: "Alerta",
          title: `${vsAvg30.toFixed(0)}% mais caro que a média do mês`,
          detail: `Custa ${currentPrice}p agora, contra ${avg30.toFixed(0)}p de média nos últimos 30 dias. Pode voltar a cair.`,
        });
      }

      const trend = pct(avg7, avg30);
      if (trend >= 5) {
        insights.push({
          tone: "up",
          kind: "Tendência",
          title: `Preço em alta na última semana`,
          detail: `A média da semana (${avg7.toFixed(0)}p) está ${trend.toFixed(1)}% acima da média do mês (${avg30.toFixed(0)}p).`,
        });
      } else if (trend <= -5) {
        insights.push({
          tone: "down",
          kind: "Tendência",
          title: `Preço em queda na última semana`,
          detail: `A média da semana (${avg7.toFixed(0)}p) está ${Math.abs(trend).toFixed(1)}% abaixo da média do mês (${avg30.toFixed(0)}p).`,
        });
      }

      const volumeTrend = pct(volumeAvg7, volumeAvg30);
      if (volumeTrend >= 25) {
        insights.push({
          tone: "up",
          kind: "Procura",
          title: `Negociações ${volumeTrend.toFixed(0)}% acima do normal`,
          detail: `${volumeAvg7.toFixed(0)} negociações por dia na última semana, contra ${volumeAvg30.toFixed(0)} de costume. Mais gente atrás deste item.`,
        });
      } else if (volumeTrend <= -25) {
        insights.push({
          tone: "down",
          kind: "Procura",
          title: `Negociações ${Math.abs(volumeTrend).toFixed(0)}% abaixo do normal`,
          detail: `${volumeAvg7.toFixed(0)} negociações por dia na última semana, contra ${volumeAvg30.toFixed(0)} de costume. Pode demorar mais para vender.`,
        });
      }

      const vsMin90 = pct(currentPrice, min90);
      if (vsMin90 <= 10 && vsMin90 >= 0) {
        insights.push({
          tone: "up",
          kind: "Preço histórico",
          title: "Entre os menores preços dos últimos 90 dias",
          detail: `Custa ${currentPrice}p, perto da mínima de ${min90}p no período.`,
        });
      }

      const upCount = insights.filter((insight) => insight.tone === "up").length;
      const downCount = insights.filter((insight) => insight.tone === "down").length;

      let verdict: InsightReport["verdict"];
      if (upCount > downCount) {
        verdict = { label: "Bom momento", tone: "up" };
      } else if (downCount > upCount) {
        verdict = { label: "Momento de cautela", tone: "down" };
      } else {
        verdict = { label: "Mercado estável", tone: "neutral" };
      }

      if (insights.length === 0) {
        insights.push({
          tone: "neutral",
          kind: "Estável",
          title: "Nada fora do padrão",
          detail: `O preço está dentro do normal dos últimos 30 dias (média de ${avg30.toFixed(0)}p).`,
        });
      }

      return {
        slug,
        currentPrice,
        avg7: Math.round(avg7),
        avg30: Math.round(avg30),
        min90,
        max90,
        volumeAvg7: Math.round(volumeAvg7),
        volumeAvg30: Math.round(volumeAvg30),
        daysAnalyzed: baseline.length,
        verdict,
        insights,
      };
    } catch {
      return null;
    }
  },
};