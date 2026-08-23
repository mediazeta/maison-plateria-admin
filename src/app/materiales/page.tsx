"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Material } from "@/lib/types";
import { formatEuro } from "@/lib/format";

type FormState = {
  id: string | null;
  nombre: string;
  cantidad: string;
  unidad: string;
  coste_unitario: string;
  notas: string;
};

const emptyForm: FormState = {
  id: null,
  nombre: "",
  cantidad: "",
  unidad: "unidades",
  coste_unitario: "",
  notas: "",
};

export default function MaterialesPage() {
  const [materiales, setMateriales] = useState<Material[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  async function cargar() {
    setLoading(true);
    const { data, error } = await supabase
      .from("materiales")
      .select("*")
      .order("nombre", { ascending: true });
    if (error) setError(error.message);
    else setMateriales(data as Material[]);
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

  function abrirEditar(m: Material) {
    setForm({
      id: m.id,
      nombre: m.nombre,
      cantidad: String(m.cantidad),
      unidad: m.unidad,
      coste_unitario: String(m.coste_unitario),
      notas: m.notas ?? "",
    });
    setShowForm(true);
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form.nombre.trim()) {
      setError("Ponle un nombre al material.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = {
      nombre: form.nombre.trim(),
      cantidad: Number(form.cantidad) || 0,
      unidad: form.unidad.trim() || "unidades",
      coste_unitario: Number(form.coste_unitario) || 0,
      notas: form.notas.trim() || null,
    };

    const { error } = form.id
      ? await supabase.from("materiales").update(payload).eq("id", form.id)
      : await supabase.from("materiales").insert(payload);

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
    if (!confirm("¿Borrar este material?")) return;
    const { error } = await supabase.from("materiales").delete().eq("id", id);
    if (error) setError(error.message);
    else cargar();
  }

  const valorTotalStock = materiales.reduce(
    (acc, m) => acc + m.cantidad * m.coste_unitario,
    0
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Materiales</h1>
          <p className="text-sm text-foreground/60">
            Valor total en stock: <span className="font-semibold">{formatEuro(valorTotalStock)}</span>
          </p>
        </div>
        <button
          onClick={abrirNuevo}
          className="rounded-full bg-accent text-white px-5 py-2.5 font-medium hover:bg-accent-dark transition-colors"
        >
          + Nuevo material
        </button>
      </div>

      {error && (
        <p className="text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2 text-sm">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-foreground/60">Cargando…</p>
      ) : materiales.length === 0 ? (
        <p className="text-foreground/60">No hay materiales todavía.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {materiales.map((m) => (
            <div
              key={m.id}
              className="bg-card border border-border rounded-2xl p-4 space-y-2 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-lg leading-tight">{m.nombre}</p>
                <span className="text-xs px-2.5 py-1 rounded-full bg-border/60 whitespace-nowrap">
                  {m.cantidad} {m.unidad}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <p className="text-foreground/50 text-xs">Coste unitario</p>
                  <p className="font-semibold">{formatEuro(m.coste_unitario)}</p>
                </div>
                <div>
                  <p className="text-foreground/50 text-xs">Valor en stock</p>
                  <p className="font-semibold">
                    {formatEuro(m.cantidad * m.coste_unitario)}
                  </p>
                </div>
              </div>

              {m.notas && (
                <p className="text-xs text-foreground/60 italic pt-1">{m.notas}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => abrirEditar(m)}
                  className="text-sm px-3 py-1.5 rounded-full border border-border hover:bg-border/50"
                >
                  Editar
                </button>
                <button
                  onClick={() => eliminar(m.id)}
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
              {form.id ? "Editar material" : "Nuevo material"}
            </h2>

            <Field label="Nombre">
              <input
                className="input"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                placeholder="Ej: Pintura dorada, platos de vidrio lisos..."
                autoFocus
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Cantidad en stock">
                <input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  className="input"
                  value={form.cantidad}
                  onChange={(e) => setForm({ ...form, cantidad: e.target.value })}
                  placeholder="0"
                />
              </Field>
              <Field label="Unidad">
                <input
                  className="input"
                  value={form.unidad}
                  onChange={(e) => setForm({ ...form, unidad: e.target.value })}
                  placeholder="unidades, botes, hojas..."
                />
              </Field>
            </div>

            <Field label="Coste por unidad (€)">
              <input
                type="number"
                step="0.01"
                inputMode="decimal"
                className="input"
                value={form.coste_unitario}
                onChange={(e) => setForm({ ...form, coste_unitario: e.target.value })}
                placeholder="0.00"
              />
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
