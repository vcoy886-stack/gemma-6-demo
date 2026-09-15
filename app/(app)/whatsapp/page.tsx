"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { MessageCircle, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldGroup } from "@/components/ui/Field";
import { Badge, ScoreBadge } from "@/components/ui/Badge";
import { formatDate, contactName } from "@/lib/constants";

type Config = {
  phoneNumberId: string;
  businessAccountId: string;
  webhookVerifyToken: string;
  envTokenConfigured: boolean;
  connected: boolean;
};

type Conversation = {
  id: string;
  startedAt: string;
  contact: { id: string; firstName: string; lastName: string | null; phone: string | null; score: number; scoreLevel: string };
  messages: { content: string; direction: string; createdAt: string }[];
};

export default function WhatsappPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [form, setForm] = useState({ phoneNumberId: "", businessAccountId: "", webhookVerifyToken: "" });
  const [saving, setSaving] = useState(false);

  const loadConfig = useCallback(async () => {
    const res = await fetch("/api/whatsapp/config");
    if (res.ok) {
      const data = await res.json();
      setConfig(data);
      setForm({
        phoneNumberId: data.phoneNumberId,
        businessAccountId: data.businessAccountId,
        webhookVerifyToken: data.webhookVerifyToken,
      });
    }
  }, []);

  const loadConversations = useCallback(async () => {
    const res = await fetch("/api/whatsapp/conversations");
    if (res.ok) setConversations(await res.json());
  }, []);

  useEffect(() => {
    loadConfig();
    loadConversations();
  }, [loadConfig, loadConversations]);

  async function saveConfig(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/whatsapp/config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        toast.error("No se pudo guardar la configuración");
        return;
      }
      toast.success("Configuración guardada");
      loadConfig();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-foreground">WhatsApp Business</h1>
        <p className="text-sm text-muted">Conversaciones y configuración de integración</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Conversaciones" subtitle="Historial registrado por contacto" />
            <div className="space-y-2">
              {conversations.map((c) => {
                const last = c.messages[0];
                return (
                  <Link
                    key={c.id}
                    href={`/crm/${c.contact.id}`}
                    className="flex items-center justify-between rounded-lg border border-border p-3 hover:bg-black/[0.02]"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{contactName(c.contact)}</p>
                        <ScoreBadge score={c.contact.score} level={c.contact.scoreLevel} />
                      </div>
                      {last && (
                        <p className="truncate text-xs text-muted">
                          {last.direction === "OUT" ? "Tú: " : ""}
                          {last.content}
                        </p>
                      )}
                    </div>
                    <p className="shrink-0 text-xs text-muted">{last ? formatDate(last.createdAt) : formatDate(c.startedAt)}</p>
                  </Link>
                );
              })}
              {conversations.length === 0 && (
                <p className="py-8 text-center text-sm text-muted">
                  Aún no hay conversaciones registradas. Regístralas desde la ficha de cada contacto en el CRM.
                </p>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Estado de conexión"
              action={
                config?.connected ? (
                  <Badge tone="success">
                    <CheckCircle2 size={12} className="mr-1 inline" /> Conectado
                  </Badge>
                ) : (
                  <Badge tone="warning">
                    <AlertCircle size={12} className="mr-1 inline" /> No conectado
                  </Badge>
                )
              }
            />
            <p className="mb-3 text-xs text-muted">
              Para conectar WhatsApp Business API necesitas una cuenta verificada en Meta Business y definir la
              variable de entorno <code className="rounded bg-black/5 px-1">WHATSAPP_ACCESS_TOKEN</code> en el
              servidor (nunca se guarda en la base de datos por seguridad).
            </p>
            <div className="mb-3 flex items-center gap-2 text-xs">
              {config?.envTokenConfigured ? (
                <Badge tone="success">Access token configurado en el servidor</Badge>
              ) : (
                <Badge tone="danger">Falta WHATSAPP_ACCESS_TOKEN en el servidor</Badge>
              )}
            </div>
            <form onSubmit={saveConfig}>
              <FieldGroup>
                <Label>Phone Number ID</Label>
                <Input
                  value={form.phoneNumberId}
                  onChange={(e) => setForm({ ...form, phoneNumberId: e.target.value })}
                  placeholder="De Meta Business Suite"
                />
              </FieldGroup>
              <FieldGroup>
                <Label>Business Account ID</Label>
                <Input
                  value={form.businessAccountId}
                  onChange={(e) => setForm({ ...form, businessAccountId: e.target.value })}
                />
              </FieldGroup>
              <FieldGroup>
                <Label>Webhook Verify Token</Label>
                <Input
                  value={form.webhookVerifyToken}
                  onChange={(e) => setForm({ ...form, webhookVerifyToken: e.target.value })}
                  placeholder="Token que tú defines para verificar el webhook"
                />
              </FieldGroup>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? "Guardando..." : "Guardar configuración"}
              </Button>
            </form>
          </Card>

          <Card>
            <CardHeader title="Mientras tanto" />
            <p className="flex items-start gap-2 text-xs text-muted">
              <MessageCircle size={14} className="mt-0.5 shrink-0" />
              Puedes registrar manualmente los mensajes de WhatsApp desde la ficha de cada contacto en el CRM. El
              lead scoring y las automatizaciones ya reaccionan a esas conversaciones registradas.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
