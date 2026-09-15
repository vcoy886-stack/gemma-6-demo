"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Label, FieldGroup } from "@/components/ui/Field";
import { CONTACT_STATUSES, CONTACT_STATUS_LABELS, LEAD_SOURCES } from "@/lib/constants";

type Owner = { id: string; name: string };

export type ContactFormValues = {
  id?: string;
  firstName: string;
  lastName: string;
  phone: string;
  whatsapp: string;
  email: string;
  city: string;
  companyName: string;
  source: string;
  status: string;
  tags: string;
  notes: string;
  ownerId: string;
};

const EMPTY: ContactFormValues = {
  firstName: "",
  lastName: "",
  phone: "",
  whatsapp: "",
  email: "",
  city: "",
  companyName: "",
  source: LEAD_SOURCES[0],
  status: "NUEVO",
  tags: "",
  notes: "",
  ownerId: "",
};

export function ContactFormModal({
  open,
  onClose,
  onSaved,
  initial,
  owners,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Partial<ContactFormValues>;
  owners: Owner[];
}) {
  const [form, setForm] = useState<ContactFormValues>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);

  function update<K extends keyof ContactFormValues>(key: K, value: ContactFormValues[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.firstName.trim()) {
      toast.error("El nombre es obligatorio");
      return;
    }
    setSaving(true);
    try {
      const url = form.id ? `/api/contacts/${form.id}` : "/api/contacts";
      const method = form.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo guardar el contacto");
        return;
      }
      toast.success(form.id ? "Contacto actualizado" : "Contacto creado");
      onSaved();
      onClose();
      setForm(EMPTY);
    } catch {
      toast.error("Error de conexión");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={form.id ? "Editar contacto" : "Nuevo contacto"}
      size="lg"
    >
      <form onSubmit={onSubmit}>
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2">
          <FieldGroup>
            <Label required>Nombre</Label>
            <Input value={form.firstName} onChange={(e) => update("firstName", e.target.value)} required />
          </FieldGroup>
          <FieldGroup>
            <Label>Apellido</Label>
            <Input value={form.lastName} onChange={(e) => update("lastName", e.target.value)} />
          </FieldGroup>
          <FieldGroup>
            <Label>Teléfono</Label>
            <Input value={form.phone} onChange={(e) => update("phone", e.target.value)} />
          </FieldGroup>
          <FieldGroup>
            <Label>WhatsApp</Label>
            <Input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} />
          </FieldGroup>
          <FieldGroup>
            <Label>Correo</Label>
            <Input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
          </FieldGroup>
          <FieldGroup>
            <Label>Ciudad</Label>
            <Input value={form.city} onChange={(e) => update("city", e.target.value)} />
          </FieldGroup>
          <FieldGroup>
            <Label>Empresa</Label>
            <Input value={form.companyName} onChange={(e) => update("companyName", e.target.value)} />
          </FieldGroup>
          <FieldGroup>
            <Label>Fuente</Label>
            <Select value={form.source} onChange={(e) => update("source", e.target.value)}>
              {LEAD_SOURCES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup>
            <Label>Estado</Label>
            <Select value={form.status} onChange={(e) => update("status", e.target.value)}>
              {CONTACT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {CONTACT_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup>
            <Label>Vendedor asignado</Label>
            <Select value={form.ownerId} onChange={(e) => update("ownerId", e.target.value)}>
              <option value="">Sin asignar</option>
              {owners.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup>
            <Label>Etiquetas</Label>
            <Input
              value={form.tags}
              onChange={(e) => update("tags", e.target.value)}
              placeholder="prioridad-alta, mayorista"
            />
          </FieldGroup>
        </div>
        <FieldGroup>
          <Label>Notas</Label>
          <Textarea value={form.notes} onChange={(e) => update("notes", e.target.value)} />
        </FieldGroup>
        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
