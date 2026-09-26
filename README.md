Proyecto Web Dinámico (PHP/MySQL)

Este repositorio contiene el código fuente de una aplicación web dinámica. A diferencia de un sitio estático (HTML/CSS/JS puros), este proyecto requiere un entorno de servidor para funcionar, ya que utiliza PHP para procesar la lógica del lado del servidor y MySQL como base de datos.

Advertencia Importante: GitHub Pages vs. XAMPP

Esto es lo más importante que debes entender:

Proyecto Estático (como db.json): Funciona en GitHub Pages. Es simple, solo lee archivos.

Este Proyecto (con PHP/SQL): Es un proyecto DINÁMICO. NO FUNCIONARÁ en GitHub Pages. Requiere un servidor como XAMPP para ejecutar el código PHP y conectarse a la base de datos MySQL.

En resumen: Debes usar XAMPP para que este proyecto funcione.


1. Requisitos de Software

Necesitas un paquete de servidor local. La opción más recomendada es XAMPP.

¿Qué es XAMPP? Instala Apache (el servidor web), MySQL (la base de datos) y PHP (el lenguaje).

Enlace de Descarga:
https://www.apachefriends.org/es/index.html


2. Puesta en Marcha (Guía Paso a Paso)

Sigue estos pasos para ejecutar el proyecto en tu computadora.

Paso 1: Colocar los Archivos del Proyecto

El servidor Apache solo puede “ver” archivos que estén dentro de su carpeta htdocs.

Copia la carpeta completa de tu proyecto (la que contiene index.html, php/, SQL/, etc.).

Pégala dentro de la carpeta htdocs de XAMPP.

Ruta de ejemplo:
C:\xampp\htdocs\web-escolar\

Nota: Al descargar de GitHub, el archivo ZIP puede llamarse web-escolar-main.zip. Asegúrate de que la carpeta que pongas en htdocs se llame simplemente web-escolar.

Paso 2: Iniciar los Servicios de XAMPP

Abre el Panel de Control de XAMPP.

Inicia los dos servicios necesarios:

Haz clic en “Start” al lado de Apache.

Haz clic en “Start” al lado de MySQL.

Ambos deben ponerse de color verde.

Paso 3: Configurar la Base de Datos (phpMyAdmin)

Tu código PHP necesita una base de datos para funcionar.

Abre tu navegador y ve a:
http://localhost/phpmyadmin/

Crear la Base de Datos:

Haz clic en “Nueva” en el panel izquierdo.

Escribe un nombre para tu base de datos (ej: mi_proyecto_db).

Importar las Tablas:

Selecciona la base de datos que acabas de crear.

Ve a la pestaña “Importar”.

Haz clic en “Seleccionar archivo” y busca en tu proyecto la carpeta SQL/ y selecciona el archivo .sql que tengas allí.

Haz clic en “Continuar” (o “Importar”).

Paso 4: Configurar el Archivo de Conexión (¡Crítico!)

Tu código PHP necesita saber cómo “hablar” con la base de datos.

Dentro de tu proyecto, abre el archivo conexión.php (o el que esté en configuración/) con tu editor de código.

Busca las variables de conexión. Se verán similares a esto:

$db_host = “localhost”;
$db_user = “root”;
$db_pass = “”; // En XAMPP nuevo, la contraseña de root suele estar vacía
$db_name = “mi_proyecto_db”; // ¡IMPORTANTE!

Asegúrate de que $db_name sea exactamente el mismo nombre que le diste a tu base de datos en el Paso 3.

Guarda el archivo.

Paso 5: Ejecutar el Proyecto

¡Listo! Ahora puedes ver tu proyecto en acción.

Abre tu navegador (Chrome, Firefox, etc.).

Escribe en la barra de direcciones:

http://localhost/web-escolar/

(Reemplaza web-escolar si decidiste usar otro nombre para la carpeta).


3. Estructura de Carpetas (Tu Proyecto)

Este es el diagrama de carpetas basado en tu imagen, con la explicación de cada parte.

/tu-proyecto/

├── index.html              # El esqueleto HTML que ve el usuario.
├── conexión.php            # ¡CRÍTICO! Conecta PHP con la base de datos MySQL.
├── .htaccess               # Configuración avanzada del servidor Apache (ej. URLs amigables).
├── API/
│   └── (Archivos para APIs externas, ej. enviar emails con Gmail)
├── configuración/
│   └── (Archivos de configuración, ej. datos globales del sitio)
├── CSS/
│   └── (Archivos .css para dar estilo y diseño)
├── fecha/
│   └── (Archivos PHP relacionados con funciones de fecha/hora)
├── imagen/
│   └── (Imágenes de diseño de la web, ej. banners)
├── img/
│   └── (Logos del sitio)
├── js/
│   └── (Archivos JavaScript para la interactividad del “frontend”)
├── ocodigos_no_usandos/
│   └── (Código antiguo o de prueba. Buena práctica para limpiar)
├── página/
│   └── (Archivos PHP para páginas específicas, ej. “nosotros.php”)
├── php/
│   └── (El “cerebro” del backend. Archivos que consultan la base de datos)
├── público/
│   └── (Archivos públicos, similar a ‘assets’ o ‘imagen’)
├── guiones/
│   └── (Probablemente scripts PHP o JS con funciones específicas)
├── SQL/
│   └── tu_base_de_datos.sql  # El “plano” para crear tu base de datos.
└── subidas/
    └── noticias/
        └── (Donde se guardan las imágenes que suben los usuarios)


