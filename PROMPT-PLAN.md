# ActivaCom — Plan de Prompts para Claude Code

## Cómo usar este documento

Este documento contiene prompts numerados que ejecutarás en Claude Code en orden. Cada prompt construye sobre lo anterior. 

**Reglas:**
1. Ejecuta un prompt a la vez.
2. Revisa el resultado antes de pasar al siguiente.
3. Si algo falla, arréglalo con Claude Code antes de avanzar.
4. Los prompts marcados con 🔧 requieren acción manual tuya (configurar Supabase, Cloudflare, etc.).
5. Los prompts marcados con 📦 son prompts de código que Claude Code ejecutará.
6. Después de cada grupo de prompts, hay un ✅ checkpoint para verificar que todo funciona.

---

## FASE 0 — Setup y Fundamentos (3-4 días)

### 🔧 P0.1 — Crear proyecto Supabase (TÚ) - Listo

```
Acción manual:
1. Ve a https://supabase.com y crea un nuevo proyecto llamado "activacom".
2. Elige la región más cercana a México (us-east-1 o us-west-1).
3. Guarda:
   - Project URL (SUPABASE_URL)
   - anon public key (SUPABASE_ANON_KEY)
   - service_role key (SUPABASE_SERVICE_ROLE_KEY)
4. En Authentication > Providers, asegúrate de que Email está habilitado.
5. En Authentication > URL Configuration, configura:
   - Site URL: http://localhost:5173 (por ahora, luego será https://app.activacom.mx)
```

### 📦 P0.2 — Inicializar monorepo - Listo

```
Lee el CLAUDE.md para entender la arquitectura completa del proyecto ActivaCom.
Y considera que el directorio está completamente vacío, y listo para hacer el primer commit al repositorio.
Menciono lo anterior para que no pierdas tiempo checando dependencias (npm) pues no existe ninguna.

Inicializa el monorepo con pnpm workspaces con 4 apps:
- apps/web: React + Vite + TypeScript + Tailwind CSS v4 (panel admin)
- apps/register: React + Vite + TypeScript + Tailwind CSS v4 (registro público, ULTRA-LIGERO)
- apps/display: React + Vite + TypeScript + Tailwind CSS v4 (pantalla evento, ULTRA-LIGERO)
- apps/landing: React + Vite + TypeScript + Tailwind CSS v4 (landing page marketing)
- packages/shared: TypeScript puro para tipos y constantes compartidas
- supabase/: carpeta para migrations y edge functions

Configura:
- pnpm-workspace.yaml apuntando a apps/* y packages/*
- tsconfig.base.json en root con paths para @shared/*
- Cada app con su propio vite.config.ts (puertos de dev diferenciados: web=5173, register=5174, display=5175, landing=5176)
- Tailwind v4 en las 4 apps
- .env.example con las variables de entorno: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, VITE_TURNSTILE_SITE_KEY, VITE_APP_URL, VITE_REGISTER_URL, VITE_DISPLAY_URL, VITE_LANDING_URL
- .gitignore apropiado
- Scripts en root package.json: dev, dev:web, dev:register, dev:display, dev:landing, build, build:web, build:register, build:display, build:landing, lint, typecheck

Cada app debe mostrar un "Hello World" diferente que identifique claramente qué app es:
- web: "ActivaCom Admin Panel"
- register: "ActivaCom Registration"  
- display: "ActivaCom Display"
- landing: "ActivaCom Landing"

NO instales shadcn/ui todavía. Solo el monorepo base funcional.
```

### 📦 P0.3 — Instalar shadcn/ui y dependencias core - Listo

```
Instalar dependencias diferenciadas por app. Recuerda: register, display y landing deben ser ultra-ligeras.

En apps/web (panel admin) instala y configura:
1. shadcn/ui (usa el CLI, configura con Tailwind v4, New York style, zinc como color base)
2. Instala estos componentes de shadcn: button, input, label, card, dialog, dropdown-menu, table, tabs, badge, separator, toast (sonner), avatar, sheet, select, checkbox, textarea, form, alert, skeleton, tooltip, popover, command
3. Instala dependencias: react-router-dom, @tanstack/react-query, zustand, react-hook-form, @hookform/resolvers, zod, @supabase/supabase-js, lucide-react, qrcode.react, date-fns, recharts, papaparse
4. Configura React Query provider y React Router en App.tsx
5. Configura el helper cn() de tailwind-merge + clsx

En apps/register (registro público, MÍNIMO) instala:
1. react-router-dom (solo para 5 rutas)
2. react-hook-form, @hookform/resolvers, zod (validación dinámica)
3. @supabase/supabase-js (solo para invocar Edge Functions)
4. lucide-react (tree-shakeable)
5. NO shadcn/ui, NO React Query, NO Zustand. Esta app construye sus propios componentes ligeros con Tailwind.
6. Configura React Router con las 5 rutas: /r/:slug, /e/:code, /e/:code/thank-you, /verify/:token, /unsubscribe/:token

En apps/display instala:
1. @supabase/supabase-js (para Realtime)
2. qrcode.react
3. NO router, NO shadcn, NO React Query

En apps/landing instala:
1. lucide-react (pocos iconos)
2. NO router (single page), NO Supabase, NO shadcn
3. Solo React + Tailwind

En packages/shared:
1. Solo TypeScript puro, sin dependencias de React
```

### 📦 P0.4 — Supabase client y tipos compartidos - Listo

```
Crea la configuración de Supabase diferenciada por app y los tipos base del sistema:

1. packages/shared/src/types/database.ts:
   - Define todos los tipos TypeScript que mapean a las tablas de la DB (ver CLAUDE.md para el schema):
   - Tenant, User, Event, FormField, Contact, EventRegistration, Photo, EventWinner, DisplaySession, CreditTransaction, License, Ad, AdImpression, VerificationToken
   - Incluye los enums como types: EventType, EventStatus, QRMode, PhotoSource, PhotoStatus, UserRole, FieldType, ContactType, PlanType
   - Incluye tipos de input para crear/actualizar: CreateEventInput, UpdateEventInput, CreateFormFieldInput, etc.

2. packages/shared/src/constants/index.ts:
   - EVENT_TYPES, EVENT_STATUSES, QR_MODES, PHOTO_SOURCES, USER_ROLES, FIELD_TYPES, PLAN_TYPES
   - MAX_PHOTO_SIZE = 5 * 1024 * 1024 (5MB)
   - PHOTO_EXPIRE_DAYS = 30
   - DISPLAY_HEARTBEAT_INTERVAL = 30000 (30s)
   - DEVICE_CODE_EXPIRY = 5 * 60 * 1000 (5min)
   - MAX_DISPLAY_SESSIONS = 3

3. apps/web/src/lib/supabase.ts:
   - Client completo (Auth + DB + Storage + Realtime)
   - Tipado con los types de shared

4. apps/register/src/lib/supabase.ts:
   - Client MÍNIMO. Solo se usa para supabase.functions.invoke()
   - No necesita Auth, no necesita Realtime, no necesita queries directas
   - Helper functions: registerParticipant(data), uploadPhoto(data), etc. que wrappean las llamadas a Edge Functions

5. apps/display/src/lib/supabase.ts:
   - Client para Realtime (suscripciones a channels)
   - Función para autorizar display (fetch a Edge Function)
   - NO Auth
```

