# Maison Platería — Panel de administración

App para gestionar materiales (stock), pedidos y beneficios de la empresa. Sin login: pensada para abrirse directamente desde el iPad mediante una URL privada.

## 1. Crear la base de datos en Supabase

1. Entra en [supabase.com](https://supabase.com) y crea una cuenta y un proyecto nuevo (gratis).
2. Ve a **SQL Editor** → **New query**, pega el contenido de [`supabase/schema.sql`](supabase/schema.sql) y ejecútalo. Esto crea las tablas `materiales` y `pedidos`.
3. Ve a **Project Settings → API**. Copia:
   - `Project URL`
   - `anon public` key

## 2. Configurar las variables de entorno

Copia `.env.local.example` a `.env.local` y rellena con los valores de Supabase:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-clave-anon-publica
```

Para desarrollo local:

```
npm install
npm run dev
```

## 3. Desplegar en Vercel

1. Sube este proyecto a un repositorio de GitHub.
2. En [vercel.com](https://vercel.com), importa el repositorio.
3. En **Environment Variables**, añade `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` con los mismos valores que en `.env.local`.
4. Despliega. Vercel te dará una URL (por ejemplo `maison-plateria.vercel.app`).

## 4. Acceso desde el iPad

La web no tiene contraseña, así que la única protección es que la URL no se comparta públicamente:

- Añade la URL de Vercel a la pantalla de inicio del iPad (Safari → Compartir → "Añadir a pantalla de inicio") para que se abra como una app.
- El listado de la página no aparece en buscadores (`robots: noindex`), pero cualquiera con el enlace puede entrar y editar datos. Si en el futuro se quiere añadir protección, se puede activar un PIN sencillo o login con Supabase Auth sin apenas cambios en el resto de la app.

## Estructura

- **Resumen** (`/`): ingresos, costes y beneficio totales, gráfico de beneficio mensual y próximas entregas.
- **Pedidos** (`/pedidos`): alta/edición/borrado de pedidos con cliente, fechas, coste aproximado, precio de venta (el beneficio se calcula solo), estado y notas.
- **Materiales** (`/materiales`): stock de materiales con cantidad, coste unitario y valor total en stock.
