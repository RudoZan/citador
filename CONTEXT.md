# CONTEXT.md — Thesis Writing App

## Qué es esta app

Herramienta web de escritura académica con trazabilidad de citas. No es un reemplazo de Google Docs — su valor diferencial es el **sistema de fuentes de cita (FC)** vinculadas directamente al texto mediante códigos únicos.

El usuario (un estudiante de tesis) puede escribir cada capítulo/sección en un editor de texto rico, y mientras escribe tiene visible un panel lateral con todas sus fuentes de cita disponibles. Puede insertar una cita en el texto como un código especial clicable que enlaza directamente a la fuente origen.

---

## Sistema de códigos de cita (el corazón de la app)

Cada fuente de cita tiene un **ID único** (ej. `AS145`). Al insertarla en el texto, aparece como:

```
(AS145 - Gomez, 1990)
```

- `Gomez, 1990` → referencia que aparecerá en el documento Word exportado
- `AS145` → ID interno que vincula al registro FC en la base de datos
- El código completo es clicable: abre un panel con la fuente origen completa
- Al exportar a Word: `(AS145 - Gomez, 1990)` → `(Gomez, 1990)` (limpio)
- El mismo ID puede aparecer múltiples veces en distintas secciones → trazabilidad bidireccional

---

## Stack tecnológico


| Capa                | Tecnología            | Decisión                                                                                          |
| ------------------- | --------------------- | ------------------------------------------------------------------------------------------------- |
| Frontend            | React + TypeScript    | Estado complejo, componentes reactivos                                                            |
| Editor de texto     | Tiptap                | Open source, extensible, soporta tablas e imágenes, permite nodos custom para los códigos de cita |
| Backend / Auth / DB | Supabase              | Postgres + Auth + **Edge Functions** (decisión approve/reject por enlace en correo)                                                                        |
| Repo                | GitHub                | `RudoZan/citador` — ver tabla «Repositorio GitHub» debajo                                                                        |
| Hosting (desarrollo) | **GitHub Pages**     | Durante el desarrollo la **página pública** se despliega desde el mismo repositorio (Actions o rama `gh-pages` + build estático del frontend). |
| Hosting (producción) | (pendiente)          | Opcional más adelante: Vercel, Netlify u otro; entonces actualizar URLs de OAuth en Supabase y Google. |
| Exportación Word    | librería `docx` (npm) | Un solo `.docx` con todas las secciones en orden; nombre de archivo con **versionamiento automático** |

### Repositorio GitHub

| Dato | Valor |
| --- | --- |
| Repositorio (web) | https://github.com/RudoZan/citador |
| Clone HTTPS | https://github.com/RudoZan/citador.git |

**GitHub Pages:** cuando esté activado en este repo, la URL pública suele ser `https://rudozan.github.io/citador/` (GitHub usa el usuario en minúsculas en el subdominio `github.io`; confirmar en **Settings → Pages** del repositorio). Usar esa URL en Supabase y Google OAuth junto con `http://localhost:5173` si desarrollas en local.

### Proyecto Supabase (referencia)

| Dato | Valor |
| --- | --- |
| URL del proyecto | `https://junonydusnrcumbjjzqt.supabase.co` |

Variables de entorno en el frontend (ej. Vite):

- `VITE_SUPABASE_URL` → la URL anterior.
- `VITE_SUPABASE_ANON_KEY` → clave **anon / publishable** del proyecto (Dashboard → Settings → API). **No commitear** el valor real: usar `.env.local` y mantener fuera del control de versiones.
- `VITE_ADMIN_EMAIL` → **único correo del administrador** (avisos de solicitud y, si existe, UI opcional). Para envío del correo con enlaces, el mismo destinatario debe configurarse también como **secreto en Edge Functions** (no depender solo del prefijo `VITE_` para la lógica crítica del servidor).

**Secretos típicos en Edge Functions** (Dashboard Supabase → Functions → secrets): clave API del proveedor de correo (Resend/SendGrid/etc.), secreto para **firmar tokens** de los enlaces Aprobar/Rechazar, `SUPABASE_SERVICE_ROLE_KEY` solo si la función debe actualizar filas saltando RLS con validación manual del token.

