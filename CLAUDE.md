# CLAUDE.md — ActivaCom

## Descripción del Proyecto

ActivaCom es una plataforma SaaS multi-tenant que permite a restaurantes, organizadores de eventos y grupos musicales capturar datos de contacto de sus asistentes/clientes mediante eventos interactivos (rifas, PhotoDrop), para después ejecutar campañas de marketing directo (SMS, email). Opera exclusivamente en México y debe cumplir con la LFPDPPP.

## Stack Tecnológico

- **Frontend:** React 19+ con Vite, TypeScript estricto, Tailwind CSS, shadcn/ui
- **Backend/BaaS:** Supabase (PostgreSQL con RLS, Auth, Storage, Realtime, Edge Functions con Deno)
- **Hosting:** Cloudflare Pages
- **SMS:** Twilio (post-MVP)
- **Email:** Resend (post-MVP)
- **CAPTCHA:** Cloudflare Turnstile
- **Pagos (post-MVP):** Stripe o Conekta

## Arquitectura

### Monorepo con 4 apps + paquetes compartidos

La arquitectura separa las apps por audiencia y requerimiento de rendimiento. Las apps orientadas al público (register, display) deben ser ultra-ligeras porque se usan en móviles y proyectores en contextos con potencialmente miles de usuarios simultáneos.

```
activacom/
├── apps/
│   ├── web/                    # Panel admin (app.activacom.mx)
│   │   ├── src/
│   │   │   ├── components/     # Componentes React
│   │   │   │   ├── ui/         # shadcn/ui components
│   │   │   │   ├── layout/     # Sidebar, Header, etc.
│   │   │   │   ├── events/     # Componentes de eventos
│   │   │   │   ├── forms/      # Form builder, form renderer
│   │   │   │   ├── moderation/ # Panel de moderación
│   │   │   │   ├── campaigns/  # Campañas (post-MVP)
│   │   │   │   └── admin/      # Componentes super admin
│   │   │   ├── pages/          # Páginas/rutas
│   │   │   │   ├── auth/       # Login, register
│   │   │   │   ├── dashboard/  # Dashboard tenant
│   │   │   │   ├── events/     # CRUD eventos, detalle, participantes
│   │   │   │   ├── moderation/ # Vista moderador
│   │   │   │   ├── settings/   # Config tenant
│   │   │   │   └── admin/      # Panel super admin
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── lib/            # Utilidades, Supabase client, helpers
│   │   │   ├── types/          # TypeScript types/interfaces
│   │   │   ├── stores/         # Estado global (zustand)
│   │   │   └── App.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   └── package.json
│   │
│   ├── register/               # App pública de registro (go.activacom.mx)
│   │   ├── src/                # ULTRA-LIGERA: solo lo necesario para registro
│   │   │   ├── components/     # FormRenderer, PhotoCapture, AdBanner, ThankYou
│   │   │   ├── pages/          # Solo 5 rutas: /r/:slug, /e/:code, thank-you, verify, unsubscribe
│   │   │   ├── lib/            # Supabase client mínimo (solo fetch a Edge Functions, NO Realtime)
│   │   │   ├── types/          # Solo tipos necesarios para registro
│   │   │   └── App.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   ├── display/                # Display App (display.activacom.mx)
│   │   ├── src/                # ULTRA-LIGERA: solo renderizar contenido
│   │   │   ├── components/     # DisplayScreen, PhotoQueue, QRCode, WinnerScreen, AuthScreen
│   │   │   ├── hooks/          # useRealtime, usePhotoQueue, useHeartbeat
│   │   │   ├── lib/            # Supabase client (solo Realtime + fetch)
│   │   │   ├── types/
│   │   │   └── App.tsx
│   │   ├── index.html
│   │   ├── vite.config.ts
│   │   └── package.json
│   │
│   └── landing/                # Landing page (activacom.mx)
│       ├── src/                # Sitio de marketing estático
│       │   ├── components/     # Hero, Features, Pricing, CTA, Footer
│       │   ├── assets/         # Imágenes, ilustraciones
│       │   ├── lib/
│       │   └── App.tsx
│       ├── index.html
│       ├── vite.config.ts
│       └── package.json
│
├── packages/
│   └── shared/                 # Tipos y utilidades compartidas entre TODAS las apps
│       ├── src/
│       │   ├── types/          # Tipos compartidos (Event, Contact, FormField, etc.)
│       │   ├── constants/      # Constantes (event types, statuses, limits, etc.)
│       │   └── utils/          # Funciones puras compartidas (validación, formateo)
│       ├── package.json
│       └── tsconfig.json
│
├── supabase/
│   ├── migrations/             # SQL migrations
│   │   └── 001_initial_schema.sql
│   ├── functions/              # Edge Functions
│   │   ├── register-participant/
│   │   ├── upload-photo/
│   │   ├── verify-contact/
│   │   ├── authorize-display/
│   │   └── select-winner/
│   ├── seed.sql                # Datos de prueba
│   └── config.toml
│
├── docs/                       # Documentación
│   └── architecture.pdf
│
├── .env.example
├── package.json                # Root package.json (workspaces)
├── pnpm-workspace.yaml
├── tsconfig.base.json
├── CLAUDE.md                   # Este archivo
└── README.md
```

