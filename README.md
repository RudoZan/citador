# Citador

App de escritura académica con fuentes de cita enlazadas. Especificación en [CONTEXT.md](./CONTEXT.md).

## Requisitos

- Node.js 20+ (recomendado 22)
- Proyecto Supabase con tablas y Auth (Google) configurados según CONTEXT.md

## Configuración local

```bash
cp .env.example .env.local
```

Completa `VITE_SUPABASE_ANON_KEY` y opcionalmente `VITE_ADMIN_EMAIL`.

## Desarrollo

La app usa `base: '/citador/'` para GitHub Pages. En local:

```bash
npm run dev
```

Abre **http://localhost:5173/citador/** (incluye el prefijo `/citador`).

## Build

```bash
npm run build
npm run preview
```

Preview en **http://localhost:4173/citador/**.

## GitHub Pages

Workflow [.github/workflows/deploy-pages.yml](./.github/workflows/deploy-pages.yml): en cada push a `main` publica `dist/` en la rama `gh-pages`.

En el repo: **Settings → Pages → Source**: rama `gh-pages`, carpeta `/ (root)`.

Recuerda registrar en Supabase y Google OAuth las URLs `http://localhost:5173/citador/` y la URL real de Pages (`https://rudozan.github.io/citador/`).
