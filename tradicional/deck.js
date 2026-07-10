// ============================================================
//  Framework de navegación de slides (compartido Retail/Tradicional)
//  Misma mecánica que el informe de Televentas (src/app.js).
//  Las slides se declaran en el HTML con class="slide" y data-label.
// ============================================================

let current = 0;
let animating = false;
const animated = new Set();
let slides = [];

document.addEventListener('DOMContentLoaded', () => {
  slides = Array.from(document.querySelectorAll('.slide'));
  buildNav();
  scaleSlider();
  window.addEventListener('resize', scaleSlider);
  goTo(0, true);
  document.addEventListener('keydown', onKey);
  document.getElementById('prev-btn').addEventListener('click', prev);
  document.getElementById('next-btn').addEventListener('click', next);
});

function scaleSlider() {
  const el = document.getElementById('scaler');
  const W = 1280, H = 720;
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  el.style.transform = `translate(-50%, -50%) scale(${s})`;
}

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
  }
}

function next() { if (current < slides.length - 1) goTo(current + 1); }
function prev() { if (current > 0) goTo(current - 1); }

function onKey(e) {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') { e.preventDefault(); next(); }
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')  { e.preventDefault(); prev(); }
}

function buildNav() {
  const nav = document.getElementById('nav');
  slides.forEach((s, i) => {
    if (i > 0) { const d = document.createElement('div'); d.className = 'dot-sep'; nav.appendChild(d); }
    const b = document.createElement('button');
    b.textContent = s.dataset.label || `Slide ${i + 1}`;
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
  document.getElementById('progress').style.width = ((current) / (slides.length - 1)) * 100 + '%';
}

function triggerAnimations(idx) {
  const slide = slides[idx];
  slide.querySelectorAll('[data-w]').forEach(el => { el.style.width = el.dataset.w; });
  slide.querySelectorAll('[data-h]').forEach(el => { el.style.height = el.dataset.h; });
}
