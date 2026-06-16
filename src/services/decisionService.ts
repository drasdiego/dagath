export type HardDecision = {
  id: string;
  question: string;
  aSlug: string;
  bSlug: string;
  goal: string;
};

// Dilemas reais e de alto impacto da comunidade. Hoje estáticos e restritos a
// Warframes, onde a Compare Engine já opera. A assinatura nasce preparada para
// evoluir: futuramente getHardDecisions receberá contexto (jornada, oportunidades,
// histórico, eventos, tendências) e devolverá dilemas personalizados.
const CURATED: HardDecision[] = [
  {
    id: "khora-nekros-farm",
    question: "Khora Prime ou Nekros Prime para farm de recursos?",
    aSlug: "khora-prime",
    bSlug: "nekros-prime",
    goal: "farm de recursos",
  },
  {
    id: "saryn-volt-steelpath",
    question: "Saryn Prime ou Volt Prime para Steel Path?",
    aSlug: "saryn-prime",
    bSlug: "volt-prime",
    goal: "Steel Path",
  },
  {
    id: "wisp-mesa-dano",
    question: "Wisp Prime ou Mesa Prime para dano?",
    aSlug: "wisp-prime",
    bSlug: "mesa-prime",
    goal: "dano",
  },
  {
    id: "rhino-inaros-sobrevivencia",
    question: "Rhino Prime ou Inaros Prime para sobrevivência?",
    aSlug: "rhino-prime",
    bSlug: "inaros-prime",
    goal: "sobrevivência",
  },
];

export const decisionService = {
  getHardDecisions(): HardDecision[] {
    return CURATED;
  },
};
