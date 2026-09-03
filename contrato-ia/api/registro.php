<?php
require_once __DIR__ . '/common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') responder(['ok' => false, 'error' => 'Método no permitido'], 405);

$body = leer_json_post();
$email = strtolower(trim((string) ($body['email'] ?? '')));
$pass = (string) ($body['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) responder(['ok' => false, 'error' => 'Ese correo no parece válido.'], 400);
if (strlen($pass) < 6) responder(['ok' => false, 'error' => 'La contraseña debe tener al menos 6 caracteres.'], 400);

$resultado = db_transaccion(function (&$data, $guardar) use ($email, $pass) {
  if (isset($data['usuarios'][$email])) return 'existe';
  $data['usuarios'][$email] = [
    'hash' => password_hash($pass, PASSWORD_BCRYPT),
    'plan' => 'gratis',
    'creditos' => PLANES['gratis']['creditos'],
    'renovacion' => date('c', strtotime('+30 days')),
    'creado' => date('c'),
    'historial' => [],
  ];
  $guardar($data);
  return 'ok';
});

if ($resultado === 'existe') responder(['ok' => false, 'error' => 'Ya existe una cuenta con ese correo. Inicia sesión.'], 409);

sesion_crear($email);
$data = db_leer();
responder(['ok' => true, 'usuario' => usuario_publico($data['usuarios'][$email], $email)]);
