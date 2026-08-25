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

  const lastIdx = TRADICIONAL_DATA.visitas.length - 1;
  const lastMes = TRADICIONAL_DATA.visitas[lastIdx].mes;
  const totalVisitas = TRADICIONAL_DATA.visitas.reduce((s, v) => s + v.visitas, 0);
  const bestMonth = TRADICIONAL_DATA.visitas.reduce((best, curr) => curr.visitas > best.visitas ? curr : best, TRADICIONAL_DATA.visitas[0]);
  const marVisits = TRADICIONAL_DATA.visitas[2].visitas;
  const junVisits = TRADICIONAL_DATA.visitas[lastIdx].visitas;
  const dropPct = ((junVisits - marVisits) / marVisits * 100).toFixed(0);

  const eneAsesores = TRADICIONAL_DATA.visitas[0].asesores;
  const junAsesores = TRADICIONAL_DATA.visitas[lastIdx].asesores;
  const asesoresDropPct = ((eneAsesores - junAsesores) / eneAsesores * 100).toFixed(0);


  el.innerHTML = `
    <div class="kpi-grid" style="gap:12px; margin-bottom:12px">
      <div class="kpi-card" style="padding:10px 18px">
        <div class="kpi-label" style="font-size:.65rem">Visitas Realizadas Ene-${lastMes}</div>
        <div class="kpi-val" style="font-size:1.45rem">${fmt(totalVisitas)}</div>
        <div class="kpi-sub" style="font-size:.58rem">Total de formación acumulada (Ene - ${lastMes} 2026)</div>
      </div>
      <div class="kpi-card green" style="padding:10px 18px">
        <div class="kpi-label" style="font-size:.65rem">Cobertura PDV Activo</div>
        <div class="kpi-val" style="font-size:1.45rem">7,5 %</div>
        <div class="kpi-sub" style="font-size:.58rem">Cobertura promedio del canal Tradicional en 1S · pendiente actualizar a ${lastMes}</div>
      </div>
    </div>

    <div class="two-col" style="gap:14px; margin-bottom:12px">
      <div class="panel" style="padding:12px 16px; display:flex; flex-direction:column; justify-content:space-between; min-height:310px">
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
                  <td>Total Ene-${lastMes}</td>
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

      <div class="panel" style="padding:12px 16px; display:flex; flex-direction:column; justify-content:space-between; min-height:310px">
        <div>
          <h3 style="margin-bottom:8px; padding-bottom:4px; font-size:.78rem; border-bottom:1px dashed rgba(18,1,128,0.1)">${icon('trending-down')} Evolución de visitas por mes</h3>
          <div class="chart-wrap" style="margin-top:10px; display:flex; flex-direction:column; gap:8px">
            ${TRADICIONAL_DATA.visitas.map((v, i) => {
              const pct = (v.visitas / bestMonth.visitas * 100).toFixed(0) + '%';
              const colorClass = i >= TRADICIONAL_DATA.visitas.length - 2 ? 'warn' : 'teal';
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
    <div class="alert alert-info" style="margin-top:14px; margin-bottom:24px; padding:12px 18px; border-left: 4px solid var(--teal); background: rgba(0,205,147,0.06)">
      <span class="ico">${icon('shield-check')}</span>
      <span style="font-size:.72rem; line-height:1.4; color:var(--dark)"><strong>Logro del periodo:</strong> El canal Tradicional concentró un esfuerzo récord de formación en marzo (148 visitas y 93 asesores capacitados). Con la posterior consolidación y el empalme con Retail, el canal centró su capacidad; la cobertura promedio de 1S alcanzó un <strong>7,5%</strong> (cifra pendiente de actualizar con los cortes de Jul-${lastMes}), identificando grandes oportunidades de crecimiento en los aliados de mayor volumen.</span>
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

  const lastIdxV = TRADICIONAL_DATA.ventas.cp.length - 1;
  const lastMesV = TRADICIONAL_DATA.ventas.cp[lastIdxV].mes;
  const cpAliadosUlt = TRADICIONAL_DATA.ventas.cp[lastIdxV].aliados;
  const rsAliadosUlt = TRADICIONAL_DATA.ventas.rs[lastIdxV].aliados;

  el.innerHTML = `
    <div class="kpi-grid" style="gap:8px; margin-bottom:8px">
      <div class="kpi-card green" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Ventas CP positivas Ene-${lastMesV}</div>
        <div class="kpi-val" style="font-size:.85rem">${fmt(cpPositivas)}</div>
        <div class="kpi-sub" style="font-size:.5rem">${fmt(cpCantadas)} cantadas · ${cpMeta>0?cpCumpl.toFixed(1).replace('.', ','):'S/D'}% meta</div>
      </div>
      <div class="kpi-card green" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Ventas RS positivas Ene-${lastMesV}</div>
        <div class="kpi-val" style="font-size:.85rem">${fmt(rsPositivas)}</div>
        <div class="kpi-sub" style="font-size:.5rem">${fmt(rsCantadas)} cantadas · ${rsMeta>0?rsCumpl.toFixed(1).replace('.', ','):'S/D'}% meta</div>
      </div>
      <div class="kpi-card" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Financiaciones CP</div>
        <div class="kpi-val" style="font-size:.85rem">${fmt(cpFinanciaciones)}</div>
        <div class="kpi-sub" style="font-size:.5rem">${cpAliadosUlt} aliados activos</div>
      </div>
      <div class="kpi-card" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Financiaciones RS</div>
        <div class="kpi-val" style="font-size:.85rem">${fmt(rsFinanciaciones)}</div>
        <div class="kpi-sub" style="font-size:.5rem">${rsAliadosUlt} aliados activos</div>
      </div>
    </div>

    <div class="two-col" style="gap:10px">
      <div class="panel" style="padding:8px 12px; display:flex; flex-direction:column">
        <h3 style="margin-bottom:4px; padding-bottom:3px; font-size:.68rem">${icon('shield')} Cuota Protegida Tradicional</h3>
        <div class="tbl-wrap" style="margin-top:0; flex-grow:1">
          <table class="tbl-compact" style="font-size:.66rem; width:100%; height:100%">
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
                <td class="r">${Math.round(TRADICIONAL_DATA.ventas.cp.reduce((s, v) => s + v.aliados, 0) / TRADICIONAL_DATA.ventas.cp.length)}*</td>
                <td class="r">${Math.round(TRADICIONAL_DATA.ventas.cp.reduce((s, v) => s + v.gestores, 0) / TRADICIONAL_DATA.ventas.cp.length)}*</td>
                <td class="r">${fmt(cpFinanciaciones)}</td>
                <td class="r">${fmt(cpCantadas)}</td>
                <td class="r">${fmt(cpPositivas)}</td>
                <td class="r">${cpMeta > 0 ? badge(cpCumpl.toFixed(1).replace('.', ',') + '%', 'g') : badge('S/D', 'y')}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="font-size:.56rem; color:var(--gray3); margin-top:4px">${(() => {
          const pico = TRADICIONAL_DATA.ventas.cp.reduce((best, v) => v.financiaciones > best.financiaciones ? v : best, TRADICIONAL_DATA.ventas.cp[0]);
          return `${pico.mes} registra el mayor volumen de financiaciones (${fmt(pico.financiaciones)}) con ${pico.aliados} aliados activos.`;
        })()}</div>
      </div>

      <div class="panel" style="padding:8px 12px; display:flex; flex-direction:column">
        <h3 style="margin-bottom:4px; padding-bottom:3px; font-size:.68rem">${icon('bike')} Rueda Seguro Tradicional</h3>
        <div class="tbl-wrap" style="margin-top:0; flex-grow:1">
          <table class="tbl-compact" style="font-size:.66rem; width:100%; height:100%">
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
                <td class="r">${Math.round(TRADICIONAL_DATA.ventas.rs.reduce((s, v) => s + v.aliados, 0) / TRADICIONAL_DATA.ventas.rs.length)}*</td>
                <td class="r">${Math.round(TRADICIONAL_DATA.ventas.rs.reduce((s, v) => s + v.gestores, 0) / TRADICIONAL_DATA.ventas.rs.length)}*</td>
                <td class="r">${fmt(rsFinanciaciones)}</td>
                <td class="r">${fmt(rsCantadas)}</td>
                <td class="r">${fmt(rsPositivas)}</td>
                <td class="r">${rsMeta > 0 ? badge(rsCumpl.toFixed(1).replace('.', ',') + '%', 'g') : badge('S/D', 'y')}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="font-size:.56rem; color:var(--gray3); margin-top:4px">${(() => {
          const pico = TRADICIONAL_DATA.ventas.rs.reduce((best, v) => v.financiaciones > best.financiaciones ? v : best, TRADICIONAL_DATA.ventas.rs[0]);
          return `${pico.mes} muestra el mayor volumen de financiaciones de motocicletas (${fmt(pico.financiaciones)}) con ${pico.aliados} aliados activos.`;
        })()}</div>
      </div>
    </div>

    <div style="font-size:.58rem; color:var(--gray3); margin-top:4px">* Aliados y Gestores en la fila de total corresponden al promedio mensual de la estructura activa del canal.</div>

    <div class="alert alert-info" style="margin-top:4px; margin-bottom:0; padding:12px 18px; border-left: 4px solid var(--green); background: rgba(90,226,128,0.08)">
      <span class="ico">${icon('trending-up')}</span>
      <span style="font-size:.68rem; line-height:1.4; color:var(--dark)">${(() => {
        const picoCP = TRADICIONAL_DATA.ventas.cp.reduce((best, v) => v.financiaciones > best.financiaciones ? v : best, TRADICIONAL_DATA.ventas.cp[0]);
        const picoRS = TRADICIONAL_DATA.ventas.rs.reduce((best, v) => v.financiaciones > best.financiaciones ? v : best, TRADICIONAL_DATA.ventas.rs[0]);
        return `<strong>Logro Comercial:</strong> el canal Tradicional acumula a ${lastMesV === 'Ago' ? 'corte agosto' : lastMesV} <strong>${fmt(cpPositivas + rsPositivas)} ventas positivas</strong> entre Cuota Protegida y Rueda Seguro; ${picoCP.mes} marcó el mayor volumen de financiaciones en CP (<strong>${fmt(picoCP.financiaciones)}</strong>) y ${picoRS.mes} en RS (<strong>${fmt(picoRS.financiaciones)}</strong>) — una base sólida para acelerar la conversión en lo que resta del año.`;
      })()}</span>
    </div>
  `;
}

function renderCobertura() {
  const el = document.getElementById('cobertura-body');
  if (!el) return;

  const aliados = TRADICIONAL_DATA.cobertura.aliados;
  const half = Math.ceil(aliados.length / 2);
  const col1 = aliados.slice(0, half);
  const col2 = aliados.slice(half);
  const lastMesC = TRADICIONAL_DATA.visitas[TRADICIONAL_DATA.visitas.length - 1].mes;
  const halfMapa = Math.ceil(TRADICIONAL_DATA.mapa.length / 2);

  el.innerHTML = `
    <div class="two-col" style="grid-template-columns: 1.6fr 1fr; gap: 14px; align-items: start;">
      <!-- Columna Izquierda: Aliados completa sin scroll -->
      <div class="panel" style="padding:10px 14px; display:flex; flex-direction:column; min-height:360px">
        <h3 style="margin-bottom:6px; padding-bottom:3px; font-size:.74rem; border-bottom:1px dashed rgba(18,1,128,0.1)">${icon('store')} Cobertura de Formación por Aliado (Ene-${lastMesC} 2026)</h3>
        <p style="font-size: .58rem; color: var(--gray3); margin-top: -3px; margin-bottom: 8px;">
          Asesores que financiaron en conciliaciones vs capacitados (cruzados por cédula).
        </p>
        <div style="display:flex; gap:16px; flex-grow:1">
          <div style="flex:1">
            <table class="tbl-compact" style="font-size:0.6rem; table-layout:fixed; width:100%">
              <colgroup>
                <col style="width:48%">
                <col style="width:14%">
                <col style="width:14%">
                <col style="width:24%">
              </colgroup>
              <thead>
                <tr>
                  <th>Aliado</th>
                  <th class="r">Fin.</th>
                  <th class="r">Cap.</th>
                  <th class="r">Cob.</th>
                </tr>
              </thead>
              <tbody>
                ${col1.map(a => {
                  const showCob = a.cobertura !== null ? `${a.cobertura.toFixed(0)}%` : 'S/D';
                  const bType = a.cobertura !== null ? (a.cobertura >= 15 ? 'g' : a.cobertura >= 5 ? 'y' : 'r') : 'y';
                  return `
                    <tr>
                      <td style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${a.aliado}"><strong>${a.aliado}</strong></td>
                      <td class="r">${a.financiaron}</td>
                      <td class="r">${a.capacitados}</td>
                      <td class="r">${badge(showCob, bType)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
          <div style="flex:1">
            <table class="tbl-compact" style="font-size:0.6rem; table-layout:fixed; width:100%">
              <colgroup>
                <col style="width:48%">
                <col style="width:14%">
                <col style="width:14%">
                <col style="width:24%">
              </colgroup>
              <thead>
                <tr>
                  <th>Aliado</th>
                  <th class="r">Fin.</th>
                  <th class="r">Cap.</th>
                  <th class="r">Cob.</th>
                </tr>
              </thead>
              <tbody>
                ${col2.map(a => {
                  const showCob = a.cobertura !== null ? `${a.cobertura.toFixed(0)}%` : 'S/D';
                  const bType = a.cobertura !== null ? (a.cobertura >= 15 ? 'g' : a.cobertura >= 5 ? 'y' : 'r') : 'y';
                  return `
                    <tr>
                      <td style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;" title="${a.aliado}"><strong>${a.aliado}</strong></td>
                      <td class="r">${a.financiaron}</td>
                      <td class="r">${a.capacitados}</td>
                      <td class="r">${badge(showCob, bType)}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Columna Derecha: Meses y Municipios -->
      <div style="display:flex; flex-direction:column; gap:12px">
        <!-- Panel de Meses -->
        <div class="panel" style="padding:10px 14px">
          <h3 style="margin-bottom:4px; padding-bottom:2px; font-size:.74rem; border-bottom:1px dashed rgba(18,1,128,0.1)">${icon('calendar')} Cobertura por Mes (Semestre)</h3>
          <table class="tbl-compact" style="font-size:0.6rem">
            <thead>
              <tr>
                <th>Mes</th>
                <th class="r">Financ.</th>
                <th class="r">Capac.</th>
                <th class="r">Ambos</th>
                <th class="r">Cob. %</th>
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
              ${(() => {
                const ms = TRADICIONAL_DATA.cobertura.meses;
                const avg = k => Math.round(ms.reduce((s, m) => s + m[k], 0) / ms.length);
                const avgCob = ms.reduce((s, m) => s + m.cobertura, 0) / ms.length;
                return `
                  <tr class="total">
                    <td>Prom. Ene-${lastMesC}</td>
                    <td class="r">${avg('financiaron')}</td>
                    <td class="r">${avg('capacitados')}</td>
                    <td class="r"><strong>${avg('ambos')}</strong></td>
                    <td class="r">${badge(avgCob.toFixed(1).replace('.', ',') + '%', 'y')}</td>
                  </tr>
                `;
              })()}
            </tbody>
          </table>
        </div>

        <!-- Panel de Municipios Visitados -->
        <div class="panel" style="padding:10px 14px">
          <h3 style="margin-bottom:6px; padding-bottom:2px; font-size:.74rem; border-bottom:1px dashed rgba(18,1,128,0.1)">${icon('map-pin')} Municipios Visitados (Ene-${lastMesC})</h3>
          <div style="display:flex; gap:14px">
            <div style="flex:1">
              <table class="tbl-compact" style="font-size:0.56rem; table-layout:fixed; width:100%">
                <colgroup>
                  <col style="width:75%">
                  <col style="width:25%">
                </colgroup>
                <tbody>
                  ${TRADICIONAL_DATA.mapa.slice(0, halfMapa).map(pt => `
                    <tr>
                      <td style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><strong>${pt.name}</strong></td>
                      <td class="r" style="color:var(--teal)">${pt.visits}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
            <div style="flex:1">
              <table class="tbl-compact" style="font-size:0.56rem; table-layout:fixed; width:100%">
                <colgroup>
                  <col style="width:75%">
                  <col style="width:25%">
                </colgroup>
                <tbody>
                  ${TRADICIONAL_DATA.mapa.slice(halfMapa).map(pt => `
                    <tr>
                      <td style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"><strong>${pt.name}</strong></td>
                      <td class="r" style="color:var(--teal)">${pt.visits}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function coberturaTab(name) {
  // No-op ya que el mapa fue removido por diseño
}
