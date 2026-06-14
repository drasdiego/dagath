"use client";

import { useState } from "react";

type CopyMessageButtonProps = {
  message: string;
  compact?: boolean;
};

export default function CopyMessageButton({ message, compact = false }: CopyMessageButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  if (compact) {
    return (
      <button
        onClick={handleCopy}
        title={message}
        className={`border px-2 py-1 font-mono text-[9px] uppercase tracking-[0.15em] transition-colors ${
          copied
            ? "border-up bg-up-faint text-up"
            : "border-line-2 text-ink-2 hover:border-line-cyan hover:text-cyan"
        }`}
      >
        {copied ? "Copiado" : "Copiar"}
      </button>
    );
  }

  return (
    <button
      onClick={handleCopy}
      title={message}
      className={`w-full border py-2 font-mono text-xs uppercase tracking-[0.2em] transition-colors ${
        copied
          ? "border-up bg-up-faint text-up"
          : "border-line-cyan bg-cyan-faint text-cyan hover:bg-cyan hover:text-bg-0"
      }`}
    >
      {copied ? "Mensagem copiada" : "Copiar mensagem"}
    </button>
  );
}