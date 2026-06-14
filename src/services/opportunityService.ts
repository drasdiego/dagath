import { insightService } from "@/services/insightService";
import { marketPulseService } from "@/services/marketPulseService";

export type Opportunity = {
  slug: string;
  name: string;
  thumb: string | null;
  currentPrice: number;
  kind: string;
  title: string;
  detail: string;
};

export const opportunityService = {
  async getOpportunities(max = 4): Promise<Opportunity[] | null> {
    const pulse = await marketPulseService.getPulse();
    if (!pulse) return null;

    const seen = new Set<string>();
    const candidates = [...pulse.topTraded, ...pulse.topPlatVolume, ...pulse.topTicket]
      .filter((stat) => {
        if (!stat.slug || !stat.name || seen.has(stat.slug)) return false;
        seen.add(stat.slug);
        return true;
      })
      .slice(0, 8);

    const opportunities: Opportunity[] = [];

    for (const candidate of candidates) {
      if (opportunities.length >= max) break;

      const report = await insightService.getReport(candidate.slug!, candidate.avgPlat);
      if (!report || report.verdict.tone !== "up") continue;

      const highlight = report.insights.find((insight) => insight.tone === "up");
      if (!highlight) continue;

      opportunities.push({
        slug: candidate.slug!,
        name: candidate.name!,
        thumb: candidate.thumb,
        currentPrice: report.currentPrice,
        kind: highlight.kind,
        title: highlight.title,
        detail: highlight.detail,
      });
    }

    return opportunities;
  },
};