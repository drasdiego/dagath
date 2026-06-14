import type { DashboardData } from "@/types";

const DASHBOARD: DashboardData = {
  status: { server: "LIVE", latency: 42, lastSync: "há 12s" },
  pulse: {
    volume24h: 184320, volumeDelta: 6.2,
    transactions: 9214, transactionsDelta: -1.4,
    activeTraders: 3811, activeTradersDelta: 4.1,
    platSpread: 4.8,
  },
  topUp: [
    { name: "Tatsu Prime Set",      plat: 312,  delta: 18.3, vol: 78,  tier: "A" },
    { name: "Arcane Energize R5",   plat: 825,  delta: 12.6, vol: 142, tier: "S" },
    { name: "Hespar Riven (god)",   plat: 4200, delta: 9.4,  vol: 6,   tier: "S" },
    { name: "Octavia Prime Set",    plat: 195,  delta: 8.1,  vol: 86,  tier: "A" },
    { name: "Magus Lockdown",       plat: 145,  delta: 7.2,  vol: 168, tier: "A" },
  ],
  topDown: [
    { name: "Gauss Prime Set",      plat: 138, delta: -14.2, vol: 320, tier: "A" },
    { name: "Grendel Prime Set",    plat: 88,  delta: -11.7, vol: 244, tier: "B" },
    { name: "Khora Prime Set",      plat: 215, delta: -8.1,  vol: 487, tier: "S" },
    { name: "Pangolin Prime",       plat: 24,  delta: -6.8,  vol: 92,  tier: "C" },
    { name: "Galvanized Aptitude",  plat: 35,  delta: -5.4,  vol: 410, tier: "A" },
  ],
  topVol: [
    { name: "Forma Bundle (x3)",    plat: 35,  delta: 0.0,  vol: 1820, tier: "A" },
    { name: "Galvanized Chamber",   plat: 28,  delta: 2.1,  vol: 1480, tier: "A" },
    { name: "Khora Prime Set",      plat: 215, delta: -8.1, vol: 487,  tier: "S" },
    { name: "Arcane Energize R0",   plat: 165, delta: 1.4,  vol: 612,  tier: "S" },
    { name: "Primed Continuity",    plat: 110, delta: 0.4,  vol: 458,  tier: "A" },
  ],
  topFarms: [
    { rank: 1,  item: "Hespar Riven Sliver",  ppm: 21.4, src: "Steel Path",   note: "Demanda alta · Rivens" },
    { rank: 2,  item: "Eidolon Hydrolyst",    ppm: 18.2, src: "Cetus · Noite", note: "Arcanes top-tier" },
    { rank: 3,  item: "Profit-Taker Heist",   ppm: 16.0, src: "Fortuna",       note: "Arcanes + crédito" },
    { rank: 4,  item: "Sister of Parvos",     ppm: 14.7, src: "Sisters",       note: "Tenet weapons" },
    { rank: 5,  item: "Index High-Risk",      ppm: 12.4, src: "Neptune",       note: "Crédito puro" },
    { rank: 6,  item: "Granum Void T3",       ppm: 10.8, src: "Corpus Ships",  note: "Protea + Xata" },
    { rank: 7,  item: "Lith K9 Radshare",     ppm: 9.6,  src: "Capture",       note: "Khora BP" },
    { rank: 8,  item: "Arbitrações",          ppm: 9.2,  src: "Alerta",        note: "Vitus Essence" },
    { rank: 9,  item: "Disruption Lua",       ppm: 8.7,  src: "Lua",           note: "Sentient cores" },
    { rank: 10, item: "Bounties Deimos T5",   ppm: 7.9,  src: "Deimos",        note: "Necramech parts" },
  ],
  news: [
    { tag: "PATCH",  title: "Dante Unbound · 35.5.9",            time: "há 4h",  blurb: "Ajustes de Pageflight, novos arcanes Vosfor." },
    { tag: "EVENTO", title: "Operation: Belly of the Beast",      time: "há 1d",  blurb: "Plague Star com drops aumentados em Ghoul Sawmen." },
    { tag: "MARKET", title: "Khora Prime Vault Watch",            time: "há 2d",  blurb: "Histórico aponta valorização de 60-90% pós-vault." },
    { tag: "DEV",    title: "Devstream 184 — Whispers in the Wall 2", time: "há 4d", blurb: "Nova quest principal anunciada para Q3 2026." },
  ],
  trackers: [
    { item: "Khora Prime Set", target: 195, current: 215, status: "watching", trend: "down" },
    { item: "Hespar Riven",    target: 4500, current: 4200, status: "hit",    trend: "down" },
    { item: "Magus Lockdown",  target: 130, current: 145, status: "watching", trend: "up" },
  ],
  progression: {
    mr: 22, mrProgress: 0.46,
    frames: 47, framesTotal: 56,
    weapons: 312, weaponsTotal: 421,
    quests: 38, questsTotal: 41,
    nextGoals: [
      { kind: "Quest",  title: "Whispers in the Wall", reason: "Desbloqueia Dante e Architech Arcanes",   prio: "Alta" },
      { kind: "Frame",  title: "Protea Prime",          reason: "MR fodder + meta para Granum Void",       prio: "Média" },
      { kind: "Arcane", title: "Melee Influence R5",    reason: "Multiplica DPS de Wrathful Advance build", prio: "Alta" },
      { kind: "Farm",   title: "Coda Weapons (Stahlta)", reason: "Nova categoria não tocada · MR rank",    prio: "Baixa" },
    ],
  },
};

export const dashboardService = {
  getData(): DashboardData {
    return DASHBOARD;
  },
};