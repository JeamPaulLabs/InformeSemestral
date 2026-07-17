// ============================================================
//  INFORME CANAL TRADICIONAL 2026 – app_tradicional.js
//  Renderizado dinámico de la presentación e integración de mapa Leaflet.js
// ============================================================

/* ── STATE ──────────────────────────────────────────────────── */
let current = 0;
let animating = false;
const animated = new Set();
let slides = [];
let map = null;

const NAV_LABELS = [
  'Formación', 'Cobertura', 'Ventas'
];

/* ── INIT ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  slides = Array.from(document.querySelectorAll('.slide'));
  buildNav();
  scaleSlider();
  window.addEventListener('resize', scaleSlider);
  goTo(initialSlideFromURL(), true);
  document.addEventListener('keydown', onKey);
  document.getElementById('prev-btn').addEventListener('click', prev);
  document.getElementById('next-btn').addEventListener('click', next);
  
  // Render dynamic slides
  renderSlides();
});

/* ── MOTOR DE NAVEGACIÓN ────────────────────────────────────────
   scaleSlider, goTo, next, prev, onKey, buildNav, updateNav,
   updateProgress, triggerAnimations, deckTab, fmt, fmtPct, badge
   viven en ../core/deck-engine.js (compartido con Retail).
──────────────────────────────────────────────────────────────── */

