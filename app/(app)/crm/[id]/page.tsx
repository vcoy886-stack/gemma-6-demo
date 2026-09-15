"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  MapPin,
  Building2,
  Plus,
  Sparkles,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { StatusBadge, ScoreBadge, Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Textarea, Label, FieldGroup } from "@/components/ui/Field";
import { ContactFormModal } from "@/components/app/ContactFormModal";
import {
  ACTIVITY_TYPE_LABELS,
  SCORE_REASON_OPTIONS,
  contactName,
  formatCurrency,
  formatDate,
} from "@/lib/constants";

type ContactDetail = {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  city: string | null;
  companyName: string | null;
  source: string | null;
  status: string;
  tags: string | null;
  notes: string | null;
  score: number;
  scoreLevel: string;
  owner: { id: string; name: string } | null;
  nextFollowUpAt: string | null;
  createdAt: string;
  scoreEvents: { id: string; points: number; reason: string; createdAt: string }[];
  activities: { id: string; type: string; description: string; createdAt: string; user: { name: string } | null }[];
  opportunities: { id: string; title: string; value: number; stage: { name: string }; status: string }[];
  quotes: { id: string; number: string; total: number; status: string; createdAt: string }[];
  sales: { id: string; number: string; total: number; status: string; saleDate: string }[];
  conversations: {
    id: string;
    channel: string;
    messages: { id: string; direction: string; content: string; sender: string | null; createdAt: string }[];
  }[];
};

