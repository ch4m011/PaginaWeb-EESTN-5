// js/preguntas-frecuentes.js — buscador simple para filtrar las preguntas
'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('faqBuscar');
  const vacio = document.getElementById('faqVacio');
  if (!input) return;

  const normalizar = (t) =>
    (t || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  input.addEventListener('input', () => {
    const q = normalizar(input.value.trim());
    let visibles = 0;

    document.querySelectorAll('.faq-item').forEach((item) => {
      const coincide = !q || normalizar(item.textContent).includes(q);
      item.hidden = !coincide;
      if (coincide) visibles++;
      if (q && coincide) item.open = true; else if (!q) item.open = false;
    });

    document.querySelectorAll('.faq-grupo').forEach((g) => {
      g.hidden = !g.querySelector('.faq-item:not([hidden])');
    });

    if (vacio) vacio.hidden = visibles > 0;
  });
});