### 📦 P0.5 — Schema SQL completo - Listo

```
Crea el archivo supabase/migrations/001_initial_schema.sql con el schema completo de la base de datos.

Incluye TODAS las tablas documentadas en el CLAUDE.md:
- tenants, users, events, form_fields, contacts, event_registrations, photos, event_winners, display_sessions, credit_transactions, licenses, ads, ad_impressions, campaigns, campaign_messages, verification_tokens

Para cada tabla:
- Primary keys UUID con gen_random_uuid()
- Foreign keys con ON DELETE CASCADE donde corresponda
- CHECK constraints para enums (status, type, role, etc.)
- UNIQUE constraints (tenant+email, tenant+phone, event+contact, etc.)
- Índices para queries frecuentes
- Timestamps con TIMESTAMPTZ DEFAULT now()

Incluye las RLS policies:
- Enable RLS en todas las tablas
- Policies para tenants: SELECT, INSERT, UPDATE filtrado por tenant_id del usuario
- Policies para super_admin: acceso cross-tenant
- Policies para moderadores: solo fotos pending de su tenant
- Policies para ads: lectura pública
- Policies para display_sessions: lectura por session_token

Incluye funciones helper:
- get_user_tenant_id(): retorna el tenant_id del usuario autenticado
- get_user_role(): retorna el rol del usuario autenticado
- is_super_admin(): boolean

Al final del archivo agrega un bloque de seed data con:
- 1 tenant de prueba (slug: 'demo-restaurant', tipo: restaurant)
- 1 usuario tenant_admin vinculado
- 1 super_admin
```

### 🔧 P0.6 — Ejecutar migration en Supabase (TÚ) - Listo

```
Acción manual:
1. Ve a tu proyecto Supabase > SQL Editor
2. Copia y pega el contenido de supabase/migrations/001_initial_schema.sql
3. Ejecútalo
4. Verifica en Table Editor que todas las tablas se crearon correctamente
5. Verifica en Authentication > Users que puedes crear un usuario de prueba

Alternativa con CLI:
1. Instala Supabase CLI: npm install -g supabase
2. supabase login
3. supabase link --project-ref TU_PROJECT_REF
4. supabase db push
```

### 📦 P0.7 — Layout base y routing - Listo

```
Crea el layout base de apps/web (panel admin) y el placeholder de apps/register.

=== apps/web (panel admin) ===

1. Layout principal con sidebar para usuarios autenticados:
   - Sidebar con navegación: Dashboard, Eventos, Contactos, Campañas (deshabilitado), Configuración
   - Header con: nombre del tenant, avatar del usuario, dropdown con logout
   - Sidebar colapsable en mobile (sheet)
   - El sidebar debe distinguir entre tenant_admin y super_admin (links diferentes)
   - Para super_admin: Tenants, Publicidad, Créditos además de los normales

2. Routing con React Router:
   - Layout autenticado wrapeando rutas privadas
   - Auth guard que redirige a /auth/login si no hay sesión
   - Lazy loading de páginas con React.lazy + Suspense

3. Páginas placeholder (solo título y "Coming soon"):
   - /auth/login
   - /auth/register  
   - /dashboard
   - /events
   - /events/new
   - /events/:id
   - /settings
   - /admin (solo si super_admin)

4. Auth store con Zustand:
   - Estado: user, tenant, role, isLoading
   - Acciones: signIn, signOut, loadSession
   - Suscripción a onAuthStateChange de Supabase
   - Al cargar, fetch del usuario + tenant desde la tabla users

5. Página de login funcional:
   - Email + password
   - Usa Supabase Auth signInWithPassword
   - Redirige a /dashboard después de login
   - Manejo de errores

6. Página de registro funcional:
   - Nombre del negocio, tipo (restaurant/event_organizer/band/other), email, password
   - Al registrar: crea usuario en Supabase Auth → trigger/function que crea tenant + user con rol tenant_admin
   - O hazlo en dos pasos: 1) signUp en Auth, 2) insert en tenants + users via RPC o edge function

=== apps/register (registro público) ===

7. Estructura base con React Router para 5 rutas:
   - /r/:slug → placeholder "Cargando evento..."
   - /e/:code → placeholder "Formulario de registro"
   - /e/:code/thank-you → placeholder "Gracias"
   - /verify/:token → placeholder "Verificando..."
   - /unsubscribe/:token → placeholder "Darse de baja"
   - Diseño mobile-first, limpio, sin sidebar ni header pesado
   - Solo un header ligero con logo de ActivaCom

=== apps/landing ===

8. Placeholder simple:
   - Hero section con título "ActivaCom" y subtítulo descriptivo
   - Coming soon / Próximamente
   - Se completará en una fase posterior

Asegúrate de que TODAS las apps compilen sin errores y levanten correctamente.
```

### ✅ Checkpoint Fase 0 - Listo

```
Verifica:
- [ ] pnpm dev:web levanta sin errores en localhost:5173
- [ ] pnpm dev:register levanta sin errores en localhost:5174
- [ ] pnpm dev:display levanta sin errores en localhost:5175
- [ ] pnpm dev:landing levanta sin errores en localhost:5176
- [ ] Login funciona con usuario de prueba en apps/web
- [ ] Registro crea tenant + usuario correctamente en apps/web
- [ ] Sidebar muestra navegación correcta según rol en apps/web
- [ ] apps/register muestra rutas públicas sin layout de admin
- [ ] TypeScript compila sin errores (pnpm typecheck)
- [ ] Las tablas en Supabase tienen RLS habilitado
- [ ] packages/shared exporta tipos correctamente y todas las apps los importan
```

