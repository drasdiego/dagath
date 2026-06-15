import { itemService } from "@/services/itemService";
import { marketPulseService } from "@/services/marketPulseService";
import { trendService } from "@/services/trendService";
import { insightService } from "@/services/insightService";
import { warframeMarket, WFM_ASSETS_URL } from "@/integrations/warframeMarket";
import { after } from "next/server";
import { generateText } from "@/integrations/gemini";
import {
  type SessionMemory,
  emptyMemory,
  describeMemory,
  extractMemory,
} from "@/services/cephalonMemory";
import { codexService } from "@/services/codex/codexService";

export type ConsoleHelpResult = {
  kind: "help";
  commands: { command: string; description: string }[];
};

export type ConsolePulseResult = {
  kind: "pulse";
  totalOrders: number;
  sellOrders: number;
  buyOrders: number;
  platVolume: number;
  uniqueTraders: number;
  windowHours: number;
};

export type ConsoleTrendsResult = {
  kind: "trends";
  direction: "alta" | "queda";
  minutesBetween: number;
  movers: {
    name: string | null;
    slug: string | null;
    avgPlat: number;
    prevAvgPlat: number;
    deltaPct: number;
  }[];
};

export type ConsolePriceResult = {
  kind: "price";
  name: string;
  slug: string;
  low: number;
  avg: number;
  high: number;
  sellersOnline: number;
  bestSeller: string;
  bestPlat: number;
  message: string;
};

export type ConsoleItemsResult = {
  kind: "items";
  query: string;
  matches: { slug: string; name: string; thumb: string | null }[];
};

export type ConsoleAiResult = {
  kind: "ai";
  question: string;
  answer: string;
  memory: SessionMemory;
};

export type ConsoleErrorResult = {
  kind: "error";
  message: string;
};

export type ConsoleNoticeResult = {
  kind: "notice";
  message: string;
};

export type ConsoleResult =
  | ConsoleHelpResult
  | ConsolePulseResult
  | ConsoleTrendsResult
  | ConsolePriceResult
  | ConsoleItemsResult
  | ConsoleAiResult
  | ConsoleNoticeResult
  | ConsoleErrorResult;

const HELP_COMMANDS = [
  { command: "preço <item>", description: "Mercado ao vivo e melhor oferta do item" },
  { command: "item <nome>", description: "Busca itens no catálogo e lista atalhos" },
  { command: "pulse", description: "Resumo do mercado nas últimas 4 horas" },
  { command: "alta", description: "Itens em valorização entre as últimas verificações" },
  { command: "queda", description: "Itens em desvalorização entre as últimas verificações" },
  { command: "ajuda", description: "Lista os comandos disponíveis" },
  { command: "esquecer", description: "Apaga o contexto operacional da sessão atual" },
  { command: "pergunta livre", description: "Qualquer outra coisa vira conversa com a Cephalon, especialista em Warframe apoiada nos dados da Dagath" },
];

const AI_SYSTEM_INSTRUCTION = [
  "Você é a Cephalon, a inteligência de bordo da plataforma Dagath e uma consultora estratégica veterana de Warframe. Comporte-se como um Cephalon do universo Warframe: altamente competente, contextual e focado em ajudar o Operador da forma mais eficiente.",
  "Use seu conhecimento profundo do jogo: warframes, armas, mods, arcanes, builds, farm, missões, facções, mecânicas e lore. Responda como quem realmente joga há anos.",
  "Regra de dados de mercado: para preço, melhor oferta, disponibilidade e qualquer número de mercado, use SOMENTE o retrato de dados da Dagath fornecido na conversa. Nunca invente preços nem estatísticas de mercado. Se o dado não estiver presente, diga que não tem o número agora e sugira o comando preço <item>.",
  "Conhecimento de jogo (mecânica, build, farm, lore) pode vir do seu próprio conhecimento. Se algo puder ter mudado em updates recentes, sinalize brevemente que vale confirmar no jogo.",
  "Responda em português do Brasil. Não use markdown (sem asteriscos, cerquilha, hifens de lista ou tabelas). Pode usar quebras de linha curtas para separar ideias quando ajudar a leitura.",
  "Ajuste o tamanho à pergunta: objetiva quando simples, aprofundada quando a pergunta pedir (comparar builds, explicar mecânica, planejar farm). Sem encher linguiça.",
  "Cubra apenas Warframe. Se a pergunta fugir do tema, redirecione com cordialidade.",
  "Você pode receber uma memória operacional da sessão (objetivo, itens em análise, comparações, build, restrições, decisões pendentes). Use-a para dar continuidade à missão atual, adaptar recomendações ao objetivo em andamento, lembrar decisões já tomadas e evitar que o usuário repita contexto. Se a memória estiver vazia, conduza normalmente.",
  "Você lembra apenas da missão atual desta sessão, nunca do usuário como pessoa. Não finja lembrar de conversas passadas além desta sessão.",
  "Hierarquia de fontes, nesta ordem: 1) Dagath, fonte oficial da verdade para preço e disponibilidade; 2) seu conhecimento consolidado de Warframe; 3) Codex Vivo, conhecimento coletivo auxiliar; 4) contexto operacional da sessão. Em caso de conflito, vale Dagath sobre modelo, modelo sobre Codex, Codex sobre contexto. O Codex Vivo é auxiliar e nunca substitui dado oficial da Dagath. Quando não houver dado oficial, diga isso explicitamente.",
  "Tom: especialista confiante, direta e prestativa, como um bom Cephalon de bordo.",
].join(" ");

