import { generateJson } from "@/integrations/gemini";
import type { CodexEntry, CodexLevel } from "./types";

type DistillationRaw = {
  reusable?: unknown;
  level?: unknown;
  topic?: unknown;
  question?: unknown;
  knowledge?: unknown;
  confidence?: unknown;
  sources?: unknown;
};

function toText(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toSources(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
    .slice(0, 6);
}

function clampLevel(value: unknown): CodexLevel {
  const level = Number(value);
  if (level >= 3) return 3;
  if (level <= 1) return 1;
  return 2;
}

function clampConfidence(value: unknown): number {
  const confidence = Number(value);
  if (!Number.isFinite(confidence)) return 0;
  return Math.min(1, Math.max(0, confidence));
}

const DISTILLATION_SYSTEM_INSTRUCTION = [
  "Você é o módulo de Knowledge Distillation do Codex Vivo da Dagath, plataforma de Warframe.",
  "Sua função é decidir se a interação produziu conhecimento reutilizável para a comunidade e, em caso afirmativo, convertê-lo em conhecimento neutro e anonimizado.",
  "Pergunta obrigatória: existe conhecimento reutilizável para a comunidade nesta interação? Se não, marque reusable como false.",
  "Não é reutilizável (nível 1, efêmero): preço atual, disponibilidade temporária, eventos passageiros, situação pessoal do jogador. Nesses casos, reusable false.",
  "É reutilizável (nível 2): comparações, estratégias, recomendações gerais, interpretações de mecânicas, mudanças percebidas após patches.",
  "Nunca inclua: nome, IDs, e-mail, pergunta literal, resposta integral, dados pessoais, orçamento individual, Mastery Rank individual, build pessoal ou qualquer coisa que reconstrua a conversa original.",
  "topic deve ser um identificador curto em snake_case (ex.: steel_path_survivability). question deve ser uma versão geral e neutra da dúvida. knowledge deve ser o conhecimento neutro e reutilizável, sem primeira pessoa.",
  "confidence é a sua confiança no conhecimento, de 0 a 1.",
  'Responda somente com JSON válido neste formato: {"reusable": boolean, "level": 1|2, "topic": string, "question": string, "knowledge": string, "confidence": number, "sources": string[]}.',
].join(" ");

// Knowledge Distillation: descarta a pergunta original e produz conhecimento
// coletivo anonimizado. Retorna null quando não há nada reutilizável.
export async function distill(
  question: string,
  answer: string
): Promise<CodexEntry | null> {
  const prompt = [
    `Pergunta do usuário (descartar após destilar, nunca persistir literal):\n${question}`,
    `Resposta da Cephalon:\n${answer}`,
    "Avalie e devolva somente o JSON da destilação.",
  ].join("\n\n");

  const raw = await generateJson<DistillationRaw>(prompt, DISTILLATION_SYSTEM_INSTRUCTION);

  if (!raw || raw.reusable !== true) return null;

  const level = clampLevel(raw.level);
  if (level < 2) return null;

  const topic = toText(raw.topic);
  const generalizedQuestion = toText(raw.question);
  const knowledge = toText(raw.knowledge);
  if (!topic || !generalizedQuestion || !knowledge) return null;

  return {
    topic,
    question: generalizedQuestion,
    knowledge,
    level,
    confidence: clampConfidence(raw.confidence),
    occurrences: 1,
    sources: toSources(raw.sources),
  };
}
