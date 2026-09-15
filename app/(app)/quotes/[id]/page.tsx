"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Download, ShoppingCart } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, contactName } from "@/lib/constants";

type Quote = {
  id: string;
  number: string;
  status: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  conditions: string | null;
  validUntil: string | null;
  createdAt: string;
  contact: { id: string; firstName: string; lastName: string | null; phone: string | null; email: string | null };
  owner: { name: string } | null;
  items: { id: string; quantity: number; price: number; discount: number; total: number; product: { name: string } }[];
};

const TRANSITIONS: Record<string, string[]> = {
  BORRADOR: ["ENVIADA"],
  ENVIADA: ["VISTA", "ACEPTADA", "RECHAZADA"],
  VISTA: ["ACEPTADA", "RECHAZADA"],
  ACEPTADA: [],
  RECHAZADA: [],
  VENCIDA: [],
};

export default function QuoteDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [quote, setQuote] = useState<Quote | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/quotes/${id}`);
    if (res.ok) setQuote(await res.json());
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(status: string) {
    const res = await fetch(`/api/quotes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast.success(`Cotización marcada como ${status}`);
      load();
    } else {
      toast.error("No se pudo actualizar el estado");
    }
  }

  if (!quote) return <div className="p-6 text-sm text-muted">Cargando...</div>;

  return (
    <div className="p-4 sm:p-6">
      <Link href="/quotes" className="mb-3 flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={14} /> Volver a cotizaciones
      </Link>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-semibold text-foreground">Cotización {quote.number}</h1>
            <Badge>{quote.status}</Badge>
          </div>
          <p className="text-sm text-muted">
            Cliente:{" "}
            <Link href={`/crm/${quote.contact.id}`} className="text-primary hover:underline">
              {contactName(quote.contact)}
            </Link>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`/api/quotes/${id}/pdf`} target="_blank" rel="noreferrer">
            <Button variant="outline">
              <Download size={14} /> Descargar PDF
            </Button>
          </a>
          {quote.status === "ACEPTADA" && (
            <Link href={`/sales/new?quoteId=${quote.id}`}>
              <Button>
                <ShoppingCart size={14} /> Convertir en venta
              </Button>
            </Link>
          )}
          {TRANSITIONS[quote.status]?.map((s) => (
            <Button key={s} variant="secondary" onClick={() => changeStatus(s)}>
              Marcar {s}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Productos" />
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted">
              <tr>
                <th className="pb-2">Producto</th>
                <th className="pb-2">Cant.</th>
                <th className="pb-2">Precio</th>
                <th className="pb-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((it) => (
                <tr key={it.id} className="border-t border-border">
                  <td className="py-2">{it.product.name}</td>
                  <td className="py-2">{it.quantity}</td>
                  <td className="py-2">{formatCurrency(it.price)}</td>
                  <td className="py-2 text-right">{formatCurrency(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {quote.conditions && (
            <div className="mt-4 border-t border-border pt-3 text-sm text-muted">
              <p className="mb-1 font-medium text-foreground">Condiciones</p>
              {quote.conditions}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Resumen" />
          <dl className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted">Subtotal</dt>
              <dd>{formatCurrency(quote.subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Descuento</dt>
              <dd>-{formatCurrency(quote.discount)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted">Impuestos</dt>
              <dd>{formatCurrency(quote.tax)}</dd>
            </div>
            <div className="flex justify-between border-t border-border pt-2 text-base font-semibold text-foreground">
              <dt>Total</dt>
              <dd>{formatCurrency(quote.total)}</dd>
            </div>
          </dl>
          <div className="mt-4 space-y-1 text-xs text-muted">
            <p>Vendedor: {quote.owner?.name ?? "—"}</p>
            <p>Creada: {formatDate(quote.createdAt)}</p>
            <p>Válida hasta: {formatDate(quote.validUntil)}</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