### Subdominios y Apps

| Subdominio | App | Propósito | Bundle Target |
|---|---|---|---|
| `activacom.mx` | `apps/landing` | Landing page / marketing | <50KB |
| `app.activacom.mx` | `apps/web` | Panel admin (tenant, super admin, moderadores) | ~300-500KB |
| `go.activacom.mx` | `apps/register` | Registro público de participantes (formulario, QR) | <120KB |
| `display.activacom.mx` | `apps/display` | Pantalla de evento para TV/proyector | <80KB |

### ¿Por qué 4 apps separadas?

- **`apps/register` separada de `apps/web`:** El participante escaneando un QR en un concierto no necesita cargar React Router complejo, Zustand, React Query, shadcn/ui completo, ni nada del panel admin. Separarlo garantiza que el formulario cargue en <2 segundos en 3G. Esta es la experiencia más crítica del producto — si tarda, la gente no se registra.
- **`apps/display` separada:** La pantalla del proyector no necesita autenticación completa ni lógica de negocio. Solo escucha Realtime y renderiza.
- **`apps/landing` separada:** Es marketing puro, estático, SEO-friendly. No necesita Supabase ni lógica de app.
- **`apps/web` es la única "pesada":** Y está bien porque la usan admins en desktop con buena conexión.

### Dependencias por App