### Publicar la app y el “login con Google” (pregunta frecuente)

Cuando la app **no** corre en `localhost` sino en una **dirección pública**, Google y Supabase deben **conocer esa dirección** para devolver al usuario después de iniciar sesión. En la práctica: en **Supabase** (Authentication → URL configuration) hay que declarar la **URL del sitio** y las **redirect URLs** permitidas; en la **consola de Google Cloud** (credencial OAuth del proyecto) hay que añadir esa misma URL como origen autorizado. Mientras tanto, el login puede fallar o redirigir mal. En desarrollo local suele bastar `http://localhost:5173` (u el puerto que use Vite).

**Con GitHub Pages** la URL típica es `https://<usuario-o-org>.github.io/<nombre-repo>/`. Para este proyecto, la referencia concreta está en **«Repositorio GitHub»** arriba (`…/citador/`). Esa URL base (incluyendo la barra final si aplica) debe registrarse igual en Supabase y en Google OAuth. Si el build de Vite/React vive en un **subpath** (`/citador/`), configurar `base: '/citador/'` en Vite y el router para que assets y rutas no se rompan.

**Resumen:** durante el desarrollo el **sitio público** vive en **GitHub Pages** desde https://github.com/RudoZan/citador; el código se versiona con `git` contra ese mismo remoto.

### Alcance de pantalla

Uso pensado solo en **PC y tablets grandes**. No es objetivo del MVP optimizar móvil ni pantallas estrechas; el layout de tres columnas puede asumir viewport ancho.

### Estilo de interfaz

Sin librería de componentes impuesta; prioridad **UI compacta** (menos padding y márgenes “tipo startup”, densidad tipo herramienta de escritorio: listas, tablas y paneles aprovechando mejor el espacio).

**Nota sobre Tiptap:** los códigos de cita `(Autor, Año - ID)` se implementan como **nodos personalizados de Tiptap** — no como texto plano. Esto permite que sean clicables, no editables manualmente, y reemplazables en la exportación.

---

## Control de acceso (usuarios)

- **Proveedor principal:** inicio de sesión con **Google** vía **Supabase Auth** (`signInWithOAuth` con `provider: 'google'`). El correo del usuario queda en `auth.users.email` (dominio `@gmail.com` u otro según la cuenta de Google Workspace).
- **Opcional en el mismo flujo:** magic link o contraseña por correo en Supabase, si se quiere alternativa al botón “Continuar con Google”.
- **Primera vez — autorización obligatoria:** no basta con autenticarse. Quien entra por primera vez debe **enviar una solicitud de acceso desde la misma app**; solo después de que el **administrador** apruebe puede usar proyectos y editor. Hasta entonces ve pantalla de estado (“pendiente de revisión” / rechazo con mensaje opcional). Si la solicitud fue **rechazada**, el usuario **puede solicitar de nuevo** desde la app (p. ej. volviendo la fila a `pending`).
- **Cómo aprueba el admin (preferido):** al crearse una solicitud `pending`, el sistema envía un **correo al administrador** (`VITE_ADMIN_EMAIL` u otro secreto solo en servidor) con **dos enlaces**: uno **Aprueba** y otro **Rechaza**. Cada enlace apunta a una **Supabase Edge Function** (u otro endpoint seguro) que valida un **token firmado** (incluye `request_id`, acción y caducidad), actualiza `citador_access_requests` y muestra una página HTML simple de confirmación (“Acceso aprobado” / “Solicitud rechazada”). Así el admin **no entra al Dashboard ni a la app** para decidir. Las rutas deben usar HTTPS y tokens **de corta vida** (y opcionalmente un solo uso guardando un nonce en BD si se quiere máxima seguridad).
- **Sesión:** el cliente React mantiene la sesión con el SDK de Supabase; rutas que muestran proyectos o el editor exigen usuario autenticado **y** estado de acceso aprobado.
- **Propiedad de datos:** cada **proyecto pertenece a un único usuario** (`citador_projects.user_id` → `auth.users.id`). Las secciones y las FC pertenecen al proyecto; así, todo el árbol queda indirectamente asociado al dueño.
- **Seguridad en servidor:** políticas **RLS** en Supabase para que solo el `user_id` coincidente pueda leer/escribir sus filas en `citador_projects`, y que `citador_sections` / `citador_citation_sources` solo sean accesibles cuando el `project_id` corresponde a un proyecto del usuario (join o subconsulta sobre `citador_projects.user_id`). Las políticas deben ser coherentes con el estado `approved` en `citador_access_requests` (o tabla equivalente).

