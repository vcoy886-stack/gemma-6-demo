"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Plus, Check, AlertTriangle } from "lucide-react";
import { isPast, isToday, format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea, Label, FieldGroup } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { ContactPicker } from "@/components/app/ContactPicker";
import { contactName } from "@/lib/constants";

type Task = {
  id: string;
  title: string;
  description: string | null;
  dueDate: string;
  priority: "LOW" | "MEDIUM" | "HIGH";
  status: "PENDING" | "DONE" | "CANCELLED";
  contact: { id: string; firstName: string; lastName: string | null; score: number; scoreLevel: string } | null;
  assignedTo: { id: string; name: string } | null;
};

const PRIORITY_TONE = { LOW: "neutral", MEDIUM: "warning", HIGH: "danger" } as const;
const PRIORITY_LABEL = { LOW: "Baja", MEDIUM: "Media", HIGH: "Alta" };

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/tasks?status=PENDING");
    if (res.ok) setTasks(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function complete(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DONE" }),
    });
    if (!res.ok) {
      toast.error("No se pudo completar la tarea");
      load();
    } else {
      toast.success("Tarea completada");
    }
  }

  const overdue = tasks.filter((t) => isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)));
  const today = tasks.filter((t) => isToday(new Date(t.dueDate)));
  const upcoming = tasks.filter((t) => !isPast(new Date(t.dueDate)) && !isToday(new Date(t.dueDate)));

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Tareas y seguimientos</h1>
          <p className="text-sm text-muted">{tasks.length} tareas pendientes</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={15} /> Nueva tarea
        </Button>
      </div>

      <div className="space-y-6">
        <TaskGroup
          title="Vencidas"
          icon={<AlertTriangle size={15} className="text-danger" />}
          tasks={overdue}
          onComplete={complete}
          emptyLabel="No tienes tareas vencidas."
        />
        <TaskGroup title="Hoy" tasks={today} onComplete={complete} emptyLabel="No tienes tareas para hoy." />
        <TaskGroup title="Próximas" tasks={upcoming} onComplete={complete} emptyLabel="No hay tareas próximas." />
      </div>

      <NewTaskModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={load} />
    </div>
  );
}

function TaskGroup({
  title,
  icon,
  tasks,
  onComplete,
  emptyLabel,
}: {
  title: string;
  icon?: React.ReactNode;
  tasks: Task[];
  onComplete: (id: string) => void;
  emptyLabel: string;
}) {
  return (
    <Card>
      <CardHeader
        title={`${title} (${tasks.length})`}
        action={icon}
      />
      <div className="space-y-2">
        {tasks.map((t) => (
          <div key={t.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
            <button
              onClick={() => onComplete(t.id)}
              title="Marcar como completada"
              className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border text-muted hover:border-success hover:bg-success/10 hover:text-success"
            >
              <Check size={12} />
            </button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-foreground">{t.title}</p>
                <Badge tone={PRIORITY_TONE[t.priority]}>{PRIORITY_LABEL[t.priority]}</Badge>
              </div>
              {t.description && <p className="text-xs text-muted">{t.description}</p>}
              <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted">
                <span>{format(new Date(t.dueDate), "d 'de' MMMM", { locale: es })}</span>
                {t.contact && (
                  <Link href={`/crm/${t.contact.id}`} className="text-primary hover:underline">
                    {contactName(t.contact)}
                  </Link>
                )}
                {t.assignedTo && <span>Responsable: {t.assignedTo.name}</span>}
              </div>
            </div>
          </div>
        ))}
        {tasks.length === 0 && <p className="text-sm text-muted">{emptyLabel}</p>}
      </div>
    </Card>
  );
}

function NewTaskModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [contact, setContact] = useState<{ id: string; firstName: string; lastName: string | null; phone: string | null } | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !dueDate) {
      toast.error("Título y fecha son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contactId: contact?.id, title, description, dueDate, priority }),
      });
      if (!res.ok) {
        toast.error("No se pudo crear la tarea");
        return;
      }
      toast.success("Tarea creada");
      setTitle("");
      setDescription("");
      setDueDate("");
      setContact(null);
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nueva tarea">
      <form onSubmit={submit}>
        <FieldGroup>
          <Label>Contacto relacionado (opcional)</Label>
          <ContactPicker value={contact} onChange={setContact} />
        </FieldGroup>
        <FieldGroup>
          <Label required>Título</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Llamar a Carlos" />
        </FieldGroup>
        <FieldGroup>
          <Label>Descripción</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </FieldGroup>
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup>
            <Label required>Fecha</Label>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </FieldGroup>
          <FieldGroup>
            <Label>Prioridad</Label>
            <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="LOW">Baja</option>
              <option value="MEDIUM">Media</option>
              <option value="HIGH">Alta</option>
            </Select>
          </FieldGroup>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Crear tarea"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
