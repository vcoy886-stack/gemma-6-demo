// api/webhook.js
//
// Wompi llama a esta URL (configúrala en tu dashboard de Wompi > Eventos) cada
// vez que una transacción cambia de estado. Antes de confiar en el contenido,
// SIEMPRE hay que verificar la firma (checksum) para asegurarte de que el
// evento vino realmente de Wompi y no de alguien simulando un "pago exitoso".
//
// Verificación (documentación de Wompi):
//   checksum_calculado = SHA256(valores_de_signature.properties_concatenados + timestamp + eventsSecret)
//   válido si checksum_calculado === signature.checksum del payload
const crypto = require("crypto");

function leerValor(objeto, ruta) {
  return ruta.split(".").reduce((acc, key) => (acc == null ? acc : acc[key]), objeto);
}

module.exports = (req, res) => {
  if (req.method !== "POST") return res.status(405).end();

  const body = req.body || {};
  const eventsSecret = process.env.WOMPI_EVENTS_SECRET;

  try {
    const { signature, timestamp, data } = body;
    if (!signature || !signature.properties || !signature.checksum) {
      throw new Error("Payload sin firma — no parece un evento real de Wompi");
    }
    if (!eventsSecret) {
      throw new Error("Falta configurar WOMPI_EVENTS_SECRET en el servidor");
    }

    const valores = signature.properties.map((ruta) => leerValor(data, ruta));
    const cadena = valores.join("") + timestamp + eventsSecret;
    const checksumCalculado = crypto.createHash("sha256").update(cadena).digest("hex");

    if (checksumCalculado !== signature.checksum) {
      console.warn("Firma de webhook inválida — evento ignorado", { reference: data?.transaction?.reference });
      return res.status(400).json({ error: "Firma inválida" });
    }

    const tx = data.transaction;
    console.log(`Evento verificado: transacción ${tx.reference} -> ${tx.status} (${tx.amount_in_cents / 100} ${tx.currency})`);

    // TODO: activar el acceso del cliente cuando tx.status === "APPROVED".
    // Estas mini apps hoy son sitios estáticos sin base de datos, así que de
    // momento el pago solo queda registrado en los logs de Vercel (Project ->
    // Deployments -> Functions -> webhook). Para automatizar la activación,
    // conecta este punto a una base de datos (Supabase, Vercel KV, Airtable)
    // o a un envío de email/WhatsApp que te avise para activar el plan a mano.

    res.status(200).json({ received: true });
  } catch (err) {
    console.error("Error procesando webhook de Wompi:", err.message);
    res.status(400).json({ error: err.message });
  }
};
