(function () {
  "use strict";
  window.__BRAND__ = {
    name: "Carol Spa",
    tagline: "Tu cuerpo también necesita un respiro.",
    isDemo: true,
    location: "Laureles, Medellín",

    stats: [
      { value: 1800, suffix: "+", label: "sesiones realizadas" },
      { value: 8, suffix: "", label: "años de experiencia" },
      { value: 96, suffix: "%", label: "clientas que regresan" }
    ],

    services: [
      {
        icon: "🌸",
        name: "Masaje Relajante",
        desc: "Sesión de 60 minutos enfocada en liberar el estrés y la tensión acumulada.",
        includes: ["Aromaterapia con aceites esenciales", "Técnicas de relajación muscular profunda", "Ambientación con música suave"],
        price: "$100.000 COP"
      },
      {
        icon: "💧",
        name: "Masaje de Drenaje Linfático",
        desc: "Sesión de 60 minutos para activar tu circulación y desinflamar.",
        includes: ["Técnica manual especializada en drenaje", "Reduce retención de líquidos e inflamación", "Ideal post-procedimiento o piernas cansadas"],
        price: "$100.000 COP"
      }
    ],

    package: {
      name: "Paquete Reductor Corporal",
      sessions: "10 sesiones · 2 por semana (aprox. 5 semanas)",
      includes: ["Vacumterapia", "Carboxiterapia", "Madero Terapia", "Masoterapia", "Radiofrecuencia", "Cavitación", "Gimnasia pasiva", "Sauna"],
      note: "Se trabajan todas las partes del cuerpo.",
      price: 950000,
      payment: {
        upfront: 475000,
        installments: [237500, 237500]
      }
    },

    testimonials: [
      {
        quote: "Empecé el paquete mensual buscando bajar el estrés del trabajo y terminé enganchada también con el reductor. Se nota el cambio en la piel y en cómo duermo.",
        name: "Testimonio ilustrativo",
        role: "Contenido de ejemplo para esta demo"
      },
      {
        quote: "El drenaje linfático me ayudó muchísimo después del parto. La atención es muy cálida, no se siente como una cadena más.",
        name: "Testimonio ilustrativo",
        role: "Contenido de ejemplo para esta demo"
      }
    ],

    faqs: [
      {
        q: "¿El paquete reductor realmente ayuda a bajar de peso?",
        a: "No reemplaza una alimentación balanceada ni el ejercicio: combina técnicas que mejoran la circulación, reducen medidas y tonifican la apariencia de la piel. Te lo explicamos claro en tu primera cita, sin promesas irreales."
      },
      {
        q: "¿Con qué ropa debo llegar?",
        a: "Te prestamos ropa desechable para la sesión. Solo trae ropa cómoda para antes y después de tu masaje."
      },
      {
        q: "¿Cuánto dura cada sesión?",
        a: "Entre 45 y 60 minutos según el tipo de masaje. Te recomendamos llegar 10 minutos antes para tu diagnóstico corporal."
      },
      {
        q: "¿Necesito receta médica?",
        a: "No para los masajes estéticos y relajantes. Si tienes una condición médica particular (embarazo, cirugías recientes, lesiones), cuéntanoslo al agendar para ajustar la técnica."
      }
    ],

    contact: {
      phone: "+57 300 000 0000",
      whatsapp: "+57 300 000 0000",
      email: "hola@carolspa-demo.co",
      address: "Cra. 76 # 34-20, Laureles, Medellín"
    }
  };
})();
