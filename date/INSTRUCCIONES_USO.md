# 🎉 SISTEMA DE CALENDARIO - ADAPTADO A BASE DE DATOS

## 📌 ¿Qué se ha hecho?

Se ha adaptado completamente el sistema de calendario para que guarde y cargue todos los eventos desde la **base de datos MySQL** en lugar de usar archivos JSON locales.

**Antes:** Noticias y Ensayos en BD → Calendario en JSON ❌
**Ahora:** Noticias, Ensayos **Y Calendario** en BD ✅

---

## 🚀 CÓMO EMPEZAR (3 PASOS)

### Paso 1: Inicializar la Base de Datos
Abre en tu navegador:
```
http://localhost/web-escolar/date/setup.html
```

Haz clic en el botón azul **"▶️ Ejecutar Setup Completo"**

Espera a que aparezca el resumen verde con ✅

### Paso 2: Verificar que Todo Funciona
Haz clic en **"📋 Ver Eventos Actuales"**

Deberías ver los eventos que había en el JSON (si existen)

### Paso 3: ¡A Usar!
- **Calendario Completo:** `http://localhost/web-escolar/pagina/calendario.html`
- **Panel Flotante:** `http://localhost/web-escolar/index.html` (botón 📅)

---

## 📁 ARCHIVOS CREADOS Y MODIFICADOS

### ✨ Nuevos (Creados)
```
date/
├── api_calendario.php       ← API REST para calendario (CRUD)
├── setup_calendario.php     ← Script de setup automático
├── setup.html               ← Interfaz amigable para setup
├── migrate_calendario.php   ← Migración JSON → BD
├── test_api.html            ← Interfaz de testing
├── README.md                ← Documentación técnica
└── CAMBIOS_RESUMEN.md       ← Resumen de cambios
```

### 🔄 Modificados (Adaptados a BD)
```
js/
├── calendario.js            ← Ahora usa API en lugar de JSON
└── calendario_flotante.js   ← Ahora usa API en lugar de JSON
```

---

## 💾 BASE DE DATOS

### Tabla Creada: `calendarios`
```
id              → Identificador único
fecha           → Fecha del evento
titulo          → Título del evento
tipo            → Tipo: evento, feriado, sin-clases
descripcion     → Descripción (opcional)
horaInicio      → Hora de inicio
horaFin         → Hora de finalización
fecha_creacion  → Timestamp automático
```

---

## 🎯 FUNCIONALIDADES

### ✅ Crear Evento
1. Ve a `http://localhost/web-escolar/pagina/calendario.html`
2. Selecciona una fecha en el calendario
3. Completa el formulario:
   - Título
   - Tipo (Evento, Feriado, Sin clases)
   - Descripción
   - Horas de inicio y fin
4. Click en "Crear Evento" ✓
5. **El evento se guarda automáticamente en la BD**

### ✅ Ver Eventos
**Opción A - Panel Flotante (pequeño):**
- Click en el botón 📅 en `index.html`
- Muestra los próximos eventos

**Opción B - Calendario Completo (grande):**
- Abre `http://localhost/web-escolar/pagina/calendario.html`
- Ve todos los eventos del mes

### ✅ Editar Evento
1. En el calendario, busca el evento
2. Click en "✏️ Editar"
3. Modifica los campos
4. Click en "Actualizar"
5. **Cambios guardados en BD**

### ✅ Eliminar Evento
1. Click en "🗑️ Eliminar"
2. El evento desaparece
3. **Eliminado de la BD**

---

## 🔌 API REST (Para desarrolladores)

### Obtener Eventos
```bash
curl "http://localhost/web-escolar/date/api_calendario.php?action=obtener"
```

### Crear Evento
```bash
curl -X POST "http://localhost/web-escolar/date/api_calendario.php?action=crear" \
  -H "Content-Type: application/json" \
  -d '{
    "fecha": "2025-12-25",
    "titulo": "Navidad",
    "tipo": "titulo-feriado",
    "descripcion": "Día festivo",
    "horaInicio": "00:00:00",
    "horaFin": "23:59:59"
  }'
```

### Actualizar Evento
```bash
curl -X PUT "http://localhost/web-escolar/date/api_calendario.php?action=actualizar" \
  -H "Content-Type: application/json" \
  -d '{
    "id": 1,
    "titulo": "Navidad (Modificado)"
  }'
```

### Eliminar Evento
```bash
curl -X DELETE "http://localhost/web-escolar/date/api_calendario.php?action=eliminar" \
  -H "Content-Type: application/json" \
  -d '{"id": 1}'
```

---

## 🧪 TESTING

Abre en navegador para testear la API:
```
http://localhost/web-escolar/date/test_api.html
```

Aquí puedes:
- ✅ Verificar tabla
- ✅ Obtener eventos
- ✅ Crear eventos
- ✅ Actualizar eventos
- ✅ Eliminar eventos
- ✅ Ejecutar test completo