---

## FASE 1 — Rifa Simple (1.5-2 semanas)

### 📦 P1.1 — CRUD de Eventos - Listo

```
Implementa el CRUD completo de eventos para el tenant:

1. Página /events — Lista de eventos:
   - Tabla con: nombre, tipo, estado (badge con color), fecha creación, participantes count
   - Filtros: por estado (todos, draft, active, closed, archived)
   - Botón "Nuevo evento"
   - Click en evento → /events/:id

2. Página /events/new — Crear evento:
   - Formulario con pasos (stepper o tabs):
     - Paso 1 — Info básica: nombre, descripción, tipo (por ahora solo "raffle"), QR mode (fixed usa el slug del tenant, rotating genera código único)
     - Paso 2 — Formulario (se construye en P1.2)
     - Paso 3 — Privacidad: URL o texto del aviso de privacidad (OBLIGATORIO), checkbox marketing opt-in default
     - Paso 4 — Opciones: geofencing (on/off, lat/lng/radio), placeholder image upload
   - Al crear, estado = 'draft'
   - Validación con zod en cada paso

3. Página /events/:id — Detalle del evento:
   - Header con nombre, estado, botones de acción
   - Tabs: Resumen, Participantes, Configuración
   - Tab Resumen: métricas rápidas (registros totales, registros hoy), QR preview, link copiable
   - Tab Participantes: tabla con datos de registros, exportar CSV
   - Tab Configuración: editar evento (solo si draft o active)
   - Acciones según estado:
     - draft → "Activar evento" (valida que tenga aviso de privacidad y al menos 1 campo en formulario)
     - active → "Cerrar evento", "Seleccionar ganador"
     - closed → "Archivar", ver ganador

4. API layer en lib/api/events.ts:
   - getEvents(tenantId, filters)
   - getEvent(id)
   - createEvent(input)
   - updateEvent(id, input)
   - activateEvent(id) — cambia status a active, valida requisitos
   - closeEvent(id) — cambia status a closed, setea closed_at
   - archiveEvent(id)

5. Usa React Query para todas las queries y mutations con invalidación de cache apropiada.
```

### 📦 P1.2 — Form Builder dinámico - Ya

```
Implementa el form builder que permite al tenant definir los campos del formulario de su evento.

1. Componente FormBuilder:
   - Lista de campos arrastrables (drag & drop con @dnd-kit/core o simplemente botones de mover arriba/abajo)
   - Cada campo muestra: tipo, label, required badge, botones editar/eliminar
   - Botón "Agregar campo"
   - Al agregar, abre dialog para configurar:
     - Label (ej: "Nombre completo")
     - Tipo: text, email, phone, number, select, textarea
     - Placeholder (opcional)
     - Requerido sí/no
     - Es campo de contacto sí/no → si sí, ¿email o phone? (esto es clave para dedup y campañas)
     - Opciones (solo si tipo = select): lista de opciones
   - Preview en vivo del formulario al lado del builder

2. Sugiere campos predeterminados inteligentes al crear un evento:
   - Para todo evento: "Nombre" (text, required), "Email" (email, contact_field=email), "Teléfono" (phone, contact_field=phone)
   - El tenant puede eliminar o modificar estos campos
   - Al menos un campo de contacto (email o phone) debe existir — validar antes de activar evento

3. API en lib/api/formFields.ts:
   - getFormFields(eventId)
   - createFormField(input)
   - updateFormField(id, input)
   - deleteFormField(id)
   - reorderFormFields(eventId, orderedIds)

4. Integra el FormBuilder en el paso 2 de crear/editar evento.

5. Componente FormRenderer en apps/web (para preview SOLAMENTE):
   - Recibe un array de FormField y renderiza el formulario dinámicamente
   - Genera validación Zod dinámica basada en los campos (required, type email, type phone, etc.)
   - Usa React Hook Form + shadcn/ui components
   - Incluye automáticamente: checkbox aviso de privacidad + checkbox marketing opt-in
   - Este FormRenderer usa shadcn/ui y es para preview en el panel del tenant
   - NOTA: apps/register tendrá su PROPIO FormRenderer ligero (se construye en P1.4). No reutilizar este.
```

### 📦 P1.3 — Edge Function: Registro de participante - Ya

```
Crea la Edge Function supabase/functions/register-participant/index.ts que maneja el registro público de participantes.

Esta función se llama desde el frontend cuando un participante llena el formulario. Usa service_role key porque el participante NO está autenticado.

Flow:
1. Recibe: event_code, form_data (object), turnstile_token, ip_address (del header)
2. Valida Cloudflare Turnstile token contra la API de Turnstile
3. Busca el evento por event_code, verifica que esté activo
4. Rate limiting: verifica que esta IP no haya registrado más de 10 veces en los últimos 60 minutos (query a event_registrations por ip_address y created_at)
5. Extrae campos de contacto del form_data usando form_fields con is_contact_field=true
6. Deduplicación de contacto:
   a. Si hay email → busca contacto del tenant con ese email
   b. Si hay phone → busca contacto del tenant con ese phone
   c. Si encuentra contacto existente → actualiza nombre si cambió, respeta opt-in/opt-out existente
   d. Si NO encuentra → crea nuevo contacto
7. Verifica que el contacto no esté ya registrado en ESTE evento → si sí, retorna { already_registered: true, contact_name: ... }
8. Crea event_registration vinculando evento + contacto + form_data completo como JSONB
9. Si el contacto es nuevo o no tiene marketing_opt_in, actualiza según el checkbox del formulario
10. Retorna { success: true, registration_id, contact_id, is_returning: boolean }

Manejo de errores:
- Evento no encontrado o no activo → 404
- Turnstile inválido → 403
- Rate limit excedido → 429
- Ya registrado → 409 con datos para mostrar mensaje amigable
- Error de validación → 400 con detalle de campos

La función debe ser lo más rápida posible. Usa prepared statements donde sea posible.
```

### 📦 P1.4 — Página pública de registro (apps/register) - Ya