function normalize(input: string): string {
  return input.trim().toLowerCase();
}

async function findMentionedItem(question: string): Promise<{ slug: string; name: string } | null> {
  try {
    const items = await warframeMarket.getAllItems();
    const lowered = question.toLowerCase();

    let best: { slug: string; name: string } | null = null;
    let bestLength = 0;

    for (const item of items) {
      const name = item.i18n?.en?.name;
      if (!name || name.length < 4) continue;
      const loweredName = name.toLowerCase();
      if (lowered.includes(loweredName) && loweredName.length > bestLength) {
        best = { slug: item.slug, name };
        bestLength = loweredName.length;
      }
    }

    return best;
  } catch {
    return null;
  }
}

async function buildItemContext(slug: string, name: string): Promise<string> {
  const lines: string[] = [`Item citado na pergunta: ${name}.`];

  try {
    const generic = await itemService.getGenericItem(slug);

    if (generic?.market) {
      lines.push(
        `Mercado ao vivo de ${name}: mínimo ${generic.market.low}p, média ${generic.market.avg}p, máximo ${generic.market.high}p, ${generic.market.sellersOnline} vendedores ativos.`
      );
    }
    if (generic?.vaulted !== null && generic?.vaulted !== undefined) {
      lines.push(`Status: ${generic.vaulted ? "vaulted (fora de circulação, relíquias não caem mais)" : "em circulação"}.`);
    }

    const report = await insightService.getReport(slug, generic?.market?.low);
    if (report) {
      lines.push(
        `Histórico de 90 dias: média da semana ${report.avg7}p, média do mês ${report.avg30}p, mínimo ${report.min90}p, máximo ${report.max90}p, ${report.volumeAvg30} negociações por dia.`
      );
      lines.push(`Veredito do motor Dagath: ${report.verdict.label}.`);
      for (const insight of report.insights) {
        lines.push(`Insight: ${insight.title}. ${insight.detail}`);
      }
    }
  } catch {
    lines.push("Não foi possível carregar os dados deste item agora.");
  }

  return lines.join("\n");
}

async function buildMarketContext(): Promise<string> {
  const lines: string[] = [];

  const pulse = await marketPulseService.getPulse();
  if (pulse) {
    lines.push(
      `Mercado nas últimas ${pulse.windowHours}h: ${pulse.totalOrders} anúncios (${pulse.sellOrders} de venda, ${pulse.buyOrders} de compra), ${pulse.platVolume} platina em movimento, ${pulse.uniqueTraders} jogadores negociando.`
    );
  }

  const trends = await trendService.getTrends();
  if (trends) {
    const formatMover = (mover: { name: string | null; prevAvgPlat: number; avgPlat: number; deltaPct: number }) =>
      `${mover.name} (${mover.prevAvgPlat}p para ${mover.avgPlat}p, ${mover.deltaPct >= 0 ? "+" : ""}${mover.deltaPct.toFixed(1)}%)`;

    if (trends.topGainers.length > 0) {
      lines.push(`Subindo de preço: ${trends.topGainers.slice(0, 3).map(formatMover).join("; ")}.`);
    }
    if (trends.topLosers.length > 0) {
      lines.push(`Caindo de preço: ${trends.topLosers.slice(0, 3).map(formatMover).join("; ")}.`);
    }
  }

  if (lines.length === 0) {
    lines.push("Sem dados de mercado disponíveis no momento.");
  }

  return lines.join("\n");
}

