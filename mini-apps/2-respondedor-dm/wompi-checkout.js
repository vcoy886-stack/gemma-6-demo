/**
 * Conecta los botones de precios de esta mini app con el Widget de pago de Wompi
 * (checkout.wompi.co/widget.js), calculando la firma de integridad en el backend
 * de mini-apps/payments-api (nunca en el navegador, porque requiere un secreto).
 *
 * ANTES DE SALIR A PRODUCCIÓN, configura estas dos constantes:
 *   1. WOMPI_PUBLIC_KEY  -> tu llave pública real de Wompi (empieza con pub_ o pub_test_).
 *      La encuentras en tu dashboard de Wompi > Desarrolladores > Llaves de la API.
 *   2. PAYMENTS_API_BASE -> la URL donde desplegaste mini-apps/payments-api en Vercel
 *      (ver mini-apps/payments-api/README.md para el paso a paso de despliegue).
 *
 * Los botones que disparan un pago deben tener la clase "js-wompi-pay" y los
 * atributos data-plan="Nombre del plan" y data-cop="MONTO_EN_PESOS_COLOMBIANOS".
 */
const WOMPI_PUBLIC_KEY = "pub_test_REEMPLAZA_CON_TU_LLAVE_PUBLICA";
const PAYMENTS_API_BASE = "https://REEMPLAZA-CON-TU-PAYMENTS-API.vercel.app";

function cargarWidgetWompi() {
  return new Promise((resolve, reject) => {
    if (window.WidgetCheckout) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.wompi.co/widget.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("No se pudo cargar Wompi. Revisa tu conexión."));
    document.head.appendChild(script);
  });
}

function nombreDeLaApp() {
  return (document.title.split("—")[0] || document.title)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");
}

async function iniciarPagoWompi(btn) {
  const plan = btn.dataset.plan || "plan";
  const amountInCOP = Number(btn.dataset.cop);
  const originalText = btn.textContent;

  if (WOMPI_PUBLIC_KEY.includes("REEMPLAZA") || PAYMENTS_API_BASE.includes("REEMPLAZA")) {
    alert(
      "Este botón de pago todavía no está configurado.\n\n" +
      "Edita wompi-checkout.js y reemplaza WOMPI_PUBLIC_KEY y PAYMENTS_API_BASE " +
      "con tus datos reales (ver mini-apps/payments-api/README.md)."
    );
    return;
  }

  if (!amountInCOP) {
    alert("Falta configurar el precio en pesos (data-cop) de este botón.");
    return;
  }

  btn.disabled = true;
  btn.textContent = "Cargando pago…";

  try {
    await cargarWidgetWompi();

    const reference = `${nombreDeLaApp()}-${plan}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9-]/g, "");
    const amountInCents = Math.round(amountInCOP * 100);

    const res = await fetch(`${PAYMENTS_API_BASE}/api/crear-firma`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference, amountInCents, currency: "COP" }),
    });
    if (!res.ok) throw new Error("el servidor de pagos no respondió correctamente");
    const { signature } = await res.json();

    const checkout = new WidgetCheckout({
      currency: "COP",
      amountInCents,
      reference,
      publicKey: WOMPI_PUBLIC_KEY,
      signature: { integrity: signature },
      redirectUrl: window.location.href.split("?")[0] + "?pago=gracias",
    });

    checkout.open((result) => {
      const tx = result && result.transaction;
      if (tx && tx.status === "APPROVED") {
        alert(`¡Pago aprobado! Referencia ${tx.reference}.\nTe contactaremos a tu correo para activar el plan ${plan}.`);
      } else if (tx) {
        alert(`El pago quedó en estado: ${tx.status}. Si crees que es un error, contáctanos.`);
      }
    });
  } catch (err) {
    alert("No se pudo iniciar el pago: " + err.message);
  }

  btn.disabled = false;
  btn.textContent = originalText;
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".js-wompi-pay").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      iniciarPagoWompi(btn);
    });
  });
});
