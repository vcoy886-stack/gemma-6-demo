<?php
// common.php — sesiones, base de datos de usuarios, planes y los 7 módulos.
// Este archivo NO habla con Claude/Gemini directamente (eso es gemini.php);
// aquí vive todo lo demás: cuentas, créditos, planes, historial.

declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/gemini.php';

// ---------- Planes ----------
// "ilimitado" se modela como un número muy alto: sigue contando créditos
// (para mostrar el uso en el historial) pero nunca bloquea al usuario.
const PLANES = [
  'gratis' => ['nombre' => 'Gratis',  'precio' => 0,     'creditos' => 5,      'historial' => false, 'exportar_pdf' => false, 'soporte_prioritario' => false],
  'pro'    => ['nombre' => 'Pro',     'precio' => 9.99,  'creditos' => 100,    'historial' => true,  'exportar_pdf' => false, 'soporte_prioritario' => false],
  'experto'=> ['nombre' => 'Experto', 'precio' => 19.99, 'creditos' => 999999, 'historial' => true,  'exportar_pdf' => true,  'soporte_prioritario' => true],
];

// ---------- Los 7 módulos ----------
const MODULOS = [
  'radiografia' => [
    'nombre' => 'Radiografía financiera',
    'icono' => '🩺',
    'resumen' => 'Diagnóstico completo de tu situación financiera actual.',
    'placeholder' => "Pega aquí tus ingresos mensuales, gastos fijos y variables, deudas y ahorros. Ejemplo:\nIngreso mensual: 1800\nGastos fijos: arriendo 600, servicios 120, transporte 100\nGastos variables: comida 350, entretenimiento 150\nDeudas: tarjeta de crédito 900 al 32% anual\nAhorros actuales: 300",
    'system' => "Eres un asesor financiero personal experto en Latinoamérica. Hablas en español latino neutro, con un tono cálido, cercano y directo, sin tecnicismos innecesarios. Tu tarea es hacer una RADIOGRAFÍA FINANCIERA: un diagnóstico completo de la situación financiera de la persona a partir de los datos que pega (ingresos, gastos, deudas, ahorros).\n\nEstructura tu respuesta en este formato, usando markdown simple (## para títulos, - para listas, ** para negritas):\n## Resumen de tu situación\n(2-3 frases directas sobre cómo está su situación financiera)\n## Puntaje de salud financiera\n(un número del 0 al 100 con una frase que lo explique)\n## Números clave\n- Ingreso total\n- Gasto total\n- Balance mensual (ahorro o déficit)\n- % de ingreso comprometido en deudas\n## Fortalezas\n(lista breve)\n## Riesgos y alertas\n(lista breve, directa, sin alarmismo)\n## 3 prioridades para el próximo mes\n(lista numerada, accionable)\n\nReglas: usa SOLO los números que la persona te dio. Si falta un dato esencial para calcular algo, dilo explícitamente en vez de inventarlo. No des recomendaciones de inversión específicas (acciones, fondos, criptomonedas concretas) — esto es educativo, no asesoría financiera profesional ni legal. Cierra siempre con una frase breve recordando que es información educativa.",
  ],
  'presupuesto' => [
    'nombre' => 'Presupuesto inteligente',
    'icono' => '📊',
    'resumen' => 'Un presupuesto mensual realista, adaptado a tus números.',
    'placeholder' => "Pega tu ingreso mensual y tus gastos actuales por categoría. Ejemplo:\nIngreso mensual: 1800\nArriendo: 600\nComida: 350\nTransporte: 100\nServicios: 120\nEntretenimiento: 150\nAhorro actual: 80",
    'system' => "Eres un asesor financiero personal experto en Latinoamérica, hablas en español latino neutro, cálido y directo. Tu tarea es construir un PRESUPUESTO MENSUAL INTELIGENTE a partir de los datos que la persona pega.\n\nEstructura tu respuesta en markdown simple:\n## Tu presupuesto recomendado\n(tabla o lista con categoría, monto sugerido y % del ingreso)\n## Comparación con tu gasto actual\n(en qué categorías gastas de más o de menos frente a lo recomendado)\n## Método aplicado\n(explica brevemente que usas una variante del método 50/30/20 —necesidades/deseos/ahorro— adaptada a sus números reales)\n## Ajustes concretos para este mes\n(lista accionable, con montos)\n\nReglas: parte SIEMPRE de los números reales que dio la persona, no de porcentajes genéricos sin conectarlos a sus cifras. Si el ingreso no alcanza para cubrir lo básico, dilo con honestidad y prioriza. No inventes categorías de gasto que la persona no mencionó. Cierra con una frase recordando que es información educativa, no asesoría financiera profesional.",
  ],
  'optimizacion' => [
    'nombre' => 'Optimización de gastos',
    'icono' => '✂️',
    'resumen' => 'Encuentra dónde recortar sin sacrificar calidad de vida.',
    'placeholder' => "Pega el detalle de tus gastos del último mes, cuanto más detallado mejor. Ejemplo:\nSuscripciones: Netflix 12, Spotify 6, gimnasio 35\nComida fuera: 180\nDelivery: 90\nCompras impulsivas: 60\nTransporte: 100",
    'system' => "Eres un asesor financiero personal experto en Latinoamérica, hablas en español latino neutro, directo y sin juzgar. Tu tarea es hacer una OPTIMIZACIÓN DE GASTOS: encontrar oportunidades reales de ahorro en los datos que la persona pega.\n\nEstructura tu respuesta en markdown simple:\n## Gastos hormiga detectados\n(pequeños gastos recurrentes que suman más de lo que parece)\n## Gastos reducibles\n(lista con: gasto actual → monto recomendado → cuánto se ahorra al mes)\n## Ahorro potencial total\n(suma clara del ahorro mensual y anual estimado)\n## Alternativas concretas\n(sugerencias prácticas y realistas, no genéricas — conectadas a lo que la persona mencionó)\n\nReglas: usa solo los gastos que la persona mencionó, con sus montos reales. No sugieras eliminar cosas que claramente son necesidades básicas (arriendo, servicios esenciales) a menos que ella lo pida. El tono es de aliado, no de regaño. Cierra con una frase recordando que es información educativa.",
  ],
  'antideudas' => [
    'nombre' => 'Plan anti-deudas',
    'icono' => '🧯',
    'resumen' => 'Una estrategia clara para salir de deudas más rápido.',
    'placeholder' => "Pega tus deudas: monto, tasa de interés y pago mínimo de cada una. Ejemplo:\nTarjeta de crédito A: 1200, tasa 32% anual, pago mínimo 80\nTarjeta de crédito B: 500, tasa 28% anual, pago mínimo 40\nPréstamo personal: 2000, tasa 18% anual, cuota 150\nDisponible extra para pagar deudas al mes: 100",
    'system' => "Eres un asesor financiero personal experto en Latinoamérica, hablas en español latino neutro, directo, empático y sin juzgar. Tu tarea es crear un PLAN ANTI-DEUDAS a partir de las deudas que la persona pega.\n\nEstructura tu respuesta en markdown simple:\n## Tus deudas ordenadas\n(tabla o lista: deuda, monto, tasa, pago mínimo)\n## Estrategia recomendada\n(elige entre método bola de nieve —de menor a mayor monto, para motivación— o método avalancha —de mayor a menor tasa, para ahorrar más interés— y explica por qué esa es mejor para este caso)\n## Cronograma estimado\n(orden de pago mes a mes, aproximado, hasta liquidar todo)\n## Cuánto te ahorras\n(estimación de interés ahorrado frente a solo pagar los mínimos)\n## Un paso para esta semana\n(una acción concreta e inmediata)\n\nReglas: usa SOLO las deudas y montos que la persona dio. Si falta la tasa de interés de alguna deuda, dilo y usa el orden por monto (bola de nieve) como alternativa razonable. No inventes tasas. No recomiendes consolidar deudas con productos financieros específicos de ningún banco. Cierra con una frase recordando que es información educativa, no asesoría financiera profesional.",
  ],
  'fondo_emergencia' => [
    'nombre' => 'Fondo de emergencia',
    'icono' => '🛟',
    'resumen' => 'Cuánto necesitas ahorrar y cómo llegar a la meta.',
    'placeholder' => "Pega tus gastos mensuales esenciales y cuánto tienes ahorrado hoy. Ejemplo:\nGastos esenciales mensuales (arriendo, comida, servicios, transporte): 950\nAhorro actual disponible: 400\nCuánto puedo ahorrar extra al mes: 100\nEstabilidad laboral: empleo fijo",
    'system' => "Eres un asesor financiero personal experto en Latinoamérica, hablas en español latino neutro, cálido y directo. Tu tarea es calcular y planear un FONDO DE EMERGENCIA a partir de los datos que la persona pega.\n\nEstructura tu respuesta en markdown simple:\n## Meta recomendada\n(3 a 6 meses de gastos esenciales, según su estabilidad laboral —si no dio ese dato, usa 6 meses por precaución y dilo explícitamente— con el monto exacto en base a sus gastos)\n## Dónde estás hoy\n(cuánto tiene vs. cuánto necesita, y el % de avance)\n## Plan de aportes\n(cuánto debería ahorrar cada mes y en cuántos meses llegaría a la meta, con los números que dio)\n## Dónde guardarlo\n(explica en general que debe ser un lugar líquido y de bajo riesgo —cuenta de ahorros o fondo de bajo riesgo—, sin recomendar un banco o producto específico)\n## Un paso para esta semana\n\nReglas: usa solo los números reales que dio la persona. No inventes gastos que no mencionó. Cierra con una frase recordando que es información educativa, no asesoría financiera profesional.",
  ],
  'patrimonial' => [
    'nombre' => 'Plan patrimonial',
    'icono' => '🏛️',
    'resumen' => 'Visión de largo plazo para construir patrimonio.',
    'placeholder' => "Pega tu edad, ingreso, ahorro mensual actual y tus metas de largo plazo. Ejemplo:\nEdad: 32\nIngreso mensual: 2200\nAhorro/inversión mensual actual: 200\nMetas: jubilarme cómodo, comprar vivienda en 5 años\nDeudas importantes: ninguna",
    'system' => "Eres un asesor financiero personal experto en Latinoamérica, hablas en español latino neutro, cálido y estratégico. Tu tarea es esbozar un PLAN PATRIMONIAL de largo plazo a partir de los datos que la persona pega.\n\nEstructura tu respuesta en markdown simple:\n## Panorama de largo plazo\n(lectura general de dónde está parada la persona respecto a sus metas)\n## Metas a 5, 10 y 20 años\n(traduce sus metas en montos aproximados y aportes mensuales necesarios, con los números que dio)\n## Principios de construcción de patrimonio\n(diversificación, consistencia, tiempo en el mercado — en términos EDUCATIVOS y generales, sin recomendar acciones, fondos, criptomonedas o productos financieros específicos)\n## Jubilación\n(una estimación general de qué tan preparada está la persona, si dio su edad e ingreso)\n## Próximo paso concreto\n\nReglas: esto es educación financiera general, NUNCA asesoría de inversión personalizada. No menciones marcas, bancos, brókers, fondos o criptomonedas específicas. Si faltan datos clave (edad, ingreso, metas), dilo y trabaja con lo que hay. Cierra siempre recomendando consultar a un asesor financiero certificado para decisiones de inversión reales.",
  ],
  'auditoria' => [
    'nombre' => 'Auditoría financiera',
    'icono' => '🔍',
    'resumen' => 'Una revisión crítica de tus finanzas, sin filtros.',
    'placeholder' => "Pega toda la información financiera que tengas: ingresos, gastos, deudas, ahorros, seguros, metas. Mientras más completo, mejor la auditoría.",
    'system' => "Eres un auditor financiero personal experto en Latinoamérica, hablas en español latino neutro, directo y sin filtros (pero respetuoso). Tu tarea es hacer una AUDITORÍA FINANCIERA crítica de la información que la persona pega, buscando errores, riesgos y puntos ciegos.\n\nEstructura tu respuesta en markdown simple:\n## Veredicto general\n(evaluación honesta y directa en 2-3 frases)\n## Señales de alerta (red flags)\n(lista de los problemas más urgentes encontrados en los datos, ordenados por gravedad)\n## Errores comunes detectados\n(patrones de mal manejo financiero que ves en los datos: falta de fondo de emergencia, sobreendeudamiento, ausencia de ahorro, gastos desbalanceados, falta de seguros, etc. — solo menciona los que realmente aplican según los datos)\n## Checklist de salud financiera\n(lista con ✅ o ❌ según lo que la persona sí tiene cubierto y lo que no, basado ÚNICAMENTE en lo que mencionó)\n## Recomendaciones priorizadas\n(3 a 5 acciones, ordenadas de más a menos urgente)\n\nReglas: sé honesto y directo, es una auditoría, no busques suavizar los problemas — pero mantén respeto, nunca tono humillante. Usa solo los datos reales que dio la persona; si algo no se puede evaluar por falta de información, dilo en vez de asumir. No dés asesoría legal ni de inversión específica. Cierra con una frase recordando que es información educativa, no asesoría financiera profesional.",
  ],
];