```
Implementa las páginas públicas en apps/register (go.activacom.mx) que los participantes ven al escanear el QR.

RECUERDA: apps/register es una app SEPARADA, ultra-ligera, mobile-first. No usa shadcn/ui, no usa React Query, no usa Zustand. Tiene sus propios componentes ligeros hechos con Tailwind.

1. Página /r/:slug (QR fijo de restaurante):
   - Fetch al endpoint de Supabase (via Edge Function o query directa con anon key) para buscar tenant por slug
   - Si no existe → 404 bonito y ligero
   - Busca el evento activo del tenant (status = 'active', el más reciente)
   - Si no hay evento activo → página bonita con "No hay eventos activos en este momento" + logo del tenant si tiene
   - Si hay evento activo → redirige a /e/{event_code}

2. Página /e/:code (formulario de registro):
   - Carga el evento por event_code + sus form_fields en una sola llamada (Edge Function que retorna todo)
   - Si no existe o no está activo → 404 bonito
   - Si geofencing activo → pide permiso de ubicación al navegador → valida que esté dentro del radio → si no, muestra error amigable
   - Verifica si el participante ya se registró:
     - Muestra un mini-formulario arriba: "¿Ya participaste antes? Ingresa tu email o teléfono para verificar"
     - Si ya participó en ESTE evento → "¡Ya estás registrado! Gracias por participar."
     - Si participó en evento ANTERIOR del tenant → pre-carga los datos en el formulario, permite actualizar
   - Renderiza el formulario dinámico (componente FormRenderer propio de apps/register) con:
     - Campos definidos por el tenant
     - Checkbox aviso de privacidad (link al aviso, OBLIGATORIO)
     - Checkbox opt-in marketing (OPCIONAL, no pre-marcado)
     - Cloudflare Turnstile widget (invisible)
     - Espacio para ads (placeholder div por ahora, texto "Espacio publicitario")
   - Submit → llama a Edge Function register-participant
   - Si éxito → redirige a /e/:code/thank-you
   - Loading states, error handling

3. Página /e/:code/thank-you:
   - Mensaje de agradecimiento personalizable (nombre del evento, nombre del participante)
   - Espacio para ads (placeholder por ahora)
   - Enlace "Verificar mi información" que después usaremos para confirmar email/phone

4. Componente FormRenderer (propio de apps/register, NO reutilizar el de apps/web):
   - Recibe un array de FormField y renderiza el formulario dinámicamente
   - Genera validación Zod dinámica basada en los campos (required, type email, type phone, etc.)
   - Usa React Hook Form
   - Diseño limpio, atractivo, mobile-first con Tailwind puro
   - Debe verse confiable — la gente está dando sus datos personales
   - NO usar shadcn/ui components aquí

IMPORTANTE sobre rendimiento:
   - La página /e/:code debe hacer UNA SOLA llamada a la API al cargar (evento + form_fields juntos)
   - No hay pre-fetching, no hay cache layers, no hay React Query. Fetch simple + estado local.
   - Target: formulario visible en <2 segundos en mobile 3G
   - El bundle de apps/register debe ser <120KB total
```

### 📦 P1.5 — Selección de ganador - Ya

```
Implementa la funcionalidad de seleccionar ganador de una rifa.

1. Edge Function supabase/functions/select-winner/index.ts:
   - Recibe: event_id, method ('random' o 'manual'), registration_id (solo si manual)
   - Verifica que el evento esté activo o cerrado
   - Verifica que el usuario autenticado sea tenant_admin del tenant dueño del evento
   - Si random: selecciona un registration al azar de ese evento usando ORDER BY random() LIMIT 1
   - Si manual: verifica que el registration_id pertenezca al evento
   - Inserta en event_winners
   - Retorna los datos del ganador (nombre, email/phone del contacto)

2. En la página /events/:id, agrega:
   - Botón "Seleccionar ganador" (solo visible si evento active o closed)
   - Dialog de confirmación: "¿Selección aleatoria o manual?"
     - Aleatoria: un click → muestra ganador con animación simple (reveal)
     - Manual: muestra lista de participantes → click para seleccionar → confirmar
   - Una vez seleccionado, muestra prominentemente el ganador en la tab de Resumen
   - Permitir seleccionar otro ganador (reemplaza al anterior, o acumula — decides si permitir múltiples ganadores)
```

### 📦 P1.6 — Dashboard del tenant - Ya

```
Implementa el dashboard principal del tenant en /dashboard.

1. Métricas principales (cards en la parte superior):
   - Total de contactos (únicos del tenant)
   - Eventos realizados (total closed + archived)
   - Evento activo (nombre + link, o "Sin evento activo")
   - Registros del evento activo (si hay)

2. Gráfico de registros por día (últimos 30 días):
   - Usa recharts, LineChart o BarChart simple
   - Query: count event_registrations agrupados por día

3. Últimos registros:
   - Tabla compacta con los últimos 10 registros: nombre, email/phone, evento, fecha
   - Link al evento

4. Acciones rápidas:
   - "Crear nuevo evento" → /events/new
   - "Ver contactos" → /contacts
   - "Exportar datos" → trigger descarga CSV de todos los contactos

El dashboard debe cargar rápido. Usa React Query con staleTime apropiado. Las queries deben estar optimizadas (no traer todos los registros, usar COUNT y aggregates).
```

### 📦 P1.7 — Panel Super Admin básico - Ya

```
Implementa el panel de super admin en /admin.

1. /admin — Dashboard global:
   - Total tenants activos
   - Total eventos creados (todos los tenants)
   - Total participantes registrados (global)
   - Tenants creados este mes

2. /admin/tenants — Gestión de tenants:
   - Tabla: nombre, slug, tipo, plan, créditos, estado, fecha creación
   - Filtros: por estado (activo/inactivo), por plan, por tipo
   - Acciones por tenant:
     - Activar/Desactivar
     - Cambiar plan (free/basic/premium)
     - Cargar créditos (dialog con input de monto + descripción)
     - Ver detalle → sub-página con eventos del tenant, contactos count, historial de créditos

3. Protección de rutas:
   - /admin/* solo accesible si user.role === 'super_admin'
   - Si no es super_admin, redirigir a /dashboard
   - En el sidebar, las opciones de admin solo aparecen para super_admin

4. RPC o query directa para métricas cross-tenant (el super admin tiene RLS que permite cross-tenant).
```

### 📦 P1.8 — Exportación CSV y lista de contactos - Ya

