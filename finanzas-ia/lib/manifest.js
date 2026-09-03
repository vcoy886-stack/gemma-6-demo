(function () {
  "use strict";
  window.__BRAND__ = {
    name: "FinanzasIA",
    tagline: "Tu asesor financiero con IA, en español",
    dominio: window.location.host,

    modulos: [
      { id: "radiografia",      icono: "🩺", nombre: "Radiografía financiera",  resumen: "Diagnóstico completo de tu situación financiera actual." },
      { id: "presupuesto",      icono: "📊", nombre: "Presupuesto inteligente", resumen: "Un presupuesto mensual realista, adaptado a tus números." },
      { id: "optimizacion",     icono: "✂️", nombre: "Optimización de gastos",  resumen: "Encuentra dónde recortar sin sacrificar calidad de vida." },
      { id: "antideudas",       icono: "🧯", nombre: "Plan anti-deudas",        resumen: "Una estrategia clara para salir de deudas más rápido." },
      { id: "fondo_emergencia", icono: "🛟", nombre: "Fondo de emergencia",     resumen: "Cuánto necesitas ahorrar y cómo llegar a la meta." },
      { id: "patrimonial",      icono: "🏛️", nombre: "Plan patrimonial",        resumen: "Visión de largo plazo para construir patrimonio." },
      { id: "auditoria",        icono: "🔍", nombre: "Auditoría financiera",    resumen: "Una revisión crítica de tus finanzas, sin filtros." }
    ],

    planes: [
      { id: "gratis",  nombre: "Gratis",  precio: 0,     periodo: "siempre",   creditos: "5 análisis / mes",        destacado: false,
        caracteristicas: ["5 análisis al mes", "Los 7 módulos disponibles", "Sin tarjeta de crédito"] },
      { id: "pro",     nombre: "Pro",     precio: 9.99,  periodo: "mes",       creditos: "100 análisis / mes",       destacado: true,
        caracteristicas: ["100 análisis al mes", "Historial de análisis guardado", "Los 7 módulos disponibles", "Soporte por correo"] },
      { id: "experto", nombre: "Experto", precio: 19.99, periodo: "mes",       creditos: "Análisis ilimitados",       destacado: false,
        caracteristicas: ["Análisis ilimitados", "Historial de análisis guardado", "Exportar a PDF", "Soporte prioritario"] }
    ],

    testimonios: [
      { nombre: "Marcela R.", rol: "Diseñadora freelance", texto: "En 5 minutos entendí por qué nunca me alcanzaba el dinero. El plan anti-deudas me dio un orden que no tenía." },
      { nombre: "Julián T.", rol: "Emprendedor", texto: "Uso la radiografía financiera cada mes para revisar cómo va mi negocio personal. Es directo, sin rodeos." },
      { nombre: "Camila V.", rol: "Profesional independiente", texto: "El fondo de emergencia por fin dejó de ser una idea vaga y se convirtió en un número y un plan." }
    ],

    faqs: [
      { p: "¿Mis datos financieros quedan seguros?", r: "Tus datos se procesan para generar tu análisis y no se comparten con terceros ni se usan para entrenar modelos de IA. Puedes leer el detalle en nuestra Política de Privacidad." },
      { p: "¿Qué es un crédito?", r: "Un crédito equivale a un análisis en cualquiera de los 7 módulos. Cada vez que pides un análisis se usa 1 crédito." },
      { p: "¿Puedo cancelar cuando quiera?", r: "Sí, sin permanencia. Cancelas desde tu cuenta y vuelves al plan Gratis al instante." },
      { p: "¿Esto reemplaza a un asesor financiero certificado?", r: "No. FinanzasIA ofrece información educativa generada por IA para ayudarte a entender y organizar tus finanzas personales. No es asesoría financiera, legal, contable ni de inversión profesional." },
      { p: "¿Qué pasa si se me acaban los créditos?", r: "Puedes esperar a la renovación del próximo mes o mejorar tu plan al instante para seguir analizando." }
    ],

    contacto: { email: "soporte@finanzasia.app" }
  };
})();
