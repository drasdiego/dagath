import { generateJson } from "@/integrations/gemini";
import { frameService, type Frame } from "@/services/frameService";
import { itemService } from "@/services/itemService";

// Compare Engine (Warframes): a IA atua como MEDIADORA entre dados reais e
// decisão. Nunca inventa preço; só usa os dados fornecidos mais o conhecimento
// de mecânicas. Toda recomendação é auditável (fontes, confiança, invalidadores).

export const COMPARE_GOALS = [
  "uso geral",
  "Steel Path",
  "farm de recursos",
  "sobrevivência",
  "dano",
  "custo-benefício",
  "iniciante",
  "versatilidade",
] as const;

export type CompareGoal = (typeof COMPARE_GOALS)[number];

export type CompareDimension = { label: string; a: string; b: string };

export type CompareResult = {
  winner: "a" | "b" | "tie";
  verdict: string;
  why: string;
  analysis: CompareDimension[];
  confidence: number;
  sources: string[];
  invalidators: string[];
};

export function normalizeGoal(value: string | undefined): CompareGoal {
  const found = COMPARE_GOALS.find((goal) => goal === value);
  return found ?? "uso geral";
}

function frameMarketSlug(frameSlug: string): string {
  return `${frameSlug.replace(/-/g, "_")}_set`;
}

async function framePrice(frame: Frame): Promise<number | null> {
  try {
    const generic = await itemService.getGenericItem(frameMarketSlug(frame.slug));
    return generic?.market?.low ?? null;
  } catch {
    return null;
  }
}