```
Implementa la gestión de contactos y la exportación de datos.

1. Página /contacts — Lista de contactos del tenant:
   - Tabla: nombre, email, phone, verificado (badges), opt-in marketing, eventos participados (count), fecha primer registro
   - Búsqueda por nombre, email, phone
   - Filtros: por opt-in, por verificado, por evento específico
   - Paginación (server-side, 50 por página)

2. Exportación CSV:
   - Botón "Exportar" en /contacts (exporta todos con filtros aplicados)
   - Botón "Exportar participantes" en /events/:id (exporta registros de ese evento)
   - Usa papaparse para generar CSV
   - Columnas: nombre, email, teléfono, email verificado, phone verificado, opt-in marketing, fecha registro, nombre del evento
   - Descarga directa del archivo

3. Detalle de contacto (dialog o drawer):
   - Info del contacto
   - Historial de eventos en los que participó
   - Si ganó alguna rifa
   - Toggle opt-out manual (por si pide darse de baja por otro medio)
```

### ✅ Checkpoint Fase 1

```
Verifica el flujo completo de una rifa:
- [ ] Crear evento tipo rifa con form builder (nombre, email, teléfono) en apps/web
- [ ] Configurar aviso de privacidad
- [ ] Activar evento
- [ ] Abrir go.activacom.mx/r/{slug} (o localhost:5174/r/{slug}) en el celular → ver formulario
- [ ] Registrarse → ver página de agradecimiento
- [ ] Registrarse de nuevo con mismo email → "Ya estás registrado"
- [ ] Ver el participante en /events/:id tab Participantes (apps/web)
- [ ] Seleccionar ganador aleatorio
- [ ] Cerrar evento
- [ ] Abrir /r/{slug} en apps/register → "No hay eventos activos"
- [ ] Crear nuevo evento, activar → /r/{slug} ahora muestra el nuevo
- [ ] Registrarse → datos pre-cargados del evento anterior
- [ ] Dashboard muestra métricas correctas
- [ ] Exportar CSV funciona
- [ ] Super admin ve el tenant y puede cargar créditos
- [ ] Bundle de apps/register es <120KB (verificar con vite build --report)
```

---

## FASE 2 — PhotoDrop + Display App (2-2.5 semanas)

### 📦 P2.1 — Extender eventos para PhotoDrop

```
Extiende la creación de eventos para soportar el tipo photo_drop.

1. En /events/new, agregar "PhotoDrop" como opción de tipo de evento.

2. Si tipo = photo_drop, mostrar paso adicional de configuración de foto:
   - Fuente de foto: camera / gallery / both (radio buttons)
   - Requerir foto: sí/no (toggle)
   - Tiempo de display por foto: slider o input (3-30 segundos, default 5)

3. En la página /events/:id, si es photo_drop:
   - Tab adicional: "Moderación" (link a /events/:id/moderate)
   - Tab adicional: "Pantalla" (link a /events/:id/display-control)
   - Métricas adicionales: fotos recibidas, fotos aprobadas, fotos rechazadas, fotos en cola

4. Actualizar los tipos en packages/shared para incluir los campos de PhotoDrop.
```

### 📦 P2.2 — Captura y upload de fotos (apps/register)

```
Implementa la captura y upload de fotos en apps/register (la página pública de registro).

1. Componente PhotoCapture (en apps/register/src/components/):
   - Si photo_source = 'camera': abre cámara del celular usando navigator.mediaDevices.getUserMedia o input type="file" capture="environment"
   - Si photo_source = 'gallery': input type="file" accept="image/*"
   - Si photo_source = 'both': ambas opciones
   - Preview de la foto antes de enviar
   - Compresión client-side:
     - Usa canvas para resize: max 1920px de ancho, mantener aspect ratio
     - Comprimir a JPEG 80% quality
     - Verificar que no exceda 5MB (MAX_PHOTO_SIZE)
     - Mostrar tamaño antes y después de compresión
   - IMPORTANTE: Este componente debe ser LIGERO. No usar librerías pesadas de manipulación de imágenes. Canvas nativo es suficiente.

2. Edge Function supabase/functions/upload-photo/index.ts:
   - Recibe: event_id, registration_id, photo (base64 o multipart)
   - Verifica que el evento esté activo y sea tipo photo_drop
   - Verifica que el registration existe y pertenece al evento
   - Verifica que no haya ya una foto para este registration (1 foto por registro)
   - Valida tipo MIME (solo image/jpeg, image/png, image/webp)
   - Valida tamaño (max 5MB)
   - Genera thumbnail (resize a 400px de ancho) — puedes usar sharp si está disponible en Deno, o hacer resize con canvas en el frontend y enviar ambas
   - Guarda en Supabase Storage bucket 'photos' con path: {tenant_id}/{event_id}/{registration_id}.jpg
   - Guarda thumbnail en: {tenant_id}/{event_id}/{registration_id}_thumb.jpg
   - Inserta en tabla photos con status 'pending', expires_at = now() + 30 días
   - Retorna { success: true, photo_id }

3. Integrar PhotoCapture en la página /e/:code de apps/register:
   - Aparece después de llenar el formulario (o como parte del formulario si require_photo = true)
   - Si require_photo = true, no puede enviar sin foto
   - Si require_photo = false, la foto es opcional

4. Crear el bucket 'photos' en Supabase Storage con policies:
   - Upload: solo via service_role (edge functions)
   - Read: público (para mostrar en display app) — o via signed URLs si quieres más seguridad
   - Delete: solo via service_role (edge functions y cron de limpieza)
```

### 📦 P2.3 — Panel de moderación

```
Implementa el panel de moderación de fotos en /events/:id/moderate.

1. Vista de moderación:
   - Grid de fotos con status 'pending' para el evento actual
   - Cada foto muestra: thumbnail, nombre del participante, hora de envío
   - Botones grandes y claros: ✅ Aprobar / ❌ Rechazar
   - Keyboard shortcuts: A = aprobar, R = rechazar, flechas = navegar (para velocidad)
   - Counter: "X fotos pendientes"

2. Realtime:
   - Suscribirse a cambios en photos WHERE event_id = X AND status = 'pending'
   - Nuevas fotos aparecen automáticamente sin refresh
   - Cuando otro moderador aprueba/rechaza, se actualiza en tiempo real

3. Al aprobar una foto:
   - UPDATE photos SET status = 'approved', moderated_by = user.id, moderated_at = now()
   - Esto dispara un evento Realtime que la Display App escucha

4. Al rechazar:
   - UPDATE photos SET status = 'rejected', moderated_by = user.id, moderated_at = now()
   - Opcionalmente borrar el archivo de Storage (o dejarlo para auditoría)

5. Acceso: tenant_admin y moderator del tenant pueden acceder.

6. Mobile-friendly: el moderador podría moderar desde su celular. Diseño responsive con botones grandes.
```

