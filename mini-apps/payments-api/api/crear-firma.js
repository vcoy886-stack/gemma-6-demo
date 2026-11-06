// api/crear-firma.js
//
// Genera la "signature:integrity" que exige el Widget de Wompi para abrir un
// checkout. Esto tiene que pasar en un backend porque requiere el Integrity
// Secret del comercio, que NUNCA debe llegar al navegador del cliente.
//
// Fórmula (documentación de Wompi): SHA256(reference + amountInCents + currency + integritySecret)
const crypto = require("crypto");

module.exports = (req, res) => {
  // Permite que cualquiera de tus 5 landings (aunque vivan en dominios distintos)
  // llame a este mismo backend compartido.
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { reference, amountInCents, currency } = req.body || {};
  if (!reference || !amountInCents || !currency) {
    return res.status(400).json({ error: "Faltan reference, amountInCents o currency" });
  }
  if (!Number.isInteger(amountInCents) || amountInCents <= 0) {
    return res.status(400).json({ error: "amountInCents debe ser un entero positivo" });
  }

  const integritySecret = process.env.WOMPI_INTEGRITY_SECRET;
  if (!integritySecret) {
    return res.status(500).json({ error: "Falta configurar WOMPI_INTEGRITY_SECRET en el servidor" });
  }

  const cadena = `${reference}${amountInCents}${currency}${integritySecret}`;
  const signature = crypto.createHash("sha256").update(cadena).digest("hex");

  res.status(200).json({ signature });
};
