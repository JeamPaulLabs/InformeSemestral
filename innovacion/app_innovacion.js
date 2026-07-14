// ============================================================
//  INFORME INNOVACIÓN & TECNOLOGÍA 2026 – app_innovacion.js
//  Datos en data_innovacion.js. Motor de navegación compartido
//  en ../core/deck-engine.js. Iconos en ../core/icons.js.
// ============================================================

const NAV_LABELS = [
  'Portada', 'Resumen 1S', 'Línea de Tiempo', 'Detalle de Proyectos', 'Trabajo Conjunto', 'Plan 2S', 'Cierre'
];

/* ── STATE ──────────────────────────────────────────────────── */
let current = 0;
let animating = false;
const animated = new Set();
let slides = [];

/* ── INIT ───────────────────────────────────────────────────── */
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

/* ── HELPERS ────────────────────────────────────────────────── */
function fmt(n) { return n == null ? '—' : n.toLocaleString('es-CO'); }
function badge(txt, type) { return `<span class="badge badge-${type}">${txt}</span>`; }

let accIdx = 0;
function accCard(icoName, titulo, resumenTxt, listaHtml, estadoHtml) {
  const id = 'acc-' + (accIdx++);
  return `
    <div class="ini-card" onclick="toggleCard('${id}-det','${id}-chev')">
      <div class="ini-head">
        <span class="ini-ico" style="background:rgba(0,205,147,.12); color:var(--teal)">${icon(icoName, { size: 18 })}</span>
        <div style="flex:1; min-width:0">
          <div class="ini-title">${titulo}</div>
          <div class="ini-resumen">${resumenTxt}${estadoHtml ? ' · ' + estadoHtml : ''}</div>
        </div>
        <span class="ini-chevron" id="${id}-chev">▾</span>
      </div>
      <div class="ini-detalle" id="${id}-det">${listaHtml}</div>
    </div>`;
}

function toggleCard(detId, chevId) {
  const det = document.getElementById(detId);
  const chev = document.getElementById(chevId);
  if (!det) return;
  const open = det.classList.toggle('open');
  if (chev) chev.textContent = open ? '▴' : '▾';
}

/* ── PORTADA (estática en HTML, sin render) ──────────────────── */

/* ── Slide: Resumen 1S ────────────────────────────────────────── */
function renderResumen() {
  const el = document.getElementById('resumen-body');
  if (!el) return;

  // Semestre de origen real de cada proyecto = mes de su etapa MÁS temprana,
  // no el array/zona donde quedó agrupado (esos reflejan su estado ACTUAL,
  // no cuándo nació). Con esto: 12 de los 13 proyectos ya tenían alguna etapa
  // documentada antes del 01 Jul — incluida Auditor IA y notebooKevin (siguen
  // en modo prueba/piloto con Kevin, pero nacieron en el 1S) y hasta CRM
  // Twenty (la idea arrancó el 12 Jun, aunque nunca se ejecutó). Solo
  // Depuración nació 100 % dentro del 2S (07 Jul).
  const mesInicio = p => Math.min(...(p.etapas && p.etapas.length ? p.etapas : [{ mes: p.mes }]).map(e => e.mes));
  const nacidosEn1S = TIMELINE.filter(p => mesInicio(p) < INICIO_2S_MES).length;
  const enProduccion = TIMELINE.filter(p => p.categoria === 'produccion');
  const produccionNacida1S = enProduccion.filter(p => mesInicio(p) < INICIO_2S_MES).length;
  // "Producción real" = alcanzó de verdad la fase 'produccion' (verde, en el
  // DataCenter) antes del 01 Jul — no solo haber nacido antes de esa fecha.
  const prodRealEn1S = TIMELINE.filter(p => (p.etapas || []).some(e => e.fase === 'produccion' && e.mes < INICIO_2S_MES));

  el.innerHTML = `
    <div class="kpi-grid" style="grid-template-columns: repeat(3, 1fr)">
      <div class="kpi-card green">
        <div class="kpi-label" style="display:flex; align-items:center; gap:5px">${icon('trophy', { size: 12 })} Producción real alcanzada en el 1S</div>
        <div class="kpi-val">${prodRealEn1S.length} de ${TIMELINE.length}</div>
        <div class="kpi-sub"><strong>OCM Vanti</strong> (23 Jun) — el resto que hoy está en producción (AutoReport_Ilio, actiXuma) llegó ya en el 2S (08–09 Jul)</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Proyectos nacidos en el 1S</div>
        <div class="kpi-val">${nacidosEn1S} de ${TIMELINE.length}</div>
        <div class="kpi-sub">Todo el portafolio salvo Depuración (100 % 2S) se ideó antes del 01 Jul — incluidos ${produccionNacida1S} de los ${enProduccion.length} que hoy están en producción</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Infraestructura del DataCenter</div>
        <div class="kpi-val">8 fuentes</div>
        <div class="kpi-sub">Arquitectura completa (schemas + 4 ETLs) — la VM ya está montada y corriendo desde el 18 Jun, no solo en el papel</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">Filas OCM cargadas</div>
        <div class="kpi-val">23,58 M</div>
        <div class="kpi-sub">Histórico completo (7 tablas), carga ejecutada el 23 Jun</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">Llamadas cruzadas</div>
        <div class="kpi-val">3,02 M</div>
        <div class="kpi-sub">Contra 12.825 clientes de Bogotá (Mapa de Contactabilidad, ene–may)</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">Fases del plan maestro en la VM</div>
        <div class="kpi-val">5 de 16</div>
        <div class="kpi-sub">Seguridad (UFW, Fail2ban), PostgreSQL 16 y acceso remoto seguro (Tailscale VPN) ya montados</div>
      </div>
    </div>

    <div class="two-col" style="margin-top:14px">
      <div class="panel">
        <h3>${icon('rocket')} Foco del 1er semestre</h3>
        <p style="font-size:.8rem; line-height:1.65; color:var(--dark)">
          Construcción de <strong>infraestructura de datos</strong> y prueba de conceptos analíticos con datos reales — con
          una automatización que ya llegó a producción real dentro del propio semestre: OCM Vanti (23 Jun). El resto de
          automatizaciones de producción se consolidaron en el 2S. Cada cifra de arriba viene de una carga o
          un cruce ya ejecutado, no de una proyección.
        </p>
      </div>
      <div class="panel">
        <h3>${icon('bar-chart-3')} En cifras · por proyecto</h3>
        <ul class="check-list" style="gap:5px">
          <li style="font-size:.72rem"><strong>DataCenter (diseño):</strong> 8 fuentes de datos, 4 ETLs · proyección 5,31 → 14,09 GB a 3 años</li>
          <li style="font-size:.72rem"><strong>DataCenter (VM):</strong> montada y corriendo desde el 18 Jun — seguridad, PostgreSQL 16 y acceso remoto (Tailscale)</li>
          <li style="font-size:.72rem"><strong>OCM Vanti:</strong> 23.582.745 filas históricas (100 % completitud) · producción real desde el 23 Jun</li>
          <li style="font-size:.72rem"><strong>autoGPS:</strong> 13.571 direcciones · 94,5 % de efectividad (desde 62 % inicial)</li>
          <li style="font-size:.72rem"><strong>Mapa Contactabilidad:</strong> 12.825 clientes × 3.021.403 llamadas · brecha Tigo 71&nbsp;% vs. Movistar 25&nbsp;%</li>
          <li style="font-size:.72rem"><strong>autoComovamos:</strong> 8 módulos en producción manual · 6 fuentes cruzadas por corte</li>
        </ul>
      </div>
    </div>`;
}

/* ── Slide: Línea de Tiempo · una columna vertical por proyecto ────
   Cada proyecto tiene su propio carril VERTICAL — no comparte línea
   con nadie más, así que no hay cruces ni amontonamiento entre
   proyectos. El eje vertical es tiempo real: arriba = más reciente
   (Producción), abajo = más antiguo (Iniciación) — coherente con que
   "lo que ya está montado" se lee arriba. Dentro de su columna, cada
   proyecto marca un punto por cada etapa documentada (`etapas` en
   data_innovacion.js), unidos por una línea vertical recta: así el
   1S no desaparece solo porque la última actualización caiga en 2S. */
const FASE_ORDER = ['iniciacion', 'construccion', 'piloto', 'produccion'];
// iniciacion usa violeta (no teal): el teal ya significa "logro/producción" en
// los KPI cards del resto del informe (kpi-card.green) — reutilizarlo aquí para
// la fase más temprana mandaba la señal contraria (que "iniciación" es un éxito).
const FASE_COLOR = { iniciacion: '151,140,255', construccion: '255,209,102', piloto: '255,107,53', produccion: '90,226,128' };
const FASE_LABEL = {
  iniciacion: 'Iniciación / Fundación', construccion: 'En Construcción',
  piloto: 'Piloto / Prueba', produccion: 'Producción · en el DataCenter',
};
// "Hoy" se calcula con la fecha real del día en que se abre el informe (no un
// valor fijo) — mismo formato "mes fraccionario" que usan las etapas de
// data_innovacion.js (mes + (día-1)/días_del_mes), para que quede en la
// posición correcta de la línea de tiempo sin importar cuándo se vea.
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
function calcMesFraccion(date) {
  const y = date.getFullYear(), m = date.getMonth(), d = date.getDate();
  const diasDelMes = new Date(y, m + 1, 0).getDate();
  return (m + 1) + (d - 1) / diasDelMes;
}
const HOY_DATE = new Date();
const HOY_MES = calcMesFraccion(HOY_DATE);
const HOY_LABEL = `${String(HOY_DATE.getDate()).padStart(2, '0')} ${MESES_CORTOS[HOY_DATE.getMonth()]}`;
const INICIO_2S_MES = 7.0; // 01 jul 2026 — corte oficial entre semestres (fijo, no depende del día de hoy)
const TOP_Y = 10, BOTTOM_Y = 88; // margen para encabezado arriba y pies de columna abajo