---

## 🎨 TIPOS DE EVENTOS

| Tipo | Icono | Color | Uso |
|------|-------|-------|-----|
| `titulo-evento` | 🎉 | Azul | Eventos importantes |
| `titulo-feriado` | 📅 | Rojo | Días festivos/feriados |
| `titulo-no-clases` | ⚠️ | Naranja | Días sin clases |

---

## ❓ PREGUNTAS FRECUENTES

### P: ¿Se perdieron los eventos del JSON?
**R:** No. El sistema migra automáticamente los datos del `calendario.json` a la base de datos en la primera ejecución.

### P: ¿Puedo seguir usando el JSON?
**R:** El archivo sigue existiendo, pero ya no se usa. Los cambios se guardan en la BD.

### P: ¿Cómo hago backup de los eventos?
**R:** Ahora están en la BD. Haz backup de la base de datos `web_escolar` (como haces con Noticias).

### P: ¿El calendario flotante va a cargar correctamente?
**R:** Sí, se modificó para usar la API en lugar del JSON. Debe cargar automáticamente.

### P: ¿Qué pasa si hay un error?
**R:** 
1. Abre la consola del navegador (F12)
2. Busca mensajes de error rojo
3. Abre `http://localhost/web-escolar/date/setup.html`
4. Ejecuta el setup nuevamente

---

## 📊 FLUJO DE DATOS

```
┌─────────────────┐
│  Usuario        │
│  Abre           │
│  calendario.html│
└────────┬────────┘
         │
         ↓
┌─────────────────────────┐
│  JS (calendario.js)     │
│  - Llama a API          │
│  - Muestra eventos      │
│  - Detecta cambios      │
└────────┬────────────────┘
         │
         ↓
┌──────────────────────────┐
│  PHP (api_calendario.php)│
│  - Valida datos          │
│  - Consulta BD           │
│  - Devuelve JSON         │
└────────┬─────────────────┘
         │
         ↓
┌──────────────────────────┐
│  MySQL (calendarios)     │
│  - Almacena eventos      │
│  - Índices optimizados   │
│  - Datos persistentes    │
└──────────────────────────┘
```

---

## 🔐 SEGURIDAD

✅ **Implementado:**
- Prepared Statements (contra SQL Injection)
- Validación de entrada
- Validación de tipo de datos
- Error handling seguro

---

## 📈 VENTAJAS DEL NUEVO SISTEMA

✅ **Persistencia Permanente** - Datos seguros en BD
✅ **Escalabilidad** - Soporta muchos eventos
✅ **Performance** - Índices de BD optimizados
✅ **Concurrencia** - Múltiples usuarios simultáneamente
✅ **Integridad** - Los datos se validan
✅ **Backups** - Protegidos con la BD
✅ **API Rest** - Fácil de integrar

---

## 🎓 RESUMEN DE CAMBIOS EN CÓDIGO

### Antes (calendario.js - JSON)
```javascript
// Cargar del archivo JSON
const res = await fetch("../date/calendario.php");
eventos = await res.json();

// Guardar todo el array
await fetch("../date/calendario.php", {
    method: "POST",
    body: JSON.stringify(eventos)
});
```

### Ahora (calendario.js - BD)
```javascript
// Cargar de la API
const res = await fetch("../date/api_calendario.php?action=obtener");
eventos = await res.json();

// Crear evento individual
await fetch("../date/api_calendario.php?action=crear", {
    method: "POST",
    body: JSON.stringify(datosEvento)
});

// Actualizar evento individual
await fetch("../date/api_calendario.php?action=actualizar", {
    method: "PUT",
    body: JSON.stringify({id, ...datos})
});

// Eliminar evento individual
await fetch("../date/api_calendario.php?action=eliminar", {
    method: "DELETE",
    body: JSON.stringify({id})
});
```

---

## 📞 SOPORTE

Si algo no funciona:

1. **Verifica Setup:**
   - Abre `http://localhost/web-escolar/date/setup.html`
   - Ejecuta setup
   - Verifica que todos los pasos salgan en verde ✅

2. **Testing:**
   - Abre `http://localhost/web-escolar/date/test_api.html`
   - Prueba cada operación CRUD

3. **Consola del Navegador (F12):**
   - Busca errores en rojo
   - Copia el error completo

4. **Logs PHP:**
   - Revisa `php/debug_log.txt`

---

## ✨ ¡LISTO PARA USAR!

El sistema está completamente funcional. Ahora:
1. Los eventos se guardan en la BD
2. El panel flotante carga desde la BD
3. El calendario completo funciona con la BD
4. Todo está sincronizado

**¡No hay más archivos JSON que mantener! 🎉**

Simplemente crea eventos, edítalos, elimínalos... y todo se guarda automáticamente en la base de datos.
