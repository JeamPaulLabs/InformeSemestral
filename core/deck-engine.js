// ============================================================
//  Motor de navegación compartido — Retail / Tradicional
//  Se carga ANTES de app_retail.js / app_tradicional.js.
//  Ese archivo declara el estado (current, animating, animated,
//  slides, map, NAV_LABELS) y llama a estas funciones desde
//  DOMContentLoaded, por lo que el orden de carga es seguro:
//  las funciones no se ejecutan hasta que el estado ya existe.
// ============================================================

/* ── SCALE (always fill screen) ─────────────────────────────── */
function scaleSlider() {
  const el = document.getElementById('scaler');
  const W = 1280, H = 720;
  const scaleX = window.innerWidth  / W;
  const scaleY = window.innerHeight / H;
  const s = Math.min(scaleX, scaleY);
  el.style.transform = `translate(-50%, -50%) scale(${s})`;

  // #nav está fixed al viewport real, no al lienzo escalado: en pantallas anchas
  // (scaleY es el factor limitante) el lienzo toca el borde inferior real y #nav
  // queda encima del contenido. Se mide su altura real y se convierte a px de
  // diseño (dividiendo por s) para que, tras escalar, la reserva vuelva a coincidir
  // exactamente con el alto real de #nav — válido en cualquier resolución.
  const nav = document.getElementById('nav');
  if (nav) {
    const navClearanceReal = (window.innerHeight - nav.getBoundingClientRect().top) + 24;
    document.documentElement.style.setProperty('--chrome-clearance', (navClearanceReal / s) + 'px');
  }
}

/* ── NAVIGATION ─────────────────────────────────────────────── */
function goTo(idx, immediate = false) {
  if (animating && !immediate) return;
  if (idx < 0 || idx >= slides.length) return;

  const oldSlide = slides[current];
  const newSlide = slides[idx];

  if (!immediate && oldSlide !== newSlide) {
    animating = true;
    oldSlide.classList.add('leaving');
    setTimeout(() => { oldSlide.classList.remove('active', 'leaving'); }, 400);
  } else if (immediate) {
    slides.forEach(s => s.classList.remove('active', 'entering', 'leaving'));
  }

  current = idx;
  newSlide.style.display = 'flex';
  newSlide.classList.add('active');
  if (!immediate) {
    newSlide.classList.add('entering');
    setTimeout(() => { newSlide.classList.remove('entering'); animating = false; }, 550);
  }

  updateNav();
  updateProgress();

  if (!animated.has(idx)) {
    animated.add(idx);
    setTimeout(() => triggerAnimations(idx), immediate ? 100 : 500);
  } else {
    triggerAnimations(idx);
  }

  // Handle Leaflet map resizing when entering Map Slide (idx === 2)
  if (idx === 2) {
    initMap();
  }
}

function next() { if (current < slides.length - 1) goTo(current + 1); }
function prev() { if (current > 0) goTo(current - 1); }

function onKey(e) {
  // Si hay un lightbox abierto (galería de Evidencias en Televentas), Escape lo
  // cierra y las flechas no navegan slides. No-op en decks sin #lightbox-overlay.
  const lightboxOpen = document.getElementById('lightbox-overlay')?.style.display === 'flex';
  if (lightboxOpen) {
    if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
    return;
  }
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown'  || e.key === ' ') { e.preventDefault(); next(); }
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); prev(); }
}

/* ── NAV BAR ─────────────────────────────────────────────────── */
function buildNav() {
  const nav = document.getElementById('nav');
  nav.innerHTML = '';
  slides.forEach((_, i) => {
    if (i > 0) { const d = document.createElement('div'); d.className = 'dot-sep'; nav.appendChild(d); }
    const b = document.createElement('button');
    b.textContent = NAV_LABELS[i];
    b.dataset.idx = i;
    b.addEventListener('click', () => goTo(i));
    nav.appendChild(b);
  });
}

function updateNav() {
  document.querySelectorAll('#nav button').forEach(b => {
    b.classList.toggle('active', +b.dataset.idx === current);
  });
  document.getElementById('counter').textContent = `${current + 1} / ${slides.length}`;
}

function updateProgress() {
  const pct = ((current) / (slides.length - 1)) * 100;
  document.getElementById('progress').style.width = pct + '%';
}

/* ── ANIMATIONS (bars, trends) ──────────────────────────────── */
function triggerAnimations(idx) {
  const slide = slides[idx];
  slide.querySelectorAll('[data-w]').forEach(el => {
    el.style.width = el.dataset.w;
  });
  slide.querySelectorAll('[data-h]').forEach(el => {
    el.style.height = el.dataset.h;
  });
}

/* ── TABS (paneles tipo "strategy-tabs", ej. Estrategia 2S) ──── */
function deckTab(name) {
  document.querySelectorAll('.strategy-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.strategy-pane').forEach(p => p.classList.remove('active'));
  const pane = document.getElementById('pane-' + name);
  if (pane) pane.classList.add('active');
}

/* ── HELPERS ────────────────────────────────────────────────── */
function fmt(n)  { return n == null ? '—' : n.toLocaleString('es-CO'); }
function fmtPct(n) { return n == null ? '—' : n.toFixed(1).replace('.', ',') + ' %'; }
function badge(txt, type) { return `<span class="badge badge-${type}">${txt}</span>`; }
