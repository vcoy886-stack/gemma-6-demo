"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, contactName } from "@/lib/constants";

type Quote = {
  id: string;
  number: string;
  status: string;
  total: number;
  createdAt: string;
  validUntil: string | null;
  contact: { firstName: string; lastName: string | null };
  owner: { name: string } | null;
};

const STATUS_TONE: Record<string, "neutral" | "primary" | "success" | "warning" | "danger"> = {
  BORRADOR: "neutral",
  ENVIADA: "primary",
  VISTA: "primary",
  ACEPTADA: "success",
  RECHAZADA: "danger",
  VENCIDA: "warning",
};

export default function QuotesPage() {
  const [items, setItems] = useState<Quote[]>([]);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await fetch(`/api/quotes?${params}`);
    if (res.ok) setItems(await res.json());
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Cotizaciones</h1>
          <p className="text-sm text-muted">{items.length} cotizaciones</p>
        </div>
        <Link href="/quotes/new">
          <Button>
            <Plus size={15} /> Nueva cotización
          </Button>
        </Link>
      </div>

      <Card className="mb-4">
        <Select className="w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          {["BORRADOR", "ENVIADA", "VISTA", "ACEPTADA", "RECHAZADA", "VENCIDA"].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </Select>
      </Card>

      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-black/[0.02] text-left text-xs uppercase text-muted">
              <tr>
                <th className="px-4 py-3">Número</th>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Vendedor</th>
                <th className="px-4 py-3">Vence</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((q) => (
                <tr key={q.id} className="border-b border-border last:border-0 hover:bg-black/[0.015]">
                  <td className="px-4 py-3">
                    <Link href={`/quotes/${q.id}`} className="flex items-center gap-2 font-medium text-foreground hover:text-primary">
                      <FileText size={14} /> {q.number}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{contactName(q.contact)}</td>
                  <td className="px-4 py-3 text-muted">{q.owner?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(q.validUntil)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[q.status]}>{q.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(q.total)}</td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                    Aún no hay cotizaciones.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
