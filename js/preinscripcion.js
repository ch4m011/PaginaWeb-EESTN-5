function setTextField(ddl) {
    document.getElementById('anio_inscripcion_text').value = ddl.options[ddl.selectedIndex].text;
}

function comprobar(username) {
    // Esperar a que Prototype esté listo
    if (typeof Ajax === 'undefined') {
        console.warn('Ajax no está disponible aún');
        return;
    }
    var url = 'comprobarExistenciaAlumno.php';
    var pars = 'username=' + username.value;
    var myAjax = new Ajax.Updater('comprobar_mensaje2', url, { method: 'get', parameters: pars });
}

function validacionEmail(field) {
    if (field.value.trim() === "") {
        const spanId = field.id === 'inp_email' ? 'emailOK' : 'emailOK2';
        document.getElementById(spanId).innerHTML = "";
        return;
    }

    usuario = field.value.substring(0, field.value.indexOf("@"));
    dominio = field.value.substring(field.value.indexOf("@") + 1, field.value.length);

    const spanId = field.id === 'inp_email' ? 'emailOK' : 'emailOK2';

    if ((usuario.length >= 1) &&
        (dominio.length >= 3) &&
        (usuario.search("@") == -1) &&
        (dominio.search("@") == -1) &&
        (usuario.search(" ") == -1) &&
        (dominio.search(" ") == -1) &&
        (dominio.search(".") != -1) &&
        (dominio.indexOf(".") >= 1) &&
        (dominio.lastIndexOf(".") < dominio.length - 1)) {
        document.getElementById(spanId).innerHTML = "";
    }
    else {
        document.getElementById(spanId).innerHTML = "<font color='red'>E-mail inválido. Vuelva a escribirlo </font>";
        field.value = "";
        field.focus();
    }
}


function mostrarReferencia() {
    if (document.getElementById('comprobar_mensaje2').innerText == "Disponible.") {
        document.getElementById('BotonEnviar').style.display = 'block';
        updateFormValidity();
    } else {
        document.getElementById('BotonEnviar').style.display = 'none';
    }
}


