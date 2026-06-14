"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SearchResult = {
  slug: string;
  name: string;
  maxRank: number | null;
  thumb: string | null;
};

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/items?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        setResults(data.results ?? []);
        setOpen(true);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  function handleSelect(slug: string) {
    setQuery("");
    setResults([]);
    setOpen(false);
    router.push(`/item/${slug}`);
  }

  return (
    <div className="relative w-full max-w-md">
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder="Pesquisar item, mod, arcane..."
        className="w-full border border-line-2 bg-bg-2 px-3 py-2 font-mono text-xs text-ink-0 placeholder:text-ink-3 outline-none focus:border-line-cyan transition-colors"
      />
      {loading && (
        <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[9px] uppercase text-ink-3">
          ...
        </span>
      )}

      {open && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full mt-1 z-50 border border-line-2 bg-bg-1 shadow-lg max-h-80 overflow-y-auto">
          {results.map((item) => (
            <li key={item.slug}>
              <button
                onMouseDown={() => handleSelect(item.slug)}
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-bg-2 transition-colors"
              >
                {item.thumb ? (
                  <img
                    src={item.thumb}
                    alt={item.name}
                    width={28}
                    height={28}
                    className="shrink-0"
                  />
                ) : (
                  <span className="w-7 h-7 border border-line-1 shrink-0" />
                )}
                <span className="flex-1 font-body text-sm text-ink-0 truncate">
                  {item.name}
                </span>
                {item.maxRank !== null && (
                  <span className="font-mono text-[9px] uppercase border border-line-2 px-1.5 py-0.5 text-ink-2 shrink-0">
                    R0-{item.maxRank}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}