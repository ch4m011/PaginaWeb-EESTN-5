/* === js/validaciones.js - agregado por asistente === */
document.addEventListener('DOMContentLoaded', function(){
  const currentYear = new Date().getFullYear();

  const localidadesPorPartido = {
    "La Plata": ["City Bell","Tolosa","Los Hornos","Gonnet","Villa Elvira","Ringuelet","Manuel B. Gonnet"],
    "Berisso": ["Berisso Centro","Villa Argüello","Villa Zula","El Carmen"],
    "Ensenada": ["Punta Lara","El Dique","Villa Catella"],
    "Avellaneda": ["Piñeyro","Sarandí","Dock Sud","Villa Dominico"],
    "Lanús": ["Lanús Este","Lanús Oeste","Remedios de Escalada"],
    "Quilmes": ["Quilmes Centro","Bernal","Ezpeleta","Don Bosco"],
    "Lomas de Zamora": ["Banfield","Temperley","Llavallol","Turdera"],
    "Morón": ["Castelar","Morón Centro","Haedo","El Palomar"],
    "Tigre": ["Tigre Centro","San Fernando","Don Torcuato","Rincón de Milberg"],
    "San Isidro": ["San Isidro","Martínez","Acassuso"],
    "Mar del Plata": ["Mar del Plata Centro","Batán"],
    "Bahía Blanca": ["Bahía Blanca Centro","Ingeniero White"],
    "Pergamino": ["Pergamino Centro"],
    "San Nicolás": ["San Nicolás Centro"],
    "Olavarría": ["Olavarría Centro"],
    "Merlo": ["Merlo Centro"],
    "José C. Paz": ["José C. Paz Centro","Trujui"],
    "General Pueyrredón": ["Mar del Plata"],
    "General San Martín": ["San Martín Centro"],
    "Escobar": ["Belén de Escobar","Maquinista Savio"],
    "San Miguel": ["San Miguel Centro","Muñiz"],
    "Ituzaingó": ["Ituzaingó Centro"],
    "Florencio Varela": ["Florencio Varela Centro","Bosques"],
    "Almirante Brown": ["Adrogué"],
    "Berazategui": ["Berazategui Centro","Plátanos"],
    "Dolores": ["Dolores Centro"]
  };

  // usar los selects reales del formulario (cbx_partido / cbx_localidad)
  const partidoSel = document.getElementById('cbx_partido') || document.querySelector('select[name="partido"], select#partido');
  const localidadSel = document.getElementById('cbx_localidad') || document.querySelector('select[name="localidad"], select#localidad');

  // lookup por clave en minúsculas para evitar problemas de mayúsculas
  const localidadesLookup = {};
  Object.keys(localidadesPorPartido).forEach(function(k){
    localidadesLookup[k.trim().toLowerCase()] = localidadesPorPartido[k];
  });

  if(partidoSel){
    // si el select está vacío podemos poblarlo (opcional)
    if(partidoSel.options.length <= 1){
      partidoSel.innerHTML = '<option value="">Seleccione partido</option>';
      Object.keys(localidadesPorPartido).sort().forEach(function(p){
        const opt = document.createElement('option');
        opt.value = p;
        opt.textContent = p.toUpperCase();
        partidoSel.appendChild(opt);
      });
    }

    partidoSel.addEventListener('change', function(){
      const idx = partidoSel.selectedIndex;
      const optionText = (idx >= 0 && partidoSel.options[idx]) ? partidoSel.options[idx].text.trim() : '';
      const key = optionText.toLowerCase();
      if(localidadSel){
        localidadSel.innerHTML = '<option value="">Seleccione localidad</option>';
        const lista = localidadesLookup[key];
        if(Array.isArray(lista)){
          lista.forEach(function(loc){
            const opt = document.createElement('option');
            opt.value = loc;
            opt.textContent = loc;
            localidadSel.appendChild(opt);
          });
        }
      }
    });
  }

  function setError(el, msg){
    if(!el) return;
    let id = el.getAttribute('data-err-id');
    if(!id){
      id = 'err_' + (Math.random().toString(36).substr(2,9));
      el.setAttribute('data-err-id', id);
    }
    let span = document.getElementById(id);
    if(!span){
      span = document.createElement('div');
      span.id = id;
      span.className = 'field-error';
      span.style.color = 'red';
      span.style.fontSize = '0.9em';
      span.style.marginTop = '4px';
      if(el.nextSibling) el.parentNode.insertBefore(span, el.nextSibling);
      else el.parentNode.appendChild(span);
    }
    span.textContent = msg;
  }
  function clearError(el){
    if(!el) return;
    const id = el.getAttribute('data-err-id');
    if(!id) return;
    const span = document.getElementById(id);
    if(span) span.textContent='';
  }

  function validName(v){ return /^[A-Za-zÀ-ÿ\s'\-]{2,25}$/.test(v); }
  function validDNI(v){ return /^[0-9]{6,8}$/.test(v); }
  function validEmail(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
  function validYear(v){ return /^[0-9]{1,4}$/.test(v) && parseInt(v,10) <= currentYear && parseInt(v,10) >= 1900; }

  const nombre = document.querySelector('input[name="nombre"], input#nombre');
  const apellido = document.querySelector('input[name="apellido"], input#apellido');
  const dni = document.querySelector('input[name="dni"], input#dni, input[name="documento"]');
  const email = document.querySelector('input[type="email"], input[name="email"], input#email');
  const anio = document.querySelector('input[name="anio"], input[name="año"], input[name="year"], input#anio, input#ano');

  if(nombre){
    nombre.addEventListener('input', function(){ clearError(nombre); });
    nombre.addEventListener('blur', function(){ 
      if(!validName(nombre.value)) setError(nombre,'Nombre inválido: solo letras (máximo 25 caracteres)'); 
      else clearError(nombre); 
    });
  }
  if(apellido){
    apellido.addEventListener('input', function(){ clearError(apellido); });
    apellido.addEventListener('blur', function(){ 
      if(!validName(apellido.value)) setError(apellido,'Apellido inválido: solo letras (máximo 25 caracteres)'); 
      else clearError(apellido); 
    });
  }
  if(dni){
    dni.addEventListener('input', function(){ clearError(dni); dni.value = dni.value.replace(/[^0-9]/g,'').slice(0,8); });
    dni.addEventListener('blur', function(){ if(!validDNI(dni.value)) setError(dni,'Documento inválido: solo números (6-8 dígitos).'); else clearError(dni); });
  }
  if(email){
    email.addEventListener('blur', function(){ if(email.value && !validEmail(email.value)) setError(email,'Email inválido.'); else clearError(email); });
  }
  if(anio){
    anio.addEventListener('input', function(){ anio.value = anio.value.replace(/[^0-9]/g,'').slice(0,4); clearError(anio); });
    anio.addEventListener('blur', function(){ if(anio.value && !validYear(anio.value)) setError(anio,'Año inválido: solo hasta 4 dígitos y ≤ año actual.'); else clearError(anio); });
  }

  // Configuración de campos con límites
  const inputs = {
    // Campos de texto (25 caracteres máximo)
    'nombre': {max: 25, type: 'text'},
    'apellido': {max: 25, type: 'text'},
    'lugar_nacimiento': {max: 25, type: 'text'},
    'proviene_escuela': {max: 25, type: 'text'},

    // Ahora Calle, Entre y Y aceptan solo números
    'calle': {max: 5, type: 'number'},
    'calle_entre': {max: 5, type: 'number'}, 
    'calle_entre_y': {max: 5, type: 'number'},

    // Campos numéricos
    'Nro_doc': {max: 8, type: 'number'},
    'nro': {max: 4, type: 'number'},
    'Cod_Area': {max: 4, type: 'number'},
    // permitir hasta 9 dígitos (coincide con el max en el HTML: 999999999)
    'Num_Telefono': {max: 9, type: 'number'}
  };

  // mensajes específicos para algunos campos
  const customFieldMsgs = {
    'calle': 'Calle inválida: solo números (máximo 5 dígitos).',
    'calle_entre': 'Entre inválido: solo números (máximo 5 dígitos).',
    'calle_entre_y': 'Y inválido: solo números (máximo 5 dígitos).',
    'cbx_localidad': 'Localidad inválida: seleccione una opción.'
  };

  // Aplicar límites y validaciones a todos los campos
  Object.entries(inputs).forEach(([id, config]) => {
    const input = document.getElementById(id);
    if(input) {
      // Establecer maxlength
      input.setAttribute('maxlength', config.max);
      
      // Manejar entrada de datos
      input.addEventListener('input', function(){
        if(config.type === 'text') {
          this.value = this.value.replace(/[^A-Za-zÀ-ÿ\s]/g, '');
        } else {
          this.value = this.value.replace(/[^0-9]/g, '');
        }
        if(this.value.length > config.max) {
          this.value = this.value.slice(0, config.max);
        }
        clearError(this);
      });

      // Validación al perder foco
      input.addEventListener('blur', function(){
        const value = this.value.trim();
        if(!value) {
          setError(this, 'Campo requerido');
        } else if(config.type === 'text') {
          if(!/^[A-Za-zÀ-ÿ\s]{1,25}$/.test(value)) {
            setError(this, `Solo letras (máximo ${config.max} caracteres)`);
          } else {
            clearError(this); 
          }
        } else {
          if(!/^[0-9]+$/.test(value)) {
            // mensaje personalizado si existe
            setError(this, customFieldMsgs[id] || `Solo números (máximo ${config.max} dígitos)`);
          } else {
            clearError(this);
          }
        }
      });
    }
  });

  // Validación fecha de nacimiento (no futura)
  const fecNacimiento = document.getElementById('fec_nacimiento');
  if(fecNacimiento){
    function validarFechaNoFutura(el){
      const v = el.value;
      if(!v){ setError(el,'Fecha requerida'); return false; }
      const sel = new Date(v);
      const today = new Date(); today.setHours(0,0,0,0);
      if(sel > today){ setError(el,'Fecha inválida: no puede ser futura'); return false; }
      clearError(el);
      return true;
    }
    fecNacimiento.addEventListener('change', function(){ validarFechaNoFutura(this); });
    fecNacimiento.addEventListener('blur', function(){ validarFechaNoFutura(this); });
  }

  const form = document.querySelector('form#formPreins') || document.querySelector('form');
  if(form){
    form.addEventListener('submit', function(e){
      let ok = true;
      if(nombre){ 
        if(!validName(nombre.value)){ 
          setError(nombre,'Nombre inválido: solo letras (máximo 25 caracteres)'); 
          ok=false; 
        } 
      }
      if(apellido){ 
        if(!validName(apellido.value)){ 
          setError(apellido,'Apellido inválido: solo letras (máximo 25 caracteres)'); 
          ok=false; 
        } 
      }
      if(dni){ if(!validDNI(dni.value)){ setError(dni,'Documento inválido: solo números (6-8 dígitos).'); ok=false; } }
      if(email){ if(email.value && !validEmail(email.value)){ setError(email,'Email inválido.'); ok=false; } }
      if(anio){ if(anio.value && !validYear(anio.value)){ setError(anio,'Año inválido: solo hasta 4 dígitos y ≤ año actual.'); ok=false; } }
      if(partidoSel && partidoSel.value && localidadSel){
        if(!localidadSel.value){ setError(localidadSel, customFieldMsgs['cbx_localidad']); ok=false; }
      }
      if(fecNacimiento){
        if(!validarFechaNoFutura(fecNacimiento)) ok = false;
      }
      if(!ok){
        e.preventDefault();
        e.stopPropagation();
        window.scrollTo({top: (form.offsetTop - 20), behavior: 'smooth'});
      }
    });
  }

  // habilitar botón PDF cuando todo esté correcto
  (function(){
    function isDigits(v){ return /^[0-9]+$/.test(v || ''); }
    function isDniOk(v){ return /^\d{6,8}$/.test(v || ''); }
    function isPhoneOk(v, max){ return /^\d{6,}$/.test(v || '') && v.length <= max; }
    function isAreaOk(v){ return /^\d{1,4}$/.test(v || ''); }
    function isTextOk(v){ return /^[A-Za-zÀ-ÿ\s'\-]{1,25}$/.test((v||'').trim()); }
    function isDateNotFuture(v){
      if(!v) return false;
      const sel = new Date(v); sel.setHours(0,0,0,0);
      const today = new Date(); today.setHours(0,0,0,0);
      return sel <= today;
    }

    window.updateFormValidity = function(){
      const btn = document.getElementById('btnPdf');
      if(!btn) return;

      const f = document.querySelector('form.form-horizontal');
      if(!f){ btn.disabled = true; return; }

      const get = id => document.getElementById(id);
      const nombre = get('nombre');
      const apellido = get('apellido');
      const dni = get('Nro_doc');
      const fec = get('fec_nacimiento');
      const lugar = get('lugar_nacimiento');
      const partido = get('cbx_partido');
      const localidad = get('cbx_localidad');
      const calle = get('calle');
      const nro = get('nro');
      const codArea = get('Cod_Area');
      const telefono = get('Num_Telefono');
      const escuela = get('proviene_escuela');

      let ok = true;

      if(!nombre || !isTextOk(nombre.value)) ok = false;
      if(!apellido || !isTextOk(apellido.value)) ok = false;
      if(!dni || !isDniOk(String(dni.value).trim())) ok = false;
      if(!fec || !isDateNotFuture(fec.value)) ok = false;
      if(!lugar || !isTextOk(lugar.value)) ok = false;
  // nota: la variable proviene_escuela no existe — evitar referencia que lanza ReferenceError
  // (si necesitamos lógica específica para 'proviene_escuela' la agregamos explícitamente)
      if(escuela && !isTextOk(escuela.value)) ok = false;
      if(!partido || !partido.value || partido.value === '0') ok = false;
      if(!localidad || !localidad.value) ok = false;
      if(!calle || !isDigits(String(calle.value).trim())) ok = false;
      if(!nro || !isDigits(String(nro.value).trim())) ok = false;
  if(!codArea || !isAreaOk(String(codArea.value).trim())) ok = false;
  // permitir hasta 9 dígitos (coincide con el HTML: max="999999999")
  if(!telefono || !isPhoneOk(String(telefono.value).trim(), 9)) ok = false;

      btn.disabled = !ok;
      return ok;
    };

    // campos a observar para actualizar el estado del botón
    const watchIds = [
      'nombre','apellido','Nro_doc','fec_nacimiento','lugar_nacimiento',
      'cbx_partido','cbx_localidad','calle','nro','calle_entre','calle_entre_y',
      'Cod_Area','Num_Telefono','proviene_escuela'
    ];
    watchIds.forEach(function(id){
      const el = document.getElementById(id);
      if(!el) return;
      const ev = (el.tagName.toLowerCase() === 'select') ? 'change' : 'input';
      el.addEventListener(ev, window.updateFormValidity);
      el.addEventListener('blur', window.updateFormValidity);
    });

    // ejecutar una primera vez al cargar
    window.addEventListener('load', function(){ setTimeout(window.updateFormValidity, 50); });
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(window.updateFormValidity, 50); });
  })();
});
/* === /js/validaciones.js === */
