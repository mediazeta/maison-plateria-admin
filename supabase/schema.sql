-- Esquema para el panel de administración de Maison Platería
-- Ejecutar este archivo completo en el SQL Editor de Supabase (Project > SQL Editor > New query)

create extension if not exists "pgcrypto";

-- Materiales / stock
create table if not exists materiales (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  cantidad numeric not null default 0,
  unidad text not null default 'unidades',
  coste_unitario numeric not null default 0,
  notas text,
  actualizado_en timestamptz not null default now()
);

-- Pedidos
create table if not exists pedidos (
  id uuid primary key default gen_random_uuid(),
  cliente text not null,
  descripcion text,
  fecha_pedido date not null default current_date,
  fecha_estimada date,
  coste numeric not null default 0,
  precio_venta numeric not null default 0,
  beneficio numeric generated always as (precio_venta - coste) stored,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'en_proceso', 'completado', 'entregado')),
  notas text,
  creado_en timestamptz not null default now()
);

-- Mantener actualizado_en al día en materiales
create or replace function set_actualizado_en()
returns trigger as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_materiales_actualizado on materiales;
create trigger trg_materiales_actualizado
before update on materiales
for each row execute function set_actualizado_en();

-- RLS: la app usa la clave "anon" pública sin login (acceso solo por URL privada),
-- así que se permite acceso completo a estas dos tablas.
alter table materiales enable row level security;
alter table pedidos enable row level security;

drop policy if exists "materiales_all" on materiales;
create policy "materiales_all" on materiales for all using (true) with check (true);

drop policy if exists "pedidos_all" on pedidos;
create policy "pedidos_all" on pedidos for all using (true) with check (true);
