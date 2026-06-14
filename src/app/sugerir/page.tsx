import SuggestionForm from "@/components/SuggestionForm";

export default function SuggestPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-10 flex flex-col gap-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3 mb-1">
          // Comunidade
        </p>
        <h1 className="font-display text-2xl font-semibold uppercase tracking-widest text-ink-0">
          Sugerir build
        </h1>
        <p className="font-body text-xs text-ink-2 mt-1">
          Monte uma build recomendada para qualquer item. Sua sugestão passa por revisão antes de aparecer na ficha.
        </p>
      </div>

      <SuggestionForm />
    </main>
  );
}