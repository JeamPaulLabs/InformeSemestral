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
  if (map !== null) {
    setTimeout(() => {
      map.invalidateSize();
      if (TRADICIONAL_DATA.mapa.length > 0) {
        const bounds = TRADICIONAL_DATA.mapa.map(pt => [pt.lat, pt.lon]);
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    }, 100);
    return;
  }

  const container = document.getElementById('map-container');
  if (!container) return;

  // Initialize Map
  map = L.map('map-container').setView([4.628, -74.075], 9);
  
  L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
  }).addTo(map);

  // Add shaded municipality polygons
  TRADICIONAL_DATA.mapa.forEach(pt => {
    const geom = MUNICIPALITIES_GEOJSON[pt.name];
    if (geom && (geom.type === 'Polygon' || geom.type === 'MultiPolygon')) {
      const feature = {
        "type": "Feature",
        "properties": {
          "name": pt.name,
          "visits": pt.visits
        },
        "geometry": geom
      };

      const geojsonLayer = L.geoJSON(feature, {
        style: function () {
          return {
            fillColor: '#00CD93', // Verde Oscuro / Teal
            color: '#5AE280',     // Verde Claro
            weight: 1.5,
            opacity: 0.8,
            fillOpacity: 0.35
          };
        }
      }).addTo(map);

      geojsonLayer.bindPopup(`
        <div style="font-family:'Raleway',sans-serif;font-size:0.78rem;color:#ffffff;line-height:1.45">
          <strong style="color:#00CD93;font-size:0.85rem">${pt.name}</strong><br>
          <span style="display:inline-block;margin-top:4px">Visitas de formación: <strong>${pt.visits}</strong></span>
        </div>
      `, {
        className: 'custom-popup'
      });

      // Hover effects
      geojsonLayer.on('mouseover', function (e) {
        e.target.setStyle({ fillOpacity: 0.55, weight: 2, color: '#00CD93' });
      });
      geojsonLayer.on('mouseout', function (e) {
        e.target.setStyle({ fillOpacity: 0.35, weight: 1.5, color: '#5AE280' });
      });
    } else {
      // Fallback to geographic circle if no polygon available (e.g. Points)
      const radius = Math.max(3000, Math.sqrt(pt.visits) * 850);
      const zone = L.circle([pt.lat, pt.lon], {
        radius: radius,
        fillColor: '#00CD93',
        color: '#5AE280',
        weight: 1,
        opacity: 0.6,
        fillOpacity: 0.35
      }).addTo(map);

      zone.bindPopup(`
        <div style="font-family:'Raleway',sans-serif;font-size:0.78rem;color:#ffffff;line-height:1.45">
          <strong style="color:#00CD93;font-size:0.85rem">${pt.name}</strong><br>
          <span style="display:inline-block;margin-top:4px">Visitas de formación: <strong>${pt.visits}</strong></span>
        </div>
      `, {
        className: 'custom-popup'
      });
    }
  });

  setTimeout(() => {
    map.invalidateSize();
    if (TRADICIONAL_DATA.mapa.length > 0) {
      const bounds = TRADICIONAL_DATA.mapa.map(pt => [pt.lat, pt.lon]);
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, 200);
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
    <div class="kpi-grid" style="gap:8px; margin-bottom:8px">
      <div class="kpi-card" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Visitas Realizadas 1S</div>
        <div class="kpi-val" style="font-size:.85rem">${fmt(totalVisitas)}</div>
        <div class="kpi-sub" style="font-size:.5rem">Enero - Junio 2026</div>
      </div>
      <div class="kpi-card" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">PDV Promedio / Mes</div>
        <div class="kpi-val" style="font-size:.85rem">${(TRADICIONAL_DATA.visitas.reduce((s, v) => s + v.pdvs, 0) / 6).toFixed(1)}</div>
        <div class="kpi-sub" style="font-size:.5rem">Sobre ${bestMonth.pdvs} PDV en Enero</div>
      </div>
    </div>

    <div class="panel" style="padding:8px 12px">
      <h3 style="margin-bottom:4px; padding-bottom:3px; font-size:.68rem">${icon('trending-down')} Evolución de visitas por mes</h3>
      <div class="chart-wrap" style="margin-top:2px">
        ${TRADICIONAL_DATA.visitas.map(v => {
          const pct = (v.visitas / bestMonth.visitas * 100).toFixed(0) + '%';
          const colorClass = (v.mes === 'May' || v.mes === 'Jun') ? 'warn' : 'teal';
          const style = colorClass === 'warn' ? 'background:linear-gradient(90deg,#e05320,#ff6b35)' : '';
          return `
            <div class="bar-row">
              <span class="bar-label" style="font-size:.58rem">${v.mes}</span>
              <div class="bar-track">
                <div class="bar-fill ${colorClass === 'teal' ? 'teal' : ''}" data-w="${pct}" style="width:0; ${style}"></div>
              </div>
              <span class="bar-val" style="font-size:.58rem">${v.visitas}</span>
            </div>
          `;
        }).join('')}
      </div>
    </div>
    <div class="alert alert-warn" style="margin-top:6px; padding:6px 12px">
      <span class="ico">${icon('alert-triangle')}</span>
      <span style="font-size:.62rem"><strong>Por qué cayó abril-junio:</strong> marzo concentró el esfuerzo (148 visitas, 93 asesores); desde abril, la reestructuración de zonas y canales (empalme con Retail) redujo la ejecución hasta 43 visitas en junio (-72 %) — no una caída de desempeño, sino de capacidad temporal de visitar.</span>
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
