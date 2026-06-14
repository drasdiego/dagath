// Nível de classificação do conhecimento.
// 1 efêmero (não persistir), 2 reutilizável (persistir), 3 consolidado (recorrente).
export type CodexLevel = 1 | 2 | 3;

// Entrada do Codex Vivo. Conhecimento coletivo anonimizado e destilado.
// Nunca contém usuário, pergunta literal ou dado pessoal.
export type CodexEntry = {
  topic: string;
  question: string;
  knowledge: string;
  level: CodexLevel;
  confidence: number;
  occurrences: number;
  sources: string[];
};
