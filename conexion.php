<?php
/**
 * conexion.php
 * ------------
 * Punto de entrada de compatibilidad para el código que hace   
 * require_once('conexion.php') o require_once('../conexion.php').
 *
 * Antes este archivo creaba su PROPIA conexión mysqli con las
 * credenciales hardcodeadas por segunda vez (y una tercera vez
 * existía en config/db_connect.php, que ya no se usaba en ningún
 * lado y fue eliminado). Ahora delega en php/config.php, que es la
 * única fuente de verdad, y expone $conn tal como antes.
 */
require_once __DIR__ . '/php/config.php';
// $conn ya aqueda definido por config.php (alias del mismo mysqli).
