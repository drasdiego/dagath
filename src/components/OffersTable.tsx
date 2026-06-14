"use client";

import { useMemo, useState } from "react";
import CopyMessageButton from "@/components/CopyMessageButton";
import type { GenericOffer } from "@/types";

type StatusFilter = "all" | "ingame";
type RankFilter = "all" | "zero" | "max";
type SortKey = "plat-asc" | "plat-desc" | "rank-asc" | "rank-desc";

const SORT_DIMENSION: Record<SortKey, "plat" | "rank"> = {
  "plat-asc": "plat",
  "plat-desc": "plat",
  "rank-asc": "rank",
  "rank-desc": "rank",
};

type OffersTableProps = {
  itemName: string;
  maxRank: number | null;
  offers: GenericOffer[];
};

function buildOfferMessage(itemName: string, rank: number | null, seller: string, plat: number): string {
  const label = rank !== null ? `${itemName} (rank ${rank})` : itemName;
  return `/w ${seller} Hi! I want to buy: "${label}" for ${plat} platinum. (warframe.market)`;
}

function compareBy(key: SortKey, a: GenericOffer, b: GenericOffer): number {
  const rankA = a.rank ?? 0;
  const rankB = b.rank ?? 0;
  switch (key) {
    case "plat-asc":  return a.plat - b.plat;
    case "plat-desc": return b.plat - a.plat;
    case "rank-asc":  return rankA - rankB;
    case "rank-desc": return rankB - rankA;
  }
}