function frameSummary(label: string, frame: Frame, price: number | null): string {
  const stats = [
    frame.health !== null ? `vida ${frame.health}` : null,
    frame.shield !== null ? `escudo ${frame.shield}` : null,
    frame.armor !== null ? `armadura ${frame.armor}` : null,
    frame.masteryReq !== null ? `Mastery ${frame.masteryReq}` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const abilities = frame.abilities
    .map((ability) => `${ability.name} (${ability.description})`)
    .join("; ");

  return [
    `Warframe ${label}: ${frame.name}${frame.isPrime ? " (Prime)" : ""}.`,
    frame.passive ? `Passiva: ${frame.passive}.` : "",
    abilities ? `Habilidades: ${abilities}.` : "",
    stats ? `Atributos base: ${stats}.` : "",
    `Preço do set no mercado: ${price !== null ? `${price}p` : "não negociável (obtido jogando)"}.`,
    frame.introduced ? `Introduzido em: ${frame.introduced}.` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

const COMPARE_SYSTEM = [
  "Você é a camada de inteligência da Dagath, especialista veterana em Warframe. Você ajuda o Tenno a ENTENDER a decisão entre dois warframes; você não decide por ele.",
  "Em Warframe raramente existe resposta universal. NÃO declare um vencedor absoluto. Explique os TRADE-OFFS e ajude o jogador a reconhecer qual opção encaixa melhor no objetivo, no perfil e no estilo de jogo dele. Você traduz a decisão, nunca a substitui.",
  "Para o objetivo informado, deixe claro em que condição cada um brilha (ex.: 'para farm puro, Nekros rende mais loot; mas se você quer farm com dano e controle juntos, Khora entrega os dois'). Sempre explicite o trade-off e devolva a escolha ao jogador.",
  "Use apenas os dados fornecidos (habilidades, atributos, preço de mercado quando houver) mais seu conhecimento de mecânicas. NUNCA invente preços nem números de mercado; se um frame não tem preço, é porque não é negociável (obtido jogando).",
  "Seja honesta: se realmente depende do estilo, use winner 'tie' e explique de quem é a escolha.",
  "Português do Brasil, voz clara e direta de um Tenno ajudando outro. Sem markdown.",
  "O campo 'verdict' é uma síntese curta orientada ao objetivo, em formato de trade-off (não uma ordem). 'winner' significa apenas 'melhor encaixe para este objetivo' (ou 'tie' quando depende do estilo), nunca 'melhor no geral'.",
  "analysis cobre dimensões úteis para a decisão: desempenho no objetivo, investimento e custo, acessibilidade e estágio de progressão, curva de aprendizado, versatilidade, contexto de uso. Cada dimensão traz uma frase curta para A e outra para B.",
  "sources lista as bases usadas (ex.: 'Habilidades e atributos (warframestat.us)', 'Preço de mercado (warframe.market)', 'Mecânicas conhecidas do jogo'). invalidators lista o que pode invalidar a conclusão (ex.: mudança de balanceamento, depende fortemente da build, depende do estilo de jogo).",
  'Responda só com JSON válido neste formato: {"winner":"a"|"b"|"tie","verdict":string,"why":string,"analysis":[{"label":string,"a":string,"b":string}],"confidence":number,"sources":string[],"invalidators":string[]}.',
].join(" ");

type RawCompare = {
  winner?: unknown;
  verdict?: unknown;
  why?: unknown;
  analysis?: unknown;
  confidence?: unknown;
  sources?: unknown;
  invalidators?: unknown;
};

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function textArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string").map((item) => item.trim()).filter(Boolean);
}

function normalizeResult(raw: RawCompare): CompareResult {
  const winner = raw.winner === "a" || raw.winner === "b" ? raw.winner : "tie";
  const confidence = typeof raw.confidence === "number" && Number.isFinite(raw.confidence)
    ? Math.min(1, Math.max(0, raw.confidence))
    : 0;
  const analysis: CompareDimension[] = Array.isArray(raw.analysis)
    ? raw.analysis
        .map((dim) => {
          const record = (typeof dim === "object" && dim ? dim : {}) as Record<string, unknown>;
          return { label: text(record.label), a: text(record.a), b: text(record.b) };
        })
        .filter((dim) => dim.label.length > 0)
    : [];

  return {
    winner,
    verdict: text(raw.verdict),
    why: text(raw.why),
    analysis,
    confidence,
    sources: textArray(raw.sources),
    invalidators: textArray(raw.invalidators),
  };
}

const resultCache = new Map<string, CompareResult>();
const suggestCache = new Map<string, { name: string; slug: string }[]>();

const SUGGEST_SYSTEM = [
  "Você é a camada de inteligência da Dagath, especialista em Warframe.",
  "Dado um warframe, sugira de 3 a 4 outros warframes que o jogador realisticamente consideraria comparar com ele (papéis ou usos parecidos, alternativas comuns, ou o próximo passo natural).",
  "Não inclua o próprio frame na lista. Use nomes oficiais em inglês.",
  'Responda só com JSON: {"frames": ["Nome 1", "Nome 2", "Nome 3"]}.',
].join(" ");

export const compareService = {
  async compareWarframes(
    aSlug: string,
    bSlug: string,
    goal: CompareGoal
  ): Promise<{ a: Frame; b: Frame; result: CompareResult } | null> {
    const [a, b] = await Promise.all([frameService.getBySlug(aSlug), frameService.getBySlug(bSlug)]);
    if (!a || !b) return null;

    const key = `${aSlug}|${bSlug}|${goal}`;
    const cached = resultCache.get(key);
    if (cached) return { a, b, result: cached };

    const [priceA, priceB] = await Promise.all([framePrice(a), framePrice(b)]);

    const prompt = [
      `Objetivo do jogador: ${goal}.`,
      frameSummary("A", a, priceA),
      frameSummary("B", b, priceB),
      "Compare A e B para esse objetivo e devolva só o JSON.",
    ].join("\n\n");

    try {
      const raw = await generateJson<RawCompare>(prompt, COMPARE_SYSTEM);
      const result = normalizeResult(raw);
      if (!result.verdict) return null;
      resultCache.set(key, result);
      return { a, b, result };
    } catch {
      return null;
    }
  },

  async suggestTargets(frame: Frame): Promise<{ name: string; slug: string }[]> {
    const cached = suggestCache.get(frame.slug);
    if (cached) return cached;

    try {
      const raw = await generateJson<{ frames?: unknown }>(
        `Warframe: ${frame.name}. Sugira comparações relevantes.`,
        SUGGEST_SYSTEM
      );
      const names = textArray(raw.frames).slice(0, 4);

      const resolved: { name: string; slug: string }[] = [];
      const seen = new Set<string>([frame.slug]);
      for (const name of names) {
        const matches = await frameService.search(name, 1);
        const match = matches[0];
        if (match && !seen.has(match.slug)) {
          resolved.push({ name: match.name, slug: match.slug });
          seen.add(match.slug);
        }
      }

      suggestCache.set(frame.slug, resolved);
      return resolved;
    } catch {
      return [];
    }
  },
};
