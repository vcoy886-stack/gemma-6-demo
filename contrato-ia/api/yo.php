<?php
require_once __DIR__ . '/common.php';
$email = requiere_sesion();
$data = db_leer();
responder(['ok' => true, 'usuario' => usuario_publico($data['usuarios'][$email], $email)]);
