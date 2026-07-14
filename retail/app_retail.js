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
  'Portada', 'Formación', 'Geografía', 'Ventas', 'Cobertura', 'Estrategia 2S', 'Cierre'
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
   viven en ../core/deck-engine.js (compartido con Tradicional).
──────────────────────────────────────────────────────────────── */

/* ── MAP INITIALIZATION ─────────────────────────────────────── */
function initMap() {
  if (map !== null) {
    setTimeout(() => {
      map.invalidateSize();
      if (RETAIL_DATA.mapa.length > 0) {
        const bounds = RETAIL_DATA.mapa.map(pt => [pt.lat, pt.lon]);
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
  RETAIL_DATA.mapa.forEach(pt => {
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
            fillColor: '#5AE280', // Verde Vanti
            color: '#00CD93',
            weight: 1.5,
            opacity: 0.8,
            fillOpacity: 0.35
          };
        }
      }).addTo(map);

      geojsonLayer.bindPopup(`
        <div style="font-family:'Raleway',sans-serif;font-size:0.78rem;color:#ffffff;line-height:1.45">
          <strong style="color:#5AE280;font-size:0.85rem">${pt.name}</strong><br>
          <span style="display:inline-block;margin-top:4px">Visitas de formación: <strong>${pt.visits}</strong></span>
        </div>
      `, {
        className: 'custom-popup'
      });

      // Hover effects
      geojsonLayer.on('mouseover', function (e) {
        e.target.setStyle({ fillOpacity: 0.55, weight: 2, color: '#5AE280' });
      });
      geojsonLayer.on('mouseout', function (e) {
        e.target.setStyle({ fillOpacity: 0.35, weight: 1.5, color: '#00CD93' });
      });
    } else {
      // Fallback to geographic circle if no polygon available (e.g. Points)
      const radius = Math.max(3000, Math.sqrt(pt.visits) * 850);
      const zone = L.circle([pt.lat, pt.lon], {
        radius: radius,
        fillColor: '#5AE280',
        color: '#00CD93',
        weight: 1,
        opacity: 0.6,
        fillOpacity: 0.35
      }).addTo(map);

      zone.bindPopup(`
        <div style="font-family:'Raleway',sans-serif;font-size:0.78rem;color:#ffffff;line-height:1.45">
          <strong style="color:#5AE280;font-size:0.85rem">${pt.name}</strong><br>
          <span style="display:inline-block;margin-top:4px">Visitas de formación: <strong>${pt.visits}</strong></span>
        </div>
      `, {
        className: 'custom-popup'
      });
    }
  });

  setTimeout(() => {
    map.invalidateSize();
    if (RETAIL_DATA.mapa.length > 0) {
      const bounds = RETAIL_DATA.mapa.map(pt => [pt.lat, pt.lon]);
      map.fitBounds(bounds, { padding: [20, 20] });
    }
  }, 200);
}

/* ── RENDER DYNAMIC SLIDES ──────────────────────────────────── */
function renderSlides() {
  renderFormacion();
  renderMapaSlide();
  renderVentas();
  renderCobertura();
}