let activeId = null; // id del proyecto seleccionado (o null = todos a brillo completo)
let timelineRange = { min: 6, max: 8 };
let nodePositions = {}; // id -> {x,y,fase,mes,fecha} de la ÚLTIMA etapa (columna fija en x)
let stagePositions = {}; // id -> [{x,y,fase,mes,fecha}, ...] TODAS las etapas, en orden cronológico
let dashFlow = 0; // desplaza el punteado de las conexiones para que "fluyan"
let sparks = null; // partículas del resplandor del hito (ver drawHitoGlow)
let hoyY = 10; // % — hasta acá se extiende la línea de los proyectos `activo:true`
let columnStages = {}; // key de columna -> [{x,y,fase,mes,fecha,ownerId}] TODAS las etapas de la columna, fusionadas y en orden cronológico
let columnActivo = {}; // key de columna -> bool (¿sigue activa hoy? ver drawStageSteps)
let ownerColKey = {}; // id de proyecto -> key de su columna (para resaltar/atenuar la columna completa al seleccionar cualquiera de sus fases)
// Familias que se muestran como UNA sola columna en vez de una por proyecto:
// el DataCenter es una sola iniciativa (Diseño -> Implementación -> Carga
// OCM son fases de lo mismo, no 3 líneas distintas).
const MERGE_FAMILIAS = ['datacenter'];
const MARGIN_L = 4, MARGIN_R = 4; // % de margen izq/der para las columnas, con el panel cerrado
let currentColumnas = []; // columnas ya calculadas (key, label, etapasRaw) — reutilizadas por relayoutColumns() cuando se abre/cierra el panel

// Arriba = reciente, abajo = antiguo — banda [TOP_Y, BOTTOM_Y].
function mesToY(mes) {
  const { min, max } = timelineRange;
  const raw = (mes - min) / (max - min);
  const t = Math.max(0, Math.min(1, raw));
  return BOTTOM_Y - t * (BOTTOM_Y - TOP_Y);
}

