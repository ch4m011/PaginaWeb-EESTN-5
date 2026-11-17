# Informe de refactorización — web-escolar

Este documento detalla cada cambio hecho sobre el proyecto original, con la
justificación de por qué se hizo. Todas las eliminaciones se verificaron
con búsquedas (`grep`) en todo el árbol de HTML/JS/PHP antes de borrar nada:
solo se borró lo que quedó confirmado como sin referencias.

## 1. Archivos eliminados

### 1.1 Backups y copias literales
| Archivo | Motivo |
|---|---|
| `php/perfil/actualizar_datos copy.php` | Copia literal de `actualizar_datos.php`, nunca referenciada. |
| `php/send_message_to_admin.php.bak` | Backup manual del archivo `.php` vecino. |
| `php/noticias.php.backup` | Backup manual de `noticias.php`. |
| `css/backup navehador.css` | Backup manual (nombre con typo) de `navegador.css`. |
| `date/noticias.json.bak` | Backup de datos, sin uso. |

### 1.2 Basura / archivos accidentales
| Archivo | Motivo |
|---|---|
| `php/Nuevo Documento de texto.txt` | Archivo vacío, nombre por defecto de Windows — creado por error. |
| `php/logs` | Era un **archivo** de 0 bytes (no una carpeta), probablemente se quiso crear un directorio de logs y falló. |
| `img/Logo Inform` | Imagen de 3.3 MB sin extensión, sin ninguna referencia en CSS/HTML. |
| `img/default-profile.png.png` | Doble extensión, sin ninguna referencia. |
| `css/estilos.css` | Ninguna página lo enlaza. |

### 1.3 Logs y artefactos de runtime (no deberían versionarse)
| Archivo | Motivo |
|---|---|
| `php/debug.txt`, `php/debug_log.txt` | Logs generados en ejecución, de cientos de KB, commiteados al repo. Ahora van a `.gitignore`. |
| `php/message_log.json` | Ídem, dato de runtime, no código fuente. |

### 1.4 Flujo de registro/login huérfano
Se verificó con `grep` qué `<script>` carga cada página y qué endpoint llama cada
JS. Resultado: había un flujo paralelo completo que ninguna página activa
carga:

| Archivo | Motivo |
|---|---|
| `js/registro.js` | Ningún `.html` lo incluye con `<script src>`. |
| `php/register.php` | Solo lo llamaba `registro.js` (huérfano). |
| `php/registrar_usuario_mysql.php` | Sin ninguna referencia en JS/HTML. |
| `php/loginphp/registrar_usuario.php` | Variante vieja que guardaba usuarios en un JSON (`date/usuarios.json`) en vez de la base de datos; solo la llamaba `js/google.js`. |
| `js/google.js` | Ninguna página lo carga (superado por `js/google-auth.js`, que sí está en `login.html`). |
| `js/google-signin.js` | Ídem, ninguna página lo carga. |
| `php/google_signin.php` | Solo lo llamaba `google-signin.js` (huérfano). |
| `api/users.php` | Endpoint duplicado de `date/usuarios.php` (que sí está en uso), sin ninguna referencia. Se borró también la carpeta `api/` al quedar vacía. |
| `php/send_contact.php` | Endpoint de contacto alternativo (usa `mail()` nativo). El formulario real (`./html/contacto.html`) apunta a `php/send_message_to_admin.php`, que es el que de verdad se ejecuta. |

El flujo **activo** de registro (`js/registrarse.js` → `php/registrar_usuario.php`
y `php/registrar_google.php`) y de login con Google (`js/google-auth.js` →
`php/loginphp/google_login.php`) se dejaron intactos.

### 1.5 Página de escritor abandonada
| Archivo | Motivo |
|---|---|
| `./html/panel_escritor_new.html` | Borrador viejo (159 líneas) sin enlazar desde ningún lado; le faltan funciones que sí tiene `panel_escritor.html` (197 líneas): integración con el calendario y el selector de "tipo de noticia". |

