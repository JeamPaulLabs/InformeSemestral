// ============================================================
//  INFORME CANAL RETAIL 2026 – app_retail.js
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
   viven en ../core/deck-engine.js (compartido con Tradicional).
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

  RETAIL_DATA.mapa.forEach(pt => {
    const x = getX(pt.lon);
    const y = getY(pt.lat);
    const radius = Math.max(5, Math.min(15, 5 + (pt.visits / 12)));

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

  const lastIdx = RETAIL_DATA.visitas.length - 1;
  const lastMes = RETAIL_DATA.visitas[lastIdx].mes;
  const totalVisitas = RETAIL_DATA.visitas.reduce((s, v) => s + v.visitas, 0);
  const eneVisits = RETAIL_DATA.visitas[0].visitas;
  const junVisits = RETAIL_DATA.visitas[lastIdx].visitas;
  const dropPct = ((eneVisits - junVisits) / eneVisits * 100).toFixed(0);

  const pdvIni = RETAIL_DATA.ventas.cp[0].pdv;
  const pdvFin = RETAIL_DATA.ventas.cp[lastIdx].pdv;
  const pdvDropPct = ((pdvIni - pdvFin) / pdvIni * 100).toFixed(0);

  const efPorPdvIni = RETAIL_DATA.ventas.cp[0].efectivas / pdvIni;
  const efPorPdvFin = RETAIL_DATA.ventas.cp[lastIdx].efectivas / pdvFin;
  const efPorPdvUp = ((efPorPdvFin - efPorPdvIni) / efPorPdvIni * 100).toFixed(0);

  el.innerHTML = `
    <div class="kpi-grid" style="gap:12px; margin-bottom:12px">
      <div class="kpi-card" style="padding:10px 18px">
        <div class="kpi-label" style="font-size:.65rem">Visitas Realizadas Ene-${lastMes}</div>
        <div class="kpi-val" style="font-size:1.45rem">${fmt(totalVisitas)}</div>
        <div class="kpi-sub" style="font-size:.58rem">Total de formación acumulada (Ene - ${lastMes} 2026)</div>
      </div>
      <div class="kpi-card green" style="padding:10px 18px">
        <div class="kpi-label" style="font-size:.65rem">Eficiencia por PDV Activo</div>
        <div class="kpi-val" style="font-size:1.45rem">+${efPorPdvUp} %</div>
        <div class="kpi-sub" style="font-size:.58rem">De ${efPorPdvIni.toFixed(1)} a ${efPorPdvFin.toFixed(1)} pólizas por PDV activo</div>
      </div>
    </div>

    <div class="two-col" style="gap:14px; margin-bottom:12px">
      <div class="panel" style="padding:12px 16px; display:flex; flex-direction:column; justify-content:space-between; min-height:310px">
        <div>
          <h3 style="margin-bottom:8px; padding-bottom:4px; font-size:.78rem; border-bottom:1px dashed rgba(18,1,128,0.1)">${icon('calendar')} Planta activa vs. formaciones por mes</h3>
          <div class="tbl-wrap" style="margin-top:2px">
            <table class="tbl-compact" style="font-size:.72rem">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th class="r">Planta Gestores</th>
                  <th class="r">Capacitados</th>
                  <th class="r">PDV Visitados</th>
                  <th class="r">% Capacitados</th>
                </tr>
              </thead>
              <tbody>
                ${RETAIL_DATA.visitas.map((v, i) => {
                  const planta = RETAIL_DATA.ventas.cp[i].gestores;
                  const pctActive = planta > 0 ? (v.asesores / planta * 100).toFixed(0) + '%' : 'S/D';
                  const bType = planta > 0 ? (v.asesores / planta * 100 >= 45 ? 'g' : v.asesores / planta * 100 >= 30 ? 'y' : 'r') : 'y';
                  return `
                    <tr>
                      <td><strong>${v.mes}</strong></td>
                      <td class="r">${planta > 0 ? planta : 'S/D'}</td>
                      <td class="r">${v.asesores}</td>
                      <td class="r">${v.pdvs}</td>
                      <td class="r">${planta > 0 ? badge(pctActive, bType) : badge('S/D', 'y')}</td>
                    </tr>
                  `;
                }).join('')}
                ${(() => {
                  const n = RETAIL_DATA.visitas.length;
                  const avgPlanta = Math.round(RETAIL_DATA.visitas.reduce((s, v, i) => s + RETAIL_DATA.ventas.cp[i].gestores, 0) / n);
                  const avgPct = RETAIL_DATA.visitas.reduce((s, v, i) => {
                    const planta = RETAIL_DATA.ventas.cp[i].gestores;
                    return s + (planta > 0 ? v.asesores / planta * 100 : 0);
                  }, 0) / n;
                  return `
                    <tr class="total">
                      <td>Total Ene-${lastMes}</td>
                      <td class="r">${avgPlanta}*</td>
                      <td class="r">${RETAIL_DATA.visitas.reduce((s, v) => s + v.asesores, 0)}</td>
                      <td class="r">${RETAIL_DATA.visitas.reduce((s, v) => s + v.pdvs, 0)}</td>
                      <td class="r">${badge(avgPct.toFixed(0) + '%', 'y')}</td>
                    </tr>
                  `;
                })()}
              </tbody>
            </table>
          </div>
        </div>
        <div style="font-size:.58rem; color:var(--gray3); margin-top:8px; line-height:1.4">
          * Planta = gestores comerciales con actividad transaccional registrados en el "Como vamos" (cierres mensuales); en la fila de total corresponde al promedio mensual.
        </div>
      </div>

      <div class="panel" style="padding:12px 16px; display:flex; flex-direction:column; justify-content:space-between; min-height:310px">
        <div>
          <h3 style="margin-bottom:8px; padding-bottom:4px; font-size:.78rem; border-bottom:1px dashed rgba(18,1,128,0.1)">${icon('trending-down')} Evolución de visitas por mes</h3>
          <div class="chart-wrap" style="margin-top:10px; display:flex; flex-direction:column; gap:8px">
            ${RETAIL_DATA.visitas.map((v, i) => {
              const maxV = Math.max(...RETAIL_DATA.visitas.map(x=>x.visitas));
              const pct = (v.visitas / maxV * 100).toFixed(0) + '%';
              const colorClass = i >= RETAIL_DATA.visitas.length - 2 ? 'warn' : 'teal';
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
          La concentración de visitas potencia la efectividad del canal.
        </div>
      </div>
    </div>
    <div class="alert alert-info" style="margin-top:14px; margin-bottom:24px; padding:12px 18px; border-left: 4px solid var(--teal); background: rgba(0,205,147,0.06)">
      <span class="ico">${icon('shield-check')}</span>
      <span style="font-size:.72rem; line-height:1.4; color:var(--dark)"><strong>Logro del periodo:</strong> La reestructuración estratégica de zonas y canales de Retail (empalme con Tradicional) concentró la operación en puntos de mayor valor. Como resultado, a pesar del menor número de visitas, las ventas efectivas por PDV subieron <strong>+${efPorPdvUp}%</strong> (de ${efPorPdvIni.toFixed(1).replace('.', ',')} a ${efPorPdvFin.toFixed(1).replace('.', ',')} pólizas/PDV entre ene y ${lastMes.toLowerCase()}), demostrando una alta eficiencia comercial y un canal más enfocado y productivo.</span>
    </div>
    <div style="height: 10px;"></div>
  `;
}

function renderVentas() {
  const el = document.getElementById('ventas-body');
  if (!el) return;

  // Calculos CP
  const totalCantadasCP = RETAIL_DATA.ventas.cp.reduce((s, v) => s + v.cantadas, 0);
  const totalEfectivasCP = RETAIL_DATA.ventas.cp.reduce((s, v) => s + v.efectivas, 0);
  const promEfectCP = totalCantadasCP > 0 ? (totalEfectivasCP / totalCantadasCP * 100) : 0;

  // Calculos RS
  const totalCantadasRS = RETAIL_DATA.ventas.rs.reduce((s, v) => s + v.cantadas, 0);
  const totalEfectivasRS = RETAIL_DATA.ventas.rs.reduce((s, v) => s + v.efectivas, 0);
  const promEfectRS = totalCantadasRS > 0 ? (totalEfectivasRS / totalCantadasRS * 100) : 0;

  const lastIdxV = RETAIL_DATA.ventas.cp.length - 1;
  const lastMesV = RETAIL_DATA.ventas.cp[lastIdxV].mes;
  const picoCP = RETAIL_DATA.ventas.cp.reduce((best, v) => v.efectivas > best.efectivas ? v : best, RETAIL_DATA.ventas.cp[0]);
  const ultimos2CP = RETAIL_DATA.ventas.cp[lastIdxV - 1].efectivas + RETAIL_DATA.ventas.cp[lastIdxV].efectivas;
  const ultimos2Label = `${RETAIL_DATA.ventas.cp[lastIdxV - 1].mes} + ${lastMesV}`;

  el.innerHTML = `
    <div class="kpi-grid" style="gap:8px; margin-bottom:8px">
      <div class="kpi-card green" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Ventas CP Ene-${lastMesV} (Efectivas)</div>
        <div class="kpi-val" style="font-size:.85rem">${fmt(totalEfectivasCP)}</div>
        <div class="kpi-sub" style="font-size:.5rem">Total de ${fmt(totalCantadasCP)} cantadas (${promEfectCP.toFixed(1).replace('.', ',')}%)</div>
      </div>
      <div class="kpi-card green" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Ventas RS Ene-${lastMesV} (Efectivas)</div>
        <div class="kpi-val" style="font-size:.85rem">${fmt(totalEfectivasRS)}</div>
        <div class="kpi-sub" style="font-size:.5rem">Total de ${fmt(totalCantadasRS)} cantadas (${promEfectRS.toFixed(1).replace('.', ',')}%)</div>
      </div>
      <div class="kpi-card" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Pico CP del periodo</div>
        <div class="kpi-val" style="font-size:.85rem">${fmt(picoCP.efectivas)}</div>
        <div class="kpi-sub" style="font-size:.5rem">${picoCP.mes} · ${picoCP.gestores} gestores activos</div>
      </div>
      <div class="kpi-card warn" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Ventas CP ${ultimos2Label}</div>
        <div class="kpi-val" style="font-size:.85rem">${fmt(ultimos2CP)}</div>
        <div class="kpi-sub" style="font-size:.5rem">${lastMesV === 'Ago' ? 'Agosto a corte 16' : 'Reales consolidadas de cierre'}</div>
      </div>
    </div>

    <div class="two-col" style="gap:10px">
      <div class="panel" style="padding:8px 12px; display:flex; flex-direction:column">
        <h3 style="margin-bottom:4px; padding-bottom:3px; font-size:.68rem">${icon('shield')} Cuota Protegida Retail (Como vamos)</h3>
        <div class="tbl-wrap" style="margin-top:0; flex-grow:1">
          <table class="tbl-compact" style="width:100%; height:100%">
            <thead>
              <tr>
                <th>Mes</th>
                <th class="r">Gestores</th>
                <th class="r">PDV</th>
                <th class="r">Cantadas</th>
                <th class="r">Efectivas</th>
                <th class="r">% Efect.</th>
              </tr>
            </thead>
            <tbody>
              ${(() => {
                const maxCP = Math.max(...RETAIL_DATA.ventas.cp.map(x => x.efectivas));
                return RETAIL_DATA.ventas.cp.map(v => {
                  const pct = v.cantadas > 0 ? (v.efectivas / v.cantadas * 100) : 0;
                  const bType = pct >= 80 ? 'g' : pct >= 70 ? 'y' : 'r';
                  const showPct = v.cantadas > 0 ? `${pct.toFixed(1).replace('.', ',')}%` : 'S/D';
                  const barW = maxCP > 0 ? (v.efectivas / maxCP * 100).toFixed(0) + '%' : '0%';
                  return `
                    <tr>
                      <td><strong>${v.mes}</strong></td>
                      <td class="r">${v.gestores > 0 ? v.gestores : 'S/D'}</td>
                      <td class="r">${v.pdv > 0 ? v.pdv : 'S/D'}</td>
                      <td class="r">${fmt(v.cantadas)}</td>
                      <td class="r">
                        <div style="display:flex; flex-direction:column; align-items:flex-end">
                          <span>${fmt(v.efectivas)}</span>
                          <div style="width:40px; background:rgba(255,255,255,0.08); height:3px; border-radius:1px; overflow:hidden; margin-top:2px">
                            <div style="width:${barW}; background:var(--green); height:100%"></div>
                          </div>
                        </div>
                      </td>
                      <td class="r">${showPct !== 'S/D' ? badge(showPct, bType) : badge('S/D', 'y')}</td>
                    </tr>
                  `;
                }).join('');
              })()}
              <tr class="total">
                <td>Total Ene-${lastMesV}</td>
                <td class="r">${Math.round(RETAIL_DATA.ventas.cp.reduce((s, v) => s + v.gestores, 0) / RETAIL_DATA.ventas.cp.length)}*</td>
                <td class="r">${Math.round(RETAIL_DATA.ventas.cp.reduce((s, v) => s + v.pdv, 0) / RETAIL_DATA.ventas.cp.length)}*</td>
                <td class="r">${fmt(totalCantadasCP)}</td>
                <td class="r">${fmt(totalEfectivasCP)}</td>
                <td class="r">${badge(promEfectCP.toFixed(1).replace('.', ',') + '%', 'g')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel" style="display:flex; flex-direction:column; padding:8px 12px">
        <div style="display:flex; flex-direction:column; flex-grow:1">
          <h3 style="margin-bottom:4px; padding-bottom:3px; font-size:.68rem">${icon('bike')} Rueda Seguro Retail (Como vamos)</h3>
          <div class="tbl-wrap" style="margin-top:0; flex-grow:1">
            <table class="tbl-compact" style="width:100%; height:100%">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th class="r">Gestores</th>
                  <th class="r">Cantadas</th>
                  <th class="r">Efectivas</th>
                  <th class="r">% Efect.</th>
                </tr>
              </thead>
              <tbody>
                ${(() => {
                  const maxRS = Math.max(...RETAIL_DATA.ventas.rs.map(x => x.efectivas));
                  return RETAIL_DATA.ventas.rs.map(v => {
                    const pct = v.cantadas > 0 ? (v.efectivas / v.cantadas * 100) : 0;
                    const bType = pct >= 65 ? 'g' : pct >= 50 ? 'y' : 'r';
                    const barW = maxRS > 0 ? (v.efectivas / maxRS * 100).toFixed(0) + '%' : '0%';
                    return `
                      <tr>
                        <td><strong>${v.mes}</strong></td>
                        <td class="r">${v.gestores}</td>
                        <td class="r">${fmt(v.cantadas)}</td>
                        <td class="r">
                          <div style="display:flex; flex-direction:column; align-items:flex-end">
                            <span>${fmt(v.efectivas)}</span>
                            <div style="width:40px; background:rgba(255,255,255,0.08); height:3px; border-radius:1px; overflow:hidden; margin-top:2px">
                              <div style="width:${barW}; background:var(--teal); height:100%"></div>
                            </div>
                          </div>
                        </td>
                        <td class="r">${badge(pct.toFixed(1).replace('.', ',') + '%', bType)}</td>
                      </tr>
                    `;
                  }).join('');
                })()}
                <tr class="total">
                  <td>Total Ene-${lastMesV}</td>
                  <td class="r">${Math.round(RETAIL_DATA.ventas.rs.reduce((s, v) => s + v.gestores, 0) / RETAIL_DATA.ventas.rs.length)}*</td>
                  <td class="r">${fmt(totalCantadasRS)}</td>
                  <td class="r">${fmt(totalEfectivasRS)}</td>
                  <td class="r">${badge(promEfectRS.toFixed(1).replace('.', ',') + '%', 'g')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <div style="font-size:.58rem; color:var(--gray3); margin-top:4px">* Gestores y PDV en la fila de total corresponden al promedio mensual de la estructura activa del canal (los mismos gestores atienden Cuota Protegida y Rueda Seguro).</div>

    <div class="alert alert-info" style="margin-top:4px; margin-bottom:0; padding:12px 18px; border-left: 4px solid var(--green); background: rgba(90,226,128,0.08)">
      <span class="ico">${icon('trending-up')}</span>
      <span style="font-size:.68rem; line-height:1.4; color:var(--dark)"><strong>Logro Comercial:</strong> el canal Retail acumula a ${lastMesV === 'Ago' ? 'corte agosto' : lastMesV} <strong>${fmt(totalEfectivasCP + totalEfectivasRS)} ventas efectivas</strong> entre Cuota Protegida y Rueda Seguro, sosteniendo una efectividad promedio superior al <strong>${Math.min(promEfectCP, promEfectRS).toFixed(0)} %</strong> durante todo el periodo — un desempeño comercial consistente que valida el enfoque del canal en los puntos de mayor valor.</span>
    </div>
  `;
}

function renderCobertura() {
  const el = document.getElementById('cobertura-body');
  if (!el) return;

  // Cobertura de PDV visitados vs. activos (con gestión en CP) — datos en
  // data_retail.js como COBERTURA_PDV. El mapa fue reemplazado por la lista
  // de municipios visitados, alineado con el slide equivalente de Tradicional.

  const lastCobPDV = COBERTURA_PDV[COBERTURA_PDV.length - 1];
  const totalVisitasFormacion = RETAIL_DATA.visitas.reduce((s, v) => s + v.visitas, 0);
  const lastIdxV = RETAIL_DATA.ventas.cp.length - 1;
  const lastMesV = RETAIL_DATA.ventas.cp[lastIdxV].mes;

  el.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:4px">
    <div class="kpi-grid" style="gap:8px; margin-bottom:4px">
      <div class="kpi-card" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">PDV con gestión promedio</div>
        <div class="kpi-val" style="font-size:.85rem">${(COBERTURA_PDV.reduce((s,d)=>s+d.gestion,0)/COBERTURA_PDV.length).toFixed(0)}</div>
        <div class="kpi-sub" style="font-size:.5rem">Total PDV activos en CP</div>
      </div>
      <div class="kpi-card warn" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Cobertura ${lastCobPDV.mes}</div>
        <div class="kpi-val" style="font-size:.85rem">${lastCobPDV.pct.toFixed(1).replace('.', ',')} %</div>
        <div class="kpi-sub" style="font-size:.5rem">${lastCobPDV.visitas} de ${lastCobPDV.gestion} PDV activos visitados</div>
      </div>
      <div class="kpi-card" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Visitas de formación Ene-${lastCobPDV.mes}</div>
        <div class="kpi-val" style="font-size:.85rem">${fmt(totalVisitasFormacion)}</div>
        <div class="kpi-sub" style="font-size:.5rem">Capacitando asesores de venta</div>
      </div>
      <div class="kpi-card" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Zonas / municipios</div>
        <div class="kpi-val" style="font-size:.85rem">${RETAIL_DATA.mapa.length}</div>
        <div class="kpi-sub" style="font-size:.5rem">Con al menos una visita registrada</div>
      </div>
    </div>

    <div class="two-col" style="gap:10px">
      <div class="panel" style="padding:8px 14px; display:flex; flex-direction:column">
        <h3 style="margin-bottom:2px; padding-bottom:2px; font-size:.68rem">${icon('map')} Cobertura de formación en Puntos de Venta (PDV)</h3>
        <p style="font-size:.58rem; color:var(--gray3); margin:2px 0 6px">
          PDV visitados por Formación vs. PDV con gestión comercial activa en Cuota Protegida cada mes (cortes "Como vamos").
        </p>
        <div class="tbl-wrap" style="margin-top:0; flex-grow:1">
          <table class="tbl-compact" style="width:100%; table-layout:fixed">
            <colgroup>
              <col style="width:16%">
              <col style="width:20%">
              <col style="width:23%">
              <col style="width:21%">
              <col style="width:20%">
            </colgroup>
            <thead>
              <tr>
                <th>Mes</th>
                <th class="r">Gestores</th>
                <th class="r">PDV con Gestión</th>
                <th class="r">PDV Visitados</th>
                <th class="r">Cobertura %</th>
              </tr>
            </thead>
            <tbody>
              ${COBERTURA_PDV.map(d => {
                const bType = d.pct >= 55 ? 'g' : d.pct >= 40 ? 'y' : 'r';
                return `
                  <tr>
                    <td><strong>${d.mes}</strong></td>
                    <td class="r">${d.gestores}</td>
                    <td class="r">${d.gestion}</td>
                    <td class="r">${d.visitas}</td>
                    <td class="r">${badge(d.pct.toFixed(1).replace('.', ',') + '%', bType)}</td>
                  </tr>
                `;
              }).join('')}
              ${(() => {
                const n = COBERTURA_PDV.length;
                const avg = k => Math.round(COBERTURA_PDV.reduce((s, d) => s + d[k], 0) / n);
                const avgPct = COBERTURA_PDV.reduce((s, d) => s + d.pct, 0) / n;
                return `
                  <tr class="total">
                    <td>Prom. Ene-${lastCobPDV.mes}</td>
                    <td class="r">${avg('gestores')}</td>
                    <td class="r">${avg('gestion')}</td>
                    <td class="r">${avg('visitas')}</td>
                    <td class="r">${badge(avgPct.toFixed(1).replace('.', ',') + '%', 'y')}</td>
                  </tr>
                `;
              })()}
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel" style="padding:8px 16px">
        <h3 style="margin-bottom:4px; padding-bottom:4px">${icon('store')} Universo de PDV y cobertura real por aliado (Ene-${lastCobPDV.mes})</h3>
        <div class="tbl-wrap" style="margin-top:0">
          <table class="tbl-compact">
            <thead>
              <tr>
                <th>Aliado</th>
                <th class="r">Universo PDV*</th>
                <th class="r">PDV visitados</th>
                <th class="r">Cobertura</th>
                <th class="r">Visitas</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><strong>Colombiana de Comercio</strong> (Alkosto/Ktronix)</td>
                <td class="r">54</td>
                <td class="r">40</td>
                <td class="r">${badge('74,1 %','y')}</td>
                <td class="r">229</td>
              </tr>
              <tr>
                <td><strong>Almacenes Éxito</strong> <span class="pend" style="font-size:.58rem">aliado retirado</span></td>
                <td class="r">31</td>
                <td class="r">36</td>
                <td class="r">${badge('116 %','g')}</td>
                <td class="r">99</td>
              </tr>
              <tr>
                <td><strong>Cencosud</strong> (Jumbo/Metro/Easy)</td>
                <td class="r">35</td>
                <td class="r">32</td>
                <td class="r">${badge('91,4 %','g')}</td>
                <td class="r">104</td>
              </tr>
              <tr>
                <td><strong>Olímpica</strong> <span class="pend" style="font-size:.58rem">solo ene · aliado retirado</span></td>
                <td class="r">6</td>
                <td class="r">4</td>
                <td class="r">${badge('66,7 %','y')}</td>
                <td class="r">8</td>
              </tr>
              <tr class="total">
                <td>Total canal</td>
                <td class="r">126</td>
                <td class="r">112</td>
                <td class="r">${badge('88,9 %','g')}</td>
                <td class="r">440</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="font-size:.6rem; color:var(--gray3); margin-top:5px">* Universo = PDV físicos distintos observados en los cortes semanales "Como vamos" de Ene-${lastCobPDV.mes}. Coberturas &gt;100 % indican PDV que Formación visitó con nombre distinto al registrado en Como vamos ese corte, o puntos sin gestión comercial activa ese mes. <strong>Gestores del canal:</strong> ${RETAIL_DATA.ventas.cp[0].gestores} (ene) → ${RETAIL_DATA.ventas.cp[lastIdxV].gestores} (${lastMesV.toLowerCase()}); los cortes "Como vamos" no desagregan gestores por aliado.</div>
      </div>
    </div>

    <div style="display:flex; flex-direction:column; gap:6px; margin-top:4px">
    <div class="two-col" style="gap:10px; align-items:stretch; grid-template-columns:1fr 1.35fr">
      <div class="panel" style="padding:8px 14px">
        <h3 style="margin-bottom:2px; padding-bottom:2px; font-size:.7rem; border-bottom:1px dashed rgba(18,1,128,0.1)">${icon('map-pin')} Municipios Visitados (Ene-${lastCobPDV.mes})</h3>
        <p style="font-size:.56rem; color:var(--gray3); margin:2px 0 6px">
          Zonas y municipios con al menos una visita de formación registrada en el periodo.
        </p>
        <div style="display:flex; gap:14px">
          <div style="flex:1">
            <table class="tbl-compact" style="font-size:0.56rem; table-layout:fixed; width:100%">
              <colgroup>
                <col style="width:75%">
                <col style="width:25%">
              </colgroup>
              <tbody>
                ${RETAIL_DATA.mapa.slice(0, Math.ceil(RETAIL_DATA.mapa.length / 2)).map(pt => `
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
                ${RETAIL_DATA.mapa.slice(Math.ceil(RETAIL_DATA.mapa.length / 2)).map(pt => `
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
      <div class="panel" style="padding:8px 14px; box-shadow:none; border:1px solid var(--gray2); display:flex; flex-direction:column; justify-content:space-between">
        <div style="font-size:.6rem; font-weight:800; color:var(--blue); letter-spacing:.05em; margin-bottom:4px">${icon('tag', { size: 13 })} TIPO DE PUNTO VISITADO EN LAS 103 "SERDÁN" (Ene-${lastCobPDV.mes})</div>
        <p style="font-size:.6rem; color:var(--dark); line-height:1.45; margin:0 0 6px"><strong>Sobre "Serdán" (103 visitas):</strong> empresa que provee promotores a ambos canales, no un aliado. De las 103: 48 puras Retail+Tradicional, 39 sedes/roles internos (no PDV), 15 con cédula activa en ambos canales <strong>(contadas en los dos)</strong> y 1 sin clasificar. Total atribuido: <strong>24 a Retail</strong> y <strong>54 a Tradicional</strong>.</p>
        <div style="display:flex; gap:8px; flex-wrap:wrap">
          <div style="flex:1; min-width:85px; text-align:center; background:var(--gray1); border-radius:8px; padding:5px">
            <div style="font-weight:800; font-size:.9rem; color:var(--teal)">42</div>
            <div style="font-size:.58rem; color:var(--gray3)">PDV físico</div>
          </div>
          <div style="flex:1; min-width:85px; text-align:center; background:var(--gray1); border-radius:8px; padding:5px">
            <div style="font-weight:800; font-size:.9rem; color:var(--blue)">23</div>
            <div style="font-size:.58rem; color:var(--gray3)">Sede Serdán</div>
          </div>
          <div style="flex:1; min-width:85px; text-align:center; background:var(--gray1); border-radius:8px; padding:5px">
            <div style="font-weight:800; font-size:.9rem; color:var(--warn)">28</div>
            <div style="font-size:.58rem; color:var(--gray3)">Itinerante</div>
          </div>
          <div style="flex:1; min-width:85px; text-align:center; background:var(--gray1); border-radius:8px; padding:5px">
            <div style="font-weight:800; font-size:.9rem; color:var(--blue)">6</div>
            <div style="font-size:.58rem; color:var(--gray3)">Ofic. SAC</div>
          </div>
          <div style="flex:1; min-width:85px; text-align:center; background:var(--gray1); border-radius:8px; padding:5px">
            <div style="font-weight:800; font-size:.9rem; color:var(--gray3)">4</div>
            <div style="font-size:.58rem; color:var(--gray3)">Supervisión</div>
          </div>
        </div>
        <div style="font-size:.58rem; color:var(--gray3); margin-top:5px">Solo el 41 % fue a un PDV físico; el resto es actividad real de formación que no suma a cobertura de PDV.</div>
      </div>
    </div>
    </div>
    </div>
  `;
}

function coberturaTab(name) {
  // No-op: el mapa fue removido por diseño; la slide ya no usa pestañas.
}
