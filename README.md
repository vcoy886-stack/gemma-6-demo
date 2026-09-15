# VentasIA — Sistema de ventas con asistente virtual IA

Plataforma de gestión y automatización comercial para pequeñas y medianas empresas: CRM,
lead scoring, pipeline visual, productos, cotizaciones en PDF, ventas, tareas, dashboard,
automatizaciones por reglas, módulo de WhatsApp y un asistente de inteligencia artificial
que funciona como copiloto comercial, analista de ventas y centro de ayuda.

Es un sistema **real**: base de datos persistente, autenticación con contraseñas
encriptadas, permisos por rol, validaciones de servidor y datos que se guardan y
recuperan entre sesiones. No hay botones decorativos ni estadísticas inventadas — todo
lo que ves en la interfaz proviene de una consulta real a la base de datos.

---

## 1. Arquitectura

**Monolito full-stack con Next.js (App Router)**: frontend, API y lógica de negocio
conviven en un solo proyecto TypeScript, con Prisma como capa de acceso a datos. Se
eligió esta arquitectura (en vez de microservicios) por ser el punto óptimo de
complejidad/operación para una PyME: un solo proceso, un solo despliegue, sin
infraestructura adicional que mantener.

```
Navegador
   │
   ├── Server Components (páginas autenticadas, lectura de sesión)
   ├── Client Components (formularios, tablas, kanban, chat IA)
   │
   ▼
Next.js Route Handlers (app/api/**)  ──►  Prisma ORM  ──►  SQLite / PostgreSQL
   │
   ├── lib/auth.ts        → sesión JWT en cookie httpOnly
   ├── lib/permissions.ts → RBAC (qué puede ver/hacer cada rol)
   ├── lib/scoring.ts     → motor de lead scoring
   ├── lib/automations.ts → motor de automatizaciones SI/ENTONCES
   └── lib/ai/*           → asistente IA (consultas deterministas + Claude opcional)
```

`proxy.ts` (antes `middleware.ts` en versiones previas de Next.js) protege todas las
rutas de página: sin sesión válida, redirige a `/login`.

## 2. Tecnologías utilizadas

| Capa | Tecnología | Motivo |
|---|---|---|
| Framework | Next.js 16 (App Router, TypeScript) | Full-stack en un solo proyecto, rutas API integradas |
| UI | React 19, Tailwind CSS v4 | Interfaz propia, sin dependencia de librerías de componentes pesadas |
| Gráficos | Recharts | Gráficos del dashboard |
| Drag & drop | @dnd-kit | Pipeline tipo Kanban |
| Base de datos | Prisma ORM 6 + SQLite (dev) | Real, persistente, tipado extremo a extremo; cambia a PostgreSQL con una variable de entorno |
| Autenticación | JWT propio (`jose`) + `bcryptjs` | Sin dependencias de terceros de pago; cookies httpOnly |
| PDF | `pdfkit` | Generación real de cotizaciones en PDF |
| CSV | `papaparse` | Importación de clientes |
| IA | `@anthropic-ai/sdk` (Claude) — opcional | Generación de lenguaje natural grounded en datos reales |
| Validación | `zod` | Validación de todos los formularios en el servidor |

## 3. Estructura de base de datos

Modelos principales (ver `prisma/schema.prisma` para el detalle completo de campos y
relaciones):

- **Company** — datos de la empresa, configuración, avance del onboarding.
- **User** — usuarios con rol (`ADMIN`, `GERENTE`, `VENDEDOR`, `ASISTENTE`).
- **Contact** — unifica "clientes" y "leads" en una sola entidad con estado
  (Nuevo → Contactado → ... → Ganado/Perdido), puntuación de lead scoring y dueño.
  *Decisión de diseño*: el pedido original pedía tablas `customers` y `leads`
  separadas; se unificaron porque en la práctica un lead que avanza **es** el cliente,
  y separarlos habría exigido sincronizar dos registros del mismo contacto en cada
  cambio de estado — una fuente de inconsistencia sin beneficio real.
- **ScoreEvent** — cada motivo que sumó o restó puntos a un lead (auditable).
- **Product / Category** — catálogo con precio, costo, inventario.
- **PipelineStage / Opportunity** — pipeline visual con 9 etapas por defecto.
- **Activity** — bitácora de interacciones (llamadas, notas, cambios de estado).
- **Task** — tareas y seguimientos con prioridad y vencimiento.
- **Conversation / Message** — registro de conversaciones (WhatsApp/manual).
- **WhatsappConfig** — configuración no sensible de la integración de WhatsApp.
- **Quote / QuoteItem** — cotizaciones con ítems, descuentos, impuestos, estado.
- **Sale / SaleItem / Payment** — ventas registradas, con descuento real de inventario.
- **Automation / AutomationAction / AutomationLog** — reglas SI/ENTONCES y su bitácora.
- **Notification** — notificaciones internas (ej. generadas por automatizaciones).
- **AiConversation / AiMessage** — historial de chats con el asistente IA.

