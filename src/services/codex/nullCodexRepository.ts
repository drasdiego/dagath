import type { CodexRepository } from "./codexRepository";

// Repositório inerte usado quando o Codex está desligado ou sem conexão.
// Garante zero impacto no comportamento atual.
export const nullCodexRepository: CodexRepository = {
  async save() {},
  async findRelevant() {
    return [];
  },
  async consolidate() {},
};
