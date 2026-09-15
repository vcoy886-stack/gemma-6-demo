"use client";

import { useEffect, useState, useCallback } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  DollarSign,
  Users,
  Flame,
  Target,
  TrendingUp,
  Percent,
  Wallet,
  Clock,
  UserPlus,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Field";
import { formatCurrency } from "@/lib/constants";

type Metrics = {
  kpis: {
    salesToday: number;
    salesMonth: number;
    salesYear: number;
    leadsTotal: number;
    leadsNew: number;
    leadsHot: number;
    opportunitiesOpen: number;
    opportunitiesWon: number;
    opportunitiesLost: number;
    conversionRate: number;
    avgTicket: number;
    pipelineValue: number;
    pendingFollowups: number;
    newCustomers: number;
  };
  topProducts: { productId: string; name: string; quantity: number; revenue: number }[];
  topSellers: { ownerId: string | null; name: string; total: number; count: number }[];
  salesChart: { label: string; total: number }[];
};

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [range, setRange] = useState<"day" | "week" | "month" | "year">("month");
  const [owners, setOwners] = useState<{ id: string; name: string }[]>([]);
  const [ownerId, setOwnerId] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ range });
    if (ownerId) params.set("ownerId", ownerId);
    try {
      const res = await fetch(`/api/dashboard/metrics?${params}`);
      if (res.ok) setMetrics(await res.json());
    } finally {
      setLoading(false);
    }
  }, [range, ownerId]);

  useEffect(() => {
    load();
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
          <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted">Resumen comercial en tiempo real</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select className="w-full sm:w-auto" value={range} onChange={(e) => setRange(e.target.value as typeof range)}>
            <option value="day">Últimos 7 días</option>
            <option value="week">Últimas 8 semanas</option>
            <option value="month">Últimos 12 meses</option>
            <option value="year">Últimos 5 años</option>
          </Select>
          <Select className="w-full sm:w-auto" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="">Todos los vendedores</option>
            {owners.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {loading && !metrics && <p className="text-sm text-muted">Cargando métricas...</p>}

      {metrics && (
        <>
          <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Kpi icon={DollarSign} label="Ventas de hoy" value={formatCurrency(metrics.kpis.salesToday)} tone="success" />
            <Kpi icon={DollarSign} label="Ventas del mes" value={formatCurrency(metrics.kpis.salesMonth)} tone="success" />
            <Kpi icon={DollarSign} label="Ventas del año" value={formatCurrency(metrics.kpis.salesYear)} tone="success" />
            <Kpi icon={Wallet} label="Ticket promedio" value={formatCurrency(metrics.kpis.avgTicket)} />
            <Kpi icon={Users} label="Leads totales" value={metrics.kpis.leadsTotal} />
            <Kpi icon={UserPlus} label="Leads nuevos" value={metrics.kpis.leadsNew} />
            <Kpi icon={Flame} label="Leads calientes" value={metrics.kpis.leadsHot} tone="warning" />
            <Kpi icon={UserPlus} label="Clientes nuevos (mes)" value={metrics.kpis.newCustomers} />
            <Kpi icon={Target} label="Oportunidades abiertas" value={metrics.kpis.opportunitiesOpen} />
            <Kpi icon={TrendingUp} label="Oportunidades ganadas" value={metrics.kpis.opportunitiesWon} tone="success" />
            <Kpi icon={Percent} label="Tasa de conversión" value={`${metrics.kpis.conversionRate}%`} />
            <Kpi icon={Clock} label="Seguimientos pendientes" value={metrics.kpis.pendingFollowups} tone="warning" />
          </div>

          <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader title="Tendencia de ventas" subtitle={`Valor del pipeline abierto: ${formatCurrency(metrics.kpis.pipelineValue)}`} />
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={metrics.salesChart} margin={{ left: -20 }}>
                    <defs>
                      <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e6ec" />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#667085" }} />
                    <YAxis tick={{ fontSize: 11, fill: "#667085" }} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v ?? 0))} />
                    <Area type="monotone" dataKey="total" stroke="#4f46e5" fill="url(#salesGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>

            <Card>
              <CardHeader title="Vendedores con mejor desempeño" />
              <div className="space-y-3">
                {metrics.topSellers.map((s, i) => (
                  <div key={s.ownerId ?? i} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-soft text-xs font-semibold text-primary">
                        {i + 1}
                      </span>
                      <span className="text-sm">{s.name}</span>
                    </div>
                    <span className="text-sm font-medium">{formatCurrency(s.total)}</span>
                  </div>
                ))}
                {metrics.topSellers.length === 0 && <p className="text-sm text-muted">Sin ventas aún.</p>}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Productos más vendidos" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
              {metrics.topProducts.map((p, i) => (
                <div key={p.productId} className="rounded-lg border border-border p-3">
                  <p className="text-xs text-muted">#{i + 1}</p>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="mt-1 text-xs text-muted">{p.quantity} unidades</p>
                  <p className="text-sm font-semibold text-primary">{formatCurrency(p.revenue)}</p>
                </div>
              ))}
              {metrics.topProducts.length === 0 && (
                <p className="col-span-full text-sm text-muted">Sin ventas registradas aún.</p>
              )}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  tone?: "default" | "success" | "warning";
}) {
  const toneClasses = {
    default: "bg-primary-soft text-primary",
    success: "bg-green-50 text-green-700",
    warning: "bg-amber-50 text-amber-700",
  }[tone];

  return (
    <Card padded className="flex items-center gap-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${toneClasses}`}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="truncate text-lg font-semibold text-foreground">{value}</p>
        <p className="truncate text-xs text-muted">{label}</p>
      </div>
    </Card>
  );
}
