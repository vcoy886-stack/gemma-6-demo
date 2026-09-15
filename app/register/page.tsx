"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { AuthShell } from "@/components/app/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input, Label, FieldGroup } from "@/components/ui/Field";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    companyName: "",
    name: "",
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo crear la cuenta");
        return;
      }
      toast.success("¡Cuenta creada! Configuremos tu empresa.");
      router.push("/onboarding");
      router.refresh();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Crea tu empresa"
      subtitle="Empieza gratis con tu propio sistema de ventas."
    >
      <form onSubmit={onSubmit}>
        <FieldGroup>
          <Label htmlFor="companyName">Nombre de la empresa</Label>
          <Input
            id="companyName"
            required
            value={form.companyName}
            onChange={(e) => update("companyName", e.target.value)}
            placeholder="Mi Empresa S.A."
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="name">Tu nombre</Label>
          <Input
            id="name"
            required
            value={form.name}
            onChange={(e) => update("name", e.target.value)}
            placeholder="Ana Pérez"
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="email">Correo electrónico</Label>
          <Input
            id="email"
            type="email"
            required
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="tucorreo@empresa.com"
          />
        </FieldGroup>
        <FieldGroup>
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            placeholder="Mínimo 8 caracteres"
          />
        </FieldGroup>
        {error && <p className="mb-4 text-sm text-danger">{error}</p>}
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
    </AuthShell>
  );
}
