# Payments API — backend de pagos para las 5 mini apps (Wompi)

Backend mínimo de **2 funciones serverless** que le falta a un sitio 100% estático
para cobrar de forma segura: nunca se puede calcular la firma de integridad ni
verificar un webhook solo con JavaScript de navegador, porque eso requeriría
exponer un secreto. Este servicio es compartido por las 5 mini apps del repo
(todas cobran a la misma cuenta de Wompi del mismo vendedor).

- `api/crear-firma.js` — calcula la `signature:integrity` que exige el Widget
  de Wompi antes de abrir el checkout.
- `api/webhook.js` — recibe las notificaciones de Wompi cuando una transacción
  cambia de estado, y **verifica su firma** antes de confiar en ellas.

## 1. Desplegar en Vercel (gratis)

```bash
cd mini-apps/payments-api
npx vercel        # sigue las instrucciones, elige "Link to a new project"
npx vercel --prod # cuando quede bien, despliega a producción
```

Al terminar, Vercel te da una URL como `https://mini-apps-payments-api.vercel.app`.
Esa es la URL que vas a pegar como `PAYMENTS_API_BASE` en el `wompi-checkout.js`
de cada una de las 5 mini apps.

## 2. Configurar las variables de entorno

En el dashboard de Wompi: **Desarrolladores → Secretos para integración técnica**.
Ahí vas a encontrar 4 valores — para este backend solo necesitas los dos secretos
(nunca las llaves públicas, esas van directo en el frontend):

| Variable | De dónde sale | Dónde se usa |
|---|---|---|
| `WOMPI_INTEGRITY_SECRET` | Secreto de integridad (sandbox o producción) | `api/crear-firma.js` |
| `WOMPI_EVENTS_SECRET` | Secreto de eventos (sandbox o producción) | `api/webhook.js` |

Configúralas en Vercel: **Project → Settings → Environment Variables**. Empieza
siempre con los valores de **sandbox/pruebas** (ver `.env.example`).

## 3. Registrar el webhook en Wompi

En el dashboard de Wompi: **Desarrolladores → Eventos**, agrega la URL:

```
https://TU-PAYMENTS-API.vercel.app/api/webhook
```

## 4. Conectar cada mini app

En cada carpeta (`mini-apps/1-media-kit`, `2-respondedor-dm`, etc.) hay un
archivo `wompi-checkout.js`. Edita estas dos líneas con tus datos reales:

```js
const WOMPI_PUBLIC_KEY = "pub_test_TU_LLAVE_PUBLICA";       // llave pública, sí va en el frontend
const PAYMENTS_API_BASE = "https://TU-PAYMENTS-API.vercel.app"; // la URL del paso 1
```

## Por qué no hay suscripción automática todavía

Wompi no tiene un objeto nativo de "suscripción recurrente" como Stripe Billing:
el primer cobro se hace con el Widget (ya implementado aquí), pero el cobro
automático del segundo mes en adelante requiere:

1. Tokenizar el medio de pago del cliente ("fuente de pago" en la API de Wompi).
2. Guardar esa fuente de pago en una base de datos junto al cliente y su plan.
3. Un job programado (ej. Vercel Cron) que cada mes vuelva a cobrar esa fuente
   de pago con la API de Transacciones de Wompi.

Como estas 5 mini apps hoy son sitios estáticos sin base de datos, ese paso 2
no existe todavía. Lo que sí queda funcionando de punta a punta es: el cliente
paga el primer mes desde la landing, y el webhook te avisa (verificado) cuando
el pago se aprueba — por ahora queda registrado en los logs de Vercel para que
actives el acceso manualmente. El siguiente paso natural es conectar una base
de datos simple (Supabase, Vercel KV o incluso Airtable) para automatizar tanto
el registro de clientes como el cobro recurrente.

## Checklist antes de cobrar con dinero real

1. Probar el flujo completo en modo sandbox (tarjetas de prueba de Wompi) desde
   al menos una de las 5 landings.
2. Reemplazar `WOMPI_INTEGRITY_SECRET` / `WOMPI_EVENTS_SECRET` (aquí) y
   `WOMPI_PUBLIC_KEY` (en cada `wompi-checkout.js`) por tus llaves reales de
   producción — nunca las de sandbox.
3. Confirmar que la URL del webhook es pública por HTTPS (Vercel ya lo es) y
   está registrada en el dashboard de Wompi.
4. Hacer una transacción real de bajo monto de punta a punta antes de anunciar
   que ya se puede cobrar.
5. Revisar tu política de reembolsos/cancelaciones y dejarla visible en cada
   landing.
6. Confirmar que tu cuenta de Wompi está completamente verificada (identidad y
   cuenta bancaria de destino) — sin eso, los pagos reales no se liquidan
   aunque el checkout funcione.
