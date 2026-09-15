"use client";

import { useState } from "react";
import Papa from "papaparse";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { ArrowLeft, Upload, FileSpreadsheet } from "lucide-react";
import Link from "next/link";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";

type Row = {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  city: string;
  companyName: string;
  issues: string[];
  selected: boolean;
};

const HEADER_MAP: Record<string, keyof Omit<Row, "issues" | "selected">> = {
  nombre: "firstName",
  firstname: "firstName",
  first_name: "firstName",
  apellido: "lastName",
  lastname: "lastName",
  last_name: "lastName",
  telefono: "phone",
  "teléfono": "phone",
  phone: "phone",
  celular: "phone",
  correo: "email",
  email: "email",
  "e-mail": "email",
  ciudad: "city",
  city: "city",
  empresa: "companyName",
  company: "companyName",
  companyname: "companyName",
};

const PHONE_REGEX = /^[+\d][\d\s()-]{6,}$/;

export default function ImportContactsPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ created: number; skippedInvalid: number; skippedDuplicate: number } | null>(null);

  function handleFile(file: File) {
    setFileName(file.name);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        const seenKeys = new Set<string>();
        const parsed: Row[] = (res.data as Record<string, string>[]).map((raw) => {
          const row: Partial<Row> = { firstName: "", lastName: "", phone: "", email: "", city: "", companyName: "" };
          for (const [key, value] of Object.entries(raw)) {
            const normalized = key.trim().toLowerCase().replace(/\s+/g, "_");
            const field = HEADER_MAP[normalized] ?? HEADER_MAP[key.trim().toLowerCase()];
            if (field) row[field] = (value ?? "").toString().trim();
          }

          const issues: string[] = [];
          if (!row.firstName) issues.push("Falta el nombre");
          if (!row.phone && !row.email) issues.push("Falta teléfono o correo");
          if (row.phone && !PHONE_REGEX.test(row.phone)) issues.push("Teléfono con formato inválido");

          const key = (row.phone || row.email || "").toLowerCase();
          if (key && seenKeys.has(key)) issues.push("Duplicado dentro del archivo");
          if (key) seenKeys.add(key);

          return {
            firstName: row.firstName ?? "",
            lastName: row.lastName ?? "",
            phone: row.phone ?? "",
            email: row.email ?? "",
            city: row.city ?? "",
            companyName: row.companyName ?? "",
            issues,
            selected: issues.length === 0,
          };
        });
        setRows(parsed);
        setResult(null);
      },
    });
  }

  function toggleRow(i: number) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, selected: !r.selected } : r)));
  }

  async function confirmImport() {
    const selected = rows.filter((r) => r.selected);
    if (selected.length === 0) {
      toast.error("Selecciona al menos una fila válida");
      return;
    }
    setImporting(true);
    try {
      const res = await fetch("/api/contacts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "No se pudo importar");
        return;
      }
      setResult(data);
      toast.success(`${data.created} contactos importados`);
    } finally {
      setImporting(false);
    }
  }

  const validCount = rows.filter((r) => r.issues.length === 0).length;

  return (
    <div className="p-4 sm:p-6">
      <Link href="/crm" className="mb-3 flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={14} /> Volver al CRM
      </Link>
      <h1 className="mb-1 text-lg font-semibold text-foreground">Importar clientes desde CSV/Excel</h1>
      <p className="mb-5 text-sm text-muted">
        Sube un archivo .csv con columnas como nombre, apellido, telefono, correo, ciudad, empresa. Verás una
        vista previa y podrás excluir filas antes de importar.
      </p>

      {rows.length === 0 && (
        <Card>
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border py-14 text-center hover:bg-black/[0.02]">
            <Upload size={28} className="text-muted" />
            <span className="text-sm font-medium">Haz clic para seleccionar un archivo CSV</span>
            <span className="text-xs text-muted">o .xls/.xlsx exportado como CSV</span>
            <input
              type="file"
              accept=".csv,.txt"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
            />
          </label>
        </Card>
      )}

      {rows.length > 0 && !result && (
        <Card padded={false}>
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <FileSpreadsheet size={16} />
              {fileName} · {rows.length} filas · {validCount} válidas
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setRows([])}>
                Elegir otro archivo
              </Button>
              <Button onClick={confirmImport} disabled={importing}>
                {importing ? "Importando..." : "Confirmar importación"}
              </Button>
            </div>
          </div>
          <div className="max-h-[55vh] overflow-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 border-b border-border bg-white text-left text-xs uppercase text-muted">
                <tr>
                  <th className="px-3 py-2"></th>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">Teléfono</th>
                  <th className="px-3 py-2">Correo</th>
                  <th className="px-3 py-2">Ciudad</th>
                  <th className="px-3 py-2">Problemas</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i} className={`border-b border-border last:border-0 ${r.issues.length ? "bg-amber-50/50" : ""}`}>
                    <td className="px-3 py-2">
                      <input type="checkbox" checked={r.selected} onChange={() => toggleRow(i)} />
                    </td>
                    <td className="px-3 py-2">
                      {r.firstName} {r.lastName}
                    </td>
                    <td className="px-3 py-2">{r.phone || "—"}</td>
                    <td className="px-3 py-2">{r.email || "—"}</td>
                    <td className="px-3 py-2">{r.city || "—"}</td>
                    <td className="px-3 py-2">
                      {r.issues.map((issue) => (
                        <Badge key={issue} tone="warning" className="mr-1">
                          {issue}
                        </Badge>
                      ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader title="Importación completada" />
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-semibold text-success">{result.created}</p>
              <p className="text-xs text-muted">Creados</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-warning">{result.skippedDuplicate}</p>
              <p className="text-xs text-muted">Duplicados omitidos</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-danger">{result.skippedInvalid}</p>
              <p className="text-xs text-muted">Inválidos omitidos</p>
            </div>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setRows([])}>
              Importar otro archivo
            </Button>
            <Button onClick={() => router.push("/crm")}>Ver contactos</Button>
          </div>
        </Card>
      )}
    </div>
  );
}
