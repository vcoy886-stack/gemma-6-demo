<?php
// webhook.php — MOCKUP: no hace nada todavía. En producción, aquí llegan los
// eventos de la pasarela de pago real (pago confirmado, cancelación, fallo de
// cobro) y se actualiza el plan del usuario según el evento recibido.
require_once __DIR__ . '/common.php';
responder(['ok' => true, 'nota' => 'modo demo: webhook sin conectar']);
