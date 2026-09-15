"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { ArrowLeft, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input, Select, Label, FieldGroup } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";

type User = { id: string; name: string; email: string; role: string; active: boolean };

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Administrador",
  GERENTE: "Gerente",
  VENDEDOR: "Vendedor",
  ASISTENTE: "Asistente",
};

const ROLE_DESCRIPTIONS: Record<string, string> = {
  ADMIN: "Acceso total al sistema",
  GERENTE: "Reportes, ventas y equipo",
  VENDEDOR: "Sus propios clientes, oportunidades, tareas y ventas",
  ASISTENTE: "Acceso limitado de apoyo",
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(u: User) {
    const res = await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    if (res.ok) {
      toast.success(u.active ? "Usuario desactivado" : "Usuario activado");
      load();
    } else {
      const data = await res.json();
      toast.error(data.error ?? "No se pudo actualizar");
    }
  }

  async function changeRole(u: User, role: string) {
    const res = await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      toast.success("Rol actualizado");
      load();
    } else {
      const data = await res.json();
      toast.error(data.error ?? "No se pudo actualizar el rol");
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <Link href="/settings" className="mb-3 flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={14} /> Volver a configuración
      </Link>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Usuarios y roles</h1>
          <p className="text-sm text-muted">{users.length} usuarios en tu equipo</p>
        </div>
        <Button onClick={() => setModalOpen(true)}>
          <Plus size={15} /> Nuevo usuario
        </Button>
      </div>

      <Card padded={false}>
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-black/[0.02] text-left text-xs uppercase text-muted">
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Correo</th>
              <th className="px-4 py-3">Rol</th>
              <th className="px-4 py-3">Estado</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 font-medium">{u.name}</td>
                <td className="px-4 py-3 text-muted">{u.email}</td>
                <td className="px-4 py-3">
                  <Select className="w-auto" value={u.role} onChange={(e) => changeRole(u, e.target.value)}>
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </Select>
                </td>
                <td className="px-4 py-3">
                  <Badge tone={u.active ? "success" : "neutral"}>{u.active ? "Activo" : "Inactivo"}</Badge>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button size="sm" variant="outline" onClick={() => toggleActive(u)}>
                    {u.active ? "Desactivar" : "Activar"}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="mt-4">
        <p className="mb-2 text-xs font-semibold uppercase text-muted">Permisos por rol</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Object.entries(ROLE_LABELS).map(([k, v]) => (
            <div key={k} className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">{v}</p>
              <p className="text-xs text-muted">{ROLE_DESCRIPTIONS[k]}</p>
            </div>
          ))}
        </div>
      </Card>

      <NewUserModal open={modalOpen} onClose={() => setModalOpen(false)} onSaved={load} />
    </div>
  );
}

function NewUserModal({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("VENDEDOR");
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role, active: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo crear el usuario");
        return;
      }
      toast.success("Usuario creado");
      setName("");
      setEmail("");
      setPassword("");
      onSaved();
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} title="Nuevo usuario">
      <form onSubmit={submit}>
        <FieldGroup>
          <Label required>Nombre</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label required>Correo</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label required>Contraseña temporal</Label>
          <Input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} />
        </FieldGroup>
        <FieldGroup>
          <Label>Rol</Label>
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            {Object.entries(ROLE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </Select>
        </FieldGroup>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Creando..." : "Crear usuario"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