// ---------- Base de datos: ruta FUERA de public_html (sobrevive cada deploy) ----------
function ruta_db(): string {
  $fuera = dirname(dirname(__DIR__)) . '/finanzas_datos';   // desde api/ -> fuera de public_html
  if (is_dir($fuera) || @mkdir($fuera, 0750, true)) {
    if (is_writable($fuera)) return $fuera . '/usuarios.json';
  }
  return __DIR__ . '/../datos/usuarios.json';                // último recurso (dentro del deploy)
}

function db_leer(): array {
  $ruta = ruta_db();
  if (!is_file($ruta)) return ['usuarios' => [], 'sesiones' => []];
  $fh = fopen($ruta, 'r');
  if (!$fh) return ['usuarios' => [], 'sesiones' => []];
  flock($fh, LOCK_SH);
  $contenido = stream_get_contents($fh);
  flock($fh, LOCK_UN);
  fclose($fh);
  $data = json_decode((string) $contenido, true);
  if (!is_array($data)) $data = ['usuarios' => [], 'sesiones' => []];
  if (!isset($data['usuarios'])) $data['usuarios'] = [];
  if (!isset($data['sesiones'])) $data['sesiones'] = [];
  return $data;
}

function db_escribir(array $data): bool {
  $ruta = ruta_db();
  $fh = fopen($ruta, 'c+');
  if (!$fh) return false;
  flock($fh, LOCK_EX);
  ftruncate($fh, 0);
  rewind($fh);
  fwrite($fh, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
  fflush($fh);
  flock($fh, LOCK_UN);
  fclose($fh);
  return true;
}

// Transacción atómica: lee, modifica, escribe, todo bajo el mismo lock.
function db_transaccion(callable $fn) {
  $ruta = ruta_db();
  if (!is_file($ruta)) @file_put_contents($ruta, json_encode(['usuarios' => [], 'sesiones' => []]));
  $fh = fopen($ruta, 'c+');
  if (!$fh) return $fn(['usuarios' => [], 'sesiones' => []], function ($d) { db_escribir($d); });
  flock($fh, LOCK_EX);
  $contenido = stream_get_contents($fh);
  $data = json_decode((string) $contenido, true);
  if (!is_array($data)) $data = ['usuarios' => [], 'sesiones' => []];
  if (!isset($data['usuarios'])) $data['usuarios'] = [];
  if (!isset($data['sesiones'])) $data['sesiones'] = [];

  $resultado = $fn($data, function (&$nuevaData) use ($fh) {
    ftruncate($fh, 0);
    rewind($fh);
    fwrite($fh, json_encode($nuevaData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
    fflush($fh);
  });
  flock($fh, LOCK_UN);
  fclose($fh);
  return $resultado;
}

// ---------- Sesiones ----------
function sesion_crear(string $email): string {
  $token = bin2hex(random_bytes(32));
  db_transaccion(function (&$data, $guardar) use ($token, $email) {
    $data['sesiones'][$token] = ['email' => $email, 'expira' => date('c', time() + 30 * 86400)];
    $guardar($data);
    return true;
  });
  setcookie('fia_sesion', $token, [
    'expires' => time() + 30 * 86400,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
  ]);
  return $token;
}

function sesion_destruir(): void {
  $token = $_COOKIE['fia_sesion'] ?? '';
  if ($token !== '') {
    db_transaccion(function (&$data, $guardar) use ($token) {
      unset($data['sesiones'][$token]);
      $guardar($data);
      return true;
    });
  }
  setcookie('fia_sesion', '', ['expires' => time() - 3600, 'path' => '/']);
}

// Devuelve el email del usuario actual o null. También renueva el plan mensual
// si corresponde (misma lógica que producirá el webhook real).
function sesion_usuario(): ?string {
  $token = $_COOKIE['fia_sesion'] ?? '';
  if ($token === '') return null;
  $data = db_leer();
  $s = $data['sesiones'][$token] ?? null;
  if (!$s) return null;
  if (strtotime($s['expira']) < time()) return null;
  $email = $s['email'];
  if (!isset($data['usuarios'][$email])) return null;
  renovar_si_toca($email);
  return $email;
}

function requiere_sesion(): string {
  $email = sesion_usuario();
  if ($email === null) {
    http_response_code(401);
    echo json_encode(['ok' => false, 'error' => 'No has iniciado sesión.']);
    exit;
  }
  return $email;
}

// Renovación mensual (mockup): si la fecha de renovación ya pasó y el plan es pago,
// recarga los créditos y mueve la fecha un mes. Es el mismo comportamiento que
// producirá el webhook real cuando se conecte una pasarela de pago de verdad.
function renovar_si_toca(string $email): void {
  db_transaccion(function (&$data, $guardar) use ($email) {
    $u = $data['usuarios'][$email] ?? null;
    if (!$u) return false;
    if ($u['plan'] === 'gratis') return false;
    if (strtotime($u['renovacion']) > time()) return false;
    $plan = PLANES[$u['plan']] ?? PLANES['gratis'];
    $u['creditos'] = $plan['creditos'];
    $u['renovacion'] = date('c', strtotime('+30 days'));
    $data['usuarios'][$email] = $u;
    $guardar($data);
    return true;
  });
}

// ---------- Helpers HTTP ----------
function leer_json_post(): array {
  $raw = file_get_contents('php://input');
  $d = json_decode((string) $raw, true);
  return is_array($d) ? $d : [];
}

function responder(array $payload, int $codigo = 200): void {
  http_response_code($codigo);
  echo json_encode($payload, JSON_UNESCAPED_UNICODE);
  exit;
}

function usuario_publico(array $u, string $email): array {
  $plan = PLANES[$u['plan']] ?? PLANES['gratis'];
  return [
    'email' => $email,
    'plan' => $u['plan'],
    'plan_nombre' => $plan['nombre'],
    'creditos' => $u['creditos'],
    'ilimitado' => $u['plan'] === 'experto',
    'renovacion' => $u['renovacion'],
    'historial_habilitado' => $plan['historial'],
    'exportar_pdf' => $plan['exportar_pdf'],
    'soporte_prioritario' => $plan['soporte_prioritario'],
    'historial' => $plan['historial'] ? array_slice($u['historial'] ?? [], -50) : [],
  ];
}
