export const HELP_TOPICS: { keywords: string[]; title: string; steps: string[] }[] = [
  {
    keywords: ["crear producto", "nuevo producto", "agregar producto", "cargar producto"],
    title: "Cómo crear un producto",
    steps: [
      "Ve a Productos en el menú lateral.",
      'Haz clic en "Nuevo producto".',
      "Completa nombre, código único, precio y costo (el costo te da el margen automáticamente).",
      "Opcionalmente asigna una categoría e inventario inicial.",
      "Guarda. El producto ya estará disponible para cotizaciones y ventas.",
    ],
  },
  {
    keywords: ["agregar vendedor", "crear usuario", "nuevo usuario", "invitar vendedor", "crear vendedor"],
    title: "Cómo agregar un vendedor o usuario",
    steps: [
      "Ve a Configuración → Usuarios (solo disponible para administradores).",
      'Haz clic en "Nuevo usuario".',
      "Completa nombre, correo, contraseña temporal y elige su rol: Administrador, Gerente, Vendedor o Asistente.",
      "El rol define qué puede ver y hacer: un Vendedor solo ve sus propios clientes y ventas.",
      "Guarda. La persona ya puede iniciar sesión con esas credenciales.",
    ],
  },
  {
    keywords: ["crear automatización", "automatizacion", "regla automática", "automatizar"],
    title: "Cómo crear una automatización",
    steps: [
      "Ve a Automatizaciones en el menú lateral.",
      'Haz clic en "Nueva automatización".',
      'Elige un disparador (ej. "Lead nuevo", "Puntuación supera X", "Venta ganada").',
      "Agrega una o más acciones (crear tarea, marcar prioridad, cambiar estado, ajustar puntuación, notificar).",
      "Actívala. A partir de ahí se ejecuta automáticamente cuando ocurre el evento en el sistema.",
    ],
  },
  {
    keywords: ["importar cliente", "importar csv", "importar excel", "cargar clientes", "subir clientes"],
    title: "Cómo importar clientes desde CSV/Excel",
    steps: [
      "Ve a CRM → Importar CSV.",
      "Sube un archivo .csv con columnas como nombre, apellido, telefono, correo, ciudad, empresa.",
      "Revisa la vista previa: el sistema marca filas con teléfonos inválidos, datos faltantes o duplicados.",
      "Desmarca las filas que no quieras importar.",
      'Haz clic en "Confirmar importación". Verás cuántos se crearon, cuántos se omitieron y por qué.',
    ],
  },
  {
    keywords: ["ver ventas", "consultar ventas", "reporte de ventas", "mis ventas"],
    title: "Cómo ver tus ventas",
    steps: [
      "Ve a Ventas en el menú lateral para ver el listado completo con filtros por estado.",
      "O pregúntame directamente: \"Muéstrame las ventas de este mes\".",
      "En el Dashboard también tienes ventas de hoy, del mes y del año, con gráfico de tendencia.",
      "En Reportes puedes exportar el detalle.",
    ],
  },
  {
    keywords: ["crear cotización", "nueva cotización", "hacer cotización", "cotizar"],
    title: "Cómo crear una cotización",
    steps: [
      "Ve a Cotizaciones → Nueva cotización.",
      "Selecciona el cliente (o créalo primero desde el CRM si es nuevo).",
      "Agrega los productos, cantidades y descuentos por línea.",
      "Ajusta el descuento general e impuestos si aplica.",
      'Guarda. Desde el detalle puedes descargar el PDF y cambiar el estado (Enviada, Vista, Aceptada, Rechazada).',
    ],
  },
  {
    keywords: ["cerrar venta", "registrar venta", "convertir cotización", "nueva venta"],
    title: "Cómo cerrar y registrar una venta",
    steps: [
      "Si ya tienes una cotización aceptada, ábrela y haz clic en \"Convertir en venta\".",
      "O ve directamente a Ventas → Registrar venta y arma la venta desde cero.",
      "Indica método de pago y estado (Pagada, Pendiente, En proceso).",
      "Al guardar, el inventario del producto se descuenta automáticamente y el cliente pasa a estado Ganado.",
    ],
  },
  {
    keywords: ["configurar empresa", "datos de la empresa", "logo", "moneda", "impuesto"],
    title: "Cómo configurar los datos de tu empresa",
    steps: [
      "Ve a Configuración → Empresa.",
      "Completa nombre, dirección, teléfono, WhatsApp, moneda e impuesto por defecto.",
      "Estos datos aparecen automáticamente en tus cotizaciones en PDF.",
    ],
  },
  {
    keywords: ["pipeline", "etapas", "kanban", "mover oportunidad"],
    title: "Cómo usar el pipeline de ventas",
    steps: [
      "Ve a Pipeline para ver tus oportunidades organizadas en columnas por etapa.",
      "Arrastra una tarjeta a otra columna para avanzarla (o marcarla ganada/perdida).",
      'Crea una nueva oportunidad con el botón "Nueva oportunidad", eligiendo cliente, producto y valor estimado.',
    ],
  },
  {
    keywords: ["puntuación", "lead scoring", "score", "por qué mi lead"],
    title: "Cómo funciona el lead scoring",
    steps: [
      "Cada contacto empieza en 0 puntos. Sube o baja según lo que registras: pidió precio (+20), pidió cotización (+18), respondió a un seguimiento (+15), etc.",
      "Puedes ver el desglose completo (motivo por motivo) en la ficha del contacto, en la sección \"Explicación de puntuación\".",
      "Los niveles son: 0-20 Frío, 21-40 Interesado, 41-60 Caliente, 61-80 Muy caliente, 81-100 Alta prioridad.",
      "Para sumar puntos a un lead, registra una actividad en su ficha y elige el motivo correspondiente.",
    ],
  },
];

export function matchHelpTopic(question: string) {
  const q = question.toLowerCase();
  for (const topic of HELP_TOPICS) {
    if (topic.keywords.some((k) => q.includes(k))) return topic;
  }
  return null;
}

export function formatHelpTopic(topic: NonNullable<ReturnType<typeof matchHelpTopic>>) {
  return `${topic.title}:\n${topic.steps.map((s, i) => `${i + 1}. ${s}`).join("\n")}`;
}