---

## Estructura de datos (tablas Supabase)

En la **misma base de datos** pueden convivir otros productos; todas las tablas de esta app llevan el prefijo **`citador_`** para evitar choques de nombres. En código (`src/lib/tables.ts`) se centralizan los nombres exactos.

Relación resumida:

```
auth.users (Supabase Auth)
    └── citador_access_requests (user_id)     -- solicitud / estado de autorización
    └── citador_projects (user_id)
            ├── citador_sections (project_id)
            └── citador_citation_sources (project_id)
```

### `citador_access_requests`

Registra quién pidió entrar y si fue autorizado. El alta puede hacerse por trigger al primer login o desde la app al pulsar “Solicitar acceso”.

```sql
id           uuid PK
user_id      uuid NOT NULL UNIQUE FK → auth.users(id)   -- una fila por usuario; tras `rejected`, nueva solicitud = UPDATE a `pending` (o nuevo registro si se desea historial en otra tabla)
email        text              -- copia del correo para listados admin (opcional siempre derivable del JWT)
status       text NOT NULL     -- 'pending' | 'approved' | 'rejected'
message      text              -- mensaje opcional del solicitante
admin_note   text              -- motivo si rechazo (opcional)
requested_at timestamp
reviewed_at  timestamp
reviewed_by  uuid FK → auth.users(id)   -- administrador que aprobó/rechazó (opcional)
```

**Administración:**

1. **Principal:** correo automático al admin con enlaces **Aprobar** / **Rechazar** (Edge Function + servicio de correo transaccional, p. ej. Resend, SendGrid o similar). Los usuarios **no** pueden forzar `approved` desde el cliente; solo la función con **service role** o política muy restrictiva escribe ese cambio.
2. **Opcional / respaldo:** editar la fila manualmente en **Supabase Table Editor** si falla el correo.
3. **Opcional:** pantalla `AdminAccessReview` en la app (solo si el correo coincide con el admin); no es necesaria si el flujo por correo cubre todo el caso de uso.

### `citador_projects`

Cada fila es un trabajo de tesis (o documento) **propiedad del usuario autenticado**. No hay proyectos “huérfanos”: al crear un proyecto se asigna siempre `user_id = auth.uid()`.

```sql
id          uuid PK
name        text
created_at  timestamp
updated_at  timestamp
user_id     uuid NOT NULL FK → auth.users(id)   -- dueño del proyecto; obligatorio
```

### `citador_sections`

Pertenecen a un proyecto; el acceso efectivo lo define la pertenencia del proyecto al usuario.

```sql
id          uuid PK
project_id  uuid NOT NULL FK → citador_projects(id) ON DELETE CASCADE
title       text
content     jsonb        -- contenido Tiptap (formato JSON)
sort_order  integer      -- orden de las secciones (drag & drop); en Postgres no usar la palabra reservada "order"
created_at  timestamp
updated_at  timestamp
```

### `citador_citation_sources` (las FC)

Misma regla: visibilidad vía `project_id` → `citador_projects.user_id`.

```sql
id              uuid PK
project_id      uuid NOT NULL FK → citador_projects(id) ON DELETE CASCADE
code            text        -- ej. "AS145"; lo escribe el usuario a mano (único dentro del proyecto)
display_ref     text        -- ej. "Gomez, 1990" (lo que va al doc exportado)
description     text        -- descripción breve que identifica la cita
doc_title       text        -- título del documento origen
doc_authors     text        -- autores
doc_year        integer     -- año
source_fragment text        -- fragmento del texto origen en que se basó
notes           text        -- notas propias del usuario sobre cómo usar esta FC
created_at      timestamp
```

### (virtual) `citation_usages`

