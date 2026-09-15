"use client";

import { useEffect, useState } from "react";
import { Download } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/constants";
import { downloadCsv } from "@/lib/csv-export";

type Report = {
  leadsBySource: { source: string; count: number }[];
  leadsByStatus: { status: string; count: number }[];
  profitability: { name: string; revenue: number; cost: number; profit: number; margin: number; quantity: number }[];
  pipeline: { stage: string; count: number; value: number }[];
  tasksSummary: { status: string; count: number }[];
};

export default function ReportsPage() {
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then(setReport)
      .catch(() => {});
  }, []);

  if (!report) return <div className="p-6 text-sm text-muted">Cargando reportes...</div>;

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-5">
        <h1 className="text-lg font-semibold text-foreground">Reportes</h1>
        <p className="text-sm text-muted">Análisis de leads, ventas, pipeline y rentabilidad</p>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReportTable
          title="Leads por fuente"
          rows={report.leadsBySource}
          columns={[
            { key: "source", label: "Fuente" },
            { key: "count", label: "Cantidad" },
          ]}
          filename="leads-por-fuente.csv"
        />
        <ReportTable
          title="Leads por estado"
          rows={report.leadsByStatus}
          columns={[
            { key: "status", label: "Estado" },
            { key: "count", label: "Cantidad" },
          ]}
          filename="leads-por-estado.csv"
        />
        <ReportTable
          title="Pipeline por etapa"
          rows={report.pipeline}
          columns={[
            { key: "stage", label: "Etapa" },
            { key: "count", label: "Oportunidades" },
            { key: "value", label: "Valor", format: (v) => formatCurrency(Number(v)) },
          ]}
          filename="pipeline-por-etapa.csv"
        />
        <ReportTable
          title="Tareas por estado"
          rows={report.tasksSummary}
          columns={[
            { key: "status", label: "Estado" },
            { key: "count", label: "Cantidad" },
          ]}
          filename="tareas-por-estado.csv"
        />
        <Card className="lg:col-span-2">
          <CardHeader
            title="Rentabilidad por producto"
            action={
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  downloadCsv(
                    "rentabilidad.csv",
                    report.profitability.map((p) => ({
                      producto: p.name,
                      unidades: p.quantity,
                      ingresos: p.revenue,
                      costo: p.cost,
                      utilidad: p.profit,
                      margen: `${p.margin.toFixed(1)}%`,
                    }))
                  )
                }
              >
                <Download size={13} /> Exportar
              </Button>
            }
          />
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted">
              <tr>
                <th className="pb-2">Producto</th>
                <th className="pb-2">Unidades</th>
                <th className="pb-2">Ingresos</th>
                <th className="pb-2">Costo</th>
                <th className="pb-2">Utilidad</th>
                <th className="pb-2">Margen</th>
              </tr>
            </thead>
            <tbody>
              {report.profitability.map((p) => (
                <tr key={p.name} className="border-t border-border">
                  <td className="py-2">{p.name}</td>
                  <td className="py-2">{p.quantity}</td>
                  <td className="py-2">{formatCurrency(p.revenue)}</td>
                  <td className="py-2">{formatCurrency(p.cost)}</td>
                  <td className="py-2 font-medium">{formatCurrency(p.profit)}</td>
                  <td className="py-2">{p.margin.toFixed(1)}%</td>
                </tr>
              ))}
              {report.profitability.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-muted">
                    Sin ventas registradas aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </Card>
      </div>
    </div>
  );
}

function ReportTable<T extends Record<string, string | number>>({
  title,
  rows,
  columns,
  filename,
}: {
  title: string;
  rows: T[];
  columns: { key: keyof T; label: string; format?: (v: string | number) => string }[];
  filename: string;
}) {
  return (
    <Card>
      <CardHeader
        title={title}
        action={
          <Button size="sm" variant="outline" onClick={() => downloadCsv(filename, rows)}>
            <Download size={13} /> Exportar
          </Button>
        }
      />
      <table className="w-full text-sm">
        <thead className="text-left text-xs uppercase text-muted">
          <tr>
            {columns.map((c) => (
              <th key={String(c.key)} className="pb-2">
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-border">
              {columns.map((c) => (
                <td key={String(c.key)} className="py-2">
                  {c.format ? c.format(r[c.key]) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length} className="py-6 text-center text-muted">
                Sin datos aún.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </Card>
  );
}