### 📦 P2.4 — Display App: autorización y estructura base

```
Implementa la Display App en apps/display.

1. Pantalla de autorización:
   - Al cargar, muestra un input centrado: "Ingresa el código de autorización"
   - Input de 6 dígitos (estilo OTP, 6 campos separados)
   - Botón "Conectar"
   - Logo de ActivaCom discreto

2. Edge Function supabase/functions/authorize-display/index.ts:
   - Recibe: device_code, event_id (extraído del URL)
   - Busca en display_sessions WHERE event_id = X AND device_code = Y AND status = 'pending' AND expires_at > now()
   - Si no encuentra → error 401 "Código inválido o expirado"
   - Verifica que no haya más de MAX_DISPLAY_SESSIONS activas para este evento
   - Actualiza la sesión: status = 'active', session_token = gen_random_uuid(), device_ip, device_info (user agent)
   - Retorna: { session_token, event config completo (nombre, placeholder_url, photo_display_seconds, qr config, etc.) }

3. Desde el panel del tenant (/events/:id/display-control), agregar:
   - Botón "Generar código de pantalla"
   - Al presionar: INSERT display_sessions (event_id, device_code = random 6 digits, status = 'pending', expires_at = now() + 5min)
   - Mostrar el código grande y claro + countdown de expiración
   - También mostrar la URL de la display app: display.activacom.mx/{eventCode}

4. En la Display App, una vez autorizado:
   - Guardar session_token en variable de estado (NO localStorage)
   - Guardar config del evento en estado
   - Transición a la pantalla principal
```

### 📦 P2.5 — Display App: pantalla principal y Realtime

```
Implementa la pantalla principal de la Display App.

1. Componente principal DisplayScreen:
   - Ocupa 100% del viewport (100vw x 100vh)
   - Sin scrollbars, sin UI de interacción (es para proyectar)
   - Fondo: color del tenant o imagen placeholder

2. Estados de display (controlados por el tenant):
   - PLACEHOLDER: Muestra imagen placeholder + QR + espacio para ads
   - PHOTOS: Muestra fotos aprobadas en rotación + QR
   - WINNER: Muestra placeholder de ganador + nombre/datos del ganador
   - IDLE: Placeholder simple sin QR (evento no activo)

3. Suscripciones Realtime:
   - Canal photos: escucha INSERT en photos WHERE event_id = X AND status = 'approved'
     → Agrega foto a la cola
   - Canal event: escucha UPDATE en events WHERE id = X
     → Detecta cambios de display_state (campo nuevo en events o en una tabla display_state)

4. Cola de fotos:
   - Array en estado local
   - Muestra la primera foto de la cola durante photo_display_seconds
   - Al terminar el tiempo, pasa a la siguiente
   - Si la cola se vacía, muestra placeholder
   - Transiciones suaves (fade in/out)

5. Código QR:
   - Generado client-side con qrcode.react
   - URL: la del evento en apps/register (go.activacom.mx/e/{code} o go.activacom.mx/r/{slug} según config)
   - Posición configurable (esquina inferior derecha por default)
   - Tamaño adecuado para escanear desde distancia

6. Heartbeat:
   - Cada 30 segundos, hacer un update a display_sessions SET last_heartbeat = now()
   - Si el session_token es inválido (revocado), detectarlo y mostrar pantalla de desconexión

7. Reconnect:
   - Si pierde conexión Realtime, intentar reconexión automática
   - Mientras está desconectado, seguir mostrando el último contenido (buffer en memoria)
   - Mostrar indicador discreto de "Reconectando..." en una esquina

8. Controles del tenant (/events/:id/display-control):
   - Botones para cambiar estado: "Mostrar placeholder", "Mostrar fotos", "Mostrar ganador", "Apagar pantalla"
   - Estos botones actualizan un campo en la tabla events o una tabla dedicada, que la Display App escucha via Realtime
   - Lista de dispositivos conectados con botón "Revocar"
```

### 📦 P2.6 — Gestión de moderadores

```
Permite al tenant agregar usuarios moderadores.

1. En /settings o en /events/:id, sección "Moderadores":
   - Lista de moderadores del tenant
   - Botón "Invitar moderador": pide email
   - Al invitar: crea usuario en Supabase Auth (con invite) + inserta en users con role='moderator'
   - El moderador recibe email con link para setear password
   - El moderador al loguearse solo ve el panel de moderación

2. El moderador al loguearse:
   - No ve sidebar completa, solo "Moderación"
   - Redirige automáticamente a /events/{evento-activo}/moderate
   - Si no hay evento activo, muestra "No hay eventos activos para moderar"

3. Revocar moderador: desactivar (is_active = false) en lugar de borrar.
```

### ✅ Checkpoint Fase 2

```
Verifica el flujo completo de PhotoDrop:
- [ ] Crear evento tipo photo_drop con foto requerida, fuente=camera, display 5 seg
- [ ] Activar evento
- [ ] Generar código de pantalla
- [ ] Abrir display app en otra pestaña → ingresar código → ver placeholder + QR
- [ ] Escanear QR desde celular → formulario + captura de foto
- [ ] Registrarse con foto → ver en panel de moderación como pending
- [ ] Aprobar foto → aparece automáticamente en la Display App
- [ ] Enviar 3 fotos más → aprobar → verificar rotación con tiempo correcto
- [ ] Rechazar una foto → no aparece en display
- [ ] Desde display-control, cambiar a "Mostrar ganador" → display muestra ganador
- [ ] Revocar sesión de display → display muestra "Sesión terminada"
- [ ] Moderador invitado puede loguearse y solo ve moderación
```

---

## FASE 3 — Ads y Créditos (1-1.5 semanas)

### 📦 P3.1 — Sistema de Ads

