// ============================================================
//  INFORME CANAL TELEVENTAS 2026 – app.js
//  Todos los datos (DATA, ASESORES, CAMPANAS, ESTRATEGIA_INICIATIVAS,
//  EVIDENCIAS, etc.) viven en data_televentas.js, cargado antes que
//  este archivo — mismo patrón que Retail/Tradicional. Este archivo
//  solo arma el HTML de cada slide a partir de esos datos.
// ============================================================

/* ── NAV BAR ─────────────────────────────────────────────────── */
const NAV_LABELS = [
  'Portada', 'Cap. 1', 'Ventas', 'Bases', 'Campañas', 'Autogestión',
  'D. Bienvenida', 'D. Stock', 'D. Masiva', 'D. Satisfechos', 'D. Microseguro', 'D. Cancelaciones',
  'Asesores', 'Iniciativas', 'Cap. 2', 'Contactab.', 'Telefonía', 'Descarte', 'Proyección', 'Estrategia', 'Evidencias', 'Cierre'
];

/* ── STATE ──────────────────────────────────────────────────── */
let current = 0;
let animating = false;
const animated = new Set();
let slides = [];

/* ── INIT ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  slides = Array.from(document.querySelectorAll('.slide'));
  filterSlidesByAudience();
  buildNav();
  scaleSlider();
  window.addEventListener('resize', scaleSlider);
  goTo(initialSlideFromURL(), true);
  document.addEventListener('keydown', onKey);
  document.getElementById('prev-btn').addEventListener('click', prev);
  document.getElementById('next-btn').addEventListener('click', next);
});

/* ── MOTOR DE NAVEGACIÓN ────────────────────────────────────────
   scaleSlider, goTo, next, prev, onKey, buildNav, updateNav,
   updateProgress, triggerAnimations, deckTab, fmt, fmtPct, badge
   viven en ../core/deck-engine.js (compartido con Retail/Tradicional).
   onKey del core ya contempla el lightbox de Evidencias (chequea
   #lightbox-overlay de forma genérica, no-op si no existe).
──────────────────────────────────────────────────────────────── */

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
  renderAutogestion();
  renderDetalleBienvenida();
  renderDetalleStock();
  renderDetalleVoluntarios();
  renderDetalleSatisfechos();
  renderDetalleMicroseguro();
  renderDetalleCancelaciones();
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
  const brecha    = Math.round((3000 - ultimoMes) / ultimoMes * 100);
  const totalMetaVanti = DATA.metaVanti.reduce((a,b)=>a+b,0);
  const totalMetaXuma  = DATA.metaXuma.reduce((a,b)=>a+b,0);

  el.innerHTML = `
    <div class="kpi-grid" style="gap:12px">
      <div class="kpi-card" style="padding:6px 16px">
        <div class="kpi-label">Pólizas liquidadas (1S completo)</div>
        <div class="kpi-val">${fmt(totalLiq)}</div>
        <div class="kpi-sub">Cifra oficial ene–jun</div>
      </div>
      <div class="kpi-card" style="padding:6px 16px">
        <div class="kpi-label">Asesores en equipo</div>
        <div class="kpi-val">${DATA.asesores[0]} → ${Math.max(...DATA.asesores)} → ${DATA.asesores[DATA.asesores.length-1]}</div>
        <div class="kpi-sub">Ene · Pico (abr–may) · Jun</div>
      </div>
      <div class="kpi-card warn" style="padding:6px 16px">
        <div class="kpi-label">Brecha vs. meta 3.000/mes</div>
        <div class="kpi-val">+${brecha} %</div>
        <div class="kpi-sub">Crecimiento necesario sobre junio (${fmt(ultimoMes)}) · mejor mes: ${fmt(maxMes)}</div>
      </div>
    </div>

    <div class="panel" style="padding:6px 16px; margin-top:-2px">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:3px">
        <h3 style="margin:0; border:none; padding:0">${icon('bar-chart-3')} Pólizas vendidas vs. meta</h3>
        <div class="vtas-tabs" style="display:flex; gap:6px">
          <button class="vtas-tab active" data-tab="e1" onclick="vtasTab('e1')">Escala 1</button>
          <button class="vtas-tab" data-tab="vanti" onclick="vtasTab('vanti')">Vanti</button>
          <button class="vtas-tab" data-tab="xuma" onclick="vtasTab('xuma')">Xuma</button>
        </div>
      </div>

      <div class="vtas-pane active" id="vtas-pane-e1">
        <div class="tbl-wrap" style="margin-top:0">
          <table class="tbl-compact" style="font-size:.7rem">
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
                <td class="r">${pctBadge(Math.round(totalLiq / DATA.metaE1.reduce((a,b,i)=>a+(DATA.ventasLiq[i]!=null?b:0),0) * 100))}</td>
                <td class="r">${Math.round(DATA.asesores.reduce((a,b)=>a+b,0) / DATA.asesores.length)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="vtas-pane" id="vtas-pane-vanti">
        <div class="tbl-wrap" style="margin-top:0">
          <table class="tbl-compact" style="font-size:.68rem">
            <thead>
              <tr>
                <th rowspan="2" style="vertical-align:bottom">Mes</th>
                <th rowspan="2" class="r" style="vertical-align:bottom">Asesores</th>
                <th colspan="3" style="text-align:center; border-left:2px solid var(--gray2)">Cuota Protegida (CP)</th>
                <th colspan="3" style="text-align:center; border-left:2px solid var(--gray2)">Combo Vida (VOL)</th>
                <th colspan="3" style="text-align:center; border-left:2px solid var(--gray2)">General</th>
              </tr>
              <tr>
                <th class="r" style="border-left:2px solid var(--gray2)">Venta</th><th class="r">Meta</th><th class="r">Cumplimiento</th>
                <th class="r" style="border-left:2px solid var(--gray2)">Venta</th><th class="r">Meta</th><th class="r">Cumplimiento</th>
                <th class="r" style="border-left:2px solid var(--gray2)">Venta</th><th class="r">Meta</th><th class="r">Cumplimiento</th>
              </tr>
            </thead>
            <tbody>
              ${DATA.meses.map((m,i) => `
                <tr>
                  <td><strong>${m}</strong></td>
                  <td class="r">${DATA.asesores[i]}</td>
                  <td class="r" style="border-left:2px solid var(--gray2)">${fmt(DATA.ventasCP[i])}</td>
                  <td class="r">${fmt(DATA.metaVantiCP[i])}</td>
                  <td class="r">${pctBadge(Math.round(DATA.ventasCP[i]/DATA.metaVantiCP[i]*100))}</td>
                  <td class="r" style="border-left:2px solid var(--gray2)">${fmt(DATA.ventasVOL[i])}</td>
                  <td class="r">${fmt(DATA.metaVantiVOL[i])}</td>
                  <td class="r">${pctBadge(Math.round(DATA.ventasVOL[i]/DATA.metaVantiVOL[i]*100))}</td>
                  <td class="r" style="border-left:2px solid var(--gray2)">${fmt(DATA.ventasCP[i]+DATA.ventasVOL[i])}</td>
                  <td class="r">${fmt(DATA.metaVanti[i])}</td>
                  <td class="r">${pctBadge(Math.round((DATA.ventasCP[i]+DATA.ventasVOL[i])/DATA.metaVanti[i]*100))}</td>
                </tr>`).join('')}
              <tr class="total">
                <td>Total</td>
                <td class="r">${Math.round(DATA.asesores.reduce((a,b)=>a+b,0)/DATA.asesores.length)}</td>
                <td class="r" style="border-left:2px solid var(--gray2)">${fmt(DATA.ventasCP.reduce((a,b)=>a+b,0))}</td>
                <td class="r">${fmt(DATA.metaVantiCP.reduce((a,b)=>a+b,0))}</td>
                <td class="r">${pctBadge(Math.round(DATA.ventasCP.reduce((a,b)=>a+b,0)/DATA.metaVantiCP.reduce((a,b)=>a+b,0)*100))}</td>
                <td class="r" style="border-left:2px solid var(--gray2)">${fmt(DATA.ventasVOL.reduce((a,b)=>a+b,0))}</td>
                <td class="r">${fmt(DATA.metaVantiVOL.reduce((a,b)=>a+b,0))}</td>
                <td class="r">${pctBadge(Math.round(DATA.ventasVOL.reduce((a,b)=>a+b,0)/DATA.metaVantiVOL.reduce((a,b)=>a+b,0)*100))}</td>
                <td class="r" style="border-left:2px solid var(--gray2)">${fmt(totalLiq)}</td>
                <td class="r">${fmt(totalMetaVanti)}</td>
                <td class="r">${pctBadge(Math.round(totalLiq/totalMetaVanti*100))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="vtas-pane" id="vtas-pane-xuma">
        <div class="tbl-wrap" style="margin-top:0">
          <table class="tbl-compact" style="font-size:.68rem">
            <thead>
              <tr>
                <th rowspan="2" style="vertical-align:bottom">Mes</th>
                <th rowspan="2" class="r" style="vertical-align:bottom">Asesores</th>
                <th colspan="3" style="text-align:center; border-left:2px solid var(--gray2)">Cuota Protegida (CP)</th>
                <th colspan="3" style="text-align:center; border-left:2px solid var(--gray2)">Combo Vida (VOL)</th>
                <th colspan="3" style="text-align:center; border-left:2px solid var(--gray2)">General</th>
              </tr>
              <tr>
                <th class="r" style="border-left:2px solid var(--gray2)">Venta</th><th class="r">Meta</th><th class="r">Cumplimiento</th>
                <th class="r" style="border-left:2px solid var(--gray2)">Venta</th><th class="r">Meta</th><th class="r">Cumplimiento</th>
                <th class="r" style="border-left:2px solid var(--gray2)">Venta</th><th class="r">Meta</th><th class="r">Cumplimiento</th>
              </tr>
            </thead>
            <tbody>
              ${DATA.meses.map((m,i) => `
                <tr>
                  <td><strong>${m}</strong></td>
                  <td class="r">${DATA.asesores[i]}</td>
                  <td class="r" style="border-left:2px solid var(--gray2)">${fmt(DATA.ventasCP[i])}</td>
                  <td class="r">${fmt(DATA.metaXumaCP[i])}</td>
                  <td class="r">${pctBadge(Math.round(DATA.ventasCP[i]/DATA.metaXumaCP[i]*100))}</td>
                  <td class="r" style="border-left:2px solid var(--gray2)">${fmt(DATA.ventasVOL[i])}</td>
                  <td class="r">${fmt(DATA.metaXumaVOL[i])}</td>
                  <td class="r">${pctBadge(Math.round(DATA.ventasVOL[i]/DATA.metaXumaVOL[i]*100))}</td>
                  <td class="r" style="border-left:2px solid var(--gray2)">${fmt(DATA.ventasCP[i]+DATA.ventasVOL[i])}</td>
                  <td class="r">${fmt(DATA.metaXuma[i])}</td>
                  <td class="r">${pctBadge(Math.round((DATA.ventasCP[i]+DATA.ventasVOL[i])/DATA.metaXuma[i]*100))}</td>
                </tr>`).join('')}
              <tr class="total">
                <td>Total</td>
                <td class="r">${Math.round(DATA.asesores.reduce((a,b)=>a+b,0)/DATA.asesores.length)}</td>
                <td class="r" style="border-left:2px solid var(--gray2)">${fmt(DATA.ventasCP.reduce((a,b)=>a+b,0))}</td>
                <td class="r">${fmt(DATA.metaXumaCP.reduce((a,b)=>a+b,0))}</td>
                <td class="r">${pctBadge(Math.round(DATA.ventasCP.reduce((a,b)=>a+b,0)/DATA.metaXumaCP.reduce((a,b)=>a+b,0)*100))}</td>
                <td class="r" style="border-left:2px solid var(--gray2)">${fmt(DATA.ventasVOL.reduce((a,b)=>a+b,0))}</td>
                <td class="r">${fmt(DATA.metaXumaVOL.reduce((a,b)=>a+b,0))}</td>
                <td class="r">${pctBadge(Math.round(DATA.ventasVOL.reduce((a,b)=>a+b,0)/DATA.metaXumaVOL.reduce((a,b)=>a+b,0)*100))}</td>
                <td class="r" style="border-left:2px solid var(--gray2)">${fmt(totalLiq)}</td>
                <td class="r">${fmt(totalMetaXuma)}</td>
                <td class="r">${pctBadge(Math.round(totalLiq/totalMetaXuma*100))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div id="vtas-chart-area" style="margin-top:6px"></div>
    </div>`;

  vtasRenderChart('e1');
}

