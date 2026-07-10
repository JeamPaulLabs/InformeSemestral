// ============================================================
//  INFORME CANAL TELEVENTAS 2026 – app.js
//  Datos consolidados de: Manager_Performance_2026.md
//                         Liquidacion_Metas_2026.md
//                         Análisis_Data_Disponible.md
//  Última actualización: 2026-07-08 (semestre completo ene–jun,
//  liquidación de junio integrada y ratificada como cifra oficial)
// ============================================================

/* ── DATA BASE ──────────────────────────────────────────────── */
const DATA = {
  meses: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
  registros:       [201409, 94918, 134897, 153111, 154335, 173413],
  rechazados:      [99241,  48185, 60998,  114123, 116691, 109130],
  aptos:           [102168, 46733, 73899,  38988,  37644,  64283],
  pctRechazo:      [49.27,  50.76, 45.22,  74.54,  75.61,  62.93],
  contactados:     [21204,  19832, 27138,  16200,  24031,  21291],
  contactabilidad: [20.75,  42.72, 44.93,  52.19,  63.84,  49.05],
  efectividad:     [7.96,   10.31, 6.73,   9.56,   8.49,   9.39],
  ventasOp:        [1687,   2044,  1827,   1548,   2041,   1999],  // tablero operativo
  ventasLiq:       [2245,   2374,  2431,   2367,   2186,   2314],  // liquidación Martha (semestre completo)
  metaE1:          [2025,   2010,  2225,   2586,   2576,   2707],
  metaE2:          [2430,   2412,  2670,   3104,   3097,   1884],
  cumplE1:         [110.9,  118.1, 109.3,  91.5,   84.9,   85.5],
  asesores:        [15,     17,    18,     20,      20,     21],
  promPolizas:     [149.7,  139.6, 135.1,  118.3,  109.3,  110.2],
};

/* ── ESQUEMA DE INCENTIVOS (extraído de liquidaciones) ──────── */
const ESQUEMA_MESES = [
  { mes: 'Ene', e1meta: 135, e1pago: 675000,  e2meta: 162, e2pago: 972000,  e3meta: 189, e3pago: 1323000, telemed: 6, condicional: 25, volante: null,   novedades: 'Meta inicial del equipo' },
  { mes: 'Feb', e1meta: 135, e1pago: 675000,  e2meta: 162, e2pago: 972000,  e3meta: 189, e3pago: 1323000, telemed: 6, condicional: 25, volante: null,   novedades: 'Sin cambios' },
  { mes: 'Mar', e1meta: 135, e1pago: 675000,  e2meta: 162, e2pago: 972000,  e3meta: 189, e3pago: 1323000, telemed: 6, condicional: 25, volante: null,   novedades: 'Sin cambios' },
  { mes: 'Abr', e1meta: 140, e1pago: 700000,  e2meta: 168, e2pago: 1008000, e3meta: 196, e3pago: 1372000, telemed: 6, condicional: 25, volante: null,   novedades: 'Meta sube 3,7 % — equipo llega a 20 asesores' },
  { mes: 'May', e1meta: 140, e1pago: 700000,  e2meta: 168, e2pago: 1008000, e3meta: 196, e3pago: 1372000, telemed: 6, condicional: 25, volante: 120,    novedades: 'Meta Volante: +Bono por 120 pólizas extra' },
  { mes: 'Jun', e1meta: 140, e1pago: 700000,  e2meta: 168, e2pago: 1008000, e3meta: 196, e3pago: 1372000, telemed: 6, condicional: 25, volante: null,   novedades: 'Metas diferenciadas: top performers a 150 pólizas' },
];

/* ── INCENTIVOS EXTRAS PAGADOS (hoja INCENTIVOS SEGUROS) ───── */
const INCENTIVOS_EXTRAS = [
  { mes: 'Ene', total: 0,  eventos: 8,  nota: 'Incentivo destacado en torneo + varios incentivos menores' },
  { mes: 'Feb', total: 0,  eventos: 7,  nota: 'Incentivos de rendimiento destacado + varios menores' },
  { mes: 'Mar', total: 0,  eventos: 5,  nota: 'Incentivos de rendimiento medio' },
  { mes: 'Abr', total: 0,  eventos: 5,  nota: 'Patrón similar a marzo' },
  { mes: 'May', total: 0,  eventos: 7,  nota: 'Incentivo destacado + Meta Volante' },
  { mes: 'Jun', total: 0,  eventos: 9,  nota: 'Incentivos de rendimiento por cumplimiento de metas' },
];

/* ── EQUIPO: ROTACIÓN Y METAS INDIVIDUALES ───────────────────── */
const ROSTER = {
  estables:  14, // en todos los meses ene-may
  movimientos: [
    { periodo: 'Ene → Feb', entran: ['Cesar Barrera', 'Josue Zabaleta', 'Rhoymar Hdz.'], salen: ['Silvana Otero'] },
    { periodo: 'Feb → Mar', entran: ['Nayerlis Polo'], salen: [] },
    { periodo: 'Mar → Abr', entran: ['Ruddy Olmos', 'Yannecce Mejía'], salen: [] },
    { periodo: 'Abr → May', entran: ['Michelle Robles', 'Jean Guzmán'],  salen: ['Josue Zabaleta', 'Nayerlis Polo'] },
    { periodo: 'May → Jun', entran: [], salen: ['Ruddy Olmos', 'Michelle Robles'] },
  ],
  rosterPorMes: [15, 17, 18, 20, 20, 21],  // ene-jun
};

/* ── METAS INDIVIDUALES EN JUNIO (fuente: METAS ENERO A JUNIO.xlsx) */
const METAS_JUN = [
  { nombre: 'Jesús D. Cortés',       e1: 150, tendencia: 'top',    nota: 'Meta premium — mejor vendedor del canal' },
  { nombre: 'Melissa P. Orozco',     e1: 150, tendencia: 'top',    nota: 'Meta premium — consistente todo el semestre' },
  { nombre: 'Luisa L. Percy',        e1: 150, tendencia: 'top',    nota: 'Meta premium' },
  { nombre: 'Alan Hernández',        e1: 140, tendencia: 'estable', nota: 'Estable' },
  { nombre: 'Anderson Monterrosa',   e1: 140, tendencia: 'estable', nota: 'Estable' },
  { nombre: 'Rhoymar Hdz.',          e1: 140, tendencia: 'sube',    nota: 'Subió desde meta reducida (40) en feb' },
  { nombre: 'Santiago Chávez',       e1: 140, tendencia: 'estable', nota: 'Estable todo el semestre' },
  { nombre: 'Yulieth Pacheco',       e1: 140, tendencia: 'estable', nota: 'Estable' },
  { nombre: 'Dayana Guerrero',       e1: 132, tendencia: 'baja',    nota: 'Bajó 8 vs. mayo — leve ajuste' },
  { nombre: 'Jean J. Guzmán',        e1: 130, tendencia: 'sube',    nota: 'Nuevo asesor — escala rápido' },
  { nombre: 'Cesar Barrera',         e1: 130, tendencia: 'sube',    nota: 'Partió en 40, llegó a 130 en jun' },
  { nombre: 'Isabella Rueda',        e1: 130, tendencia: 'baja',    nota: 'Irregular — 135→80→140→130' },
  { nombre: 'Laura L. Herrera',      e1: 120, tendencia: 'riesgo',  nota: '⚠ Bajó de 140 a 120 — posible ausentismo' },
  { nombre: 'Yannecce Mejía',        e1: 120, tendencia: 'sube',    nota: 'Partió en 40, subió a 120' },
  { nombre: 'Julithza Padilla',      e1: 140, tendencia: 'estable', nota: 'Estable' },
  { nombre: 'Valentina Orozco',      e1: 140, tendencia: 'estable', nota: 'Recuperó tras baja en marzo' },
  { nombre: 'Nohelia H. Salas',      e1: 75,  tendencia: 'riesgo',  nota: '⚠ Bajó de 140 a 75 — posible incapacidad/reducción jornada' },
  { nombre: 'Joelis J. Barros',      e1: 140, tendencia: 'recupera',nota: 'Recuperó tras caída a 80 en mayo' },
];

/* ── CAMPAÑAS ─────────────────────────────────────────────── */
/* Consolidado ene–jun (semestre completo). Suma de registros/contactados/gestionados/
   ventas de las 6 campañas mensuales de Manager_Performance_2026.md §2 — el total
   de registros (912.083) y ventas (11.146) cuadra exacto con DATA. */
const CAMPANAS = [
  { nombre: 'Bienvenidas Cuota Protegida', contactab: '79 %', conv: '19,5 %', perfil: 'Excelente' },
  { nombre: 'Autogestión',                 contactab: '71 %', conv: '26,6 %', perfil: 'Excelente' },
  { nombre: 'Cuota Protegida Stock',       contactab: '49 %', conv: '4,6 %',  perfil: 'Bajo' },
  { nombre: 'Masiva Voluntarios',          contactab: '17 %', conv: '1,9 %',  perfil: 'Bajo' },
];

/* ── TOP ASESORES (pólizas por mes, tablero operativo) ─────── */
/* Todos los asesores del semestre (liquidación ene–may; jun pendiente).
   meses = pólizas liquidadas · metas = meta Escala 1 del mes. Orden: total desc. */