| Dependencia | web | register | display | landing |
|---|---|---|---|---|
| react, react-dom | ✅ | ✅ | ✅ | ✅ |
| react-router-dom | ✅ (completo) | ✅ (mínimo, 5 rutas) | ❌ | ❌ |
| @supabase/supabase-js | ✅ (completo) | ✅ (solo fetch) | ✅ (solo Realtime) | ❌ |
| @tanstack/react-query | ✅ | ❌ | ❌ | ❌ |
| zustand | ✅ | ❌ | ❌ | ❌ |
| react-hook-form + zod | ✅ | ✅ | ❌ | ❌ |
| shadcn/ui | ✅ (completo) | ❌ (estilo propio mínimo) | ❌ | ❌ |
| tailwindcss | ✅ | ✅ | ✅ | ✅ |
| lucide-react | ✅ | ✅ (pocos iconos) | ❌ | ✅ (pocos iconos) |
| qrcode.react | ✅ (preview) | ❌ | ✅ | ❌ |
| recharts | ✅ | ❌ | ❌ | ❌ |
| papaparse | ✅ | ❌ | ❌ | ❌ |
| @shared/* | ✅ | ✅ | ✅ | ❌ |

### Routing por App

**apps/web (app.activacom.mx):**
```
/auth/login                     → Login de tenants/admins
/auth/register                  → Registro de nuevo tenant

/dashboard                      → Dashboard del tenant (métricas)
/events                         → Lista de eventos del tenant
/events/new                     → Crear nuevo evento
/events/:id                     → Detalle del evento (participantes, config)
/events/:id/moderate            → Panel de moderación de fotos
/events/:id/display-control     → Controles de la pantalla display

/contacts                       → Lista de contactos del tenant
/campaigns                      → Campañas de marketing (post-MVP)
/settings                       → Configuración del tenant

/admin                          → Panel super admin
/admin/tenants                  → Gestión de tenants
/admin/ads                      → Gestión de publicidad
/admin/credits                  → Gestión de créditos
```

**apps/register (go.activacom.mx):**
```
/r/:slug                        → QR fijo de restaurante → redirige a evento activo
/e/:code                        → Evento puntual → formulario de registro
/e/:code/thank-you              → Página de agradecimiento + ads
/verify/:token                  → Verificación de email/phone
/unsubscribe/:token             → Opt-out de marketing
```

**apps/display (display.activacom.mx):**
```
/:eventCode                     → Pantalla del evento (única ruta, sin router)
```

**apps/landing (activacom.mx):**
```
/                               → Landing page (single page, sin router)
```

## Roles del Sistema

| Rol | Descripción | Acceso |
|---|---|---|
| `super_admin` | Administrador de ActivaCom | Todo. Cross-tenant. |
| `tenant_admin` | Dueño del restaurante/organizador | Su tenant: eventos, contactos, campañas, config. |
| `moderator` | Moderador de contenido | Solo panel de moderación de fotos de su tenant. |
| Participante | Usuario final sin cuenta | Solo páginas públicas (/r/, /e/). No se autentica en Supabase Auth. |

## Base de Datos (Supabase PostgreSQL)

### Principios de RLS

- Cada tabla con datos de tenant tiene columna `tenant_id`.
- RLS policies filtran por `tenant_id` del usuario autenticado: `tenant_id = (SELECT tenant_id FROM users WHERE id = auth.uid())`.
- Participantes NO se autentican. Sus datos se insertan via Edge Functions con service_role key.
- Super admins acceden cross-tenant via rol en metadata del JWT.
- La tabla `ads` es global, lectura pública.

### Schema SQL

El schema completo está en `supabase/migrations/001_initial_schema.sql`. Tablas principales:

- **tenants** — Cada organización/cliente. Campos: name, slug (para URLs /r/{slug}), type, plan (free/basic/premium), credit_balance, is_active.
- **users** — Usuarios autenticados vinculados a un tenant. Roles: super_admin, tenant_admin, moderator.
- **events** — Eventos creados por tenants. Tipos: raffle, photo_drop. Estados: draft, active, closed, archived. Config de QR (fixed/rotating), foto (camera/gallery/both), geofencing, aviso de privacidad.
- **form_fields** — Campos dinámicos del formulario de cada evento. field_type (text/email/phone/number/select/textarea), is_contact_field (para dedup), sort_order.
- **contacts** — Contactos deduplicados por tenant. UNIQUE(tenant_id, email) y UNIQUE(tenant_id, phone). Al menos email o phone debe existir. Flags: email_verified, phone_verified, marketing_opt_in, opted_out.
- **event_registrations** — Registros de participación. UNIQUE(event_id, contact_id). Guarda form_data como JSONB.
- **photos** — Fotos de PhotoDrop. Status: pending/approved/rejected. Expiran a los 30 días.
- **event_winners** — Ganadores seleccionados.
- **display_sessions** — Sesiones de dispositivos de display autorizados. Device token de 6 dígitos, session_token, heartbeat.
- **credit_transactions** — Historial de créditos (compras, consumos).
- **licenses** — Licencias/suscripciones de tenants.
- **ads** — Publicidad gestionada por ActivaCom (super admin).
- **ad_impressions** — Impresiones y clicks de ads.
- **campaigns** — Campañas de marketing (post-MVP).
- **campaign_messages** — Mensajes individuales de cada campaña (post-MVP).
- **verification_tokens** — Tokens para verificar email/phone post-registro.

### Relaciones Clave

```
tenants 1──N users
tenants 1──N events
tenants 1──N contacts
tenants 1──N credit_transactions
tenants 1──N licenses
events  1──N form_fields
events  1──N event_registrations
events  1──N photos
events  1──N event_winners
events  1──N display_sessions
contacts 1──N event_registrations
event_registrations 1──N photos (1 foto por registro normalmente)
contacts 1──N verification_tokens
```

## Tipos de Evento

### Rifa (raffle)
- Formulario dinámico definido por el tenant.
- Participante escanea QR → llena formulario → registrado.
- Tenant cierra rifa → selecciona ganador (random o manual).
- Opcionalmente muestra ganador en pantalla display.

### PhotoDrop (photo_drop)
- Todo lo de Rifa + solicita una foto.
- Foto puede ser de cámara, galería, o ambas (configurable).
- Fotos pasan por moderación (manual en MVP).
- Fotos aprobadas se muestran en pantalla display en rotación.
- Cola de fotos con tiempo configurable por foto.

## Flujo de Registro de Participante

Todo este flujo ocurre en `apps/register` (go.activacom.mx), nunca en la app admin.

1. Participante escanea QR → llega a `go.activacom.mx/r/{slug}` (fijo) o `go.activacom.mx/e/{code}` (puntual).
2. `/r/{slug}` busca el evento activo del tenant por slug → redirige a `/e/{code}`.
3. Si no hay evento activo → muestra "No hay eventos activos".
4. Si geofencing activo → pide ubicación → valida radio.
5. Verifica si ya participó (por email o phone en el mismo evento) → "Ya estás registrado".
6. Si participó en evento anterior del mismo tenant → pre-carga datos → confirmar/actualizar.
7. Muestra formulario dinámico + checkbox aviso privacidad (obligatorio) + checkbox marketing opt-in (opcional) + ads.
8. Submit → Edge Function `register-participant`: valida, Turnstile, rate limit, dedup contacto, crea registro.
9. Si es PhotoDrop → captura/upload foto → Edge Function `upload-photo`: comprime, guarda en Storage, status pending.
10. Redirige a página de agradecimiento con ads.

### Principios de rendimiento de apps/register
- NO usa React Query, Zustand, shadcn/ui completo, ni dependencias pesadas.
- Formularios con react-hook-form + zod (necesario para validación dinámica).
- Supabase client solo para llamar Edge Functions (fetch). NO Realtime, NO Auth.
- Estilo propio con Tailwind (no shadcn). Componentes mínimos y atractivos hechos a medida.
- Target: <120KB bundle total. Carga en <2 segundos en 3G.
- Mobile-first: 95% de los participantes estarán en celular.

## Display App (display.activacom.mx)

### Autorización por Device Token
1. Tenant genera código de 6 dígitos desde su panel (expira 5 min).
2. Display App muestra campo de input al cargar.
3. Ingresa código → Edge Function `authorize-display` valida → retorna session_token.
4. session_token se guarda en memoria (NO localStorage).
5. Display App se suscribe a Supabase Realtime con session_token.
6. Heartbeat cada 30 segundos para mantener sesión viva.
7. Tenant puede revocar sesiones desde su panel.
8. Límite default: 3 dispositivos simultáneos por evento.

### Estados de la Pantalla
- **PLACEHOLDER** — Imagen placeholder + QR + ads.
- **PHOTOS** — Rota fotos aprobadas cada X segundos + QR.
- **WINNER** — Muestra placeholder de ganador + datos del ganador.
- **IDLE** — Placeholder sin QR (evento cerrado o sin evento activo).

El tenant controla el estado desde su panel en tiempo real.

### Principios de diseño Display App
- Bundle mínimo. Solo React + 1 componente principal + Supabase Realtime client.
- Sin routing complejo. Una sola vista que cambia de estado.
- Reconexión automática si pierde conexión.
- Buffer de datos en memoria para no mostrar pantalla en blanco.
- Responsive para diferentes resoluciones de proyector/TV.

## Estrategia de QR

| Caso | QR Mode | URL | Comportamiento |
|---|---|---|---|
| Restaurante | `fixed` | `go.activacom.mx/r/{tenantSlug}` | URL fija que redirige al evento activo. Se imprime 1 vez. |
| Evento puntual | `rotating` | `go.activacom.mx/e/{eventCode}` | URL única por evento. Nuevo QR por evento. |

Para eventos con QR rotating, opcionalmente se puede agregar `?t={tokenRotativo}` que rota cada X minutos en la pantalla display. La validación del token es opcional y configurable por evento.

## Seguridad

- **Rate limiting:** 1 registro por email/phone por evento. 10 intentos por IP por minuto. Cloudflare Turnstile (CAPTCHA invisible).
- **Fotos:** 1 foto por registro. Max 5MB. Validación MIME server-side. Moderación obligatoria antes de display.
- **Multi-tenant:** RLS estricto. JWT con tenant_id. Participantes via Edge Functions con service_role.
- **Display:** Device Token de 6 dígitos, sesiones revocables, heartbeat monitoring.
- **HTTPS:** Everywhere via Cloudflare.
- **Honeypot fields** en formularios de registro para detectar bots.

## Cumplimiento LFPDPPP (México)

- Cada evento DEBE tener aviso de privacidad configurado. No se puede activar sin él.
- Checkbox "Acepto aviso de privacidad" obligatorio y NO pre-marcado.
- Checkbox "Acepto recibir comunicaciones" opcional y NO pre-marcado.
- Se guarda timestamp e IP del consentimiento.
- Cada SMS/email incluye link de opt-out.
- El tenant es responsable del tratamiento. ActivaCom es encargado (procesador).
- Fotos se auto-borran a los 30 días.

## Convenciones de Código

### General
- TypeScript estricto (`strict: true`). No `any` a menos que sea absolutamente necesario.
- Functional components con hooks. No class components.
- Named exports, no default exports (excepto páginas para lazy loading).
- Barrel exports (`index.ts`) por carpeta de componentes.

### Naming
- **Archivos componentes:** PascalCase → `EventCard.tsx`, `FormBuilder.tsx`
- **Archivos utilidades/hooks:** camelCase → `useEvents.ts`, `formatDate.ts`
- **Tipos:** PascalCase con sufijo descriptivo → `Event`, `EventFormData`, `CreateEventInput`
- **Variables/funciones:** camelCase
- **Constantes:** UPPER_SNAKE_CASE → `EVENT_TYPES`, `MAX_PHOTO_SIZE`
- **Tablas SQL:** snake_case plural → `events`, `form_fields`, `event_registrations`
- **Columnas SQL:** snake_case → `tenant_id`, `created_at`, `is_active`

### Imports
Orden: 1) React, 2) Librerías externas, 3) Componentes internos, 4) Hooks, 5) Utils/Types, 6) Estilos.

### Componentes
- Props tipadas con interface: `interface EventCardProps { event: Event; onSelect: (id: string) => void; }`
- Desestructurar props.
- Memoizar componentes pesados con `React.memo`.
- Custom hooks para lógica reutilizable (`useEvents`, `useContacts`, `useRealtime`).

### Estado
- **Local:** `useState` para estado de componente.
- **Global:** Zustand para estado cross-component (usuario autenticado, tenant actual, notificaciones).
- **Server state:** TanStack Query (React Query) para datos de Supabase. Cache, refetch, optimistic updates.

### Supabase
- Client singleton en cada app que lo necesite: `apps/web/src/lib/supabase.ts`, `apps/register/src/lib/supabase.ts`, `apps/display/src/lib/supabase.ts`.
- **apps/web:** Client completo (Auth, DB queries, Storage, Realtime para moderación).
- **apps/register:** Client mínimo. Solo para invocar Edge Functions via `supabase.functions.invoke()`. NO Auth, NO Realtime, NO queries directas.
- **apps/display:** Client para Realtime (suscripciones) + fetch para autorización.
- Funciones de datos en `apps/web/src/lib/api/` organizadas por dominio: `events.ts`, `contacts.ts`, `photos.ts`.
- Edge Functions para operaciones que requieren service_role: registro de participantes, upload de fotos, verificación.
- NUNCA exponer service_role key en el frontend de ninguna app.

### Formularios
- React Hook Form para gestión de formularios.
- Zod para validación de schemas.
- El form builder genera un schema Zod dinámico basado en form_fields del evento.

### Estilos
- Tailwind utility classes directamente en JSX.
- shadcn/ui como base de componentes (Button, Input, Card, Dialog, etc.).
- `cn()` helper (clsx + tailwind-merge) para conditional classes.
- Variantes de componentes con `cva` (class-variance-authority) si es necesario.

## Variables de Entorno

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi...

# Cloudflare Turnstile (solo usado en apps/register)
VITE_TURNSTILE_SITE_KEY=0x...

# URLs de las apps (para cross-linking)
VITE_APP_URL=https://app.activacom.mx
VITE_REGISTER_URL=https://go.activacom.mx
VITE_DISPLAY_URL=https://display.activacom.mx
VITE_LANDING_URL=https://activacom.mx
```

Para Edge Functions (no expuestas al frontend):
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
RESEND_API_KEY=...
```

## Dependencias Clave

### apps/web (panel admin)
```
react, react-dom, react-router-dom
@tanstack/react-query
zustand
react-hook-form, @hookform/resolvers, zod
@supabase/supabase-js
tailwindcss, @tailwindcss/forms
shadcn/ui components (instalados via CLI)
lucide-react (iconos)
qrcode.react (generación de QR para preview)
date-fns (formateo de fechas)
sonner (notificaciones toast)
recharts (gráficos del dashboard)
papaparse (exportación CSV)
```

### apps/register (registro público — MÍNIMO)
```
react, react-dom, react-router-dom (solo 5 rutas)
react-hook-form, @hookform/resolvers, zod (validación dinámica del formulario)
@supabase/supabase-js (solo para fetch a Edge Functions, NO Realtime)
tailwindcss (estilos propios, NO shadcn completo)
lucide-react (solo iconos necesarios, tree-shake)
```

### apps/display (pantalla — MÍNIMO)
```
react, react-dom (sin router)
@supabase/supabase-js (solo Realtime)
qrcode.react
tailwindcss
```

### apps/landing (marketing — MÍNIMO)
```
react, react-dom (sin router, single page)
tailwindcss
lucide-react (pocos iconos)
```

### Mantener mínimo. No agregar librerías innecesarias. Cada dependencia nueva en register o display debe justificarse.

## Comandos

```bash
pnpm install              # Instalar dependencias
pnpm dev                  # Desarrollo (todas las apps)
pnpm dev:web              # Solo panel admin
pnpm dev:register         # Solo app de registro público
pnpm dev:display          # Solo display app
pnpm dev:landing          # Solo landing page
pnpm build                # Build producción (todas)
pnpm build:web            # Build solo web
pnpm build:register       # Build solo register
pnpm build:display        # Build solo display
pnpm build:landing        # Build solo landing
pnpm lint                 # Linter
pnpm typecheck            # Type checking
```

## Consideraciones Importantes

1. **apps/register es la app más crítica del producto.** Las páginas de registro (go.activacom.mx) deben cargar en <2 segundos en mobile 3G. Bundle <120KB. No cargar NADA que no sea estrictamente necesario. Si una dependencia no es esencial para el registro, no la incluyas.

2. **apps/register NO usa shadcn/ui.** Tiene sus propios componentes ligeros con Tailwind. El diseño debe ser atractivo, moderno y generar confianza (la gente está dando datos personales). Mobile-first.

3. **apps/register NO usa Supabase Auth ni Realtime.** Solo hace fetch a Edge Functions. El participante nunca se autentica. Toda la lógica está en las Edge Functions.

4. **La Display App debe funcionar con conexión intermitente.** Reconnect automático, buffer de datos en memoria, nunca pantalla en blanco.

5. **El aviso de privacidad es bloqueante.** No permitir activar un evento sin aviso configurado.

6. **Deduplicación inteligente.** Al registrar un participante, buscar por email O por phone en contactos del tenant. Si existe, vincular al contacto existente. Si no, crear nuevo.

7. **Form fields dinámicos pero con detección de campos de contacto.** Cuando un form_field tiene `is_contact_field = true` y `contact_type = 'email'` o `'phone'`, el sistema sabe usarlo para deduplicación y campañas.

8. **Fotos se comprimen client-side antes de upload.** Usar canvas API para resize a max 1920px de ancho y comprimir a ~80% quality JPEG. Objetivo: <1MB por foto. Esto ocurre en apps/register.

9. **Supabase Realtime para la Display App.** Suscribirse a cambios en `photos` (WHERE event_id = X AND status = 'approved') y a `events` (para cambios de estado del display).

10. **Un tenant solo puede tener un evento `active` a la vez por defecto.** Pero el schema no lo limita a nivel de DB para permitir múltiples en el futuro. La restricción es a nivel de aplicación.

11. **Cross-linking entre apps.** El panel admin (apps/web) genera URLs de registro que apuntan a go.activacom.mx. Los QR codes apuntan a go.activacom.mx. Los controles de display generan URLs para display.activacom.mx. Usar las variables de entorno VITE_REGISTER_URL y VITE_DISPLAY_URL para construir estas URLs.

12. **packages/shared es el puente.** Tipos, constantes y utilidades puras que necesitan más de una app van en shared. Esto evita duplicación y mantiene consistencia. NUNCA poner dependencias de React en shared.

13. **Deploy independiente.** Cada app se despliega como un proyecto separado en Cloudflare Pages. Cada una tiene su propio dominio/subdominio. Pueden desplegarse independientemente (actualizar register sin tocar web, por ejemplo).

## Fases de Desarrollo

- **Fase 0:** Setup monorepo (4 apps), Supabase, Cloudflare, schema SQL, auth, layout base de apps/web + placeholder de apps/register y apps/landing.
- **Fase 1:** Rifa simple — CRUD eventos en apps/web + form builder + registro público en apps/register + dashboard + super admin básico.
- **Fase 2:** PhotoDrop + Display App — fotos + moderación en apps/web + captura en apps/register + apps/display completa con Device Token y Realtime.
- **Fase 3:** Ads + Créditos.
- **Fase 4:** Campañas de marketing (SMS/Email).
- **Fase 5:** Moderación automática (OpenAI).
- **Fase 6:** Pagos en línea.
- **Fase 7:** Landing page completa (apps/landing con contenido de marketing, SEO, etc.).
