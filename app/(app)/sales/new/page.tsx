"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Label, FieldGroup } from "@/components/ui/Field";
import { ContactPicker } from "@/components/app/ContactPicker";
import { LineItemsEditor, type LineItem } from "@/components/app/LineItemsEditor";
import { formatCurrency } from "@/lib/constants";

function NewSaleForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const quoteId = searchParams.get("quoteId");

  const [contact, setContact] = useState<{ id: string; firstName: string; lastName: string | null; phone: string | null } | null>(null);
  const [items, setItems] = useState<LineItem[]>([]);
  const [discount, setDiscount] = useState("0");
  const [taxRate, setTaxRate] = useState("0");
  const [paymentMethod, setPaymentMethod] = useState("Efectivo");
  const [status, setStatus] = useState("PAGADA");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingQuote, setLoadingQuote] = useState(!!quoteId);

  useEffect(() => {
    if (!quoteId) return;
    fetch(`/api/quotes/${quoteId}`)
      .then((r) => r.json())
      .then((q) => {
        setContact(q.contact);
        setItems(
          q.items.map((it: { productId: string; product: { name: string }; quantity: number; price: number; discount: number }) => ({
            productId: it.productId,
            productName: it.product.name,
            quantity: it.quantity,
            price: it.price,
            discount: it.discount,
          }))
        );
        setDiscount(String(q.discount));
        setTaxRate(q.subtotal > 0 ? String(((q.tax / (q.subtotal - q.discount)) * 100).toFixed(2)) : "0");
      })
      .finally(() => setLoadingQuote(false));
  }, [quoteId]);

  const subtotal = items.reduce((s, i) => s + i.quantity * i.price - i.discount, 0);
  const afterDiscount = Math.max(0, subtotal - Number(discount || 0));
  const tax = afterDiscount * (Number(taxRate || 0) / 100);
  const total = afterDiscount + tax;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!contact) {
      toast.error("Selecciona un cliente");
      return;
    }
    if (items.length === 0) {
      toast.error("Agrega al menos un producto");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contact.id,
          quoteId,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.price, discount: i.discount })),
          discount: Number(discount) || 0,
          taxRate: Number(taxRate) || 0,
          paymentMethod,
          status,
          notes,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo registrar la venta");
        return;
      }
      toast.success("Venta registrada");
      router.push("/sales");
    } finally {
      setSaving(false);
    }
  }

  if (loadingQuote) return <div className="p-6 text-sm text-muted">Cargando cotización...</div>;

  return (
    <div className="p-4 sm:p-6">
      <Link href="/sales" className="mb-3 flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={14} /> Volver a ventas
      </Link>
      <h1 className="mb-5 text-lg font-semibold text-foreground">Registrar venta</h1>

      <form onSubmit={submit} className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Cliente" />
            <ContactPicker value={contact} onChange={setContact} />
          </Card>
          <Card>
            <CardHeader title="Productos" />
            <LineItemsEditor items={items} onChange={setItems} />
          </Card>
          <Card>
            <CardHeader title="Observaciones" />
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Pago" />
            <FieldGroup>
              <Label>Método de pago</Label>
              <Select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                <option>Efectivo</option>
                <option>Tarjeta</option>
                <option>Transferencia</option>
                <option>Otro</option>
              </Select>
            </FieldGroup>
            <FieldGroup>
              <Label>Estado</Label>
              <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="PAGADA">Pagada</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_PROCESO">En proceso</option>
              </Select>
            </FieldGroup>
            <FieldGroup>
              <Label>Descuento general</Label>
              <Input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </FieldGroup>
            <FieldGroup>
              <Label>Impuestos (%)</Label>
              <Input type="number" min="0" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
            </FieldGroup>
            <div className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-foreground">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
            <Button type="submit" className="mt-4 w-full" disabled={saving}>
              {saving ? "Guardando..." : "Registrar venta"}
            </Button>
          </Card>
        </div>
      </form>
    </div>
  );
}

export default function NewSalePage() {
  return (
    <Suspense>
      <NewSaleForm />
    </Suspense>
  );
}
