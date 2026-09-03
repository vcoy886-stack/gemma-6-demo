<?php
// cancelar.php — MOCKUP: vuelve al plan gratis. En producción abriría el
// portal de cliente real de la pasarela de pago.
require_once __DIR__ . '/common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') responder(['ok' => false, 'error' => 'Método no permitido'], 405);
$email = requiere_sesion();

$usuarioFinal = db_transaccion(function (&$data, $guardar) use ($email) {
  $u = $data['usuarios'][$email];
  $u['plan'] = 'gratis';
  $u['creditos'] = min($u['creditos'], PLANES['gratis']['creditos']);
  $u['renovacion'] = date('c', strtotime('+30 days'));
  $u['historial'][] = [
    'fecha' => date('c'),
    'modulo' => '_cancelacion',
    'modulo_nombre' => 'Cancelación de plan',
    'coste' => 0,
    'resultado' => 'Volviste al plan Gratis.',
  ];
  $data['usuarios'][$email] = $u;
  $guardar($data);
  return $u;
});

responder(['ok' => true, 'usuario' => usuario_publico($usuarioFinal, $email)]);
