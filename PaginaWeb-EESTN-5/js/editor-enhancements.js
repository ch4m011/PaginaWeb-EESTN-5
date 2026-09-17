/**
 * Mejoras para el editor contenteditable:
 * - Hacer imágenes no-editables para permitir selección de texto alrededor
 * - Permitir flotación de imágenes (left/right)
 * - Mejorar experiencia de selección y edición
 */

(function() {
  'use strict';

  // Esperar a que el DOM esté listo
  document.addEventListener('DOMContentLoaded', () => {
    const editor = document.getElementById('editor');
    if (!editor) return;

    /**
     * Hacer que todas las imágenes del editor sean no-editables
     * Esto permite seleccionar texto alrededor de ellas sin problemas
     */
    function makeImagesNonEditable() {
      const images = editor.querySelectorAll('img');
      images.forEach(img => {
        img.setAttribute('contenteditable', 'false');
        img.setAttribute('draggable', 'true');
        img.style.cursor = 'auto';
        // quitar clase seleccionada si la imagen fue reemplazada
        img.classList.remove('selected-image');
      });
    }

    // Ejecutar al cargar las imágenes del contenido anterior (si hay)
    makeImagesNonEditable();

    // Observer para detectar cuando se inserten nuevas imágenes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // Comprobar si se añadieron imágenes
          const hasImages = mutation.addedNodes.some(node => 
            node.nodeType === Node.ELEMENT_NODE && 
            (node.tagName === 'IMG' || node.querySelector('img'))
          );
          if (hasImages) {
            makeImagesNonEditable();
          }
        }
      });
    });

    // Observar cambios en el editor
    observer.observe(editor, {
      childList: true,
      subtree: true
    });

    // Registrar última imagen clickeada y marcarla como seleccionada
    editor.addEventListener('click', (e) => {
      // Si el clic es sobre una imagen, marcar selección
      if (e.target && e.target.tagName === 'IMG') {
        const img = e.target;
        // deseleccionar otras
        editor.querySelectorAll('img.selected-image').forEach(i => i.classList.remove('selected-image'));
        img.classList.add('selected-image');
        window.__lastEditorImage = img;
        return;
      }
      // Si se hace click fuera de una imagen, quitar selección
      if (e.target && e.target.closest && !e.target.closest('img')) {
        editor.querySelectorAll('img.selected-image').forEach(i => i.classList.remove('selected-image'));
        window.__lastEditorImage = null;
      }
    });

    /**
     * Mejorar selección múltiple de texto
     * Permitir seleccionar texto saltando sobre imágenes
     */
    // No bloquear el click en imágenes — permitimos que el usuario haga clic
    // para seleccionarlas y luego usar los botones de la toolbar.

    /**
     * Atajo: Ctrl+L para alinear imagen a la izquierda
     * Ctrl+R para alinear a la derecha
     * Ctrl+E para centrar
     */
    // Hemos eliminado los atajos de teclado para imágenes (Ctrl+L/Ctrl+R/Ctrl+E)
    // porque la toolbar debe encargarse de la alineación mediante botones.

    /**
     * Guardar clases de alineación al enviar el formulario
     * Esto asegura que la alineación se mantenga al publicar
     */
    const form = document.getElementById('formNoticia');
    if (form) {
      form.addEventListener('submit', () => {
        // Las clases CSS ya están en el HTML gracias a classList,
        // pero asegurarse de que se serialicen correctamente
        const images = editor.querySelectorAll('img');
        images.forEach(img => {
          if (img.classList.contains('float-left')) {
            img.style.float = 'left';
          } else if (img.classList.contains('float-right')) {
            img.style.float = 'right';
          } else {
            img.style.float = 'none';
          }
        });
      });
    }
  });
})();