### 1.6 Carpeta `date/` — scripts de una sola vez ya ejecutados
Esta carpeta mezclaba la API activa del calendario con una docena de scripts
de diagnóstico/migración que se corren una vez a mano y notas de desarrollo.
Se conservaron **solo** los dos archivos con uso real confirmado:
`date/api_calendario.php` (llamado por `calendario.js`, `calendario_flotante.js`
y `panel_admin_events.js`) y `date/usuarios.php` (llamado por `panel_admin.js`
para togglear el calendario de un usuario). Se eliminaron:

`check_table.php`, `diagnostico_calendario.php`, `ensure_calendario_author_columns.php`,
`init_calendario_table.php`, `insert_test_events.php`, `migrate_calendario.php`,
`migrate_eventos.php`, `setup_calendario.php`, `verificador_eventos.php`,
`calendario.php` (página huérfana), `CAMBIOS_RESUMEN.md`, `CHECKLIST.md`,
`INSTRUCCIONES_USO.md`, `MIGRACION_NOTICIAS.md`, `README.md` (duplicado del de
la raíz), `INICIO.html`, `VERIFICAR.html`, `setup.html`, `test_api.html`,
`mail_config.json` (config duplicada — ver sección 3), `google_credentials.json.json`.

El esquema de esa tabla ya vive en `sql/calendario_table.sql`, que queda como
la única fuente de verdad si hace falta recrearla.

### 1.7 Scripts de diagnóstico PHP sin referencias
`check_usuarios_structure.php`, `debug_bom.php`, `debug_email_match.php`,
`execute_fix.php`, `php_test.php`, `migrate_autor_email.php`,
`limpiar_rutas_imagenes.php` — ninguno está enlazado desde ningún `.html` ni
llamado desde ningún `.js`.

### 1.8 Lo que se dejó a propósito, aunque llame la atención
- **`./html/diagnostico_autores.html`, `./html/fix_autores.html`,
  `./html/ver_sincronizacion.html`** y sus backends (`diagnose_authors.php`,
  `fix_authors_by_email.php`) **sí están enlazados** entre sí, así que no
  están técnicamente muertos — no se tocaron. Advertencia aparte: no tienen
  ninguna verificación de sesión/admin visible, o sea que cualquiera que
  conozca la URL puede ejecutarlos. Eso es un tema de seguridad a resolver
  con el compañero de backend, no algo que se resuelve borrando código.
- **`./html/preinscripcion.html`**: el nombre es raro pero está enlazado desde
  `navbar.js` (enlace "Biblioteca Digital"), así que está vivo.
- **`img/`, `php/uploads/`, `uploads/`, `date/img/`, `img/perfiles/`**: son
  contenido subido por usuarios (avatares, imágenes de noticias/eventos), no
  código. No se tocó nada ahí — borrar "las que no se usan" requeriría cruzar
  contra la base de datos, y eso está fuera del alcance de un refactor de código.

## 2. Consolidación de código duplicado

### 2.1 La conexión a la base de datos estaba definida CUATRO veces
`php/config.php` original creaba la conexión mysqli:
1. Como `$conexion` (con su propio bloque try/catch)
2. Como `$conn` (con su propio bloque try/catch, constantes `DB_*` repetidas)
3. Un bloque de comentario con `CREATE TABLE` de referencia
4. Como `$mysqli`, con otro bloque de constantes `DB_*` (esta vez con `if
   (!defined(...))`, pegado debajo del anterior sin borrar el de arriba)

Además existía `config/db_connect.php`, una **tercera conexión independiente**
con las mismas credenciales hardcodeadas, que no usaba ningún archivo del
proyecto (confirmado por búsqueda).

**Qué se hizo:** `php/config.php` se reescribió como fuente única de verdad.
Crea **una sola** conexión mysqli y expone `$mysqli`, `$conn` y `$conexion`
como alias del mismo objeto — así ningún archivo existente que dependa de
cualquiera de esos tres nombres se rompe. `conexion.php` (en la raíz), que
antes duplicaba la conexión por su cuenta, ahora es un shim de 3 líneas que
delega en `php/config.php`. Se borró `config/db_connect.php` (la carpeta
`config/` quedó vacía y también se borró).

