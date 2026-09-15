"use client";

import { useState } from "react";
import { Search, Sparkles, ChevronDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { HELP_TOPICS } from "@/lib/ai/help";

export default function HelpCenterPage() {
  const [query, setQuery] = useState("");
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const filtered = HELP_TOPICS.filter(
    (t) =>
      !query ||
      t.title.toLowerCase().includes(query.toLowerCase()) ||
      t.keywords.some((k) => k.includes(query.toLowerCase()))
  );

  function askAssistant(question: string) {
    window.dispatchEvent(new CustomEvent("open-ai-assistant", { detail: { question } }));
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-foreground">Centro de ayuda IA</h1>
        <p className="text-sm text-muted">
          Instrucciones paso a paso para usar el sistema. Si no encuentras lo que buscas, pregúntale
          directamente a tu asistente IA.
        </p>
      </div>

      <Card className="mb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              className="pl-8"
              placeholder="Busca: crear producto, importar clientes, automatizaciones..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <Button variant="secondary" onClick={() => askAssistant(query || "¿Qué debo hacer hoy?")}>
            <Sparkles size={15} /> Preguntarle al asistente
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        {filtered.map((topic, i) => (
          <Card key={topic.title} padded={false}>
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-sm font-medium text-foreground">{topic.title}</span>
              <ChevronDown
                size={16}
                className={`text-muted transition-transform ${openIndex === i ? "rotate-180" : ""}`}
              />
            </button>
            {openIndex === i && (
              <ol className="space-y-1.5 border-t border-border px-4 py-3 text-sm text-foreground">
                {topic.steps.map((step, si) => (
                  <li key={si} className="flex gap-2">
                    <span className="font-medium text-primary">{si + 1}.</span>
                    {step}
                  </li>
                ))}
              </ol>
            )}
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">
            No encontramos una guía para eso. Pregúntale directamente a tu asistente IA arriba.
          </p>
        )}
      </div>
    </div>
  );
}