function renderFormacion() {
  const el = document.getElementById('formacion-body');
  if (!el) return;

  const totalVisitas = RETAIL_DATA.visitas.reduce((s, v) => s + v.visitas, 0);
  const bestMonth = RETAIL_DATA.visitas.reduce((best, curr) => curr.visitas > best.visitas ? curr : best, RETAIL_DATA.visitas[0]);
  const eneVisits = RETAIL_DATA.visitas[0].visitas;
  const junVisits = RETAIL_DATA.visitas[5].visitas;
  const dropPct = ((junVisits - eneVisits) / eneVisits * 100).toFixed(0);

  // Ene: 71 cap / 147 gestores = 48.3%
  const bestPlantaPct = (RETAIL_DATA.visitas[0].asesores / RETAIL_DATA.ventas.cp[0].gestores * 100).toFixed(1);

  el.innerHTML = `
    <div class="kpi-grid" style="gap:12px">
      <div class="kpi-card" style="padding:10px 16px">
        <div class="kpi-label">Visitas Realizadas 1S</div>
        <div class="kpi-val">${fmt(totalVisitas)}</div>
        <div class="kpi-sub">Enero - Junio 2026</div>
      </div>
      <div class="kpi-card green" style="padding:10px 16px">
        <div class="kpi-label">Mejor Mes (Visitas)</div>
        <div class="kpi-val">${bestMonth.visitas}</div>
        <div class="kpi-sub">${bestMonth.mes} · ${bestMonth.asesores} asesores capacitados</div>
      </div>
      <div class="kpi-card green" style="padding:10px 16px">
        <div class="kpi-label">Cobertura Planta (Ene)</div>
        <div class="kpi-val">${bestPlantaPct.replace('.', ',')}%</div>
        <div class="kpi-sub">71 de 147 gestores activos</div>
      </div>
      <div class="kpi-card warn" style="padding:10px 16px">
        <div class="kpi-label">Variación Ene → Jun</div>
        <div class="kpi-val">${dropPct} %</div>
        <div class="kpi-sub">${eneVisits} visitas → ${junVisits} visitas</div>
      </div>
    </div>

    <div class="two-col" style="gap:14px">
      <div class="panel" style="padding:12px 16px">
        <h3 style="margin-bottom:6px; padding-bottom:5px">${icon('calendar')} Visitas, asesores capacitados y PDV por mes</h3>
        <div class="tbl-wrap" style="margin-top:0">
          <table class="tbl-compact">
            <thead>
              <tr>
                <th>Mes</th>
                <th class="r">Visitas</th>
                <th class="r">Asesores Capacitados*</th>
                <th class="r">PDV Visitados</th>
                <th class="r">% vs. Planta Activa**</th>
              </tr>
            </thead>
            <tbody>
              ${RETAIL_DATA.visitas.map((v, i) => {
                const activeStaff = RETAIL_DATA.ventas.cp[i].gestores;
                const pctActive = activeStaff > 0 ? (v.asesores / activeStaff * 100).toFixed(1) + '%' : 'S/D';
                const bType = activeStaff > 0 ? (v.asesores / activeStaff * 100 >= 45 ? 'g' : v.asesores / activeStaff * 100 >= 30 ? 'y' : 'r') : 'y';
                return `
                  <tr>
                    <td><strong>${v.mes}</strong></td>
                    <td class="r">${v.visitas}</td>
                    <td class="r">${v.asesores}</td>
                    <td class="r">${v.pdvs}</td>
                    <td class="r">${activeStaff > 0 ? badge(pctActive, bType) : badge('S/D', 'y')}</td>
                  </tr>
                `;
              }).join('')}
              <tr class="total">
                <td>Total 1S</td>
                <td class="r">${totalVisitas}</td>
                <td class="r">—</td>
                <td class="r">—</td>
                <td class="r">—</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="font-size:.6rem; color:var(--gray3); margin-top:6px; line-height:1.35">
          * Asesores únicos con al menos una visita en el mes. Tipos de capacitación: Inicial 44 % · Portafolio 40 % · Recapacitación 9 % · Acompañamiento 7 %.<br>
          ** Planta activa calculada basándose en gestores comerciales con actividad transaccional registrados en el "Como vamos" (cierres mensuales).
        </div>
      </div>

      <div class="panel" style="padding:12px 16px">
        <h3 style="margin-bottom:6px; padding-bottom:5px">${icon('trending-down')} Evolución de visitas por mes</h3>
        <div class="chart-wrap chart-compact" style="margin-top:4px">
          ${RETAIL_DATA.visitas.map(v => {
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
        <div class="alert alert-warn" style="margin-top:8px; padding:8px 14px">
          <span class="ico">${icon('alert-triangle')}</span>
          <span>La formación se estabilizó en ~75 visitas/mes hasta abril y <strong>cayó a la mitad en mayo-junio</strong>. Los PDV visitados bajaron de 56 a 14 (-75 %). Causa: contracción comercial y de planta activa en PDV.</span>
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
              ${RETAIL_DATA.mapa.map(pt => `
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
          <span>Bogotá Centro, Sur y Occidente concentran el 61% de las visitas. Tunja, Bucaramanga y Soacha lideran en cobertura regional.</span>
        </div>
      </div>
    </div>
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

  el.innerHTML = `
    <div class="kpi-grid" style="gap:12px">
      <div class="kpi-card green" style="padding:10px 16px">
        <div class="kpi-label">Ventas CP 1S (Efectivas)</div>
        <div class="kpi-val">${fmt(totalEfectivasCP)}</div>
        <div class="kpi-sub">Total de ${fmt(totalCantadasCP)} cantadas (${promEfectCP.toFixed(1).replace('.', ',')}%)</div>
      </div>
      <div class="kpi-card green" style="padding:10px 16px">
        <div class="kpi-label">Ventas RS 1S (Efectivas)</div>
        <div class="kpi-val">${fmt(totalEfectivasRS)}</div>
        <div class="kpi-sub">Total de ${fmt(totalCantadasRS)} cantadas (${promEfectRS.toFixed(1).replace('.', ',')}%)</div>
      </div>
      <div class="kpi-card" style="padding:10px 16px">
        <div class="kpi-label">Pico CP Semestre</div>
        <div class="kpi-val">2.474</div>
        <div class="kpi-sub">Marzo · 135 gestores activos</div>
      </div>
      <div class="kpi-card warn" style="padding:10px 16px">
        <div class="kpi-label">Ventas CP Mayo + Junio</div>
        <div class="kpi-val">${fmt(RETAIL_DATA.ventas.cp[4].efectivas + RETAIL_DATA.ventas.cp[5].efectivas)}</div>
        <div class="kpi-sub">Reales consolidadas de cierre</div>
      </div>
    </div>

    <div class="two-col" style="gap:14px">
      <div class="panel" style="padding:12px 16px">
        <h3 style="margin-bottom:6px; padding-bottom:5px">${icon('shield')} Cuota Protegida Retail (Como vamos)</h3>
        <div class="tbl-wrap" style="margin-top:0">
          <table class="tbl-compact">
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
              ${RETAIL_DATA.ventas.cp.map(v => {
                const pct = v.cantadas > 0 ? (v.efectivas / v.cantadas * 100) : 0;
                const bType = pct >= 80 ? 'g' : pct >= 70 ? 'y' : 'r';
                const showPct = v.cantadas > 0 ? `${pct.toFixed(1).replace('.', ',')}%` : 'S/D';
                return `
                  <tr>
                    <td><strong>${v.mes}</strong></td>
                    <td class="r">${v.gestores > 0 ? v.gestores : 'S/D'}</td>
                    <td class="r">${v.pdv > 0 ? v.pdv : 'S/D'}</td>
                    <td class="r">${fmt(v.cantadas)}</td>
                    <td class="r">${fmt(v.efectivas)}</td>
                    <td class="r">${showPct !== 'S/D' ? badge(showPct, bType) : badge('S/D', 'y')}</td>
                  </tr>
                `;
              }).join('')}
              <tr class="total">
                <td>Total 1S</td>
                <td class="r">—</td>
                <td class="r">—</td>
                <td class="r">${fmt(totalCantadasCP)}</td>
                <td class="r">${fmt(totalEfectivasCP)}</td>
                <td class="r">${badge(promEfectCP.toFixed(1).replace('.', ',') + '%', 'g')}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel" style="display:flex; flex-direction:column; justify-content:space-between; padding:12px 16px">
        <div>
          <h3 style="margin-bottom:6px; padding-bottom:5px">${icon('bike')} Rueda Seguro Retail (Como vamos)</h3>
          <div class="tbl-wrap" style="margin-top:0">
            <table class="tbl-compact">
              <thead>
                <tr>
                  <th>Mes</th>
                  <th class="r">Cantadas</th>
                  <th class="r">Efectivas</th>
                  <th class="r">% Efect.</th>
                </tr>
              </thead>
              <tbody>
                ${RETAIL_DATA.ventas.rs.map(v => {
                  const pct = v.cantadas > 0 ? (v.efectivas / v.cantadas * 100) : 0;
                  const bType = pct >= 65 ? 'g' : pct >= 50 ? 'y' : 'r';
                  return `
                    <tr>
                      <td><strong>${v.mes}</strong></td>
                      <td class="r">${fmt(v.cantadas)}</td>
                      <td class="r">${fmt(v.efectivas)}</td>
                      <td class="r">${badge(pct.toFixed(1).replace('.', ',') + '%', bType)}</td>
                    </tr>
                  `;
                }).join('')}
                <tr class="total">
                  <td>Total 1S</td>
                  <td class="r">${fmt(totalCantadasRS)}</td>
                  <td class="r">${fmt(totalEfectivasRS)}</td>
                  <td class="r">${badge(promEfectRS.toFixed(1).replace('.', ',') + '%', 'g')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="alert alert-info" style="margin-top:8px; margin-bottom: 0; padding:8px 14px">
          <span class="ico">${icon('pin')}</span>
          <span><strong>Marzo y Mayo representaron los picos</strong> del canal. La efectividad se mantiene en niveles altos (78 - 84%). Los cierres de Mayo y Junio confirman ventas efectivas consolidadas superiores a 2.100 por mes.</span>
        </div>
      </div>
    </div>
  `;
}

