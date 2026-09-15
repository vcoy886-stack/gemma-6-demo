"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Users } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Select, Label, FieldGroup } from "@/components/ui/Field";

type Company = {
  name: string;
  address: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  currency: string;
  taxRate: number;
  businessHours: string | null;
  policies: string | null;
};

const EMPTY: Company = {
  name: "",
  address: "",
  phone: "",
  whatsapp: "",
  email: "",
  currency: "USD",
  taxRate: 0,
  businessHours: "",
  policies: "",
};

export default function SettingsPage() {
  const [form, setForm] = useState<Company>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/company")
      .then((r) => r.json())
      .then((d) => setForm({ ...EMPTY, ...d }))
      .finally(() => setLoading(false));
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/settings/company", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo guardar");
        return;
      }
      toast.success("Configuración guardada");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6 text-sm text-muted">Cargando...</div>;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Configuración</h1>
          <p className="text-sm text-muted">Datos de tu empresa</p>
        </div>
        <Link href="/settings/users">
          <Button variant="outline">
            <Users size={15} /> Usuarios y roles
          </Button>
        </Link>
      </div>

      <Card className="max-w-2xl">
        <CardHeader title="Datos de la empresa" subtitle="Aparecen en tus cotizaciones y en el sistema" />
        <form onSubmit={submit}>
          <FieldGroup>
            <Label required>Nombre</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup>
              <Label>Teléfono</Label>
              <Input value={form.phone ?? ""} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </FieldGroup>
            <FieldGroup>
              <Label>WhatsApp</Label>
              <Input value={form.whatsapp ?? ""} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} />
            </FieldGroup>
          </div>
          <FieldGroup>
            <Label>Correo</Label>
            <Input value={form.email ?? ""} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </FieldGroup>
          <FieldGroup>
            <Label>Dirección</Label>
            <Input value={form.address ?? ""} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup>
              <Label>Moneda</Label>
              <Select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option value="USD">USD - Dólar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="MXN">MXN - Peso mexicano</option>
                <option value="COP">COP - Peso colombiano</option>
                <option value="ARS">ARS - Peso argentino</option>
                <option value="CLP">CLP - Peso chileno</option>
                <option value="PEN">PEN - Sol peruano</option>
              </Select>
            </FieldGroup>
            <FieldGroup>
              <Label>Impuesto por defecto (%)</Label>
              <Input
                type="number"
                min="0"
                value={form.taxRate}
                onChange={(e) => setForm({ ...form, taxRate: Number(e.target.value) })}
              />
            </FieldGroup>
          </div>
          <FieldGroup>
            <Label>Horario de atención</Label>
            <Input
              value={form.businessHours ?? ""}
              onChange={(e) => setForm({ ...form, businessHours: e.target.value })}
              placeholder="Lunes a viernes 9:00 - 18:00"
            />
          </FieldGroup>
          <FieldGroup>
            <Label>Políticas comerciales</Label>
            <Textarea value={form.policies ?? ""} onChange={(e) => setForm({ ...form, policies: e.target.value })} />
          </FieldGroup>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar cambios"}
          </Button>
        </form>
      </Card>

      <DemoDataCard />
    </div>
  );
}

function DemoDataCard() {
  const [loading, setLoading] = useState(false);

  async function seed() {
    setLoading(true);
    try {
      const res = await fetch("/api/demo/seed", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo cargar la demostración");
        return;
      }
      toast.success(`Datos demo creados: ${data.contacts} contactos, ${data.products} productos, ${data.sales} ventas`);
    } finally {
      setLoading(false);
    }
  }

  async function reset() {
    if (!confirm("¿Eliminar todos los datos marcados como demostración? Esto no afecta tus datos reales.")) return;
    setLoading(true);
    try {
      const res = await fetch("/api/demo/reset", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo eliminar la demostración");
        return;
      }
      toast.success(`Datos demo eliminados (${data.deletedProducts} productos)`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="mt-4 max-w-2xl border-amber-200 bg-amber-50">
      <CardHeader
        title="Datos de demostración"
        subtitle='Crea ~50 contactos, 10 productos, 15 oportunidades, 10 ventas y tareas de ejemplo, todos marcados como "Demo" y eliminables en cualquier momento.'
      />
      <div className="flex gap-2">
        <Button variant="secondary" onClick={seed} disabled={loading}>
          Cargar datos demo
        </Button>
        <Button variant="outline" onClick={reset} disabled={loading}>
          Eliminar datos demo
        </Button>
      </div>
    </Card>
  );
}
