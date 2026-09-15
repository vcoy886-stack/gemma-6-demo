"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Label, FieldGroup } from "@/components/ui/Field";
import { ContactPicker } from "@/components/app/ContactPicker";
import { LineItemsEditor, type LineItem } from "@/components/app/LineItemsEditor";
import { formatCurrency } from "@/lib/constants";

export default function NewQuotePage() {
  const router = useRouter();
  const [contact, setContact] = useState<{ id: string; firstName: string; lastName: string | null; phone: string | null } | null>(null);
  const [items, setItems] = useState<LineItem[]>([]);
  const [discount, setDiscount] = useState("0");
  const [taxRate, setTaxRate] = useState("0");
  const [conditions, setConditions] = useState("Precios en USD. Cotización sujeta a disponibilidad de inventario.");
  const [validUntil, setValidUntil] = useState("");
  const [saving, setSaving] = useState(false);

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
      const res = await fetch("/api/quotes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contact.id,
          items: items.map((i) => ({ productId: i.productId, quantity: i.quantity, price: i.price, discount: i.discount })),
          discount: Number(discount) || 0,
          taxRate: Number(taxRate) || 0,
          conditions,
          validUntil: validUntil || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo crear la cotización");
        return;
      }
      toast.success("Cotización creada");
      router.push(`/quotes/${data.id}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <Link href="/quotes" className="mb-3 flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={14} /> Volver a cotizaciones
      </Link>
      <h1 className="mb-5 text-lg font-semibold text-foreground">Nueva cotización</h1>

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
            <CardHeader title="Condiciones" />
            <Textarea value={conditions} onChange={(e) => setConditions(e.target.value)} />
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Totales" />
            <FieldGroup>
              <Label>Descuento general</Label>
              <Input type="number" min="0" step="0.01" value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </FieldGroup>
            <FieldGroup>
              <Label>Impuestos (%)</Label>
              <Input type="number" min="0" step="0.01" value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
            </FieldGroup>
            <FieldGroup>
              <Label>Válida hasta</Label>
              <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />
            </FieldGroup>
            <div className="mt-3 space-y-1.5 border-t border-border pt-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Descuento</span>
                <span>-{formatCurrency(Number(discount) || 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted">Impuestos</span>
                <span>{formatCurrency(tax)}</span>
              </div>
              <div className="flex justify-between text-base font-semibold text-foreground">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
            <Button type="submit" className="mt-4 w-full" disabled={saving}>
              {saving ? "Guardando..." : "Crear cotización"}
            </Button>
          </Card>
        </div>
      </form>
    </div>
  );
}
