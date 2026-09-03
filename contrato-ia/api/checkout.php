<?php
// checkout.php — MOCKUP: simula el pago y activa el plan al instante.
// Cuando se conecte una pasarela real, este archivo pasa a redirigir al
// checkout de verdad; el resto del sitio no cambia (ver 18-go-live-playbooks.md).
require_once __DIR__ . '/common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') responder(['ok' => false, 'error' => 'Método no permitido'], 405);
$email = requiere_sesion();

$body = leer_json_post();
$plan = (string) ($body['plan'] ?? '');
if (!in_array($plan, ['pro', 'experto'], true)) responder(['ok' => false, 'error' => 'Plan no reconocido.'], 400);

$usuarioFinal = db_transaccion(function (&$data, $guardar) use ($email, $plan) {
  $u = $data['usuarios'][$email];
  $u['plan'] = $plan;
  $u['creditos'] = PLANES[$plan]['creditos'];
  $u['renovacion'] = date('c', strtotime('+30 days'));
  $u['historial'][] = [
    'fecha' => date('c'),
    'tipo' => '_pago',
    'tipo_nombre' => 'Pago simulado — plan ' . PLANES[$plan]['nombre'],
    'coste' => 0,
    'resultado' => 'MODO DEMO: no se realizó ningún cobro real.',
  ];
  $data['usuarios'][$email] = $u;
  $guardar($data);
  return $u;
});

responder(['ok' => true, 'usuario' => usuario_publico($usuarioFinal, $email)]);