```
Implementa el sistema de publicidad gestionado por el super admin.

1. /admin/ads — CRUD de anuncios:
   - Crear ad: nombre del anunciante, título, imagen (upload a Storage), URL destino, placements (checkboxes: registration_form, thank_you_page, display_screen), segmentación geográfica (estado, ciudad — optional), fecha inicio/fin, activo sí/no
   - Lista de ads con estado, impresiones, clicks
   - Editar/desactivar ads

2. Componente AdBanner reutilizable:
   - Recibe: placement (string)
   - Fetch ads activos para ese placement (con geo-filter si aplica)
   - Muestra un ad aleatorio de los disponibles
   - Al renderizar: registra impresión (INSERT ad_impressions)
   - Al hacer click: registra click (UPDATE ad_impressions SET clicked = true) → abre URL destino en nueva pestaña
   - Si no hay ads para ese placement: no muestra nada (no ocupa espacio)

3. Integrar AdBanner en:
   - apps/register: página de registro /e/:code (debajo del formulario o en sidebar)
   - apps/register: página de agradecimiento /e/:code/thank-you (prominente)
   - apps/display: Display App (banner inferior o lateral, sin obstruir fotos/QR)
   - NOTA: apps/register tiene su propio componente AdBanner ligero (no reutilizar el de web)

4. Métricas de ads para super admin:
   - Por ad: impresiones, clicks, CTR
   - Filtrar por fecha, por placement
```

### 📦 P3.2 — Sistema de créditos

```
Implementa el sistema de créditos/saldo para tenants.

1. En el super admin /admin/credits:
   - Seleccionar tenant → cargar créditos
   - Dialog: monto (número de créditos), descripción ("Compra OXXO 15/Mar")
   - INSERT credit_transactions (tenant_id, amount, type='purchase', description, created_by)
   - UPDATE tenants SET credit_balance = credit_balance + amount

2. En el panel del tenant:
   - Mostrar saldo actual prominentemente (en sidebar o header)
   - Página /settings o sección de "Créditos":
     - Saldo actual
     - Historial de transacciones (tabla: fecha, tipo, monto, descripción, saldo resultante)
     - Info de cómo comprar más (por ahora: "Contacta a soporte para adquirir créditos")

3. La deducción de créditos se implementará en Fase 4 cuando se envíen campañas.
```

### ✅ Checkpoint Fase 3

```
- [ ] Super admin puede crear ads con imagen y placement
- [ ] Ads aparecen en formulario de registro
- [ ] Ads aparecen en thank you page
- [ ] Ads aparecen en Display App
- [ ] Impresiones y clicks se registran correctamente
- [ ] Super admin puede cargar créditos a un tenant
- [ ] Tenant ve su saldo y historial de transacciones
```

---

## FASE 4 — Campañas de Marketing (2-2.5 semanas)

### 📦 P4.1 — Integración Twilio y Resend

```
Configura las integraciones de SMS y Email.

1. Edge Function supabase/functions/send-sms/index.ts:
   - Recibe: to (phone), body (message)
   - Usa Twilio API para enviar SMS
   - Retorna: { success, message_sid } o { error }
   - Manejo de errores de Twilio (número inválido, etc.)

2. Edge Function supabase/functions/send-email/index.ts:
   - Recibe: to (email), subject, html_body
   - Usa Resend API para enviar email
   - Incluye automáticamente link de opt-out al final del email
   - Retorna: { success, email_id } o { error }

3. No construir UI todavía, solo las Edge Functions probadas y funcionando.
   - Test con curl o desde el dashboard de Supabase.
```

### 🔧 P4.2 — Configurar Twilio y Resend (TÚ)

```
Acción manual:
1. Twilio:
   - Crea cuenta en twilio.com
   - Compra un número mexicano (o usa el trial)
   - Guarda: TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER
   - Configura estos como secrets en Supabase Edge Functions

2. Resend:
   - Crea cuenta en resend.com
   - Configura y verifica tu dominio (para enviar desde noreply@activacom.mx)
   - Guarda: RESEND_API_KEY
   - Configura como secret en Supabase Edge Functions
```

### 📦 P4.3 — Crear y enviar campañas

```
Implementa el sistema de campañas de marketing.

1. Página /campaigns — Lista de campañas:
   - Tabla: nombre, canal (SMS/Email), estado, destinatarios, enviados, fecha
   - Botón "Nueva campaña"

2. /campaigns/new — Crear campaña:
   - Paso 1 — Configuración: nombre, canal (SMS o Email)
   - Paso 2 — Segmentación:
     - Filtrar contactos por:
       - Eventos específicos (multi-select de eventos pasados)
       - Rango de fechas (contactos registrados entre X y Y)
       - Solo con opt-in de marketing = true (OBLIGATORIO, siempre filtrar por esto)
       - Solo verificados (opcional)
     - Mostrar preview: "Esta campaña se enviará a X contactos"
   - Paso 3 — Contenido:
     - Si SMS: textarea con contador de caracteres (160 max para 1 SMS, avisar si excede)
     - Si Email: subject + editor de texto (no WYSIWYG complejo, textarea con variables: {{nombre}}, {{evento}})
     - Preview del mensaje con datos de ejemplo
     - Incluir automáticamente al final: link de opt-out
   - Paso 4 — Confirmar:
     - Resumen: canal, destinatarios, costo en créditos (1 crédito = 1 SMS o 1 email)
     - Verificar que el tenant tiene suficiente saldo
     - Botón "Enviar ahora" (en el futuro: programar envío)

3. Edge Function supabase/functions/send-campaign/index.ts:
   - Recibe: campaign_id
   - Carga la campaña, verifica estado draft, verifica saldo
   - Obtiene lista de contactos según segment_config
   - Actualiza status = 'sending'
   - Por cada contacto:
     - Crea campaign_message con status 'pending'
     - Llama a send-sms o send-email según canal
     - Actualiza campaign_message con status/external_id
   - Actualiza totales de la campaña
   - Deduce créditos: INSERT credit_transaction (negative) + UPDATE tenant credit_balance
   - Actualiza status = 'sent'
   - IMPORTANTE: Manejar batching. Si son 1000 contactos, no enviar todos de golpe. Procesar en batches de 50 con delay.

4. Métricas de campaña (/campaigns/:id):
   - Enviados, entregados, fallidos
   - Para email (via webhooks de Resend en futuro): abiertos, clicks
   - Lista de mensajes individuales con su estado
```

### 📦 P4.4 — Opt-out y verificación