function FilterChip({
  active,
  priority,
  onClick,
  children,
}: {
  active: boolean;
  priority?: number;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] transition-colors ${
        active
          ? "border-line-cyan bg-cyan-faint text-cyan"
          : "border-line-2 text-ink-2 hover:border-line-3 hover:text-ink-1"
      }`}
    >
      {children}
      {active && priority !== undefined && (
        <span className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 flex items-center justify-center bg-cyan text-bg-0 font-mono text-[8px] font-bold">
          {priority}
        </span>
      )}
    </button>
  );
}

export default function OffersTable({ itemName, maxRank, offers }: OffersTableProps) {
  const [status, setStatus] = useState<StatusFilter>("all");
  const [rankFilter, setRankFilter] = useState<RankFilter>("all");
  const [sortKeys, setSortKeys] = useState<SortKey[]>(
    maxRank !== null ? ["rank-desc", "plat-asc"] : ["plat-asc"]
  );

  function toggleSort(key: SortKey) {
    setSortKeys((current) => {
      if (current.includes(key)) {
        const next = current.filter((k) => k !== key);
        return next.length > 0 ? next : ["plat-asc"];
      }

      const withoutSameDimension = current.filter(
        (k) => SORT_DIMENSION[k] !== SORT_DIMENSION[key]
      );

      return [...withoutSameDimension, key].slice(-2);
    });
  }

  const filtered = useMemo(() => {
    let list = [...offers];

    if (status === "ingame") {
      list = list.filter((offer) => offer.status === "ingame");
    }

    if (maxRank !== null) {
      if (rankFilter === "zero") {
        list = list.filter((offer) => offer.rank === 0);
      } else if (rankFilter === "max") {
        list = list.filter((offer) => offer.rank === maxRank);
      }
    }

    list.sort((a, b) => {
      for (const key of sortKeys) {
        const result = compareBy(key, a, b);
        if (result !== 0) return result;
      }
      return 0;
    });

    return list;
  }, [offers, status, rankFilter, sortKeys, maxRank]);

  if (offers.length === 0) return null;

  const cheapest = filtered.length > 0
    ? Math.min(...filtered.map((offer) => offer.plat))
    : null;
  const bestIndex = cheapest === null
    ? -1
    : filtered.findIndex((offer) => offer.plat === cheapest);
  // Em item com rank, "o mais barato" entre ranks diferentes não significa nada.
  // Só destaca a melhor quando não há rank ou quando filtrado por um rank.
  const showBest = maxRank === null || rankFilter !== "all";

  const sortLabels: Record<SortKey, string> = {
    "plat-asc": "Menor preço",
    "plat-desc": "Maior preço",
    "rank-asc": "Rank menor",
    "rank-desc": "Rank maior",
  };

  return (
    <div className="hud-panel">
      <header className="hud-panel__title">
        <span className="hud-panel__tick" />
        Ofertas ao vivo · Vendedores ativos · {filtered.length} de {offers.length}
      </header>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-4">
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3 mr-1">Status</span>
          <FilterChip active={status === "all"} onClick={() => setStatus("all")}>Todos</FilterChip>
          <FilterChip active={status === "ingame"} onClick={() => setStatus("ingame")}>No jogo</FilterChip>
        </div>

        {maxRank !== null && (
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3 mr-1">Rank</span>
            <FilterChip active={rankFilter === "all"} onClick={() => setRankFilter("all")}>Todos</FilterChip>
            <FilterChip active={rankFilter === "zero"} onClick={() => setRankFilter("zero")}>R0</FilterChip>
            <FilterChip active={rankFilter === "max"} onClick={() => setRankFilter("max")}>R{maxRank} máx</FilterChip>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3 mr-1">
            Ordenar · 1º critério + desempate
          </span>
          {(Object.keys(sortLabels) as SortKey[])
            .filter((key) => maxRank !== null || SORT_DIMENSION[key] === "plat")
            .map((key) => (
              <FilterChip
                key={key}
                active={sortKeys.includes(key)}
                priority={sortKeys.includes(key) ? sortKeys.indexOf(key) + 1 : undefined}
                onClick={() => toggleSort(key)}
              >
                {sortLabels[key]}
              </FilterChip>
            ))}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">
        <span className="flex-1">Vendedor</span>
        <span className="w-14 text-center">Rank</span>
        <span className="w-10 text-center">Qtd</span>
        <span className="w-10 text-center">Rep</span>
        <span className="w-16 text-right">Preço</span>
        <span className="w-20 text-right">Ação</span>
      </div>

      {filtered.length === 0 ? (
        <p className="font-body text-sm text-ink-2 py-4">Nenhuma oferta com esses filtros.</p>
      ) : (
        <ul className="flex flex-col max-h-[520px] overflow-y-auto pr-1">
          {filtered.map((offer, index) => {
            const isBest = showBest && index === bestIndex;
            return (
              <li
                key={`${offer.seller}-${offer.plat}-${index}`}
                className={`flex items-center gap-3 py-2.5 ${index > 0 ? "border-t border-line-1" : ""}`}
                style={isBest ? { background: "linear-gradient(90deg, var(--gold-faint), transparent 60%)" } : undefined}
              >
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  {isBest && (
                    <span className="font-mono text-[8px] uppercase tracking-[0.15em] text-gold border border-line-gold px-1 py-0.5 shrink-0">
                      Melhor
                    </span>
                  )}
                  <div className="min-w-0">
                    <p className="font-body text-sm text-ink-0 truncate">{offer.seller}</p>
                    <p className={`font-mono text-[9px] uppercase ${
                      offer.status === "ingame" ? "text-up" : "text-cyan"
                    }`}>
                      {offer.status === "ingame" ? "● No jogo" : "● Online"}
                    </p>
                  </div>
                </div>
                <span className="w-14 text-center font-mono text-xs text-ink-2 tabular-nums">
                  {offer.rank !== null ? `R${offer.rank}` : "—"}
                </span>
                <span className="w-10 text-center font-mono text-xs text-ink-2 tabular-nums">{offer.quantity}</span>
                <span className="w-10 text-center font-mono text-xs text-ink-2 tabular-nums">{offer.reputation}</span>
                <span className="w-16 text-right font-display text-lg font-semibold text-gold tabular-nums">
                  {offer.plat}p
                </span>
                <span className="w-20 flex justify-end">
                  <CopyMessageButton
                    compact
                    message={buildOfferMessage(itemName, offer.rank, offer.seller, offer.plat)}
                  />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}