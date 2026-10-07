<?php
// analizar.php — reserva créditos, llama a la IA (Claude primero, Gemini de
// respaldo) con el contrato pegado, decrementa o reembolsa según resultado.
require_once __DIR__ . '/common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') responder(['ok' => false, 'error' => 'Método no permitido'], 405);

$email = requiere_sesion();

$limite = ia_limites('cia');
if ($limite !== '') {
  $mensaje = $limite === 'rate_min'
    ? 'Vas muy rápido 🙂 espera unos segundos y vuelve a intentar.'
    : 'Se alcanzó el límite de análisis por hoy. Vuelve a intentarlo mañana.';
  responder(['ok' => false, 'error' => $mensaje], 429);
}

$body = leer_json_post();
$tipo = (string) ($body['tipo'] ?? 'otro');
$contrato = trim((string) ($body['contrato'] ?? ''));

if (!isset(TIPOS_CONTRATO[$tipo])) $tipo = 'otro';
if ($contrato === '') responder(['ok' => false, 'error' => 'Pega el texto del contrato antes de analizar.'], 400);
if (mb_strlen($contrato) < 40) responder(['ok' => false, 'error' => 'Eso parece muy corto para ser un contrato. Pega el texto completo.'], 400);
if (mb_strlen($contrato) > 20000) responder(['ok' => false, 'error' => 'El contrato es muy largo. Pega las cláusulas más relevantes (máx. 20.000 caracteres) o divídelo en partes.'], 400);

$costo = 1; // un crédito = un análisis de contrato

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
  db_transaccion(function (&$data, $guardar) use ($email, $costo) {
    $data['usuarios'][$email]['creditos'] += $costo;
    $guardar($data);
    return true;
  });
  responder(['ok' => false, 'error' => 'El asesor de IA todavía no está activado en este sitio. Vuelve en unos minutos.'], 503);
}

$prompt = "Tipo de contrato indicado por la persona: " . TIPOS_CONTRATO[$tipo] . "\n\n"
  . "Este es el texto del contrato que la persona pegó:\n\n" . $contrato
  . "\n\nGenera tu análisis siguiendo exactamente la estructura indicada.";
$r = ia_texto(SYSTEM_ANALISIS, $prompt, 2400);

if (!$r['ok']) {
  db_transaccion(function (&$data, $guardar) use ($email, $costo) {
    $data['usuarios'][$email]['creditos'] += $costo;
    $guardar($data);
    return true;
  });
  responder(['ok' => false, 'error' => 'Ahora mismo no pude analizar tu contrato. Se te devolvió el crédito, inténtalo de nuevo en un momento.'], 502);
}

$texto = trim(preg_replace('/^```(?:markdown|md)?|```$/m', '', $r['texto']));

$usuarioFinal = db_transaccion(function (&$data, $guardar) use ($email, $tipo, $costo, $texto) {
  $u = $data['usuarios'][$email];
  $u['historial'][] = [
    'fecha' => date('c'),
    'tipo' => $tipo,
    'tipo_nombre' => TIPOS_CONTRATO[$tipo],
    'coste' => $costo,
    'resultado' => $texto,
  ];
  $u['historial'] = array_slice($u['historial'], -200);
  $data['usuarios'][$email] = $u;
  $guardar($data);
  return $u;
});

responder(['ok' => true, 'resultado' => $texto, 'usuario' => usuario_publico($usuarioFinal, $email)]);