function renderTimeline() {
  const el = document.getElementById('timeline-body');
  if (!el) return;

  const todasEtapas = TIMELINE.flatMap(p => (p.etapas && p.etapas.length ? p.etapas : [{ mes: p.mes, fecha: p.fecha }]));
  const meses = todasEtapas.map(e => e.mes);
  // max en al menos 8.3 (bien pasado el 01 Ago): deja ver "01 Ago" como línea
  // de mes y da espacio arriba de "Hoy" para que las columnas activas (con su
  // línea proyectada hasta hoy) se lean como una proyección hacia el 2S, no
  // como si el lienzo terminara justo donde termina julio.
  timelineRange = { min: Math.floor(Math.min(...meses)), max: Math.max(Math.max(...meses) + 0.3, HOY_MES + 0.3, 8.3) };
  // Ancla real más temprana: para el rótulo de "inicio", en vez de un mes
  // fijo (antes decía "Enero 2026" sin relación con los datos reales).
  const inicioReal = todasEtapas.reduce((a, b) => (b.mes < a.mes ? b : a));
  hoyY = mesToY(HOY_MES);

  // Columnas: para las familias en MERGE_FAMILIAS (el DataCenter), sus
  // miembros se fusionan en UNA sola columna — son fases de la misma
  // iniciativa (Diseño -> Implementación -> Carga OCM), no 3 líneas
  // distintas. El resto de proyectos son cada uno su propia columna.
  const seenCols = new Set();
  const columnas = []; // { key, label, ico, etapasRaw:[{fase,mes,fecha,ownerId,ownerIco}] }
  TIMELINE.forEach(p => {
    if (seenCols.has(p.id)) return;
    const etapasDe = (x) => (x.etapas && x.etapas.length ? x.etapas : [{ fase: 'piloto', mes: x.mes, fecha: x.fecha }]);
    if (p.familia && MERGE_FAMILIAS.includes(p.familia)) {
      const grupo = TIMELINE.filter(x => x.familia === p.familia);
      grupo.forEach(g => seenCols.add(g.id));
      const etapasRaw = grupo
        .flatMap(g => etapasDe(g).map(e => ({ ...e, ownerId: g.id, ownerIco: g.ico })))
        .sort((a, b) => a.mes - b.mes);
      columnas.push({ key: 'fam-' + p.familia, label: 'DataCenter', etapasRaw, activo: grupo.some(g => g.activo) });
    } else {
      seenCols.add(p.id);
      const etapasRaw = etapasDe(p).map(e => ({ ...e, ownerId: p.id, ownerIco: p.ico }));
      columnas.push({ key: p.id, label: p.corto || p.nombre, etapasRaw, activo: p.activo });
    }
  });

  currentColumnas = columnas;
  const N = columnas.length;
  const colW = (100 - MARGIN_L - MARGIN_R) / N;

  nodePositions = {};
  stagePositions = {};
  columnStages = {};
  ownerColKey = {};
  const nodesHtml = [], stageDotsHtml = [], footerHtml = [];

  columnas.forEach((col, i) => {
    const cx = MARGIN_L + colW * (i + 0.5);
    const stages = col.etapasRaw.map(e => ({ x: cx, y: mesToY(e.mes), fase: e.fase, mes: e.mes, fecha: e.fecha, ownerId: e.ownerId, ownerIco: e.ownerIco }));
    columnStages[col.key] = stages;
    columnActivo[col.key] = !!col.activo;

    // Registrar posición por proyecto ORIGINAL (no por columna): así el hito,
    // los pendientes y el panel lateral siguen funcionando por id real, aunque
    // varios proyectos compartan la misma columna fusionada.
    const byOwner = {};
    stages.forEach(s => { (byOwner[s.ownerId] ||= []).push(s); ownerColKey[s.ownerId] = col.key; });
    Object.entries(byOwner).forEach(([ownerId, ownerStages]) => {
      stagePositions[ownerId] = ownerStages;
      nodePositions[ownerId] = ownerStages[ownerStages.length - 1];
    });

    const last = stages[stages.length - 1];
    const lastProj = TIMELINE.find(x => x.id === last.ownerId);

    // El nodo se queda en su última fecha REAL documentada — solo sube
    // cuando hay una nueva etapa fechada de verdad (ej. DataCenter con la
    // fase de Tailscale del 03 Jul), no solo por estar `activo:true`. Estar
    // activo ya se transmite con la línea de proyección hasta "Hoy" (ver
    // drawStageSteps) — mover el círculo sin una mejora real documentada
    // inventaría progreso que aún no ha ocurrido (ej. OCM Vanti sigue
    // operando bien desde el 23 Jun, pero no hay una mejora posterior).
    const pendingBadge = (lastProj.pendiente && last.fase !== 'produccion')
      ? `<span class="timeline-pending-badge" title="Pendiente: ${lastProj.pendiente}">${icon('hourglass', { size: 9 })}</span>`
      : '';

    nodesHtml.push(`<button class="timeline-node cat-${last.fase}${lastProj.hito ? ' hito-lit' : ''}" id="node-${col.key}" data-col="${col.key}"
        style="left:${cx}%; top:${last.y}%" onclick="selectProject('${last.ownerId}')" title="${lastProj.nombre}">
        ${icon(last.ownerIco, { size: 12 })}
        ${pendingBadge}
        <span class="timeline-node-cap">${col.label} · ${last.fecha}</span>
      </button>`);

    // Columnas fusionadas (ej. "fam-datacenter", diseño + implementación como
    // una sola línea continua): los puntos muestran el ícono de a quién
    // pertenecen (brújula = diseño, llave = implementación) para que se note
    // la división entre secciones sin romper la línea continua.
    const isMerged = col.key.startsWith('fam-');
    stages.slice(0, -1).forEach((s, si) => {
      const owner = TIMELINE.find(x => x.id === s.ownerId);
      const dotIcon = isMerged ? icon(s.ownerIco, { size: 7 }) : '';
      stageDotsHtml.push(`<button class="timeline-stage-dot cat-${s.fase}${isMerged ? ' stage-dot-icon' : ''}" id="stage-${col.key}-${si}" data-col="${col.key}"
        style="left:${cx}%; top:${s.y}%" onclick="selectProject('${s.ownerId}')" title="${owner.corto || owner.nombre} · ${s.fecha}">${dotIcon}</button>`);
    });

    footerHtml.push(`<button class="vtl-col-footer cat-${last.fase}" id="footer-${col.key}" data-col="${col.key}"
        style="left:${cx}%" onclick="selectProject('${last.ownerId}')" title="${col.label}">
        <span class="vtl-col-ico">${icon(last.ownerIco, { size: 13 })}</span>
        <span class="vtl-col-label">${col.label}</span>
      </button>`);
  });

  const inicio2sY = mesToY(INICIO_2S_MES);

  // Líneas de mes: una por cada 1° de mes dentro del rango de datos, para
  // ubicar de un vistazo en qué mes cae cada nodo (antes solo existían las
  // líneas de "Hoy" e "Inicio 2S"). Se omite el mes que ya coincide con
  // INICIO_2S_MES para no duplicar esa línea.
  const MESES_NOMBRE = ['', 'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  const inicio2sMesEntero = Math.round(INICIO_2S_MES);
  const monthLinesHtml = [];
  for (let m = Math.ceil(timelineRange.min); m <= Math.floor(timelineRange.max); m++) {
    if (m === inicio2sMesEntero) continue;
    const y = mesToY(m);
    monthLinesHtml.push(`
      <div class="vtl-month-line" style="top:${y}%"></div>
      <div class="vtl-month-label vtl-right-label" style="top:${y}%">01 ${MESES_NOMBRE[m]}</div>`);
  }

  // Etiqueta de "hito real" — pegada a la izquierda del nodo marcado con
  // hito:true.
  const hitoLabelsHtml = TIMELINE.filter(p => p.hito).map(p => {
    const pos = nodePositions[p.id];
    if (!pos) return '';
    return `<div class="timeline-hito-label" id="hito-label-${p.id}" style="left:${pos.x}%; top:${pos.y}%">Hito · ${p.fecha}</div>`;
  }).join('');

  // Marca de agua de semestre — muy sutil, pegada al margen izquierdo (la
  // franja de 4% sin columnas), centrada dentro de la banda de cada zona
  // para identificarlas sin agregar otro elemento "ruidoso" al centro del
  // lienzo. El cartel "Inicio de registros" va del mismo lado.
  const semestreWatermarksHtml = `
    <div class="vtl-semester-watermark" style="top:${inicio2sY / 2}%">2do Semestre</div>
    <div class="vtl-semester-watermark" style="top:${inicio2sY + (100 - inicio2sY) / 2}%">1er Semestre</div>`;

  el.innerHTML = `
    <div class="timeline-wrap">
      <canvas class="timeline-canvas" id="timeline-canvas"></canvas>
      <div class="timeline-content" id="timeline-content" onclick="if(event.target===this) clearSelection()">
        <!-- Fondos de zona: Primer y Segundo Semestre (horizontales: el tiempo corre vertical) -->
        <div class="vtl-zone-bg zone-2s" style="top:0; height:${inicio2sY}%"></div>
        <div class="vtl-zone-bg zone-1s" style="top:${inicio2sY}%; height:${100 - inicio2sY}%"></div>
        ${semestreWatermarksHtml}

        ${monthLinesHtml.join('')}
        <div class="vtl-hoy-line" style="top:${inicio2sY}%"></div>
        <div class="timeline-hoy-label vtl-right-label" style="top:${inicio2sY}%">Inicio 2S · 01 Jul</div>
        <div class="vtl-hoy-line" style="top:${hoyY}%"></div>
        <div class="timeline-hoy-label timeline-hoy-label-now vtl-right-label" style="top:${hoyY}%">Hoy · ${HOY_LABEL}</div>

        <div class="vtl-bookend-bottom" style="top:${BOTTOM_Y}%">
          <div class="bookend-label">↓ Inicio de registros</div>
          <div class="bookend-date">${inicioReal.fecha}</div>
        </div>

        ${stageDotsHtml.join('')}
        ${nodesHtml.join('')}
        ${footerHtml.join('')}
        ${hitoLabelsHtml}

        <div class="timeline-legend">
          ${FASE_ORDER.map(f => `<div class="timeline-legend-item"><span class="timeline-legend-dot" style="background:rgb(${FASE_COLOR[f]})"></span>${FASE_LABEL[f]}</div>`).join('')}
        </div>
        <div class="timeline-sidepanel" id="timeline-sidepanel">
          <button class="tf-close" onclick="clearSelection()" title="Cerrar">✕</button>
          <div id="timeline-sidepanel-body"></div>
        </div>
      </div>
    </div>`;

  initTimelineCanvas();
  // Sin selección inicial: los 13 proyectos arrancan a brillo completo.
}

// Recalcula la posición X de cada columna para dejarle espacio real al panel
// de detalle (en vez de que el panel quede flotando ENCIMA de las columnas de
// la derecha, tapándolas y bloqueando el clic). Con el panel abierto, las 12
// columnas se comprimen hacia la izquierda del hueco que el panel ocupa a la
// derecha; al cerrar, vuelven a su ancho normal. Es un recálculo instantáneo
// (no animado): así el canvas —que lee estas mismas coordenadas cada frame—
// nunca queda desincronizado de los nodos HTML durante una transición.
function relayoutColumns(panelOpen) {
  const N = currentColumnas.length;
  if (!N) return;
  const wrap = document.querySelector('.timeline-wrap');
  const wrapWidthPx = (wrap && wrap.clientWidth) || 1220;
  const PANEL_RESERVE_PX = 340 + 80 + 20; // ancho del panel + su offset a la derecha + un respiro
  const marginR = panelOpen ? MARGIN_R + (PANEL_RESERVE_PX / wrapWidthPx) * 100 : MARGIN_R;
  const colW = (100 - MARGIN_L - marginR) / N;
  // Ancho máximo de la etiqueta del pie = el espacio real entre columnas (en
  // px), con un pequeño respiro — si no, al comprimir para el panel, las
  // etiquetas de columnas vecinas empiezan a pisarse entre sí.
  const pitchPx = (colW / 100) * wrapWidthPx;
  const labelMaxWidth = Math.max(34, Math.min(76, pitchPx - 6));

  currentColumnas.forEach((col, i) => {
    const cx = MARGIN_L + colW * (i + 0.5);
    (columnStages[col.key] || []).forEach(s => { s.x = cx; });
    Object.keys(ownerColKey).forEach(ownerId => {
      if (ownerColKey[ownerId] !== col.key) return;
      if (stagePositions[ownerId]) stagePositions[ownerId].forEach(s => { s.x = cx; });
      if (nodePositions[ownerId]) nodePositions[ownerId].x = cx;
    });
    const nodeEl = document.getElementById('node-' + col.key);
    if (nodeEl) nodeEl.style.left = cx + '%';
    const footerEl = document.getElementById('footer-' + col.key);
    if (footerEl) {
      footerEl.style.left = cx + '%';
      const labelEl = footerEl.querySelector('.vtl-col-label');
      if (labelEl) labelEl.style.maxWidth = labelMaxWidth + 'px';
    }
    document.querySelectorAll(`.timeline-stage-dot[data-col="${col.key}"]`).forEach(dot => { dot.style.left = cx + '%'; });
  });

  TIMELINE.filter(p => p.hito).forEach(p => {
    const pos = nodePositions[p.id];
    const label = document.getElementById('hito-label-' + p.id);
    if (label && pos) label.style.left = pos.x + '%';
  });

  // Etiquetas de fecha del lado derecho (Hoy, Inicio 2S, 01 Jun, 01 Ago...):
  // con el panel abierto, el propio panel ocupa esa franja — sin este ajuste
  // quedarían tapadas detrás de él en vez de seguir visibles a su izquierda.
  const rightLabelOffset = panelOpen ? PANEL_RESERVE_PX + 14 : 14;
  document.querySelectorAll('.vtl-right-label').forEach(lbl => { lbl.style.right = rightLabelOffset + 'px'; });
}

function clearSelection() {
  activeId = null;
  document.querySelectorAll('.timeline-node, .vtl-col-footer, .timeline-stage-dot').forEach(n => n.classList.remove('active', 'dimmed'));
  const panel = document.getElementById('timeline-sidepanel');
  if (panel) panel.classList.remove('open');
  relayoutColumns(false);
}

function selectProject(id) {
  const p = TIMELINE.find(x => x.id === id);
  if (!p) return;
  activeId = id;
  const colKey = ownerColKey[id];
  relayoutColumns(true);

  document.querySelectorAll('.timeline-node').forEach(n => {
    n.classList.toggle('active', n.dataset.col === colKey);
    n.classList.toggle('dimmed', n.dataset.col !== colKey);
  });
  document.querySelectorAll('.vtl-col-footer').forEach(n => {
    n.classList.toggle('active', n.dataset.col === colKey);
    n.classList.toggle('dimmed', n.dataset.col !== colKey);
  });
  document.querySelectorAll('.timeline-stage-dot').forEach(n => {
    n.classList.toggle('dimmed', n.dataset.col !== colKey);
  });

  const fase = nodePositions[id].fase;
  const stats = [
    { label: 'Etapa actual', val: FASE_LABEL[fase] },
    p.fecha ? { label: 'Fecha', val: p.fecha } : null,
    p.volumen ? { label: 'Datos', val: p.volumen } : null,
    p.tiempo ? { label: 'Tiempo', val: p.tiempo } : null,
  ].filter(Boolean);

  // Mini-línea de etapas: un punto por etapa documentada, de la más antigua
  // a la más reciente. En columnas fusionadas (ej. DataCenter diseño +
  // implementación) se muestra el RECORRIDO COMPLETO de la columna, no solo
  // las etapas del proyecto clicado — así se ve una sola línea continua,
  // pero cada punto trae el ícono de a qué sección pertenece (brújula =
  // diseño, llave = implementación), para notar la división sin fragmentar
  // el resumen/hitos en textos distintos por sección (siguen siendo un solo
  // bloque, el del proyecto específico en el que se hizo clic).
  const isMergedCol = colKey && colKey.startsWith('fam-');
  const stages = isMergedCol ? columnStages[colKey] : stagePositions[id];
  const miniTimelineHtml = `
    <div class="tf-section-label">Recorrido</div>
    <div class="tf-mini-timeline">
      ${stages.map((s) => {
        const seccion = isMergedCol ? (TIMELINE.find(x => x.id === s.ownerId).corto.split('·').pop().trim()) : null;
        return `
        <div class="tf-mini-stage cat-${s.fase}">
          <span class="tf-mini-dot${isMergedCol ? ' tf-mini-dot-icon' : ''}">${isMergedCol ? icon(s.ownerIco, { size: 8 }) : ''}</span>
          <div class="tf-mini-info">
            <div class="tf-mini-fase">${seccion || FASE_LABEL[s.fase].split(' · ')[0].split(' /')[0]}</div>
            <div class="tf-mini-fecha">${s.fecha.split(' · ')[0]}</div>
          </div>
        </div>`;
      }).join('<div class="tf-mini-connector"></div>')}
    </div>`;

  // Versión "gerencial": primera oración del resumen (el resto ya se explica
  // en los hitos) y solo los 2 hitos más relevantes (el propio orden de cada
  // proyecto en data_innovacion.js ya los prioriza) — un panel de detalle no
  // debe competir en extensión con el informe completo.
  const resumenCorto = (p.resumen.split(/(?<=\.) /)[0] || p.resumen);
  const hitosTop = (p.hitos || []).slice(0, 2);

  const body = document.getElementById('timeline-sidepanel-body');
  if (!body) return;
  body.innerHTML = `
    <h3>${icon(p.ico, { size: 18 })} ${p.nombre}</h3>
    <div class="tf-stats">
      ${stats.map(s => `<div class="tf-stat"><div class="tf-stat-label">${s.label}</div><div class="tf-stat-val">${s.val}</div></div>`).join('')}
    </div>
    ${miniTimelineHtml}
    <div class="tf-resumen">${resumenCorto}</div>
    <div class="tf-section-label">Hitos clave</div>
    <ul class="check-list">${hitosTop.map(h => `<li>${h}</li>`).join('')}</ul>
    ${p.pendiente ? `<div class="tf-pendiente"><strong style="color:var(--warn)">Pendiente:</strong> ${p.pendiente}</div>` : ''}
    <div class="tf-fuente">Fuente: ${p.fuente}</div>`;

  const panel = document.getElementById('timeline-sidepanel');
  if (panel) panel.classList.add('open');
}

/* Fondo animado de puntos + 13 columnas verticales (una por proyecto), con
   highlight/dim según el proyecto seleccionado. Los nodos/puntos/pies de
   columna se posicionan en % (CSS) directamente — al ser posiciones lineales
   simples (no una curva bézier), no hay riesgo de que diverjan del canvas. */
function initTimelineCanvas() {
  const canvas = document.getElementById('timeline-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let W, H, pts;
  const LINK_DIST = 90;

  function resize() {
    // clientWidth/clientHeight (no getBoundingClientRect): #scaler escala todo el
    // deck con transform:scale(s) para llenar la pantalla, y getBoundingClientRect
    // incluye ese transform (devuelve tamaño YA escalado). Los nodos y líneas HTML,
    // en cambio, se posicionan en % del layout SIN escalar (1220x558 de diseño).
    // Si el canvas se dimensiona con el rect escalado, dibuja en un sistema de
    // coordenadas distinto al de los nodos — y ambos solo coinciden quand s=1.
    // clientWidth/Height sí devuelve el tamaño de layout real, sin el transform.
    const parent = canvas.parentElement;
    if (parent.clientWidth === 0 || parent.clientHeight === 0) return; // slide aún oculta (display:none)
    W = canvas.width = parent.clientWidth;
    H = canvas.height = parent.clientHeight;
    const count = Math.max(24, Math.min(55, Math.round((W * H) / 15000)));
    pts = Array.from({ length: count }, () => ({
      x: Math.random() * W, y: Math.random() * H,
      vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
    }));
  }
  window.addEventListener('resize', resize);
  // El slide arranca oculto (display:none) — un ResizeObserver detecta cuando
  // #app la muestra por primera vez (0×0 → tamaño real) y recién ahí dimensiona
  // el canvas; un simple resize() al cargar no alcanzaría (rect sería 0×0).
  new ResizeObserver(resize).observe(canvas.parentElement);

  function drawArrowhead(x, y, angle, color) {
    const size = 5;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-size * 1.6, -size * 0.7);
    ctx.lineTo(-size * 1.6, size * 0.7);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
  }

  // Recorrido real de cada COLUMNA (que puede fusionar varios proyectos de
  // la misma familia, ej. DataCenter) por sus etapas: todas viven en el
  // mismo x, así que la conexión es una línea vertical recta — sin
  // diagonales ni escuadras, cero cruces con otras columnas.
  function drawStageSteps() {
    Object.entries(columnStages).forEach(([key, stages]) => {
      const dim = activeId && ownerColKey[activeId] !== key;
      for (let i = 0; i < stages.length - 1; i++) {
        const a = stages[i], b = stages[i + 1];
        const ax = a.x / 100 * W, ay = a.y / 100 * H;
        const by = b.y / 100 * H;
        ctx.strokeStyle = dim ? `rgba(${FASE_COLOR[b.fase]},.08)` : `rgba(${FASE_COLOR[b.fase]},.75)`;
        ctx.lineWidth = dim ? 1 : 2.4;
        ctx.setLineDash([2, 3]);
        ctx.lineDashOffset = -dashFlow; // el punteado "sube" hacia la etapa siguiente
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax, by);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
      }
      // Columnas que siguen corriendo hoy: la línea no se corta en su última
      // fecha documentada, sigue subiendo hasta "Hoy". Dos motivos posibles:
      // `activo:true` explícito (ej. la VM del DataCenter, que sigue montada
      // aunque su última fase sea "En Construcción"), o que su última fase ya
      // sea "Producción · en el DataCenter" — si está desplegado ahí, por
      // definición sigue operando hoy, no solo el día en que se documentó.
      const last = stages[stages.length - 1];
      if (columnActivo[key] || last.fase === 'produccion') {
        const ax = last.x / 100 * W, ay = last.y / 100 * H, topY = hoyY / 100 * H;
        ctx.strokeStyle = dim ? `rgba(${FASE_COLOR[last.fase]},.08)` : `rgba(${FASE_COLOR[last.fase]},.8)`;
        ctx.lineWidth = dim ? 1 : 2.4;
        ctx.setLineDash([1, 3]);
        ctx.lineDashOffset = -dashFlow;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax, topY);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
      }
    });
  }

  // Familias que NO se fusionan en una columna (ej. 'auditoria': Auditor IA
  // y notebooKevin son proyectos hermanos, no fases de lo mismo) se conectan
  // en forma de "Z" (vertical -> horizontal -> vertical) entre sus columnas,
  // en vez de una diagonal recta que atravesaría el resto del lienzo.
  function drawFamilyLinks() {
    const byFamilia = {};
    TIMELINE.forEach(p => { if (p.familia && !MERGE_FAMILIAS.includes(p.familia)) (byFamilia[p.familia] ||= []).push(p); });
    Object.values(byFamilia).forEach(group => {
      if (group.length < 2) return;
      group.sort((a, b) => a.mes - b.mes);
      for (let i = 0; i < group.length - 1; i++) {
        const idA = group[i].id, idB = group[i + 1].id;
        const a = nodePositions[idA], b = nodePositions[idB];
        if (!a || !b) continue;
        const ax = a.x / 100 * W, ay = a.y / 100 * H;
        const bx = b.x / 100 * W, by = b.y / 100 * H;
        const midY = (ay + by) / 2;
        const dim = activeId && activeId !== idA && activeId !== idB;
        ctx.strokeStyle = dim ? 'rgba(255,255,255,.05)' : 'rgba(255,255,255,.25)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([2, 4]);
        ctx.lineDashOffset = -dashFlow;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(ax, midY);
        ctx.lineTo(bx, midY);
        ctx.lineTo(bx, by);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
        if (!dim) drawArrowhead(bx, by, by > ay ? Math.PI / 2 : -Math.PI / 2, 'rgba(255,255,255,.4)');
      }
    });
  }

  // Proyectos satélite (`vinculadoA` en data_innovacion.js) que ya integran o
  // van a integrar su procesamiento dentro del DataCenter, sin ser una fase
  // del mismo (por eso tienen su propia columna, a diferencia de `familia`).
  // Línea en forma de "Z", en verde (color de Producción) y más tenue que
  // drawFamilyLinks, para leerse como "alimenta al núcleo" sin competir con
  // el recorrido propio de cada columna.
  function drawVinculadoLinks() {
    TIMELINE.forEach(p => {
      if (!p.vinculadoA) return;
      const a = nodePositions[p.id], b = nodePositions[p.vinculadoA];
      if (!a || !b) return;
      const ax = a.x / 100 * W, ay = a.y / 100 * H;
      const bx = b.x / 100 * W, by = b.y / 100 * H;
      const midY = (ay + by) / 2;
      const dim = activeId && activeId !== p.id && ownerColKey[activeId] !== ownerColKey[p.vinculadoA];
      ctx.strokeStyle = dim ? 'rgba(90,226,128,.04)' : 'rgba(90,226,128,.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([1, 5]);
      ctx.lineDashOffset = -dashFlow;
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax, midY);
      ctx.lineTo(bx, midY);
      ctx.lineTo(bx, by);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineDashOffset = 0;
      if (!dim) drawArrowhead(bx, by, by > ay ? Math.PI / 2 : -Math.PI / 2, 'rgba(90,226,128,.35)');
    });
  }

  // Resplandor del hito real (ej. arranque de la implementación del
  // DataCenter, 18 Jun): un brillo suave alrededor del nodo, con chispas
  // orbitando cerca — lo marca como punto de origen sin dominar el lienzo.
  function drawHitoGlow() {
    const hitos = TIMELINE.filter(p => p.hito && nodePositions[p.id]);
    if (!hitos.length) return;

    if (!sparks) {
      sparks = [];
      hitos.forEach((p, hi) => {
        for (let i = 0; i < 14; i++) {
          sparks.push({ hi, angle: Math.random() * Math.PI * 2, radius: 14 + Math.random() * 22, speed: 0.006 + Math.random() * 0.008, r: 1 + Math.random() * 1.3 });
        }
      });
    }

    hitos.forEach((p, hi) => {
      const pos = nodePositions[p.id];
      const cx = pos.x / 100 * W, cy = pos.y / 100 * H;
      const dim = activeId && ownerColKey[activeId] !== ownerColKey[p.id];
      if (dim) return;

      // Color del resplandor = color real de la fase del nodo (ej. verde para
      // "Producción"), no un dorado fijo — antes el halo siempre salía dorado
      // sin relación con la fase, dando la impresión de un círculo "sin
      // iluminar" aunque la columna ya fuera verde/producción.
      const rgb = FASE_COLOR[pos.fase];
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 42);
      glow.addColorStop(0, `rgba(${rgb},.32)`);
      glow.addColorStop(0.6, `rgba(${rgb},.12)`);
      glow.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(cx, cy, 42, 0, Math.PI * 2);
      ctx.fill();

      sparks.filter(s => s.hi === hi).forEach(s => {
        s.angle += s.speed;
        const x = cx + Math.cos(s.angle) * s.radius;
        const y = cy + Math.sin(s.angle) * s.radius;
        ctx.beginPath();
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},.85)`;
        ctx.fill();
      });
    });
  }

  // Destello HORIZONTAL (distinto del resplandor circular de drawHitoGlow):
  // marca el punto donde arrancó una implementación que luego se ramifica
  // hacia otros proyectos (ver `hitoHorizontal` en data_innovacion.js, hoy
  // solo en datacenter-implementacion) — un haz que fluye hacia la derecha,
  // hacia las columnas satélite conectadas por drawVinculadoLinks, en vez de
  // chispas orbitando en círculo.
  function drawHorizontalGlow() {
    const targets = TIMELINE.filter(p => p.hitoHorizontal && stagePositions[p.id] && stagePositions[p.id][0]);
    if (!targets.length) return;

    targets.forEach(p => {
      const origin = stagePositions[p.id][0];
      const cx = origin.x / 100 * W, cy = origin.y / 100 * H;
      const dim = activeId && ownerColKey[activeId] !== ownerColKey[p.id];
      if (dim) return;

      const rgb = FASE_COLOR.produccion; // lo que sale de aquí ya es capacidad de producción real (OCM Vanti y el resto)

      // Haz hacia el horizonte — más delgado que un resplandor circular, para
      // leerse como "luz que se proyecta", no como un halo que ocupa espacio.
      const beam = ctx.createLinearGradient(cx, cy, W, cy);
      beam.addColorStop(0, `rgba(${rgb},.26)`);
      beam.addColorStop(0.35, `rgba(${rgb},.06)`);
      beam.addColorStop(1, `rgba(${rgb},0)`);
      ctx.fillStyle = beam;
      ctx.fillRect(cx, cy - 4, W - cx, 8);

      // Chispa de 8 puntas en el punto de origen — un brazo horizontal largo
      // que se funde con el haz hacia el horizonte, brazos más cortos en las
      // otras 7 direcciones, y un punto brillante en el centro.
      const drawArm = (angle, len, halfWidth) => {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(angle);
        const grad = ctx.createLinearGradient(0, 0, len, 0);
        grad.addColorStop(0, `rgba(${rgb},.95)`);
        grad.addColorStop(1, `rgba(${rgb},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.moveTo(0, -halfWidth);
        ctx.lineTo(len, 0);
        ctx.lineTo(0, halfWidth);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      };
      drawArm(0, 30, 1.6); // brazo horizontal, el más largo — hacia el horizonte
      [Math.PI / 4, Math.PI / 2, (3 * Math.PI) / 4, Math.PI, (5 * Math.PI) / 4, (3 * Math.PI) / 2, (7 * Math.PI) / 4]
        .forEach(a => drawArm(a, 11, 1.1));
      ctx.beginPath();
      ctx.arc(cx, cy, 2.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${rgb},1)`;
      ctx.fill();

      // Partículas fluyendo hacia la derecha, hacia las columnas vinculadas.
      const span = W - cx;
      for (let i = 0; i < 6; i++) {
        const t = (((dashFlow * 1.6) + i * (span / 6)) % span);
        const x = cx + t, y = cy + Math.sin(t * 0.04 + i) * 2.5;
        ctx.beginPath();
        ctx.arc(x, y, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${.6 * (1 - t / span)})`;
        ctx.fill();
      }
    });
  }

  function tick() {
    if (!document.getElementById('timeline-canvas')) return; // slide removido, detener loop
    if (!pts) { requestAnimationFrame(tick); return; } // aún sin dimensionar (slide oculta)
    ctx.clearRect(0, 0, W, H);
    dashFlow = (dashFlow + 0.35) % 1000;

    drawHitoGlow(); // detrás de todo: resplandor de origen (ej. arranque DataCenter)
    drawHorizontalGlow(); // destello horizontal: punto de origen que se ramifica hacia otros proyectos

    for (const p of pts) {
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
    }
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < LINK_DIST) {
          ctx.strokeStyle = `rgba(90,226,128,${(1 - d / LINK_DIST) * 0.12})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y);
          ctx.stroke();
        }
      }
    }
    for (const p of pts) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0,205,147,.4)';
      ctx.fill();
    }

    drawStageSteps();
    drawFamilyLinks();
    drawVinculadoLinks();

    requestAnimationFrame(tick);
  }
  tick();
}

/* ── Slide: Detalle de Proyectos · Red de Proyectos ──────────────
   Nodos = los 13 proyectos, agrupados en 3 filas por categoría (Fundación /
   Producción / Desarrollo). Las conexiones NO se inventan: reusan las
   mismas relaciones ya curadas en data_innovacion.js para la Línea de
   Tiempo (familia:'datacenter' y vinculadoA) — así la red es congruente con
   el resto del informe, no una vista nueva con datos distintos. Al hacer
   clic en un nodo se resalta su columna de conexiones y se muestra, en
   lenguaje simple (no técnico), su estado + stack + metodología. */
const RED_ROWS = [
  { cat: 'fundacion', label: 'Fundación', y: 24 },
  { cat: 'produccion', label: 'Producción', y: 52 },
  { cat: 'desarrollo', label: 'Desarrollo', y: 80 },
];
// Categorías para agrupar las tecnologías — antes era un solo bloque apiñado
// sin ningún orden; agrupadas se lee de un vistazo qué hace cada familia de
// herramientas. buildStackGrupos() reutiliza esto tanto para el panel
// general (las 29) como para el de un solo proyecto (solo las suyas).
const STACK_CATEGORIAS = [
  { label: 'Lenguajes', items: ['Python', 'Python 3.12', 'TypeScript'] },
  { label: 'Frontend', items: ['React', 'React 18', 'Vite', 'Electron'] },
  { label: 'Backend & APIs', items: ['FastAPI', 'NestJS', 'psycopg2'] },
  { label: 'Datos & BD', items: ['PostgreSQL', 'PostgreSQL 16', 'Pandas', 'openpyxl', 'pg_cron'] },
  { label: 'Geoespacial', items: ['ArcGIS API', 'Nominatim', 'Leaflet'] },
  { label: 'Automatización', items: ['Playwright', 'YAML (config-driven)', 'PyYAML'] },
  { label: 'IA & Infraestructura', items: ['Whisper', 'Ollama/Qwen', 'NotebookLM', 'Nginx', 'Docker', 'Netlify', 'Metabase', 'systemd'] },
];
function buildStackGrupos(items) {
  const clasificados = new Set(STACK_CATEGORIAS.flatMap(c => c.items));
  const sinCategoria = items.filter(s => !clasificados.has(s));
  return [...STACK_CATEGORIAS, ...(sinCategoria.length ? [{ label: 'Otros', items: sinCategoria }] : [])]
    .map(g => ({ label: g.label, items: g.items.filter(s => items.includes(s)) }))
    .filter(g => g.items.length);
}

// Panel izquierdo (Tecnologías/Metodologías): sin proyecto seleccionado
// muestra las 29/13 completas como referencia; con un proyecto seleccionado
// muestra SOLO lo que ese proyecto usa — una ficha técnica real, no una
// lista genérica con un par de chips resaltados entre 29.
function buildLeftPanel(p) {
  const stacks = p ? (p.stack || []) : [...new Set(TIMELINE.flatMap(x => x.stack || []))].sort();
  const metodologias = p ? (p.metodologia ? [p.metodologia] : []) : [...new Set(TIMELINE.map(x => x.metodologia).filter(Boolean))];
  const grupos = buildStackGrupos(stacks);
  const tituloTech = p ? `Tecnología de ${p.corto}` : `Tecnologías (${stacks.length})`;
  const tituloMeta = p ? `Metodología de ${p.corto}` : `Metodologías (${metodologias.length})`;
  return `
    <div style="font-size:.66rem; font-weight:800; color:var(--blue); letter-spacing:.06em; margin-bottom:8px; text-transform:uppercase">${icon('laptop', { size: 13 })} ${tituloTech}</div>
    <div id="det-stack-chips">
        ${grupos.length ? grupos.map(g => `
          <div style="margin-bottom:7px">
            <div style="font-size:.58rem; font-weight:700; color:var(--gray3); letter-spacing:.04em; margin-bottom:3px">${g.label}</div>
            <div style="display:flex; gap:4px; flex-wrap:wrap">
              ${g.items.map(s => `<span class="res-chip" data-tech="${s}" style="font-size:.6rem; padding:3px 8px">${s}</span>`).join('')}
            </div>
          </div>`).join('') : `<div style="font-size:.68rem; color:var(--gray3)">Sin stack documentado</div>`}
    </div>
    <div style="font-size:.66rem; font-weight:800; color:var(--blue); letter-spacing:.06em; margin:10px 0 8px; text-transform:uppercase">${icon('compass', { size: 13 })} ${tituloMeta}</div>
    <div id="det-meta-chips" style="display:flex; gap:4px; flex-wrap:wrap">
      ${metodologias.map(m => `<span class="res-chip" data-meta="${m}" style="font-size:.6rem; padding:3px 8px; white-space:normal; line-height:1.3; text-align:left">${m}</span>`).join('') || '—'}
    </div>`;
}
const RED_CAT_COLOR = { fundacion: '0,205,147', produccion: '90,226,128', desarrollo: '255,209,102' };
// Vínculos propios de esta red (no tocan `vinculadoA`, que sigue siendo solo
// de la Línea de Tiempo): actiXuma y AutoReport_Ilio corren en la misma VM
// (bdvanti) que el DataCenter; autoGPS alimenta al Mapa de Contactabilidad
// (geocodifica las direcciones que el mapa cruza contra las llamadas).
const RED_LINKS_EXTRA = [
  ['actixuma', 'datacenter-implementacion'],
  ['autoreport-ilio', 'datacenter-implementacion'],
  ['autogps', 'mapa-contactabilidad'],
  ['auditor-ia', 'datacenter-implementacion'],
  ['notebookevin', 'datacenter-implementacion'],
];
let redNodePos = {}; // id -> {x,y} en % de .red-wrap
let redLinks = [];   // [[idA, idB], ...]
let redActiveId = null;
let redFiltro = 'todos';

function buildRedLinks() {
  const links = [...RED_LINKS_EXTRA];
  TIMELINE.forEach(p => { if (p.vinculadoA) links.push([p.id, p.vinculadoA]); });
  const famGroups = {};
  TIMELINE.forEach(p => { if (p.familia) (famGroups[p.familia] ||= []).push(p.id); });
  Object.values(famGroups).forEach(ids => {
    for (let i = 0; i < ids.length - 1; i++) links.push([ids[i], ids[i + 1]]);
  });
  return links;
}

function initRedNetwork() {
  const content = document.getElementById('red-content');
  const canvas = document.getElementById('red-canvas');
  if (!content || !canvas) return;

  redNodePos = {};
  redLinks = buildRedLinks();
  const MARGIN = 10;
  const nodesHtml = [], labelsHtml = [];

  // DataCenter · Diseño se posiciona pegado a DataCenter · Implementación
  // (misma fila, justo antes) para que su conexión directa se vea clara —
  // aunque por categoría sea "Fundación", separarlo por fila lo alejaba de
  // la fase que le sigue directamente.
  RED_ROWS.forEach(row => {
    let items = TIMELINE.filter(p => p.categoria === row.cat && p.id !== 'datacenter-diseno');
    if (row.cat === 'desarrollo') {
      const dc = TIMELINE.find(p => p.id === 'datacenter-diseno');
      const idx = items.findIndex(p => p.id === 'datacenter-implementacion');
      items.splice(idx, 0, dc);
    }
    const step = (100 - MARGIN * 2) / items.length;
    items.forEach((p, i) => {
      const x = MARGIN + step * (i + 0.5);
      redNodePos[p.id] = { x, y: row.y };
      nodesHtml.push(`<button class="red-node cat-${p.categoria}" data-id="${p.id}" data-cat="${p.categoria}" id="red-node-${p.id}"
          style="left:${x}%; top:${row.y}%" onclick="selectProyectoRed('${p.id}')" title="${p.nombre}">${icon(p.ico, { size: 13 })}</button>`);
      labelsHtml.push(`<div class="red-node-label" data-cat="${p.categoria}" id="red-label-${p.id}" style="left:${x}%; top:${row.y}%">${p.corto}</div>`);
    });
  });

  const rowLabelsHtml = RED_ROWS.map(row => `<div class="red-row-label" style="top:${row.y}%">${row.label}</div>`).join('');

  content.innerHTML = `${rowLabelsHtml}${nodesHtml.join('')}${labelsHtml.join('')}`;

  function resize() {
    const wrap = document.getElementById('red-wrap');
    if (!wrap || wrap.clientWidth === 0) return;
    canvas.width = wrap.clientWidth;
    canvas.height = wrap.clientHeight;
    drawRedLinks();
  }
  window.addEventListener('resize', resize);
  new ResizeObserver(resize).observe(document.getElementById('red-wrap'));
  resize();
}

function drawRedLinks() {
  const canvas = document.getElementById('red-canvas');
  if (!canvas || !canvas.width) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.clearRect(0, 0, W, H);

  redLinks.forEach(([idA, idB]) => {
    const a = redNodePos[idA], b = redNodePos[idB];
    if (!a || !b) return;
    const involved = redActiveId && (redActiveId === idA || redActiveId === idB);
    const dimmed = redActiveId && !involved;
    const ax = a.x / 100 * W, ay = a.y / 100 * H;
    const bx = b.x / 100 * W, by = b.y / 100 * H;
    // Curva que se arquea hacia la derecha del punto más a la derecha de los
    // dos extremos — no un zigzag por el medio (como en la Línea de Tiempo):
    // ahí las filas SON las columnas, aquí serían atajos que cruzan por
    // encima de nodos de otra fila sin relación real, dando la falsa
    // impresión de que están conectados.
    const bowX = Math.max(ax, bx) + 50;
    const midY = (ay + by) / 2;
    ctx.strokeStyle = dimmed ? 'rgba(255,255,255,.04)' : involved ? 'rgba(90,226,128,.55)' : 'rgba(255,255,255,.16)';
    ctx.lineWidth = involved ? 2 : 1.2;
    ctx.setLineDash([2, 4]);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.quadraticCurveTo(bowX, midY, bx, by);
    ctx.stroke();
    ctx.setLineDash([]);
  });
}

function selectProyectoRed(id) {
  const p = TIMELINE.find(x => x.id === id);
  if (!p) return;
  redActiveId = id;

  const connected = new Set([id]);
  redLinks.forEach(([a, b]) => { if (a === id) connected.add(b); if (b === id) connected.add(a); });

  document.querySelectorAll('#red-content .red-node').forEach(n => {
    n.classList.toggle('active', n.dataset.id === id);
    n.classList.toggle('dimmed', !connected.has(n.dataset.id));
  });
  document.querySelectorAll('#red-content .red-node-label').forEach(n => {
    const nid = n.id.replace('red-label-', '');
    n.classList.toggle('active', nid === id);
    n.classList.toggle('dimmed', !connected.has(nid));
  });
  drawRedLinks();

  const catLabel = p.categoria === 'produccion' ? 'Producción' : p.categoria === 'desarrollo' ? 'Desarrollo' : 'Fundación';
  const catBadgeType = p.categoria === 'produccion' ? 'g' : p.categoria === 'desarrollo' ? 'y' : 'teal';
  const info = document.getElementById('red-info');
  if (!info) return;
  // Ficha técnica del proyecto: explicación en lenguaje simple + fecha,
  // responsable y fuente (para que se pueda verificar el dato) — el stack y
  // la metodología ya no se repiten aquí, ahora el panel izquierdo cambia a
  // mostrar SOLO los de este proyecto (ver buildLeftPanel).
  info.innerHTML = `
    <div class="red-info-title">${icon(p.ico, { size: 16 })} ${p.nombre}</div>
    <div class="red-info-badge-row">${badge(catLabel, catBadgeType)}</div>
    <div class="red-info-text">${p.estadoSimple || p.estado}</div>
    <div class="red-info-stats">
      <div class="red-info-stat"><div class="red-info-stat-label">Fecha</div><div class="red-info-stat-val">${p.fecha || '—'}</div></div>
      <div class="red-info-stat"><div class="red-info-stat-label">Responsable</div><div class="red-info-stat-val">${p.responsable || '—'}</div></div>
    </div>
    ${(p.categoria !== 'produccion' && p.pendiente) ? `<div class="red-info-pendiente"><strong>Camino a producción (2S):</strong> ${p.pendiente}</div>` : ''}
    ${p.fuente ? `<div class="red-info-fuente">Fuente: ${p.fuente}</div>` : ''}`;

  const leftPanel = document.getElementById('det-left-panel');
  if (leftPanel) leftPanel.innerHTML = buildLeftPanel(p);

  const kpiGrid = document.getElementById('det-kpi-grid');
  if (kpiGrid) kpiGrid.innerHTML = buildDetKpiGrid(p);
}

// Clic en el fondo de la red (no en un nodo) = quitar la selección y volver
// a ver los 13 proyectos a brillo completo — antes no había forma de "soltar"
// la selección sin recargar la slide.
function clearRedSelection() {
  redActiveId = null;
  document.querySelectorAll('#red-content .red-node, #red-content .red-node-label').forEach(n => {
    n.classList.remove('active', 'dimmed');
  });
  drawRedLinks();
  const info = document.getElementById('red-info');
  if (info) info.innerHTML = `<div class="red-info-empty">${icon('search', { size: 16 })}<br>Haz clic en un proyecto para ver su estado (explicado simple), tecnología y metodología</div>`;
  const leftPanel = document.getElementById('det-left-panel');
  if (leftPanel) leftPanel.innerHTML = buildLeftPanel(null);
  const kpiGrid = document.getElementById('det-kpi-grid');
  if (kpiGrid) kpiGrid.innerHTML = buildDetKpiGrid(null);
}

// KPIs de "Detalle de Proyectos": totales del portafolio por defecto, o las
// cifras del proyecto seleccionado en la Red — dinámico y con poca
// información por tarjeta (no una repetición del panel de info de abajo).
function buildDetKpiGrid(p) {
  if (!p) {
    const enProduccion = TIMELINE.filter(x => x.categoria === 'produccion').length;
    const enDesarrollo = TIMELINE.filter(x => x.categoria === 'desarrollo').length;
    const enFundacion = TIMELINE.filter(x => x.categoria === 'fundacion').length;
    const stacks = [...new Set(TIMELINE.flatMap(x => x.stack || []))];
    const metodologias = [...new Set(TIMELINE.map(x => x.metodologia).filter(Boolean))];
    return `
      <div class="kpi-card" style="padding:10px 16px">
        <div class="kpi-label">Proyectos totales</div>
        <div class="kpi-val">${TIMELINE.length}</div>
        <div class="kpi-sub">${enFundacion} fundación · ${enProduccion} producción · ${enDesarrollo} desarrollo</div>
      </div>
      <div class="kpi-card green" style="padding:10px 16px">
        <div class="kpi-label">Filas de datos gestionadas</div>
        <div class="kpi-val">~24,1 M</div>
        <div class="kpi-sub">OCM + Ilio + actiXuma + Depuración</div>
      </div>
      <div class="kpi-card" style="padding:10px 16px">
        <div class="kpi-label">Tecnologías distintas</div>
        <div class="kpi-val">${stacks.length}</div>
        <div class="kpi-sub">En los 13 proyectos</div>
      </div>
      <div class="kpi-card" style="padding:10px 16px">
        <div class="kpi-label">Metodologías distintas</div>
        <div class="kpi-val">${metodologias.length}</div>
        <div class="kpi-sub">Un enfoque por tipo de problema</div>
      </div>`;
  }
  const catLabel = p.categoria === 'produccion' ? 'Producción' : p.categoria === 'desarrollo' ? 'Desarrollo' : 'Fundación';
  return `
    <div class="kpi-card" style="padding:10px 16px">
      <div class="kpi-label">Proyecto seleccionado</div>
      <div class="kpi-val" style="font-size:1.05rem; line-height:1.25">${p.corto}</div>
      <div class="kpi-sub">${catLabel}</div>
    </div>
    <div class="kpi-card green" style="padding:10px 16px">
      <div class="kpi-label">Volumen</div>
      <div class="kpi-val" style="font-size:.85rem; line-height:1.3">${p.volumen ? p.volumen.split('·')[0].trim() : '—'}</div>
      <div class="kpi-sub">${p.tiempo || 'Sin dato de tiempo'}</div>
    </div>
    <div class="kpi-card" style="padding:10px 16px">
      <div class="kpi-label">Tecnologías</div>
      <div class="kpi-val">${(p.stack || []).length}</div>
      <div class="kpi-sub">${(p.stack || []).join(', ') || '—'}</div>
    </div>
    <div class="kpi-card" style="padding:10px 16px">
      <div class="kpi-label">Metodología</div>
      <div class="kpi-val" style="font-size:.78rem; line-height:1.3">${p.metodologia || '—'}</div>
      <div class="kpi-sub">&nbsp;</div>
    </div>`;
}

/* ── Slide: Tablero de Seguimiento ────────────────────────────── */
function renderTablero() {
  const el = document.getElementById('tablero-body');
  if (!el) return;

  const enProduccion = TIMELINE.filter(p => p.categoria === 'produccion').length;
  const enDesarrollo = TIMELINE.filter(p => p.categoria === 'desarrollo').length;
  const enFundacion = TIMELINE.filter(p => p.categoria === 'fundacion').length;

  el.innerHTML = `
    <div class="kpi-grid" id="det-kpi-grid">
      ${buildDetKpiGrid(null)}
    </div>

    <div class="two-col" style="margin-top:0; grid-template-columns: .82fr 1.6fr .95fr; align-items:stretch; min-height:0; height:466px">
      <div class="panel" id="det-left-panel" style="overflow-y:auto; min-height:0">
        ${buildLeftPanel(null)}
      </div>
      <div class="panel" style="display:flex; flex-direction:column; min-height:0">
        <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; margin-bottom:10px">
          <h3 style="margin-bottom:0; border-bottom:none; padding-bottom:0">${icon('bar-chart-3')} Red de Proyectos</h3>
          <div style="display:flex; gap:6px">
            <button class="det-tab active" data-filter="todos" onclick="filterRed('todos')">Todos (${TIMELINE.length})</button>
            <button class="det-tab" data-filter="fundacion" onclick="filterRed('fundacion')">Fundación (${enFundacion})</button>
            <button class="det-tab" data-filter="produccion" onclick="filterRed('produccion')">Producción (${enProduccion})</button>
            <button class="det-tab" data-filter="desarrollo" onclick="filterRed('desarrollo')">Desarrollo (${enDesarrollo})</button>
          </div>
        </div>
        <div class="red-wrap" id="red-wrap" style="min-height:0; flex:1" onclick="if(event.target===this) clearRedSelection()">
          <canvas class="red-canvas" id="red-canvas" style="pointer-events:none"></canvas>
          <div class="red-content" id="red-content" onclick="if(event.target===this) clearRedSelection()"></div>
        </div>
      </div>
      <div class="panel" style="overflow-y:auto; min-height:0">
        <div class="red-info" id="red-info">
          <div class="red-info-empty">${icon('search', { size: 16 })}<br>Haz clic en un proyecto para ver su estado (explicado simple), tecnología y metodología</div>
        </div>
      </div>
    </div>`;

  initRedNetwork();
}

// Filtro por etapa (Fundación/Producción/Desarrollo) de la Red de Proyectos —
// atenúa los nodos que no son de la categoría elegida, sin recalcular el
// layout (las posiciones ya están fijas por fila de categoría).
function filterRed(cat) {
  redFiltro = cat;
  document.querySelectorAll('.det-tab').forEach(b => b.classList.toggle('active', b.dataset.filter === cat));
  document.querySelectorAll('#red-content .red-node, #red-content .red-node-label').forEach(el => {
    const match = cat === 'todos' || el.dataset.cat === cat;
    el.classList.toggle('dimmed', !match);
  });
}

/* ── Slide: Plan 2S ───────────────────────────────────────────── */
// Plan de Acción 2S: los pendientes reales (campo `pendiente` en
// data_innovacion.js) organizados en 2 categorías según qué tipo de esfuerzo
// requieren — antes eran una sola lista plana de 10 líneas sin distinguir
// "hay que retomar algo que quedó en pausa" de "hay que afinar algo que ya
// funciona en producción". Ningún texto es nuevo, solo reagrupado.
const PLAN_RETOMAR = ['autogps', 'autoconciliacion', 'auditor-ia', 'crm-twenty'];
const PLAN_AJUSTES = ['autocarga-ocm', 'autocomovamos', 'autoreport-ilio', 'actixuma', 'depuracion', 'datacenter-implementacion'];

// Versión corta de cada pendiente (misma info, resumida a una frase de
// acción) — el texto completo real sigue disponible en el tooltip (title).
// alta:true solo donde la fuente lo dice explícitamente (ej. los 3 hallazgos
// de "alta prioridad inmediata" de AutoReport_Ilio) — no se inventan
// prioridades donde el documento no las da.
const PLAN_CORTO = {
  'autogps': { texto: 'Retomar el procesamiento masivo (quedó incompleto)', alta: false },
  'autoconciliacion': { texto: 'Procesar el corte pendiente desde el 30 Jun', alta: false },
  'auditor-ia': { texto: 'Ejecutar por primera vez la evaluación con IA', alta: false },
  'crm-twenty': { texto: 'Reiniciar la máquina y levantar el stack (WSL/Docker)', alta: false },
  'autocarga-ocm': { texto: 'Generar dashboards y ajustar índices de consulta', alta: false },
  'autocomovamos': { texto: 'Migrar la ejecución al DataCenter (hoy corre en local)', alta: false },
  'autoreport-ilio': { texto: 'Resolver 3 hallazgos técnicos de alta prioridad', alta: true },
  'actixuma': { texto: 'Habilitar Retail/Tradicional y acceso fuera de la oficina', alta: false },
  'depuracion': { texto: 'Automatizar envío de correo y carga al motor OCM', alta: false },
  'datacenter-implementacion': { texto: 'Cargar las 7 fuentes de datos que aún faltan', alta: true },
};
const LINEAS_2S_CORTO = [
  'Tablero ejecutivo consolidado del canal',
  'Reportería especializada por área',
  'Proyecciones mensuales y semestrales',
  'Automatización de cargues y flujos',
  'Gobierno de datos por estación/campaña',
  'Evaluación de nuevos CRM y troncales',
];

function renderPlan() {
  const el = document.getElementById('plan-body');
  if (!el) return;

  const porId = ids => ids.map(id => TIMELINE.find(p => p.id === id)).filter(Boolean);
  const itemHtml = p => {
    const c = PLAN_CORTO[p.id];
    return `<li style="font-size:.72rem" title="${p.pendiente.replace(/"/g, '&quot;')}">
      <strong>${p.corto}:</strong> ${c.texto}${c.alta ? ' <span class="pend" style="margin-left:4px">alta prioridad</span>' : ''}
    </li>`;
  };

  const altaCount = Object.values(PLAN_CORTO).filter(c => c.alta).length;

  el.innerHTML = `
    <div class="kpi-grid" style="grid-template-columns: repeat(4, 1fr); gap:12px">
      <div class="kpi-card" style="padding:10px 16px">
        <div class="kpi-label" style="display:flex; align-items:center; gap:5px">${icon('rocket', { size: 12 })} A retomar</div>
        <div class="kpi-val">${PLAN_RETOMAR.length}</div>
        <div class="kpi-sub">Proyectos ya validados, hoy en pausa</div>
      </div>
      <div class="kpi-card" style="padding:10px 16px">
        <div class="kpi-label" style="display:flex; align-items:center; gap:5px">${icon('wrench', { size: 12 })} A ajustar</div>
        <div class="kpi-val">${PLAN_AJUSTES.length}</div>
        <div class="kpi-sub">Ya activos o en producción</div>
      </div>
      <div class="kpi-card green" style="padding:10px 16px">
        <div class="kpi-label" style="display:flex; align-items:center; gap:5px">${icon('target', { size: 12 })} Líneas nuevas</div>
        <div class="kpi-val">${LINEAS_2S_CORTO.length}</div>
        <div class="kpi-sub">Declaradas por Isaac Álvarez para el canal</div>
      </div>
      <div class="kpi-card" style="padding:10px 16px">
        <div class="kpi-label" style="display:flex; align-items:center; gap:5px">${icon('alert-triangle', { size: 12 })} Alta prioridad</div>
        <div class="kpi-val">${altaCount}</div>
        <div class="kpi-sub">AutoReport_Ilio y DataCenter</div>
      </div>
    </div>

    <div class="three-col" style="margin-top:8px; gap:12px">
      <div class="panel" style="padding:10px 16px">
        <h3 style="margin-bottom:6px; padding-bottom:5px">${icon('rocket')} Retomar</h3>
        <div style="font-size:.6rem; color:var(--gray3); margin:-3px 0 5px">Proyectos ya validados, en pausa</div>
        <ul class="check-list" style="gap:5px">
          ${porId(PLAN_RETOMAR).map(itemHtml).join('')}
        </ul>
      </div>
      <div class="panel" style="padding:10px 16px">
        <h3 style="margin-bottom:6px; padding-bottom:5px">${icon('wrench')} Ajustar</h3>
        <div style="font-size:.6rem; color:var(--gray3); margin:-3px 0 5px">Ya activo o en producción</div>
        <ul class="check-list" style="gap:5px">
          ${porId(PLAN_AJUSTES).map(itemHtml).join('')}
        </ul>
      </div>
      <div class="panel" style="padding:10px 16px">
        <h3 style="margin-bottom:6px; padding-bottom:5px">${icon('target')} Nuevas líneas (Isaac)</h3>
        <div style="font-size:.6rem; color:var(--gray3); margin:-3px 0 5px">reporte_isaac.md · canal Televentas</div>
        <ul class="check-list" style="gap:5px">
          ${LINEAS_2S_CORTO.map((l, i) => `<li style="font-size:.72rem" title="${LINEAS_2S[i].replace(/"/g, '&quot;')}">${l}</li>`).join('')}
        </ul>
      </div>
    </div>

    <div class="alert alert-info" style="margin-top:7px; padding:7px 14px">
      <span class="ico">${icon('trending-up')}</span>
      <span><strong>Si se cumple este plan:</strong> 4 proyectos en pausa (autoGPS, autoConciliación, Auditor IA, CRM Twenty) vuelven a estar activos; el DataCenter pasa de sostener 3 servicios reales a las 8 fuentes planeadas; AutoReport_Ilio y el DataCenter cierran sus hallazgos de mayor prioridad; y arrancan las 6 líneas estratégicas que Isaac declaró para el canal.</span>
    </div>

    <div style="margin-top:6px; display:flex; align-items:center; gap:10px; font-size:.68rem; color:var(--gray3)">
      <span style="font-weight:700; letter-spacing:.04em; text-transform:uppercase; color:var(--gray3)">Ejecución 2S</span>
      <span class="res-chip" style="background:rgba(18,1,128,.06); border-color:rgba(18,1,128,.18); color:var(--blue)">Jeam Paul Arcón Solano · construcción</span>
      <span class="res-chip" style="background:rgba(90,226,128,.1); border-color:rgba(90,226,128,.3); color:#1a7a3e">Isaac Álvarez · líneas estratégicas y reglas OCM</span>
    </div>`;
}

/* ── Slide: Trabajo Conjunto · Isaac ↔ JP ─────────────────────── */
// Une RELACION_ISAAC_JP (data_innovacion.js) con los otros dos aportantes de
// conocimiento (Kevin Guzmán, Ing. Sindy Molina) en una sola cuadrícula de
// tarjetas expandibles — antes era una tabla plana + una sección aparte para
// "los otros dos", como si fueran menos importantes.
const COLABORACIONES_EQUIPO = [
  ...RELACION_ISAAC_JP.map(r => ({ contribuyente: 'Isaac Álvarez', ...r })),
  {
    contribuyente: 'Kevin Guzmán',
    proyecto: 'Auditor de Llamadas con IA · notebooKevin',
    isaac: 'Aporta los guiones comerciales y los criterios de auditoría de calidad — qué se evalúa y cómo se califica una llamada.',
    jp: 'Construye el sistema de transcripción + evaluación con IA (Auditor de Llamadas) y el asistente de guiones (notebooKevin).',
  },
  {
    contribuyente: 'Ing. Sindy Molina',
    proyecto: 'autoConciliación · posventa',
    isaac: 'Definió las reglas originales del proceso de posventa (Base Bienvenida CP + RS) — qué confirma una venta como válida.',
    jp: 'Construye el pipeline y ajusta las reglas por ingeniería inversa (prueba y error) para capturar mejoras del sistema que no estaban documentadas.',
  },
];
const EQUIPO_COLOR = { 'Isaac Álvarez': '18,1,128', 'Kevin Guzmán': '0,205,147', 'Ing. Sindy Molina': '255,107,53' };

function renderEquipo() {
  const el = document.getElementById('equipo-body');
  if (!el) return;

  const porContribuyente = {};
  COLABORACIONES_EQUIPO.forEach(c => { (porContribuyente[c.contribuyente] ||= []).push(c); });

  el.innerHTML = `
    <div class="panel">
      <h3>${icon('handshake')} Cómo se construye — conocimiento de negocio + construcción técnica</h3>
      <p style="font-size:.8rem; line-height:1.6; color:var(--dark); margin-bottom:10px">
        El patrón que se repite en casi todos los proyectos: alguien del equipo aporta el conocimiento operativo del negocio
        (qué datos importan, qué reglas aplican) y <strong>Jeam Paul convierte ese conocimiento en el sistema real</strong> —
        arquitectura, código, automatización, despliegue. La única excepción es la lógica OCM de seguimiento operativo,
        que Isaac construye y opera él mismo.
      </p>
      <div class="mini-grid mini-grid-3" style="max-height:none">
        ${COLABORACIONES_EQUIPO.map((r, idx) => {
          // La lógica OCM es la única excepción del patrón: Isaac la construye
          // y opera solo — ahí no se muestra el segundo chip de Jeam Paul.
          const esExcepcion = /No interviene/i.test(r.jp);
          return `
          <div class="mini-card" onclick="toggleCard('equipo-detalle-${idx}','equipo-chev-${idx}')">
            <div class="mini-card-top" style="flex-wrap:wrap; gap:5px">
              <span class="res-chip" style="font-size:.6rem; padding:3px 9px; background:rgba(${EQUIPO_COLOR[r.contribuyente]},.1); border-color:rgba(${EQUIPO_COLOR[r.contribuyente]},.3); color:rgb(${EQUIPO_COLOR[r.contribuyente]})">${r.contribuyente}</span>
              ${esExcepcion ? '' : `<span class="res-chip" style="font-size:.6rem; padding:3px 9px; background:rgba(18,1,128,.06); border-color:rgba(18,1,128,.18); color:var(--blue)">Jeam Paul</span>`}
            </div>
            <div class="mini-card-title">${r.proyecto}</div>
            <div class="ini-detalle" id="equipo-detalle-${idx}" style="padding-left:0; padding-right:0">
              <div style="margin-bottom:6px"><strong style="color:var(--dark)">${r.contribuyente}:</strong> ${r.isaac}</div>
              <div><strong style="color:var(--dark)">Jeam Paul${esExcepcion ? '' : ' construye'}:</strong> ${r.jp}</div>
            </div>
            <div class="mini-card-more">Ver detalle <span id="equipo-chev-${idx}">▾</span></div>
          </div>`;
        }).join('')}
      </div>
      <div style="font-size:.62rem; color:var(--gray3); margin-top:10px">Fuente: PERFILES_Y_ATRIBUCION_INNOVACION.md (2026-07-12), confirmado directamente por Jeam Paul.</div>
    </div>`;
}
