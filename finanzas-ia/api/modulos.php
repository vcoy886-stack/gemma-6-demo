<?php
// modulos.php — metadata pública de los 7 módulos (sin exponer los prompts).
require_once __DIR__ . '/common.php';

$out = [];
foreach (MODULOS as $id => $m) {
  $out[] = [
    'id' => $id,
    'nombre' => $m['nombre'],
    'icono' => $m['icono'],
    'resumen' => $m['resumen'],
    'placeholder' => $m['placeholder'],
  ];
}
responder(['ok' => true, 'modulos' => $out, 'planes' => PLANES]);