```
Implementa los mecanismos de opt-out y verificación de contacto. Estas páginas viven en apps/register (go.activacom.mx).

1. Página /unsubscribe/:token (en apps/register):
   - Busca verification_token por token
   - Muestra: "¿Deseas dejar de recibir comunicaciones de {tenant_name}?"
   - Botón "Darme de baja"
   - Al confirmar: UPDATE contacts SET opted_out = true, opted_out_at = now(), marketing_opt_in = false
   - Mensaje de confirmación: "Te has dado de baja exitosamente"

2. Página /verify/:token:
   - Busca verification_token por token
   - Si tipo = email: UPDATE contacts SET email_verified = true
   - Si tipo = phone: UPDATE contacts SET phone_verified = true
   - Marca token como used
   - Mensaje: "¡Gracias! Tu información ha sido verificada."

3. Generación de tokens:
   - Al enviar campaña, generar token de opt-out por contacto
   - Incluir link https://go.activacom.mx/unsubscribe/{token} en cada mensaje
   - En la thank-you page post-registro, generar token de verificación y mostrar/enviar link

4. Edge Function que genera y envía el link de verificación post-registro (opcional, puede ser simplemente mostrado en la thank you page).
```

### ✅ Checkpoint Fase 4

```
- [ ] Enviar SMS de prueba via Edge Function
- [ ] Enviar Email de prueba via Edge Function
- [ ] Crear campaña segmentada por evento + opt-in
- [ ] Enviar campaña → créditos se deducen
- [ ] Mensajes llegan a los contactos
- [ ] Link de opt-out funciona
- [ ] Link de verificación funciona
- [ ] Métricas de campaña se muestran correctamente
- [ ] No se puede enviar sin saldo suficiente
```

---

## FASE 5 — Moderación Automática (1 semana)

### 📦 P5.1 — Integración OpenAI Omni-Moderation

```
Implementa moderación automática de fotos como primer filtro opcional.

1. Actualizar Edge Function upload-photo:
   - Agregar campo en evento: auto_moderation_enabled (boolean, default false)
   - Si auto_moderation_enabled = true:
     - Después de guardar la foto en Storage, llamar al endpoint de OpenAI Omni-Moderation
     - Endpoint: POST https://api.openai.com/v1/moderations con el modelo "omni-moderation-latest"
     - Enviar la imagen como base64 o URL pública
     - Guardar resultado completo en photos.auto_mod_result (JSONB)
     - Si flagged = true → status = 'rejected' automáticamente (no llega al moderador)
     - Si flagged = false → status = 'pending' (llega al moderador humano)
   - Si auto_moderation_enabled = false: todo sigue siendo manual (status = 'pending')

2. En /events/:id configuración, agregar toggle:
   - "Moderación automática" on/off
   - Descripción: "Filtra automáticamente contenido inapropiado. Las fotos que pasen el filtro llegarán al moderador para aprobación final."

3. En el panel de moderación, mostrar:
   - Badge si la foto fue pre-aprobada por AI
   - Si auto-mod rechazó una foto, mostrarla en sección aparte "Rechazadas automáticamente" (por si el moderador quiere revisar falsos positivos)

4. Opción avanzada (toggle): "Auto-aprobar fotos que pasen moderación automática"
   - Si activado: fotos que pasan auto-mod van directo a 'approved' sin moderador humano
   - PRECAUCIÓN: avisar al tenant que esto es bajo su responsabilidad
```

### ✅ Checkpoint Fase 5

```
- [ ] Con auto-mod activado: foto inapropiada se rechaza automáticamente
- [ ] Con auto-mod activado: foto apropiada queda pending para moderador
- [ ] Con auto-mod + auto-aprobación: foto apropiada va directo a display
- [ ] Con auto-mod desactivado: todo funciona como antes (manual)
- [ ] Resultado de auto-mod se guarda en la DB
```

---

## FASE 6 — Pagos en Línea (1 semana)

### 📦 P6.1 — Integración Stripe

```
Implementa compra de créditos y licencias via Stripe.

1. Crear productos en Stripe:
   - Paquetes de créditos: 100, 500, 1000, 5000 créditos
   - Licencias: Basic (mensual), Premium (mensual)

2. Página /settings/billing en panel del tenant:
   - Saldo actual de créditos
   - Plan actual y fecha de expiración
   - "Comprar créditos" → muestra paquetes disponibles → Stripe Checkout
   - "Cambiar plan" → muestra planes → Stripe Checkout o Stripe Customer Portal

3. Edge Function supabase/functions/stripe-webhook/index.ts:
   - Escucha eventos de Stripe (checkout.session.completed, invoice.paid, customer.subscription.updated)
   - Al completar compra de créditos: INSERT credit_transaction + UPDATE tenant credit_balance
   - Al completar suscripción: INSERT/UPDATE license + UPDATE tenant plan
   - Verificar firma del webhook (stripe-signature header)

4. Edge Function supabase/functions/create-checkout/index.ts:
   - Recibe: tenant_id, product_type ('credits' o 'license'), quantity/plan
   - Crea Stripe Checkout Session
   - Retorna: checkout URL para redirigir al tenant

Nota: Si decides usar Conekta para OXXO/SPEI, la estructura es similar pero con la API de Conekta.
```

### ✅ Checkpoint Fase 6

```
- [ ] Tenant puede comprar créditos via Stripe Checkout
- [ ] Webhook procesa el pago y acredita créditos
- [ ] Tenant puede suscribirse a plan Basic o Premium
- [ ] Historial de transacciones refleja compras online
```

---

## Notas Finales

### Después de cada fase:
1. Hacer commit con mensaje descriptivo
2. Verificar que TypeScript compile sin errores
3. Probar el flujo completo end-to-end
4. Hacer deploy a Cloudflare Pages para probar en producción

### Deploy a Cloudflare Pages:
```
# Cada app es un proyecto SEPARADO en Cloudflare Pages:

# 1. apps/web → app.activacom.mx
#    Build command: cd apps/web && pnpm build
#    Output directory: apps/web/dist

# 2. apps/register → go.activacom.mx
#    Build command: cd apps/register && pnpm build
#    Output directory: apps/register/dist

# 3. apps/display → display.activacom.mx
#    Build command: cd apps/display && pnpm build
#    Output directory: apps/display/dist

# 4. apps/landing → activacom.mx
#    Build command: cd apps/landing && pnpm build
#    Output directory: apps/landing/dist

# Cada proyecto de CF Pages se conecta al mismo repo de GitHub
# pero con diferente build command y output directory.
# Se pueden deployar independientemente.
```

### Si algo se complica:
- Regresa al chat de Claude para discutir la solución antes de insistir en Claude Code
- Los flujos de Edge Functions son los más propensos a bugs — probar cada uno aisladamente antes de integrar
- Si Supabase Realtime no funciona como esperas, verifica que RLS no esté bloqueando las suscripciones
