import { getCodexRepository, isCodexEnabled, isCodexReadEnabled } from "./index";
import { distill } from "./distillationService";
import { sanitizeCodexEntry } from "./sanitize";
import type { CodexEntry } from "./types";

// Gates obrigatórios da leitura assistiva. Abaixo destes limiares o
// conhecimento existe apenas no Codex, mas não influencia respostas.
const MIN_CONFIDENCE = 0.9;
const MIN_OCCURRENCES = 5;
const MIN_LEVEL = 2;

export const codexService = {
  // Leitura assistiva controlada (Sprint 3). Nunca substitui dado oficial.
  async getAssistiveKnowledge(query: string): Promise<CodexEntry[]> {
    if (!isCodexReadEnabled()) return [];

    try {
      const repo = await getCodexRepository();
      const found = await repo.findRelevant(query);
      return found.filter(
        (entry) =>
          entry.confidence >= MIN_CONFIDENCE &&
          entry.occurrences >= MIN_OCCURRENCES &&
          entry.level >= MIN_LEVEL
      );
    } catch {
      return [];
    }
  },

  // Escrita (Sprint 2): destila, sanitiza e persiste. Falha silenciosa, nunca
  // afeta a resposta da Cephalon.
  async recordKnowledge(question: string, answer: string): Promise<void> {
    if (!isCodexEnabled()) return;

    try {
      const distilled = await distill(question, answer);
      if (!distilled) return;

      const safe = sanitizeCodexEntry(distilled);
      if (!safe) return;

      const repo = await getCodexRepository();
      await repo.save(safe);
    } catch {
      // Destilação ou persistência nunca derruba a experiência da Cephalon.
    }
  },

  // Inspeção administrativa do conhecimento coletivo (validação da Sprint 2).
  async listRecent(limit: number): Promise<CodexEntry[]> {
    if (!isCodexEnabled() && !isCodexReadEnabled()) return [];

    try {
      const repo = await getCodexRepository();
      return await repo.recent(limit);
    } catch {
      return [];
    }
  },
};