No es una tabla separada — los usos se calculan buscando el `code` dentro del `content` jsonb de todas las filas de `citador_sections` del proyecto. Se puede implementar como una Supabase function o calcularlo en el frontend.

### Exportación Word (comportamiento acordado)

- **Alcance:** un único archivo `.docx` con **todas las secciones del proyecto** concatenadas según `sort_order`.
- **Nombre del archivo:** **nombre del proyecto** (sanitizado para sistema de archivos: sin caracteres raros, espacios → guiones o similar) **seguido de fecha y hora** del momento de exportación para versionar sin ambigüedad. Ejemplo: `Mi-Tesis-Doctoral_2026-05-01_143052.docx` (formato exacto `YYYY-MM-DD` + `_` + `HHmmss` u otro equivalente claro en código).

---

## Interfaz principal (layout)

Pantalla de trabajo **después del login** (`ProjectLayout`): escritorio en **tres columnas** más **barra superior** fija.

| Zona | Contenido |
| --- | --- |
| **Barra superior** | Título de la app y/o **nombre del proyecto activo**; acciones globales discretas (p. ej. exportar `.docx` cuando aplique); **información del usuario** (correo o avatar) y acceso a cerrar sesión (`UserMenu`). |
| **Barra lateral izquierda** | **Proyectos y secciones**: selector o lista de proyectos del usuario; debajo, las **secciones del proyecto abierto** — seleccionar la activa, crear, renombrar y reordenar (`SectionsSidebar` / parte de `ProjectList` según implementación). Actúa como índice del documento. |
| **Área central** | **Editor de la sección seleccionada** (`TiptapEditor`): toolbar de formato (negrita, cursiva, encabezados, etc.) y cuerpo amplio del texto. Sin sección seleccionada: estado vacío (“elige o crea una sección”). |
| **Barra lateral derecha** | **Todas las fuentes de cita del proyecto** (`CitationPanel`): listado con tarjetas (`CitationCard`), alta/edición de FC, **insertar cita en la posición del cursor** en el editor. |

**Interacción complementaria:** un clic sobre un **código de cita en el texto** abre el **modal** (`CitationModal`) con el detalle completo de la FC, sin sustituir el panel derecho.

Esquema ASCII:

```
┌─────────────────────────────────────────────────────────────────┐
│  Título / proyecto actual              acciones      usuario ▾  │
├──────────┬──────────────────────────────────────┬───────────────┤
│ Proyectos│                                      │ Fuentes de    │
│ · …      │        Editor (sección activa)       │ cita (FC)     │
│          │                                      │ · tarjetas    │
│ Secciones│                                      │ · + nueva FC  │
│ · §1     │                                      │               │
│ · §2     │                                      │               │
└──────────┴──────────────────────────────────────┴───────────────┘
```

La pantalla de **login** (`LoginPage`) es independiente: sin sidebar de tres columnas, solo flujo de autenticación (p. ej. “Continuar con Google”).

---

## Componentes principales (estructura React)

```
/src
  /components
    LoginPage           -- login (botón Google + redirect OAuth); sin sesión → aquí
    AccessPendingPage   -- sesión OK pero solicitud pendiente o rechazada; formulario “solicitar acceso”
    AuthGuard           -- sin sesión → LoginPage; sin acceso aprobado → AccessPendingPage
    AdminAccessReview   -- (opcional) lista pending en la app si se desea alternativa al correo
    UserMenu            -- cerrar sesión y datos mínimos del perfil (opcional)
    ProjectList         -- proyectos del usuario actual; crear/abrir (filtrado por user_id)
    ProjectLayout       -- layout cabecera + izquierda + centro + derecha (véase «Interfaz principal»)
    SectionsSidebar     -- lista de secciones, drag & drop, renombrar
    TiptapEditor        -- editor rico con extensión de nodos de cita
    CitationPanel       -- panel lateral derecho con lista de FC
    CitationCard        -- card individual de una FC (expandible)
    CitationModal       -- modal al hacer clic en un código en el texto
    ExportButton        -- genera y descarga el .docx completo + nombre con versión automática
  /extensions
    CitationNode        -- extensión Tiptap para los nodos de cita clicables
  /lib
    supabase.ts         -- cliente Supabase + helpers de sesión (getSession, etc.)
    export.ts           -- Word: todas las secciones en orden + `{nombreProyecto}_{fecha}_{hora}.docx`
  /hooks
    useAuth.ts          -- usuario actual, loading, signInWithGoogle, signOut
    useProject.ts       -- CRUD proyectos del usuario autenticado
    useSections.ts
    useCitationSources.ts
    useAccessRequest.ts -- estado solicitud / crear solicitud / polling o realtime

/supabase/functions (ejemplo)
  notify-access-request   -- tras nueva solicitud: enviar correo al admin con enlaces firmados
  access-decision         -- GET con token: aplicar approve o reject y responder HTML simple
```