/* ── MAP INITIALIZATION ─────────────────────────────────────── */
function initMap() {
  const container = document.getElementById('map-container');
  if (!container) return;

  // Draw flat SVG scatter map using coordinates from data
  // Bounding box for Vanti's region (Bogota, Cundinamarca, Boyaca, Santander)
  const minLat = 4.4, maxLat = 7.3, minLon = -74.5, maxLon = -72.8;

  const w = container.clientWidth || 450;
  const h = container.clientHeight || 390;
  const padding = 20;
  const mapW = w - padding * 2;
  const mapH = h - padding * 2;

  const lonDiff = maxLon - minLon;
  const latDiff = maxLat - minLat;
  const scale = Math.min(mapW / lonDiff, mapH / latDiff);

  const getX = (lon) => padding + (lon - minLon) * scale + (mapW - lonDiff * scale) / 2;
  const getY = (lat) => padding + (maxLat - lat) * scale + (mapH - latDiff * scale) / 2;

  // Render visited municipalities as visual nodes
  let svgPaths = '';
  let svgMarkers = '';

  TRADICIONAL_DATA.mapa.forEach(pt => {
    const x = getX(pt.lon);
    const y = getY(pt.lat);
    const radius = Math.max(5, Math.min(15, 5 + (pt.visits / 20)));

    // Interactive node
    svgMarkers += `
      <g style="cursor: pointer;"
         onmouseover="window.showMapTooltip(event, '${pt.name}', ${pt.visits})"
         onmouseout="window.hideMapTooltip()">
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${radius.toFixed(1)}" fill="var(--teal)" fill-opacity="0.8">
          <animate attributeName="r" values="${radius.toFixed(1)};${(radius+2).toFixed(1)};${radius.toFixed(1)}" dur="2s" repeatCount="indefinite" />
        </circle>
        <circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(radius+3).toFixed(1)}" fill="none" stroke="var(--green)" stroke-width="1" stroke-opacity="0.5">
          <animate attributeName="r" values="${(radius+1).toFixed(1)};${(radius+6).toFixed(1)}" dur="2.5s" repeatCount="indefinite" />
          <animate attributeName="stroke-opacity" values="0.5;0" dur="2.5s" repeatCount="indefinite" />
        </circle>
        <text x="${x.toFixed(1)}" y="${(y - radius - 4).toFixed(1)}" text-anchor="middle" fill="#ffffff" font-size="8px" font-weight="700" style="text-shadow: 0 1px 2px rgba(0,0,0,0.8)">${pt.name}</text>
      </g>
    `;
  });

  // Background map skeleton of regions
  svgPaths = `
    <!-- Line connects Santander (Bucaramanga) to Boyaca (Tunja, Sogamoso) -->
    <line x1="${getX(-73.1227).toFixed(1)}" y1="${getY(7.1193).toFixed(1)}" x2="${getX(-73.3678).toFixed(1)}" y2="${getY(5.5353).toFixed(1)}" stroke="rgba(255,255,255,0.15)" stroke-width="2" stroke-dasharray="4" />
    <line x1="${getX(-73.3678).toFixed(1)}" y1="${getY(5.5353).toFixed(1)}" x2="${getX(-72.9339).toFixed(1)}" y2="${getY(5.7148).toFixed(1)}" stroke="rgba(255,255,255,0.15)" stroke-width="2" stroke-dasharray="4" />
    <!-- Line connects Boyaca (Tunja) to Cundinamarca (Zipaquira, Chia, Bogota) -->
    <line x1="${getX(-73.3678).toFixed(1)}" y1="${getY(5.5353).toFixed(1)}" x2="${getX(-74.0039).toFixed(1)}" y2="${getY(5.0267).toFixed(1)}" stroke="rgba(255,255,255,0.15)" stroke-width="2" stroke-dasharray="4" />
    <line x1="${getX(-74.0039).toFixed(1)}" y1="${getY(5.0267).toFixed(1)}" x2="${getX(-74.0514).toFixed(1)}" y2="${getY(4.8632).toFixed(1)}" stroke="rgba(255,255,255,0.15)" stroke-width="2" stroke-dasharray="4" />
    <line x1="${getX(-74.0514).toFixed(1)}" y1="${getY(4.8632).toFixed(1)}" x2="${getX(-74.075).toFixed(1)}" y2="${getY(4.628).toFixed(1)}" stroke="rgba(255,255,255,0.15)" stroke-width="2" stroke-dasharray="4" />
    <!-- Line connects Bogota to Soacha -->
    <line x1="${getX(-74.075).toFixed(1)}" y1="${getY(4.628).toFixed(1)}" x2="${getX(-74.2158).toFixed(1)}" y2="${getY(4.5781).toFixed(1)}" stroke="rgba(255,255,255,0.15)" stroke-width="2" stroke-dasharray="4" />
  `;

  container.innerHTML = `
    <div style="position: relative; width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;">
      <svg width="${w}" height="${h}" style="background: rgba(18,1,128,0.25); border-radius: 12px; display: block; user-select: none;">
        <!-- Region connectors -->
        <g>${svgPaths}</g>
        <!-- Nodes -->
        <g>${svgMarkers}</g>
      </svg>
      <div id="map-tooltip" style="position: absolute; display: none; background: rgba(18,1,128,0.95); border: 1px solid var(--green); color: #ffffff; padding: 6px 10px; border-radius: 8px; font-size: 0.65rem; pointer-events: none; z-index: 2000; box-shadow: 0 4px 12px rgba(0,0,0,0.3); font-family: 'Raleway', sans-serif;"></div>
    </div>
  `;

  window.showMapTooltip = function(e, name, visits) {
    const tt = document.getElementById('map-tooltip');
    if (!tt) return;
    tt.style.display = 'block';
    tt.innerHTML = `<strong style="color:var(--green);font-size:0.75rem">${name}</strong><br>Visitas de formación: <strong>${visits}</strong>`;
    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left + 15;
    const y = e.clientY - rect.top + 15;
    tt.style.left = x + 'px';
    tt.style.top = y + 'px';
  };

  window.hideMapTooltip = function() {
    const tt = document.getElementById('map-tooltip');
    if (tt) tt.style.display = 'none';
  };
}

/* ── RENDER DYNAMIC SLIDES ──────────────────────────────────── */
function renderSlides() {
  renderFormacion();
  renderVentas();
  renderCobertura();
}

