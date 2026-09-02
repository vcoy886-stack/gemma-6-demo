# Guía de instalación y prueba — Mini Apps IA

Esta guía explica cómo instalar y probar en tu propia computadora las 5 mini apps
de este repositorio (`mini-apps/`).

## 1. Requisitos previos

- **Chrome o Edge versión 113+** (para las funciones de IA que usan WebGPU). Otros
  navegadores pueden abrir las landings pero no cargarán el modelo de IA.
- Tener **Python** instalado (casi siempre viene preinstalado en Mac/Linux; en
  Windows se instala en 2 minutos desde [python.org](https://python.org)) — se
  usa solo para levantar un servidor local. No necesitas saber programar, es un
  solo comando.

## 2. Descargar el código

Opción simple sin usar terminal para git:
1. Ve al PR en GitHub: `https://github.com/vcoy886-stack/gemma-6-demo/pull/1`
2. Botón verde **Code → Download ZIP** (asegúrate de estar viendo la rama
   `claude/mini-apps-ideas-venta-uz1sqt`, no `main`).
3. Descomprime el ZIP en tu computador.

O si usas terminal:
```bash
git clone https://github.com/vcoy886-stack/gemma-6-demo.git
cd gemma-6-demo
git checkout claude/mini-apps-ideas-venta-uz1sqt
```

## 3. ¿Por qué no basta con hacer doble clic al `index.html`?

Las apps usan módulos de JavaScript (`import`/`export`) para cargar el motor de
IA, y los navegadores **bloquean eso por seguridad** cuando abres un archivo
directamente (`file://...`). Necesitas un servidor local — es una sola línea,
no instala nada permanente en tu sistema.

## 4. Levantar el servidor local

Abre una terminal dentro de la carpeta `gemma-6-demo` (la carpeta raíz del
proyecto, donde está el `index.html` principal) y ejecuta:

```bash
python3 -m http.server 8000
```

(en Windows a veces el comando es `python` en lugar de `python3`)

Deja esa ventana abierta — mientras esté corriendo, el sitio estará disponible
en tu navegador.

## 5. Abrir y probar cada app

Con el servidor corriendo, abre en Chrome/Edge:

| App | URL |
|---|---|
| 🏠 Hub (menú de las 5) | `http://localhost:8000/` |
| MediaKit IA | `http://localhost:8000/mini-apps/1-media-kit/` |
| RespondeYa IA | `http://localhost:8000/mini-apps/2-respondedor-dm/` |
| GuionIA | `http://localhost:8000/mini-apps/3-generador-guiones/` |
| CotizaYa IA | `http://localhost:8000/mini-apps/4-cotizador-contratos/` |
| ChatIA Embebible | `http://localhost:8000/mini-apps/5-chatbot-embebible/` |
| Ejemplo de chatbot embebido en una web ficticia | `http://localhost:8000/mini-apps/5-chatbot-embebible/demo.html` |

### Qué probar en cada una (sin IA, funciona al instante)

- **MediaKit IA**: llena el formulario → clic en "Generar media kit" → debe
  aparecer la vista previa.
- **RespondeYa IA**: clic en cualquier "chip" de ejemplo (precio/horario/etc.)
  → debe clasificar y sugerir respuesta.
- **GuionIA**: escribe un nicho → "Generar 10 ideas" → deben aparecer 10 hooks.
- **CotizaYa IA**: clic en "Generar cotización y contrato" → revisa las
  pestañas Cotización/Contrato.
- **ChatIA Embebible**: llena nombre/FAQ del negocio → "Probar mi chatbot" →
  debe aparecer la burbuja 💬 abajo a la derecha.

### Qué probar con IA (más lento, requiere WebGPU)

Los botones "✨ Pulir con IA" / "✨ Redactar con IA on-device" y el chatbot
mismo van a **descargar el modelo Gemma (~2 GB) la primera vez** — puede
tardar varios minutos según tu internet. Después queda en caché del navegador
y las siguientes veces es instantáneo.

Los botones de precio ("Suscribirme — $X/mes") van a mostrar un aviso de
"todavía no está configurado" — es normal, porque las llaves de Wompi son
placeholder (ver la sección siguiente si quieres probar el pago).

## 6. (Opcional) Probar el flujo de pago

Esto requiere un paso extra porque el pago necesita un backend:

1. Instala Node.js si no lo tienes ([nodejs.org](https://nodejs.org)).
2. En terminal:
   ```bash
   cd mini-apps/payments-api
   npx vercel dev
   ```
   Esto te da una URL local tipo `http://localhost:3000`.
3. Consigue tus llaves de **sandbox/pruebas** de Wompi (te registras gratis en
   wompi.co, sección Desarrolladores → Secretos para integración técnica).
4. Edita `mini-apps/payments-api/.env` (créalo copiando `.env.example`) con
   `WOMPI_INTEGRITY_SECRET` y `WOMPI_EVENTS_SECRET` de prueba.
5. En cualquier `wompi-checkout.js` (ej.
   `mini-apps/1-media-kit/wompi-checkout.js`), reemplaza `WOMPI_PUBLIC_KEY`
   (tu llave pública de prueba) y `PAYMENTS_API_BASE` por `http://localhost:3000`.
6. Recarga la landing y haz clic en "Suscribirme" — debería abrirse el
   checkout real de Wompi en modo sandbox (usa sus tarjetas de prueba).

Más detalle sobre el backend de pagos, el checklist de producción y por qué el
cobro recurrente automático necesita un paso adicional (base de datos) está en
`mini-apps/payments-api/README.md`.

## 7. Probar una sola app de forma aislada (para venderla por separado)

Cada carpeta dentro de `mini-apps/` (excepto `shared/` y `payments-api/`) es
autocontenida: no depende de nada fuera de sí misma. Para probar, por ejemplo,
solo CotizaYa IA como si fuera su propio sitio:

```bash
cd mini-apps/4-cotizador-contratos
python3 -m http.server 8001
```

Y ábrela en `http://localhost:8001/`. Así puedes confirmar que esa carpeta,
copiada a cualquier otro hosting o dominio, funcionará igual.

## Problemas comunes

- **"WebGPU not supported"**: usa Chrome/Edge actualizado, o activa
  `chrome://flags/#enable-unsafe-webgpu`.
- **El modelo tarda mucho**: normal la primera vez (~2 GB); después queda en
  caché del navegador.
- **`python3: command not found`**: prueba con `python` a secas, o instala
  Python.
- **Puerto 8000 ocupado**: usa otro número, ej. `python3 -m http.server 8001`
  y ajusta la URL.
