"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { ESTADOS, EstadoPedido, Pedido } from "@/lib/types";
import { formatDate, formatEuro } from "@/lib/format";

type FormState = {
  id: string | null;
  cliente: string;
  descripcion: string;
  fecha_pedido: string;
  fecha_estimada: string;
  coste: string;
  precio_venta: string;
  estado: EstadoPedido;
  notas: string;
};

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm: FormState = {
  id: null,
  cliente: "",
  descripcion: "",
  fecha_pedido: today(),
  fecha_estimada: "",
  coste: "",
  precio_venta: "",
  estado: "pendiente",
  notas: "",
};

export default function PedidosPage() {
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState<EstadoPedido | "todos">("todos");

  async function cargar() {
    setLoading(true);
    const { data, error } = await supabase
      .from("pedidos")
      .select("*")
      .order("fecha_estimada", { ascending: true, nullsFirst: false });
    if (error) setError(error.message);
    else setPedidos(data as Pedido[]);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load
    cargar();
  }, []);

  function abrirNuevo() {
    setForm(emptyForm);
    setShowForm(true);
  }

  function abrirEditar(p: Pedido) {
    setForm({
      id: p.id,
      cliente: p.cliente,
      descripcion: p.descripcion ?? "",
      fecha_pedido: p.fecha_pedido,
      fecha_estimada: p.fecha_estimada ?? "",
      coste: String(p.coste),
      precio_venta: String(p.precio_venta),
      estado: p.estado,
      notas: p.notas ?? "",
    });
    setShowForm(true);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.cliente.trim()) {
      setError("Ponle un nombre al cliente o pedido.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      cliente: form.cliente.trim(),
      descripcion: form.descripcion.trim() || null,
      fecha_pedido: form.fecha_pedido,
      fecha_estimada: form.fecha_estimada || null,
      coste: Number(form.coste) || 0,
      precio_venta: Number(form.precio_venta) || 0,
      estado: form.estado,
      notas: form.notas.trim() || null,
    };

    const { error } = form.id
      ? await supabase.from("pedidos").update(payload).eq("id", form.id)
      : await supabase.from("pedidos").insert(payload);

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setShowForm(false);
    setForm(emptyForm);
    cargar();
  }

  async function eliminar(id: string) {
    if (!confirm("¿Borrar este pedido?")) return;
    const { error } = await supabase.from("pedidos").delete().eq("id", id);
    if (error) setError(error.message);
    else cargar();
  }

  const pedidosFiltrados = useMemo(
    () =>
      filtroEstado === "todos"
        ? pedidos
        : pedidos.filter((p) => p.estado === filtroEstado),
    [pedidos, filtroEstado]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Pedidos</h1>
        <button
          onClick={abrirNuevo}
          className="rounded-full bg-accent text-white px-5 py-2.5 font-medium hover:bg-accent-dark transition-colors"
        >
          + Nuevo pedido
        </button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <FiltroChip
          label="Todos"
          active={filtroEstado === "todos"}
          onClick={() => setFiltroEstado("todos")}
        />
        {ESTADOS.map((e) => (
          <FiltroChip
            key={e.value}
            label={e.label}
            active={filtroEstado === e.value}
            onClick={() => setFiltroEstado(e.value)}
          />
        ))}
      </div>

      {error && (
        <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-foreground/60">Cargando…</p>
      ) : pedidosFiltrados.length === 0 ? (
        <p className="text-foreground/60">No hay pedidos todavía.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {pedidosFiltrados.map((p) => (
            <div
              key={p.id}
              className="bg-card border border-border rounded-2xl p-4 space-y-2 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-lg leading-tight">{p.cliente}</p>
                  {p.descripcion && (
                    <p className="text-sm text-foreground/70">{p.descripcion}</p>
                  )}
                </div>
                <EstadoBadge estado={p.estado} />
              </div>

              <div className="grid grid-cols-3 gap-2 text-sm pt-1">
                <Stat label="Coste" value={formatEuro(p.coste)} />
                <Stat label="Venta" value={formatEuro(p.precio_venta)} />
                <Stat
                  label="Beneficio"
                  value={formatEuro(p.beneficio)}
                  positive={p.beneficio >= 0}
                />
              </div>

              <div className="flex justify-between text-xs text-foreground/60 pt-1">
                <span>Pedido: {formatDate(p.fecha_pedido)}</span>
                <span>Estimada: {formatDate(p.fecha_estimada)}</span>
              </div>

              {p.notas && (
                <p className="text-xs text-foreground/60 italic pt-1">{p.notas}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => abrirEditar(p)}
                  className="text-sm px-3 py-1.5 rounded-full border border-border hover:bg-border/50"
                >
                  Editar
                </button>
                <button
                  onClick={() => eliminar(p.id)}
                  className="text-sm px-3 py-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50"
                >
                  Borrar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/30 flex items-end sm:items-center justify-center z-20 p-0 sm:p-4">
          <form
            onSubmit={guardar}
            className="bg-card w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl p-5 space-y-4 max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-xl font-semibold">
              {form.id ? "Editar pedido" : "Nuevo pedido"}
            </h2>

            <Field label="Cliente / pedido">
              <input
                className="input"
                value={form.cliente}
                onChange={(e) => setForm({ ...form, cliente: e.target.value })}
                placeholder="Ej: María - juego de 6 platitos"
                autoFocus
              />
            </Field>

            <Field label="Descripción">
              <input
                className="input"
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
                placeholder="Opcional"
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Fecha del pedido">
                <input
                  type="date"
                  className="input"
                  value={form.fecha_pedido}
                  onChange={(e) => setForm({ ...form, fecha_pedido: e.target.value })}
                />
              </Field>
              <Field label="Fecha estimada de entrega">
                <input
                  type="date"
                  className="input"
                  value={form.fecha_estimada}
                  onChange={(e) => setForm({ ...form, fecha_estimada: e.target.value })}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Coste aproximado (€)">
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  className="input"
                  value={form.coste}
                  onChange={(e) => setForm({ ...form, coste: e.target.value })}
                  placeholder="0.00"
                />
              </Field>
              <Field label="Precio de venta (€)">
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  className="input"
                  value={form.precio_venta}
                  onChange={(e) => setForm({ ...form, precio_venta: e.target.value })}
                  placeholder="0.00"
                />
              </Field>
            </div>

            <p className="text-sm text-foreground/60">
              Beneficio estimado:{" "}
              <span className="font-semibold text-foreground">
                {formatEuro((Number(form.precio_venta) || 0) - (Number(form.coste) || 0))}
              </span>
            </p>

            <Field label="Estado">
              <select
                className="input"
                value={form.estado}
                onChange={(e) =>
                  setForm({ ...form, estado: e.target.value as EstadoPedido })
                }
              >
                {ESTADOS.map((e) => (
                  <option key={e.value} value={e.value}>
                    {e.label}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Notas">
              <textarea
                className="input"
                rows={2}
                value={form.notas}
                onChange={(e) => setForm({ ...form, notas: e.target.value })}
                placeholder="Opcional"
              />
            </Field>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 rounded-full bg-accent text-white py-3 font-medium hover:bg-accent-dark transition-colors disabled:opacity-60"
              >
                {saving ? "Guardando…" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 rounded-full border border-border py-3 font-medium hover:bg-border/50"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-sm font-medium text-foreground/80">{label}</span>
      {children}
    </label>
  );
}

function Stat({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div>
      <p className="text-foreground/50 text-xs">{label}</p>
      <p
        className={`font-semibold ${
          positive === undefined
            ? ""
            : positive
            ? "text-emerald-600"
            : "text-red-600"
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function EstadoBadge({ estado }: { estado: EstadoPedido }) {
  const styles: Record<EstadoPedido, string> = {
    pendiente: "bg-amber-100 text-amber-800",
    en_proceso: "bg-blue-100 text-blue-800",
    completado: "bg-emerald-100 text-emerald-800",
    entregado: "bg-neutral-200 text-neutral-700",
  };
  const label = ESTADOS.find((e) => e.value === estado)?.label ?? estado;
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${styles[estado]}`}>
      {label}
    </span>
  );
}

function FiltroChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
        active
          ? "bg-accent text-white border-accent"
          : "border-border text-foreground/70 hover:bg-border/50"
      }`}
    >
      {label}
    </button>
  );
}