const TABS = ["Resumen", "Conversaciones", "Actividades", "Oportunidades", "Compras"] as const;

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [contact, setContact] = useState<ContactDetail | null>(null);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Resumen");
  const [editOpen, setEditOpen] = useState(false);
  const [activityOpen, setActivityOpen] = useState(false);
  const [messageOpen, setMessageOpen] = useState(false);
  const [owners, setOwners] = useState<{ id: string; name: string }[]>([]);
  const [notFound, setNotFound] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/contacts/${id}`);
    if (res.status === 404 || res.status === 403) {
      setNotFound(true);
      return;
    }
    if (res.ok) setContact(await res.json());
  }, [id]);

  useEffect(() => {
    load();
    fetch("/api/users")
      .then((r) => r.json())
      .then(setOwners)
      .catch(() => {});
  }, [load]);

  if (notFound) {
    return (
      <div className="p-6">
        <p className="text-sm text-muted">
          No se encontró este contacto o no tienes acceso a él.
        </p>
        <Link href="/crm" className="mt-2 inline-block text-sm text-primary hover:underline">
          Volver al CRM
        </Link>
      </div>
    );
  }

  if (!contact) return <div className="p-6 text-sm text-muted">Cargando...</div>;

  return (
    <div className="p-4 sm:p-6">
      <Link href="/crm" className="mb-3 flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={14} /> Volver al CRM
      </Link>

      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-foreground">{contactName(contact)}</h1>
            <StatusBadge status={contact.status} />
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted">
            {contact.phone && (
              <span className="flex items-center gap-1">
                <Phone size={13} /> {contact.phone}
              </span>
            )}
            {contact.email && (
              <span className="flex items-center gap-1">
                <Mail size={13} /> {contact.email}
              </span>
            )}
            {contact.city && (
              <span className="flex items-center gap-1">
                <MapPin size={13} /> {contact.city}
              </span>
            )}
            {contact.companyName && (
              <span className="flex items-center gap-1">
                <Building2 size={13} /> {contact.companyName}
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <ScoreBadge score={contact.score} level={contact.scoreLevel} />
          <Button variant="outline" onClick={() => setActivityOpen(true)}>
            <Plus size={14} /> Actividad
          </Button>
          <Button variant="outline" onClick={() => setMessageOpen(true)}>
            <Plus size={14} /> Mensaje
          </Button>
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil size={14} /> Editar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex gap-1 border-b border-border">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-3 py-2 text-sm font-medium ${
                  tab === t ? "border-b-2 border-primary text-primary" : "text-muted hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "Resumen" && (
            <Card>
              <CardHeader title="Notas" />
              <p className="whitespace-pre-wrap text-sm text-foreground">
                {contact.notes || "Sin notas registradas."}
              </p>
              {contact.tags && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {contact.tags.split(",").map((t) => (
                    <Badge key={t} tone="primary">
                      {t.trim()}
                    </Badge>
                  ))}
                </div>
              )}
            </Card>
          )}

          {tab === "Conversaciones" && (
            <Card>
              <CardHeader title="Conversaciones" subtitle="Historial de mensajes con este contacto" />
              {contact.conversations.length === 0 && (
                <p className="text-sm text-muted">Sin conversaciones registradas aún.</p>
              )}
              <div className="space-y-4">
                {contact.conversations.map((conv) => (
                  <div key={conv.id} className="rounded-lg border border-border p-3">
                    <p className="mb-2 text-xs font-medium uppercase text-muted">{conv.channel}</p>
                    <div className="space-y-2">
                      {conv.messages.map((m) => (
                        <div
                          key={m.id}
                          className={`flex ${m.direction === "OUT" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                              m.direction === "OUT"
                                ? "bg-primary text-white"
                                : "border border-border bg-white"
                            }`}
                          >
                            <p>{m.content}</p>
                            <p className="mt-1 text-[10px] opacity-70">
                              {m.sender} · {formatDate(m.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {tab === "Actividades" && (
            <Card>
              <CardHeader title="Historial de actividades" />
              <div className="space-y-3">
                {contact.activities.map((a) => (
                  <div key={a.id} className="flex gap-3 border-b border-border pb-3 last:border-0">
                    <Badge tone="neutral" className="mt-0.5 shrink-0">
                      {ACTIVITY_TYPE_LABELS[a.type] ?? a.type}
                    </Badge>
                    <div>
                      <p className="text-sm text-foreground">{a.description}</p>
                      <p className="text-xs text-muted">
                        {a.user?.name ?? "Sistema"} · {formatDate(a.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                {contact.activities.length === 0 && (
                  <p className="text-sm text-muted">Sin actividades registradas.</p>
                )}
              </div>
            </Card>
          )}

          {tab === "Oportunidades" && (
            <Card>
              <CardHeader title="Oportunidades" />
              <div className="space-y-2">
                {contact.opportunities.map((o) => (
                  <div key={o.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <div>
                      <p className="text-sm font-medium">{o.title}</p>
                      <p className="text-xs text-muted">{o.stage.name}</p>
                    </div>
                    <p className="text-sm font-semibold">{formatCurrency(o.value)}</p>
                  </div>
                ))}
                {contact.opportunities.length === 0 && (
                  <p className="text-sm text-muted">Sin oportunidades registradas.</p>
                )}
              </div>
            </Card>
          )}

          {tab === "Compras" && (
            <div className="space-y-4">
              <Card>
                <CardHeader title="Cotizaciones" />
                <div className="space-y-2">
                  {contact.quotes.map((q) => (
                    <Link
                      key={q.id}
                      href={`/quotes/${q.id}`}
                      className="flex items-center justify-between rounded-lg border border-border px-3 py-2 hover:bg-black/[0.02]"
                    >
                      <div>
                        <p className="text-sm font-medium">#{q.number}</p>
                        <p className="text-xs text-muted">{formatDate(q.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{q.status}</Badge>
                        <p className="text-sm font-semibold">{formatCurrency(q.total)}</p>
                      </div>
                    </Link>
                  ))}
                  {contact.quotes.length === 0 && <p className="text-sm text-muted">Sin cotizaciones.</p>}
                </div>
              </Card>
              <Card>
                <CardHeader title="Ventas" />
                <div className="space-y-2">
                  {contact.sales.map((s) => (
                    <div key={s.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                      <div>
                        <p className="text-sm font-medium">#{s.number}</p>
                        <p className="text-xs text-muted">{formatDate(s.saleDate)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge>{s.status}</Badge>
                        <p className="text-sm font-semibold">{formatCurrency(s.total)}</p>
                      </div>
                    </div>
                  ))}
                  {contact.sales.length === 0 && <p className="text-sm text-muted">Sin ventas registradas.</p>}
                </div>
              </Card>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Explicación de puntuación"
              subtitle="Por qué este lead tiene su puntuación actual"
              action={<Sparkles size={15} className="text-primary" />}
            />
            <div className="space-y-2">
              {contact.scoreEvents.map((e) => (
                <div key={e.id} className="flex items-center justify-between text-sm">
                  <span className="text-foreground">{e.reason}</span>
                  <span className={e.points >= 0 ? "text-success" : "text-danger"}>
                    {e.points >= 0 ? `+${e.points}` : e.points}
                  </span>
                </div>
              ))}
              {contact.scoreEvents.length === 0 && (
                <p className="text-sm text-muted">Aún no hay eventos de puntuación.</p>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader title="Detalles" />
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Fuente</dt>
                <dd>{contact.source ?? "—"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Vendedor</dt>
                <dd>{contact.owner?.name ?? "Sin asignar"}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Próximo seguimiento</dt>
                <dd>{formatDate(contact.nextFollowUpAt)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Creado</dt>
                <dd>{formatDate(contact.createdAt)}</dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>

      <ContactFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSaved={load}
        owners={owners}
        initial={{
          id: contact.id,
          firstName: contact.firstName,
          lastName: contact.lastName ?? "",
          phone: contact.phone ?? "",
          whatsapp: contact.whatsapp ?? "",
          email: contact.email ?? "",
          city: contact.city ?? "",
          companyName: contact.companyName ?? "",
          source: contact.source ?? "",
          status: contact.status,
          tags: contact.tags ?? "",
          notes: contact.notes ?? "",
          ownerId: contact.owner?.id ?? "",
        }}
      />

      <ActivityModal open={activityOpen} onClose={() => setActivityOpen(false)} contactId={id} onSaved={load} />
      <MessageModal open={messageOpen} onClose={() => setMessageOpen(false)} contactId={id} onSaved={load} />
    </div>
  );
}

function ActivityModal({
  open,
  onClose,
  contactId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  contactId: string;
  onSaved: () => void;
}) {
  const [type, setType] = useState("CALL");
  const [description, setDescription] = useState("");
  const [scoreReason, setScoreReason] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Describe lo que ocurrió");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/activities`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, description, scoreReason: scoreReason || null }),
      });
      if (!res.ok) {
        toast.error("No se pudo registrar la actividad");
        return;
      }
      toast.success("Actividad registrada");
      setDescription("");
      setScoreReason("");
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar actividad">
      <form onSubmit={submit}>
        <FieldGroup>
          <Label>Tipo</Label>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="CALL">Llamada</option>
            <option value="EMAIL">Correo</option>
            <option value="WHATSAPP">WhatsApp</option>
            <option value="MEETING">Reunión</option>
            <option value="NOTE">Nota</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label required>Descripción</Label>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label>¿Esto afecta la puntuación del lead?</Label>
          <Select value={scoreReason} onChange={(e) => setScoreReason(e.target.value)}>
            {SCORE_REASON_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Registrar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function MessageModal({
  open,
  onClose,
  contactId,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  contactId: string;
  onSaved: () => void;
}) {
  const [direction, setDirection] = useState("OUT");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/contacts/${contactId}/conversations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "WHATSAPP", direction, content }),
      });
      if (!res.ok) {
        toast.error("No se pudo registrar el mensaje");
        return;
      }
      toast.success("Mensaje registrado");
      setContent("");
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Registrar mensaje de conversación">
      <form onSubmit={submit}>
        <FieldGroup>
          <Label>Dirección</Label>
          <Select value={direction} onChange={(e) => setDirection(e.target.value)}>
            <option value="OUT">Enviado por mí</option>
            <option value="IN">Recibido del cliente</option>
          </Select>
        </FieldGroup>
        <FieldGroup>
          <Label required>Mensaje</Label>
          <Textarea value={content} onChange={(e) => setContent(e.target.value)} />
        </FieldGroup>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Guardando..." : "Registrar"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