const ASESORES = [
  { nombre: 'Jesús David Cortés Ortega', meses: [205,234,208,197,210,222], metas: [135,135,135,140,140,150], metaJun: 150 },
  { nombre: 'Melissa Paola Orozco Jinete', meses: [144,195,189,157,161,175], metas: [135,135,135,140,140,150], metaJun: 150 },
  { nombre: 'Luisa L. Percy Jaraba', meses: [155,175,178,147,144,153], metas: [135,135,135,140,140,150], metaJun: 150 },
  { nombre: 'Dayana D. Guerrero Hernández', meses: [151,188,169,148,144,135], metas: [135,135,135,140,140,132], metaJun: 132 },
  { nombre: 'Anderson Monterrosa Castilla', meses: [167,149,169,146,149,145], metas: [135,135,135,140,140,140], metaJun: 140 },
  { nombre: 'Joelis J. Barros B.', meses: [154,180,168,136,81,167], metas: [135,135,135,126,80,140], metaJun: 140 },
  { nombre: 'Yulieth Pacheco', meses: [163,176,149,145,123,129], metas: [135,135,135,140,140,140], metaJun: 140 },
  { nombre: 'Alan José Hernández Loaiza', meses: [163,137,152,141,140,132], metas: [135,135,135,140,140,140], metaJun: 140 },
  { nombre: 'Santiago Elí Chávez Carmona', meses: [136,136,156,138,140,123], metas: [135,135,135,140,140,140], metaJun: 140 },
  { nombre: 'Julithza Milagros Padilla Mejía', meses: [138,140,148,143,119,81], metas: [135,135,135,140,140,140], metaJun: 140 },
  { nombre: 'Nohelia H. Salas Monterrosa', meses: [131,142,142,141,100,76], metas: [135,135,135,140,126,75], metaJun: 75 },
  { nombre: 'Isabella Sofía Rueda Caserta', meses: [135,129,27,135,99,122], metas: [135,135,80,140,140,130], metaJun: 130 },
  { nombre: 'Laura L. Herrera Palomino', meses: [140,149,147,85,78,34], metas: [135,135,135,140,140,120], metaJun: 120 },
  { nombre: 'Valentina Orozco', meses: [127,142,20,139,99,95], metas: [135,135,80,140,140,140], metaJun: 140 },
  { nombre: 'Rhoymar Hernández Albarrán', meses: [null,39,157,140,129,137], metas: [null,40,135,140,140,140], metaJun: 140 },
  { nombre: 'César Barrera Pájaro', meses: [null,33,134,75,104,105], metas: [null,40,135,140,140,130], metaJun: 130 },
  { nombre: 'Jean J. Guzmán', meses: [null,null,null,null,101,119], metas: [null,null,null,null,120,130], metaJun: 130 },
  { nombre: 'Josué Zabaleta Bethel', meses: [null,30,109,59,null,null], metas: [null,40,135,140,null,null], metaJun: null },
  { nombre: 'Yannecce Mejía Gómez', meses: [null,null,null,19,45,76], metas: [null,null,null,40,120,120], metaJun: 120 },
  { nombre: 'Silvana Otero', meses: [136,null,null,null,null,null], metas: [135,null,null,null,null,null], metaJun: null },
  { nombre: 'Nayerlis Polo Marrugo', meses: [null,null,9,73,null,null], metas: [null,null,40,140,null,null], metaJun: null },
  { nombre: 'KARINA YISELL MARQUEZ HERNANDEZ', meses: [null,null,null,null,null,54], metas: [null,null,null,null,null,60], metaJun: 60 },
  { nombre: 'Ruddy Olmos Simanca', meses: [null,null,null,3,18,13], metas: [null,null,null,40,120,120], metaJun: 120 },
  { nombre: 'ROSALINDA RIVERA SENIOR', meses: [null,null,null,null,null,21], metas: [null,null,null,null,null,120], metaJun: 120 },
  { nombre: 'Michelle Paola Robles Becerra', meses: [null,null,null,null,2,null], metas: [null,null,null,null,50,null], metaJun: null },
];

/* ── MOTIVOS DE DESCARTE ────────────────────────────────────── */
const DESCARTE_MOTIVOS = [   // % del descarte total del semestre (548.368 registros)
  { motivo: 'Registro enviado anteriormente', pct: 49 },
  { motivo: 'Producto ya activo (CP / MS)',   pct: 29 },
  { motivo: 'Dirección repetida/errónea',     pct: 4  },
  { motivo: 'Contrato / cédula repetida',     pct: 4  },
  { motivo: 'Supera edad',                    pct: 3  },
  { motivo: 'Teléfono errado',                pct: 3  },
  { motivo: 'Otros',                          pct: 8  },
];

/* ── SLIDE DEFINITIONS ─────────────────────────────────────── */
const SLIDES = [
  'slide-portada',
  'slide-sec1',          // Capítulo 1 header
  'slide-ventas',        // Resultados de ventas
  'slide-bases',         // Análisis de bases
  'slide-campanas',      // Desempeño por campaña
  'slide-asesores',      // Top asesores
  'slide-iniciativas',   // Iniciativas, capacitaciones y procesos 1S (Vanti/Xuma)
  'slide-sec2',          // Capítulo 2 header
  'slide-contactab',     // Contactabilidad
  'slide-telefonia',     // Infraestructura telefónica Tigo/Movistar
  'slide-descarte',      // Motivos de rechazo
  'slide-proyeccion',    // Proyección 3.000 ventas
  'slide-estrategia',    // Estrategia 2S (pendiente Martha)
  'slide-evidencias',    // Evidencias fotográficas de iniciativas
  'slide-cierre',        // Cierre
];

/* ── STATE ──────────────────────────────────────────────────── */
let current = 0;
let animating = false;
const animated = new Set();

/* ── INIT ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  buildNav();
  scaleSlider();
  window.addEventListener('resize', scaleSlider);
  goTo(0, true);
  document.addEventListener('keydown', onKey);
  document.getElementById('prev-btn').addEventListener('click', prev);
  document.getElementById('next-btn').addEventListener('click', next);
});

/* ── SCALE (always fill screen) ─────────────────────────────── */
function scaleSlider() {
  const el = document.getElementById('scaler');
  const W = 1280, H = 720;
  const scaleX = window.innerWidth  / W;
  const scaleY = window.innerHeight / H;
  const s = Math.min(scaleX, scaleY);
  el.style.transform = `translate(-50%, -50%) scale(${s})`;
}