document.addEventListener('DOMContentLoaded', function () {
    // Field elements (adapted to IDs found in the form)
    const fields = {
        nombre: document.getElementById('nombre'),
        apellido: document.getElementById('apellido'),
        documento: document.getElementById('Nro_doc'),
        fecha: document.getElementById('fec_nacimiento'),
        lugar: document.getElementById('lugar_nacimiento'),
        cod_area: document.getElementById('Cod_Area'),
        telefono: document.getElementById('Num_Telefono'),
        escuela: document.getElementById('proviene_escuela'),
        calle: document.getElementById('calle'),
        nro: document.getElementById('nro'),
        entre: document.getElementById('calle_entre'),
        y: document.getElementById('calle_entre_y'),
        partido: document.getElementById('cbx_partido'),
        localidad: document.getElementById('cbx_localidad')
    };

    // Create container for PDF button and logo upload
    const form = document.querySelector('form.form-horizontal');
    const divActions = document.createElement('div');
    divActions.className = 'form-group';
    divActions.style.marginTop = '15px';
    divActions.innerHTML = `
    <label class="col-sm-2 control-label">Documento PDF:</label>
    <div class="col-sm-10">
        <button id="btnPdf" class="btn btn-primary" disabled>Faltan completar campos</button>
        <button id="btnPdfAlert" style="display:none;" class="btn btn-warning">Completar formulario</button>
        <button id="btnPdfPrintable" class="btn btn-secondary">Descargar formulario imprimible</button>
    </div>
`;
    form.parentNode.insertBefore(divActions, form.nextSibling);

    const btnPdf = document.getElementById('btnPdf');
    // Actualizar texto del botón PDF según validez del formulario
    function updateBtnPdfText() {
        const requiredIds = [
            'nombre', 'apellido', 'Nro_doc', 'fec_nacimiento', 'lugar_nacimiento',
            'cbx_partido', 'cbx_localidad', 'calle', 'nro', 'calle_entre', 'calle_entre_y',
            'Cod_Area', 'Num_Telefono', 'proviene_escuela'
        ];
        let missing = [];
        requiredIds.forEach(function (id) {
            const el = document.getElementById(id);
            if (!el || !el.value || (el.tagName === 'SELECT' && el.value === '0')) {
                missing.push(id);
            }
        });
        if (missing.length > 0) {
            btnPdf.textContent = 'Faltan completar campos';
        } else {
            btnPdf.textContent = 'Descargar PDF de Inscripción';
        }
    }
    // Actualizar al cargar y en cada cambio
    updateBtnPdfText();
    const watchIds = [
        'nombre', 'apellido', 'Nro_doc', 'fec_nacimiento', 'lugar_nacimiento',
        'cbx_partido', 'cbx_localidad', 'calle', 'nro', 'calle_entre', 'calle_entre_y',
        'Cod_Area', 'Num_Telefono', 'proviene_escuela'
    ];
    watchIds.forEach(function (id) {
        const el = document.getElementById(id);
        if (!el) return;
        const ev = (el.tagName.toLowerCase() === 'select') ? 'change' : 'input';
        el.addEventListener(ev, updateBtnPdfText);
        el.addEventListener('blur', updateBtnPdfText);
    });

    // PDF generation (colecciona todos los controles del formulario, añade logo y genera un PDF profesional)
    btnPdf.addEventListener('click', async function (e) {
        e.preventDefault();
        try { updateFormValidity(); } catch (err) { console.warn('updateFormValidity falló:', err); }

        // Validar campos obligatorios y mostrar mensajes visuales
        const requiredIds = [
            'nombre', 'apellido', 'Nro_doc', 'fec_nacimiento', 'lugar_nacimiento',
            'cbx_partido', 'cbx_localidad', 'calle', 'nro', 'calle_entre', 'calle_entre_y',
            'Cod_Area', 'Num_Telefono', 'proviene_escuela'
        ];
        let missing = [];
        requiredIds.forEach(function (id) {
            const el = document.getElementById(id);
            if (!el || !el.value || (el.tagName === 'SELECT' && el.value === '0')) {
                missing.push(id);
                if (el) {
                    el.classList.add('campo-obligatorio-faltante');
                    el.setAttribute('data-error', 'Campo obligatorio');
                }
            } else {
                if (el) {
                    el.classList.remove('campo-obligatorio-faltante');
                    el.removeAttribute('data-error');
                }
            }
        });
        // Cambiar texto del botón según estado
        updateBtnPdfText();
        if (missing.length > 0) {
            alert('Faltan campos obligatorios por completar. Por favor, revise los campos marcados.');
            let msg = document.getElementById('faltanCamposMsg');
            if (!msg) {
                msg = document.createElement('div');
                msg.id = 'faltanCamposMsg';
                msg.style.color = 'red';
                msg.style.marginTop = '10px';
                btnPdf.parentNode.appendChild(msg);
            }
            msg.textContent = 'Debe completar todos los campos obligatorios para descargar el PDF.';
            const el = document.getElementById(missing[0]);
            if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); el.focus(); }
            return;
        } else {
            let msg = document.getElementById('faltanCamposMsg');
            if (msg) { msg.textContent = ''; }
        }

        // utilidad: cargar imagen y convertir a dataURL
        async function loadImageDataURL(url) {
            try {
                // encode spaces
                const safeUrl = encodeURI(url);
                const resp = await fetch(safeUrl);
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                const blob = await resp.blob();
                return await new Promise((res, rej) => {
                    const reader = new FileReader();
                    reader.onloadend = function () { res(reader.result); };
                    reader.onerror = rej;
                    reader.readAsDataURL(blob);
                });
            } catch (e) { console.warn('No se pudo cargar imagen', url, e); return null; }
        }

        // recolectar pares etiqueta -> valor
        const pairs = [];
        const controls = form.querySelectorAll('input, select, textarea');
        controls.forEach(function (ctrl) {
            if (!ctrl.id && !ctrl.name) return;
            const type = (ctrl.type || '').toLowerCase();
            if (type === 'hidden' || type === 'submit' || type === 'button' || type === 'file') return;

            let label = '';
            if (ctrl.id) {
                const lab = document.querySelector('label[for="' + ctrl.id + '"]');
                if (lab) label = lab.textContent.trim();
            }
            if (!label) label = (ctrl.name && ctrl.name !== '') ? ctrl.name : (ctrl.id || 'Campo');

            let value = '';
            if (ctrl.tagName.toLowerCase() === 'select') {
                const opt = ctrl.options && ctrl.selectedIndex >= 0 ? ctrl.options[ctrl.selectedIndex] : null;
                value = opt ? opt.text.trim() : (ctrl.value || '');
            } else if (type === 'checkbox') {
                value = ctrl.checked ? (ctrl.value || 'Sí') : 'No';
            } else if (type === 'radio') {
                if (!ctrl.checked) return;
                value = ctrl.value || 'Seleccionado';
            } else {
                value = ctrl.value || '';
            }
            value = String(value).replace(/\s+/g, ' ').trim();
            pairs.push({ label: label, value: value });
        });

        // preparar PDF profesional y estético
        try {
            const logoUrl = '../img/logo-tecnica.png';
            const logoData = await loadImageDataURL(logoUrl);
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF({ unit: 'mm', format: 'a4' });

            const pageWidth = doc.internal.pageSize.getWidth();
            const margin = 15;
            const contentWidth = pageWidth - margin * 2;

            // Header: colocar logo en esquina superior derecha (fuera del recuadro)
            const logoSize = 28; // mm (agrandado)
            const logoX = pageWidth - margin - logoSize;
            const logoY = margin - 2; // colocar cerca del margen superior
            if (logoData) {
                try { doc.addImage(logoData, 'PNG', logoX, logoY, logoSize, logoSize); } catch (e) { /* ignore */ }
            }

            doc.setFontSize(16);
            doc.setFont(undefined, 'bold');
            // Títulos ubicados bajo el logo, con suficiente espacio antes del recuadro
            doc.text('E.E.S.T. Nro 5 "Gral. Manuel N. Savio"', margin, margin + 2);
            doc.setFontSize(12);
            doc.setFont(undefined, 'normal');
            doc.text('Planilla de Preinscripción — Ciclo Lectivo 2025', margin, margin + 8);

            // dibujar un recuadro para el contenido (comenzar más abajo para no tocar el logo)
            const startY = margin + logoSize + 8; // deja espacio para logo y títulos
            let y = startY + 4;
            doc.setDrawColor(0);
            doc.setLineWidth(0.4);
            doc.rect(margin - 2, startY - 2, contentWidth + 4, 240, 'S');
            // recordar la página y coordenadas del recuadro para elementos fijos (firma, pie)
            const rectPage = doc.getNumberOfPages();
            const rectTop = startY - 2;
            const rectHeight = 240;
            const rectBottom = rectTop + rectHeight;

            const sectionGap = 6;
            const labelColWidth = 45; // mm
            const valueColX = margin + labelColWidth + 4;
            const valueColWidth = contentWidth - labelColWidth - 8;
            const rowHeight = 7;

            // helper para obtener valor (incluye select option text)
            function getVal(id) {
                const el = document.getElementById(id);
                if (!el) return '';
                if (el.tagName.toLowerCase() === 'select') {
                    const opt = el.options && el.selectedIndex >= 0 ? el.options[el.selectedIndex] : null;
                    return opt ? (opt.text || opt.value) : (el.value || '');
                }
                return el.value || '';
            }

            // secciones y campos a imprimir (label, id)
            const sections = [
                {
                    title: 'Datos del alumno', fields: [
                        ['Nombre(s)', 'nombre'],
                        ['Apellido(s)', 'apellido'],
                        ['Tipo documento', 'tipo_doc'],
                        ['Nro. Documento', 'Nro_doc'],
                        ['Fecha nacimiento', 'fec_nacimiento'],
                        ['Lugar de nacimiento', 'lugar_nacimiento'],
                        ['Nacionalidad', 'nacionalidad'],
                        ['Email', 'inp_email'],
                        ['Email (alternativo)', 'inp_email2']
                    ]
                },
                {
                    title: 'Teléfono', fields: [
                        ['Tipo', 'Tipo_tel'],
                        ['Cód. Área', 'Cod_Area'],
                        ['Número', 'Num_Telefono']
                    ]
                },
                {
                    title: 'Dirección', fields: [
                        ['Partido', 'cbx_partido'],
                        ['Localidad', 'cbx_localidad'],
                        ['Calle', 'calle'],
                        ['Nro', 'nro'],
                        ['Entre', 'calle_entre'],
                        ['Y', 'calle_entre_y']
                    ]
                },
                {
                    title: 'Datos de la inscripción', fields: [
                        ['Año inscripción', 'anio_inscripcion_text'],
                        ['Turno deseado', 'turno'],
                        ['Escuela anterior', 'proviene_escuela']
                    ]
                }
            ];

            doc.setFontSize(11);
            sections.forEach(function (sec) {
                // título de sección
                if (y + 10 > 272) { doc.addPage(); y = 20; }
                doc.setFont(undefined, 'bold');
                doc.text(sec.title, margin + 2, y);
                y += rowHeight;
                doc.setFont(undefined, 'normal');

                sec.fields.forEach(function (f) {
                    const label = f[0] + ':';
                    const val = String(getVal(f[1]) || '-');

                    // dividir valor en líneas según columna de valor
                    const valLines = doc.splitTextToSize(val, valueColWidth);

                    // escribir label
                    doc.setFont(undefined, 'bold');
                    doc.text(label, margin + 2, y);
                    doc.setFont(undefined, 'normal');
                    // primera línea de valor a la derecha
                    if (valLines.length > 0) {
                        doc.text(String(valLines[0]), valueColX, y);
                        // subrayado debajo del valor
                        doc.setLineWidth(0.3);
                        doc.line(valueColX, y + 2.5, valueColX + valueColWidth - 10, y + 2.5);
                    }
                    y += rowHeight;
                    // líneas restantes
                    for (let i = 1; i < valLines.length; i++) {
                        if (y > 272) { doc.addPage(); y = 20; }
                        doc.text(String(valLines[i]), valueColX, y);
                        doc.setLineWidth(0.3);
                        doc.line(valueColX, y + 2.5, valueColX + valueColWidth - 10, y + 2.5);
                        y += rowHeight;
                    }
                });

                y += sectionGap; // espacio extra entre secciones
            });

            // firma y pie: colocarlos siempre dentro del recuadro en la página donde se dibujó
            try {
                // conservar la página actual y volver más tarde
                const currentPage = doc.getCurrentPage ? doc.getCurrentPage() : doc.getNumberOfPages();
                // dibujar firma y fecha dentro del recuadro, cerca de su borde inferior
                doc.setPage(rectPage);
                doc.setLineWidth(0.5);
                const firmaY = rectBottom - 28; // posicionar la línea de firma 28mm por encima del borde inferior
                doc.line(margin + 10, firmaY, margin + 80, firmaY);
                doc.text('Firma del responsable', margin + 10, firmaY + 4);
                // linea fecha
                doc.line(margin + 110, firmaY, margin + 170, firmaY);
                doc.text('Fecha', margin + 110, firmaY + 4);

                // pie dentro del recuadro, ligeramente arriba del borde inferior
                doc.setFontSize(9);
                const footerY = rectBottom - 6;
                doc.text('Documento generado por el sistema de preinscripción — E.E.S.T. Nro 5', margin, footerY - 2);

                // restaurar la página actual (si existía otra API, intentar volver a la última página)
                try { doc.setPage(currentPage); } catch (e) { /* ignore if not supported */ }
            } catch (e) { console.warn('No se pudo posicionar firma/pie dentro del recuadro', e); }

            // generar nombre de archivo
            function safeName(s) { return String(s || '').trim().replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_\-]/g, '').toLowerCase() || 'sin_nombre'; }
            const apellido = (document.getElementById('apellido') || { value: '' }).value;
            const nombre = (document.getElementById('nombre') || { value: '' }).value;
            const filename = `inscripcion_${safeName(apellido)}_${safeName(nombre)}.pdf`;

            doc.save(filename);
        } catch (e) {
            console.error('Error generando PDF profesional', e);
            alert('Ocurrió un error al generar el PDF. Revisá la consola para más detalles.');
        }
    });

    // Botón para descargar formulario imprimible (campos en blanco para rellenar a mano)
    const btnPdfPrintable = document.getElementById('btnPdfPrintable');
    if (btnPdfPrintable) {
        btnPdfPrintable.addEventListener('click', async function (e) {
            e.preventDefault();

            try {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF({ unit: 'mm', format: 'a4' });
                const pageWidth = doc.internal.pageSize.getWidth();
                const margin = 15;
                const contentWidth = pageWidth - margin * 2;

                // Cargar logo y agregar en esquina superior derecha
                const logoUrl = '../img/logo-tecnica.png';
                let logoData = null;
                try {
                    const resp = await fetch(logoUrl);
                    if (resp.ok) {
                        const blob = await resp.blob();
                        logoData = await new Promise((res, rej) => {
                            const reader = new FileReader();
                            reader.onloadend = function () { res(reader.result); };
                            reader.onerror = rej;
                            reader.readAsDataURL(blob);
                        });
                    }
                } catch (e) { logoData = null; }

                // header
                doc.setFontSize(16);
                doc.setFont(undefined, 'bold');
                doc.text('E.E.S.T. Nro 5 "Gral. Manuel N. Savio"', margin, 20);
                doc.setFontSize(12);
                doc.setFont(undefined, 'normal');
                doc.text('Formulario de Preinscripción — Versión imprimible', margin, 26);
                // Logo en esquina superior derecha (alineado igual que el PDF completo)
                if (logoData) {
                    const logoSize = 28;
                    const logoX = pageWidth - margin - logoSize;
                    const logoY = margin - 2;
                    doc.addImage(logoData, 'PNG', logoX, logoY, logoSize, logoSize);
                }

                // cuadro
                const startY = margin + 28 + 8; // igual que el PDF completo, debajo del logo y títulos
                let y = startY;
                doc.setLineWidth(0.4);
                doc.rect(margin - 2, startY - 4, contentWidth + 4, 250, 'S');

                const labelColWidth = 50;
                const valueX = margin + labelColWidth + 4;
                const valueWidth = contentWidth - labelColWidth - 8;
                const rowH = 7; // Menos espacio entre campos

                // secciones y campos (mismos títulos que en el PDF principal)
                const sectionsPrintable = [
                    { title: 'Datos del alumno', fields: ['Nombre(s)', 'Apellido(s)', 'Tipo documento', 'Nro. Documento', 'Fecha nacimiento', 'Lugar de nacimiento', 'Nacionalidad', 'Email', 'Email (alternativo)'] },
                    { title: 'Teléfono', fields: ['Tipo', 'Cód. Área', 'Número'] },
                    { title: 'Dirección', fields: ['Partido', 'Localidad', 'Calle', 'Nro', 'Entre', 'Y'] },
                    { title: 'Datos de la inscripción', fields: ['Año inscripción', 'Turno deseado', 'Escuela anterior'] }
                ];
                doc.setFontSize(11);
                sectionsPrintable.forEach(function (sec) {
                    if (y + 10 > 275) { doc.addPage(); y = 20; }
                    doc.setFont(undefined, 'bold');
                    doc.text(sec.title, margin + 2, y);
                    y += rowH;
                    doc.setFont(undefined, 'normal');

                    sec.fields.forEach(function (lbl) {
                        if (y + rowH > 275) { doc.addPage(); y = 20; }
                        // label centrado con la línea
                        doc.text(lbl + ':', margin + 2, y + 2.5);
                        // línea en blanco para completar a mano, alineada
                        const lineY = y + 3;
                        const lineStart = valueX;
                        const lineEnd = valueX + valueWidth - 10;
                        doc.setLineWidth(0.5);
                        doc.line(lineStart, lineY, lineEnd, lineY);
                        y += rowH;
                    });

                    y += 4; // Menos espacio entre secciones
                });

                // firma
                if (y + 30 > 275) { doc.addPage(); y = 20; }
                const sigY = y + 12;
                doc.line(margin + 10, sigY, margin + 80, sigY);
                doc.text('Firma del responsable', margin + 10, sigY + 5);
                doc.line(margin + 110, sigY, margin + 170, sigY);
                doc.text('Fecha', margin + 110, sigY + 5);

                const filename = 'formulario_preinscripcion_imprimible.pdf';
                doc.save(filename);
            } catch (err) {
                console.error('Error generando formulario imprimible', err);
                alert('Error al generar el formulario imprimible. Revisá la consola.');
            }
        });
    }
});