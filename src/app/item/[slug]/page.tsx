import Link from "next/link";
import { notFound } from "next/navigation";
import HudPanel from "@/components/HudPanel";
import CopyMessageButton from "@/components/CopyMessageButton";
import OffersTable from "@/components/OffersTable";
import InsightPanel from "@/components/InsightPanel";
import ModsPanel from "@/components/ModsPanel";
import Hero from "@/components/Hero";
import { itemService } from "@/services/itemService";
import { insightService } from "@/services/insightService";
import { dropService } from "@/services/dropService";
import { modService } from "@/services/modService";
import { artColorService } from "@/services/artColorService";
import { frameService, type Frame } from "@/services/frameService";
import { weaponService, type WeaponStats } from "@/services/weaponService";
import type { ItemDrops } from "@/services/dropService";
import type { GenericBestOffer, GenericItem } from "@/types";

function FrameAbilitiesPanel({ frame }: { frame: Frame }) {
  const stats = [
    frame.health !== null && { label: "Vida", value: String(frame.health) },
    frame.shield !== null && { label: "Escudo", value: String(frame.shield) },
    frame.armor !== null && { label: "Armadura", value: String(frame.armor) },
    frame.sprintSpeed !== null && { label: "Sprint", value: String(frame.sprintSpeed) },
    frame.masteryReq !== null && { label: "Mastery", value: String(frame.masteryReq) },
  ].filter(Boolean) as { label: string; value: string }[];

  if (stats.length === 0 && frame.abilities.length === 0 && !frame.passive) return null;

  return (
    <HudPanel title="Warframe · atributos e habilidades">
      <div className="flex flex-col gap-4">
        {(stats.length > 0 || frame.introduced) && (
          <div className="flex flex-wrap items-start gap-x-5 gap-y-2">
            {stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">
                  {stat.label}
                </p>
                <p className="font-display text-base font-semibold text-gold tabular-nums">
                  {stat.value}
                </p>
              </div>
            ))}
            {frame.introduced && (
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">
                  Introduzido
                </p>
                <p className="font-display text-base font-semibold text-ink-1">
                  {frame.introduced}
                </p>
              </div>
            )}
          </div>
        )}

        {frame.passive && (
          <div className="border-t border-line-1 pt-4">
            <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">Passiva</p>
            <p className="font-body text-sm text-ink-1 mt-1 leading-relaxed whitespace-pre-line">
              {frame.passive}
            </p>
          </div>
        )}

        {frame.abilities.map((ability) => (
          <div key={ability.name} className="border-t border-line-1 pt-4">
            <p className="font-display text-sm font-semibold uppercase tracking-wide text-cyan">
              {ability.name}
            </p>
            <p className="font-body text-sm text-ink-1 mt-1 leading-relaxed whitespace-pre-line">
              {ability.description}
            </p>
          </div>
        ))}

        {frame.wikiUrl && (
          <a
            href={frame.wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit border border-line-2 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-2 hover:border-line-cyan hover:text-cyan transition-colors"
          >
            Wiki ↗
          </a>
        )}
      </div>
    </HudPanel>
  );
}

function TradeStats({ generic }: { generic: GenericItem }) {
  const stats = [
    generic.reqMasteryRank !== null && generic.reqMasteryRank > 0 && { label: "Mastery Lvl", value: String(generic.reqMasteryRank) },
    generic.tradingTax !== null && { label: "Trading Tax", value: `${generic.tradingTax.toLocaleString("pt-BR")} cr` },
    generic.ducats !== null && { label: "Ducats", value: String(generic.ducats) },
  ].filter(Boolean) as { label: string; value: string }[];

  if (stats.length === 0 && !generic.wikiLink) return null;

  return (
    <div className="flex items-center gap-5 flex-wrap">
      {stats.map((stat) => (
        <div key={stat.label}>
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">{stat.label}</p>
          <p className="font-display text-lg font-semibold text-gold">{stat.value}</p>
        </div>
      ))}
      {generic.wikiLink && (
        <a
          href={generic.wikiLink}
          target="_blank"
          rel="noopener noreferrer"
          className="border border-line-2 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-2 hover:border-line-cyan hover:text-cyan transition-colors"
        >
          Wiki ↗
        </a>
      )}
    </div>
  );
}