Esto no cambia el comportamiento para los ~15 archivos que ya hacían
`require_once('conexion.php')` o `require_once('config.php')` — siguen
recibiendo la misma variable con la misma conexión.

### 2.2 Cabeceras CORS/JSON repetidas
El mismo bloque de 4 líneas (`Content-Type`, `Access-Control-Allow-Origin`,
etc.) estaba copiado y pegado en 9 archivos. Agregué la función
`enviarCabecerasJson()` a `php/config.php` para que **los endpoints nuevos**
no repitan ese bloque.

**No apliqué este cambio retroactivamente** a los 5 endpoints vivos que aún
tienen el bloque duplicado (`api_noticias.php`, `loginphp/google_login.php`,
`date/api_calendario.php`, `date/usuarios.php`) porque en algunos de ellos el
orden entre `ob_start()`, el manejador de errores y el `require_once
config.php` es intencional (capturan errores de la propia conexión a la
base de datos). Reordenarlo sin poder levantar el proyecto contra MySQL para
probarlo es un riesgo que no vale la pena para 4 líneas de ahorro. Queda como
tarea de limpieza incremental cuando alguien toque esos archivos igual.

## 3. Seguridad de configuración (hallazgo importante)

El proyecto **no tenía `.gitignore`**, y `git ls-files` mostró que estos
archivos están commiteados en el historial:
- `php/.env` (contiene `GMAIL_USER`/`GMAIL_PASS` reales)
- `date/google_credentials.json.json`
- `php/debug.txt`, `php/debug_log.txt`, `php/message_log.json`

Se agregó `.gitignore` y `php/.env.example` (plantilla sin secretos) a este
paquete. **Importante:** borrar el archivo del working tree no borra el
historial de git. Si `GMAIL_PASS` es una contraseña real (no una de
aplicación ya revocada), hay que rotarla — sigue disponible para cualquiera
que clone el repo y mire commits viejos.

## 4. Resumen numérico

- Archivos eliminados: **53**
- Directorios vacíos eliminados: `config/`, `api/`
- Archivos reescritos: `php/config.php`, `conexion.php` (consolidación de
  conexión a BD), `php/login.php` (un comentario desactualizado)
- Archivos nuevos: `.gitignore`, `php/.env.example`, este `CAMBIOS.md`
- Total de archivos del proyecto: 202 → 152 (sin contar `.git/`)

## 5. Eliminación del buscador (no hacía nada)

Se verificó con `grep` todo el flujo del buscador de noticias (input +
lupa en el header, autocompletado por escritor, página de resultados) y
resultó estar completamente muerto en la práctica:

- `js/navbar.js` → `inicializarBuscador()` sólo activaba el input/botón
  si `window.location.pathname` terminaba en `index.html`. Pero
  `html/index.html` **nunca tuvo** el `<div class="buscador">` en su
  HTML — o sea que en la única página donde el buscador podía activarse,
  no existía. En el resto de las páginas la misma función lo ocultaba
  (`display: none`) apenas cargaba.
- Las dos páginas que sí tenían el `<div class="buscador">` en el HTML
  (`contacto.html`, `preinscripcion.html`) ya lo traían con
  `style="display: none;"` fijo, y `busqueda.html` (la página de
  resultados) también lo ocultaba al cargar `navbar.js`. Ningún usuario
  pudo haber usado nunca ese input.
- El único acceso real a `busqueda.html` era el link "Noticias" del
  footer, que apuntaba ahí **sin ningún parámetro de búsqueda**. Como
  `js/busqueda.js` corta con "No se ingresó ninguna búsqueda." cuando no
  hay query string, ese link tampoco mostraba nunca una sola noticia.

**Qué se borró:**

| Archivo | Motivo |
|---|---|
| `html/busqueda.html` | Página de resultados, inalcanzable con contenido real (ver arriba). |
| `js/busqueda.js` | Lógica de filtrado que sólo corría en esa página. |
| `css/busqueda.css` | Estilos exclusivos de esa página. |
| `inicializarBuscador()` en `js/navbar.js` (y su llamada) | Función del input+lupa+autocompletado, nunca alcanzable. |
| `.buscador` en `html/contacto.html` y `html/preinscripcion.html` | Markup del input, ya venía oculto por CSS inline. |
| Reglas `.buscador`, `.sugerencias`, `.sugerencia-item` en `css/navegador.css` | Estilos que sólo aplicaban al buscador eliminado. |

