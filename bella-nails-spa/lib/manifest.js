(function () {
  "use strict";
  window.__BRAND__ = {
    name: "Bella Nails Spa",
    tagline: "Uñas, cejas y pestañas — perfectas, sin excusas.",
    isDemo: true,
    location: "Envigado, Antioquia",

    services: [
      { id: "manicure", icon: "💅", name: "Manicure Clásica", desc: "Limado, cutícula y esmaltado tradicional o semipermanente.", price: 35000, deposit: 15000, duration: "45 min" },
      { id: "pedicure", icon: "🦶", name: "Pedicure Spa", desc: "Exfoliación, hidratación profunda y esmaltado a elección.", price: 45000, deposit: 15000, duration: "60 min" },
      { id: "acrilico", icon: "✨", name: "Uñas en Gel / Acrílico", desc: "Extensión y decoración a tu gusto, con acabado de larga duración.", price: 70000, deposit: 25000, duration: "90 min" },
      { id: "cejas", icon: "🪄", name: "Diseño de Cejas", desc: "Perfilado, laminado y tinte según la forma de tu rostro.", price: 30000, deposit: 15000, duration: "30 min" },
      { id: "pestanas", icon: "👁️", name: "Extensión de Pestañas", desc: "Pelo a pelo o volumen ruso, efecto natural o dramático.", price: 90000, deposit: 30000, duration: "120 min" }
    ],

    timeSlots: ["9:00 am", "10:30 am", "12:00 m", "2:00 pm", "3:30 pm", "5:00 pm"],

    depositPolicy: "El abono se descuenta del valor total del servicio. Cancela o reprograma sin costo avisando con al menos 24 horas de anticipación.",

    payment: {
      method: "Nequi",
      number: "300 000 0000",
      holder: "Bella Nails Spa"
    },

    testimonials: [
      {
        quote: "Desde que piden abono ya nadie me deja esperando. Agendé mis cejas y pestañas el mismo día sin líos.",
        name: "Testimonio ilustrativo",
        role: "Contenido de ejemplo para esta demo"
      },
      {
        quote: "Las uñas en gel me duraron casi un mes intactas. El diseño quedó igual a la foto que llevé.",
        name: "Testimonio ilustrativo",
        role: "Contenido de ejemplo para esta demo"
      }
    ],

    faqs: [
      {
        q: "¿Por qué piden un abono para agendar?",
        a: "Para poder garantizarte el horario exacto que elegiste. El abono se descuenta del total al final del servicio — no es un cobro adicional."
      },
      {
        q: "¿Cómo pago el abono?",
        a: "Por Nequi o Daviplata, al número que aparece al confirmar tu cita. Solo envía el comprobante y quedas agendada."
      },
      {
        q: "¿Puedo cambiar la fecha de mi cita?",
        a: "Sí, sin costo, avisando con mínimo 24 horas de anticipación por WhatsApp."
      },
      {
        q: "¿Qué pasa si no llego a mi cita?",
        a: "El abono no se reembolsa si no avisas con anticipación, ya que ese horario queda bloqueado para otra clienta."
      }
    ],

    contact: {
      phone: "+57 300 000 0000",
      whatsapp: "+57 300 000 0000",
      email: "hola@bellanails-demo.co",
      address: "Cra. 43A # 30-10, Envigado, Antioquia"
    }
  };
})();
