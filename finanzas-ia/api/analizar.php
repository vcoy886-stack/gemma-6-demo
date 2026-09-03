<?php
// analizar.php — el endpoint importante: valida créditos, reserva, llama a la
// IA (Claude primero, Gemini de respaldo) y decrementa o reembolsa según el
// resultado. El costo SIEMPRE se calcula aquí, nunca se confía en el navegador.
require_once __DIR__ . '/common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') responder(['ok' => false, 'error' => 'Método no permitido'], 405);

$email = requiere_sesion();

$limite = ia_limites('fia');
if ($limite !== '') {
  $mensaje = $limite === 'rate_min'
    ? 'Vas muy rápido 🙂 espera unos segundos y vuelve a intentar.'
    : 'Se alcanzó el límite de análisis por hoy. Vuelve a intentarlo mañana.';
  responder(['ok' => false, 'error' => $mensaje], 429);
}

$body = leer_json_post();
$moduloId = (string) ($body['modulo'] ?? '');
$datosUsuario = trim((string) ($body['datos'] ?? ''));

if (!isset(MODULOS[$moduloId])) responder(['ok' => false, 'error' => 'Módulo no reconocido.'], 400);
if ($datosUsuario === '') responder(['ok' => false, 'error' => 'Pega tus datos financieros antes de analizar.'], 400);
if (mb_strlen($datosUsuario) > 8000) responder(['ok' => false, 'error' => 'El texto es demasiado largo. Resúmelo un poco (máx. 8000 caracteres).'], 400);

$costo = 1; // un crédito = un análisis, siempre, en cualquier módulo

// 1) ¿Hay créditos? 2) Reservarlos ya (antes de llamar a la IA).
$reserva = db_transaccion(function (&$data, $guardar) use ($email, $costo) {
  $u = $data['usuarios'][$email];
  if ($u['plan'] !== 'experto' && $u['creditos'] < $costo) return ['ok' => false];
  $u['creditos'] -= $costo;
  $data['usuarios'][$email] = $u;
  $guardar($data);
  return ['ok' => true];
});

if (!$reserva['ok']) {
  responder(['ok' => false, 'error' => 'No te quedan créditos este mes.', 'sin_creditos' => true], 402);
}

if (!ia_hay_clave()) {
  // Reembolso: el servicio de IA aún no está configurado.
  db_transaccion(function (&$data, $guardar) use ($email, $costo) {
    $data['usuarios'][$email]['creditos'] += $costo;
    $guardar($data);
    return true;
  });
  responder(['ok' => false, 'error' => 'El asesor de IA todavía no está activado en este sitio. Vuelve en unos minutos.'], 503);
}

$modulo = MODULOS[$moduloId];
$prompt = "Estos son los datos financieros que la persona pegó:\n\n" . $datosUsuario . "\n\nGenera tu análisis siguiendo exactamente la estructura indicada.";
$r = ia_texto($modulo['system'], $prompt, 2200);

if (!$r['ok']) {
  db_transaccion(function (&$data, $guardar) use ($email, $costo) {
    $data['usuarios'][$email]['creditos'] += $costo;
    $guardar($data);
    return true;
  });
  responder(['ok' => false, 'error' => 'Ahora mismo no pude generar tu análisis. Se te devolvió el crédito, inténtalo de nuevo en un momento.'], 502);
}

$texto = trim(preg_replace('/^```(?:markdown|md)?|```$/m', '', $r['texto']));

// Guardar en historial + devolver estado actualizado, en una sola transacción.
$usuarioFinal = db_transaccion(function (&$data, $guardar) use ($email, $moduloId, $costo, $texto, $modulo) {
  $u = $data['usuarios'][$email];
  $u['historial'][] = [
    'fecha' => date('c'),
    'modulo' => $moduloId,
    'modulo_nombre' => $modulo['nombre'],
    'coste' => $costo,
    'resultado' => $texto,
  ];
  $u['historial'] = array_slice($u['historial'], -200);
  $data['usuarios'][$email] = $u;
  $guardar($data);
  return $u;
});

responder(['ok' => true, 'resultado' => $texto, 'usuario' => usuario_publico($usuarioFinal, $email)]);
