"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Loader2 } from "lucide-react";
import clsx from "clsx";

type ChatMessage = { role: "USER" | "ASSISTANT"; content: string };

const SUGGESTIONS = [
  "¿Qué debo hacer hoy?",
  "Muéstrame mis leads más calientes",
  "Analiza mis ventas de este mes",
  "¿Qué seguimientos tengo pendientes?",
];

export function AiAssistantPanel() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "ASSISTANT",
      content:
        "Hola, soy tu copiloto comercial. Puedo consultar tus datos reales de clientes, leads, ventas y pipeline. ¿En qué te ayudo?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [briefLoaded, setBriefLoaded] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  useEffect(() => {
    function openFromOutside(e: Event) {
      setOpen(true);
      const detail = (e as CustomEvent<{ question?: string }>).detail;
      if (detail?.question) send(detail.question);
    }
    window.addEventListener("open-ai-assistant", openFromOutside);
    return () => window.removeEventListener("open-ai-assistant", openFromOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!open || briefLoaded) return;
    setBriefLoaded(true);
    fetch("/api/ai/brief")
      .then((r) => r.json())
      .then((data: { alerts: string[] }) => {
        if (data.alerts?.length > 0) {
          setMessages((m) => [
            ...m,
            { role: "ASSISTANT", content: `Antes de empezar, esto necesita tu atención:\n\n${data.alerts.join("\n")}` },
          ]);
        }
      })
      .catch(() => {});
  }, [open, briefLoaded]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: ChatMessage = { role: "USER", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, conversationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => [
          ...m,
          { role: "ASSISTANT", content: data.error ?? "Ocurrió un error, intenta de nuevo." },
        ]);
        return;
      }
      setConversationId(data.conversationId);
      setMessages((m) => [...m, { role: "ASSISTANT", content: data.reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "ASSISTANT", content: "No pude conectar con el servidor. Intenta de nuevo." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={clsx(
          "fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3 text-sm font-medium text-white shadow-lg transition-transform hover:scale-105",
          open && "hidden"
        )}
      >
        <Sparkles size={18} />
        Asistente IA
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 sm:bg-transparent">
          <div className="flex h-full w-full max-w-md flex-col border-l border-border bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 text-white">
              <div className="flex items-center gap-2">
                <Sparkles size={18} />
                <div>
                  <p className="text-sm font-semibold">Asistente IA</p>
                  <p className="text-[11px] text-indigo-100">Copiloto comercial</p>
                </div>
              </div>
              <button onClick={() => setOpen(false)} className="rounded-md p-1 hover:bg-white/10">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={clsx("flex", m.role === "USER" ? "justify-end" : "justify-start")}
                >
                  <div
                    className={clsx(
                      "max-w-[85%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-sm",
                      m.role === "USER"
                        ? "bg-primary text-white"
                        : "border border-border bg-white text-foreground"
                    )}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-2 text-xs text-muted">
                  <Loader2 size={14} className="animate-spin" />
                  Pensando...
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-1.5 px-4 pb-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-border bg-primary-soft px-3 py-1 text-xs text-primary hover:bg-indigo-100"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="flex items-center gap-2 border-t border-border p-3"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Pregúntale algo a tu copiloto..."
                className="flex-1 rounded-full border border-border bg-white px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                type="submit"
                disabled={loading}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white disabled:opacity-50"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