function renderCobertura() {
  const el = document.getElementById('cobertura-body');
  if (!el) return;

  // Cobertura de PDV visitados vs. activos (con gestión en CP) — datos en
  // data_retail.js como COBERTURA_PDV.

  el.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:12px">
    <div class="kpi-grid" style="gap:12px">
      <div class="kpi-card" style="padding:8px 16px">
        <div class="kpi-label">PDV con gestión promedio</div>
        <div class="kpi-val">${(COBERTURA_PDV.reduce((s,d)=>s+d.gestion,0)/6).toFixed(0)}</div>
        <div class="kpi-sub">Total PDV activos en CP</div>
      </div>
      <div class="kpi-card green" style="padding:8px 16px">
        <div class="kpi-label">Mejor Cobertura PDV</div>
        <div class="kpi-val">60,9 %</div>
        <div class="kpi-sub">Enero · 56 de 92 PDV visitados</div>
      </div>
      <div class="kpi-card warn" style="padding:8px 16px">
        <div class="kpi-label">Cobertura Junio</div>
        <div class="kpi-val">26,9 %</div>
        <div class="kpi-sub">14 de 52 PDV activos visitados</div>
      </div>
      <div class="kpi-card" style="padding:8px 16px">
        <div class="kpi-label">Visitas de formación 1S</div>
        <div class="kpi-val">373</div>
        <div class="kpi-sub">Capacitando asesores de venta</div>
      </div>
    </div>

    <div class="two-col" style="gap:14px">
      <div class="panel" style="padding:12px 16px">
        <h3 style="margin-bottom:6px; padding-bottom:5px">${icon('map')} Cobertura de formación en Puntos de Venta (PDV)</h3>
        <div class="tbl-wrap" style="margin-top:0">
          <table class="tbl-compact">
            <thead>
              <tr>
                <th>Mes</th>
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
                    <td class="r">${d.gestion}</td>
                    <td class="r">${d.visitas}</td>
                    <td class="r">${badge(d.pct.toFixed(1).replace('.', ',') + '%', bType)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="panel" style="padding:12px 16px">
        <h3 style="margin-bottom:6px; padding-bottom:5px">${icon('store')} Universo de PDV y cobertura real por aliado (1S)</h3>
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
                <td class="r">42</td>
                <td class="r">38</td>
                <td class="r">${badge('90,5 %','g')}</td>
                <td class="r">184</td>
              </tr>
              <tr>
                <td><strong>Almacenes Éxito</strong></td>
                <td class="r">31</td>
                <td class="r">36</td>
                <td class="r">${badge('116 %','g')}</td>
                <td class="r">99</td>
              </tr>
              <tr>
                <td><strong>Cencosud</strong> (Jumbo/Metro/Easy)</td>
                <td class="r">26</td>
                <td class="r">31</td>
                <td class="r">${badge('119 %','g')}</td>
                <td class="r">90</td>
              </tr>
              <tr>
                <td><strong>Olímpica</strong> <span class="pend" style="font-size:.58rem">solo ene</span></td>
                <td class="r">6</td>
                <td class="r">3</td>
                <td class="r">${badge('50 %','y')}</td>
                <td class="r">4</td>
              </tr>
              <tr class="total">
                <td>Total canal</td>
                <td class="r">105</td>
                <td class="r">—</td>
                <td class="r">—</td>
                <td class="r">373</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="font-size:.6rem; color:var(--gray3); margin-top:5px">* Universo = PDV físicos distintos observados en los 26 cortes semanales "Como vamos" del semestre (no hay maestro de puntos entregado; a validar con Daniela). Coberturas &gt;100 % indican PDV que Formación visitó con nombre distinto al registrado en Como vamos ese corte, o puntos sin gestión comercial activa ese mes.</div>
      </div>
    </div>

    <div style="display:flex; flex-direction:column; gap:6px">
    <div class="alert alert-warn" style="margin-bottom: 0; padding:7px 14px">
      <span class="ico">${icon('search')}</span>
      <span><strong>Hallazgo:</strong> el parque de PDV con gestión activa se contrajo 43 % (92→52) y la cobertura mensual cayó de 61 % a 27 %, pero Éxito y Cencosud muestran cobertura acumulada &gt;100 % en el semestre: Formación llega a más puntos de los que hoy tienen venta activa.</span>
    </div>

    <div class="two-col" style="gap:10px">
      <div class="alert alert-info" style="margin-bottom: 0; padding:6px 14px">
        <span class="ico">${icon('building-2')}</span>
        <span><strong>Sobre "Serdán" (90 visitas):</strong> empresa que provee promotores a ambos canales, no un aliado. De las 90: 33 puras Retail+Tradicional, 33 sedes/roles internos (no PDV) y 14 con cédula activa en ambos canales <strong>(contadas en los dos)</strong>. Total atribuido: <strong>24 a Retail</strong> y <strong>47 a Tradicional</strong>.</span>
      </div>
      <div class="panel" style="padding:6px 14px; box-shadow:none; border:1px solid var(--gray2)">
        <div style="font-size:.64rem; font-weight:800; color:var(--blue); letter-spacing:.05em; margin-bottom:6px">${icon('tag', { size: 13 })} TIPO DE PUNTO VISITADO EN LAS 90 "SERDÁN"</div>
        <div style="display:flex; gap:8px; flex-wrap:wrap">
          <div style="flex:1; min-width:85px; text-align:center; background:var(--gray1); border-radius:8px; padding:5px">
            <div style="font-weight:800; font-size:.9rem; color:var(--teal)">37</div>
            <div style="font-size:.58rem; color:var(--gray3)">PDV físico</div>
          </div>
          <div style="flex:1; min-width:85px; text-align:center; background:var(--gray1); border-radius:8px; padding:5px">
            <div style="font-weight:800; font-size:.9rem; color:var(--blue)">23</div>
            <div style="font-size:.58rem; color:var(--gray3)">Sede Serdán</div>
          </div>
          <div style="flex:1; min-width:85px; text-align:center; background:var(--gray1); border-radius:8px; padding:5px">
            <div style="font-weight:800; font-size:.9rem; color:var(--warn)">20</div>
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
