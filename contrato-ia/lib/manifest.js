(function () {
  "use strict";
  window.__BRAND__ = {
    name: "ContratoIA",
    tagline: "Revisa un contrato antes de firmarlo, en minutos",
    dominio: window.location.host,

    tipos: [
      { id: "freelance", nombre: "Servicios / freelance" },
      { id: "arriendo",  nombre: "Arriendo" },
      { id: "laboral",   nombre: "Laboral" },
      { id: "marca",     nombre: "Marca / colaboración" },
      { id: "otro",      nombre: "Otro" }
    ],

    planes: [
      { id: "gratis",  nombre: "Gratis",  precio: 0,     creditos: "3 análisis / mes",
        caracteristicas: ["3 análisis al mes", "Sin tarjeta de crédito"] },
      { id: "pro",     nombre: "Pro",     precio: 14.99, creditos: "50 análisis / mes", destacado: true,
        caracteristicas: ["50 análisis al mes", "Historial de contratos guardado", "Soporte por correo"] },
      { id: "experto", nombre: "Experto", precio: 29.99, creditos: "Análisis ilimitados",
        caracteristicas: ["Análisis ilimitados", "Historial de contratos guardado", "Exportar a PDF", "Soporte prioritario"] }
    ],

    testimonios: [
      { nombre: "Daniela P.", rol: "Diseñadora UX freelance", texto: "Pegué un contrato de un cliente nuevo y en dos minutos supe exactamente qué cláusula pedir que cambiaran. Antes firmaba sin leer todo." },
      { nombre: "Andrés M.", rol: "Creador de contenido", texto: "Uso ContratoIA cada vez que una marca me manda una propuesta. Me ha salvado de dos cláusulas de exclusividad abusivas." },
      { nombre: "Sofía L.", rol: "Consultora independiente", texto: "Directo, sin relleno. Me dice qué preguntar antes de firmar y ya." }
    ],

    faqs: [
      { p: "¿ContratoIA reemplaza a un abogado?", r: "No. Es una herramienta de información educativa que te ayuda a entender un contrato rápido. Para contratos de alto valor o riesgo, siempre recomendamos revisión de un abogado." },
      { p: "¿Qué tipos de contrato puedo analizar?", r: "Cualquiera: servicios, freelance, arriendo, laboral, colaboraciones con marcas, y más. Puedes indicar el tipo para un análisis más afinado." },
      { p: "¿Mis contratos quedan seguros?", r: "El texto se procesa solo para generar tu análisis y no se comparte con terceros ni se usa para entrenar modelos de IA. Ver Política de Privacidad." },
      { p: "¿Qué es un crédito?", r: "Un crédito equivale a un análisis de contrato completo." },
      { p: "¿Puedo cancelar cuando quiera?", r: "Sí, sin permanencia. Cancelas desde tu cuenta y vuelves al plan Gratis al instante." }
    ],

    contacto: { email: "soporte@contratoia.app" }
  };
})();
