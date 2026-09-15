import { prisma } from "@/lib/prisma";

export async function nextQuoteNumber(companyId: string) {
  const count = await prisma.quote.count({ where: { companyId } });
  return `COT-${String(count + 1).padStart(4, "0")}`;
}

export async function nextSaleNumber(companyId: string) {
  const count = await prisma.sale.count({ where: { companyId } });
  return `VEN-${String(count + 1).padStart(4, "0")}`;
}

export function computeTotals(
  items: { quantity: number; price: number; discount: number }[],
  extraDiscount: number,
  taxRate: number
) {
  const subtotal = items.reduce((sum, i) => sum + i.quantity * i.price - i.discount, 0);
  const afterDiscount = Math.max(0, subtotal - extraDiscount);
  const tax = afterDiscount * (taxRate / 100);
  const total = afterDiscount + tax;
  return { subtotal, tax, total };
}
