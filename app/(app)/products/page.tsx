"use client";

import { useEffect, useState, useCallback } from "react";
import toast from "react-hot-toast";
import { Plus, Search, Pencil, Package } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Label, FieldGroup } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { formatCurrency } from "@/lib/constants";

type Category = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  price: number;
  cost: number;
  stock: number;
  status: string;
  category: Category | null;
};

const EMPTY_FORM = {
  id: "",
  name: "",
  code: "",
  categoryId: "",
  description: "",
  price: "",
  cost: "",
  stock: "",
  status: "ACTIVO",
};

export default function ProductsPage() {
  const [items, setItems] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCat, setNewCat] = useState("");
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/products?${params}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
    }
  }, [search]);

  const loadCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    if (res.ok) setCategories(await res.json());
  }, []);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  function openNew() {
    setForm(EMPTY_FORM);
    setModalOpen(true);
  }

  function openEdit(p: Product) {
    setForm({
      id: p.id,
      name: p.name,
      code: p.code,
      categoryId: p.category?.id ?? "",
      description: p.description ?? "",
      price: String(p.price),
      cost: String(p.cost),
      stock: String(p.stock),
      status: p.status,
    });
    setModalOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.code) {
      toast.error("Nombre y código son obligatorios");
      return;
    }
    setSaving(true);
    try {
      const url = form.id ? `/api/products/${form.id}` : "/api/products";
      const method = form.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          categoryId: form.categoryId || null,
          price: Number(form.price) || 0,
          cost: Number(form.cost) || 0,
          stock: Number(form.stock) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo guardar el producto");
        return;
      }
      toast.success("Producto guardado");
      setModalOpen(false);
      load();
    } finally {
      setSaving(false);
    }
  }

  async function submitCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newCat.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCat }),
    });
    if (res.ok) {
      toast.success("Categoría creada");
      setNewCat("");
      setCatModalOpen(false);
      loadCategories();
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-foreground">Productos y servicios</h1>
          <p className="text-sm text-muted">{items.length} productos</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setCatModalOpen(true)}>
            Categorías
          </Button>
          <Button onClick={openNew}>
            <Plus size={15} /> Nuevo producto
          </Button>
        </div>
      </div>

      <Card className="mb-4">
        <div className="relative max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input className="pl-8" placeholder="Buscar por nombre o código..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((p) => {
          const margin = p.price > 0 ? (((p.price - p.cost) / p.price) * 100).toFixed(0) : "0";
          return (
            <Card key={p.id} className="flex flex-col">
              <div className="mb-2 flex items-start justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-soft text-primary">
                  <Package size={18} />
                </div>
                <button onClick={() => openEdit(p)} className="text-muted hover:text-primary">
                  <Pencil size={15} />
                </button>
              </div>
              <p className="text-sm font-semibold text-foreground">{p.name}</p>
              <p className="text-xs text-muted">{p.code}</p>
              {p.category && (
                <Badge tone="neutral" className="mt-2 w-fit">
                  {p.category.name}
                </Badge>
              )}
              <div className="mt-3 flex items-center justify-between">
                <p className="text-lg font-semibold text-foreground">{formatCurrency(p.price)}</p>
                <Badge tone={p.status === "ACTIVO" ? "success" : p.status === "AGOTADO" ? "danger" : "neutral"}>
                  {p.status}
                </Badge>
              </div>
              <div className="mt-2 flex justify-between text-xs text-muted">
                <span>Margen: {margin}%</span>
                <span>Stock: {p.stock}</span>
              </div>
            </Card>
          );
        })}
        {items.length === 0 && (
          <p className="col-span-full py-10 text-center text-sm text-muted">
            No hay productos aún. Crea el primero para empezar a cotizar y vender.
          </p>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={form.id ? "Editar producto" : "Nuevo producto"}>
        <form onSubmit={submit}>
          <FieldGroup>
            <Label required>Nombre</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </FieldGroup>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup>
              <Label required>Código</Label>
              <Input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
            </FieldGroup>
            <FieldGroup>
              <Label>Categoría</Label>
              <Select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}>
                <option value="">Sin categoría</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </FieldGroup>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <FieldGroup>
              <Label required>Precio</Label>
              <Input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            </FieldGroup>
            <FieldGroup>
              <Label>Costo</Label>
              <Input type="number" min="0" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
            </FieldGroup>
            <FieldGroup>
              <Label>Inventario</Label>
              <Input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
            </FieldGroup>
          </div>
          <FieldGroup>
            <Label>Estado</Label>
            <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              <option value="ACTIVO">Activo</option>
              <option value="INACTIVO">Inactivo</option>
              <option value="AGOTADO">Agotado</option>
            </Select>
          </FieldGroup>
          <FieldGroup>
            <Label>Descripción</Label>
            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </FieldGroup>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={catModalOpen} onClose={() => setCatModalOpen(false)} title="Categorías" size="sm">
        <form onSubmit={submitCategory} className="mb-4 flex gap-2">
          <Input placeholder="Nueva categoría" value={newCat} onChange={(e) => setNewCat(e.target.value)} />
          <Button type="submit">Agregar</Button>
        </form>
        <div className="space-y-1">
          {categories.map((c) => (
            <div key={c.id} className="rounded-md border border-border px-3 py-2 text-sm">
              {c.name}
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
