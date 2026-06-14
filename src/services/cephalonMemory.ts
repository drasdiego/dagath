import { generateJson } from "@/integrations/gemini";

// Contexto operacional da sessão da Cephalon. Existe apenas durante a sessão,
// é persistido no cliente (localStorage), nunca descreve o usuário como pessoa
// e nunca guarda texto literal. Apenas o contexto da missão atual.
export type SessionMemory = {
  objective?: {
    value: string;
    updatedAt: string;
  };
  itemsInAnalysis: string[];
  activeComparison?: {
    left: string;
    right: string;
  };
  build?: {
    frame?: string;
    focus?: string;
    priority?: string;
  };
  restrictions?: {
    platinumBudget?: number;
    masteryRank?: number;
  };
  pendingDecisions: string[];
};

const MAX_ITEMS = 8;

export function emptyMemory(): SessionMemory {
  return { itemsInAnalysis: [], pendingDecisions: [] };
}

function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : {};
}

function toText(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function toTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .slice(0, MAX_ITEMS);
}

function toNumber(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

// Garante o formato em qualquer entrada: cliente (objective como objeto) ou
// saída do extrator (objective como string).
export function normalizeMemory(value: unknown): SessionMemory {
  const source = asRecord(value);
  const memory: SessionMemory = {
    itemsInAnalysis: toTextArray(source.itemsInAnalysis),
    pendingDecisions: toTextArray(source.pendingDecisions),
  };

  const objective = source.objective;
  if (typeof objective === "string") {
    const objectiveValue = toText(objective);
    if (objectiveValue) {
      memory.objective = { value: objectiveValue, updatedAt: new Date().toISOString() };
    }
  } else if (objective && typeof objective === "object") {
    const objectiveRecord = asRecord(objective);
    const objectiveValue = toText(objectiveRecord.value);
    if (objectiveValue) {
      memory.objective = {
        value: objectiveValue,
        updatedAt: toText(objectiveRecord.updatedAt) ?? new Date().toISOString(),
      };
    }
  }

  const comparison = asRecord(source.activeComparison);
  const left = toText(comparison.left);
  const right = toText(comparison.right);
  if (left && right) {
    memory.activeComparison = { left, right };
  }

  const build = asRecord(source.build);
  const frame = toText(build.frame);
  const focus = toText(build.focus);
  const priority = toText(build.priority);
  if (frame || focus || priority) {
    memory.build = {
      ...(frame ? { frame } : {}),
      ...(focus ? { focus } : {}),
      ...(priority ? { priority } : {}),
    };
  }

  const restrictions = asRecord(source.restrictions);
  const platinumBudget = toNumber(restrictions.platinumBudget);
  const masteryRank = toNumber(restrictions.masteryRank);
  if (platinumBudget !== undefined || masteryRank !== undefined) {
    memory.restrictions = {
      ...(platinumBudget !== undefined ? { platinumBudget } : {}),
      ...(masteryRank !== undefined ? { masteryRank } : {}),
    };
  }

  return memory;
}

export function isMemoryEmpty(memory: SessionMemory): boolean {
  return (
    !memory.objective &&
    !memory.activeComparison &&
    !memory.build &&
    !memory.restrictions &&
    memory.itemsInAnalysis.length === 0 &&
    memory.pendingDecisions.length === 0
  );
}

// Bloco legível injetado no prompt da resposta. Vazio quando não há contexto.
export function describeMemory(memory: SessionMemory): string {
  if (isMemoryEmpty(memory)) return "";

  const lines: string[] = [];

  if (memory.objective) lines.push(`Objetivo atual: ${memory.objective.value}.`);
  if (memory.itemsInAnalysis.length > 0)
    lines.push(`Itens em análise: ${memory.itemsInAnalysis.join(", ")}.`);
  if (memory.activeComparison)
    lines.push(
      `Comparação ativa: ${memory.activeComparison.left} versus ${memory.activeComparison.right}.`
    );
  if (memory.build) {
    const parts = [
      memory.build.frame,
      memory.build.focus ? `foco ${memory.build.focus}` : null,
      memory.build.priority ? `prioridade ${memory.build.priority}` : null,
    ].filter((part): part is string => Boolean(part));
    lines.push(`Build em desenvolvimento: ${parts.join(", ")}.`);
  }
  if (memory.restrictions) {
    const parts: string[] = [];
    if (memory.restrictions.platinumBudget !== undefined)
      parts.push(`orçamento ${memory.restrictions.platinumBudget}p`);
    if (memory.restrictions.masteryRank !== undefined)
      parts.push(`Mastery Rank ${memory.restrictions.masteryRank}`);
    lines.push(`Restrições operacionais: ${parts.join(", ")}.`);
  }
  if (memory.pendingDecisions.length > 0)
    lines.push(`Decisões pendentes: ${memory.pendingDecisions.join("; ")}.`);

  return [
    "Memória operacional da sessão (contexto da missão atual; use para dar continuidade, adaptar recomendações ao objetivo e evitar que o usuário repita contexto):",
    ...lines,
  ].join("\n");
}

const EXTRACTION_SYSTEM_INSTRUCTION = [
  "Você é o módulo de memória operacional da Cephalon, a inteligência de Warframe da plataforma Dagath.",
  "Sua função é manter um JSON enxuto com o contexto operacional da sessão atual, para que a Cephalon não precise pedir que o usuário repita informações.",
  "Antes de incluir qualquer coisa, pergunte: esta informação pode influenciar respostas futuras desta sessão? Se não puder, não inclua.",
  "Extraia apenas fatos explícitos declarados pelo usuário ou estabelecidos na resposta. Nunca infira, nunca adivinhe.",
  "Campos permitidos, e somente eles: objective (objetivo atual do jogador, texto curto), itemsInAnalysis (itens em discussão), activeComparison (comparação ativa, com left e right), build (frame, focus, priority), restrictions (platinumBudget e masteryRank, apenas números declarados explicitamente), pendingDecisions (decisões ainda em aberto).",
  "Evolua a memória, não apenas acumule. Se uma informação nova contradiz uma antiga, substitua. Remova comparações que deixaram de ser o assunto. Remova itens que saíram de cena. Mantenha a build durante a sessão. Mantenha restrições até serem alteradas. Descarte imediatamente o irrelevante.",
  "Nunca armazene: nome do usuário, e-mail, IDs de conta, dados pessoais, perfil comportamental, preferências permanentes, conversa trivial, agradecimentos, brincadeiras, mensagens completas ou transcrição literal. Apenas a essência operacional, em português, curta.",
  'Responda somente com JSON válido, sem texto fora do JSON, neste formato exato: {"objective": string|null, "itemsInAnalysis": string[], "activeComparison": {"left": string, "right": string}|null, "build": {"frame": string|null, "focus": string|null, "priority": string|null}|null, "restrictions": {"platinumBudget": number|null, "masteryRank": number|null}|null, "pendingDecisions": string[]}.',
].join(" ");

// Memory Extraction: recebe a memória atual mais o último turno e devolve a
// memória evoluída. Nunca devolve texto literal do usuário.
export async function extractMemory(
  current: SessionMemory,
  question: string,
  answer: string
): Promise<SessionMemory> {
  const prompt = [
    `Memória operacional atual (JSON):\n${JSON.stringify(current)}`,
    `Última pergunta do usuário:\n${question}`,
    `Última resposta da Cephalon:\n${answer}`,
    "Atualize a memória operacional aplicando as regras e devolva somente o JSON.",
  ].join("\n\n");

  const raw = await generateJson<unknown>(prompt, EXTRACTION_SYSTEM_INSTRUCTION);
  const next = normalizeMemory(raw);

  // Preserva o updatedAt do objetivo quando o valor não mudou.
  if (
    next.objective &&
    current.objective &&
    next.objective.value === current.objective.value
  ) {
    next.objective.updatedAt = current.objective.updatedAt;
  }

  return next;
}
