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
  'Portada', 'Formación', 'Geografía', 'Ventas CP', 'Ventas RS', 'Cobertura', 'Estrategia 2S', 'Cierre'
];

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
  renderMapaSlide();
  renderVentasCP();
  renderVentasRS();
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

  el.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card">
        <div class="kpi-label">Visitas Realizadas 1S</div>
        <div class="kpi-val">${fmt(totalVisitas)}</div>
        <div class="kpi-sub">Enero - Junio 2026</div>
      </div>
      <div class="kpi-card green">
        <div class="kpi-label">Mejor Mes (Visitas)</div>
        <div class="kpi-val">${bestMonth.visitas}</div>
        <div class="kpi-sub">${bestMonth.mes} · ${bestMonth.asesores} asesores capacitados</div>
      </div>
      <div class="kpi-card warn">
        <div class="kpi-label">Variación Mar → Jun</div>
        <div class="kpi-val">${dropPct} %</div>
        <div class="kpi-sub">${marVisits} visitas → ${junVisits} visitas</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">PDV Promedio / Mes</div>
        <div class="kpi-val">${(TRADICIONAL_DATA.visitas.reduce((s, v) => s + v.pdvs, 0) / 6).toFixed(1)}</div>
        <div class="kpi-sub">Sobre ${bestMonth.pdvs} PDV en Enero</div>
      </div>
    </div>

    <div class="two-col">
      <div class="panel">
        <h3>${icon('calendar')} Visitas, asesores capacitados y PDV por mes</h3>
        <div class="tbl-wrap" style="margin-top:0">
          <table>
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
                <td class="r">—</td>
                <td class="r">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel">
        <h3>${icon('trending-down')} Evolución de visitas por mes</h3>
        <div class="chart-wrap" style="margin-top:8px">
          ${TRADICIONAL_DATA.visitas.map(v => {
            const pct = (v.visitas / bestMonth.visitas * 100).toFixed(0) + '%';
            const colorClass = (v.mes === 'May' || v.mes === 'Jun') ? 'warn' : 'teal';
            const style = colorClass === 'warn' ? 'background:linear-gradient(90deg,#e05320,#ff6b35)' : '';
            return `
              <div class="bar-row">
                <span class="bar-label">${v.mes}</span>
                <div class="bar-track">
                  <div class="bar-fill ${colorClass === 'teal' ? 'teal' : ''}" data-w="${pct}" style="width:0; ${style}"></div>
                </div>
                <span class="bar-val">${v.visitas}</span>
              </div>
            `;
          }).join('')}
        </div>
        <div class="alert alert-warn" style="margin-top:14px">
          <span class="ico">${icon('alert-triangle')}</span>
          <span>Marzo concentró el esfuerzo (148 visitas, 93 asesores) y desde abril la ejecución cae hasta 43 visitas en junio (-72 %). Causa: reestructuración de rutas y de planta.</span>
        </div>
      </div>
    </div>
  `;
}

function renderMapaSlide() {
  const el = document.getElementById('mapa-body');
  if (!el) return;

  el.innerHTML = `
    <div class="two-col" style="grid-template-columns: 1.5fr 1fr; gap: 20px;">
      <div class="panel" style="position: relative; height: 500px; padding: 0; overflow: hidden; border-radius: 12px; border: 1px solid var(--gray2); box-shadow: 0 4px 12px rgba(0,0,0,0.05)">
        <div id="map-container" style="width: 100%; height: 100%"></div>
      </div>
      <div class="panel" style="max-height: 500px; display: flex; flex-direction: column;">
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
        <div class="alert alert-info" style="margin-top: 12px; margin-bottom: 0;">
          <span class="ico">${icon('pin')}</span>
          <span>Bogotá Centro, Sur y Occidente agrupan el 62% del total. Tunja, Bucaramanga y Soacha reportan importante despliegue regional.</span>
        </div>
      </div>
    </div>
  `;
}

function renderVentasCP() {
  const el = document.getElementById('ventas-cp-body');
  if (!el) return;

  const totalCantadas = TRADICIONAL_DATA.ventas.cp.reduce((s, v) => s + v.cantadas, 0);
  const totalPositivas = TRADICIONAL_DATA.ventas.cp.reduce((s, v) => s + v.positivas, 0);
  const totalFinanciaciones = TRADICIONAL_DATA.ventas.cp.reduce((s, v) => s + v.financiaciones, 0);
  const totalMeta = TRADICIONAL_DATA.ventas.cp.reduce((s, v) => s + v.meta, 0);

  const penetracion = totalFinanciaciones > 0 ? (totalCantadas / totalFinanciaciones * 100) : 0;
  const cumplimiento = totalMeta > 0 ? (totalPositivas / totalMeta * 100) : 0;

  el.innerHTML = `
    <div class="kpi-grid" style="gap:12px">
      <div class="kpi-card" style="padding:10px 16px">
        <div class="kpi-label">Financiaciones Ene–Jun</div>
        <div class="kpi-val">${fmt(totalFinanciaciones)}</div>
        <div class="kpi-sub">Universo total de oportunidades</div>
      </div>
      <div class="kpi-card green" style="padding:10px 16px">
        <div class="kpi-label">Ventas Positivas 1S</div>
        <div class="kpi-val">${fmt(totalPositivas)}</div>
        <div class="kpi-sub">${fmt(totalCantadas)} cantadas (${(totalCantadas > 0 ? totalPositivas/totalCantadas*100 : 0).toFixed(1)}% efectivas)</div>
      </div>
      <div class="kpi-card warn" style="padding:10px 16px">
        <div class="kpi-label">% Cumplimiento Meta</div>
        <div class="kpi-val">${cumplimiento.toFixed(1).replace('.', ',')}%</div>
        <div class="kpi-sub">${fmt(totalPositivas)} de ${fmt(totalMeta)} meta total</div>
      </div>
      <div class="kpi-card" style="padding:10px 16px">
        <div class="kpi-label">Penetración Canal</div>
        <div class="kpi-val">${penetracion.toFixed(2).replace('.', ',')}%</div>
        <div class="kpi-sub">Total Cantadas / Financiaciones</div>
      </div>
    </div>

    <div class="panel" style="padding:12px 16px">
      <h3 style="margin-bottom:6px; padding-bottom:5px">${icon('shield')} Evolución mensual Cuota Protegida Tradicional (Como vamos)</h3>
      <div class="tbl-wrap" style="margin-top:0">
        <table class="tbl-compact">
          <thead>
            <tr>
              <th>Mes</th>
              <th class="r">Aliados</th>
              <th class="r">Financiaciones</th>
              <th class="r">Cantadas</th>
              <th class="r">Positivas</th>
              <th class="r">Meta</th>
              <th class="r">% Cumpl.</th>
              <th class="r">Penetración</th>
            </tr>
          </thead>
          <tbody>
            ${TRADICIONAL_DATA.ventas.cp.map(v => {
              const pct = v.meta > 0 ? (v.positivas / v.meta * 100) : 0;
              const bType = v.meta > 0 ? (pct >= 90 ? 'g' : pct >= 70 ? 'y' : 'r') : 'y';
              const showCumpl = v.meta > 0 ? `${pct.toFixed(1).replace('.', ',')}%` : 'S/D';
              
              const pen = v.financiaciones > 0 ? (v.cantadas / v.financiaciones * 100) : 0;
              
              return `
                <tr>
                  <td><strong>${v.mes}</strong></td>
                  <td class="r">${v.aliados}</td>
                  <td class="r">${fmt(v.financiaciones)}</td>
                  <td class="r">${fmt(v.cantadas)}</td>
                  <td class="r">${fmt(v.positivas)}</td>
                  <td class="r">${v.meta > 0 ? fmt(v.meta) : '—'}</td>
                  <td class="r">${badge(showCumpl, bType)}</td>
                  <td class="r">${pen.toFixed(1).replace('.', ',')}%</td>
                </tr>
              `;
            }).join('')}
            <tr class="total">
              <td>Total 1S</td>
              <td class="r">—</td>
              <td class="r">${fmt(totalFinanciaciones)}</td>
              <td class="r">${fmt(totalCantadas)}</td>
              <td class="r">${fmt(totalPositivas)}</td>
              <td class="r">${totalMeta > 0 ? fmt(totalMeta) : '—'}</td>
              <td class="r">${totalMeta > 0 ? badge(cumplimiento.toFixed(1).replace('.', ',') + '%', 'g') : badge('S/D', 'y')}</td>
              <td class="r">${penetracion.toFixed(1).replace('.', ',')}%</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="alert alert-info" style="margin-top:8px; margin-bottom: 0; padding:8px 14px">
        <span class="ico">${icon('pin')}</span>
        <span>El cierre de junio registra un incremento significativo en financiaciones (5.605) y consolidación de 12 aliados activos en el cierre comercial.</span>
      </div>
    </div>
  `;
}

function renderVentasRS() {
  const el = document.getElementById('ventas-rs-body');
  if (!el) return;

  const totalCantadas = TRADICIONAL_DATA.ventas.rs.reduce((s, v) => s + v.cantadas, 0);
  const totalPositivas = TRADICIONAL_DATA.ventas.rs.reduce((s, v) => s + v.positivas, 0);
  const totalFinanciaciones = TRADICIONAL_DATA.ventas.rs.reduce((s, v) => s + v.financiaciones, 0);
  const totalMeta = TRADICIONAL_DATA.ventas.rs.reduce((s, v) => s + v.meta, 0);

  const penetracion = totalFinanciaciones > 0 ? (totalCantadas / totalFinanciaciones * 100) : 0;
  const cumplimiento = totalMeta > 0 ? (totalPositivas / totalMeta * 100) : 0;

  el.innerHTML = `
    <div class="kpi-grid" style="gap:12px">
      <div class="kpi-card" style="padding:10px 16px">
        <div class="kpi-label">Financiaciones Ene–Jun</div>
        <div class="kpi-val">${fmt(totalFinanciaciones)}</div>
        <div class="kpi-sub">Universo total de oportunidades</div>
      </div>
      <div class="kpi-card green" style="padding:10px 16px">
        <div class="kpi-label">Ventas Positivas 1S</div>
        <div class="kpi-val">${fmt(totalPositivas)}</div>
        <div class="kpi-sub">${fmt(totalCantadas)} cantadas (${(totalCantadas > 0 ? totalPositivas/totalCantadas*100 : 0).toFixed(1)}% efectivas)</div>
      </div>
      <div class="kpi-card warn" style="padding:10px 16px">
        <div class="kpi-label">% Cumplimiento Meta</div>
        <div class="kpi-val">${totalMeta > 0 ? cumplimiento.toFixed(1).replace('.', ',') + '%' : 'S/D'}</div>
        <div class="kpi-sub">${fmt(totalPositivas)} de ${fmt(totalMeta)} meta total</div>
      </div>
      <div class="kpi-card" style="padding:10px 16px">
        <div class="kpi-label">Penetración RS</div>
        <div class="kpi-val">${penetracion.toFixed(2).replace('.', ',')}%</div>
        <div class="kpi-sub">Total Cantadas / Financiaciones</div>
      </div>
    </div>

    <div class="panel" style="padding:12px 16px">
      <h3 style="margin-bottom:6px; padding-bottom:5px">${icon('bike')} Evolución mensual Rueda Seguro Tradicional (Como vamos)</h3>
      <div class="tbl-wrap" style="margin-top:0">
        <table class="tbl-compact">
          <thead>
            <tr>
              <th>Mes</th>
              <th class="r">Aliados</th>
              <th class="r">Financiaciones</th>
              <th class="r">Cantadas</th>
              <th class="r">Positivas</th>
              <th class="r">Meta</th>
              <th class="r">% Cumpl.</th>
            </tr>
          </thead>
          <tbody>
            ${TRADICIONAL_DATA.ventas.rs.map(v => {
              const pct = v.meta > 0 ? (v.positivas / v.meta * 100) : 0;
              const bType = v.meta > 0 ? (pct >= 90 ? 'g' : pct >= 70 ? 'y' : 'r') : 'y';
              const showCumpl = v.meta > 0 ? `${pct.toFixed(1).replace('.', ',')}%` : 'S/D';
              
              return `
                <tr>
                  <td><strong>${v.mes}</strong></td>
                  <td class="r">${v.aliados}</td>
                  <td class="r">${fmt(v.financiaciones)}</td>
                  <td class="r">${fmt(v.cantadas)}</td>
                  <td class="r">${fmt(v.positivas)}</td>
                  <td class="r">${v.meta > 0 ? fmt(v.meta) : '—'}</td>
                  <td class="r">${showCumpl !== 'S/D' ? badge(showCumpl, bType) : badge('S/D', 'y')}</td>
                </tr>
              `;
            }).join('')}
            <tr class="total">
              <td>Total 1S</td>
              <td class="r">—</td>
              <td class="r">${fmt(totalFinanciaciones)}</td>
              <td class="r">${fmt(totalCantadas)}</td>
              <td class="r">${fmt(totalPositivas)}</td>
              <td class="r">${totalMeta > 0 ? fmt(totalMeta) : '—'}</td>
              <td class="r">${totalMeta > 0 ? badge(cumplimiento.toFixed(1).replace('.', ',') + '%', 'g') : badge('S/D', 'y')}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="alert alert-info" style="margin-top:8px; margin-bottom: 0; padding:8px 14px">
        <span class="ico">${icon('pin')}</span>
        <span>Junio muestra un repunte significativo de las financiaciones tradicionales de motocicletas (1.395) con 25 aliados activos.</span>
      </div>
    </div>
  `;
}

function renderCobertura() {
  const el = document.getElementById('cobertura-body');
  if (!el) return;

  el.innerHTML = `
    <div class="two-col" style="grid-template-columns: 1.15fr 1fr; gap: 15px;">
      <div class="panel" style="padding:12px 16px">
        <h3 style="margin-bottom:5px; padding-bottom:4px">${icon('store')} Cobertura de Formación por Aliado (Ene-Jun 2026)</h3>
        <p style="font-size: .66rem; color: var(--gray3); margin-top: -3px; margin-bottom: 6px;">
          Adesores que financiaron en conciliaciones vs capacitados (cruzados por cédula).
        </p>
        <div class="tbl-wrap" style="margin-top:0; max-height: 440px; overflow-y: auto;">
          <table class="tbl-compact" style="font-size: 0.68rem;">
            <thead>
              <tr>
                <th>Aliado</th>
                <th class="r">Financiaron</th>
                <th class="r">Capacitados</th>
                <th class="r">Cruzados (Ambos)</th>
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
      </div>

      <div class="panel" style="display: flex; flex-direction: column; justify-content: space-between; padding:12px 16px">
        <div>
          <h3 style="margin-bottom:5px; padding-bottom:4px">${icon('calendar')} Cobertura de Formación por Mes (Semestre)</h3>
          <div class="tbl-wrap" style="margin-top:0">
            <table class="tbl-compact" style="font-size: 0.7rem;">
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
        
        <div class="alert alert-warn" style="margin-top:8px; margin-bottom: 0; padding:8px 14px">
          <span class="ico">${icon('scale')}</span>
          <span><strong>Regla de Cobertura de Orlando:</strong> Cruce por documento del asesor en conciliaciones contra visitas del mes. Se identifica una cobertura agregada promedio del canal de <strong>7,5%</strong>, con espacio de mejora prioritario en los aliados con baja tasa de cruce.</span>
        </div>
      </div>
    </div>
  `;
}
