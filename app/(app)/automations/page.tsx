"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, Zap, Trash2, Play } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Label, FieldGroup } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { CONTACT_STATUSES, CONTACT_STATUS_LABELS, SCORE_REASON_OPTIONS } from "@/lib/constants";

type Action = { actionType: string; actionConfig: Record<string, unknown> };
type Automation = {
  id: string;
  name: string;
  triggerType: string;
  triggerConfig: string;
  active: boolean;
  actions: { actionType: string; actionConfig: string }[];
  _count: { logs: number };
};

const TRIGGER_LABELS: Record<string, string> = {
  LEAD_CREATED: "Lead nuevo",
  SCORE_ABOVE: "Puntuación supera un valor",
  NO_RESPONSE_DAYS: "Sin respuesta hace X días",
  SALE_WON: "Venta ganada",
  OPPORTUNITY_STAGE_CHANGED: "Oportunidad cambia de etapa",
  QUOTE_EXPIRING: "Cotización por vencer",
};

const ACTION_LABELS: Record<string, string> = {
  CREATE_TASK: "Crear tarea",
  MARK_PRIORITY: "Marcar prioridad alta",
  CHANGE_STATUS: "Cambiar estado del contacto",
  CREATE_NOTIFICATION: "Crear notificación",
  ADD_SCORE: "Ajustar puntuación",
};

