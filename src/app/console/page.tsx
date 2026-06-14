import ConsoleTerminal from "@/components/ConsoleTerminal";

export default function ConsolePage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-10 flex flex-col gap-6">
      <div>
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-ink-3 mb-1">
          // Cephalon
        </p>
        <h1 className="font-display text-2xl font-semibold uppercase tracking-widest text-ink-0">
          Cephalon
        </h1>
        <p className="font-body text-xs text-ink-2 mt-1">
          Especialista em Warframe · conversa sobre builds, mercado, farm e mecânicas, com os dados ao vivo da Dagath
        </p>
      </div>

      <ConsoleTerminal />
    </main>
  );
}