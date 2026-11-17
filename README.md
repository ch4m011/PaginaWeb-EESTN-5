# Web Escolar — EEST N°5

Sitio web dinámico de la Escuela Técnica EEST N°5: noticias, calendario de eventos, registro e inicio de sesión (con contraseña o con Google), perfil de usuario, recuperación de contraseña, formulario de contacto y panel de edición para administradores.

> **Importante:** el proyecto usa PHP y MySQL. **No funciona en GitHub Pages** ni en ningún hosting estático. Necesita un servidor como XAMPP (Apache + PHP + MySQL).

---

## 1. Requisitos

- [XAMPP](https://www.apachefriends.org/es/index.html)
- Una cuenta de Gmail con **Contraseña de aplicación** (para enviar mails)
- Opcional: un Client ID de Google para el inicio de sesión con Google

---

## 2. Puesta en marcha

1. Copiar la carpeta del proyecto dentro de `C:\xampp\htdocs\` y llamarla `web-escolar`. Si se descarga el ZIP de GitHub, renombrar la carpeta (por ejemplo, de `web-escolar-main` a `web-escolar`).
2. Abrir el Panel de Control de XAMPP y presionar **Start** en **Apache** y en **MySQL**. Ambos deben quedar en verde.
3. Crear las tablas:
   - Al cargar el sitio por primera vez, `php/config.php` crea la base `web-escolar` si no existe.
   - En <http://localhost/phpmyadmin/>, seleccionar la base `web-escolar` e importar los archivos de `sql/` **en orden numérico (01 a 06)**.
4. Crear `php/.env` a partir de `php/.env.example` y completar los valores (ver sección 4).
6. descargar la base de datos con el siguiente link: localhost/PaginaWeb-EESTN-5/php/bd/instalar.php
5. Abrir <http://localhost/web-escolar/html/index.html>

> `php/bd/instalar.php` recorre los `.sql` de `sql/`, pero usa la variable `$mysqli` que define `php/config.php`. No se puede ejecutar directamente, así que para las tablas conviene usar phpMyAdmin como se indica arriba.

---

## 3. Estructura del proyecto

```
web-escolar/
├── .htaccess                      # Cabeceras para Google Identity y CORS abierto (modo desarrollo)
├── README.md                      # Este archivo
├── CAMBIOS.md                     # Historial de la refactorización y pendientes
├── RECUPERAR_CONTRASENA.md        # Pasos para los archivos de recuperación de contraseña
│
├── html/                          # Páginas (16)
│   ├── index.html                 # Inicio: noticias y calendario
│   ├── tecnica5.html              # Presentación institucional
│   ├── tecnicatura-construccion.html
│   ├── tecnicatura-electromecanica.html
│   ├── tecnicatura-informatica.html
│   ├── tecnicatura-quimica.html
│   ├── ver_noticia.html           # Noticia completa
│   ├── preinscripcion.html        # Preinscripción (enlace "Biblioteca Digital")
│   ├── preguntas-frecuentes.html
│   ├── contacto.html              # Formulario de contacto
│   ├── registrarse.html
│   ├── login.html
│   ├── olvide_contrasena.html     # Pedido de recuperación de contraseña
│   ├── perfil.html                # Datos, foto, contraseña y borrado de cuenta
│   ├── panel_edicion.html         # Panel de edición: noticias, eventos y usuarios
│   └── ver_sincronizacion.html    # Herramienta de diagnóstico de autores
│
├── css/                           # Hojas de estilo (18): una por página más design-system.css y home-sections.css
├── js/                            # Scripts (16): uno por página más navbar.js, común a todas
├── img/                           # Logos institucionales
│
├── php/                           # Backend
│   ├── config.php                 # Configuración central: .env, conexión MySQLi, sesión y logs
│   ├── .env.example               # Plantilla del .env, sin valores reales
│   ├── api_noticias.php           # API de noticias: obtener, crear, actualizar, eliminar
│   ├── noticias.php               # Listado de noticias para el panel de edición
│   ├── imagen_noticia.php         # Devuelve la imagen de una noticia (guardada en la BD)
│   ├── api_calendario.php         # API de eventos del calendario
│   ├── send_message_to_admin.php  # Formulario de contacto: envía el mail al administrador
│   ├── mail_bienvenida.php        # Mail de bienvenida al registrarse
│   ├── check_session.php, get_user.php, cambiar_contrasena.php
│   ├── usuarios.php               # Sin uso confirmado (ver CAMBIOS.md, sección 8.3)
│   ├── autenticacion/             # iniciar_sesion.php, cerrar_sesion.php
│   ├── perfil/                    # Registro (normal y Google), datos, imagen y borrado de cuenta
│   ├── recuperar/                 # solicitar_recuperacion.php, restablecer_contrasena.php
│   ├── admin/                     # obtener_usuarios.php, cambiar_rol.php, eliminar_usuario.php
│   ├── bd/                        # conexion.php, instalar.php
│   └── PHPMailer/                 # Librería para enviar mails por SMTP
│
├── public/                        # Borrado de cuenta por enlace de confirmación, y manuales (PDF / ODT)
│   ├── iniciar_borrado_cuenta.php
│   ├── confirmar_borrado.php
│   └── Manual_de_Usuario.pdf / .odt
│
└── sql/                           # Esquema de la base: importar en orden
    ├── 01_usuarios.sql            # usuarios
    ├── 02_calendario_table.sql    # calendarios
    ├── 03_messages_table.sql      # messages_to_admin
    ├── 04_noticias.sql            # noticias
    ├── 05_noticias_eventos.sql    # eventos
    └── 06_password_resets.sql     # password_resets
```

---

## 4. Configuración (`php/.env`)

Copiar `php/.env.example` como `php/.env` y completar. Ejemplo con valores ficticios:

```env
# Cuenta que ENVÍA los mails
GMAIL_USER=cuenta@gmail.com
# Contraseña de aplicación de 16 caracteres (no es la contraseña normal de la cuenta)
GMAIL_PASS=xxxxxxxxxxxxxxxx
GMAIL_NAME=Web Escuela Técnica

# Quién RECIBE los mensajes del formulario de contacto
ADMIN_EMAIL=administrador@ejemplo.com
ADMIN_NAME=Administrador

# Opcionales
# APP_URL=https://tu-dominio       # base del link del mail de recuperación de contraseña
# DB_HOST=localhost
# DB_USER=root
# DB_PASS=
# DB_NAME=web-escolar
```

- Para cambiar el destinatario de los mensajes de contacto, editar `ADMIN_EMAIL` en `php/.env`. No hace falta tocar el código.
- Si se cambia `GMAIL_USER`, hay que generar una nueva contraseña de aplicación desde la configuración de seguridad de esa cuenta de Google.
- Si no se definen `DB_*`, se usan los valores por defecto: `localhost`, `root`, sin contraseña y base `web-escolar`.

### Seguridad

- `php/.env` **no debe subirse al repositorio**. Contiene credenciales reales.
- `php/config.php` deja `display_errors` activado y tiene un `GOOGLE_CLIENT_SECRET` de ejemplo en el código. Para producción: apagar los errores en pantalla, mover el secret a `.env` y restringir el CORS de `.htaccess`.
- No usar `root` sin contraseña en producción.

---

## 5. Cómo funciona

El proyecto tiene tres capas:

1. **Frontend** (`html/`, `css/`, `js/`): las páginas son el esqueleto, el CSS les da estilo y el JavaScript hace las peticiones con `fetch()`.
2. **Backend** (`php/`, `public/`): Apache ejecuta los PHP. Cada endpoint carga `php/config.php` (conexión y sesión), consulta MySQL y responde en JSON.
3. **Base de datos** (MySQL, definida en `sql/`): el JavaScript nunca se conecta directo a la base; siempre pasa por PHP.

Ejemplo: `js/index_noticias.js` pide `../php/api_noticias.php?action=obtener`, ese archivo consulta la tabla `noticias` y devuelve JSON, y el script actualiza la página sin recargarla.

### Funcionalidades

| Funcionalidad | Frontend | Backend |
|---|---|---|
| Registro | `registrarse.js` | `perfil/registrar_usuario.php`, `perfil/registrar_google.php`, `mail_bienvenida.php` |
| Inicio de sesión | `login.js` | `autenticacion/iniciar_sesion.php`; con Google, `perfil/registrar_google.php` |
| Barra de navegación y sesión | `navbar.js` | `get_user.php`, `perfil/obtener_imagen.php`, `autenticacion/cerrar_sesion.php` |
| Perfil | `perfil.js` | `perfil/actualizar_datos.php`, `perfil/actualizar_imagen.php`, `cambiar_contrasena.php`, `perfil/eliminar_usuario_*.php` |
| Recuperar contraseña | `recuperar_contrasena.js` | `recuperar/solicitar_recuperacion.php`, `recuperar/restablecer_contrasena.php` |
| Borrado de cuenta | — | `public/iniciar_borrado_cuenta.php`, `public/confirmar_borrado.php` |
| Noticias | `index_noticias.js`, `ver_noticia.js`, `panel_edicion.js` | `api_noticias.php`, `noticias.php`, `imagen_noticia.php` |
| Calendario | `calendario.js`, `calendario_flotante.js`, `panel_edicion_events.js` | `api_calendario.php` |
| Administración de usuarios | `panel_edicion.js` | `admin/obtener_usuarios.php`, `admin/cambiar_rol.php`, `admin/eliminar_usuario.php` |
| Contacto | `contacto.html` (envía el formulario) | `send_message_to_admin.php` |

### Tablas de la base

| Tabla | Uso |
|---|---|
| `usuarios` | Cuentas, roles y datos de perfil |
| `noticias` | Noticias; la imagen se guarda como BLOB en esta tabla |
| `calendarios` | Eventos del calendario |
| `messages_to_admin` | Mensajes del formulario de contacto |
| `password_resets` | Tokens de recuperación de contraseña |
| `eventos` | Creada por `sql/05_noticias_eventos.sql`; ver pendientes en CAMBIOS.md |

---

## 6. Documentación

- [`CAMBIOS.md`](CAMBIOS.md): qué se eliminó o unificó en la refactorización, y pendientes detectados (sección 8).
- [`RECUPERAR_CONTRASENA.md`](RECUPERAR_CONTRASENA.md): archivos y pasos del flujo de recuperación de contraseña.