<p class="has-line-data" data-line-start="0" data-line-end="1">Proyecto Web Dinámico (PHP/MySQL)</p>
<p class="has-line-data" data-line-start="2" data-line-end="3">Este repositorio contiene el código fuente de una aplicación web dinámica. A diferencia de un sitio estático (HTML/CSS/JS puros), este proyecto requiere un entorno de servidor para funcionar, ya que utiliza PHP para procesar la lógica del lado del servidor y MySQL como base de datos.</p>
<p class="has-line-data" data-line-start="4" data-line-end="5">Advertencia Importante: GitHub Pages vs. XAMPP</p>
<p class="has-line-data" data-line-start="6" data-line-end="7">Esto es lo más importante que debes entender:</p>
<p class="has-line-data" data-line-start="8" data-line-end="9">Proyecto Estático (como db.json): Funciona en GitHub Pages. Es simple, solo lee archivos.</p>
<p class="has-line-data" data-line-start="10" data-line-end="11">Este Proyecto (con PHP/SQL): Es un proyecto DINÁMICO. NO FUNCIONARÁ en GitHub Pages. Requiere un servidor como XAMPP para ejecutar el código PHP y conectarse a la base de datos MySQL.</p>
<p class="has-line-data" data-line-start="12" data-line-end="13">En resumen: Debes usar XAMPP para que este proyecto funcione.</p>
<ol>
<li class="has-line-data" data-line-start="14" data-line-end="16">Requisitos de Software</li>
</ol>
<p class="has-line-data" data-line-start="16" data-line-end="17">Necesitas un paquete de servidor local. La opción más recomendada es XAMPP.</p>
<p class="has-line-data" data-line-start="18" data-line-end="19">¿Qué es XAMPP? Instala Apache (el servidor web), MySQL (la base de datos) y PHP (el lenguaje).</p>
<p class="has-line-data" data-line-start="20" data-line-end="21">Enlace de Descarga: <a href="https://www.apachefriends.org/es/index.html">https://www.apachefriends.org/es/index.html</a></p>
<ol start="2">
<li class="has-line-data" data-line-start="22" data-line-end="24">Puesta en Marcha (Guía Paso a Paso)</li>
</ol>
<p class="has-line-data" data-line-start="24" data-line-end="25">Sigue estos pasos para ejecutar el proyecto en tu computadora.</p>
<p class="has-line-data" data-line-start="26" data-line-end="27">Paso 1: Colocar los Archivos del Proyecto</p>
<p class="has-line-data" data-line-start="28" data-line-end="29">El servidor Apache solo puede “ver” archivos que estén dentro de su carpeta htdocs.</p>
<p class="has-line-data" data-line-start="30" data-line-end="31">Copia la carpeta completa de tu proyecto (la que contiene index.html, php/, SQL/, etc.).</p>
<p class="has-line-data" data-line-start="32" data-line-end="33">Pégala dentro de la carpeta htdocs de XAMPP.</p>
<p class="has-line-data" data-line-start="34" data-line-end="35">Ruta de ejemplo: C:\xampp\htdocs\web-escolar\</p>
<p class="has-line-data" data-line-start="36" data-line-end="37">Nota: Al descargar de GitHub, el archivo ZIP puede llamarse web-escolar-main.zip. Asegúrate de que la carpeta que pongas en htdocs se llame simplemente web-escolar.</p>
<p class="has-line-data" data-line-start="38" data-line-end="39">Paso 2: Iniciar los Servicios de XAMPP</p>
<p class="has-line-data" data-line-start="40" data-line-end="41">Abre el Panel de Control de XAMPP.</p>
<p class="has-line-data" data-line-start="42" data-line-end="43">Inicia los dos servicios necesarios:</p>
<p class="has-line-data" data-line-start="44" data-line-end="45">Haz clic en “Start” al lado de Apache.</p>
<p class="has-line-data" data-line-start="46" data-line-end="47">Haz clic en “Start” al lado de MySQL.</p>
<p class="has-line-data" data-line-start="48" data-line-end="49">Ambos deben ponerse de color verde.</p>
<p class="has-line-data" data-line-start="50" data-line-end="51">Paso 3: Configurar la Base de Datos (phpMyAdmin)</p>
<p class="has-line-data" data-line-start="52" data-line-end="53">Tu código PHP necesita una base de datos para funcionar.</p>
<p class="has-line-data" data-line-start="54" data-line-end="55">Abre tu navegador y ve a <a href="http://localhost/phpmyadmin/">http://localhost/phpmyadmin/</a>.</p>
<p class="has-line-data" data-line-start="56" data-line-end="57">Crear la Base de Datos:</p>
<p class="has-line-data" data-line-start="58" data-line-end="59">Haz clic en “Nueva” en el panel izquierdo.</p>
<p class="has-line-data" data-line-start="60" data-line-end="61">Escribe un nombre para tu base de datos (ej: mi_proyecto_db).</p>
<p class="has-line-data" data-line-start="62" data-line-end="63">Importar las Tablas:</p>
<p class="has-line-data" data-line-start="64" data-line-end="65">Selecciona la base de datos que acabas de crear.</p>
<p class="has-line-data" data-line-start="66" data-line-end="67">Ve a la pestaña “Importar”.</p>
<p class="has-line-data" data-line-start="68" data-line-end="69">Haz clic en “Seleccionar archivo” y busca en tu proyecto la carpeta SQL/ y selecciona el archivo .sql que tengas allí.</p>
<p class="has-line-data" data-line-start="70" data-line-end="71">Haz clic en “Continuar” (o “Importar”).</p>
<p class="has-line-data" data-line-start="72" data-line-end="73">Paso 4: Configurar el Archivo de Conexión (¡Crítico!)</p>
<p class="has-line-data" data-line-start="74" data-line-end="75">Tu código PHP necesita saber cómo “hablar” con la base de datos.</p>
<p class="has-line-data" data-line-start="76" data-line-end="77">Dentro de tu proyecto, abre el archivo conexión.php (o el que esté en configuración/) con tu editor de código.</p>
<p class="has-line-data" data-line-start="78" data-line-end="79">Busca las variables de conexión. Se verán similares a esto:</p>
<p class="has-line-data" data-line-start="80" data-line-end="84">$db_host = “localhost”;<br>
$db_user = “root”;<br>
$db_pass = “”; // En XAMPP nuevo, la contraseña de root suele estar vacía<br>
$db_name = “mi_proyecto_db”; // &lt;-- ¡IMPORTANTE!</p>
<p class="has-line-data" data-line-start="86" data-line-end="87">Asegúrate de que $db_name sea exactamente el mismo nombre que le diste a tu base de datos en el Paso 3.</p>
<p class="has-line-data" data-line-start="88" data-line-end="89">Guarda el archivo.</p>
<p class="has-line-data" data-line-start="90" data-line-end="91">Paso 5: Ejecutar el Proyecto</p>
<p class="has-line-data" data-line-start="92" data-line-end="93">¡Listo! Ahora puedes ver tu proyecto en acción.</p>
<p class="has-line-data" data-line-start="94" data-line-end="95">Abre tu navegador (Chrome, Firefox, etc.).</p>
<p class="has-line-data" data-line-start="96" data-line-end="97">Escribe en la barra de direcciones:</p>
<p class="has-line-data" data-line-start="98" data-line-end="99"><a href="http://localhost/web-escolar/">http://localhost/web-escolar/</a></p>
<p class="has-line-data" data-line-start="100" data-line-end="101">(Reemplaza web-escolar si decidiste usar otro nombre para la carpeta).</p>
<ol start="3">
<li class="has-line-data" data-line-start="102" data-line-end="104">Estructura de Carpetas (Tu Proyecto)</li>
</ol>
<p class="has-line-data" data-line-start="104" data-line-end="105">Este es el diagrama de carpetas basado en tu imagen, con la explicación de cada parte.</p>
<p class="has-line-data" data-line-start="106" data-line-end="139">/tu-proyecto/<br>
├── index.html              # El esqueleto HTML que ve el usuario.<br>
├── conexión.php            # ¡CRÍTICO! Conecta PHP con la base de datos MySQL.<br>
├── .htaccess               # Configuración avanzada del servidor Apache (ej. URLs amigables).<br>
├── API/<br>
│   └── (Archivos para APIs externas, ej. enviar emails con Gmail)<br>
├── configuración/<br>
│   └── (Archivos de configuración, ej. datos globales del sitio)<br>
├── CSS/<br>
│   └── (Archivos .css para dar estilo y diseño)<br>
├── fecha/<br>
│   └── (Archivos PHP relacionados con funciones de fecha/hora)<br>
├── imagen/<br>
│   └── (Imágenes de diseño de la web, ej. banners)<br>
├── img_logo/<br>
│   └── (Logos del sitio)<br>
├── js/<br>
│   └── (Archivos JavaScript para la interactividad del “frontend”)<br>
├── ocodigos_no_usandos/<br>
│   └── (Código antiguo o de prueba. Buena práctica para limpiar)<br>
├── página/<br>
│   └── (Archivos PHP para páginas específicas, ej. “nosotros.php”)<br>
├── php/<br>
│   └── (El “cerebro” del backend. Archivos que consultan la base de datos)<br>
├── público/<br>
│   └── (Archivos públicos, similar a ‘assets’ o ‘imagen’)<br>
├── guiones/<br>
│   └── (Probablemente scripts PHP o JS con funciones específicas)<br>
├── SQL/<br>
│   └── tu_base_de_datos.sql  # El “plano” para crear tu base de datos.<br>
└── subidas/<br>
└── noticias/<br>
└── (Donde se guardan las imágenes que suben los usuarios)</p>
<ol start="4">
<li class="has-line-data" data-line-start="141" data-line-end="143">Análisis Técnico del Funcionamiento</li>
</ol>
<p class="has-line-data" data-line-start="143" data-line-end="144">Este proyecto tiene 3 componentes principales que trabajan juntos:</p>
<ol>
<li class="has-line-data" data-line-start="145" data-line-end="147">El Frontend (Lo que ves en el navegador)</li>
</ol>
<p class="has-line-data" data-line-start="147" data-line-end="148">Archivos: index.html, CSS/, js/</p>
<p class="has-line-data" data-line-start="149" data-line-end="150">Función: El index.html es el “esqueleto”. Los archivos de CSS/ le dan estilo.</p>
<p class="has-line-data" data-line-start="151" data-line-end="152">El Cerebro del Frontend: Los archivos en js/ manejan la interactividad. Cuando haces clic en un botón, el JavaScript usa fetch() para llamar a un archivo en la carpeta php/ (el backend) y pedirle datos.</p>
<ol start="2">
<li class="has-line-data" data-line-start="153" data-line-end="155">El Backend (Lo que pasa en el servidor)</li>
</ol>
<p class="has-line-data" data-line-start="155" data-line-end="156">Archivos: php/, configuración/, conexión.php, API/, página/, etc.</p>
<p class="has-line-data" data-line-start="157" data-line-end="158">Función: Este es el “motor” oculto. Se ejecuta en el servidor (XAMPP).</p>
<p class="has-line-data" data-line-start="159" data-line-end="160">El Cerebro del Backend: Los archivos en php/ reciben las peticiones del JavaScript. Usan conexión.php para poder hablar con la base de datos.</p>
<p class="has-line-data" data-line-start="161" data-line-end="162">Ejemplo: js/ pide “dame las noticias”. Apache ejecuta php/obtener_noticias.php. Ese archivo se conecta a MySQL, hace SELECT * FROM noticias, y devuelve los resultados en formato JSON.</p>
<ol start="3">
<li class="has-line-data" data-line-start="163" data-line-end="165">La Base de Datos (Donde viven los datos)</li>
</ol>
<p class="has-line-data" data-line-start="165" data-line-end="166">Archivos: SQL/ (el archivo de creación), y la base de datos real en phpMyAdmin.</p>
<p class="has-line-data" data-line-start="167" data-line-end="168">Función: Almacena toda tu información (usuarios, noticias, comentarios). Es permanente.</p>
<p class="has-line-data" data-line-start="169" data-line-end="170">NUNCA se accede a ella directamente desde el Frontend (JavaScript). SIEMPRE se accede a través de un intermediario (tus archivos PHP).</p>
<ol start="5">
<li class="has-line-data" data-line-start="171" data-line-end="173">Flujo de Funcionamiento (Resumen)</li>
</ol>
<p class="has-line-data" data-line-start="173" data-line-end="174">Así es como funciona todo junto:</p>
<p class="has-line-data" data-line-start="175" data-line-end="213">[ 1. USUARIO (Navegador) ]<br>
|<br>
(Abre index.html, hace clic)<br>
|<br>
v<br>
[ 2. JAVASCRIPT (Frontend, en js/) ]<br>
|<br>
(Hace una petición “fetch” a “php/dame_datos.php”)<br>
|<br>
v<br>
[ 3. APACHE (Servidor XAMPP) ]<br>
|<br>
(Recibe la petición y ejecuta el archivo PHP)<br>
|<br>
v<br>
[ 4. PHP (Backend, en php/) ]<br>
|<br>
(Usa “conexión.php” para hablar con MySQL)<br>
|<br>
v<br>
[ 5. BASE DE DATOS (MySQL) ]<br>
|<br>
(Busca los datos y los devuelve a PHP)<br>
|<br>
v<br>
[ 6. PHP (Backend) ]<br>
|<br>
(Convierte los datos a formato JSON y los “imprime”)<br>
|<br>
v<br>
[ 7. JAVASCRIPT (Frontend) ]<br>
|<br>
(Recibe el JSON y actualiza el HTML para mostrar los datos)<br>
|<br>
v<br>
[ 8. USUARIO (Navegador) ]<br>
|<br>
(Ve la información actualizada sin recargar la página)</p>
<ol start="6">
<li class="has-line-data" data-line-start="215" data-line-end="217">Configuraciones Adicionales</li>
</ol>
<p class="has-line-data" data-line-start="217" data-line-end="218">Cómo cambiar el Email del Administrador (Formulario de Contacto)</p>
<p class="has-line-data" data-line-start="219" data-line-end="220">¡Gracias por la corrección! Tu proyecto está configurado de manera profesional usando un archivo .env para manejar las configuraciones y contraseñas (como la que viste, GMAIL_PASS).</p>
<p class="has-line-data" data-line-start="221" data-line-end="222">Esto es mucho mejor, ya que no necesitas editar el código PHP (en la carpeta php/) para cambiar el destinatario.</p>
<p class="has-line-data" data-line-start="223" data-line-end="224">Para cambiar el email que recibe los mensajes del administrador:</p>
<p class="has-line-data" data-line-start="225" data-line-end="226">Ve a la carpeta php/. Dentro de esa carpeta, busca y abre el archivo llamado .env (puede estar oculto en tu sistema).</p>
<p class="has-line-data" data-line-start="227" data-line-end="228">Verás el contenido que me mostraste. Edita la línea ADMIN_EMAIL:</p>
<h1 class="code-line" data-line-start=229 data-line-end=230 ><a id="Este_es_el_email_que_ENVA_los_correos_la_cuenta_de_Google_229"></a>Este es el email que ENVÍA los correos (la cuenta de Google)</h1>
<p class="has-line-data" data-line-start="230" data-line-end="231"><a href="mailto:GMAIL_USER=lebelawsky@eest5.com">GMAIL_USER=lebelawsky@eest5.com</a></p>
<h1 class="code-line" data-line-start=231 data-line-end=232 ><a id="Esta_es_la_Contrasea_de_Aplicacin_de_16_dgitos_de_esa_cuenta_231"></a>Esta es la “Contraseña de Aplicación” de 16 dígitos de esa cuenta</h1>
<p class="has-line-data" data-line-start="232" data-line-end="234">GMAIL_PASS=jxewjvomopqnidap<br>
GMAIL_NAME=Web Escuela Técnica</p>
<h1 class="code-line" data-line-start=235 data-line-end=236 ><a id="ESTA_ES_LA_LNEA_QUE_BUSCAS_235"></a>¡ESTA ES LA LÍNEA QUE BUSCAS!</h1>
<h1 class="code-line" data-line-start=236 data-line-end=237 ><a id="Cambia_este_email_por_el_nuevo_email_que_recibir_los_mensajes_236"></a>Cambia este email por el nuevo email que recibirá los mensajes.</h1>
<p class="has-line-data" data-line-start="237" data-line-end="239"><a href="mailto:ADMIN_EMAIL=lebelawsky@eest5.com">ADMIN_EMAIL=lebelawsky@eest5.com</a><br>
ADMIN_NAME=Administrador</p>
<p class="has-line-data" data-line-start="241" data-line-end="242">Cambia <a href="mailto:lebelawsky@eest5.com">lebelawsky@eest5.com</a> en la línea ADMIN_EMAIL por la nueva dirección de email a la que quieres que lleguen los mensajes.</p>
<p class="has-line-data" data-line-start="243" data-line-end="244">¡Guarda el archivo y listo! El archivo PHP leerá esta configuración automáticamente.</p>
<p class="has-line-data" data-line-start="245" data-line-end="246">Nota sobre GMAIL_PASS: Como bien viste, GMAIL_PASS es la “Contraseña de Aplicación” de 16 dígitos. Si alguna vez cambias la cuenta de GMAIL_USER, tendrás que generar una nueva “Contraseña de aplicación” desde la configuración de seguridad de esa cuenta de Google.</p>
