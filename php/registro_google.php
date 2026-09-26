<?php

if (ob_get_length()) {
    ob_clean();
}

header('Content-Type: application/json; charset=utf-8');

ini_set('display_errors', 0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/registro_google_error.log');

if (session_status() !== PHP_SESSION_ACTIVE) {
    session_start();
}

// incluir conexión (config.php)
if (file_exists(__DIR__ . '/config.php')) {
    require_once __DIR__ . '/config.php';
} else {
    http_response_code(500);

    echo json_encode([
        'ok' => false,
        'error' => 'Falta archivo de conexión (config.php)'
    ]);

    exit;
}


// --------------------------------------------------
// RECIBIR DATOS
// --------------------------------------------------

$raw = file_get_contents('php://input');

$input = json_decode($raw, true);

if (!$input) {

    echo json_encode([
        'success' => false,
        'error' => 'Petición inválida'
    ]);

    exit;
}

$id_token = $input['id_token'] ?? $input['credential'] ?? null;

$name = $input['name'] ?? null;
$email = $input['email'] ?? null;
$google_sub = $input['google_sub'] ?? null;
$picture = $input['picture'] ?? null;


// --------------------------------------------------
// VERIFICAR TOKEN DE GOOGLE
// --------------------------------------------------

if ($id_token) {

    $url = 'https://oauth2.googleapis.com/tokeninfo?id_token=' . urlencode($id_token);

    $tokeninfo = @file_get_contents($url);

    if ($tokeninfo === false) {

        error_log('ERROR: No se pudo consultar tokeninfo de Google.');

        echo json_encode([
            'success' => false,
            'error' => 'No se pudo verificar token con Google'
        ]);

        exit;
    }

    $info = json_decode($tokeninfo, true);

    if (!isset($info['sub']) || !isset($info['email'])) {

        error_log('ERROR: Token de Google inválido.');
        error_log('Respuesta tokeninfo: ' . $tokeninfo);

        echo json_encode([
            'success' => false,
            'error' => 'Token inválido'
        ]);

        exit;
    }

    $google_sub = $info['sub'];
    $email = $info['email'];
    $name = $info['name'] ?? $name;
    $picture = $info['picture'] ?? $picture;
}


// --------------------------------------------------
// DESCARGAR IMAGEN DE GOOGLE
// --------------------------------------------------

$imagen_blob = null;
$imagen_mime = null;

error_log('----------------------------------------');
error_log('LOGIN GOOGLE');
error_log('Email: ' . $email);
error_log('Picture: ' . ($picture ?? 'NULL'));

if ($picture) {

    $ch = curl_init();

    curl_setopt($ch, CURLOPT_URL, $picture);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_MAXREDIRS, 5);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);
    curl_setopt($ch, CURLOPT_CONNECTTIMEOUT, 10);

    // Para probar en XAMPP/WAMP
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0');
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Accept: image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
    ]);

    $imagen_blob = curl_exec($ch);

    $curl_error = curl_error($ch);
    $curl_errno = curl_errno($ch);

    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $content_type = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

    curl_close($ch);


    if ($imagen_blob === false) {

        error_log('ERROR CURL: ' . $curl_errno);
        error_log('MENSAJE CURL: ' . $curl_error);

        $imagen_blob = null;
        $imagen_mime = null;

    } elseif ($http_code < 200 || $http_code >= 300) {

        error_log('ERROR HTTP IMAGEN: ' . $http_code);

        $imagen_blob = null;
        $imagen_mime = null;

    } elseif (empty($imagen_blob)) {

        error_log('ERROR: Google respondió pero la imagen está vacía.');

        $imagen_blob = null;
        $imagen_mime = null;

    } else {

        $imagen_mime = $content_type ?: 'image/jpeg';

        // El Content-Type puede venir como:
        // image/jpeg; charset=UTF-8

        $imagen_mime = trim(explode(';', $imagen_mime)[0]);

        error_log('IMAGEN DESCARGADA CORRECTAMENTE');
        error_log('HTTP: ' . $http_code);
        error_log('MIME: ' . $imagen_mime);
        error_log('BYTES: ' . strlen($imagen_blob));
    }

} else {

    error_log('ERROR: $picture está vacío o no llegó.');
}


