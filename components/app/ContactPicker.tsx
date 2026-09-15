"use client";

import { useEffect, useState, useRef } from "react";
import { Search, X } from "lucide-react";
import { contactName } from "@/lib/constants";

type ContactOption = { id: string; firstName: string; lastName: string | null; phone: string | null };

export function ContactPicker({
  value,
  onChange,
  placeholder = "Buscar contacto...",
}: {
  value: ContactOption | null;
  onChange: (contact: ContactOption | null) => void;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ContactOption[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (!query) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      const res = await fetch(`/api/contacts?search=${encodeURIComponent(query)}&pageSize=8`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.items);
      }
    }, 200);
    return () => clearTimeout(t);
  }, [query]);

  if (value) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-border bg-primary-soft px-3 py-2 text-sm">
        <span className="font-medium text-primary">{contactName(value)}</span>
        <button type="button" onClick={() => onChange(null)} className="text-primary hover:text-primary-hover">
          <X size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-surface py-2 pl-8 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 w-full rounded-lg border border-border bg-surface shadow-lg">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onChange(c);
                setOpen(false);
                setQuery("");
              }}
              className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-black/[0.03]"
            >
              <span>{contactName(c)}</span>
              <span className="text-xs text-muted">{c.phone}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
