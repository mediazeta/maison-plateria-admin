export type Material = {
  id: string;
  nombre: string;
  cantidad: number;
  unidad: string;
  coste_unitario: number;
  notas: string | null;
  actualizado_en: string;
};

export type EstadoPedido = "pendiente" | "en_proceso" | "completado" | "entregado";

export type Pedido = {
  id: string;
  cliente: string;
  descripcion: string | null;
  fecha_pedido: string;
  fecha_estimada: string | null;
  coste: number;
  precio_venta: number;
  beneficio: number;
  estado: EstadoPedido;
  notas: string | null;
  creado_en: string;
};

export const ESTADOS: { value: EstadoPedido; label: string }[] = [
  { value: "pendiente", label: "Pendiente" },
  { value: "en_proceso", label: "En proceso" },
  { value: "completado", label: "Completado" },
  { value: "entregado", label: "Entregado" },
];