export const consoleService = {
  async execute(
    rawInput: string,
    memory: SessionMemory = emptyMemory()
  ): Promise<ConsoleResult> {
    const input = normalize(rawInput);
    if (!input) {
      return { kind: "error", message: "Digite um comando. Use ajuda para ver as opções." };
    }

    const [head, ...restParts] = input.split(/\s+/);
    const rest = restParts.join(" ");

    if (head === "ajuda" || head === "help") {
      return { kind: "help", commands: HELP_COMMANDS };
    }

    if (head === "pulse") {
      const pulse = await marketPulseService.getPulse();
      if (!pulse) {
        return { kind: "error", message: "Sem conexão com o mercado no momento." };
      }
      return {
        kind: "pulse",
        totalOrders: pulse.totalOrders,
        sellOrders: pulse.sellOrders,
        buyOrders: pulse.buyOrders,
        platVolume: pulse.platVolume,
        uniqueTraders: pulse.uniqueTraders,
        windowHours: pulse.windowHours,
      };
    }

    if (head === "alta" || head === "queda") {
      const trends = await trendService.getTrends();
      if (!trends) {
        return {
          kind: "error",
          message: "Histórico insuficiente. O coletor precisa de ao menos duas verificações.",
        };
      }
      const source = head === "alta" ? trends.topGainers : trends.topLosers;
      return {
        kind: "trends",
        direction: head,
        minutesBetween: trends.minutesBetween,
        movers: source.map((mover) => ({
          name: mover.name,
          slug: mover.slug,
          avgPlat: mover.avgPlat,
          prevAvgPlat: mover.prevAvgPlat,
          deltaPct: mover.deltaPct,
        })),
      };
    }

    if (head === "preço" || head === "preco" || head === "price") {
      if (!rest) {
        return { kind: "error", message: "Informe o item. Exemplo: preço primed flow" };
      }
      const matches = await warframeMarket.searchItems(rest, 1);
      if (matches.length === 0) {
        return { kind: "error", message: `Nenhum item encontrado para "${rest}".` };
      }
      const generic = await itemService.getGenericItem(matches[0].slug);
      if (!generic) {
        return { kind: "error", message: `Falha ao consultar "${matches[0].i18n.en.name}".` };
      }
      if (!generic.market || !generic.bestOffer) {
        return {
          kind: "error",
          message: `${generic.name} está sem ofertas ativas no momento.`,
        };
      }
      return {
        kind: "price",
        name: generic.name,
        slug: generic.slug,
        low: generic.market.low,
        avg: generic.market.avg,
        high: generic.market.high,
        sellersOnline: generic.market.sellersOnline,
        bestSeller: generic.bestOffer.seller,
        bestPlat: generic.bestOffer.plat,
        message: generic.bestOffer.message,
      };
    }

    if (head === "item") {
      if (!rest) {
        return { kind: "error", message: "Informe o nome. Exemplo: item khora prime" };
      }
      const matches = await warframeMarket.searchItems(rest, 5);
      if (matches.length === 0) {
        return { kind: "error", message: `Nenhum item encontrado para "${rest}".` };
      }
      return {
        kind: "items",
        query: rest,
        matches: matches.map((match) => ({
          slug: match.slug,
          name: match.i18n.en.name,
          thumb: match.i18n.en.thumb ? `${WFM_ASSETS_URL}${match.i18n.en.thumb}` : null,
        })),
      };
    }

    if (!process.env.GEMINI_API_KEY) {
      return {
        kind: "error",
        message: `Comando "${head}" não reconhecido. Use ajuda para ver as opções.`,
      };
    }

    try {
      const mentioned = await findMentionedItem(rawInput);

      // Dados da Dagath e leitura assistiva do Codex em paralelo: o Codex não
      // adiciona latência serial perceptível.
      const contextPromise = (async () => {
        const parts = [await buildMarketContext()];
        if (mentioned) {
          parts.push(await buildItemContext(mentioned.slug, mentioned.name));
        }
        return parts;
      })();
      const codexPromise = codexService.getAssistiveKnowledge(rawInput.trim());
      const [contextParts, codexKnowledge] = await Promise.all([contextPromise, codexPromise]);

      const sections: string[] = [];
      sections.push(`Dados da Dagath:\n${contextParts.join("\n\n")}`);
      if (codexKnowledge.length > 0) {
        const knowledge = codexKnowledge.map((entry) => `- ${entry.knowledge}`).join("\n");
        sections.push(
          `Conhecimento coletivo do Codex Vivo (auxiliar; use apenas se não conflitar com os dados da Dagath nem com a mecânica que você conhece):\n${knowledge}`
        );
      }
      const memoryBlock = describeMemory(memory);
      if (memoryBlock) {
        sections.push(memoryBlock);
      }
      sections.push(`Pergunta do usuário: ${rawInput.trim()}`);

      const prompt = sections.join("\n\n");
      const answer = await generateText(prompt, AI_SYSTEM_INSTRUCTION);

      // Memory Extraction: evolui a memória operacional após responder.
      // Nunca pode derrubar a resposta, então falha silenciosa mantém a anterior.
      let updatedMemory = memory;
      try {
        updatedMemory = await extractMemory(memory, rawInput.trim(), answer);
      } catch {
        updatedMemory = memory;
      }

      // Knowledge Distillation em segundo plano: não bloqueia a resposta.
      try {
        after(() => {
          void codexService.recordKnowledge(rawInput.trim(), answer);
        });
      } catch {
        // Fora de um contexto de request: ignora a destilação.
      }

      return { kind: "ai", question: rawInput.trim(), answer, memory: updatedMemory };
    } catch {
      return {
        kind: "error",
        message: "A IA está indisponível agora. Use ajuda para ver os comandos diretos.",
      };
    }
  },
};