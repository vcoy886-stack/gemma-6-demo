"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Plus, ShoppingCart } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, contactName } from "@/lib/constants";

type Sale = {
  id: string;
  number: string;
  status: string;
  total: number;
  saleDate: string;
  paymentMethod: string | null;
  contact: { firstName: string; lastName: string | null };
  owner: { name: string } | null;
};

const STATUS_TONE: Record<string, "neutral" | "primary" | "success" | "warning" | "danger"> = {
  PENDIENTE: "warning",
  PAGADA: "success",
  EN_PROCESO: "primary",
  COMPLETADA: "success",
  CANCELADA: "danger",
};

export default function SalesPage() {
  const [items, setItems] = useState<Sale[]>([]);
  const [status, setStatus] = useState("");

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    const res = await fetch(`/api/sales?${params}`);
    if (res.ok) setItems(await res.json());
  }, [status]);

  useEffect(() => {
    load();
  }, [load]);

  async function markPaid(id: string) {
    const res = await fetch(`/api/sales/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "PAGADA" }),
    });
    if (res.ok) {
      toast.success("Venta marcada como pagada");
      load();
    }
  }

  const totalSum = items.reduce((s, i) => s + i.total, 0);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Ventas</h1>
          <p className="text-sm text-muted">
            {items.length} ventas · {formatCurrency(totalSum)}
          </p>
        </div>
        <Link href="/sales/new">
          <Button>
            <Plus size={15} /> Registrar venta
          </Button>
        </Link>
      </div>

      <Card className="mb-4">
        <Select className="w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos los estados</option>
          {["PENDIENTE", "PAGADA", "EN_PROCESO", "COMPLETADA", "CANCELADA"].map((s) => (
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
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Pago</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {items.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0 hover:bg-black/[0.015]">
                  <td className="px-4 py-3 font-medium">
                    <span className="flex items-center gap-2">
                      <ShoppingCart size={14} /> {s.number}
                    </span>
                  </td>
                  <td className="px-4 py-3">{contactName(s.contact)}</td>
                  <td className="px-4 py-3 text-muted">{s.owner?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(s.saleDate)}</td>
                  <td className="px-4 py-3 text-muted">{s.paymentMethod ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[s.status]}>{s.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-medium">{formatCurrency(s.total)}</td>
                  <td className="px-4 py-3 text-right">
                    {s.status === "PENDIENTE" && (
                      <Button size="sm" variant="outline" onClick={() => markPaid(s.id)}>
                        Marcar pagada
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-sm text-muted">
                    Aún no hay ventas registradas.
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
