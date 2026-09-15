"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Select, Input } from "@/components/ui/Field";
import { formatCurrency } from "@/lib/constants";

export type LineItem = {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  discount: number;
};

type Product = { id: string; name: string; price: number; stock: number };

export function LineItemsEditor({
  items,
  onChange,
  currency = "USD",
}: {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  currency?: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.items ?? []))
      .catch(() => {});
  }, []);

  function addItem() {
    const first = products[0];
    if (!first) return;
    onChange([...items, { productId: first.id, productName: first.name, quantity: 1, price: first.price, discount: 0 }]);
  }

  function updateItem(index: number, patch: Partial<LineItem>) {
    onChange(items.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  function onProductChange(index: number, productId: string) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    updateItem(index, { productId, productName: product.name, price: product.price });
  }

  return (
    <div>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="grid grid-cols-12 items-center gap-2 rounded-lg border border-border p-2">
            <div className="col-span-5">
              <Select value={item.productId} onChange={(e) => onProductChange(i, e.target.value)}>
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={item.quantity}
                onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })}
                placeholder="Cant."
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.price}
                onChange={(e) => updateItem(i, { price: Number(e.target.value) })}
                placeholder="Precio"
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                min="0"
                step="0.01"
                value={item.discount}
                onChange={(e) => updateItem(i, { discount: Number(e.target.value) })}
                placeholder="Desc."
              />
            </div>
            <div className="col-span-1 flex justify-end">
              <button type="button" onClick={() => removeItem(i)} className="text-muted hover:text-danger">
                <Trash2 size={15} />
              </button>
            </div>
            <div className="col-span-12 text-right text-xs text-muted">
              Subtotal línea: {formatCurrency(item.quantity * item.price - item.discount, currency)}
            </div>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={addItem} disabled={products.length === 0}>
        <Plus size={14} /> Agregar producto
      </Button>
      {products.length === 0 && (
        <p className="mt-1 text-xs text-muted">Crea productos primero para poder cotizar/vender.</p>
      )}
    </div>
  );
}