4. Análisis Técnico del Funcionamiento

Este proyecto tiene 3 componentes principales que trabajan juntos:

1. El Frontend (Lo que ves en el navegador)

Archivos: index.html, CSS/, js/

Función: El index.html es el “esqueleto”. Los archivos de CSS/ le dan estilo.

El Cerebro del Frontend: Los archivos en js/ manejan la interactividad. Cuando haces clic en un botón, el JavaScript usa fetch() para llamar a un archivo en php/ (el backend) y pedirle datos.


2. El Backend (Lo que pasa en el servidor)

Archivos: php/, configuración/, conexión.php, API/, página/, etc.

Función: Este es el “motor” oculto. Se ejecuta en el servidor (XAMPP).

El Cerebro del Backend: Los archivos en php/ reciben las peticiones del JavaScript. Usan conexión.php para poder hablar con la base de datos.

Ejemplo: js/ pide “dame las noticias”. Apache ejecuta php/obtener_noticias.php. Ese archivo se conecta a MySQL, hace SELECT * FROM noticias, y devuelve los resultados en formato JSON.


3. La Base de Datos (Donde viven los datos)

Archivos: SQL/ (el archivo de creación), y la base de datos real en phpMyAdmin.

Función: Almacena toda tu información (usuarios, noticias, comentarios). Es permanente.

NUNCA se accede a ella directamente desde el Frontend (JavaScript). SIEMPRE se accede a través de un intermediario (tus archivos PHP).


5. Flujo de Funcionamiento (Resumen)

Así es como funciona todo junto:

[ 1. USUARIO (Navegador) ]

|

(Abre index.html, hace clic)

|

v

[ 2. JAVASCRIPT (Frontend, en js/) ]

|

(Hace una petición “fetch” a “php/dame_datos.php”)

|

v

[ 3. APACHE (Servidor XAMPP) ]

|

(Recibe la petición y ejecuta el archivo PHP)

|

v

[ 4. PHP (Backend, en php/) ]

|

(Usa “conexión.php” para hablar con MySQL)

|

v

[ 5. BASE DE DATOS (MySQL) ]

|

(Busca los datos y los devuelve a PHP)

|

v

[ 6. PHP (Backend) ]

|

(Convierte los datos a formato JSON y los “imprime”)

|

v

[ 7. JAVASCRIPT (Frontend) ]

|

(Recibe el JSON y actualiza el HTML para mostrar los datos)

|

v

[ 8. USUARIO (Navegador) ]

|

(Ve la información actualizada sin recargar la página)


6. Configuraciones Adicionales

Cómo cambiar el Email del Administrador (Formulario de Contacto)

¡Gracias por la corrección! Tu proyecto está configurado de manera profesional usando un archivo .env para manejar las configuraciones y contraseñas (como la que viste, GMAIL_PASS).

Esto es mucho mejor, ya que no necesitas editar el código PHP (en la carpeta php/) para cambiar el destinatario.

Para cambiar el email que recibe los mensajes del administrador:

Ve a la carpeta php/. Dentro de esa carpeta, busca y abre el archivo llamado .env (puede estar oculto en tu sistema).

Verás el contenido que me mostraste. Edita la línea ADMIN_EMAIL:

Este es el email que ENVÍA los correos (la cuenta de Google)

GMAIL_USER=lebelawsky@eest5.com

Esta es la “Contraseña de Aplicación” de 16 dígitos de esa cuenta

GMAIL_PASS=jxewjvomopqnidap
GMAIL_NAME=Web Escuela Técnica

¡ESTA ES LA LÍNEA QUE BUSCAS!

Cambia este email por el nuevo email que recibirá los mensajes.

ADMIN_EMAIL=lebelawsky@eest5.com
ADMIN_NAME=Administrador

Cambia lebelawsky@eest5.com en la línea ADMIN_EMAIL por la nueva dirección de email a la que quieres que lleguen los mensajes.

¡Guarda el archivo y listo! El archivo PHP leerá esta configuración automáticamente.

Nota sobre GMAIL_PASS: Como bien viste, GMAIL_PASS es la “Contraseña de Aplicación” de 16 dígitos. Si alguna vez cambias la cuenta de GMAIL_USER, tendrás que generar una nueva “Contraseña de aplicación” desde la configuración de seguridad de esa cuenta de Google.