export default function AutomationsPage() {
  const [items, setItems] = useState<Automation[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/automations");
    if (res.ok) setItems(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(a: Automation) {
    const res = await fetch(`/api/automations/${a.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !a.active }),
    });
    if (res.ok) load();
  }

  async function remove(id: string) {
    if (!confirm("¿Eliminar esta automatización?")) return;
    const res = await fetch(`/api/automations/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Automatización eliminada");
      load();
    }
  }

  async function runNow() {
    setRunning(true);
    try {
      const res = await fetch("/api/automations/run", { method: "POST" });
      const data = await res.json();
      if (res.ok) toast.success(`${data.executedCount} automatización(es) ejecutada(s)`);
      else toast.error(data.error ?? "No se pudo ejecutar");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Automatizaciones</h1>
          <p className="text-sm text-muted">Reglas SI/ENTONCES que se ejecutan automáticamente en el sistema</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={runNow} disabled={running}>
            <Play size={15} /> {running ? "Ejecutando..." : "Ejecutar reglas por tiempo ahora"}
          </Button>
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={15} /> Nueva automatización
          </Button>
        </div>
      </div>

      <Card className="mb-4 border-amber-200 bg-amber-50">
        <p className="text-xs text-amber-800">
          Las reglas basadas en eventos (lead nuevo, venta ganada, cambio de etapa) se ejecutan al instante.
          Las reglas basadas en tiempo (sin respuesta, cotización por vencer) requieren un programador externo
          en producción (ej. cron), o puedes ejecutarlas manualmente con el botón de arriba.
        </p>
      </Card>

      <div className="space-y-3">
        {items.map((a) => (
          <Card key={a.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Zap size={15} className="text-primary" />
                  <p className="text-sm font-semibold text-foreground">{a.name}</p>
                  <Badge tone={a.active ? "success" : "neutral"}>{a.active ? "Activa" : "Pausada"}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted">
                  SI {TRIGGER_LABELS[a.triggerType]} ENTONCES {a.actions.map((ac) => ACTION_LABELS[ac.actionType]).join(", ")}
                </p>
                <p className="mt-1 text-xs text-muted">{a._count.logs} ejecuciones registradas</p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleActive(a)}>
                  {a.active ? "Pausar" : "Activar"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(a.id)}>
                  <Trash2 size={14} className="text-danger" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
        {items.length === 0 && (
          <p className="py-8 text-center text-sm text-muted">Aún no has creado automatizaciones.</p>
        )}
      </div>

      <NewAutomationModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={load} />
    </div>
  );
}

function NewAutomationModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [triggerType, setTriggerType] = useState("LEAD_CREATED");
  const [threshold, setThreshold] = useState("70");
  const [days, setDays] = useState("3");
  const [actions, setActions] = useState<Action[]>([{ actionType: "CREATE_TASK", actionConfig: { title: "Contactar al lead", daysFromNow: 1, priority: "HIGH" } }]);
  const [saving, setSaving] = useState(false);

  function updateAction(i: number, patch: Partial<Action>) {
    setActions((prev) => prev.map((a, idx) => (idx === i ? { ...a, ...patch } : a)));
  }

  function addAction() {
    setActions((prev) => [...prev, { actionType: "CREATE_NOTIFICATION", actionConfig: { title: "", body: "" } }]);
  }

  function removeAction(i: number) {
    setActions((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Ponle un nombre a la automatización");
      return;
    }
    let triggerConfig: Record<string, unknown> = {};
    if (triggerType === "SCORE_ABOVE") triggerConfig = { threshold: Number(threshold) };
    if (triggerType === "NO_RESPONSE_DAYS") triggerConfig = { days: Number(days) };
    if (triggerType === "QUOTE_EXPIRING") triggerConfig = { daysBefore: Number(days) };

    setSaving(true);
    try {
      const res = await fetch("/api/automations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, triggerType, triggerConfig, active: true, actions }),
      });
      if (!res.ok) {
        toast.error("No se pudo crear la automatización");
        return;
      }
      toast.success("Automatización creada");
      setName("");
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva automatización" size="lg">
      <form onSubmit={submit}>
        <FieldGroup>
          <Label required>Nombre</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej. Alerta de lead caliente" />
        </FieldGroup>

        <FieldGroup>
          <Label>SI (disparador)</Label>
          <Select value={triggerType} onChange={(e) => setTriggerType(e.target.value)}>
            {Object.entries(TRIGGER_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </FieldGroup>

        {triggerType === "SCORE_ABOVE" && (
          <FieldGroup>
            <Label>Puntuación mínima</Label>
            <Input type="number" min="0" max="100" value={threshold} onChange={(e) => setThreshold(e.target.value)} />
          </FieldGroup>
        )}
        {triggerType === "NO_RESPONSE_DAYS" && (
          <FieldGroup>
            <Label>Días sin respuesta</Label>
            <Input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} />
          </FieldGroup>
        )}
        {triggerType === "QUOTE_EXPIRING" && (
          <FieldGroup>
            <Label>Días antes del vencimiento</Label>
            <Input type="number" min="1" value={days} onChange={(e) => setDays(e.target.value)} />
          </FieldGroup>
        )}

        <Label>ENTONCES (acciones)</Label>
        <div className="mt-1 space-y-2">
          {actions.map((action, i) => (
            <div key={i} className="rounded-lg border border-border p-3">
              <div className="mb-2 flex items-center justify-between">
                <Select
                  className="w-auto"
                  value={action.actionType}
                  onChange={(e) => updateAction(i, { actionType: e.target.value, actionConfig: {} })}
                >
                  {Object.entries(ACTION_LABELS).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v}
                    </option>
                  ))}
                </Select>
                <button type="button" onClick={() => removeAction(i)} className="text-muted hover:text-danger">
                  <Trash2 size={14} />
                </button>
              </div>

              {action.actionType === "CREATE_TASK" && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Título de la tarea"
                    value={(action.actionConfig.title as string) ?? ""}
                    onChange={(e) => updateAction(i, { actionConfig: { ...action.actionConfig, title: e.target.value } })}
                  />
                  <Input
                    type="number"
                    placeholder="Días desde ahora"
                    value={(action.actionConfig.daysFromNow as number) ?? 1}
                    onChange={(e) =>
                      updateAction(i, { actionConfig: { ...action.actionConfig, daysFromNow: Number(e.target.value) } })
                    }
                  />
                </div>
              )}
              {action.actionType === "CHANGE_STATUS" && (
                <Select
                  value={(action.actionConfig.status as string) ?? ""}
                  onChange={(e) => updateAction(i, { actionConfig: { status: e.target.value } })}
                >
                  <option value="">Selecciona estado</option>
                  {CONTACT_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {CONTACT_STATUS_LABELS[s]}
                    </option>
                  ))}
                </Select>
              )}
              {action.actionType === "ADD_SCORE" && (
                <Select
                  value={(action.actionConfig.reasonCode as string) ?? ""}
                  onChange={(e) => updateAction(i, { actionConfig: { reasonCode: e.target.value } })}
                >
                  {SCORE_REASON_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </Select>
              )}
              {action.actionType === "CREATE_NOTIFICATION" && (
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Título"
                    value={(action.actionConfig.title as string) ?? ""}
                    onChange={(e) => updateAction(i, { actionConfig: { ...action.actionConfig, title: e.target.value } })}
                  />
                  <Input
                    placeholder="Mensaje"
                    value={(action.actionConfig.body as string) ?? ""}
                    onChange={(e) => updateAction(i, { actionConfig: { ...action.actionConfig, body: e.target.value } })}
                  />
                </div>
              )}
              {action.actionType === "MARK_PRIORITY" && (
                <Input
                  placeholder="Etiqueta (ej. prioridad-alta)"
                  value={(action.actionConfig.tag as string) ?? "prioridad-alta"}
                  onChange={(e) => updateAction(i, { actionConfig: { tag: e.target.value } })}
                />
              )}
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addAction}>
          <Plus size={14} /> Agregar acción
        </Button>

        <div className="mt-4 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Crear automatización"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
