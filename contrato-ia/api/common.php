<?php
// common.php — sesiones, base de datos de usuarios, planes y el analizador de contratos.
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

require_once __DIR__ . '/gemini.php';

// ---------- Planes ----------
const PLANES = [
  'gratis'  => ['nombre' => 'Gratis',  'precio' => 0,     'creditos' => 3,      'historial' => false, 'exportar_pdf' => false, 'soporte_prioritario' => false],
  'pro'     => ['nombre' => 'Pro',     'precio' => 14.99, 'creditos' => 50,     'historial' => true,  'exportar_pdf' => false, 'soporte_prioritario' => false],
  'experto' => ['nombre' => 'Experto', 'precio' => 29.99, 'creditos' => 999999, 'historial' => true,   'exportar_pdf' => true,  'soporte_prioritario' => true],
];

// ---------- Tipos de contrato (afinan el prompt, no cambian el precio) ----------
const TIPOS_CONTRATO = [
  'freelance' => 'Contrato de servicios / freelance',
  'arriendo'  => 'Contrato de arriendo',
  'laboral'   => 'Contrato laboral',
  'marca'     => 'Propuesta o contrato con una marca (colaboración, patrocinio)',
  'otro'      => 'Otro tipo de contrato',
];

const SYSTEM_ANALISIS = "Eres un asesor experto en revisión de contratos para freelancers, profesionales independientes, creadores de contenido y pequeños negocios en Latinoamérica. Hablas en español latino neutro, directo y claro, como alguien que ya leyó miles de contratos y sabe exactamente qué buscar.\n\nTu tarea es analizar el contrato que la persona pega y ayudarla a decidir si firmarlo, negociarlo o rechazarlo.\n\nEstructura tu respuesta en este formato, con markdown simple (## para títulos, - para listas, ** para negritas):\n## Resumen en simple\n(2-4 frases explicando de qué trata el contrato y el veredicto general: firmable, firmable con cambios, o riesgoso)\n## Cláusulas de riesgo\n(lista cada cláusula problemática empezando con 🔴 (riesgo alto), 🟡 (riesgo medio) o 🟢 (riesgo bajo), citando o parafraseando la cláusula y explicando por qué es un problema)\n## Obligaciones clave\n(qué se está comprometiendo a hacer cada parte)\n## Fechas y plazos importantes\n(duración, renovación, plazos de pago, plazos de entrega, avisos de terminación)\n## Penalidades y multas\n(qué pasa si algo sale mal o si alguna parte incumple)\n## Preguntas para hacer antes de firmar\n(lista de 3-6 preguntas concretas que debería hacerle a la otra parte)\n\nReglas: usa SOLO lo que está escrito en el contrato que te pasaron. Si falta información relevante (por ejemplo, no menciona plazo de pago), dilo explícitamente en vez de asumir. Sé directo sobre cláusulas abusivas (exclusividad excesiva, cesión de derechos sin compensación, penalidades desproporcionadas, ausencia de plazo de pago, renovación automática oculta) — para eso te están pagando. Nunca inventes cláusulas que no están en el texto. Cierra SIEMPRE con una frase recordando que esto es información educativa generada por IA, no asesoría legal, y que para contratos de alto valor o riesgo conviene revisión de un abogado.";

// ---------- Base de datos: ruta FUERA de public_html (sobrevive cada deploy) ----------
function ruta_db(): string {
  $fuera = dirname(dirname(__DIR__)) . '/contrato_datos';   // desde api/ -> fuera de public_html
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
  setcookie('cia_sesion', $token, [
    'expires' => time() + 30 * 86400,
    'path' => '/',
    'httponly' => true,
    'samesite' => 'Lax',
    'secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
  ]);
  return $token;
}

function sesion_destruir(): void {
  $token = $_COOKIE['cia_sesion'] ?? '';
  if ($token !== '') {
    db_transaccion(function (&$data, $guardar) use ($token) {
      unset($data['sesiones'][$token]);
      $guardar($data);
      return true;
    });
  }
  setcookie('cia_sesion', '', ['expires' => time() - 3600, 'path' => '/']);
}

function sesion_usuario(): ?string {
  $token = $_COOKIE['cia_sesion'] ?? '';
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