---

## Funcionalidades por orden de prioridad

1. **Core (MVP):**
  - Auth con Supabase: **Google OAuth** como método principal; proyectos **siempre ligados** al `user_id` del usuario logueado
  - Flujo **solicitud de acceso en la app** + **correo al admin con enlaces Aprobar/Rechazar** (Edge Function + token firmado) antes de usar datos de proyecto (`citador_access_requests` + RLS)
  - RLS en tablas para que cada usuario solo vea y edite sus propios proyectos (y datos hijos), coherente con acceso aprobado
  - Exportación **única** `.docx` con **todo el proyecto** (secciones en orden); nombre: **proyecto + timestamp fecha-hora**
  - Crear/abrir proyectos (lista filtrada por dueño)
  - Crear, renombrar, reordenar secciones
  - Editor Tiptap con formato básico (bold, italic, headings)
  - CRUD de Fuentes de Cita (FC)
  - Insertar código de cita en el texto como nodo clicable
  - Clic en código → modal con FC completa
  - Guardado automático (debounce)
2. **Segunda iteración:**
  - Trazabilidad: desde FC ver en qué secciones aparece
  - Tablas en el editor (Tiptap lo soporta nativamente)
  - Imágenes en el editor
3. **Tercera iteración:**
  - Búsqueda dentro del proyecto
  - Pulidos de exportación (estilos Word, portada, índice) si hiciera falta

---

## Decisiones de diseño ya tomadas

- **Despliegue en desarrollo:** sitio servido en **GitHub Pages** desde el repo en GitHub; OAuth debe incluir esa URL además de `localhost` si se prueba en ambos entornos
- **Idioma de la interfaz:** **español** (textos de la UI, mensajes de error orientados al usuario, etiquetas)
- **Layout:** barra superior (título + usuario), sidebar izquierdo (proyectos y secciones), centro (editor), sidebar derecho (fuentes de cita); modal para detalle al clicar una cita en el texto
- **UI compacta**, pensada para **PC y tablet grande**, sin foco en móvil en el MVP
- Acceso por **cuenta Google** (Supabase Auth); identidad = fila en `auth.users`; **primera vez** exige **solicitud + aprobación**; el admin decide desde **enlaces en un correo** (alternativa: Table Editor); correo destino configurado como **`VITE_ADMIN_EMAIL`** (visible en cliente para la UI si hace falta) y/o copia solo en **secretos de Edge Function** para envíos; si rechazan, **puede volver a solicitar**
- **Nombre del `.docx` exportado:** nombre del proyecto + **fecha y hora** automáticas (no contador en BD)
- **Multi-tenant por usuario:** un proyecto no se comparte entre usuarios en el MVP (sin organizaciones ni invitaciones)
- Los códigos de cita NO son texto plano — son nodos Tiptap custom (no editables a mano en el párrafo)
- El campo `code` de una FC lo **escribe el usuario a mano** al crear la fuente; debe ser **único dentro del proyecto**
- El formato de exportación es `(display_ref)` — ej. `(Gomez, 1990)` — sin el ID interno
- El contenido de las secciones se guarda como JSON (formato nativo de Tiptap), no como HTML ni Markdown
- Guardado automático con debounce de ~1.5s para no saturar Supabase en cada keystroke

---

## Lo que esta app NO es

- No reemplaza Zotero para gestión bibliográfica completa
- No tiene colaboración en tiempo real (por ahora)
- No formatea automáticamente en APA/Chicago — el `display_ref` lo escribe el usuario

