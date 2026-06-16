import Link from "next/link";
import HudPanel from "@/components/HudPanel";
import { compareService, normalizeGoal, COMPARE_GOALS } from "@/services/compareService";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ a?: string; b?: string; goal?: string }>;
}) {
  const { a, b, goal: goalParam } = await searchParams;
  const goal = normalizeGoal(goalParam);

  if (!a || !b) {
    return (
      <main className="mx-auto max-w-[1100px] px-6 py-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3">// Compare Engine</p>
        <h1 className="font-display text-2xl font-semibold text-ink-0 mt-2">Comparar Warframes</h1>
        <p className="font-body text-sm text-ink-2 mt-2">
          Escolha dois warframes para comparar. Abra a ficha de um frame e use "Comparar com", que a Dagath já sugere os mais relevantes.
        </p>
      </main>
    );
  }

  const comparison = await compareService.compareWarframes(a, b, goal);

  if (!comparison) {
    return (
      <main className="mx-auto max-w-[1100px] px-6 py-10">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3">// Compare Engine</p>
        <h1 className="font-display text-2xl font-semibold text-ink-0 mt-2">Comparação indisponível</h1>
        <p className="font-body text-sm text-ink-2 mt-2">
          Não consegui montar uma comparação confiável agora. Tente outros frames ou volte em instantes.
        </p>
      </main>
    );
  }

  const { a: frameA, b: frameB, result } = comparison;
  const winnerName = result.winner === "a" ? frameA.name : result.winner === "b" ? frameB.name : null;
  const confidence = Math.round(result.confidence * 100);

  return (
    <main className="mx-auto max-w-[1100px] px-6 py-10 flex flex-col gap-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3 mb-1">// Compare Engine</p>
        <h1 className="font-display text-2xl lg:text-3xl font-semibold text-ink-0">
          {frameA.name} <span className="text-ink-3">vs</span> {frameB.name}
        </h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3 mr-1">Para o que você quer</span>
        {COMPARE_GOALS.map((option) => (
          <Link
            key={option}
            href={`/compare?a=${a}&b=${b}&goal=${encodeURIComponent(option)}`}
            className={`border px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.15em] transition-colors ${
              option === goal
                ? "border-line-cyan bg-cyan-faint text-cyan"
                : "border-line-2 text-ink-2 hover:border-line-cyan hover:text-cyan"
            }`}
          >
            {option}
          </Link>
        ))}
      </div>

      <section className="hud-panel hud-panel--gold hud-panel--clipped p-7 flex flex-col gap-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3">
          Veredito Dagath · {goal}
        </p>
        <h2 className="font-display text-2xl lg:text-3xl font-semibold text-ink-0 leading-tight">
          {result.verdict}
        </h2>
        {winnerName && (
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-gold">
            Recomendado: {winnerName}
          </p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3">Confiança</span>
          <div className="w-24 h-1 bg-bg-3">
            <div className="h-1 bg-cyan" style={{ width: `${confidence}%` }} />
          </div>
          <span className="font-mono text-xs text-cyan tabular-nums">{confidence}%</span>
        </div>
      </section>

      {result.why && (
        <section className="hud-panel">
          <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3 mb-1.5">Por quê</p>
          <p className="font-body text-sm text-ink-1 leading-relaxed">{result.why}</p>
        </section>
      )}

      {result.analysis.length > 0 && (
        <details className="group hud-panel hud-panel--accent" open>
          <summary className="flex cursor-pointer select-none items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3 hover:text-cyan transition-colors [&::-webkit-details-marker]:hidden">
            <span className="inline-block transition-transform group-open:rotate-90">›</span>
            Análise detalhada
          </summary>
          <div className="mt-4 flex flex-col">
            <div className="flex items-center gap-3 pb-2 border-b border-line-1 font-mono text-[9px] uppercase tracking-[0.15em] text-ink-3">
              <span className="flex-1" />
              <span className="w-[34%] text-cyan">{frameA.name}</span>
              <span className="w-[34%] text-gold">{frameB.name}</span>
            </div>
            {result.analysis.map((dim, index) => (
              <div key={dim.label} className={`flex items-start gap-3 py-2.5 ${index > 0 ? "border-t border-line-1" : ""}`}>
                <span className="flex-1 font-mono text-[10px] uppercase tracking-[0.1em] text-ink-2">{dim.label}</span>
                <span className="w-[34%] font-body text-xs text-ink-1 leading-snug">{dim.a}</span>
                <span className="w-[34%] font-body text-xs text-ink-1 leading-snug">{dim.b}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      <details className="group hud-panel">
        <summary className="flex cursor-pointer select-none items-center gap-2 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3 hover:text-cyan transition-colors [&::-webkit-details-marker]:hidden">
          <span className="inline-block transition-transform group-open:rotate-90">›</span>
          Fontes e auditoria
        </summary>
        <div className="mt-3 flex flex-col gap-3 font-body text-xs text-ink-2 leading-relaxed">
          {result.sources.length > 0 && (
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3 mb-1">Dados e fontes</p>
              <ul className="flex flex-col gap-0.5">
                {result.sources.map((source) => (
                  <li key={source}>· {source}</li>
                ))}
              </ul>
            </div>
          )}
          {result.invalidators.length > 0 && (
            <div>
              <p className="font-mono text-[9px] uppercase tracking-[0.2em] text-ink-3 mb-1">O que pode mudar essa conclusão</p>
              <ul className="flex flex-col gap-0.5">
                {result.invalidators.map((item) => (
                  <li key={item}>· {item}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-ink-3">
            Confiança {confidence}%. A Dagath cruza dados reais com mecânicas conhecidas; ela orienta a decisão, mas a escolha final é sua, Tenno.
          </p>
        </div>
      </details>

      <div className="flex flex-wrap gap-3 pt-1">
        <Link href={`/frame/${frameA.slug}`} className="border border-line-2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-2 hover:border-line-cyan hover:text-cyan transition-colors">
          Ficha de {frameA.name}
        </Link>
        <Link href={`/frame/${frameB.slug}`} className="border border-line-2 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-ink-2 hover:border-line-cyan hover:text-cyan transition-colors">
          Ficha de {frameB.name}
        </Link>
      </div>
    </main>
  );
}