**Qué se ajustó, no se borró:** el link "Noticias" del footer
(`js/navbar.js`) ahora apunta a `index.html#noticiasContainer` (la
sección "Últimas noticias" de la home) en vez de a la página de
búsqueda eliminada. `php/api_noticias.php` se dejó intacto: lo siguen
usando `index_noticias.js`, `panel_escritor.js` y `panel_admin.js`.

## 6. Estructura actual del proyecto

La estructura completa está en `README.md` (sección 3) y se verificó contra el paquete actual. Resumen: `html/` (16 páginas), `css/` (18 hojas), `js/` (16 scripts), `php/` (backend, con las subcarpetas `admin/`, `autenticacion/`, `perfil/`, `recuperar/`, `bd/` y `PHPMailer/`), `public/` (borrado de cuenta y manuales) y `sql/` (6 archivos).

## 7. One-page institucional (`html/tecnica5.html`)

`html/index.html` ya tenía un link ("Conocé más sobre la institución") apuntando
a `tecnica5.html`, pero el archivo era solo el esqueleto (header sin contenido).
Se completó como one-page institucional, reutilizando los componentes ya
definidos en `home-sections.css`/`especialidades.css` (`.eest-section`,
`.eest-cta`, `.eest-btn`, `.eest-eyebrow`, `.eest-specialties`, `.eest-stat`)
en vez de reinventar estilos nuevos:

- **Archivo nuevo `css/tecnica5.css`**: componentes propios de esta página
  (hero institucional, línea de tiempo de historia, grilla de valores, franja
  de números, bloque de ubicación/mapa). Sigue el mismo patrón que
  `especialidades.css`: `@import url('design-system.css')` + clases `.eest-*`
  propias.
- **`html/tecnica5.html`** ahora enlaza `navegador.css` + `index.css` (que ya
  encadena `design-system.css` + `home-sections.css` + estilos base de
  `body`/`main`) + `tecnica5.css`. Se corrigió también el bug del `<script
  src="../js/navbar.js"defer>` (le faltaba el espacio antes de `defer`).
- Secciones: hero, "Quiénes somos", historia (línea de tiempo), misión y
  valores, números institucionales, especialidades (mismas 4 tarjetas que
  `index.html`, para que la página funcione sola sin depender de la home),
  ubicación con mapa embebido de Google Maps (sin API key, vía
  `output=embed`) y contacto, y CTA final a pre-inscripción.
- **Contenido pendiente de completar con datos reales** (marcado con
  comentarios `<!-- TODO Chamito: ... -->` en el HTML): año de fundación e
  hitos de la historia, dirección exacta, turnos/horarios reales. El texto
  institucional genérico es un placeholder a propósito — no hay que dejarlo
  así en producción.

## 8. Actualización de la documentación y pendientes

Esta sección se agregó al revisar el README contra el código del paquete. Las secciones 1 a 5 se conservan como historial, pero algunas afirmaciones no coinciden con el paquete actual. La tabla de la sección 8.2 indica cuáles.

### 8.1 README.md

Se reescribió completo con la estructura real del paquete. La versión anterior tenía:

- Carpetas que no existen en el proyecto: `API/`, `configuración/`, `fecha/`, `imagen/`, `ocodigos_no_usandos/`, `página/`, `guiones/`, `subidas/`. Además usaba nombres en mayúscula que no coinciden con el repositorio (`CSS/`, `SQL/`, `público/`).
- Un `conexión.php` en la raíz que no existe, y un "Paso 4" que pedía editar variables ahí. La conexión se configura desde `php/.env`.
- Un flujo de ejemplo con `php/obtener_noticias.php`, que no existe.
- La contraseña de aplicación de Gmail, el correo de la cuenta y el correo del administrador en texto plano.

El README nuevo no incluye credenciales.

### 8.2 Discrepancias entre este informe y el paquete