/* Gráfica de la derecha en Ventas: cambia según la pestaña activa.
   Escala 1 = total real por mes; Vanti/Xuma = composición de la META
   por producto (CP vs VOL) — no hay venta real desagregada por producto
   hoy, solo el total (DATA.ventasLiq), por eso aquí se grafica meta. */
/* Mini gráfica de línea en SVG (sin librerías externas) para mostrar
   crecimiento mes a mes de un producto. */
function svgLineChart(values, color, labelFmt) {
  const W = 300, H = 62, padL = 8, padR = 8, padT = 14, padB = 14;
  const min = Math.min(...values), max = Math.max(...values);
  const range = (max - min) || 1;
  const stepX = (W - padL - padR) / (values.length - 1);
  const yFor = v => H - padB - ((v - min) / range) * (H - padT - padB);
  const points = values.map((v,i) => [padL + i*stepX, yFor(v)]);
  const path = points.map((p,i) => (i===0?'M':'L') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const dots = points.map((p,i) => `
    <circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="3" fill="${color}" />
    <text x="${p[0].toFixed(1)}" y="${(p[1]-7).toFixed(1)}" font-size="9" fill="${color}" text-anchor="middle" font-weight="700">${labelFmt(values[i])}</text>
    <text x="${p[0].toFixed(1)}" y="${H-4}" font-size="8" fill="var(--gray3)" text-anchor="middle">${DATA.meses[i]}</text>`).join('');
  return `<svg width="100%" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid meet">
    <path d="${path}" fill="none" stroke="${color}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" />
    ${dots}
  </svg>`;
}

function vtasRenderChart(tab) {
  const area = document.getElementById('vtas-chart-area');
  if (!area) return;

  if (tab === 'e1') {
    area.innerHTML = `
      <div class="panel" style="padding:6px 16px">
        <h3 style="margin-bottom:2px; padding-bottom:2px">${icon('trending-up')} Evolución pólizas por mes</h3>
        <div class="chart-wrap chart-compact" style="margin-top:2px">
          ${DATA.meses.map((m,i) => {
            const v = DATA.ventasLiq[i];
            const pct = (v / Math.max(...DATA.ventasLiq) * 100).toFixed(1) + '%';
            return `
              <div class="bar-row" style="margin-bottom:1px">
                <span class="bar-label">${m}</span>
                <div class="bar-track" style="height:13px"><div class="bar-fill ${DATA.cumplE1[i]>=100?'teal':''}" data-w="${pct}" style="width:0"></div></div>
                <span class="bar-val">${fmt(v)}</span>
              </div>`;
          }).join('')}
        </div>
        <div class="alert alert-info" style="margin-top:6px; padding:6px 14px">
          <span class="ico">${icon('trophy')}</span>
          <span style="font-size:.72rem">El equipo creció 33 % (15→20 asesores) sosteniendo una meta 27 % más alta. Resultado: <strong>13.917 pólizas vendidas en el semestre</strong>, con junio ya recuperando ritmo tras el ajuste de abril-mayo.</span>
        </div>
      </div>`;
    document.querySelectorAll('#vtas-chart-area [data-w]').forEach(el => { el.style.width = el.dataset.w; });
    return;
  }

  const metaCP  = tab === 'vanti' ? DATA.metaVantiCP  : DATA.metaXumaCP;
  const metaVOL = tab === 'vanti' ? DATA.metaVantiVOL : DATA.metaXumaVOL;
  const cp  = DATA.ventasCP;
  const vol = DATA.ventasVOL;
  const totalCP  = cp.reduce((a,b)=>a+b,0);
  const totalVOL = vol.reduce((a,b)=>a+b,0);
  const totalMetaCP  = metaCP.reduce((a,b)=>a+b,0);
  const totalMetaVOL = metaVOL.reduce((a,b)=>a+b,0);
  const cumplCP  = Math.round(totalCP  / totalMetaCP  * 100);
  const cumplVOL = Math.round(totalVOL / totalMetaVOL * 100);
  const totalVentas = totalCP + totalVOL;
  const totalMetaGen = totalMetaCP + totalMetaVOL;
  const cumplGen = Math.round(totalVentas / totalMetaGen * 100);
  const mesesSobreMeta = DATA.meses.filter((_,i) => (cp[i]+vol[i]) >= (metaCP[i]+metaVOL[i])).length;

  area.innerHTML = `
    <div class="two-col" style="gap:12px">
      <div class="panel" style="padding:6px 14px">
        <h3 style="margin-bottom:0; padding-bottom:2px; font-size:.78rem"><span style="display:inline-block; width:8px; height:8px; border-radius:2px; background:var(--teal); margin-right:5px"></span>Crecimiento Cuota Protegida</h3>
        ${svgLineChart(cp, 'var(--teal)', v => fmt(v))}
      </div>
      <div class="panel" style="padding:6px 14px">
        <h3 style="margin-bottom:0; padding-bottom:2px; font-size:.78rem"><span style="display:inline-block; width:8px; height:8px; border-radius:2px; background:var(--blue); margin-right:5px"></span>Crecimiento Combo Vida</h3>
        ${svgLineChart(vol, 'var(--blue)', v => fmt(v))}
      </div>
    </div>
    <div class="alert alert-info" style="margin-top:6px; padding:6px 14px">
      <span class="ico">${icon('trophy')}</span>
      <span style="font-size:.72rem"><strong>${tab === 'vanti' ? 'Vanti' : 'Xuma'}:</strong> <strong>${fmt(totalVentas)} pólizas vendidas</strong> en el semestre — <strong>${cumplGen} %</strong> de la meta general${mesesSobreMeta === 6 ? ', cumpliendo los 6 meses' : mesesSobreMeta >= 3 ? `, con ${mesesSobreMeta} de 6 meses sobre la meta` : ''}. Cuota Protegida aportó ${fmt(totalCP)} (${cumplCP} %) y Combo Vida ${fmt(totalVOL)} (${cumplVOL} %).</span>
    </div>`;
}

function vtasTab(name) {
  document.querySelectorAll('.vtas-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.vtas-pane').forEach(p => p.classList.remove('active'));
  document.getElementById(`vtas-pane-${name}`).classList.add('active');
  vtasRenderChart(name);
}

/* Slide: Consolidado de las Bases */
function renderBases() {
  const el = document.getElementById('bases-body');
  if (!el) return;

  const totalRec  = DATA.registros.reduce((a,b)=>a+b,0);
  const totalRech = DATA.rechazados.reduce((a,b)=>a+b,0);
  const totalApt  = DATA.aptos.reduce((a,b)=>a+b,0);
  const totalGest = DATA.gestionados.reduce((a,b)=>a+b,0);
  const totalCont = DATA.contactados.reduce((a,b)=>a+b,0);
  const totalLiq  = DATA.ventasLiq.reduce((a,b)=>a+b,0);
  const pctRechProm = Math.round(totalRech/totalRec*100);

  const funnel = [
    { label: 'Registros recibidos', val: totalRec,  pct: null,                               nota: 'Bases enviadas por Vanti (Power BI)' },
    { label: 'Aptos para gestión',  val: totalApt,  pct: Math.round(totalApt/totalRec*100),  nota: 'Tras depuración y descarte' },
    { label: 'Gestionados',         val: totalGest, pct: Math.round(totalGest/totalApt*100), nota: 'Registros efectivamente marcados por el equipo' },
    { label: 'Contactados',         val: totalCont, pct: Math.round(totalCont/totalGest*100),nota: 'Clientes con contacto efectivo' },
    { label: 'Ventas (liquidación)',val: totalLiq,  pct: Math.round(totalLiq/totalCont*100), nota: 'Cifra oficial — misma del slide Ventas' },
  ];

  el.innerHTML = `
    <div class="kpi-grid" style="gap:12px">
      <div class="kpi-card" style="padding:8px 16px">
        <div class="kpi-label">Registros recibidos (ene–jun)</div>
        <div class="kpi-val">${fmt(totalRec)}</div>
        <div class="kpi-sub">Fuente: dashboards Power BI</div>
      </div>
      <div class="kpi-card warn" style="padding:8px 16px">
        <div class="kpi-label">Rechazo promedio de base</div>
        <div class="kpi-val">${pctRechProm} %</div>
        <div class="kpi-sub">Solo ${100-pctRechProm} % apto para gestión</div>
      </div>
      <div class="kpi-card green" style="padding:8px 16px">
        <div class="kpi-label">Aptos (gestionables)</div>
        <div class="kpi-val">${fmt(totalApt)}</div>
        <div class="kpi-sub">De ${fmt(totalRec)} recibidos</div>
      </div>
      <div class="kpi-card green" style="padding:8px 16px">
        <div class="kpi-label">Ventas 1S (liquidación)</div>
        <div class="kpi-val">${fmt(totalLiq)}</div>
        <div class="kpi-sub">1 venta por cada ${Math.round(totalRec/totalLiq)} registros recibidos</div>
      </div>
    </div>

    <div class="two-col" style="gap:14px">
      <div class="panel" style="padding:8px 16px">
        <h3 style="margin-bottom:4px; padding-bottom:4px">${icon('calendar')} Volumen y calidad de base por mes</h3>
        <div class="tbl-wrap" style="margin-top:0">
          <table class="tbl-compact" style="font-size:.7rem">
            <thead><tr>
              <th>Mes</th>
              <th class="r">Recibidos</th>
              <th class="r">Rechazados</th>
              <th class="r">% Rechazo</th>
              <th class="r">Aptos</th>
              <th class="r">Ventas</th>
            </tr></thead>
            <tbody>
              ${DATA.meses.map((m,i) => `
                <tr>
                  <td><strong>${m}</strong></td>
                  <td class="r">${fmt(DATA.registros[i])}</td>
                  <td class="r">${fmt(DATA.rechazados[i])}</td>
                  <td class="r">${badge(Math.round(DATA.pctRechazo[i]) + ' %', DATA.pctRechazo[i]>65?'r':DATA.pctRechazo[i]>50?'y':'g')}</td>
                  <td class="r">${fmt(DATA.aptos[i])}</td>
                  <td class="r"><strong>${fmt(DATA.ventasLiq[i])}</strong></td>
                </tr>`).join('')}
              <tr class="total">
                <td>Total</td>
                <td class="r">${fmt(totalRec)}</td>
                <td class="r">${fmt(totalRech)}</td>
                <td class="r">${pctRechProm} %</td>
                <td class="r">${fmt(totalApt)}</td>
                <td class="r">${fmt(totalLiq)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel" style="padding:8px 16px">
        <h3 style="margin-bottom:4px; padding-bottom:4px">${icon('trending-down')} Embudo de la gestión · de la base a la venta (semestre)</h3>
        <div style="display:flex; flex-direction:column; margin-top:6px">
          ${(() => {
            // Anchos visuales (escala raíz cuadrada con mínimo, para que la
            // última etapa no desaparezca: 13.917 es el 1,5 % de 912.083).
            const widths = [100, 64, 60, 40, 28, 20]; // top de cada etapa + bottom final
            const colors = ['#120180', '#1d02b8', '#00CD93', '#2ed9a4', '#5AE280'];
            const darkText = [false, false, true, true, true];
            return funnel.map((f,i) => {
              const wTop = widths[i], wBot = widths[i+1];
              const clip = `polygon(${(100-wTop)/2}% 0, ${(100+wTop)/2}% 0, ${(100+wBot)/2}% 100%, ${(100-wBot)/2}% 100%)`;
              return `
              <div style="display:grid; grid-template-columns: 1fr 200px 1fr; align-items:center; gap:10px">
                <div style="text-align:right">
                  <div style="font-size:.7rem; font-weight:800; color:var(--blue); line-height:1.15">${f.label}</div>
                  <div style="font-size:.56rem; color:var(--gray3); line-height:1.2">${f.nota}</div>
                </div>
                <div style="height:56px; position:relative">
                  <div style="position:absolute; inset:0; background:${colors[i]}; clip-path:${clip}"></div>
                  <div style="position:absolute; inset:0; display:flex; align-items:center; justify-content:center; font-size:.76rem; font-weight:800; color:${darkText[i] ? 'var(--blue)' : '#fff'}">${fmt(f.val)}</div>
                </div>
                <div style="text-align:left; font-size:.62rem; color:var(--gray3)">
                  ${f.pct !== null ? `<strong style="color:var(--teal)">${f.pct} %</strong> del paso anterior` : '100 % · punto de partida'}
                </div>
              </div>`;
            }).join('');
          })()}
        </div>
        <div style="font-size:.54rem; color:var(--gray3); margin-top:4px; text-align:center">Ancho del embudo en escala visual (no lineal) — los valores y porcentajes son los reales.</div>
      </div>
    </div>

    <div class="two-col" style="gap:10px; margin-top:8px">
      <div class="alert alert-warn" style="margin-bottom:0; padding:6px 14px">
        <span class="ico">${icon('alert-triangle')}</span>
        <span style="font-size:.7rem"><strong>El rechazo se duplicó en el 2° trimestre:</strong> pasó del 45–51 % (ene–mar) al 63–76 % (abr–jun). En abril y mayo, solo 1 de cada 4 registros recibidos fue gestionable.</span>
      </div>
      <div class="alert alert-info" style="margin-bottom:0; padding:6px 14px">
        <span class="ico">${icon('lightbulb')}</span>
        <span style="font-size:.7rem"><strong>La causa no es calidad de datos:</strong> el 78 % del descarte son registros re-enviados (49 %) y clientes que ya tienen el producto (29 %). La palanca es <strong>depurar la base en origen</strong> antes del envío.</span>
      </div>
    </div>`;
}

/* Slide: Campañas */
function renderCampanas() {
  const el = document.getElementById('campanas-body');
  if (!el) return;

  const detalleSemestre = [
    { c: 'Bienvenidas CP',       reg: 114696, ventas: 6881, contactab: '79 %', convSC: '19,5 %', perfil: 'g' },
    { c: 'Autogestión',          reg: 11686,  ventas: 791,  contactab: '71 %', convSC: '26,6 %', perfil: 'g' },
    { c: 'CP Stock',             reg: 420641, ventas: 3073, contactab: '49 %', convSC: '4,6 %',  perfil: 'y' },
    { c: 'Masiva Voluntarios',   reg: 255138, ventas: 318,  contactab: '17 %', convSC: '1,9 %',  perfil: 'r' },
    { c: 'CP Clientes Satisf.*', reg: 108659, ventas: 79,   contactab: '19 %', convSC: '1,2 %',  perfil: 'r' },
  ];

  const totalReg    = detalleSemestre.reduce((a, r) => a + r.reg, 0);
  const totalVentas = detalleSemestre.reduce((a, r) => a + r.ventas, 0);
  const convGlobal  = ((totalVentas / totalReg) * 100).toFixed(1).replace('.', ',') + ' %';

  el.innerHTML = `
    <div class="two-col">
      <div class="panel">
        <h3>${icon('target')} Eficiencia por campaña (consolidado ene–jun)</h3>
        <div class="tbl-wrap" style="margin-top:0">
          <table style="font-size:.66rem; width:100%; table-layout:fixed; border-collapse:collapse">
            <colgroup>
              <col style="width:31%">
              <col style="width:15%">
              <col style="width:11%">
              <col style="width:17%">
              <col style="width:26%">
            </colgroup>
            <thead><tr>
              <th style="border-right:1px solid rgba(255,255,255,.2)">Campaña</th>
              <th class="r" style="border-right:1px solid rgba(255,255,255,.2)">Registros</th>
              <th class="r" style="border-right:1px solid rgba(255,255,255,.2)">Ventas</th>
              <th class="r" style="border-right:1px solid rgba(255,255,255,.2)">Contactab.</th>
              <th class="r">Conv. / ctto. aptos</th>
            </tr></thead>
            <tbody>
              ${detalleSemestre.map(r=>`
                <tr>
                  <td style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; border-right:1px solid rgba(0,0,0,.07)">${badge(r.c, r.perfil)}</td>
                  <td class="r" style="white-space:nowrap; border-right:1px solid rgba(0,0,0,.07)">${fmt(r.reg)}</td>
                  <td class="r" style="white-space:nowrap; border-right:1px solid rgba(0,0,0,.07)"><strong>${fmt(r.ventas)}</strong></td>
                  <td class="r" style="white-space:nowrap; border-right:1px solid rgba(0,0,0,.07)">${badge(r.contactab, r.perfil)}</td>
                  <td class="r" style="white-space:nowrap">${badge(r.convSC, r.perfil)}</td>
                </tr>`).join('')}
              <tr class="total">
                <td style="white-space:nowrap; border-right:1px solid rgba(0,0,0,.07)">Total</td>
                <td class="r" style="white-space:nowrap; border-right:1px solid rgba(0,0,0,.07)">${fmt(totalReg)}</td>
                <td class="r" style="white-space:nowrap; border-right:1px solid rgba(0,0,0,.07)">${fmt(totalVentas)}</td>
                <td class="r" style="white-space:nowrap; border-right:1px solid rgba(0,0,0,.07)">40 %</td>
                <td class="r" style="white-space:nowrap">8,6 %</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="font-size:.6rem; color:var(--gray3); margin-top:4px">* Solo activa en enero (base de clientes satisfechos, campaña puntual, no recurrente).</div>
        <div class="alert alert-info" style="margin-top:10px">
          <span class="ico">${icon('lightbulb')}</span>
          <span>En el semestre completo, "Bienvenidas Cuota Protegida" genera el 62 % de las ventas (6.881 de 11.146) con solo el 13 % de los registros.</span>
        </div>
      </div>

      <div class="panel">
        <h3>${icon('clipboard-list')} Perfil de conversión por campaña</h3>
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
          <span class="ico">${icon('alert-circle')}</span>
          <span>"Masiva Voluntarios": conversión 1,9 % vs. benchmark 15 %. Propuesta: segmentar por calidad de base y priorizar contacto en sub-segmentos con potencial &gt;5 %, o pausar y rediseñar screening en 2S.</span>
        </div>
        <div class="alert alert-info" style="margin-top:8px">
          <span class="ico">${icon('target')}</span>
          <span>"CP Stock" alcanza 4,6 % de conversión, prácticamente en el objetivo de esta campaña (solo 5 %, no más). Consolidar estrategia de segmentación y mantener volumen controlado para sostener el desempeño en 2S.</span>
        </div>
      </div>
    </div>`;
}

/* Slide: Autogestión — deep-dive de la campaña con mejor conversión */
function renderAutogestion() {
  const el = document.getElementById('autogestion-body');
  if (!el) return;

  const totalReg   = AUTOGESTION_MESES.reduce((a,b)=>a+b.registros,0);
  const totalVentas = AUTOGESTION_MESES.reduce((a,b)=>a+b.ventas,0);
  const totalContactados = AUTOGESTION_MESES.reduce((a,b)=>a+b.contactados,0);
  const efectProm  = totalVentas / totalContactados * 100;
  const maxEfect   = Math.max(...AUTOGESTION_MESES.map(m=>m.efect));
  const mejorMes   = AUTOGESTION_MESES.find(m=>m.efect===maxEfect);
  const multProm   = efectProm / (DATA.efectividad.reduce((a,b)=>a+b,0)/DATA.efectividad.length);

  el.innerHTML = `
    <div class="kpi-grid" style="gap:12px">
      <div class="kpi-card" style="padding:10px 16px">
        <div class="kpi-label">Registros (1S)</div>
        <div class="kpi-val">${fmt(totalReg)}</div>
        <div class="kpi-sub">Solicitudes de financiación autogestionada</div>
      </div>
      <div class="kpi-card green" style="padding:10px 16px">
        <div class="kpi-label">Ventas (1S)</div>
        <div class="kpi-val">${fmt(totalVentas)}</div>
        <div class="kpi-sub">${fmtPct(efectProm)} sobre contactados</div>
      </div>
      <div class="kpi-card" style="padding:10px 16px">
        <div class="kpi-label">Mejor mes</div>
        <div class="kpi-val">${mejorMes.mes}</div>
        <div class="kpi-sub">${fmtPct(mejorMes.efect)} de conversión</div>
      </div>
      <div class="kpi-card green" style="padding:10px 16px">
        <div class="kpi-label">Vs. promedio general del canal</div>
        <div class="kpi-val">${multProm.toFixed(1)}×</div>
        <div class="kpi-sub">Convierte ${multProm.toFixed(1)} veces mejor que el resto de la base</div>
      </div>
    </div>

    <div class="two-col" style="gap:14px">
      <div class="panel" style="padding:12px 16px">
        <h3 style="margin-bottom:6px; padding-bottom:5px">${icon('bar-chart-3')} Histórico mensual vs. meta ideal Vanti (20 %)</h3>
        <div class="tbl-wrap" style="margin-top:0">
          <table class="tbl-compact">
            <thead><tr>
              <th>Mes</th><th class="r">Registros</th><th class="r">Contactab.</th>
              <th class="r">Conversión</th><th class="r">Vs. meta 20 %</th>
            </tr></thead>
            <tbody>
              ${AUTOGESTION_MESES.map(m => `
                <tr>
                  <td><strong>${m.mes}</strong></td>
                  <td class="r">${fmt(m.registros)}</td>
                  <td class="r">${fmtPct(m.contactab)}</td>
                  <td class="r">${badge(fmtPct(m.efect), m.efect>=20?'g':'y')}</td>
                  <td class="r">${pctBadge(Math.round(m.efect/AUTOGESTION_META_IDEAL*100))}</td>
                </tr>`).join('')}
              <tr class="total">
                <td>Total</td>
                <td class="r">${fmt(totalReg)}</td>
                <td class="r">${fmtPct(totalContactados/AUTOGESTION_MESES.reduce((a,b)=>a+b.aptos,0)*100)}</td>
                <td class="r">${badge(fmtPct(efectProm), 'g')}</td>
                <td class="r">${pctBadge(Math.round(efectProm/AUTOGESTION_META_IDEAL*100))}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel" style="padding:12px 16px">
        <h3 style="margin-bottom:4px; padding-bottom:5px">${icon('trending-up')} Conversión por mes</h3>
        <div class="chart-wrap chart-compact" style="margin-top:2px">
          ${AUTOGESTION_MESES.map(m => {
            const pct = (m.efect / maxEfect * 100).toFixed(1) + '%';
            return `
              <div class="bar-row">
                <span class="bar-label">${m.mes}</span>
                <div class="bar-track">
                  <div class="bar-fill ${m.efect>=20?'teal':''}" data-w="${pct}" style="width:0"></div>
                </div>
                <span class="bar-val">${fmtPct(m.efect)}</span>
              </div>`;
          }).join('')}
        </div>

        <div style="font-size:.6rem; font-weight:700; color:var(--gray3); text-transform:uppercase; letter-spacing:.03em; margin:10px 0 6px">${icon('compass', {size:12})} Qué cambió en la gestión</div>
        <div style="display:flex; align-items:stretch; gap:3px">
          ${[
            ['users',     'Ene–25 mar', 'Todos gestionan', 'Excel manual, sin línea de tiempo'],
            ['user-plus', '26 mar',     'Foco: 3 asesores', 'Equipo dedicado a Autogestión'],
            ['repeat',    'Abr–may',    'Sobremarcación (OCM)', 'Mínima agresividad, más contacto efectivo'],
            ['user-plus', 'Jun',        '+1 asesor (4)', 'Sostiene el mayor volumen del semestre'],
          ].map(([ic,fecha,titulo,det],i)=>`
            ${i>0?'<div style="align-self:center; color:var(--teal); font-weight:800; font-size:.9rem; flex-shrink:0">→</div>':''}
            <div style="flex:1; background:rgba(0,205,147,.07); border:1px solid rgba(0,205,147,.25); border-radius:8px; padding:6px 4px; text-align:center">
              <div style="color:var(--teal)">${icon(ic,{size:15})}</div>
              <div style="font-size:.56rem; font-weight:800; color:var(--gray3); margin-top:2px">${fecha}</div>
              <div style="font-size:.62rem; font-weight:700; color:var(--blue); margin-top:1px; line-height:1.15">${titulo}</div>
              <div style="font-size:.54rem; color:var(--gray3); margin-top:2px; line-height:1.15">${det}</div>
            </div>`).join('')}
        </div>
        <div class="alert alert-info" style="margin-top:8px; padding:6px 12px">
          <span class="ico">${icon('lightbulb', {size:14})}</span>
          <span style="font-size:.66rem">Base ya decidida a comprar (autogestión en la plataforma Vanti) + mejoras de gestión ⇒ <strong>3× la conversión promedio del canal, todos los meses.</strong></span>
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
      <div class="panel" style="padding:14px 18px">
        <h3 style="margin-bottom:8px; padding-bottom:6px">${icon('users')} Equipo completo · pólizas liquidadas por mes (${ASESORES.length} asesores)</h3>
        <div class="tbl-wrap" style="margin-top:0; max-height:460px; overflow-y:auto">
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
          <span>${icon('star', { size: 14 })} Top 5 del semestre</span>
          <span style="color:#c44a1a">rojo = por debajo de la meta E1 del mes</span>
          <span>— = sin liquidación ese mes</span>
        </div>
      </div>

      <div class="panel" style="display:flex; flex-direction:column; padding:14px 18px">
        <h3 style="margin-bottom:8px; padding-bottom:6px">${icon('pin')} Lectura del equipo</h3>

        <!-- Sección: Roster por mes -->
        <div class="asesores-section" style="margin-bottom:10px">
          <div class="asesores-section-label" style="margin-bottom:5px">${icon('users', { size: 14 })} Asesores activos por mes</div>
          <div style="display:flex; align-items:flex-end; gap:8px; flex-wrap:wrap">
            ${['Ene','Feb','Mar','Abr','May','Jun'].map((m,i)=>{
              const n = ROSTER.rosterPorMes[i];
              const fill = n >= 20 ? 'var(--teal)' : n >= 17 ? 'var(--blue)' : 'var(--gray2)';
              return `<div style="text-align:center">
                <div style="width:28px;height:28px;border-radius:8px;background:${fill};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:.74rem;margin:0 auto 2px">${n}</div>
                <div style="font-size:.58rem;color:var(--gray3);font-weight:600">${m}</div>
              </div>`;
            }).join('')}
          </div>
        </div>

        <!-- Sección: Hallazgo top 5 -->
        <div class="asesores-section" style="margin-bottom:10px">
          <div class="alert alert-info" style="margin:0; padding:8px 14px">
            <span class="ico">${icon('star')}</span>
            <span>El top 5 aporta <strong>4.279 pólizas (37 %)</strong> del semestre y los 3 primeros recibieron <strong>meta premium (150)</strong> en junio.</span>
          </div>
        </div>

        <!-- Sección: Incentivos extras -->
        <div class="asesores-section" style="margin-bottom:0">
          <div class="asesores-section-label" style="margin-bottom:5px">${icon('coins', { size: 14 })} Incentivos extras pagados 1S</div>
          <div class="tbl-wrap" style="margin-top:0">
            <table class="tbl-compact">
              <thead><tr><th>Mes</th><th class="r">Eventos</th><th>Detalle</th></tr></thead>
              <tbody>
                ${INCENTIVOS_EXTRAS.map(ie=>`
                  <tr>
                    <td><strong>${ie.mes}</strong></td>
                    <td class="r">${ie.eventos}</td>
                    <td style="font-size:.6rem; color:var(--gray3)">${ie.nota}</td>
                  </tr>`).join('')}
                <tr class="total">
                  <td>Total</td>
                  <td class="r">${INCENTIVOS_EXTRAS.reduce((s,d)=>s+d.eventos,0)}</td>
                  <td style="font-size:.6rem">41 eventos de incentivo en el semestre</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>`;
}

function renderIniciativas() {
  const el = document.getElementById('iniciativas-body');
  if (!el) return;

  const totalCampanas = INICIATIVAS_1S.reduce((s,i)=>s+i.ventas,0);
  const nVanti = INICIATIVAS_1S.filter(i=>i.origen==='Vanti').length;
  const nXuma  = INICIATIVAS_1S.filter(i=>i.origen==='Xuma').length;

  el.innerHTML = `
    <div class="panel">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px">
        <h3 style="margin:0; border:none; padding:0">${icon('rocket')} Lo ejecutado en el 1S</h3>
        <div class="strategy-tabs">
          <button class="strategy-tab active" data-tab="niniciativas" onclick="iniciativasTab('niniciativas')">${icon('target', { size: 14 })} Iniciativas</button>
          <button class="strategy-tab" data-tab="ncap" onclick="iniciativasTab('ncap')">${icon('graduation-cap', { size: 14 })} Capacitaciones</button>
          <button class="strategy-tab" data-tab="nproc" onclick="iniciativasTab('nproc')">${icon('search', { size: 14 })} Monitoreo y procesos</button>
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
          <span class="ico">${icon('graduation-cap')}</span>
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
            <div class="asesores-section-label">${icon('search', { size: 14 })} Monitoreo y acompañamiento</div>
            <div style="display:flex; flex-direction:column; gap:6px">
              ${[
                [icon('phone'),'Monitoreo semanal en vivo','Objeciones, tipificación y corrección inmediata','Se revisa en vivo cómo el asesor debate objeciones, si tipifica correctamente y se corrigen errores al momento.'],
                [icon('repeat'),'Monitoreos ocasionales','Contrastan tipificación vs. la llamada real','Auditorías puntuales en algunos meses para verificar que la tipificación registrada coincida con lo que pasó en la llamada.'],
                [icon('life-buoy'),'Kit de emergencia','Manual de objeciones desde "no interesado"','Se revisan las llamadas tipificadas "no interesado" para nutrir un manual de objeciones que guía al asesor hacia el cierre.'],
                [icon('bar-chart-3'),'Revisión semanal por asesor','Avance, proyección y KPI faltante','Seguimiento individual: cómo va cada asesor, a qué % se proyecta y qué le falta para su meta.'],
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
            <div class="asesores-section-label" style="color:var(--teal)">${icon('settings', { size: 14 })} Cambios de proceso (Xuma)</div>
            <div style="display:flex; flex-direction:column; gap:6px">
              ${[
                [icon('hourglass'),'Exclusiones del seguro','Menor carencia + coberturas adicionales','Se ajustaron las exclusiones dando más beneficios y menor tiempo de carencia, con el guion actualizado para incorporar la nueva asistencia.'],
                [icon('hand'),'Bienvenida autogestión','Trato preferencial y medición de experiencia','Bienvenida exclusiva para clientes que obtuvieron el crédito por autogestión, conociendo cómo perciben esta nueva forma de crédito.'],
                [icon('megaphone'),'Frase de aclaración obligatoria','El asesor deja explícito que es un seguro','Cuando el usuario cree que es solo información, el asesor debe aclarar que se está ofreciendo un seguro, para una venta más transparente.'],
                [icon('target'),'Segmentación y contactabilidad','Por localidad/edad + control de spam/DID','Cargues priorizados según mayor presencia de ventas por localidad o edad, y barrido de contactos sin respuesta más cambio de DID si el número marca como spam.'],
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
    <div style="display:flex; flex-direction:column; gap:8px">
    <div class="kpi-grid" style="gap:12px">
      <div class="kpi-card green" style="padding:8px 16px">
        <div class="kpi-label">Contactabilidad promedio (1S)</div>
        <div class="kpi-val">40,4 %</div>
        <div class="kpi-sub">129.696 contactos en el semestre</div>
      </div>
      <div class="kpi-card green" style="padding:8px 16px">
        <div class="kpi-label">Pico: mayo</div>
        <div class="kpi-val">63,8 %</div>
        <div class="kpi-sub">Jun: 49,1 % (+15 % volumen)</div>
      </div>
      <div class="kpi-card" style="padding:8px 16px">
        <div class="kpi-label">Efectividad prom./contacto</div>
        <div class="kpi-val">8,6 %</div>
        <div class="kpi-sub">Promedio ene–jun (6,7–10,3 %)</div>
      </div>
      <div class="kpi-card warn" style="padding:8px 16px">
        <div class="kpi-label">Contestador (semestre)</div>
        <div class="kpi-val">~54 %</div>
        <div class="kpi-sub">Principal causa de no contacto</div>
      </div>
    </div>

    <div class="ctb-tabs" style="display:flex; gap:8px; margin-bottom:2px">
      <button class="ctb-tab active" data-tab="mes" onclick="contactabTab('mes')">${icon('phone', { size: 14 })} Por mes</button>
      <button class="ctb-tab" data-tab="campana" onclick="contactabTab('campana')">${icon('link', { size: 14 })} Por campaña</button>
    </div>

    <div class="ctb-pane active" id="ctb-pane-mes">
    <div class="two-col" style="gap:10px">
      <div class="panel" style="padding:8px 16px">
        <h3 style="margin-bottom:6px; padding-bottom:5px">${icon('phone')} Contactabilidad por mes</h3>
        <div class="chart-wrap chart-compact">
          ${DATA.meses.map((m,i)=>{
            const pct = DATA.contactabilidad[i].toFixed(0)+'%';
            return `
              <div class="bar-row">
                <span class="bar-label">${m}</span>
                <div class="bar-track">
                  <div class="bar-fill teal" data-w="${pct}" style="width:0"></div>
                </div>
                <span class="bar-val">${DATA.contactabilidad[i].toFixed(1).replace('.',',')} %</span>
              </div>`;
          }).join('')}
        </div>
      </div>

      <div class="panel" style="padding:8px 16px">
        <h3 style="margin-bottom:6px; padding-bottom:5px">${icon('lightbulb')} Efectividad sobre contactados</h3>
        <div class="tbl-wrap" style="margin-top:0">
          <table class="tbl-compact">
            <thead><tr>
              <th>Mes</th><th class="r">Contactados</th>
              <th class="r">Ventas</th><th class="r">Efect.</th>
            </tr></thead>
            <tbody>
              ${DATA.meses.map((m,i)=>{
                const efect = DATA.ventasLiq[i] / DATA.contactados[i] * 100;
                return `
                <tr>
                  <td><strong>${m}</strong></td>
                  <td class="r">${fmt(DATA.contactados[i])}</td>
                  <td class="r">${fmt(DATA.ventasLiq[i])}</td>
                  <td class="r">${badge(fmtPct(efect), efect>=9?'g':efect>=7?'y':'r')}</td>
                </tr>`;}).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="alert alert-info" style="margin-top:10px; padding:8px 14px">
      <span class="ico">${icon('pin')}</span>
      <span><strong>Lo importante:</strong> entre enero (20 %) y mayo (64 %) triplicamos la contactabilidad sin cambiar quién llamamos, solo <strong>cómo y cuándo</strong>. Eso nos trajo 21 % más ventas. <strong>Lectura:</strong> el calendario, horarios y estrategia de llamadas son tan poderosos como la base misma. Febrero y junio bajan porque cambia el mix de campañas (vimos esto arriba). En el 2S, Isaac propone seguir con análisis por franja horaria para identificar ventanas óptimas.</span>
    </div>
    </div>

    <div class="ctb-pane" id="ctb-pane-campana">
    <div class="panel" style="padding:12px 16px">
      <h3 style="margin-bottom:8px; padding-bottom:6px">${icon('link')} Cruce con campañas: el mix explica gran parte de la mejora</h3>
      <div class="tbl-wrap" style="margin-top:0">
        <table class="tbl-compact">
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
        <span class="ico">${icon('lightbulb')}</span>
        <span><strong>Clave:</strong> Los números en el calendario cambian según qué tipo de cliente estamos llamando. Cuando trabajamos con gente que ya nos conoce (CP y Autogestión) los contactamos 4-5 veces mejor (71-79 %) que números nuevos en Masiva Voluntarios (17 %). <strong>Implicación:</strong> mejorar contactabilidad no es solo cuestión de horarios — es el tipo de base. Mejor calidad de números = mejores resultados.</span>
      </div>
    </div>
    </div>
    </div>`;
}

function contactabTab(name) {
  document.querySelectorAll('.ctb-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.ctb-pane').forEach(p => p.classList.remove('active'));
  document.getElementById(`ctb-pane-${name}`).classList.add('active');
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
    <div class="kpi-grid" style="gap:12px">
      <div class="kpi-card" style="padding:10px 16px">
        <div class="kpi-label">Llamadas analizadas</div>
        <div class="kpi-val">628.406</div>
        <div class="kpi-sub">13.516 teléfonos · 972 barrios de Bogotá</div>
      </div>
      <div class="kpi-card green" style="padding:10px 16px">
        <div class="kpi-label">Contactabilidad telefónica</div>
        <div class="kpi-val">38,9 %</div>
        <div class="kpi-sub">Consistente con el 40,4 % operativo del 1S</div>
      </div>
      <div class="kpi-card warn" style="padding:10px 16px">
        <div class="kpi-label">Caídas de troncal</div>
        <div class="kpi-val">69.740</div>
        <div class="kpi-sub">11,1 % de las llamadas se pierden por infraestructura</div>
      </div>
      <div class="kpi-card warn" style="padding:10px 16px">
        <div class="kpi-label">Fallas de red Movistar</div>
        <div class="kpi-val">17,1 %</div>
        <div class="kpi-sub">Congestión 9,96 % + rechazo 7,13 % (Tigo: 0,86 %)</div>
      </div>
    </div>

    <div class="tele-tabs" style="display:flex; gap:8px; margin:10px 0 8px">
      <button class="tele-tab active" data-tab="resumen" onclick="telefoniaTab('resumen')">${icon('radio-tower', { size: 14 })} Tigo vs. Movistar</button>
      <button class="tele-tab" data-tab="zonas" onclick="telefoniaTab('zonas')">${icon('map-pin', { size: 14 })} Zonas críticas por barrio</button>
    </div>

    <div class="tele-pane active" id="tele-pane-resumen">
    <div class="two-col" style="gap:14px">
      <div class="panel" style="padding:12px 16px">
        <h3 style="margin-bottom:6px; padding-bottom:5px">${icon('radio-tower')} Tigo vs. Movistar · volumen, contacto y caídas</h3>
        <div style="display:flex; flex-direction:column; gap:12px; margin-top:2px">
          ${OPS.map(o=>`
            <div>
              <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:5px">
                <span style="font-weight:800; font-size:.86rem; color:var(--blue)">${o.op} <span style="font-weight:600; font-size:.66rem; color:var(--gray3); text-transform:uppercase">(${o.tag})</span></span>
                <span style="font-size:.68rem; color:var(--gray3)">${fmt(o.llamadas)} llamadas</span>
              </div>
              <div class="bar-row" style="margin-bottom:5px">
                <span class="bar-label" style="width:78px">Contacto</span>
                <div class="bar-track">
                  <div class="bar-fill ${o.cls==='teal'?'teal':''}" data-w="${o.contactab}%" style="width:0; ${o.cls==='warn'?'background:linear-gradient(90deg,#e05320,#ff6b35)':''}"></div>
                </div>
                <span class="bar-val">${o.contactab.toFixed(1).replace('.',',')} %</span>
              </div>
              <div class="bar-row">
                <span class="bar-label" style="width:78px">Caídas red</span>
                <div class="bar-track">
                  <div class="bar-fill" data-w="${Math.max(o.caidas,4)}%" style="width:0; background:${o.caidas>5?'linear-gradient(90deg,#c0392b,#e05320)':'linear-gradient(90deg,var(--teal),var(--green))'}"></div>
                </div>
                <span class="bar-val">${o.caidas.toFixed(1).replace('.',',')} %</span>
              </div>
            </div>`).join('')}
        </div>
        <div class="alert alert-warn" style="margin-top:10px; padding:8px 14px">
          <span class="ico">${icon('alert-circle')}</span>
          <span>El <strong>backup (Movistar) carga el 71 % del tráfico</strong> con la red menos estable de las dos: pierde 17 de cada 100 llamadas por congestión o rechazo de troncal, frente a 0,86 % en Tigo.</span>
        </div>
      </div>

      <div class="panel" style="padding:12px 16px">
        <h3 style="margin-bottom:6px; padding-bottom:5px">${icon('link')} Potencial de recuperación (si las caídas se cursan por Tigo)</h3>
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

        <div class="alert alert-info" style="margin-bottom:0; padding:8px 14px">
          <span class="ico">${icon('pin')}</span>
          <span style="font-size:.72rem">Del 59,6 % de "no contacto", al menos <strong>69.740 llamadas (11,1 %)</strong> nunca se cursaron por fallas de red. <strong>Hipótesis a validar con Isaac:</strong> parte de ese insumo termina descartándose luego como "re-enviado" — cruce pendiente de confirmar registro por registro.</span>
        </div>

        <div style="margin-top:12px">
          <div style="font-size:.68rem; font-weight:800; color:var(--blue); letter-spacing:.06em; margin-bottom:6px">${icon('clipboard-list', { size: 14 })} ACCIONES PROPUESTAS (frente tecnológico 2S)</div>
          <ul class="check-list" style="gap:5px">
            <li style="font-size:.72rem">Rebalancear troncales hacia Tigo en zonas periféricas (San Cristóbal, Ciudad Bolívar)</li>
            <li style="font-size:.72rem">Auditoría formal a Movistar: códigos 34 (congestión) y 21 (rechazo)</li>
            <li style="font-size:.72rem">Enrutamiento dinámico: salida obligada por Tigo donde Movistar falla &gt;17 %</li>
          </ul>
        </div>
      </div>
    </div>
    </div>

    <div class="tele-pane" id="tele-pane-zonas">
    <div class="panel">
      <h3>${icon('map-pin')} Zonas críticas de Bogotá · fallas de red por barrio</h3>
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
    </div>
    </div>`;
}

function telefoniaTab(name) {
  document.querySelectorAll('.tele-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.tele-pane').forEach(p => p.classList.remove('active'));
  document.getElementById(`tele-pane-${name}`).classList.add('active');
}

/* Slide: Descarte */
function renderDescarte() {
  const el = document.getElementById('descarte-body');
  if (!el) return;

  el.innerHTML = `
    <div class="two-col">
      <div class="panel">
        <h3>${icon('ban')} Motivos de rechazo de base (semestre ene–jun)</h3>
        <div class="chart-wrap">
          ${DESCARTE_MOTIVOS.map(d=>`
            <div class="bar-row">
              <span class="bar-label" style="width:160px; font-size:.68rem">${d.motivo}</span>
              <div class="bar-track">
                <div class="bar-fill warn" data-w="${d.pct}%" style="width:0; background:linear-gradient(90deg,#e05320,#ff6b35)"></div>
              </div>
              <span class="bar-val">${d.pct} %</span>
            </div>`).join('')}
        </div>
        <div class="alert alert-warn" style="margin-top:16px">
          <span class="ico">${icon('alert-circle')}</span>
          <span>El 78 % del descarte es estructural: bases repetidas + producto activo. <strong>Isaac lo confirma:</strong> se gestionan registros contingentes por falta de insumo oportuno, y al llegar el insumo real la mayoría ya tiene el producto o fue re-enviada en el mismo período (&lt;1 mes).</span>
        </div>
      </div>

      <div class="panel">
        <h3>${icon('calendar-days')} Evolución del rechazo de base</h3>
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
          <h3 style="border:none; padding:0; margin-bottom:8px; color:var(--teal)">${icon('lightbulb')} Recomendaciones de mejora</h3>
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
    <div class="kpi-grid" style="gap:12px">
      <div class="kpi-card" style="padding:8px 16px">
        <div class="kpi-label">Meta mensual objetivo</div>
        <div class="kpi-val">3.000</div>
        <div class="kpi-sub">Pólizas / mes</div>
      </div>
      <div class="kpi-card warn" style="padding:8px 16px">
        <div class="kpi-label">Registros requeridos (estimado)</div>
        <div class="kpi-val">~245K</div>
        <div class="kpi-sub">Con indicadores históricos ene–jun</div>
      </div>
      <div class="kpi-card green" style="padding:8px 16px">
        <div class="kpi-label">Palanca principal</div>
        <div class="kpi-val">Base limpia</div>
        <div class="kpi-sub">Reducir rechazo del 60 % del semestre</div>
      </div>
      <div class="kpi-card" style="padding:8px 16px">
        <div class="kpi-label">Meta agregada equipo Jun</div>
        <div class="kpi-val">${fmt(metaAgregJun)}</div>
        <div class="kpi-sub">${totalEquipoJun} asesores activos · E1 diferenciada</div>
      </div>
    </div>

    <div class="proy-tabs" style="display:flex; gap:8px; margin:8px 0 6px">
      <button class="proy-tab active" data-tab="calc" onclick="proyeccionTab('calc')">${icon('calculator', { size: 14 })} Cálculo histórico</button>
      <button class="proy-tab" data-tab="escenario" onclick="proyeccionTab('escenario')">${icon('rocket', { size: 14 })} Escenario recomendado</button>
    </div>

    <div class="proy-pane active" id="proy-pane-calc">
      <div class="panel" style="padding:14px 18px">
        <h3 style="margin-bottom:8px; padding-bottom:6px">${icon('calculator')} Cálculo con indicadores históricos (semestre ene–jun)</h3>
        <div class="tbl-wrap" style="margin-top:0">
          <table class="tbl-compact">
            <thead><tr><th>Parámetro</th><th class="r">Valor histórico</th><th class="r">Insumo para 3.000</th></tr></thead>
            <tbody>
              <tr><td>Meta ventas/mes</td><td class="r">—</td><td class="r"><strong>3.000</strong></td></tr>
              <tr><td>Efectividad / contactados</td><td class="r">8,59 %</td><td class="r">÷ 8,59 % = <strong>34.908</strong> contactos</td></tr>
              <tr><td>Contactabilidad</td><td class="r">40,4 %</td><td class="r">÷ 40,4 % = <strong>86.427</strong> gestionados</td></tr>
              <tr><td>% Gestión sobre aptos</td><td class="r">88,3 %</td><td class="r">÷ 88,3 % = <strong>97.902</strong> aptos</td></tr>
              <tr><td>% Aptos (1–rechazo)</td><td class="r">39,9 %</td><td class="r">÷ 39,9 % = <strong>~245.500</strong> recibidos</td></tr>
              <tr class="total"><td colspan="2">${icon('package')} Registros mínimos requeridos/mes</td><td class="r">235.000–260.000</td></tr>
            </tbody>
          </table>
        </div>

        <!-- ESQUEMA DE COMISIONES RESUMEN -->
        <div style="margin-top:10px">
          <div style="font-size:.7rem; font-weight:800; color:var(--blue); letter-spacing:.06em; margin-bottom:5px">ESQUEMA COMISIONES 1S — EVOLUCIÓN</div>
          <div style="display:flex; flex-direction:column; gap:2px">
            ${ESQUEMA_MESES.map(e=>{
              const hasVolante = e.volante ? `<span style="color:var(--teal);font-weight:700"> + Volante ${e.volante} pól.</span>` : '';
              const bgCol = e.novedades.includes('sube')||e.novedades.includes('diferenciadas')||e.novedades.includes('Volante') ? 'rgba(0,205,147,.08)' : 'transparent';
              return `<div style="display:flex;gap:8px;align-items:baseline;font-size:.68rem;padding:2px 6px;border-radius:6px;background:${bgCol}">
                <span style="font-weight:800;color:var(--blue);min-width:28px">${e.mes}</span>
                <span>E1 <strong>${e.e1meta}</strong> pol. con bonificación base${hasVolante}</span>
                ${e.novedades!=='Sin cambios'?`<span style="color:var(--gray3);font-style:italic;font-size:.64rem">← ${e.novedades}</span>`:''}
              </div>`;
            }).join('')}
          </div>
        </div>
      </div>
    </div>

    <div class="proy-pane" id="proy-pane-escenario">
      <div class="panel" style="padding:6px 16px">
        <h3 style="margin-bottom:2px; padding-bottom:2px">${icon('rocket')} Escenario con base depurada (recomendado)</h3>

        <!-- Flujo de 3 pasos -->
        <div style="display:flex; align-items:stretch; gap:8px; margin:4px 0">
          ${[
            ['Paso 1 · Depurar', '60 % → 35 %', 'de rechazo, excluyendo re-envíos y producto activo'],
            ['Paso 2 · Aptos', '64K → 110K', 'registros aptos/mes con los mismos ~170K recibidos'],
            ['Paso 3 · Ventas', '≈ 3.760', 'ventas/mes potenciales — supera la meta de 3.000'],
          ].map(([paso, cifra, det], i)=>`
            ${i>0?'<div style="align-self:center; color:var(--teal); font-weight:800; font-size:1.1rem; flex-shrink:0">→</div>':''}
            <div style="flex:1; display:flex; flex-direction:column; justify-content:center; background:rgba(0,205,147,.07); border:1px solid rgba(0,205,147,.3); border-radius:10px; padding:6px 10px; text-align:center; min-height:60px">
              <div style="font-size:.58rem; font-weight:800; color:var(--teal); letter-spacing:.05em; text-transform:uppercase; margin-bottom:2px">${paso}</div>
              <div style="font-size:.98rem; font-weight:800; color:var(--blue); line-height:1; margin-bottom:2px">${cifra}</div>
              <div style="font-size:.58rem; color:var(--gray3); line-height:1.25">${det}</div>
            </div>`).join('')}
        </div>
        <div style="font-size:.6rem; color:var(--gray3); text-align:center; margin-bottom:2px">Premisas del cálculo: 88 % gestión · 45 % contactabilidad · 8,6 % conversión (históricos 1S)</div>

        <!-- Notas complementarias -->
        <ul class="check-list" style="gap:1px; margin:2px 0">
          <li style="font-size:.68rem"><strong>Validado por Isaac:</strong> la deduplicación en origen es viable (registro del distribuidor + validación de fuentes). Su meta de corto plazo: rechazo <strong>≤ 50 %</strong> como escalón intermedio hacia el 35 %.</li>
          <li style="font-size:.68rem">Priorizar <strong>Bienvenidas CP</strong> y <strong>Autogestión</strong> (conversión 17–33 % sobre contacto) reduce el volumen necesario a la mitad.</li>
          <li style="font-size:.68rem">Capacidad del equipo: meta agregada jun = <strong>${fmt(metaAgregJun)} pólizas</strong> (${totalEquipoJun} asesores, ${Math.round(metaAgregJun/totalEquipoJun)} pol/asesor). Para 3.000 → <strong>~150 pol/asesor con 20 asesores</strong>.</li>
        </ul>

        <!-- KPIs propuestos 2S -->
        <div style="margin-top:4px">
          <div style="font-size:.64rem; font-weight:800; color:var(--blue); letter-spacing:.06em; margin-bottom:2px">${icon('ruler', { size: 14 })} KPIs PROPUESTOS PARA EL SEGUIMIENTO 2S</div>
          <div class="tbl-wrap" style="margin-top:0">
            <table class="tbl-compact">
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

        <div class="alert alert-info" style="margin-top:2px; padding:4px 14px">
          <span class="ico">${icon('pin')}</span>
          <span style="font-size:.7rem">El camino a 3.000 pasa más por <strong>calidad y depuración de base</strong> que por aumentar el volumen bruto de registros. Cálculo con el semestre completo (ene–jun), liquidación de junio ya incluida.</span>
        </div>
      </div>
    </div>`;
}

function proyeccionTab(name) {
  document.querySelectorAll('.proy-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.proy-pane').forEach(p => p.classList.remove('active'));
  document.getElementById(`proy-pane-${name}`).classList.add('active');
}

/* Slide: Estrategia 2S */
function renderEstrategia() {
  const el = document.getElementById('estrategia-body');
  if (!el) return;

  el.innerHTML = `
    <div class="panel">
      <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:12px">
        <h3 style="margin:0; border:none; padding:0">${icon('target')} Estrategia Comercial 2S 2026</h3>
        <div class="strategy-tabs">
          <button class="strategy-tab active" data-tab="ini" onclick="estrategiaTab('ini')">${icon('lightbulb', { size: 14 })} Iniciativas</button>
          <button class="strategy-tab" data-tab="cron" onclick="estrategiaTab('cron')">${icon('calendar', { size: 14 })} Cronograma</button>
          <button class="strategy-tab" data-tab="kpi" onclick="estrategiaTab('kpi')">${icon('trending-up', { size: 14 })} KPIs</button>
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
          <div style="font-size:.68rem; font-weight:800; color:var(--blue); letter-spacing:.05em; text-transform:uppercase; margin-bottom:6px">${icon('users', { size: 14 })} Recursos clave requeridos</div>
          <div style="display:flex; gap:8px; flex-wrap:wrap">
            <span class="res-chip">${icon('plus', { size: 14 })} 3 asesores nuevos en julio (→23 en operación)</span>
            <span class="res-chip">${icon('laptop', { size: 14 })} CRM con validaciones automáticas</span>
            <span class="res-chip">${icon('sparkles', { size: 14 })} Bases limpias contra producto ya activo (Vanti)</span>
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

/* Slide: Evidencias fotográficas — tarjetas estilo Instagram (carrusel de 3 fotos c/u). */
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

/* ── NUEVAS FUNCIONES DE RENDER DETALLE DE CAMPAÑAS ──────────────── */

function renderDetalleBienvenida() {
  const data = {
    kpisBase: [
      { mes: 'Enero', recibidos: 14772, rechazados: 8485, pctRechazo: '57,4', aptos: 6287, ventas: 1208, pctVentaRec: '19,2' },
      { mes: 'Febrero', recibidos: 19573, rechazados: 11134, pctRechazo: '56,9', aptos: 8439, ventas: 1435, pctVentaRec: '17,0' },
      { mes: 'Marzo', recibidos: 21421, rechazados: 13486, pctRechazo: '63,0', aptos: 7935, ventas: 1119, pctVentaRec: '14,1' },
      { mes: 'Abril', recibidos: 19096, rechazados: 10792, pctRechazo: '56,5', aptos: 8304, ventas: 1086, pctVentaRec: '13,1' },
      { mes: 'Mayo', recibidos: 20067, rechazados: 13166, pctRechazo: '65,6', aptos: 6901, ventas: 1068, pctVentaRec: '15,5' },
      { mes: 'Junio', recibidos: 19767, rechazados: 13203, pctRechazo: '66,8', aptos: 6564, ventas: 965, pctVentaRec: '14,7' }
    ],
    tipificacionRechazo: [
      { motivo: 'Cuota Protegida Activa', cant: 35758, pct: '50,9' },
      { motivo: 'Contrato Repetido', cant: 12760, pct: '18,2' },
      { motivo: 'Registro Enviado Anteriormente', cant: 7027, pct: '10,0' },
      { motivo: 'Microseguro Activo', cant: 5916, pct: '8,4' },
      { motivo: 'Registro Recibido Anteriormente', cant: 4624, pct: '6,6' },
      { motivo: 'Registro con Localidad Errónea', cant: 1912, pct: '2,7' },
      { motivo: 'Cédula/Teléfono Repetido', cant: 1070, pct: '1,5' },
      { motivo: 'Excede límite de edad (>80 años)', cant: 420, pct: '0,6' },
      { motivo: 'Otros motivos menores', cant: 779, pct: '1,1' }
    ],
    tipificacionAptos: [
      { desc: 'CONTACTO EFECTIVO', cant: 38250, pct: '78,7', isTitle: true },
      { desc: 'Venta exitosa (CP + Autogestión)', cant: 7672, pct: '15,8' },
      { desc: 'No interesado por el producto', cant: 14908, pct: '30,7' },
      { desc: 'Cuelga la llamada', cant: 4822, pct: '9,9' },
      { desc: 'Agendado / llamada posterior', cant: 2971, pct: '6,1' },
      { desc: 'No es responsable del pago', cant: 2501, pct: '5,1' },
      { desc: 'Datos errados / experiencia', cant: 1847, pct: '3,8' },
      { desc: 'No interesado por el precio', cant: 1126, pct: '2,3' },
      { desc: 'Otros motivos menores', cant: 2403, pct: '4,9' },
      { desc: 'NO CONTACTO', cant: 10362, pct: '21,3', isTitle: true },
      { desc: 'Contestador automático', cant: 6837, pct: '14,1' },
      { desc: 'No contesta', cant: 2442, pct: '5,0' },
      { desc: 'Teléfono apagado / fuera de servicio', cant: 1033, pct: '2,1' },
      { desc: 'Otros no contacto', cant: 50, pct: '0,1' }
    ],
    observaciones: [
      "Esta base tiene la **mayor contactabilidad del canal (78,7 % Semestre)** y una efectividad sobresaliente.",
      "El descarte principal es **Cuota Protegida Activa (50,9 %)**, lo que indica que el 1S se depuró correctamente contra clientes vigentes antes de lanzar el marcador.",
      "**Venta Exitosa** representa el **15,8 % de la gestión de leads aptos**, convirtiéndose en el motor de ventas del canal."
    ]
  };
  renderCampanaDeepDive('detalle-bienvenida-body', data);
}

function renderDetalleStock() {
  const data = {
    kpisBase: [
      { mes: 'Enero', recibidos: 20864, rechazados: 12781, pctRechazo: '61,3', aptos: 8083, ventas: 322, pctVentaRec: '4,0' },
      { mes: 'Febrero', recibidos: 50266, rechazados: 25419, pctRechazo: '50,6', aptos: 24847, ventas: 441, pctVentaRec: '1,8' },
      { mes: 'Marzo', recibidos: 69741, rechazados: 41761, pctRechazo: '59,9', aptos: 27980, ventas: 600, pctVentaRec: '2,1' },
      { mes: 'Abril', recibidos: 82833, rechazados: 53460, pctRechazo: '64,5', aptos: 29373, ventas: 345, pctVentaRec: '1,2' },
      { mes: 'Mayo', recibidos: 82833, rechazados: 53460, pctRechazo: '64,5', aptos: 29373, ventas: 750, pctVentaRec: '2,6' },
      { mes: 'Junio', recibidos: 114104, rechazados: 74819, pctRechazo: '65,6', aptos: 39285, ventas: 615, pctVentaRec: '1,6' }
    ],
    tipificacionRechazo: [
      { motivo: 'Registro Enviado Anteriormente', cant: 96218, pct: '36,8' },
      { motivo: 'Cuota Protegida Activa', cant: 85455, pct: '32,7' },
      { motivo: 'Registro Recibido Anteriormente', cant: 21047, pct: '8,0' },
      { motivo: 'Dirección Repetida', cant: 19533, pct: '7,5' },
      { motivo: 'Microseguro Activo', cant: 13637, pct: '5,2' },
      { motivo: 'Teléfono Repetido', cant: 7059, pct: '2,7' },
      { motivo: 'Cédula Repetida', cant: 5053, pct: '1,9' },
      { motivo: 'Excede límite de edad (>80 años)', cant: 4544, pct: '1,7' },
      { motivo: 'Otros motivos menores', cant: 9154, pct: '3,5' }
    ],
    tipificacionAptos: [
      { desc: 'CONTACTO EFECTIVO', cant: 67420, pct: '49,4', isTitle: true },
      { desc: 'Venta exitosa', cant: 3073, pct: '2,3' },
      { desc: 'No interesado por el producto', cant: 24996, pct: '18,3' },
      { desc: 'Cuelga la llamada', cant: 14356, pct: '10,5' },
      { desc: 'No es responsable del pago', cant: 5881, pct: '4,3' },
      { desc: 'Datos errados / experiencia', cant: 7026, pct: '5,2' },
      { desc: 'No interesado por el precio', cant: 3063, pct: '2,3' },
      { desc: 'Agendado / llamada posterior', cant: 2911, pct: '2,1' },
      { desc: 'Otros motivos menores', cant: 6214, pct: '4,6' },
      { desc: 'NO CONTACTO', cant: 68940, pct: '50,6', isTitle: true },
      { desc: 'Contestador automático', cant: 56723, pct: '41,6' },
      { desc: 'No contesta', cant: 8594, pct: '6,3' },
      { desc: 'Teléfono apagado / fuera de servicio', cant: 3347, pct: '2,5' },
      { desc: 'Otros no contacto', cant: 276, pct: '0,2' }
    ],
    observaciones: [
      "CP Stock es la **base de mayor volumen (420.641 registros recibidos)** en el semestre.",
      "El descarte estructural de **Registro Enviado Anteriormente (36,8 %)** y **Cuota Activa (32,7 %)** suma el **69,5 % del rechazo**, confirmando el agotamiento de la base.",
      "El no contacto es muy alto (**50,6 %**), impulsado por contestadores automáticos (**41,6 %**), lo que exige depuración telefónica en 2S."
    ]
  };
  renderCampanaDeepDive('detalle-stock-body', data);
}

function renderDetalleVoluntarios() {
  const data = {
    kpisBase: [
      { mes: 'Enero', recibidos: 55557, rechazados: 4225, pctRechazo: '7,6', aptos: 51332, ventas: 31, pctVentaRec: '0,1' },
      { mes: 'Febrero', recibidos: 24673, rechazados: 11397, pctRechazo: '46,2', aptos: 13276, ventas: 123, pctVentaRec: '0,9' },
      { mes: 'Marzo', recibidos: 41870, rechazados: 4562, pctRechazo: '10,9', aptos: 37308, ventas: 21, pctVentaRec: '0,1' },
      { mes: 'Abril', recibidos: 49232, rechazados: 48734, pctRechazo: '99,0', aptos: 498, ventas: 0, pctVentaRec: '0,0' },
      { mes: 'Mayo', recibidos: 49232, rechazados: 48734, pctRechazo: '99,0', aptos: 498, ventas: 5, pctVentaRec: '1,0' },
      { mes: 'Junio', recibidos: 34574, rechazados: 17661, pctRechazo: '51,1', aptos: 16913, ventas: 138, pctVentaRec: '0,8' }
    ],
    tipificacionRechazo: [
      { motivo: 'Registro Enviado Anteriormente', cant: 103678, pct: '76,6' },
      { motivo: 'Registro Recibido Anteriormente', cant: 11261, pct: '8,3' },
      { motivo: 'Supera edad para Microseguro (69 años)', cant: 5948, pct: '4,4' },
      { motivo: 'Excede límite de edad (>69 años)', cant: 4495, pct: '3,3' },
      { motivo: 'Seguro Voluntario Activo', cant: 2330, pct: '1,7' },
      { motivo: 'Teléfono Vacío', cant: 2145, pct: '1,6' },
      { motivo: 'Microseguro Activo', cant: 922, pct: '0,7' },
      { motivo: 'Otros motivos menores', cant: 4534, pct: '3,4' }
    ],
    tipificacionAptos: [
      { desc: 'CONTACTO EFECTIVO', cant: 16926, pct: '17,0', isTitle: true },
      { desc: 'Venta exitosa', cant: 318, pct: '0,3' },
      { desc: 'No interesado por el producto', cant: 6037, pct: '6,1' },
      { desc: 'Cuelga la llamada', cant: 4035, pct: '4,0' },
      { desc: 'No es responsable del pago', cant: 1701, pct: '1,7' },
      { desc: 'No interesado por el precio / datos', cant: 2583, pct: '2,6' },
      { desc: 'Agendado / llamada posterior', cant: 657, pct: '0,7' },
      { desc: 'Otros motivos menores', cant: 1595, pct: '1,6' },
      { desc: 'NO CONTACTO', cant: 82895, pct: '83,0', isTitle: true },
      { desc: 'Contestador automático', cant: 80769, pct: '80,9' },
      { desc: 'No contesta', cant: 1640, pct: '1,6' },
      { desc: 'Teléfono apagado / fuera de servicio', cant: 256, pct: '0,3' },
      { desc: 'Otros no contacto', cant: 230, pct: '0,2' }
    ],
    observaciones: [
      "Esta base tiene una **contactabilidad crítica muy baja (17,0 %)**, con un rechazo promedio del **53,04 %**.",
      "El no contacto es el más alto del portafolio (**83,0 %**), impulsado masivamente por **Contestadores (80,9 %)**, lo que indica bases quemadas o números desactualizados.",
      "En abril y mayo el rechazo llegó al **99 %** porque se enviaron registros duplicados. **Junio mostró recuperación (138 ventas y 4,92 % conversión)** al actualizarse la base."
    ]
  };
  renderCampanaDeepDive('detalle-voluntarios-body', data);
}

function renderDetalleSatisfechos() {
  const data = {
    kpisBase: [
      { mes: 'Enero', recibidos: 108659, rechazados: 73431, pctRechazo: '67,6', aptos: 35228, ventas: 79, pctVentaRec: '0,2' },
      { mes: 'Febrero', recibidos: 0, rechazados: 0, pctRechazo: '—', aptos: 0, ventas: 0, pctVentaRec: '—' },
      { mes: 'Marzo', recibidos: 0, rechazados: 0, pctRechazo: '—', aptos: 0, ventas: 0, pctVentaRec: '—' },
      { mes: 'Abril', recibidos: 0, rechazados: 0, pctRechazo: '—', aptos: 0, ventas: 0, pctVentaRec: '—' },
      { mes: 'Mayo', recibidos: 0, rechazados: 0, pctRechazo: '—', aptos: 0, ventas: 0, pctVentaRec: '—' },
      { mes: 'Junio', recibidos: 0, rechazados: 0, pctRechazo: '—', aptos: 0, ventas: 0, pctVentaRec: '—' }
    ],
    tipificacionRechazo: [
      { motivo: 'Registro Enviado Anteriormente', cant: 43210, pct: '58,8' },
      { motivo: 'Cuota Protegida Activa / Producto Activo', cant: 22105, pct: '30,1' },
      { motivo: 'Teléfono Errado / Sin Teléfono', cant: 4120, pct: '5,6' },
      { motivo: 'NIT de empresa / No apto', cant: 2980, pct: '4,1' },
      { motivo: 'Otros motivos menores', cant: 1016, pct: '1,4' }
    ],
    tipificacionAptos: [
      { desc: 'CONTACTO EFECTIVO', cant: 6536, pct: '18,6', isTitle: true },
      { desc: 'Venta exitosa', cant: 79, pct: '1,2' },
      { desc: 'No interesado por el producto', cant: 3210, pct: '9,1' },
      { desc: 'Cuelga la llamada / experiencia', cant: 1845, pct: '5,2' },
      { desc: 'Otros motivos menores', cant: 1402, pct: '4,0' },
      { desc: 'NO CONTACTO', cant: 28692, pct: '81,4', isTitle: true },
      { desc: 'Contestador automático', cant: 22104, pct: '62,7' },
      { desc: 'No contesta / apagado', cant: 6588, pct: '18,7' }
    ],
    observaciones: [
      "Esta base **sólo estuvo activa en enero de 2026** (campaña táctica sobre base histórica de clientes satisfechos).",
      "Mostró un descarte muy alto (**67,58 %**) y una bajísima efectividad sobre contacto (**1,21 %**), lo que justifica que se haya pausado a partir de febrero.",
      "El contestador fue el gran bloqueador en enero, consumiendo el **62,7 % de los registros aptos gestionados**."
    ]
  };
  renderCampanaDeepDive('detalle-satisfechos-body', data);
}

function renderDetalleMicroseguro() {
  const data = {
    kpisBase: [
      { mes: 'Enero', recibidos: 1368, rechazados: 5, pctRechazo: '0,4', aptos: 1363, ventas: 264, pctVentaRec: '19,3' },
      { mes: 'Febrero', recibidos: 1575, rechazados: 4, pctRechazo: '0,3', aptos: 1571, ventas: 254, pctVentaRec: '16,1' },
      { mes: 'Marzo', recibidos: 1147, rechazados: 4, pctRechazo: '0,3', aptos: 1143, ventas: 158, pctVentaRec: '13,8' },
      { mes: 'Abril', recibidos: 1737, rechazados: 2, pctRechazo: '0,1', aptos: 1735, ventas: 135, pctVentaRec: '7,8' },
      { mes: 'Mayo', recibidos: 1865, rechazados: 3, pctRechazo: '0,2', aptos: 1862, ventas: 287, pctVentaRec: '15,4' },
      { mes: 'Junio', recibidos: 1705, rechazados: 1, pctRechazo: '0,1', aptos: 1704, ventas: 211, pctVentaRec: '12,4' }
    ],
    tipificacionRechazo: [
      { motivo: 'Microseguro Activo / Ya Posee el Producto', cant: 12, pct: '63,2' },
      { motivo: 'Registro Enviado Anteriormente', cant: 5, pct: '26,3' },
      { motivo: 'Otros motivos menores', cant: 2, pct: '10,5' }
    ],
    tipificacionAptos: [
      { desc: 'CONTACTO EFECTIVO', cant: 7400, pct: '78,9', isTitle: true },
      { desc: 'Venta exitosa', cant: 1309, pct: '14,0' },
      { desc: 'No interesado por el producto', cant: 2508, pct: '26,8' },
      { desc: 'Cuelga la llamada', cant: 939, pct: '10,0' },
      { desc: 'No cumple requisito de edad (>69 años)', cant: 746, pct: '8,0' },
      { desc: 'Agendado / llamada posterior', cant: 505, pct: '5,4' },
      { desc: 'No es responsable del pago', cant: 386, pct: '4,1' },
      { desc: 'Otros motivos menores', cant: 1008, pct: '10,7' },
      { desc: 'NO CONTACTO', cant: 1978, pct: '21,1', isTitle: true },
      { desc: 'Contestador automático', cant: 1244, pct: '13,3' },
      { desc: 'No contesta', cant: 555, pct: '5,9' },
      { desc: 'Teléfono apagado / fuera de servicio', cant: 161, pct: '1,7' },
      { desc: 'Otros no contacto', cant: 18, pct: '0,2' }
    ],
    observaciones: [
      "La campaña Microseguro tiene un **nivel de rechazo casi nulo (<1 %)** porque es base ultra-filtrada.",
      "Muestra una contactabilidad excelente (**78,91 %**) y una conversión sobre contacto muy alta (**17,69 % promedio, llegando a 22,04 % en enero**).",
      "**Venta Exitosa** es el **14,0 % de la gestión total de Leads**, consolidándose como un canal de gran eficiencia a menor escala."
    ]
  };
  renderCampanaDeepDive('detalle-microseguro-body', data);
}

function renderDetalleCancelaciones() {
  const data = {
    kpisBase: [
      { mes: 'Enero', recibidos: 1263, rechazados: 198, pctRechazo: '15,7', aptos: 1065, ventas: 4, pctVentaRec: '0,3' },
      { mes: 'Febrero', recibidos: 0, rechazados: 0, pctRechazo: '—', aptos: 0, ventas: 0, pctVentaRec: '—' },
      { mes: 'Marzo', recibidos: 0, rechazados: 0, pctRechazo: '—', aptos: 0, ventas: 0, pctVentaRec: '—' },
      { mes: 'Abril', recibidos: 0, rechazados: 0, pctRechazo: '—', aptos: 0, ventas: 0, pctVentaRec: '—' },
      { mes: 'Mayo', recibidos: 0, rechazados: 0, pctRechazo: '—', aptos: 0, ventas: 0, pctVentaRec: '—' },
      { mes: 'Junio', recibidos: 0, rechazados: 0, pctRechazo: '—', aptos: 0, ventas: 0, pctVentaRec: '—' }
    ],
    tipificacionRechazo: [
      { motivo: 'Microseguro Activo', cant: 67, pct: '33,8' },
      { motivo: 'NIT de empresa', cant: 66, pct: '33,3' },
      { motivo: 'Registro Enviado Anteriormente', cant: 58, pct: '29,3' },
      { motivo: 'Cédula Errada', cant: 6, pct: '3,0' },
      { motivo: 'Nombre Vacío', cant: 1, pct: '0,5' }
    ],
    tipificacionAptos: [
      { desc: 'CONTACTO EFECTIVO', cant: 564, pct: '53,0', isTitle: true },
      { desc: 'Venta exitosa', cant: 4, pct: '0,4' },
      { desc: 'No interesado por el producto', cant: 143, pct: '13,4' },
      { desc: 'Datos errados / experiencia', cant: 188, pct: '17,7' },
      { desc: 'Cuelga la llamada', cant: 90, pct: '8,5' },
      { desc: 'No es responsable del pago', cant: 68, pct: '6,4' },
      { desc: 'Otros motivos menores', cant: 71, pct: '6,7' },
      { desc: 'NO CONTACTO', cant: 501, pct: '47,0', isTitle: true },
      { desc: 'Contestador automático', cant: 455, pct: '42,7' },
      { desc: 'No contesta / apagado', cant: 46, pct: '4,3' }
    ],
    observaciones: [
      "Esta base **sólo estuvo activa en enero de 2026** (campaña táctica sobre solicitudes de cancelaciones previas).",
      "Mostró una efectividad extremadamente baja (**4 ventas totales, 0,38 % del apto**), lo que sustentó su suspensión inmediata.",
      "El descarte principal se concentró en **Microseguro Activo (33,8 %)** y **NIT de Empresa (33,3 %)**."
    ]
  };
  renderCampanaDeepDive('detalle-cancelaciones-body', data);
}

function renderCampanaDeepDive(campanaId, data) {
  const el = document.getElementById(campanaId);
  if (!el) return;

  const validKpis = data.kpisBase.filter(k => k.recibidos > 0);
  const totalRecibidos = validKpis.reduce((a,b)=>a+b.recibidos,0);
  const totalRechazados = validKpis.reduce((a,b)=>a+b.rechazados,0);
  const totalAptos = validKpis.reduce((a,b)=>a+b.aptos,0);
  const totalVentas = validKpis.reduce((a,b)=>a+b.ventas,0);
  
  const totalPctRechazo = totalRecibidos > 0 ? (totalRechazados / totalRecibidos * 100).toFixed(1).replace('.', ',') : '—';
  const totalPctVentaRec = totalAptos > 0 ? (totalVentas / totalAptos * 100).toFixed(1).replace('.', ',') : '—';

  el.innerHTML = `
    <div class="two-col" style="gap:10px; margin-top:-5px; align-items:start">
      <!-- Columna Izquierda: Descarte / Rechazo -->
      <div class="panel" style="padding:6px 12px; display:flex; flex-direction:column; gap:4px; min-height:285px">
        <h3 style="margin-bottom:2px; padding-bottom:2px; font-size:0.7rem; border-bottom:1px solid var(--gray2); color:var(--blue)">
          ${icon('alert-circle', {size: 13})} 1. Calidad de Base y Descarte Mensual
        </h3>
        <div class="tbl-wrap" style="margin-top:0">
          <table style="font-size:0.56rem; table-layout:fixed; border-collapse:collapse; width:100%">
            <colgroup>
              <col style="width:20%">
              <col style="width:26%">
              <col style="width:28%">
              <col style="width:26%">
            </colgroup>
            <thead><tr>
              <th style="border-right:1px solid rgba(255,255,255,.18); padding:3px 6px">Mes</th>
              <th class="r" style="border-right:1px solid rgba(255,255,255,.18); padding:3px 6px">Recibidos</th>
              <th class="r" style="border-right:1px solid rgba(255,255,255,.18); padding:3px 6px">Rechazados</th>
              <th class="r" style="padding:3px 6px">% Rechazo</th>
            </tr></thead>
            <tbody>
              ${data.kpisBase.map(m=>`
                <tr>
                  <td style="border-right:1px solid rgba(0,0,0,.06); padding:2px 6px"><strong>${m.mes}</strong></td>
                  <td class="r" style="border-right:1px solid rgba(0,0,0,.06); padding:2px 6px">${m.recibidos > 0 ? fmt(m.recibidos) : '—'}</td>
                  <td class="r" style="border-right:1px solid rgba(0,0,0,.06); padding:2px 6px">${m.recibidos > 0 ? fmt(m.rechazados) : '—'}</td>
                  <td class="r" style="padding:2px 6px">${m.recibidos > 0 ? m.pctRechazo + ' %' : '—'}</td>
                </tr>`).join('')}
              <tr class="total">
                <td style="border-right:1px solid rgba(0,0,0,.07); padding:3px 6px">Total</td>
                <td class="r" style="border-right:1px solid rgba(0,0,0,.07); padding:3px 6px">${fmt(totalRecibidos)}</td>
                <td class="r" style="border-right:1px solid rgba(0,0,0,.07); padding:3px 6px">${fmt(totalRechazados)}</td>
                <td class="r" style="padding:3px 6px">${totalPctRechazo} %</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 style="margin-bottom:2px; padding-bottom:2px; font-size:0.7rem; margin-top:2px; border-bottom:1px solid var(--gray2); color:var(--blue)">
          ${icon('filter', {size: 13})} 2. Motivos de Descarte (Acumulado Semestre)
        </h3>
        <div class="tbl-wrap" style="margin-top:0; max-height:105px; overflow-y:auto; border:1px solid var(--gray2)">
          <table style="font-size:0.54rem; table-layout:fixed; border-collapse:collapse; width:100%">
            <colgroup>
              <col style="width:68%">
              <col style="width:20%">
              <col style="width:12%">
            </colgroup>
            <thead><tr>
              <th style="border-right:1px solid rgba(255,255,255,.18); padding:3px 6px">Motivo</th>
              <th class="r" style="border-right:1px solid rgba(255,255,255,.18); padding:3px 6px">Regs.</th>
              <th class="r" style="padding:3px 6px">%</th>
            </tr></thead>
            <tbody>
              ${data.tipificacionRechazo.map(r=>`
                <tr>
                  <td style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; border-right:1px solid rgba(0,0,0,.06); padding:2px 6px" title="${r.motivo}">${r.motivo}</td>
                  <td class="r" style="border-right:1px solid rgba(0,0,0,.06); padding:2px 6px">${fmt(r.cant)}</td>
                  <td class="r" style="padding:2px 6px">${r.pct} %</td>
                </tr>`).join('')}
              <tr class="total">
                <td style="border-right:1px solid rgba(0,0,0,.07); padding:3px 6px">Total</td>
                <td class="r" style="border-right:1px solid rgba(0,0,0,.07); padding:3px 6px">${fmt(totalRechazados)}</td>
                <td class="r" style="padding:3px 6px">100 %</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Columna Derecha: Gestión / Aptos -->
      <div class="panel" style="padding:6px 12px; display:flex; flex-direction:column; gap:4px; min-height:285px">
        <h3 style="margin-bottom:2px; padding-bottom:2px; font-size:0.7rem; border-bottom:1px solid var(--gray2); color:var(--blue)">
          ${icon('trending-up', {size: 13})} 3. Insumo Apto y Ventas Mensuales
        </h3>
        <div class="tbl-wrap" style="margin-top:0">
          <table style="font-size:0.56rem; table-layout:fixed; border-collapse:collapse; width:100%">
            <colgroup>
              <col style="width:20%">
              <col style="width:26%">
              <col style="width:28%">
              <col style="width:26%">
            </colgroup>
            <thead><tr>
              <th style="border-right:1px solid rgba(255,255,255,.18); padding:3px 6px">Mes</th>
              <th class="r" style="border-right:1px solid rgba(255,255,255,.18); padding:3px 6px">Aptos</th>
              <th class="r" style="border-right:1px solid rgba(255,255,255,.18); padding:3px 6px">Ventas</th>
              <th class="r" style="padding:3px 6px">% Conv/Rec.</th>
            </tr></thead>
            <tbody>
              ${data.kpisBase.map(m=>`
                <tr>
                  <td style="border-right:1px solid rgba(0,0,0,.06); padding:2px 6px"><strong>${m.mes}</strong></td>
                  <td class="r" style="border-right:1px solid rgba(0,0,0,.06); padding:2px 6px">${m.recibidos > 0 ? fmt(m.aptos) : '—'}</td>
                  <td class="r" style="border-right:1px solid rgba(0,0,0,.06); padding:2px 6px">${m.recibidos > 0 ? `<strong>${fmt(m.ventas)}</strong>` : '—'}</td>
                  <td class="r" style="padding:2px 6px">${m.recibidos > 0 ? m.pctVentaRec + ' %' : '—'}</td>
                </tr>`).join('')}
              <tr class="total">
                <td style="border-right:1px solid rgba(0,0,0,.07); padding:3px 6px">Total</td>
                <td class="r" style="border-right:1px solid rgba(0,0,0,.07); padding:3px 6px">${fmt(totalAptos)}</td>
                <td class="r" style="border-right:1px solid rgba(0,0,0,.07); padding:3px 6px"><strong>${fmt(totalVentas)}</strong></td>
                <td class="r" style="padding:3px 6px">${totalPctVentaRec} %</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 style="margin-bottom:2px; padding-bottom:2px; font-size:0.7rem; margin-top:2px; border-bottom:1px solid var(--gray2); color:var(--blue)">
          ${icon('clipboard-list', {size: 13})} 4. Tipificación de Leads Aptos (Acumulado Semestre)
        </h3>
        <div class="tbl-wrap" style="margin-top:0; max-height:105px; overflow-y:auto; border:1px solid var(--gray2)">
          <table style="font-size:0.54rem; table-layout:fixed; border-collapse:collapse; width:100%">
            <colgroup>
              <col style="width:68%">
              <col style="width:20%">
              <col style="width:12%">
            </colgroup>
            <thead><tr>
              <th style="border-right:1px solid rgba(255,255,255,.18); padding:3px 6px">Tipificación</th>
              <th class="r" style="border-right:1px solid rgba(255,255,255,.18); padding:3px 6px">Regs.</th>
              <th class="r" style="padding:3px 6px">%</th>
            </tr></thead>
            <tbody>
              ${data.tipificacionAptos.map(r=>`
                <tr style="${r.isTitle ? 'background:rgba(18,1,128,.04); font-weight:700' : ''}">
                  <td style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis; border-right:1px solid rgba(0,0,0,.06); padding:2px 6px; ${r.isTitle ? 'color:var(--blue)' : ''}" title="${r.desc}">
                    ${r.isTitle ? r.desc : '&nbsp;&nbsp;' + r.desc}
                  </td>
                  <td class="r" style="border-right:1px solid rgba(0,0,0,.06); padding:2px 6px; ${r.isTitle ? 'color:var(--blue)' : ''}">${fmt(r.cant)}</td>
                  <td class="r" style="padding:2px 6px; ${r.isTitle ? 'color:var(--blue)' : ''}">${r.pct} %</td>
                </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Fila Inferior de Observaciones -->
    <div class="alert alert-info" style="margin-top:6px; padding:6px 14px; font-size:0.62rem; line-height:1.45; display:flex; flex-direction:column; gap:2px">
      <div style="font-weight:700; color:var(--blue); display:flex; align-items:center; gap:4px">
        ${icon('lightbulb', {size: 13})} Observaciones Clave de la Base:
      </div>
      <ul style="margin-left:14px; list-style-type:disc; display:flex; flex-direction:column; gap:1px">
        ${data.observaciones.map(o=>`<li>${o}</li>`).join('')}
      </ul>
    </div>
  `;
}
