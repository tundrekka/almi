# Zalut Admin (web dev)

Panel de administración interno de Zalut. Es una copia enfocada de la sección
**"Dev app info"** de Ropero: un espacio solo para admins donde se crean *cards*
(notas con bloques de texto, links, imágenes, audio, documentos y to-dos), se
filtran, se etiquetan con `#tags`, se comparten y se llevan to-dos.

Stack: **Next.js 16** (App Router) · **React 19** · **Tailwind v4** · **Supabase**.

## Estructura

```
src/
  app/
    page.tsx                  → redirige a /admin/dev-app-info
    layout.tsx, globals.css   → shell + tema "Neo-Trópico Tech"
    auth/                     → login, signup, forgot, reset, callback, signout
    admin/
      layout.tsx              → gate requireRole("admin") + nav lateral
      page.tsx                → resumen
      dev-app-info/           → el feature: resumen, feed/bloques, crear, to-dos, ajustes
      dev-note/[id]/          → vista + edición de una nota
  lib/
    env.ts                    → lectura lazy de variables de entorno
    supabase/                 → clientes server / browser / proxy (SSR)
    auth/dal.ts               → getSessionUser / requireRole
  components/section-shell.tsx
proxy.ts                      → middleware (Next 16) que protege /admin
supabase/schema.sql           → tablas, bucket y RLS que el código espera
```

## Puesta en marcha

1. **Dependencias**

   ```bash
   pnpm install   # o npm install
   ```

2. **Supabase** — crea el proyecto y corre `supabase/schema.sql`. Esto crea:
   - `zalut_profiles` (con `role` y `dev_color`)
   - `zalut_dev_notes` (las cards)
   - bucket de storage `zalut-dev-media`

3. **Variables de entorno** — copia `.env.local.example` a `.env.local` y rellena
   las keys de tu proyecto Supabase.

4. **Hazte admin** — regístrate desde `/auth/login`, luego en el SQL editor:

   ```sql
   update public.zalut_profiles set role = 'admin' where id = 'TU-USER-ID';
   ```

5. **Corre la app**

   ```bash
   pnpm dev   # http://localhost:3020
   ```

## Notas

- Todas las escrituras del feature pasan por **server actions con service role**
  (que verifican rol admin en código), por eso `zalut_dev_notes` tiene RLS activo
  sin policies.
- El bucket de media es privado; las URLs se firman bajo demanda (1 h).