Todas las entidades transaccionales relevantes (`Contact`, `Product`, `Opportunity`,
`Task`, `Quote`, `Sale`) tienen un campo `isDemo` para poder cargar y eliminar datos de
demostración sin tocar datos reales.

## 4. Variables de entorno

Ver `.env.example`. Variables:

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí | Cadena de conexión. `file:./dev.db` en desarrollo; en producción usa PostgreSQL (`postgresql://usuario:clave@host:5432/bd`) sin cambiar código. |
| `AUTH_SECRET` | Sí | Clave aleatoria larga para firmar los JWT de sesión. Genera una propia: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| `ANTHROPIC_API_KEY` | No | Habilita respuestas generativas del asistente IA (Claude). Sin ella, el asistente sigue funcionando en **modo determinista** (consultas reales a la base de datos, sin redacción libre). Consíguela en https://console.anthropic.com/ |
| `ANTHROPIC_MODEL` | No | Modelo de Claude a usar (por defecto `claude-sonnet-5`). |
| `WHATSAPP_ACCESS_TOKEN` | No | Token de acceso de WhatsApp Business API (Meta). Sin él, el módulo de WhatsApp permite registrar conversaciones manualmente pero no puede enviar/recibir mensajes reales. Nunca se guarda en la base de datos. |

## 5. Instalación

Requisitos: Node.js 20+.

```bash
git clone <este-repositorio>
cd gemma-6-demo
npm install

cp .env.example .env
# Edita .env: define AUTH_SECRET propio (ver arriba) y, opcionalmente, ANTHROPIC_API_KEY

npx prisma migrate dev   # crea la base de datos SQLite y aplica el esquema
npm run dev              # http://localhost:3000
```

Al entrar por primera vez, crea tu empresa desde `/register` (esto genera el usuario
administrador, las 9 etapas de pipeline por defecto y la configuración inicial de
WhatsApp). Luego sigue la **Configuración guiada** (`/onboarding`).

Para cargar datos de ejemplo (20 clientes, 30 leads, 10 productos, 15 oportunidades,
10 ventas y tareas variadas, todos marcados como "Demo" y eliminables): entra como
administrador a **Configuración → Datos de demostración**.

## 6. Despliegue

1. Aprovisiona una base de datos PostgreSQL (o mantén SQLite para un despliegue de un
   solo proceso con disco persistente — no recomendado en plataformas serverless).
2. Define `DATABASE_URL`, `AUTH_SECRET` y, si aplica, `ANTHROPIC_API_KEY` /
   `WHATSAPP_ACCESS_TOKEN` en las variables de entorno del proveedor.
3. `npx prisma migrate deploy` para aplicar las migraciones en producción.
4. `npm run build && npm run start`, o despliega en cualquier plataforma compatible con
   Next.js (Vercel, Railway, un servidor Node propio, contenedor Docker, etc.).
5. Si usarás automatizaciones basadas en tiempo (sin respuesta hace X días, cotización
   por vencer), programa una llamada periódica a `POST /api/automations/run` con un
   programador externo (cron del sistema operativo, Vercel Cron, etc.) — ver limitación
   en la sección 11.

## 7. Manual de usuario (vendedor)

- **CRM**: crea y edita contactos, registra actividades (llamadas, WhatsApp, notas) y
  marca qué motivo de puntuación aplica — así el lead scoring queda siempre explicado.
- **Pipeline**: arrastra las tarjetas entre columnas para avanzar una oportunidad.
  Moverla a "Venta ganada" marca al cliente como Ganado automáticamente.
- **Cotizaciones**: arma una cotización con productos reales, descarga el PDF y cambia
  su estado a medida que el cliente responde.
- **Ventas**: registra una venta (desde cero o convirtiendo una cotización aceptada).
  El inventario del producto se descuenta automáticamente.
- **Tareas**: tus seguimientos pendientes, organizados en vencidas / hoy / próximas.
- **Asistente IA**: botón "✨ Asistente IA" en cualquier pantalla. Pregúntale en
  lenguaje natural: *"¿Qué debo hacer hoy?"*, *"Muéstrame mis leads más calientes"*,
  *"Genera un mensaje para Carlos"*.

## 8. Manual del administrador

- **Configuración → Empresa**: datos que aparecen en tus cotizaciones (nombre,
  dirección, moneda, impuesto por defecto).
