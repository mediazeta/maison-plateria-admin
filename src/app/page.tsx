"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { ESTADOS, Pedido } from "@/lib/types";
import { formatDate, formatEuro, formatMonthLabel } from "@/lib/format";

export default function DashboardPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("pedidos")
      .select("*")
      .order("fecha_pedido", { ascending: true })
      .then(({ data }) => {
        setPedidos((data as Pedido[]) ?? []);
        setLoading(false);
      });
  }, []);

  const totales = useMemo(() => {
    const ingresos = pedidos.reduce((a, p) => a + p.precio_venta, 0);
    const costes = pedidos.reduce((a, p) => a + p.coste, 0);
    const beneficio = ingresos - costes;
    return { ingresos, costes, beneficio };
  }, [pedidos]);

  const porMes = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of pedidos) {
      const key = p.fecha_pedido.slice(0, 7);
      map.set(key, (map.get(key) ?? 0) + p.beneficio);
    }
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, beneficio]) => ({ mes, beneficio }));
  }, [pedidos]);

  const proximosPedidos = useMemo(
    () =>
      pedidos
        .filter((p) => p.fecha_estimada && p.estado !== "entregado")
        .sort((a, b) => (a.fecha_estimada! < b.fecha_estimada! ? -1 : 1))
        .slice(0, 5),
    [pedidos]
  );

  if (loading) return <p className="text-foreground/60">Cargando…</p>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold">Resumen</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <TotalCard label="Ingresos totales" value={totales.ingresos} />
        <TotalCard label="Costes totales" value={totales.costes} />
        <TotalCard
          label="Beneficio total"
          value={totales.beneficio}
          highlight
        />
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
        <h2 className="font-semibold mb-4">Beneficio por mes</h2>
        {porMes.length === 0 ? (
          <p className="text-foreground/60 text-sm">
            Todavía no hay pedidos para mostrar el gráfico.
          </p>
        ) : (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={porMes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8ddd0" />
                <XAxis
                  dataKey="mes"
                  tickFormatter={formatMonthLabel}
                  fontSize={12}
                  stroke="#8a7d6f"
                />
                <YAxis
                  fontSize={12}
                  stroke="#8a7d6f"
                  tickFormatter={(v) => formatEuro(v)}
                  width={80}
                />
                <Tooltip
                  formatter={(value) => formatEuro(Number(value))}
                  labelFormatter={(label) => formatMonthLabel(label as string)}
                  contentStyle={{ borderRadius: 12, borderColor: "#e8ddd0" }}
                />
                <Bar dataKey="beneficio" radius={[6, 6, 0, 0]}>
                  {porMes.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.beneficio >= 0 ? "#10b981" : "#dc2626"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold">Próximas entregas</h2>
          <Link href="/pedidos" className="text-sm text-accent-dark font-medium">
            Ver todos →
          </Link>
        </div>
        {proximosPedidos.length === 0 ? (
          <p className="text-foreground/60 text-sm">
            No hay pedidos pendientes con fecha estimada.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {proximosPedidos.map((p) => (
              <li key={p.id} className="py-3 flex items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{p.cliente}</p>
                  <p className="text-xs text-foreground/60">
                    {ESTADOS.find((e) => e.value === p.estado)?.label}
                  </p>
                </div>
                <span className="text-sm font-medium text-accent-dark">
                  {formatDate(p.fecha_estimada)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function TotalCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  const isLoss = value < 0;
  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm">
      <p className="text-sm text-foreground/60">{label}</p>
      <p
        className={`text-2xl font-semibold mt-1 ${
          highlight ? (isLoss ? "text-red-600" : "text-emerald-600") : ""
        }`}
      >
        {formatEuro(value)}
      </p>
      {highlight && isLoss && (
        <p className="text-xs text-red-600 mt-1">⚠ En pérdidas</p>
      )}
    </div>
  );
}
