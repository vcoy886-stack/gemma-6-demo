import { NextRequest, NextResponse } from "next/server";
import PDFDocument from "pdfkit";
import { prisma } from "@/lib/prisma";
import { requireSession, handleApiError, ApiError } from "@/lib/api-utils";
import { formatCurrency, formatDate, contactName } from "@/lib/constants";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await requireSession();
    const { id } = await params;

    const [quote, company] = await Promise.all([
      prisma.quote.findFirst({
        where: { id, companyId: user.companyId },
        include: { contact: true, owner: { select: { name: true } }, items: { include: { product: true } } },
      }),
      prisma.company.findUnique({ where: { id: user.companyId } }),
    ]);
    if (!quote) throw new ApiError("Cotización no encontrada", 404);

    const buffer = await renderQuotePdf(quote, company);

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="cotizacion-${quote.number}.pdf"`,
      },
    });
  } catch (err) {
    return handleApiError(err);
  }
}

type QuoteWithRelations = {
  number: string;
  status: string;
  createdAt: Date;
  validUntil: Date | null;
  conditions: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  contact: { firstName: string; lastName: string | null; phone: string | null; email: string | null; companyName: string | null };
  owner: { name: string } | null;
  items: { quantity: number; price: number; discount: number; total: number; product: { name: string; code: string } }[];
};

function renderQuotePdf(
  quote: QuoteWithRelations,
  company: { name: string; address: string | null; phone: string | null; email: string | null; currency: string } | null
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const currency = company?.currency ?? "USD";

    doc.fontSize(20).fillColor("#4f46e5").text(company?.name ?? "Tu empresa", { continued: false });
    doc.fontSize(9).fillColor("#667085");
    if (company?.address) doc.text(company.address);
    if (company?.phone) doc.text(`Tel: ${company.phone}`);
    if (company?.email) doc.text(company.email);

    doc.moveDown(1.5);
    doc.fontSize(16).fillColor("#14151a").text(`Cotización ${quote.number}`);
    doc.fontSize(9).fillColor("#667085").text(`Fecha: ${formatDate(quote.createdAt)}`);
    if (quote.validUntil) doc.text(`Válida hasta: ${formatDate(quote.validUntil)}`);
    doc.text(`Estado: ${quote.status}`);

    doc.moveDown(1);
    doc.fontSize(10).fillColor("#14151a").text("Cliente:", { underline: true });
    doc.fontSize(10).text(contactName(quote.contact));
    if (quote.contact.companyName) doc.text(quote.contact.companyName);
    if (quote.contact.phone) doc.text(quote.contact.phone);
    if (quote.contact.email) doc.text(quote.contact.email);

    doc.moveDown(1.5);

    const tableTop = doc.y;
    doc.fontSize(9).fillColor("#667085");
    doc.text("Producto", 50, tableTop);
    doc.text("Cant.", 280, tableTop);
    doc.text("Precio", 340, tableTop);
    doc.text("Desc.", 410, tableTop);
    doc.text("Total", 470, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(545, tableTop + 15).strokeColor("#e4e6ec").stroke();

    let y = tableTop + 22;
    doc.fontSize(10).fillColor("#14151a");
    for (const item of quote.items) {
      doc.text(item.product.name, 50, y, { width: 220 });
      doc.text(String(item.quantity), 280, y);
      doc.text(formatCurrency(item.price, currency), 340, y);
      doc.text(formatCurrency(item.discount, currency), 410, y);
      doc.text(formatCurrency(item.total, currency), 470, y);
      y += 20;
    }

    doc.moveTo(50, y + 4).lineTo(545, y + 4).strokeColor("#e4e6ec").stroke();
    y += 14;

    doc.fontSize(10);
    doc.text("Subtotal", 400, y);
    doc.text(formatCurrency(quote.subtotal, currency), 470, y);
    y += 16;
    doc.text("Descuento", 400, y);
    doc.text(`-${formatCurrency(quote.discount, currency)}`, 470, y);
    y += 16;
    doc.text("Impuestos", 400, y);
    doc.text(formatCurrency(quote.tax, currency), 470, y);
    y += 20;
    doc.fontSize(12).fillColor("#4f46e5").text("Total", 400, y);
    doc.text(formatCurrency(quote.total, currency), 470, y);

    if (quote.conditions) {
      doc.moveDown(3);
      doc.fontSize(9).fillColor("#667085").text("Condiciones:", { underline: true });
      doc.text(quote.conditions);
    }

    doc.moveDown(2);
    doc.fontSize(8).fillColor("#9ca3af").text(`Preparado por ${quote.owner?.name ?? "—"}`, { align: "left" });

    doc.end();
  });
}