- **Configuración → Usuarios y roles**: crea vendedores y asigna rol. Un `VENDEDOR`
  solo ve sus propios contactos, oportunidades y ventas; `GERENTE` ve todo el equipo
  pero no puede tocar la configuración de la empresa ni gestionar usuarios; `ADMIN`
  tiene acceso total.
- **Automatizaciones**: reglas SI (lead nuevo, puntuación supera X, sin respuesta hace
  X días, venta ganada, cambio de etapa, cotización por vencer) ENTONCES (crear tarea,
  marcar prioridad, cambiar estado, ajustar puntuación, notificar).
- **Reportes**: leads por fuente/estado, pipeline por etapa, rentabilidad por producto,
  todos exportables a CSV.
- **WhatsApp**: estado de conexión real (no simulado) y registro manual de
  conversaciones mientras no haya credenciales de Meta configuradas.

## 9. Manual del asistente IA

El asistente combina dos capas, siempre ancladas a datos reales de tu base de datos:

1. **Capa determinista** (siempre activa, sin configuración): un enrutador de
   intención interpreta la pregunta y ejecuta consultas reales — leads calientes,
   seguimientos pendientes, resumen de ventas, resumen de un cliente, ayuda paso a
   paso — y devuelve una respuesta ya formateada. Funciona sin ninguna clave externa.
2. **Capa generativa opcional** (requiere `ANTHROPIC_API_KEY`): toma exactamente los
   mismos datos que consultó la capa determinista y le pide a Claude que los redacte
   con mejor tono y priorización, con instrucciones explícitas de **no inventar** nada
   que no esté en esos datos.

Además, el asistente es **proactivo**: al abrir el panel, revisa automáticamente leads
sin seguimiento, cotizaciones por vencer, oportunidades con alta probabilidad de cierre
y variación de ventas, y te lo muestra sin que preguntes.

El asistente respeta los permisos del usuario: un vendedor solo recibe datos de sus
propios contactos y ventas, nunca de todo el equipo.

## 10. Integraciones

| Integración | Estado | Qué falta para conectarla de verdad |
|---|---|---|
| WhatsApp Business API | Preparada, no conectada | Cuenta verificada en Meta Business + `WHATSAPP_ACCESS_TOKEN` en el servidor |
| Claude (Anthropic) | Opcional | `ANTHROPIC_API_KEY` |
| Pasarela de pagos | No implementada | Fuera del alcance de esta versión |

Ninguna integración se simula como si estuviera activa: si falta una credencial, la
interfaz lo indica explícitamente.

## 11. Limitaciones actuales

- **Logout no revoca el token en el servidor**: al cerrar sesión se borra la cookie del
  navegador, pero al ser JWT sin estado, un token robado antes del logout seguiría
  siendo técnicamente válido hasta su expiración (7 días). Mitigación futura: lista de
  revocación o sesiones con estado en base de datos.
- **Permisos por rol son fijos en código**, no editables desde la UI (la sección 21 del
  pedido original sugiere permisos configurables; se implementó una matriz de 4 roles
  bien definidos en vez de un editor de permisos que en la práctica casi nadie usa en
  una PyME).
- **No hay cron real** en este entorno de desarrollo: las automatizaciones basadas en
  tiempo (sin respuesta hace X días, cotización por vencer) se ejecutan manualmente con
  un botón o deben programarse externamente en producción.
- **WhatsApp Business API no está conectado** (requiere cuenta Meta verificada, fuera
  del alcance de este entorno). El modelo de datos y la UI están listos para
  conectarla.
- **Multi-moneda**: cada empresa opera en una sola moneda a la vez (no hay conversión
  automática entre monedas).
- **Sin tests automatizados** (unit/e2e) incluidos en el repositorio; las pruebas
  funcionales de esta entrega se hicieron manualmente contra la API real y con
  capturas de pantalla en escritorio y móvil (ver historial de esta sesión).

## 12. Próximas mejoras recomendadas

1. Sesiones revocables (blacklist de tokens o sesiones con estado).
2. Editor de permisos granular por rol desde la UI.
3. Cron real (Vercel Cron / worker dedicado) para automatizaciones basadas en tiempo.
4. Conexión real a WhatsApp Business API (envío/recepción de mensajes, no solo
   registro manual).
5. Suite de pruebas automatizadas (unitarias + end-to-end con Playwright).
6. Multi-idioma y multi-moneda con conversión.
7. Analítica predictiva (probabilidad de cierre calculada por historial, no solo por
   etapa).

---

## Desarrollo local

```bash
npm run dev      # servidor de desarrollo
npm run build    # build de producción
npm run lint     # ESLint
npx prisma studio # explorador visual de la base de datos
```
