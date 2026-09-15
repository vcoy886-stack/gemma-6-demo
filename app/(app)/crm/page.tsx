"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Search, Upload, Phone, Mail } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { StatusBadge, ScoreBadge } from "@/components/ui/Badge";
import { ContactFormModal } from "@/components/app/ContactFormModal";
import { CONTACT_STATUSES, CONTACT_STATUS_LABELS, contactName, formatDate } from "@/lib/constants";

type Contact = {
  id: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  score: number;
  scoreLevel: string;
  source: string | null;
  owner: { id: string; name: string } | null;
  nextFollowUpAt: string | null;
  updatedAt: string;
};

export default function CrmPage() {
  const [items, setItems] = useState<Contact[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [owners, setOwners] = useState<{ id: string; name: string }[]>([]);
  const [ownerId, setOwnerId] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status) params.set("status", status);
    if (ownerId) params.set("ownerId", ownerId);
    try {
      const res = await fetch(`/api/contacts?${params}`);
      const data = await res.json();
      if (res.ok) {
        setItems(data.items);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }, [search, status, ownerId]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then(setOwners)
      .catch(() => {});
  }, []);

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">CRM · Clientes y leads</h1>
          <p className="text-sm text-muted">{total} contactos</p>
        </div>
        <div className="flex gap-2">
          <Link href="/crm/import">
            <Button variant="outline" size="md">
              <Upload size={15} />
              Importar CSV
            </Button>
          </Link>
          <Button onClick={() => setModalOpen(true)}>
            <Plus size={15} />
            Nuevo contacto
          </Button>
        </div>
      </div>

      <Card className="mb-4" padded>
        <div className="flex flex-wrap gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <Input
              className="pl-8"
              placeholder="Buscar por nombre, teléfono, correo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Select className="w-auto" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos los estados</option>
            {CONTACT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {CONTACT_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
          <Select className="w-auto" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="">Todos los vendedores</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-black/[0.02] text-left text-xs uppercase tracking-wide text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Contacto</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Puntuación</th>
                <th className="px-4 py-3 font-medium">Vendedor</th>
                <th className="px-4 py-3 font-medium">Próximo seguimiento</th>
                <th className="px-4 py-3 font-medium">Actualizado</th>
              </tr>
            </thead>
            <tbody>
              {items.map((c) => (
                <tr key={c.id} className="border-b border-border last:border-0 hover:bg-black/[0.015]">
                  <td className="px-4 py-3">
                    <Link href={`/crm/${c.id}`} className="font-medium text-foreground hover:text-primary">
                      {contactName(c)}
                    </Link>
                    <div className="mt-0.5 flex items-center gap-3 text-xs text-muted">
                      {c.phone && (
                        <span className="flex items-center gap-1">
                          <Phone size={11} /> {c.phone}
                        </span>
                      )}
                      {c.email && (
                        <span className="flex items-center gap-1">
                          <Mail size={11} /> {c.email}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="px-4 py-3">
                    <ScoreBadge score={c.score} level={c.scoreLevel} />
                  </td>
                  <td className="px-4 py-3 text-muted">{c.owner?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(c.nextFollowUpAt)}</td>
                  <td className="px-4 py-3 text-muted">{formatDate(c.updatedAt)}</td>
                </tr>
              ))}
              {!loading && items.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-muted">
                    No hay contactos que coincidan con los filtros.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <ContactFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={load}
        owners={owners}
      />
    </div>
  );
}