/* ── NAVIGATION ─────────────────────────────────────────────── */
function goTo(idx, immediate = false) {
  if (animating && !immediate) return;
  if (idx < 0 || idx >= SLIDES.length) return;

  const slides = document.querySelectorAll('.slide');
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

function next() { if (current < SLIDES.length - 1) goTo(current + 1); }
function prev() { if (current > 0) goTo(current - 1); }

function onKey(e) {
  const lightboxOpen = document.getElementById('lightbox-overlay')?.style.display === 'flex';
  if (lightboxOpen) {
    if (e.key === 'Escape') { e.preventDefault(); closeLightbox(); }
    return;
  }
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown'  || e.key === ' ') { e.preventDefault(); next(); }
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   { e.preventDefault(); prev(); }
}

/* ── NAV BAR ─────────────────────────────────────────────────── */
const NAV_LABELS = [
  'Portada', 'Cap. 1', 'Ventas', 'Bases', 'Campañas', 'Asesores', 'Iniciativas',
  'Cap. 2', 'Contactab.', 'Telefonía', 'Descarte', 'Proyección', 'Estrategia', 'Evidencias', 'Cierre'
];

function buildNav() {
  const nav = document.getElementById('nav');
  SLIDES.forEach((_, i) => {
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
  document.getElementById('counter').textContent = `${current + 1} / ${SLIDES.length}`;
}

function updateProgress() {
  const pct = ((current) / (SLIDES.length - 1)) * 100;
  document.getElementById('progress').style.width = pct + '%';
}

/* ── ANIMATIONS (bars, trends) ──────────────────────────────── */
function triggerAnimations(idx) {
  const slide = document.querySelectorAll('.slide')[idx];

  // CSS bars
  slide.querySelectorAll('[data-w]').forEach(el => {
    el.style.width = el.dataset.w;
  });

  // Trend bars
  slide.querySelectorAll('[data-h]').forEach(el => {
    el.style.height = el.dataset.h;
  });
}

/* ── HELPERS ────────────────────────────────────────────────── */
function fmt(n)  { return n == null ? '—' : n.toLocaleString('es-CO'); }
function fmtPct(n) { return n == null ? '—' : n.toFixed(1).replace('.', ',') + ' %'; }
function badge(txt, type) { return `<span class="badge badge-${type}">${txt}</span>`; }

function pctBadge(pct) {
  if (pct == null) return badge('pend.', 'y');
  const cls = pct >= 100 ? 'g' : pct >= 85 ? 'y' : 'r';
  return badge(fmtPct(pct), cls);
}

/* ── RENDER FUNCTIONS ───────────────────────────────────────── */

// Called from HTML once DOM ready
window.renderSlides = function() {
  renderVentas();
  renderBases();
  renderCampanas();
  renderAsesores();
  renderIniciativas();
  renderContactab();
  renderTelefonia();
  renderDescarte();
  renderProyeccion();
  renderEstrategia();
  renderEvidencias();
};

/* Slide: Ventas (resultados 1S) */
function renderVentas() {
  const el = document.getElementById('ventas-body');
  if (!el) return;

  // KPIs (semestre completo ene–jun, liquidación de Martha ya integrada)
  const liqVals   = DATA.ventasLiq.filter(v => v != null);
  const totalLiq  = liqVals.reduce((a,b)=>a+b,0);
  const maxMes    = Math.max(...liqVals);
  const ultimoMes = liqVals[liqVals.length - 1];
  const totalOp   = DATA.ventasOp.reduce((a,b)=>a+b,0);
  const brecha    = Math.round((3000 - ultimoMes) / ultimoMes * 100);

  el.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Pólizas liquidadas (1S completo)</div>
        <div class="kpi-val">${fmt(totalLiq)}</div>
        <div class="kpi-sub">Liquidación Martha · cifra oficial ene–jun</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">Ventas 1S (operativo ene–jun)</div>
        <div class="kpi-val">${fmt(totalOp)}</div>
        <div class="kpi-sub">Promedio 1.858/mes</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Asesores en equipo</div>
        <div class="kpi-val">${DATA.asesores[0]} → ${Math.max(...DATA.asesores)} → ${DATA.asesores[DATA.asesores.length-1]}</div>
        <div class="kpi-sub">Ene · Pico (abr–may) · Jun</div>
      </div>
      <div class="kpi-card warn">
        <div class="kpi-label">Brecha vs. meta 3.000/mes</div>
        <div class="kpi-val">+${brecha} %</div>
        <div class="kpi-sub">Crecimiento necesario sobre junio (${fmt(ultimoMes)}) · mejor mes: ${fmt(maxMes)}</div>
      </div>
    </div>

    <div class="two-col">
      <div class="panel">
        <h3>📊 Pólizas vendidas vs. meta Escala 1</h3>
        <div class="tbl-wrap" style="margin-top:0">
          <table>
            <thead><tr>
              <th>Mes</th><th class="r">Pólizas</th><th class="r">Meta E1</th>
              <th class="r">Cumpli­miento</th><th class="r">Asesores</th>
            </tr></thead>
            <tbody>
              ${DATA.meses.map((m,i) => `
                <tr>
                  <td><strong>${m}</strong></td>
                  <td class="r">${fmt(DATA.ventasLiq[i])}</td>
                  <td class="r">${fmt(DATA.metaE1[i])}</td>
                  <td class="r">${pctBadge(DATA.cumplE1[i])}</td>
                  <td class="r">${DATA.asesores[i]}</td>
                </tr>`).join('')}
              <tr class="total">
                <td>Total</td>
                <td class="r">${fmt(totalLiq)}</td>
                <td class="r">${fmt(DATA.metaE1.reduce((a,b,i)=>a+(DATA.ventasLiq[i]!=null?b:0),0))}</td>
                <td class="r">—</td><td class="r">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel">
        <h3>📈 Evolución pólizas por mes</h3>
        <div class="chart-wrap" style="margin-top:8px">
          ${DATA.meses.map((m,i) => {
            const v = DATA.ventasLiq[i];
            if (v == null) return `
              <div class="bar-row">
                <span class="bar-label">${m}</span>
                <div class="bar-track">
                  <div class="bar-fill" data-w="4%" style="width:0; background:var(--gray2)">
                    <span class="bar-val" style="color:var(--gray3)">pend.</span>
                  </div>
                </div>
              </div>`;
            const pct  = (v / maxMes * 100).toFixed(1) + '%';
            return `
              <div class="bar-row">
                <span class="bar-label">${m}</span>
                <div class="bar-track">
                  <div class="bar-fill ${DATA.cumplE1[i]>=100?'teal':''}" data-w="${pct}" style="width:0">
                    <span class="bar-val">${fmt(v)}</span>
                  </div>
                </div>
              </div>`;
          }).join('')}
        </div>
        <div class="alert alert-info" style="margin-top:16px">
          <span class="ico">💡</span>
          <span>Abr–May: el equipo creció 33 % (15→20 asesores) para sostener una meta 27 % más alta (~2.580). La productividad individual bajó de 149,7 a 109,3 pólizas/asesor mientras el equipo nuevo se consolidaba — la curva de aprendizaje de esos ingresos es la oportunidad de mejora más clara para el 2S.</span>
        </div>
      </div>
    </div>`;
}

/* Slide: Bases recibidas */
function renderBases() {
  const el = document.getElementById('bases-body');
  if (!el) return;

  const totalRec = DATA.registros.reduce((a,b)=>a+b,0);
  const totalRech = DATA.rechazados.reduce((a,b)=>a+b,0);
  const pctRechProm = (totalRech/totalRec*100).toFixed(1);

  el.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Total registros recibidos (ene–jun)</div>
        <div class="kpi-val">${fmt(totalRec)}</div>
        <div class="kpi-sub">Fuente: dashboards Power BI</div>
      </div>
      <div class="kpi-card warn">
        <div class="kpi-label">Rechazo promedio de base</div>
        <div class="kpi-val">${pctRechProm.replace('.',',')} %</div>
        <div class="kpi-sub">Solo ${(100-parseFloat(pctRechProm)).toFixed(0)} % apto para gestión</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">Total aptos (gestionables)</div>
        <div class="kpi-val">${fmt(DATA.aptos.reduce((a,b)=>a+b,0))}</div>
        <div class="kpi-sub">De ${fmt(totalRec)} recibidos</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Ventas 1S (operativo)</div>
        <div class="kpi-val">11.146</div>
        <div class="kpi-sub">Promedio 1.858/mes · mejor mes feb (2.044)</div>
      </div>
    </div>

    <div class="tbl-wrap">
      <table>
        <thead><tr>
          <th>Mes</th>
          <th class="r">Recibidos</th>
          <th class="r">Rechazados</th>
          <th class="r">% Rechazo</th>
          <th class="r">Aptos</th>
        </tr></thead>
        <tbody>
          ${DATA.meses.map((m,i) => `
            <tr>
              <td><strong>${m}</strong></td>
              <td class="r">${fmt(DATA.registros[i])}</td>
              <td class="r">${fmt(DATA.rechazados[i])}</td>
              <td class="r">${badge(fmtPct(DATA.pctRechazo[i]), DATA.pctRechazo[i]>65?'r':DATA.pctRechazo[i]>50?'y':'g')}</td>
              <td class="r">${fmt(DATA.aptos[i])}</td>
            </tr>`).join('')}
          <tr class="total">
            <td>Total</td>
            <td class="r">${fmt(totalRec)}</td>
            <td class="r">${fmt(totalRech)}</td>
            <td class="r">${pctRechProm.replace('.',',')} %</td>
            <td class="r">${fmt(DATA.aptos.reduce((a,b)=>a+b,0))}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="alert alert-warn">
      <span class="ico">⚠️</span>
      <span><strong>Hallazgo clave:</strong> En el 2° trimestre el rechazo subió al 63–76 %. El 78 % del descarte del semestre es "registro enviado anteriormente" (49 %) + "producto ya activo" (29 %) → bases repetidas y clientes ya convertidos. No es un problema de calidad de datos, es un problema de depuración de origen.</span>
    </div>`;
}

/* Slide: Campañas */
function renderCampanas() {
  const el = document.getElementById('campanas-body');
  if (!el) return;

  const detalleSemestre = [
    { c: 'Bienvenidas CP',       reg: 114696, ventas: 6881, convSC: '19,5 %', perfil: 'g' },
    { c: 'Autogestión',          reg: 11686,  ventas: 791,  convSC: '26,6 %', perfil: 'g' },
    { c: 'CP Stock',             reg: 420641, ventas: 3073, convSC: '4,6 %',  perfil: 'r' },
    { c: 'Masiva Voluntarios',   reg: 255138, ventas: 318,  convSC: '1,9 %',  perfil: 'r' },
    { c: 'CP Clientes Satisf.*', reg: 108659, ventas: 79,   convSC: '1,2 %',  perfil: 'r' },
  ];

  el.innerHTML = `
    <div class="two-col">
      <div class="panel">
        <h3>🎯 Eficiencia por campaña (consolidado ene–jun)</h3>
        <div class="tbl-wrap" style="margin-top:0">
          <table>
            <thead><tr>
              <th>Campaña</th><th class="r">Registros</th>
              <th class="r">Ventas</th><th class="r">Conv./contacto</th>
            </tr></thead>
            <tbody>
              ${detalleSemestre.map(r=>`
                <tr>
                  <td>${badge(r.c, r.perfil)}</td>
                  <td class="r">${fmt(r.reg)}</td>
                  <td class="r"><strong>${fmt(r.ventas)}</strong></td>
                  <td class="r">${badge(r.convSC, r.perfil)}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div style="font-size:.6rem; color:var(--gray3); margin-top:4px">* Solo activa en enero (base de clientes satisfechos, campaña puntual, no recurrente).</div>
        <div class="alert alert-info" style="margin-top:10px">
          <span class="ico">💡</span>
          <span>En el semestre completo, "Bienvenidas Cuota Protegida" genera el 62 % de las ventas (6.881 de 11.146) con solo el 13 % de los registros.</span>
        </div>
      </div>

      <div class="panel">
        <h3>📋 Perfil de conversión por campaña</h3>
        ${CAMPANAS.map(c=>`
          <div class="bar-row" style="margin-bottom:14px; flex-direction:column; align-items:flex-start; gap:4px">
            <div style="font-size:.78rem; font-weight:700; color:var(--blue)">${c.nombre}</div>
            <div style="display:flex; gap:16px; font-size:.74rem; color:var(--gray3)">
              <span>Contactabilidad: <strong>${c.contactab}</strong></span>
              <span>Conversión: <strong style="color:${c.perfil==='Excelente'?'#008060':c.perfil==='Moderado'?'#8a6200':'#c44a1a'}">${c.conv}</strong></span>
              <span>${badge(c.perfil, c.perfil==='Excelente'?'g':c.perfil==='Moderado'?'y':'r')}</span>
            </div>
          </div>`).join('')}
        <div class="alert alert-warn" style="margin-top:8px">
          <span class="ico">🔴</span>
          <span>"Masiva Voluntarios" consume grandes volúmenes de base con conversión &lt;1 %. Revisar viabilidad.</span>
        </div>
      </div>
    </div>`;
}

/* Slide: Asesores — equipo completo con top 5 destacado */
function renderAsesores() {
  const el = document.getElementById('asesores-body');
  if (!el) return;

  const totalIncentExtras = INCENTIVOS_EXTRAS.reduce((s,d)=>s+d.total,0);
  const mesesLiq = ['Ene','Feb','Mar','Abr','May','Jun'];

  const filas = ASESORES.map((a, idx) => {
    const esTop = idx < 5;
    const total = a.meses.reduce((s,v)=>s+(v||0),0);
    const celdas = a.meses.map((v,i)=>{
      if (v == null) return `<td class="r" style="color:var(--gray2)">—</td>`;
      const meta = a.metas[i];
      const bajo = meta != null && v < meta;
      return `<td class="r" style="${bajo?'color:#c44a1a':''}">${v}</td>`;
    }).join('');
    return `
      <tr style="${esTop?'background:rgba(0,205,147,.10); font-weight:700':''}">
        <td class="r" style="color:var(--gray3)">${idx+1}</td>
        <td style="font-size:.66rem; white-space:nowrap">${esTop?'⭐ ':''}${a.nombre}</td>
        ${celdas}
        <td class="r"><strong>${fmt(total)}</strong></td>
        <td class="r">${a.metaJun!=null ? a.metaJun : '—'}</td>
      </tr>`;
  }).join('');

  el.innerHTML = `
    <div class="two-col" style="grid-template-columns:1.5fr 1fr">
      <div class="panel">
        <h3>👥 Equipo completo · pólizas liquidadas por mes (${ASESORES.length} asesores)</h3>
        <div class="tbl-wrap" style="margin-top:0; max-height:520px; overflow-y:auto">
          <table style="font-size:.66rem">
            <thead><tr>
              <th class="r">#</th><th>Asesor</th>
              ${mesesLiq.map(m=>`<th class="r">${m}</th>`).join('')}
              <th class="r">Total</th><th class="r">Meta Jun</th>
            </tr></thead>
            <tbody>${filas}</tbody>
          </table>
        </div>
        <div style="display:flex; gap:16px; margin-top:8px; font-size:.64rem; color:var(--gray3)">
          <span>⭐ Top 5 del semestre</span>
          <span style="color:#c44a1a">rojo = por debajo de la meta E1 del mes</span>
          <span>— = sin liquidación ese mes</span>
        </div>
      </div>

      <div class="panel" style="display:flex; flex-direction:column">
        <h3>📌 Lectura del equipo</h3>

        <!-- Sección: Roster por mes -->
        <div class="asesores-section">
          <div class="asesores-section-label">👥 Asesores activos por mes</div>
          <div style="display:flex; align-items:flex-end; gap:8px; flex-wrap:wrap">
            ${['Ene','Feb','Mar','Abr','May','Jun'].map((m,i)=>{
              const n = ROSTER.rosterPorMes[i];
              const fill = n >= 20 ? 'var(--teal)' : n >= 17 ? 'var(--blue)' : 'var(--gray2)';
              return `<div style="text-align:center">
                <div style="width:34px;height:34px;border-radius:9px;background:${fill};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.82rem;margin:0 auto 3px">${n}</div>
                <div style="font-size:.6rem;color:var(--gray3);font-weight:600">${m}</div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Sección: Hallazgo top 5 -->
        <div class="asesores-section">
          <div class="alert alert-info" style="margin:0">
            <span class="ico">⭐</span>
            <span>El top 5 aporta <strong>4.279 pólizas (37 %)</strong> del semestre y los 3 primeros recibieron <strong>meta premium (150)</strong> en junio. Jesús Cortés nunca bajó de 197.</span>
          </div>
        </div>

        <!-- Sección: Incentivos extras -->
        <div class="asesores-section" style="margin-bottom:0">
          <div class="asesores-section-label">💰 Incentivos extras pagados 1S</div>
          <div class="tbl-wrap" style="margin-top:0">
            <table style="font-size:.66rem">
              <thead><tr><th>Mes</th><th class="r">Eventos</th><th>Detalle</th></tr></thead>
              <tbody>
                ${INCENTIVOS_EXTRAS.map(ie=>`
                  <tr>
                    <td><strong>${ie.mes}</strong></td>
                    <td class="r">${ie.eventos}</td>
                    <td style="font-size:.62rem; color:var(--gray3)">${ie.nota}</td>
                  </tr>`).join('')}
                <tr class="total">
                  <td>Total</td>
                  <td class="r">${INCENTIVOS_EXTRAS.reduce((s,d)=>s+d.eventos,0)}</td>
                  <td style="font-size:.62rem">41 eventos de incentivo en el semestre</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;
}

/* ── Datos reales de Martha (respuestasmatha.md) ─────────────────────
   Iniciativas comerciales del 1S, etiquetadas por quién las impulsó
   (Vanti/Xuma) — Orlando pidió verlo separado. */
const INICIATIVAS_1S = [
  { nombre: 'Semanas Ganadoras', origen: 'Vanti', mes: 'Enero', ventas: 1292, meta: 950,
    nota: 'Meta por trío y gasera (LIQUIDACIÓN ACELERADOR ENERO.xlsx): 5 tríos/semana × meta combinada por gasera (Vanti/Cundi/Oriente/Nacer) ≈ 950 pólizas totales → 1.292 logradas (136 %). 3 semanas: 340 + 409 + 543. Premio: bono $100K/semana por trío según cumplimiento.' },
  { nombre: 'Semana Burger', origen: 'Xuma', mes: 'Febrero', ventas: 659, meta: 600,
    nota: 'Meta semanal de 600 ventas (9–14 feb) → 659 logradas (110 %).' },
  { nombre: 'La Gran Jugada', origen: 'Vanti', mes: 'Mar–Abr', ventas: 4798, meta: 4200,
    nota: 'Meta de 4.200 pólizas positivas en 2 meses → 4.798 (114 %). Premio: $7.000.000 al equipo.' },
  { nombre: 'Semana Burger', origen: 'Xuma', mes: 'Abril', ventas: 607, meta: 600,
    nota: 'Segunda edición: meta 600 → 607 ventas (101 %).' },
  { nombre: 'Feria Vanti', origen: 'Xuma', mes: 'Abril', ventas: 517, meta: 500,
    nota: 'KPI de 12 ventas/día por asesor para participar del premio; meta 500 → 517 ventas en 4 días (103 %).' },
  { nombre: 'Feria Vanti', origen: 'Xuma', mes: 'Mayo', ventas: 556, meta: 500,
    nota: 'Meta semanal 500 (23–28 may) → 556 logradas, con KPI diario por asesor.' },
  { nombre: 'Feria Mundialista', origen: 'Xuma', mes: 'Junio', ventas: 1520, meta: 1200,
    nota: 'KPI de 9 ventas/día para participar del premio (16–30 jun); meta 1.200 → 1.520 ventas en 2 semanas (127 %).' },
];

/* Sin fotos reales de las capacitaciones (solo existen fotos de las campañas
   comerciales, ya usadas en "Evidencias"). Cada tema lleva un ícono representativo
   de su contenido — no es una foto del evento, es una identidad visual por tema. */
const CAPACITACIONES_1S = [
  { tema: 'Socialización y Alineación de Estándares de Calidad Comercial', mes: 'Ene', ico: '🧭' },
  { tema: 'Estandarización del Protocolo de Cierre Comercial ("Gracias por la información")', mes: 'Feb', ico: '🤝' },
  { tema: 'Fortalecimiento de Conocimientos del Producto Cuota Protegida', mes: 'Feb', ico: '🛡️' },
  { tema: 'Aplicación Correcta de la Cláusula de Cobro y Autorizaciones', mes: 'Mar', ico: '📄' },
  { tema: 'Implementación de Herramientas de Apoyo para la Gestión Comercial', mes: 'Abr', ico: '🛠️' },
  { tema: 'Estandarización del Guion Comercial Aprobado', mes: 'Abr', ico: '📜' },
  { tema: 'Actualización Comercial del Producto Plan Combo Vida', mes: 'May', ico: '❤️' },
  { tema: 'Técnicas Efectivas para el Manejo de Objeciones Comerciales', mes: 'May', ico: '🎯' },
  { tema: 'Lineamientos para la Correcta Aplicación del Guion Comercial y Control de Modificaciones', mes: 'May', ico: '📋' },
  { tema: 'Fortalecimiento del Cumplimiento de los Lineamientos Operativos y de Calidad', mes: 'Jun', ico: '✅' },
];

function renderIniciativas() {
  const el = document.getElementById('iniciativas-body');
  if (!el) return;

  const totalCampanas = INICIATIVAS_1S.reduce((s,i)=>s+i.ventas,0);
  const nVanti = INICIATIVAS_1S.filter(i=>i.origen==='Vanti').length;
  const nXuma  = INICIATIVAS_1S.filter(i=>i.origen==='Xuma').length;

  el.innerHTML = `
    <div class="panel">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px">
        <h3 style="margin:0; border:none; padding:0">🚀 Lo ejecutado en el 1S, según Martha Carvajal</h3>
        <div class="strategy-tabs">
          <button class="strategy-tab active" data-tab="niniciativas" onclick="iniciativasTab('niniciativas')">🎯 Iniciativas</button>
          <button class="strategy-tab" data-tab="ncap" onclick="iniciativasTab('ncap')">🎓 Capacitaciones</button>
          <button class="strategy-tab" data-tab="nproc" onclick="iniciativasTab('nproc')">🔍 Monitoreo y procesos</button>
        </div>
      </div>

      <!-- TAB: Iniciativas comerciales Vanti/Xuma -->
      <div class="strategy-pane active" id="pane-niniciativas">
        <div class="kpi-grid" style="margin-bottom:12px">
          <div class="kpi-card">
            <div class="kpi-label">Ventas en campañas del 1S</div>
            <div class="kpi-val">${fmt(totalCampanas)}</div>
            <div class="kpi-sub">7 iniciativas comerciales ejecutadas</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Impulsadas por Vanti</div>
            <div class="kpi-val">${nVanti}</div>
            <div class="kpi-sub">Semanas Ganadoras · La Gran Jugada</div>
          </div>
          <div class="kpi-card green">
            <div class="kpi-label">Impulsadas por Xuma</div>
            <div class="kpi-val">${nXuma}</div>
            <div class="kpi-sub">Semana Burger ×2 · Feria Vanti ×2 · Mundialista</div>
          </div>
        </div>
        <div class="mini-grid mini-grid-3">
          ${INICIATIVAS_1S.map((i,idx)=>{
            const cumpl = i.meta ? Math.round(i.ventas/i.meta*100) : null;
            return `
            <div class="mini-card" onclick="toggleCard('ini2-detalle-${idx}','ini2-chevron-${idx}')">
              <div class="mini-card-top">
                <span class="badge ${i.origen==='Vanti'?'badge-y':'badge-g'}" style="font-size:.6rem">${i.origen}</span>
                <span style="font-size:.62rem; color:var(--gray3)">${i.mes}</span>
              </div>
              <div class="mini-card-title">${i.nombre}</div>
              <div class="mini-card-stat">
                <strong>${fmt(i.ventas)}</strong>${i.meta?` <span style="color:var(--gray3); font-weight:500">/ ${fmt(i.meta)}</span>`:''}
                ${cumpl?badge(cumpl+' %', cumpl>=100?'g':'y'):''}
              </div>
              <div class="ini-detalle" id="ini2-detalle-${idx}" style="padding-left:0; padding-right:0">${i.nota}</div>
              <div class="mini-card-more" id="ini2-chevron-${idx}">Ver detalle ▾</div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- TAB: Capacitaciones (agrupadas por mes) -->
      <div class="strategy-pane" id="pane-ncap">
        <div class="alert alert-info" style="margin-bottom:10px">
          <span class="ico">🎓</span>
          <span><strong>10 capacitaciones</strong> ejecutadas por Xuma durante el semestre — al menos una por mes. Sin fotos del evento: el ícono representa el tema de cada una.</span>
        </div>
        <div class="cap-months">
          ${['Ene','Feb','Mar','Abr','May','Jun'].map(mes=>{
            const items = CAPACITACIONES_1S.filter(c=>c.mes===mes);
            if (!items.length) return '';
            return `
            <div class="cap-month-group">
              <div class="cap-month-tag">${mes} <span>· ${items.length}</span></div>
              <div class="cap-grid">
                ${items.map(c=>`
                  <div class="cap-card">
                    <span class="cap-ico">${c.ico}</span>
                    <span class="cap-tema">${c.tema}</span>
                  </div>`).join('')}
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>

      <!-- TAB: Monitoreo y cambios de proceso -->
      <div class="strategy-pane" id="pane-nproc">
        <div class="two-col">
          <div>
            <div class="asesores-section-label">🔍 Monitoreo y acompañamiento</div>
            <div style="display:flex; flex-direction:column; gap:6px">
              ${[
                ['📞','Monitoreo semanal en vivo','Objeciones, tipificación y corrección inmediata','Se revisa en vivo cómo el asesor debate objeciones, si tipifica correctamente y se corrigen errores al momento.'],
                ['🔁','Monitoreos ocasionales','Contrastan tipificación vs. la llamada real','Auditorías puntuales en algunos meses para verificar que la tipificación registrada coincida con lo que pasó en la llamada.'],
                ['🧯','Kit de emergencia','Manual de objeciones desde "no interesado"','Se revisan las llamadas tipificadas "no interesado" para nutrir un manual de objeciones que guía al asesor hacia el cierre.'],
                ['📊','Revisión semanal por asesor','Avance, proyección y KPI faltante','Seguimiento individual: cómo va cada asesor, a qué % se proyecta y qué le falta para su meta.'],
              ].map((it,idx)=>`
                <div class="ini-card" onclick="toggleCard('mon-detalle-${idx}','mon-chevron-${idx}')">
                  <div class="ini-head">
                    <span class="ini-ico" style="background:rgba(18,1,128,.1); color:var(--blue)">${it[0]}</span>
                    <div style="flex:1; min-width:0">
                      <div class="ini-title" style="font-size:.76rem">${it[1]}</div>
                      <div class="ini-resumen">${it[2]}</div>
                    </div>
                    <span class="ini-chevron" id="mon-chevron-${idx}" data-chevron="1">▾</span>
                  </div>
                  <div class="ini-detalle" id="mon-detalle-${idx}">${it[3]}</div>
                </div>`).join('')}
            </div>
          </div>
          <div>
            <div class="asesores-section-label" style="color:var(--teal)">⚙️ Cambios de proceso (Xuma)</div>
            <div style="display:flex; flex-direction:column; gap:6px">
              ${[
                ['⏳','Exclusiones del seguro','Menor carencia + coberturas adicionales','Se ajustaron las exclusiones dando más beneficios y menor tiempo de carencia, con el guion actualizado para incorporar la nueva asistencia.'],
                ['👋','Bienvenida autogestión','Trato preferencial y medición de experiencia','Bienvenida exclusiva para clientes que obtuvieron el crédito por autogestión, conociendo cómo perciben esta nueva forma de crédito.'],
                ['🗣️','Frase de aclaración obligatoria','El asesor deja explícito que es un seguro','Cuando el usuario cree que es solo información, el asesor debe aclarar que se está ofreciendo un seguro, para una venta más transparente.'],
                ['🎯','Segmentación y contactabilidad','Por localidad/edad + control de spam/DID','Cargues priorizados según mayor presencia de ventas por localidad o edad, y barrido de contactos sin respuesta más cambio de DID si el número marca como spam.'],
              ].map((it,idx)=>`
                <div class="ini-card" onclick="toggleCard('proc-detalle-${idx}','proc-chevron-${idx}')">
                  <div class="ini-head">
                    <span class="ini-ico" style="background:rgba(0,205,147,.12); color:var(--teal)">${it[0]}</span>
                    <div style="flex:1; min-width:0">
                      <div class="ini-title" style="font-size:.76rem">${it[1]}</div>
                      <div class="ini-resumen">${it[2]}</div>
                    </div>
                    <span class="ini-chevron" id="proc-chevron-${idx}" data-chevron="1">▾</span>
                  </div>
                  <div class="ini-detalle" id="proc-detalle-${idx}">${it[3]}</div>
                </div>`).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>`;
}

function iniciativasTab(name) {
  document.querySelectorAll('#slide-iniciativas .strategy-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('#slide-iniciativas .strategy-pane').forEach(p => p.classList.remove('active'));
  document.getElementById(`pane-${name}`).classList.add('active');
}

/* Toggle genérico para tarjetas expandibles (id de detalle + id del texto "ver más") */
function toggleCard(detId, moreId) {
  const det = document.getElementById(detId);
  const more = document.getElementById(moreId);
  if (!det) return;
  const open = det.classList.toggle('open');
  if (more) more.textContent = (more.dataset.chevron !== undefined)
    ? (open ? '▴' : '▾')
    : (open ? 'Ver menos ▴' : 'Ver detalle ▾');
}

/* Slide: Contactabilidad */
function renderContactab() {
  const el = document.getElementById('contactab-body');
  if (!el) return;

  el.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card green">
        <div class="kpi-label">Contactabilidad promedio (1S)</div>
        <div class="kpi-val">40,4 %</div>
        <div class="kpi-sub">129.696 contactos en el semestre</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">Pico: mayo</div>
        <div class="kpi-val">63,8 %</div>
        <div class="kpi-sub">Jun: 49,1 % (con +15 % de volumen gestionado)</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Efectividad prom./contacto</div>
        <div class="kpi-val">8,6 %</div>
        <div class="kpi-sub">Promedio ene–jun (estable 6,7–10,3 %)</div>
      </div>
      <div class="kpi-card warn">
        <div class="kpi-label">Contestador (semestre)</div>
        <div class="kpi-val">~54 %</div>
        <div class="kpi-sub">Principal causa de no contacto</div>
      </div>
    </div>

    <div class="two-col">
      <div class="panel">
        <h3>📞 Contactabilidad por mes</h3>
        <div class="chart-wrap">
          ${DATA.meses.map((m,i)=>{
            const pct = DATA.contactabilidad[i].toFixed(0)+'%';
            return `
              <div class="bar-row">
                <span class="bar-label">${m}</span>
                <div class="bar-track">
                  <div class="bar-fill teal" data-w="${pct}" style="width:0">
                    <span class="bar-val">${DATA.contactabilidad[i].toFixed(1).replace('.',',')} %</span>
                  </div>
                </div>
              </div>`;
          }).join('')}
        </div>
      </div>

      <div class="panel">
        <h3>💡 Efectividad sobre contactados</h3>
        <div class="tbl-wrap" style="margin-top:0">
          <table>
            <thead><tr>
              <th>Mes</th><th class="r">Contactados</th>
              <th class="r">Ventas</th><th class="r">Efect.</th>
            </tr></thead>
            <tbody>
              ${DATA.meses.map((m,i)=>`
                <tr>
                  <td><strong>${m}</strong></td>
                  <td class="r">${fmt(DATA.contactados[i])}</td>
                  <td class="r">${fmt(DATA.ventasOp[i])}</td>
                  <td class="r">${badge(fmtPct(DATA.efectividad[i]), DATA.efectividad[i]>=9?'g':DATA.efectividad[i]>=7?'y':'r')}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="alert alert-info" style="margin-top:12px">
          <span class="ico">📌</span>
          <span>La mejora en contactabilidad es la mayor palanca disponible: pasar de 20 % (ene) a 64 % (may) <em>sin cambiar la base</em> generó +21 % más ventas. <strong>Oportunidad detectada (Isaac):</strong> aún no existe análisis por franja horaria — tablero propuesto para el 2S.</span>
        </div>
      </div>
    </div>

    <div class="panel">
      <h3>🔗 Cruce con campañas: el mix explica gran parte de la mejora</h3>
      <div class="tbl-wrap" style="margin-top:0">
        <table style="font-size:.78rem">
          <thead><tr>
            <th>Campaña</th><th class="r">Contactabilidad</th>
            <th class="r">Conv./contacto</th><th class="r">Perfil</th>
          </tr></thead>
          <tbody>
            ${CAMPANAS.map(c=>`
              <tr>
                <td><strong>${c.nombre}</strong></td>
                <td class="r">${badge(c.contactab, c.perfil==='Excelente'?'g':c.perfil==='Moderado'?'y':'r')}</td>
                <td class="r">${c.conv}</td>
                <td class="r">${badge(c.perfil, c.perfil==='Excelente'?'g':c.perfil==='Moderado'?'y':'r')}</td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
      <div class="alert alert-info" style="margin-top:10px">
        <span class="ico">💡</span>
        <span>No es solo el calendario: la contactabilidad global sube o baja según <strong>qué campaña domina la base ese mes</strong>. Bienvenidas CP (79 %) y Autogestión (71 %) contactan mucho mejor que Masiva Voluntarios (17 %) porque son bases más "tibias" (clientes recién vinculados o autogestionados), no números fríos re-marcados. Detalle completo por campaña en la slide "Campañas".</span>
      </div>
    </div>`;
}

/* Slide: Infraestructura telefónica Tigo vs. Movistar
   Fuente: reporte_contactabilidad.md (628.406 llamadas, 3,01 M logs OCM),
   cruzado con los indicadores operativos del semestre (Manager Performance). */
function renderTelefonia() {
  const el = document.getElementById('telefonia-body');
  if (!el) return;

  const OPS = [
    { op: 'Tigo', tag: 'principal', llamadas: 173548, contactos: 123243, contactab: 71.0, caidas: 1.3, ventas: 2426, cls: 'teal' },
    { op: 'Movistar', tag: 'backup', llamadas: 448057, contactos: 114901, contactab: 25.6, caidas: 15.1, ventas: 6370, cls: 'warn' },
  ];
  el.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Llamadas analizadas</div>
        <div class="kpi-val">628.406</div>
        <div class="kpi-sub">13.516 teléfonos · 972 barrios de Bogotá</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">Contactabilidad telefónica</div>
        <div class="kpi-val">38,9 %</div>
        <div class="kpi-sub">Consistente con el 40,4 % operativo del 1S</div>
      </div>
      <div class="kpi-card warn">
        <div class="kpi-label">Caídas de troncal</div>
        <div class="kpi-val">69.740</div>
        <div class="kpi-sub">11,1 % de las llamadas se pierden por infraestructura</div>
      </div>
      <div class="kpi-card warn">
        <div class="kpi-label">Fallas de red Movistar</div>
        <div class="kpi-val">17,1 %</div>
        <div class="kpi-sub">Congestión 9,96 % + rechazo 7,13 % (Tigo: 0,86 %)</div>
      </div>
    </div>

    <div class="two-col">
      <div class="panel">
        <h3>📡 Tigo vs. Movistar · volumen, contacto y caídas</h3>
        <div style="display:flex; flex-direction:column; gap:16px; margin-top:4px">
          ${OPS.map(o=>`
            <div>
              <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:5px">
                <span style="font-weight:800; font-size:.86rem; color:var(--blue)">${o.op} <span style="font-weight:600; font-size:.66rem; color:var(--gray3); text-transform:uppercase">(${o.tag})</span></span>
                <span style="font-size:.68rem; color:var(--gray3)">${fmt(o.llamadas)} llamadas</span>
              </div>
              <div class="bar-row" style="margin-bottom:5px">
                <span class="bar-label" style="width:78px">Contacto</span>
                <div class="bar-track">
                  <div class="bar-fill ${o.cls==='teal'?'teal':''}" data-w="${o.contactab}%" style="width:0; ${o.cls==='warn'?'background:linear-gradient(90deg,#e05320,#ff6b35)':''}">
                    <span class="bar-val">${o.contactab.toFixed(1).replace('.',',')} %</span>
                  </div>
                </div>
              </div>
              <div class="bar-row">
                <span class="bar-label" style="width:78px">Caídas red</span>
                <div class="bar-track">
                  <div class="bar-fill" data-w="${Math.max(o.caidas,4)}%" style="width:0; background:${o.caidas>5?'linear-gradient(90deg,#c0392b,#e05320)':'linear-gradient(90deg,var(--teal),var(--green))'}">
                    <span class="bar-val">${o.caidas.toFixed(1).replace('.',',')} %</span>
                  </div>
                </div>
              </div>
            </div>`).join('')}
        </div>
        <div class="alert alert-warn" style="margin-top:14px">
          <span class="ico">🔴</span>
          <span>El <strong>backup (Movistar) carga el 71 % del tráfico</strong> con la peor red: pierde 17 de cada 100 llamadas por congestión o rechazo de troncal, frente a 0,86 % en Tigo.</span>
        </div>
      </div>

      <div class="panel">
        <h3>🔗 Potencial de recuperación (si las caídas se cursan por Tigo)</h3>
        <div style="display:flex; align-items:stretch; gap:8px; margin:10px 0 6px">
          ${[
            ['Hoy', '69.740', 'caídas de troncal (backup Movistar)'],
            ['Recuperable', '≈ 49.500', 'contactos, a la tasa de Tigo (71 %)'],
            ['Potencial', '≈ 4.200', 'ventas, a la efectividad histórica (8,6 %)'],
          ].map(([paso, cifra, det], i)=>`
            ${i>0?'<div style="align-self:center; color:var(--teal); font-weight:800; font-size:1.2rem; flex-shrink:0">→</div>':''}
            <div style="flex:1; display:flex; flex-direction:column; justify-content:center; background:rgba(0,205,147,.07); border:1px solid rgba(0,205,147,.3); border-radius:10px; padding:10px 8px; text-align:center; min-height:86px">
              <div style="font-size:.6rem; font-weight:800; color:var(--teal); letter-spacing:.05em; text-transform:uppercase; margin-bottom:3px">${paso}</div>
              <div style="font-size:1.1rem; font-weight:800; color:var(--blue); line-height:1; margin-bottom:4px">${cifra}</div>
              <div style="font-size:.6rem; color:var(--gray3); line-height:1.35">${det}</div>
            </div>`).join('')}
        </div>
        <div style="font-size:.6rem; color:var(--gray3); text-align:center; margin-bottom:10px">Estimación con la efectividad del semestre; validar con Isaac el período de la muestra.</div>

        <div class="alert alert-info" style="margin-bottom:0">
          <span class="ico">📌</span>
          <span>El "no contacto" operativo (59,9 % del gestionado) tiene causa técnica: parte son llamadas que <strong>nunca se cursaron</strong> por fallas de red — el mismo insumo que luego se descarta como "re-enviado".</span>
        </div>

        <div style="margin-top:12px">
          <div style="font-size:.68rem; font-weight:800; color:var(--blue); letter-spacing:.06em; margin-bottom:6px">📋 ACCIONES PROPUESTAS (frente tecnológico 2S)</div>
          <ul class="check-list" style="gap:5px">
            <li style="font-size:.72rem">Rebalancear troncales hacia Tigo en zonas periféricas (San Cristóbal, Ciudad Bolívar)</li>
            <li style="font-size:.72rem">Auditoría formal a Movistar: códigos 34 (congestión) y 21 (rechazo)</li>
            <li style="font-size:.72rem">Enrutamiento dinámico: salida obligada por Tigo donde Movistar falla &gt;17 %</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="panel">
      <h3>📍 Zonas críticas de Bogotá · fallas de red por barrio</h3>
      <div class="two-col" style="gap:16px">
        <div>
          <div style="font-size:.72rem; font-weight:800; color:var(--blue); margin-bottom:6px">San Cristóbal — 32.619 llamadas <span style="font-weight:600; color:var(--gray3)">(Tigo 71,9 % contacto · Movistar 24,1 % contacto)</span></div>
          <div class="tbl-wrap" style="margin-top:0">
            <table style="font-size:.7rem">
              <thead><tr><th>Barrio</th><th class="r">Llam.</th><th class="r">Tigo caída</th><th class="r">Movistar caída</th></tr></thead>
              <tbody>
                <tr><td>La Gloria Occidental</td><td class="r">3.346</td><td class="r">4,1 %</td><td class="r">${badge('15,6 %','r')}</td></tr>
                <tr><td>Bello Horizonte</td><td class="r">2.384</td><td class="r">0,3 %</td><td class="r">${badge('17,6 %','r')}</td></tr>
                <tr><td>Calvo Sur</td><td class="r">1.021</td><td class="r">1,3 %</td><td class="r">${badge('19,0 %','r')}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <div style="font-size:.72rem; font-weight:800; color:var(--blue); margin-bottom:6px">Ciudad Bolívar — 28.819 llamadas <span style="font-weight:600; color:var(--gray3)">(Tigo 72,4 % contacto · Movistar 25,7 % contacto)</span></div>
          <div class="tbl-wrap" style="margin-top:0">
            <table style="font-size:.7rem">
              <thead><tr><th>Barrio</th><th class="r">Llam.</th><th class="r">Tigo caída</th><th class="r">Movistar caída</th></tr></thead>
              <tbody>
                <tr><td>Arborizadora Alta</td><td class="r">4.546</td><td class="r">1,4 %</td><td class="r">${badge('15,0 %','r')}</td></tr>
                <tr><td>El Mochuelo</td><td class="r">531</td><td class="r">1,4 %</td><td class="r">${badge('20,9 %','r')}</td></tr>
                <tr><td>El Tesoro</td><td class="r">566</td><td class="r">0,0 %</td><td class="r">${badge('19,4 %','r')}</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;
}

/* Slide: Descarte */
function renderDescarte() {
  const el = document.getElementById('descarte-body');
  if (!el) return;

  el.innerHTML = `
    <div class="two-col">
      <div class="panel">
        <h3>🚫 Motivos de rechazo de base (semestre ene–jun)</h3>
        <div class="chart-wrap">
          ${DESCARTE_MOTIVOS.map(d=>`
            <div class="bar-row">
              <span class="bar-label" style="width:160px; font-size:.68rem">${d.motivo}</span>
              <div class="bar-track">
                <div class="bar-fill warn" data-w="${d.pct}%" style="width:0; background:linear-gradient(90deg,#e05320,#ff6b35)">
                  <span class="bar-val">${d.pct} %</span>
                </div>
              </div>
            </div>`).join('')}
        </div>
        <div class="alert alert-warn" style="margin-top:16px">
          <span class="ico">🔴</span>
          <span>El 78 % del descarte es estructural: bases repetidas + producto activo. <strong>Isaac lo confirma:</strong> se gestionan registros contingentes por falta de insumo oportuno, y al llegar el insumo real la mayoría ya tiene el producto o fue re-enviada en el mismo período (&lt;1 mes).</span>
        </div>
      </div>

      <div class="panel">
        <h3>📆 Evolución del rechazo de base</h3>
        <div class="tbl-wrap" style="margin-top:0">
          <table>
            <thead><tr>
              <th>Mes</th><th class="r">Recibidos</th>
              <th class="r">Rechazados</th><th class="r">% Rechazo</th>
            </tr></thead>
            <tbody>
              ${DATA.meses.map((m,i)=>`
                <tr>
                  <td><strong>${m}</strong></td>
                  <td class="r">${fmt(DATA.registros[i])}</td>
                  <td class="r">${fmt(DATA.rechazados[i])}</td>
                  <td class="r">${badge(fmtPct(DATA.pctRechazo[i]), DATA.pctRechazo[i]>65?'r':DATA.pctRechazo[i]>50?'y':'g')}</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
        <div class="panel" style="margin-top:14px; border-left:4px solid var(--teal); padding:14px 16px; box-shadow:none">
          <h3 style="border:none; padding:0; margin-bottom:8px; color:var(--teal)">💡 Recomendaciones de mejora</h3>
          <ul class="check-list">
            <li>Implementar deduplicación de contratos antes del envío de la base</li>
            <li>Excluir automáticamente clientes con producto activo (CP / Microseguro)</li>
            <li>Añadir campo "último envío" para evitar reenvío en ≤90 días</li>
            <li>Priorizar campañas "Bienvenidas CP" sobre "Masiva Voluntarios"</li>
          </ul>
        </div>
      </div>
    </div>`;
}

/* Slide: Proyección 3.000 ventas/mes */
function renderProyeccion() {
  const el = document.getElementById('proyeccion-body');
  if (!el) return;

  const totalEquipoJun = 18; // metas diferenciadas ya en archivo
  const metaAgregJun   = METAS_JUN.reduce((s,a)=>s+a.e1,0);

  el.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Meta mensual objetivo</div>
        <div class="kpi-val">3.000</div>
        <div class="kpi-sub">Pólizas / mes</div>
      </div>
      <div class="kpi-card warn">
        <div class="kpi-label">Registros requeridos (estimado)</div>
        <div class="kpi-val">~245K</div>
        <div class="kpi-sub">Con indicadores históricos ene–jun</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">Palanca principal</div>
        <div class="kpi-val">Base limpia</div>
        <div class="kpi-sub">Reducir rechazo del 60 % del semestre</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Meta agregada equipo Jun</div>
        <div class="kpi-val">${fmt(metaAgregJun)}</div>
        <div class="kpi-sub">${totalEquipoJun} asesores activos · E1 diferenciada</div>
      </div>
    </div>

    <div class="two-col">
      <div class="panel">
        <h3>🧮 Cálculo con indicadores históricos (semestre ene–jun)</h3>
        <div class="tbl-wrap" style="margin-top:0">
          <table>
            <thead><tr><th>Parámetro</th><th class="r">Valor histórico</th><th class="r">Insumo para 3.000</th></tr></thead>
            <tbody>
              <tr><td>Meta ventas/mes</td><td class="r">—</td><td class="r"><strong>3.000</strong></td></tr>
              <tr><td>Efectividad / contactados</td><td class="r">8,59 %</td><td class="r">÷ 8,59 % = <strong>34.908</strong> contactos</td></tr>
              <tr><td>Contactabilidad</td><td class="r">40,4 %</td><td class="r">÷ 40,4 % = <strong>86.427</strong> gestionados</td></tr>
              <tr><td>% Gestión sobre aptos</td><td class="r">88,3 %</td><td class="r">÷ 88,3 % = <strong>97.902</strong> aptos</td></tr>
              <tr><td>% Aptos (1–rechazo)</td><td class="r">39,9 %</td><td class="r">÷ 39,9 % = <strong>~245.500</strong> recibidos</td></tr>
              <tr class="total"><td colspan="2">📦 Registros mínimos requeridos/mes</td><td class="r">235.000–260.000</td></tr>
            </tbody>
          </table>
        </div>

        <!-- ESQUEMA DE COMISIONES RESUMEN -->
        <div style="margin-top:14px">
          <div style="font-size:.72rem; font-weight:800; color:var(--blue); letter-spacing:.06em; margin-bottom:8px">ESQUEMA COMISIONES 1S — EVOLUCIÓN</div>
          <div style="display:flex; flex-direction:column; gap:4px">
            ${ESQUEMA_MESES.map(e=>{
              const hasVolante = e.volante ? `<span style="color:var(--teal);font-weight:700"> + Volante ${e.volante} pól.</span>` : '';
              const bgCol = e.novedades.includes('sube')||e.novedades.includes('diferenciadas')||e.novedades.includes('Volante') ? 'rgba(0,205,147,.08)' : 'transparent';
              return `<div style="display:flex;gap:8px;align-items:baseline;font-size:.71rem;padding:3px 6px;border-radius:6px;background:${bgCol}">
                <span style="font-weight:800;color:var(--blue);min-width:28px">${e.mes}</span>
                <span>E1 <strong>${e.e1meta}</strong> pol. con bonificación base${hasVolante}</span>
                ${e.novedades!=='Sin cambios'?`<span style="color:var(--gray3);font-style:italic;font-size:.66rem">← ${e.novedades}</span>`:''}
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>

      <div class="panel">
        <h3>🚀 Escenario con base depurada (recomendado)</h3>

        <!-- Flujo de 3 pasos -->
        <div style="display:flex; align-items:stretch; gap:8px; margin:12px 0">
          ${[
            ['Paso 1 · Depurar', '60 % → 35 %', 'de rechazo, excluyendo re-envíos y producto activo'],
            ['Paso 2 · Aptos', '64K → 110K', 'registros aptos/mes con los mismos ~170K recibidos'],
            ['Paso 3 · Ventas', '≈ 3.760', 'ventas/mes potenciales — supera la meta de 3.000'],
          ].map(([paso, cifra, det], i)=>`
            ${i>0?'<div style="align-self:center; color:var(--teal); font-weight:800; font-size:1.2rem; flex-shrink:0">→</div>':''}
            <div style="flex:1; display:flex; flex-direction:column; justify-content:center; background:rgba(0,205,147,.07); border:1px solid rgba(0,205,147,.3); border-radius:10px; padding:12px 10px; text-align:center; min-height:96px">
              <div style="font-size:.62rem; font-weight:800; color:var(--teal); letter-spacing:.05em; text-transform:uppercase; margin-bottom:4px">${paso}</div>
              <div style="font-size:1.15rem; font-weight:800; color:var(--blue); line-height:1; margin-bottom:5px">${cifra}</div>
              <div style="font-size:.62rem; color:var(--gray3); line-height:1.4">${det}</div>
            </div>`).join('')}
        </div>
        <div style="font-size:.64rem; color:var(--gray3); text-align:center; margin-bottom:10px">Premisas del cálculo: 88 % gestión · 45 % contactabilidad · 8,6 % conversión (históricos 1S)</div>

        <!-- Notas complementarias -->
        <ul class="check-list" style="gap:6px">
          <li style="font-size:.72rem"><strong>Validado por Isaac:</strong> la deduplicación en origen es viable (registro del distribuidor + validación de fuentes). Su meta de corto plazo: rechazo <strong>≤ 50 %</strong> como escalón intermedio hacia el 35 %.</li>
          <li style="font-size:.72rem">Priorizar <strong>Bienvenidas CP</strong> y <strong>Autogestión</strong> (conversión 17–33 % sobre contacto) reduce el volumen necesario a la mitad.</li>
          <li style="font-size:.72rem">Capacidad del equipo: meta agregada jun = <strong>${fmt(metaAgregJun)} pólizas</strong> (${totalEquipoJun} asesores, ${Math.round(metaAgregJun/totalEquipoJun)} pol/asesor). Para 3.000 → <strong>~150 pol/asesor con 20 asesores</strong>.</li>
        </ul>

        <!-- KPIs propuestos 2S -->
        <div style="margin-top:12px">
          <div style="font-size:.68rem; font-weight:800; color:var(--blue); letter-spacing:.06em; margin-bottom:6px">📏 KPIs PROPUESTOS PARA EL SEGUIMIENTO 2S</div>
          <div class="tbl-wrap" style="margin-top:0">
            <table style="font-size:.68rem">
              <thead><tr><th>KPI</th><th>Fórmula</th><th class="r">Meta 2S</th></tr></thead>
              <tbody>
                ${[
                  ['Pólizas equipo/mes', 'Total ventas (liquidación)', '≥ 3.000 (dic)'],
                  ['Cumplimiento E1',    'Asesores ≥ meta / total',    '≥ 90 %'],
                  ['Productividad',      'Pólizas / asesor activo',    '≥ 140'],
                  ['% Rechazo base',     'Rechazados / recibidos',     '< 40 %'],
                  ['Contactabilidad',    'Contactados / gestionados',  '≥ 55 %'],
                ].map(([kpi,formula,meta])=>`
                  <tr>
                    <td><strong>${kpi}</strong></td>
                    <td style="color:var(--gray3)">${formula}</td>
                    <td class="r"><strong style="color:var(--teal)">${meta}</strong></td>
                  </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="alert alert-info" style="margin-top:12px">
          <span class="ico">📌</span>
          <span>El camino a 3.000 pasa más por <strong>calidad y depuración de base</strong> que por aumentar el volumen bruto de registros. Cálculo con semestre completo (ene–jun); falta solo la liquidación de junio.</span>
        </div>
      </div>
    </div>`;
}

/* Slide: Estrategia 2S */
const ESTRATEGIA_INICIATIVAS = [
  { color: 'teal', ico: '🎓', titulo: 'School Master Comercial', resumen: 'Acompañamiento 1-a-1 para baja conversión en CP.',
    detalle: 'Diagnóstico individual de dificultades, talleres guiados en la Universidad ILAO y seguimiento cercano por asesor.' },
  { color: 'blue', ico: '🏆', titulo: 'Modelado de Top Performers', resumen: 'Replicar las técnicas de Jesús, Melissa y Luisa.',
    detalle: 'Documentar sus argumentos de manejo de objeciones y transferir esas habilidades al resto del equipo vía sesiones cortas.' },
  { color: 'warn', ico: '🧠', titulo: 'Desarrollo Emocional (Gestión Humana)', resumen: 'Resiliencia y manejo del estrés del equipo.',
    detalle: 'Talleres presenciales y dinámicas fuera de la oficina en habilidades blandas, tolerancia a la frustración y manejo de objeciones.' },
];

function renderEstrategia() {
  const el = document.getElementById('estrategia-body');
  if (!el) return;

  el.innerHTML = `
    <div class="panel">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px">
        <h3 style="margin:0; border:none; padding:0">🎯 Estrategia Comercial 2S 2026</h3>
        <div class="strategy-tabs">
          <button class="strategy-tab active" data-tab="ini" onclick="estrategiaTab('ini')">💡 Iniciativas</button>
          <button class="strategy-tab" data-tab="cron" onclick="estrategiaTab('cron')">📅 Cronograma</button>
          <button class="strategy-tab" data-tab="kpi" onclick="estrategiaTab('kpi')">📈 KPIs</button>
        </div>
      </div>

      <!-- TAB: Iniciativas -->
      <div class="strategy-pane active" id="tab-ini">
        <div style="display:flex; flex-direction:column; gap:8px">
          ${ESTRATEGIA_INICIATIVAS.map((it, i) => `
            <div class="ini-card" onclick="toggleIni(${i})">
              <div class="ini-head">
                <span class="ini-ico" style="background:rgba(${it.color==='teal'?'0,205,147':it.color==='blue'?'18,1,128':'255,107,53'},.12); color:var(--${it.color==='warn'?'warn':it.color})">${it.ico}</span>
                <div style="flex:1; min-width:0">
                  <div class="ini-title">${it.titulo}</div>
                  <div class="ini-resumen">${it.resumen}</div>
                </div>
                <span class="ini-chevron" id="ini-chevron-${i}">▾</span>
              </div>
              <div class="ini-detalle" id="ini-detalle-${i}">${it.detalle}</div>
            </div>`).join('')}
        </div>
        <div style="margin-top:12px; padding-top:10px; border-top:1px solid var(--gray2)">
          <div style="font-size:.68rem; font-weight:800; color:var(--blue); letter-spacing:.05em; text-transform:uppercase; margin-bottom:6px">👥 Recursos clave requeridos</div>
          <div style="display:flex; gap:8px; flex-wrap:wrap">
            <span class="res-chip">➕ 3 asesores nuevos en julio (→23 en operación)</span>
            <span class="res-chip">💻 CRM con validaciones automáticas</span>
            <span class="res-chip">🧹 Bases limpias contra producto ya activo (Vanti)</span>
          </div>
        </div>
      </div>

      <!-- TAB: Cronograma -->
      <div class="strategy-pane" id="tab-cron">
        <div class="tbl-wrap" style="margin-top:0">
          <table style="font-size:.74rem">
            <thead><tr>
              <th>Frente / Acción</th><th>Responsable</th>
              <th class="r">Jul</th><th class="r">Ago</th><th class="r">Sep</th>
              <th class="r">Oct</th><th class="r">Nov</th><th class="r">Dic</th>
            </tr></thead>
            <tbody>
              ${[
                ['Control de tiempos', 'Isaac', [1,1,0,0,0,0]],
                ['Plan de desarrollo emocional', 'GH / Líderes', [1,1,0,0,0,0]],
                ['Bases limpias y actualizadas', 'Vanti', [1,1,1,0,0,0]],
                ['Optimización de equipos PC', 'Tecnología', [1,1,1,0,0,0]],
              ].map(([nombre, resp, meses])=>`
                <tr>
                  <td><strong>${nombre}</strong></td>
                  <td style="color:var(--gray3)">${resp}</td>
                  ${meses.map(m=>`<td class="r" style="color:${m?'var(--teal)':'var(--gray2)'}">${m?'✓':'—'}</td>`).join('')}
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- TAB: KPIs -->
      <div class="strategy-pane" id="tab-kpi">
        <div class="tbl-wrap" style="margin-top:0">
          <table style="font-size:.76rem">
            <thead><tr><th>Métrica</th><th>Definición</th><th class="r">Meta 2S</th></tr></thead>
            <tbody>
              ${[
                ['Volumen de ventas', 'Ventas liquidadas totales/mes', '≥ 3.000'],
                ['Conversión Autogestión', 'Ventas / contactos en Autogestión', '≥ 40 %'],
                ['Conversión Bienvenida CP', 'Ventas / contactos en Bienvenida', '≥ 30 %'],
                ['Escuela de ventas', 'Sesiones individuales / asesor', '1 / mes'],
              ].map(([m,d,meta])=>`
                <tr><td><strong>${m}</strong></td><td style="color:var(--gray3)">${d}</td><td class="r">${badge(meta,'g')}</td></tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
  // abre la primera iniciativa por defecto
  setTimeout(() => toggleIni(0), 50);
}

function estrategiaTab(name) {
  document.querySelectorAll('.strategy-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.strategy-pane').forEach(p => p.classList.remove('active'));
  document.getElementById(`tab-${name}`).classList.add('active');
}

function toggleIni(i) {
  const det = document.getElementById(`ini-detalle-${i}`);
  const chev = document.getElementById(`ini-chevron-${i}`);
  if (!det) return;
  const open = det.classList.toggle('open');
  chev.textContent = open ? '▴' : '▾';
}

/* Slide: Evidencias fotográficas — tarjetas estilo Instagram (carrusel de 3 fotos c/u).
   Imágenes reales cargadas en context_Televentas/evidencias/. Solo 3 por campaña,
   elegidas para no sobrecargar la slide (grid 2x2, sin scroll). */
const EVIDENCIAS = [
  {
    grupo: 'Semanas Ganadoras', mes: 'Enero', stat: '1.292 ventas logradas', tag: '#SemanasGanadoras',
    carpeta: '../assets/evidencias/enero/',
    fotos: ['Imagen2.jpg', 'Imagen3.jpg', 'Imagen4.jpg'],
  },
  {
    grupo: 'Semana Burger & Feria Vanti', mes: 'Abril', stat: '1.266 ventas logradas', tag: '#SemanaBurger',
    carpeta: '../assets/evidencias/abril/',
    fotos: ['Imagen5.jpg', 'Imagen6.jpg', 'Imagen8.jpg'],
  },
  {
    grupo: 'Feria Vanti', mes: 'Mayo', stat: 'Parte de La Gran Jugada · 114% meta', tag: '#FeriaVanti',
    carpeta: '../assets/evidencias/mayo/',
    fotos: ['Imagen10.jpg', 'Imagen11.jpg', 'Imagen12.jpg'],
  },
  {
    grupo: 'Feria Mundialista', mes: 'Junio', stat: '1.520 ventas en dos semanas', tag: '#FeriaMundialista',
    carpeta: '../assets/evidencias/junio/',
    fotos: ['Imagen13.jpg', 'Imagen15.jpg', 'Imagen17.jpg'],
  },
];

function renderEvidencias() {
  const el = document.getElementById('evidencias-body');
  if (!el) return;

  el.innerHTML = `
    <div class="ig-grid">
      ${EVIDENCIAS.map((g, gi) => `
        <div class="ig-card">
          <div class="ig-head">
            <div class="ig-avatar"><img src="../assets/logos/Logo_fondoAzul.png" alt="Xuma" /></div>
            <div class="ig-headtext">
              <div class="ig-user">xuma_televentas</div>
              <div class="ig-loc">${g.grupo} · ${g.mes} 2026</div>
            </div>
            <div class="ig-dots">•••</div>
          </div>
          <div class="ig-media" id="ig-media-${gi}">
            ${g.fotos.map((f, fi) => `
              <img src="${g.carpeta}${f}" alt="${g.grupo}" loading="lazy"
                   class="ig-photo ${fi===0?'active':''}" data-idx="${fi}"
                   onclick="openLightbox('${(g.carpeta+f).replace(/'/g,"\\'")}', '${g.grupo} · ${g.mes}')" />
            `).join('')}
            ${g.fotos.length > 1 ? `
              <button class="ig-arrow left" onclick="igSlide(${gi}, -1)">&#8249;</button>
              <button class="ig-arrow right" onclick="igSlide(${gi}, 1)">&#8250;</button>
              <div class="ig-progress">
                ${g.fotos.map((_, fi) => `<span class="ig-seg ${fi===0?'active':''}"></span>`).join('')}
              </div>` : ''}
          </div>
          <div class="ig-actions">❤️ &nbsp; 💬 &nbsp; ✈️</div>
          <div class="ig-caption"><strong>xuma_televentas</strong> ${g.stat} <span class="ig-tag">${g.tag}</span></div>
        </div>`).join('')}
    </div>

    <!-- Lightbox -->
    <div id="lightbox-overlay" style="display:none; position:fixed; inset:0; background:rgba(4,0,40,.92); z-index:5000; align-items:center; justify-content:center; flex-direction:column; cursor:zoom-out" onclick="closeLightbox(event)">
      <img id="lightbox-img" src="" alt="" style="max-width:80vw; max-height:76vh; border-radius:10px; box-shadow:0 20px 60px rgba(0,0,0,.5)" />
      <div id="lightbox-caption" style="color:#fff; font-size:.85rem; font-weight:700; margin-top:14px; letter-spacing:.03em"></div>
      <div style="color:rgba(255,255,255,.5); font-size:.7rem; margin-top:6px">Clic en cualquier parte para cerrar</div>
    </div>`;
}

function igSlide(cardIdx, dir) {
  const media = document.getElementById(`ig-media-${cardIdx}`);
  if (!media) return;
  const photos = Array.from(media.querySelectorAll('.ig-photo'));
  const segs = Array.from(media.querySelectorAll('.ig-seg'));
  let idx = photos.findIndex(p => p.classList.contains('active'));
  photos[idx].classList.remove('active');
  segs[idx]?.classList.remove('active');
  idx = (idx + dir + photos.length) % photos.length;
  photos[idx].classList.add('active');
  segs[idx]?.classList.add('active');
}

function openLightbox(src, caption) {
  const ov = document.getElementById('lightbox-overlay');
  document.getElementById('lightbox-img').src = src;
  document.getElementById('lightbox-caption').textContent = caption;
  ov.style.display = 'flex';
}
function closeLightbox() {
  const ov = document.getElementById('lightbox-overlay');
  if (ov) ov.style.display = 'none';
}
