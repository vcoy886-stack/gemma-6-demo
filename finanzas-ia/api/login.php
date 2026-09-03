<?php
// login.php — valida email + password, abre sesión. Con límite de intentos.
require_once __DIR__ . '/common.php';

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') responder(['ok' => false, 'error' => 'Método no permitido'], 405);

$ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
$rlFile = sys_get_temp_dir() . '/fia_login_' . md5($ip) . '.json';
$intentos = is_file($rlFile) ? json_decode((string) @file_get_contents($rlFile), true) : [];
if (!is_array($intentos)) $intentos = [];
$intentos = array_values(array_filter($intentos, fn($t) => $t > time() - 900));
if (count($intentos) >= 5) {
  responder(['ok' => false, 'error' => 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'], 429);
}

$body = leer_json_post();
$email = strtolower(trim((string) ($body['email'] ?? '')));
$pass = (string) ($body['password'] ?? '');

$data = db_leer();
$u = $data['usuarios'][$email] ?? null;

if (!$u || !password_verify($pass, $u['hash'])) {
  $intentos[] = time();
  @file_put_contents($rlFile, json_encode($intentos), LOCK_EX);
  responder(['ok' => false, 'error' => 'Correo o contraseña incorrectos.'], 401);
}

@file_put_contents($rlFile, json_encode([]), LOCK_EX);
sesion_crear($email);
renovar_si_toca($email);
$data = db_leer();
responder(['ok' => true, 'usuario' => usuario_publico($data['usuarios'][$email], $email)]);