| Lo que dice este informe | Estado en el paquete |
|---|---|
| `conexion.php` en la raíz, convertido en shim (sección 2.1) | No existe en la raíz. Existe `php/bd/conexion.php`, que no es un shim (ver pendiente 4). |
| Carpeta `date/` con `api_calendario.php` y `usuarios.php` (sección 1.6) | No existe. La API del calendario está en `php/api_calendario.php`. |
| `css/busqueda.css` eliminado (sección 5) | Sigue en `css/`. |
| `.gitignore` agregado (sección 3) | No aparece en el paquete. |
| `php/.env.example` agregado (sección 3) | Sí existe. |
| `php/debug.txt`, `php/debug_log.txt` y `php/message_log.json` eliminados (sección 1.3) | `php/debug_log.txt` sigue en el paquete, junto con `php/perfil/debug.txt`, `php/perfil/actualizar_imagen_error.log` y `php/autenticacion/logs/debug.log`. `message_log.json` no aparece. |
| `php/.env` no versionado (sección 3) | Está dentro del paquete, con credenciales reales (pendiente 1). |
| `loginphp/`, `scripts/`, `php/uploads/` (sección 6, versión anterior) | No existen. El login con Google está en `php/perfil/registrar_google.php`. |
| `html/restablecer_contrasena.html` (`RECUPERAR_CONTRASENA.md`) | No está en el paquete (pendiente 8). |
| Totales de archivos (secciones 4 y 6) | El paquete tiene 115 archivos sin contar `.git/`. Los totales anteriores no se pudieron verificar. |

### 8.3 Pendientes detectados (no corregidos)

Estos puntos se detectaron revisando el código. No se modificó ningún archivo de código.

1. **Credenciales en el paquete.** `php/.env` contiene `GMAIL_USER` y `GMAIL_PASS` reales, y según la sección 3 ya está en el historial de git. Hay que rotar la contraseña de aplicación, quitar el archivo del repositorio (`git rm --cached php/.env`) y evaluar reescribir el historial.
2. **Ruta rota en `js/calendario.js`** (línea 149): `fetch("../datphpe/api_calendario.php?action=crear")`. Debería ser `../php/api_calendario.php`. La creación de eventos desde ese script falla.
3. **Borrado de cuenta siempre rechazado.** `public/iniciar_borrado_cuenta.php` (línea 6) verifica `$_SESSION['eemail']`, pero en el mismo archivo se usa `$_SESSION['email']`. Ningún archivo del paquete asigna `eemail`, así que el endpoint responde siempre 401.
4. **Conexión duplicada.** `php/bd/conexion.php` abre su propia conexión con `root` y contraseña vacía, en vez de usar `php/config.php`. Contradice la consolidación de la sección 2.1.
5. **`php/bd/instalar.php`** usa `$mysqli` sin incluir `config.php`, así que no funciona si se ejecuta directo.
6. **`php/usuarios.php`** lee `usuarios.json`, que no existe en el paquete, y ningún script lo llama. Es candidato a eliminación, previa confirmación.
7. **Tabla `eventos`.** `sql/05_noticias_eventos.sql` la crea, pero el código del calendario usa `calendarios`. Falta confirmar si `eventos` se usa en alguna parte.
8. **Falta `html/restablecer_contrasena.html`**, que `RECUPERAR_CONTRASENA.md` lista como archivo nuevo y que `js/recuperar_contrasena.js` necesita para el flujo de restablecer.
9. **Dependencia externa.** `html/preinscripcion.html` carga jQuery y maskedinput desde `aaferrando.com` y html2pdf/jsPDF desde cdnjs. Si el sitio externo cae, el formulario deja de funcionar.
10. **Configuración de desarrollo en producción.** `php/config.php` tiene `error_reporting(E_ALL)` y `display_errors = 1`, y `GOOGLE_CLIENT_SECRET` con un valor de ejemplo en el código.
11. **Sin control de administrador.** `html/ver_sincronizacion.html` y sus endpoints no verifican sesión de administrador (ya indicado en la sección 1.8).
12. **Logs en el paquete.** Los logs de ejecución (ver tabla de 8.2) deben quedar fuera del repositorio.