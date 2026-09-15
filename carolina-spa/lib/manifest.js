(function () {
  "use strict";
  window.__BRAND__ = {
    name: "Carolina Spa",
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
        icon: "🔥",
        name: "Masajes Reductores",
        desc: "Técnica de modelado corporal manual enfocada en abdomen, cintura y piernas, combinada con productos termoactivos.",
        from: "Desde $75.000 COP"
      },
      {
        icon: "🌸",
        name: "Masajes Relajantes",
        desc: "Aromaterapia y técnicas suecas para liberar el estrés acumulado, con aceites esenciales y ambiente calmado.",
        from: "Desde $65.000 COP"
      },
      {
        icon: "💆",
        name: "Masajes Descontracturantes",
        desc: "Trabajo profundo en cuello, espalda y hombros para liberar tensión muscular y dolores por mala postura.",
        from: "Desde $80.000 COP"
      }
    ],

    plans: [
      {
        name: "Sesión de Bienvenida",
        price: "$65.000",
        period: "primera sesión",
        features: ["Un masaje a elección", "Diagnóstico corporal gratis", "Sin compromiso"],
        cta: "Agendar mi sesión",
        highlight: false
      },
      {
        name: "Paquete Mensual",
        price: "$240.000",
        period: "COP / mes · 4 sesiones",
        features: ["Combina reductor y relajante", "Ahorra frente al precio individual", "Agenda prioritaria"],
        cta: "Quiero este plan",
        highlight: true
      },
      {
        name: "Plan VIP Trimestral",
        price: "$650.000",
        period: "COP / trimestre · 12 sesiones",
        features: ["Todos los tipos de masaje", "Una sesión de regalo", "Descuento en productos del spa"],
        cta: "Hablar con asesora",
        highlight: false
      }
    ],

    testimonials: [
      {
        quote: "Empecé el paquete mensual buscando bajar el estrés del trabajo y terminé enganchada también con el reductor. Se nota el cambio en la piel y en cómo duermo.",
        name: "Testimonio ilustrativo",
        role: "Contenido de ejemplo para esta demo"
      },
      {
        quote: "El masaje descontracturante me quitó un dolor de espalda que tenía hace meses. La atención es muy cálida, no se siente como una cadena más.",
        name: "Testimonio ilustrativo",
        role: "Contenido de ejemplo para esta demo"
      }
    ],

    faqs: [
      {
        q: "¿Los masajes reductores realmente ayudan a bajar de peso?",
        a: "No reemplazan una alimentación balanceada ni el ejercicio: su efecto principal es mejorar la circulación, reducir retención de líquidos y tonificar la apariencia de la piel. Te lo explicamos claro en tu primera cita, sin promesas irreales."
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
      email: "hola@carolinaspa-demo.co",
      address: "Cra. 76 # 34-20, Laureles, Medellín"
    }
  };
})();
