"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Label, FieldGroup } from "@/components/ui/Field";
import { ContactPicker } from "@/components/app/ContactPicker";

type Stage = { id: string; name: string; probability: number };
type Product = { id: string; name: string; price: number };

export function OpportunityModal({
  open,
  onClose,
  onSaved,
  stages,
  defaultStageId,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  stages: Stage[];
  defaultStageId?: string;
}) {
  const [contact, setContact] = useState<{ id: string; firstName: string; lastName: string | null; phone: string | null } | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [title, setTitle] = useState("");
  const [productId, setProductId] = useState("");
  const [value, setValue] = useState("");
  const [stageId, setStageId] = useState(defaultStageId ?? stages[0]?.id ?? "");
  const [expectedCloseDate, setExpectedCloseDate] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      fetch("/api/products")
        .then((r) => r.json())
        .then((d) => setProducts(d.items ?? d))
        .catch(() => {});
      setStageId(defaultStageId ?? stages[0]?.id ?? "");
    }
  }, [open, defaultStageId, stages]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!contact) {
      toast.error("Selecciona un contacto");
      return;
    }
    if (!title.trim()) {
      toast.error("El título es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/opportunities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contact.id,
          productId: productId || null,
          title,
          value: Number(value) || 0,
          stageId,
          expectedCloseDate: expectedCloseDate || null,
          nextAction,
        }),
      });
      if (!res.ok) {
        toast.error("No se pudo crear la oportunidad");
        return;
      }
      toast.success("Oportunidad creada");
      onSaved();
      onClose();
      setContact(null);
      setTitle("");
      setValue("");
      setNextAction("");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva oportunidad">
      <form onSubmit={submit}>
        <FieldGroup>
          <Label required>Cliente / Lead</Label>
          <ContactPicker value={contact} onChange={setContact} />
        </FieldGroup>
        <FieldGroup>
          <Label required>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Venta de equipos - Carlos" />
        </FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup>
            <Label>Producto/Servicio</Label>
            <Select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                const p = products.find((p) => p.id === e.target.value);
                if (p && !value) setValue(String(p.price));
              }}
            >
              <option value="">Sin producto específico</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup>
            <Label>Valor estimado</Label>
            <Input type="number" min="0" step="0.01" value={value} onChange={(e) => setValue(e.target.value)} />
          </FieldGroup>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup>
            <Label>Etapa</Label>
            <Select value={stageId} onChange={(e) => setStageId(e.target.value)}>
              {stages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup>
            <Label>Fecha estimada de cierre</Label>
            <Input type="date" value={expectedCloseDate} onChange={(e) => setExpectedCloseDate(e.target.value)} />
          </FieldGroup>
        </div>
        <FieldGroup>
          <Label>Próxima acción</Label>
          <Textarea value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="Ej. Llamar el jueves para confirmar presupuesto" />
        </FieldGroup>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Crear oportunidad"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