function renderFormacion() {
  const el = document.getElementById('formacion-body');
  if (!el) return;

  const totalVisitas = TRADICIONAL_DATA.visitas.reduce((s, v) => s + v.visitas, 0);
  const bestMonth = TRADICIONAL_DATA.visitas.reduce((best, curr) => curr.visitas > best.visitas ? curr : best, TRADICIONAL_DATA.visitas[0]);
  const marVisits = TRADICIONAL_DATA.visitas[2].visitas;
  const junVisits = TRADICIONAL_DATA.visitas[5].visitas;
  const dropPct = ((junVisits - marVisits) / marVisits * 100).toFixed(0);

  const eneAsesores = TRADICIONAL_DATA.visitas[0].asesores;
  const junAsesores = TRADICIONAL_DATA.visitas[5].asesores;
  const asesoresDropPct = ((eneAsesores - junAsesores) / eneAsesores * 100).toFixed(0);

  el.innerHTML = `
    <div class="kpi-grid" style="gap:12px; margin-bottom:12px">
      <div class="kpi-card" style="padding:10px 18px">
        <div class="kpi-label" style="font-size:.65rem">Visitas Realizadas 1S</div>
        <div class="kpi-val" style="font-size:1.45rem">${fmt(totalVisitas)}</div>
        <div class="kpi-sub" style="font-size:.58rem">Total de formación acumulada (Ene - Jun 2026)</div>
      </div>
      <div class="kpi-card green" style="padding:10px 18px">
        <div class="kpi-label" style="font-size:.65rem">Cobertura PDV Activo</div>
        <div class="kpi-val" style="font-size:1.45rem">7,5 %</div>
        <div class="kpi-sub" style="font-size:.58rem">Cobertura promedio del canal Tradicional en el semestre</div>
      </div>
    </div>

    <div class="two-col" style="gap:14px; margin-bottom:12px">
      <div class="panel" style="padding:12px 16px; display:flex; flex-direction:column; justify-content:space-between; min-height:280px">
        <div>
          <h3 style="margin-bottom:8px; padding-bottom:4px; font-size:.78rem; border-bottom:1px dashed rgba(18,1,128,0.1)">${icon('calendar')} Visitas, asesores y PDV por mes</h3>
          <div class="tbl-wrap" style="margin-top:2px">
            <table class="tbl-compact" style="font-size:.72rem">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th class="r">Visitas</th>
                  <th class="r">Asesores Capacitados</th>
                  <th class="r">PDV Visitados</th>
                </tr>
              </thead>
              <tbody>
                ${TRADICIONAL_DATA.visitas.map(v => `
                  <tr>
                    <td><strong>${v.mes}</strong></td>
                    <td class="r">${v.visitas}</td>
                    <td class="r">${v.asesores}</td>
                    <td class="r">${v.pdvs}</td>
                  </tr>
                `).join('')}
                <tr class="total">
                  <td>Total 1S</td>
                  <td class="r">${totalVisitas}</td>
                  <td class="r">${TRADICIONAL_DATA.visitas.reduce((s, v) => s + v.asesores, 0)}</td>
                  <td class="r">${TRADICIONAL_DATA.visitas.reduce((s, v) => s + v.pdvs, 0)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div style="font-size:.58rem; color:var(--gray3); margin-top:8px; line-height:1.4">
          * Asesores únicos con al menos una visita registrada en el mes.
        </div>
      </div>

      <div class="panel" style="padding:12px 16px; display:flex; flex-direction:column; justify-content:space-between; min-height:280px">
        <div>
          <h3 style="margin-bottom:8px; padding-bottom:4px; font-size:.78rem; border-bottom:1px dashed rgba(18,1,128,0.1)">${icon('trending-down')} Evolución de visitas por mes</h3>
          <div class="chart-wrap" style="margin-top:10px; display:flex; flex-direction:column; gap:8px">
            ${TRADICIONAL_DATA.visitas.map(v => {
              const pct = (v.visitas / bestMonth.visitas * 100).toFixed(0) + '%';
              const colorClass = (v.mes === 'May' || v.mes === 'Jun') ? 'warn' : 'teal';
              const gradient = colorClass === 'warn' ? 'linear-gradient(90deg, #ff6b35, #ff8c5a)' : 'linear-gradient(90deg, #00CD93, #5AE280)';
              return `
                <div class="bar-row" style="margin:2px 0">
                  <span class="bar-label" style="font-size:.65rem; font-weight:700; width:35px">${v.mes}</span>
                  <div class="bar-track" style="height:12px; background:rgba(18,1,128,0.06); border-radius:6px">
                    <div class="bar-fill" data-w="${pct}" style="width:0; background:${gradient}; height:100%; border-radius:6px; transition: width 0.8s ease-out;"></div>
                  </div>
                  <span class="bar-val" style="font-size:.65rem; font-weight:800; width:30px; text-align:right">${v.visitas}</span>
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <div style="font-size:.58rem; color:var(--gray3); margin-top:8px; line-height:1.4">
          La concentración de visitas en marzo estableció la base operativa del canal en el primer semestre.
        </div>
      </div>
    </div>
    <div class="alert alert-info" style="margin-top:8px; padding:10px 16px; border-left: 4px solid var(--teal); background: rgba(0,205,147,0.06)">
      <span class="ico">${icon('shield-check')}</span>
      <span style="font-size:.72rem; line-height:1.4; color:var(--dark)"><strong>Logro Semestral:</strong> El canal Tradicional concentró un esfuerzo récord de formación en marzo (148 visitas y 93 asesores capacitados). Con la posterior consolidación y el empalme con Retail, el canal centró su capacidad y cobertura promedio del semestre alcanzó un <strong>7,5%</strong>, identificando grandes oportunidades de crecimiento en los aliados de mayor volumen.</span>
    </div>
  `;
}

function renderVentas() {
  const el = document.getElementById('ventas-body');
  if (!el) return;

  const cpCantadas = TRADICIONAL_DATA.ventas.cp.reduce((s, v) => s + v.cantadas, 0);
  const cpPositivas = TRADICIONAL_DATA.ventas.cp.reduce((s, v) => s + v.positivas, 0);
  const cpFinanciaciones = TRADICIONAL_DATA.ventas.cp.reduce((s, v) => s + v.financiaciones, 0);
  const cpMeta = TRADICIONAL_DATA.ventas.cp.reduce((s, v) => s + v.meta, 0);
  const cpCumpl = cpMeta > 0 ? (cpPositivas / cpMeta * 100) : 0;

  const rsCantadas = TRADICIONAL_DATA.ventas.rs.reduce((s, v) => s + v.cantadas, 0);
  const rsPositivas = TRADICIONAL_DATA.ventas.rs.reduce((s, v) => s + v.positivas, 0);
  const rsFinanciaciones = TRADICIONAL_DATA.ventas.rs.reduce((s, v) => s + v.financiaciones, 0);
  const rsMeta = TRADICIONAL_DATA.ventas.rs.reduce((s, v) => s + v.meta, 0);
  const rsCumpl = rsMeta > 0 ? (rsPositivas / rsMeta * 100) : 0;

  el.innerHTML = `
    <div class="kpi-grid" style="gap:8px; margin-bottom:8px">
      <div class="kpi-card green" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Ventas CP positivas 1S</div>
        <div class="kpi-val" style="font-size:.85rem">${fmt(cpPositivas)}</div>
        <div class="kpi-sub" style="font-size:.5rem">${fmt(cpCantadas)} cantadas · ${cpMeta>0?cpCumpl.toFixed(1).replace('.', ','):'S/D'}% meta</div>
      </div>
      <div class="kpi-card green" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Ventas RS positivas 1S</div>
        <div class="kpi-val" style="font-size:.85rem">${fmt(rsPositivas)}</div>
        <div class="kpi-sub" style="font-size:.5rem">${fmt(rsCantadas)} cantadas · ${rsMeta>0?rsCumpl.toFixed(1).replace('.', ','):'S/D'}% meta</div>
      </div>
      <div class="kpi-card" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Financiaciones CP</div>
        <div class="kpi-val" style="font-size:.85rem">${fmt(cpFinanciaciones)}</div>
        <div class="kpi-sub" style="font-size:.5rem">12 aliados activos</div>
      </div>
      <div class="kpi-card" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Financiaciones RS</div>
        <div class="kpi-val" style="font-size:.85rem">${fmt(rsFinanciaciones)}</div>
        <div class="kpi-sub" style="font-size:.5rem">25 aliados activos</div>
      </div>
    </div>

    <div class="two-col" style="gap:10px">
      <div class="panel" style="padding:8px 12px">
        <h3 style="margin-bottom:4px; padding-bottom:3px; font-size:.68rem">${icon('shield')} Cuota Protegida Tradicional</h3>
        <div class="tbl-wrap" style="margin-top:0">
          <table class="tbl-compact" style="font-size:.66rem">
            <thead>
              <tr>
                <th>Mes</th><th class="r">Aliados</th><th class="r">Gestores</th><th class="r">Financ.</th>
                <th class="r">Cantadas</th><th class="r">Positivas</th><th class="r">% Cumpl.</th>
              </tr>
            </thead>
            <tbody>
              ${(() => {
                const maxCP = Math.max(...TRADICIONAL_DATA.ventas.cp.map(x => x.positivas));
                return TRADICIONAL_DATA.ventas.cp.map(v => {
                  const pct = v.meta > 0 ? (v.positivas / v.meta * 100) : 0;
                  const bType = v.meta > 0 ? (pct >= 90 ? 'g' : pct >= 70 ? 'y' : 'r') : 'y';
                  const showCumpl = v.meta > 0 ? `${pct.toFixed(1).replace('.', ',')}%` : 'S/D';
                  const barW = maxCP > 0 ? (v.positivas / maxCP * 100).toFixed(0) + '%' : '0%';
                  return `
                    <tr>
                      <td><strong>${v.mes}</strong></td>
                      <td class="r">${v.aliados}</td>
                      <td class="r">${v.gestores > 0 ? v.gestores : 'S/D'}</td>
                      <td class="r">${fmt(v.financiaciones)}</td>
                      <td class="r">${fmt(v.cantadas)}</td>
                      <td class="r">
                        <div style="display:flex; flex-direction:column; align-items:flex-end">
                          <span>${fmt(v.positivas)}</span>
                          <div style="width:40px; background:rgba(255,255,255,0.08); height:3px; border-radius:1px; overflow:hidden; margin-top:2px">
                            <div style="width:${barW}; background:var(--green); height:100%"></div>
                          </div>
                        </div>
                      </td>
                      <td class="r">${badge(showCumpl, bType)}</td>
                    </tr>
                  `;
                }).join('');
              })()}
              <tr class="total">
                <td>Total</td>
                <td class="r">—</td>
                <td class="r">—</td>
                <td class="r">${fmt(cpFinanciaciones)}</td>
                <td class="r">${fmt(cpCantadas)}</td>
                <td class="r">${fmt(cpPositivas)}</td>
                <td class="r">${cpMeta > 0 ? badge(cpCumpl.toFixed(1).replace('.', ',') + '%', 'g') : badge('S/D', 'y')}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="font-size:.56rem; color:var(--gray3); margin-top:4px">El cierre de junio registra un incremento en financiaciones (5.605) y 12 aliados activos.</div>
      </div>

      <div class="panel" style="padding:8px 12px">
        <h3 style="margin-bottom:4px; padding-bottom:3px; font-size:.68rem">${icon('bike')} Rueda Seguro Tradicional</h3>
        <div class="tbl-wrap" style="margin-top:0">
          <table class="tbl-compact" style="font-size:.66rem">
            <thead>
              <tr>
                <th>Mes</th><th class="r">Aliados</th><th class="r">Gestores</th><th class="r">Financ.</th>
                <th class="r">Cantadas</th><th class="r">Positivas</th><th class="r">% Cumpl.</th>
              </tr>
            </thead>
            <tbody>
              ${(() => {
                const maxRS = Math.max(...TRADICIONAL_DATA.ventas.rs.map(x => x.positivas));
                return TRADICIONAL_DATA.ventas.rs.map(v => {
                  const pct = v.meta > 0 ? (v.positivas / v.meta * 100) : 0;
                  const bType = v.meta > 0 ? (pct >= 90 ? 'g' : pct >= 70 ? 'y' : 'r') : 'y';
                  const showCumpl = v.meta > 0 ? `${pct.toFixed(1).replace('.', ',')}%` : 'S/D';
                  const barW = maxRS > 0 ? (v.positivas / maxRS * 100).toFixed(0) + '%' : '0%';
                  return `
                    <tr>
                      <td><strong>${v.mes}</strong></td>
                      <td class="r">${v.aliados}</td>
                      <td class="r">${v.gestores > 0 ? v.gestores : 'S/D'}</td>
                      <td class="r">${fmt(v.financiaciones)}</td>
                      <td class="r">${fmt(v.cantadas)}</td>
                      <td class="r">
                        <div style="display:flex; flex-direction:column; align-items:flex-end">
                          <span>${fmt(v.positivas)}</span>
                          <div style="width:40px; background:rgba(255,255,255,0.08); height:3px; border-radius:1px; overflow:hidden; margin-top:2px">
                            <div style="width:${barW}; background:var(--teal); height:100%"></div>
                          </div>
                        </div>
                      </td>
                      <td class="r">${showCumpl !== 'S/D' ? badge(showCumpl, bType) : badge('S/D', 'y')}</td>
                    </tr>
                  `;
                }).join('');
              })()}
              <tr class="total">
                <td>Total</td>
                <td class="r">—</td>
                <td class="r">—</td>
                <td class="r">${fmt(rsFinanciaciones)}</td>
                <td class="r">${fmt(rsCantadas)}</td>
                <td class="r">${fmt(rsPositivas)}</td>
                <td class="r">${rsMeta > 0 ? badge(rsCumpl.toFixed(1).replace('.', ',') + '%', 'g') : badge('S/D', 'y')}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="font-size:.56rem; color:var(--gray3); margin-top:4px">Junio muestra un repunte de financiaciones de motocicletas (1.395) con 25 aliados activos.</div>
      </div>
    </div>
  `;
}

function renderCobertura() {
  const el = document.getElementById('cobertura-body');
  if (!el) return;

  // Top 5 aliados destacados: mejor cobertura entre los que tienen volumen
  // representativo (>=7 asesores financiaron), para no dejar que aliados de
  // 1-2 financiaciones (100% con n muy chico) distorsionen el ranking.
  const top5 = TRADICIONAL_DATA.cobertura.aliados
    .filter(a => a.financiaron >= 7 && a.cobertura !== null)
    .sort((a, b) => b.cobertura - a.cobertura)
    .slice(0, 5);

  el.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:4px">
    <div class="cob-tabs" style="display:flex; gap:8px; margin-bottom:-2px">
      <button class="cob-tab active" data-tab="aliado" onclick="coberturaTab('aliado')">${icon('store', {size:12})} Por Aliado</button>
      <button class="cob-tab" data-tab="mapa" onclick="coberturaTab('mapa')">${icon('map', {size:12})} Mapa de visitas</button>
    </div>

    <div class="cob-pane active" id="cob-pane-aliado">
    <div class="two-col" style="grid-template-columns: 1.15fr 1fr; gap: 10px;">
      <div class="panel" style="padding:6px 12px">
        <h3 style="margin-bottom:2px; padding-bottom:2px; font-size:.68rem">${icon('store')} Cobertura de Formación por Aliado (Ene-Jun 2026)</h3>
        <p style="font-size: .62rem; color: var(--gray3); margin-top: -3px; margin-bottom: 5px;">
          Asesores que financiaron en conciliaciones vs capacitados (cruzados por cédula).
        </p>
        <div class="tbl-wrap" style="margin-top:0; max-height: 300px; overflow-y: auto;">
          <table class="tbl-compact" style="font-size: 0.66rem;">
            <thead>
              <tr>
                <th>Aliado</th>
                <th class="r">Financiaron</th>
                <th class="r">Capacitados</th>
                <th class="r">Cruzados</th>
                <th class="r">Cobertura %</th>
              </tr>
            </thead>
            <tbody>
              ${TRADICIONAL_DATA.cobertura.aliados.map(a => {
                const showCob = a.cobertura !== null ? `${a.cobertura.toFixed(1).replace('.', ',')}%` : 'S/D';
                const bType = a.cobertura !== null ? (a.cobertura >= 15 ? 'g' : a.cobertura >= 5 ? 'y' : 'r') : 'y';
                return `
                  <tr>
                    <td><strong>${a.aliado}</strong></td>
                    <td class="r">${a.financiaron}</td>
                    <td class="r">${a.capacitados}</td>
                    <td class="r"><strong>${a.ambos}</strong></td>
                    <td class="r">${badge(showCob, bType)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <div style="font-size:.6rem; font-weight:800; color:var(--blue); letter-spacing:.05em; margin:8px 0 4px">${icon('trophy', {size:12})} TOP 5 ALIADOS DESTACADOS (cobertura, con volumen ≥ 7 financiaron)</div>
        <div style="display:flex; gap:5px">
          ${top5.map((a,i) => `
            <div style="flex:1; background:rgba(0,205,147,.07); border:1px solid rgba(0,205,147,.3); border-radius:8px; padding:5px 4px; text-align:center">
              <div style="font-size:.56rem; font-weight:700; color:var(--gray3)">#${i+1}</div>
              <div style="font-size:.6rem; font-weight:800; color:var(--blue); line-height:1.15; margin:2px 0">${a.aliado}</div>
              <div style="font-size:.68rem; font-weight:800; color:var(--teal)">${a.cobertura.toFixed(1).replace('.', ',')}%</div>
            </div>
          `).join('')}
        </div>
        <div style="font-size:.56rem; color:var(--gray3); margin-top:4px">Comportamiento mes a mes por aliado: pendiente de extraer de los cortes mensuales "Como vamos" (hoy solo se consolida el agregado semestral por aliado).</div>
      </div>

      <div class="panel" style="display: flex; flex-direction: column; justify-content: space-between; padding:6px 12px">
        <div>
          <h3 style="margin-bottom:2px; padding-bottom:2px; font-size:.68rem">${icon('calendar')} Cobertura de Formación por Mes (Semestre)</h3>
          <div class="tbl-wrap" style="margin-top:0">
            <table class="tbl-compact" style="font-size: 0.68rem;">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th class="r">Financiaron</th>
                  <th class="r">Capacitados</th>
                  <th class="r">Ambos</th>
                  <th class="r">Cobertura %</th>
                </tr>
              </thead>
              <tbody>
                ${TRADICIONAL_DATA.cobertura.meses.map(m => {
                  const bType = m.cobertura >= 12 ? 'g' : m.cobertura >= 5 ? 'y' : 'r';
                  return `
                    <tr>
                      <td><strong>${m.mes}</strong></td>
                      <td class="r">${m.financiaron}</td>
                      <td class="r">${m.capacitados}</td>
                      <td class="r"><strong>${m.ambos}</strong></td>
                      <td class="r">${badge(m.cobertura.toFixed(1).replace('.', ',') + '%', bType)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="alert alert-warn" style="margin-top:6px; margin-bottom: 0; padding:4px 12px">
          <span class="ico">${icon('scale')}</span>
          <span style="font-size:.62rem"><strong>Regla de Cobertura de Orlando:</strong> Cruce por documento del asesor en conciliaciones contra visitas del mes. Cobertura agregada promedio del canal: <strong>7,5%</strong>, con espacio de mejora prioritario en los aliados con baja tasa de cruce.</span>
        </div>
      </div>
    </div>
    </div>

    <div class="cob-pane" id="cob-pane-mapa">
      <div class="two-col" style="grid-template-columns: 1.5fr 1fr; gap: 14px;">
        <div class="panel" style="position: relative; height: 420px; padding: 0; overflow: hidden; border-radius: 12px; border: 1px solid var(--gray2); box-shadow: 0 4px 12px rgba(0,0,0,0.05)">
          <div id="map-container" style="width: 100%; height: 100%"></div>
        </div>
        <div class="panel" style="max-height: 420px; display: flex; flex-direction: column;">
          <h3 style="margin-top: 0">${icon('map-pin')} Visitas de Formación por Zona</h3>
          <div class="tbl-wrap" style="margin-top: 0; flex-grow: 1; overflow-y: auto;">
            <table>
              <thead>
                <tr>
                  <th>Zona / Municipio</th>
                  <th class="r">Visitas</th>
                </tr>
              </thead>
              <tbody>
                ${TRADICIONAL_DATA.mapa.map(pt => `
                  <tr>
                    <td><strong>${pt.name}</strong></td>
                    <td class="r">${pt.visits}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
          <div class="alert alert-info" style="margin-top: 10px; margin-bottom: 0;">
            <span class="ico">${icon('pin')}</span>
            <span>Bogotá Centro, Sur y Occidente agrupan el 62% del total. Tunja, Bucaramanga y Soacha reportan importante despliegue regional.</span>
          </div>
        </div>
      </div>
    </div>
    </div>
  `;
}

function coberturaTab(name) {
  document.querySelectorAll('.cob-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  document.querySelectorAll('.cob-pane').forEach(p => p.classList.remove('active'));
  document.getElementById(`cob-pane-${name}`).classList.add('active');
  if (name === 'mapa' && typeof initMap === 'function') initMap();
}