function SetPartsPanel({ parts }: { parts: NonNullable<GenericItem["setParts"]> }) {
  return (
    <HudPanel title="Componentes do Set">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {parts.map((part) => (
          <Link
            key={part.slug}
            href={`/item/${part.slug}`}
            className="flex flex-col items-center gap-2 border border-line-1 p-3 hover:border-line-cyan hover:bg-bg-2 transition-colors text-center"
          >
            {part.thumb ? (
              <img src={part.thumb} alt={part.name} width={56} height={56} />
            ) : (
              <span className="w-14 h-14 border border-line-1" />
            )}
            <span className="font-body text-xs text-ink-0 leading-tight">{part.name}</span>
            <span className="font-mono text-[9px] uppercase text-ink-3">
              x{part.quantityInSet}
              {part.ducats !== null && ` · ${part.ducats} ducats`}
            </span>
          </Link>
        ))}
      </div>
    </HudPanel>
  );
}

function DropsPanel({ drops }: { drops: ItemDrops }) {
  if (drops.components.length === 0) return null;

  return (
    <HudPanel title="Onde conseguir">
      <div className="flex flex-col divide-y divide-line-1">
        {drops.components.map((component) => (
          <div key={component.name} className="py-3 first:pt-0 last:pb-0">
            <div className="flex items-center gap-3 mb-1.5">
              <p className="font-body text-sm text-ink-0">{component.name}</p>
              <span className="font-mono text-[9px] uppercase text-ink-3">
                x{component.itemCount}
                {component.ducats !== null && ` · ${component.ducats} ducats`}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {component.relics.map((relic) => (
                <span
                  key={relic.name}
                  className="font-mono text-[10px] border border-line-2 px-1.5 py-0.5 text-ink-1"
                >
                  {relic.name.replace(/\s+Relic$/i, "")}
                  <span className="text-cyan"> {relic.bestChance.toFixed(0)}%</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="font-body text-xs text-ink-3 border-t border-line-1 pt-3 mt-3">
        Relíquias que podem entregar cada parte. A porcentagem é a melhor chance por abertura, com a relíquia no refino máximo.
      </p>
    </HudPanel>
  );
}

function RankOfferBlock({ rank, offer }: { rank: number; offer: GenericBestOffer | null }) {
  return (
    <div className="flex flex-col gap-2 min-w-0">
      <p className="flex items-baseline gap-1.5">
        <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-ink-1">
          Rank {rank}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink-3">
          · mais barato
        </span>
      </p>
      {offer ? (
        <>
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="font-body text-sm text-ink-0 truncate">{offer.seller}</p>
              <p className={`font-mono text-[9px] uppercase ${offer.online ? "text-up" : "text-ink-3"}`}>
                {offer.online ? "● Online" : "○ Offline"} · ★ {offer.reputation}
              </p>
            </div>
            <p className="font-display text-2xl font-semibold text-gold shrink-0">{offer.plat}p</p>
          </div>
          <CopyMessageButton message={offer.message} />
        </>
      ) : (
        <p className="font-body text-xs text-ink-3">Sem oferta ativa.</p>
      )}
    </div>
  );
}

function WeaponStatsPanel({ weapon }: { weapon: WeaponStats }) {
  const stats = [
    weapon.criticalChance !== null && {
      label: "Crítico",
      value: `${Math.round(weapon.criticalChance * 100)}%`,
    },
    weapon.criticalMultiplier !== null && {
      label: "Mult. crítico",
      value: `${weapon.criticalMultiplier}x`,
    },
    weapon.statusChance !== null && {
      label: "Status",
      value: `${Math.round(weapon.statusChance * 100)}%`,
    },
    weapon.fireRate !== null && { label: "Cadência", value: weapon.fireRate.toFixed(1) },
    weapon.totalDamage !== null &&
      weapon.totalDamage > 0 && {
        label: "Dano total",
        value: String(Math.round(weapon.totalDamage)),
      },
    weapon.magazineSize !== null && {
      label: "Carregador",
      value: String(weapon.magazineSize),
    },
    weapon.reloadTime !== null && {
      label: "Recarga",
      value: `${weapon.reloadTime.toFixed(1)}s`,
    },
    weapon.masteryReq !== null && { label: "Mastery", value: String(weapon.masteryReq) },
    weapon.disposition !== null && { label: "Riven", value: `${weapon.disposition}/5` },
  ].filter(Boolean) as { label: string; value: string }[];

  if (stats.length === 0) return null;

  return (
    <HudPanel title={`Arma · atributos${weapon.type ? ` · ${weapon.type}` : ""}`}>
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-x-5 gap-y-3">
          {stats.map((stat) => (
            <div key={stat.label}>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">
                {stat.label}
              </p>
              <p className="font-display text-base font-semibold text-gold tabular-nums">
                {stat.value}
              </p>
            </div>
          ))}
        </div>
        {weapon.wikiUrl && (
          <a
            href={weapon.wikiUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-fit border border-line-2 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-2 hover:border-line-cyan hover:text-cyan transition-colors"
          >
            Wiki ↗
          </a>
        )}
      </div>
    </HudPanel>
  );
}

export default async function ItemPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [item, generic] = await Promise.all([
    itemService.getItemLive(slug),
    itemService.getGenericItem(slug),
  ]);

  if (!item && !generic) notFound();

  const statsSlug = generic?.slug ?? slug;
  const displayName = generic?.name ?? item?.name ?? slug;

  const [report, drops, accentColor] = await Promise.all([
    insightService.getReport(statsSlug, generic?.market?.low),
    dropService.getItemDrops(displayName),
    artColorService.getDominant(generic?.icon ?? generic?.thumb ?? null),
  ]);

  const recommendedMods = await modService.getRecommendedModsWithPrices(statsSlug);
  const frame = await frameService.findMentioned(displayName);
  const weapon = frame ? null : await weaponService.getStats(displayName);

  if (!item && generic) {
    const badges: { label: string; tone: "gold" | "cyan" | "neutral" | "up" | "down" }[] = [];
    if (generic.maxRank !== null) badges.push({ label: `Rank 0-${generic.maxRank}`, tone: "cyan" });
    const vaultStatus = drops?.vaulted ?? generic.vaulted;
    if (vaultStatus === true) badges.push({ label: "Vaulted", tone: "down" });
    if (vaultStatus === false) badges.push({ label: "Em circulação", tone: "up" });
    generic.tags.slice(0, 3).forEach((tag) => badges.push({ label: tag, tone: "neutral" }));

    return (
      <main className="mx-auto max-w-[1680px] px-6 py-10 flex flex-col gap-6">
        <Hero
          name={generic.name}
          art={generic.icon ?? generic.thumb ?? null}
          category={generic.tags[0] ?? "Item"}
          description={generic.description}
          badges={badges}
          tags={generic.tags}
          generic={generic}
          report={report}
          accentColor={accentColor}
          breadcrumb={`Console / Catálogo / ${generic.name}`}
        />

        {generic && (
          <div className="px-1">
            <TradeStats generic={generic} />
          </div>
        )}

        {(() => {
          const marketColumn = (
            <div className="flex flex-col gap-6">
              {report ? (
                <InsightPanel report={report} />
              ) : (
                <HudPanel title="Dagath Intelligence" variant="accent" clipped>
                  <p className="font-body text-sm text-ink-1">
                    Histórico insuficiente para análise deste item.
                  </p>
                </HudPanel>
              )}

              <HudPanel title="Melhor Oferta">
                {generic.rankOffers ? (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:divide-x sm:divide-line-1">
                    <RankOfferBlock rank={0} offer={generic.rankOffers.rank0} />
                    <div className="sm:pl-4">
                      <RankOfferBlock
                        rank={generic.rankOffers.maxRank}
                        offer={generic.rankOffers.max}
                      />
                    </div>
                  </div>
                ) : generic.bestOffer ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-body text-sm text-ink-0">{generic.bestOffer.seller}</p>
                        <p className="font-mono text-[10px] text-ink-3">★ {generic.bestOffer.reputation}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display text-2xl font-semibold text-gold">{generic.bestOffer.plat}p</p>
                        <p className={`font-mono text-[9px] uppercase ${generic.bestOffer.online ? "text-up" : "text-ink-3"}`}>
                          {generic.bestOffer.online ? "● Online" : "○ Offline"}
                        </p>
                      </div>
                    </div>
                    <CopyMessageButton message={generic.bestOffer.message} />
                  </div>
                ) : (
                  <p className="font-body text-sm text-ink-2">Nenhum vendedor online agora.</p>
                )}
              </HudPanel>

              <OffersTable itemName={generic.name} maxRank={generic.maxRank} offers={generic.sellOrders} />
            </div>
          );

          const hasKnowledge = Boolean(generic.setParts || drops || recommendedMods || frame || weapon);
          if (!hasKnowledge) return marketColumn;

          return (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
              <div className="flex flex-col gap-6">
                {frame && <FrameAbilitiesPanel frame={frame} />}
                {weapon && <WeaponStatsPanel weapon={weapon} />}
                {generic.setParts && <SetPartsPanel parts={generic.setParts} />}
                {recommendedMods && <ModsPanel recommended={recommendedMods} />}
                {drops && <DropsPanel drops={drops} />}
              </div>
              {marketColumn}
            </div>
          );
        })()}
      </main>
    );
  }

  const richItem = item!;
  const { bestOffer, synergies, progressionImpact } = richItem;

  const richBadges: { label: string; tone: "gold" | "cyan" | "neutral" | "up" | "down" }[] = [
    { label: richItem.rarity, tone: "gold" },
    { label: richItem.category, tone: "neutral" },
    { label: `MR ${richItem.mr}`, tone: "neutral" },
    { label: `Tier ${richItem.tier}`, tone: "cyan" },
  ];
  const richVault = drops?.vaulted ?? generic?.vaulted ?? null;
  if (richVault === true) richBadges.push({ label: "Vaulted", tone: "down" });
  if (richVault === false) richBadges.push({ label: "Em circulação", tone: "up" });

  return (
    <main className="mx-auto max-w-[1680px] px-6 py-10 flex flex-col gap-6">
      <Hero
        name={richItem.name}
        art={generic?.icon ?? generic?.thumb ?? null}
        category={richItem.category}
        description={richItem.description}
        badges={richBadges}
        tags={richItem.tags}
        generic={generic}
        report={report}
        accentColor={accentColor}
        breadcrumb={`Console / Warframes / ${richItem.name}`}
      />

      {generic && (
        <div className="px-1">
          <TradeStats generic={generic} />
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-6">
          {frame && <FrameAbilitiesPanel frame={frame} />}

          {generic?.setParts && <SetPartsPanel parts={generic.setParts} />}

          {recommendedMods && <ModsPanel recommended={recommendedMods} />}

          {drops && <DropsPanel drops={drops} />}

          <HudPanel title="Sinergias">
            <div className="flex flex-col divide-y divide-line-1">
              {synergies.map((syn) => (
                <div key={syn.name} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                  <span className="font-mono text-[9px] uppercase border border-line-2 px-1.5 py-0.5 text-ink-2 shrink-0 mt-0.5">
                    {syn.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm text-ink-0">{syn.name}</p>
                    <p className="font-mono text-[10px] text-ink-3">{syn.reason}</p>
                  </div>
                </div>
              ))}
            </div>
          </HudPanel>

          <HudPanel title="Impacto na Progressão">
            <div className="flex flex-col gap-3">
              <p className="font-mono text-xs text-cyan">{progressionImpact.mrRange.fitNote}</p>
              <div className="flex flex-col gap-2">
                {progressionImpact.unlocks.map((unlock) => (
                  <div key={unlock.text} className="flex items-start gap-2">
                    <span className="font-mono text-[9px] uppercase border border-line-2 px-1.5 py-0.5 text-ink-2 shrink-0 mt-0.5">
                      {unlock.kind}
                    </span>
                    <p className="font-body text-sm text-ink-1">{unlock.text}</p>
                  </div>
                ))}
              </div>
              <p className="font-body text-xs text-ink-3 border-t border-line-1 pt-3">
                {progressionImpact.nextStep}
              </p>
            </div>
          </HudPanel>
        </div>

        <div className="flex flex-col gap-6">
          {report && <InsightPanel report={report} />}

          <HudPanel title="Melhor oferta · ao vivo" variant="gold" clipped>
            <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
              <div className="flex items-center gap-5">
                <div>
                  <p className="font-display text-4xl font-semibold text-gold tabular-nums leading-none">
                    {bestOffer.plat}p
                  </p>
                  <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3 mt-1">
                    menor preço · vendedor ativo
                  </p>
                </div>
                <div className="border-l border-line-1 pl-5">
                  <p className="font-body text-sm text-ink-0">{bestOffer.seller}</p>
                  <p className="font-mono text-[10px] text-ink-3">
                    {bestOffer.platform} · ★ {bestOffer.rep} ·{" "}
                    <span className={bestOffer.online ? "text-up" : "text-ink-3"}>
                      {bestOffer.online ? "● Online" : "○ Offline"}
                    </span>
                  </p>
                </div>
              </div>
              <div className="w-full sm:w-auto sm:min-w-[240px]">
                <CopyMessageButton message={bestOffer.message} />
              </div>
            </div>
          </HudPanel>

          {generic && (
            <OffersTable itemName={`${richItem.name} Set`} maxRank={generic.maxRank} offers={generic.sellOrders} />
          )}
        </div>
      </div>
    </main>
  );
}