// --------------------------------------------------
// BUSCAR USUARIO
// --------------------------------------------------

$stmt = $conn->prepare("
    SELECT
        id,
        nombre,
        email,
        rol,
        tipo,
        imagen_blob,
        imagen_mime,
        google_sub
    FROM usuarios
    WHERE google_sub = ? OR email = ?
    LIMIT 1
");

$stmt->bind_param(
    'ss',
    $google_sub,
    $email
);

$stmt->execute();

$res = $stmt->get_result();

$user = $res->fetch_assoc();

$stmt->close();


// --------------------------------------------------
// USUARIO EXISTENTE
// --------------------------------------------------

if ($user) {

    /*
     * Si tenemos imagen:
     * actualizamos imagen_blob e imagen_mime.
     *
     * Si NO tenemos imagen:
     * solamente actualizamos google_sub y tipo.
     */

    if ($imagen_blob !== null) {

        $upd = $conn->prepare("
            UPDATE usuarios
            SET
                google_sub = ?,
                tipo = 'google',
                imagen_blob = ?,
                imagen_mime = ?
            WHERE id = ?
        ");

        $upd->bind_param(
            'sssi',
            $google_sub,
            $imagen_blob,
            $imagen_mime,
            $user['id']
        );

        $upd->send_long_data(1, $imagen_blob);

    } else {

        $upd = $conn->prepare("
            UPDATE usuarios
            SET
                google_sub = ?,
                tipo = 'google'
            WHERE id = ?
        ");

        $upd->bind_param(
            'si',
            $google_sub,
            $user['id']
        );
    }


    if (!$upd->execute()) {

        error_log(
            'ERROR SQL UPDATE: ' . $upd->error
        );

    } else {

        error_log(
            'Usuario actualizado correctamente. ID: ' . $user['id']
        );
    }

    $upd->close();


    // --------------------------------------------------
    // INICIAR SESIÓN
    // --------------------------------------------------

    $_SESSION['id'] = (int)$user['id'];
    $_SESSION['nombre'] = $user['nombre'];
    $_SESSION['email'] = $user['email'];
    $_SESSION['rol'] = $user['rol'];


    echo json_encode([
        'success' => true,
        'message' => 'Inicio de sesión correcto',
        'user' => [
            'id' => $_SESSION['id'],
            'nombre' => $_SESSION['nombre'],
            'email' => $_SESSION['email'],
            'rol' => $_SESSION['rol']
        ]
    ]);

    exit;
}


// --------------------------------------------------
// CREAR USUARIO NUEVO
// --------------------------------------------------

$insert = $conn->prepare("
    INSERT INTO usuarios
    (
        nombre,
        email,
        contrasena,
        tipo,
        google_sub,
        imagen_blob,
        imagen_mime,
        fecha_registro
    )
    VALUES
    (
        ?,
        ?,
        NULL,
        'google',
        ?,
        ?,
        ?,
        CURRENT_TIMESTAMP()
    )
");

$insert->bind_param(
    'sssss',
    $name,
    $email,
    $google_sub,
    $imagen_blob,
    $imagen_mime
);


// El parámetro 3 es imagen_blob
if ($imagen_blob !== null) {
    $insert->send_long_data(3, $imagen_blob);
}


if (!$insert->execute()) {

    http_response_code(500);

    error_log(
        'ERROR SQL INSERT: ' . $insert->error
    );

    echo json_encode([
        'success' => false,
        'error' => 'Error al crear usuario: ' . $insert->error
    ]);

    exit;
}


$newId = $insert->insert_id;

$insert->close();


// --------------------------------------------------
// INICIAR SESIÓN
// --------------------------------------------------

$_SESSION['id'] = (int)$newId;
$_SESSION['nombre'] = $name;
$_SESSION['email'] = $email;
$_SESSION['rol'] = 'usuario';


echo json_encode([
    'success' => true,
    'message' => 'Usuario creado e iniciada sesión',
    'user' => [
        'id' => $newId,
        'nombre' => $name,
        'email' => $email,
        'rol' => $_SESSION['rol']
    ]
]);

exit;

?>