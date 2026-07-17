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
  renderVentas();
  renderCobertura();
}

function renderFormacion() {
  const el = document.getElementById('formacion-body');
  if (!el) return;

  const totalVisitas = RETAIL_DATA.visitas.reduce((s, v) => s + v.visitas, 0);
  const eneVisits = RETAIL_DATA.visitas[0].visitas;
  const junVisits = RETAIL_DATA.visitas[5].visitas;
  const dropPct = ((junVisits - eneVisits) / eneVisits * 100).toFixed(0);

  const pdvIni = RETAIL_DATA.ventas.cp[0].pdv;
  const pdvFin = RETAIL_DATA.ventas.cp[5].pdv;
  const pdvDropPct = ((pdvIni - pdvFin) / pdvIni * 100).toFixed(0);
  const efPorPdvIni = (RETAIL_DATA.ventas.cp[0].efectivas / pdvIni);
  const efPorPdvFin = (RETAIL_DATA.ventas.cp[5].efectivas / pdvFin);
  const efPorPdvUp = ((efPorPdvFin - efPorPdvIni) / efPorPdvIni * 100).toFixed(0);

  el.innerHTML = `
    <div class="kpi-grid" style="gap:8px; margin-bottom:8px">
      <div class="kpi-card" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Visitas Realizadas 1S</div>
        <div class="kpi-val" style="font-size:.85rem">${fmt(totalVisitas)}</div>
        <div class="kpi-sub" style="font-size:.5rem">Enero - Junio 2026</div>
      </div>
      <div class="kpi-card green" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Efectivas por PDV activo</div>
        <div class="kpi-val" style="font-size:.85rem">+${efPorPdvUp} %</div>
        <div class="kpi-sub" style="font-size:.5rem">${efPorPdvIni.toFixed(1)} → ${efPorPdvFin.toFixed(1)} pólizas/PDV</div>
      </div>
    </div>

    <div class="panel" style="padding:8px 12px">
      <h3 style="margin-bottom:4px; padding-bottom:3px; font-size:.68rem">${icon('trending-down')} Evolución de visitas por mes</h3>
      <div class="chart-wrap chart-compact" style="margin-top:2px">
        ${RETAIL_DATA.visitas.map(v => {
          const maxV = Math.max(...RETAIL_DATA.visitas.map(x=>x.visitas));
          const pct = (v.visitas / maxV * 100).toFixed(0) + '%';
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
      <span style="font-size:.62rem"><strong>Por qué cayó mayo-junio:</strong> la reestructuración de zonas y canales de Retail (empalme con Tradicional) redujo temporalmente la capacidad de visitar — no una caída de desempeño. Prueba: con 43 % menos PDV activos, las ventas efectivas por PDV subieron ${efPorPdvUp} % (${efPorPdvIni.toFixed(1)} → ${efPorPdvFin.toFixed(1)}/PDV): el canal se concentró y se hizo más productivo por punto.</span>
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
    <div class="kpi-grid" style="gap:8px; margin-bottom:8px">
      <div class="kpi-card green" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Ventas CP 1S (Efectivas)</div>
        <div class="kpi-val" style="font-size:.85rem">${fmt(totalEfectivasCP)}</div>
        <div class="kpi-sub" style="font-size:.5rem">Total de ${fmt(totalCantadasCP)} cantadas (${promEfectCP.toFixed(1).replace('.', ',')}%)</div>
      </div>
      <div class="kpi-card green" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Ventas RS 1S (Efectivas)</div>
        <div class="kpi-val" style="font-size:.85rem">${fmt(totalEfectivasRS)}</div>
        <div class="kpi-sub" style="font-size:.5rem">Total de ${fmt(totalCantadasRS)} cantadas (${promEfectRS.toFixed(1).replace('.', ',')}%)</div>
      </div>
      <div class="kpi-card" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Pico CP Semestre</div>
        <div class="kpi-val" style="font-size:.85rem">2.474</div>
        <div class="kpi-sub" style="font-size:.5rem">Marzo · 135 gestores activos</div>
      </div>
      <div class="kpi-card warn" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Ventas CP Mayo + Junio</div>
        <div class="kpi-val" style="font-size:.85rem">${fmt(RETAIL_DATA.ventas.cp[4].efectivas + RETAIL_DATA.ventas.cp[5].efectivas)}</div>
        <div class="kpi-sub" style="font-size:.5rem">Reales consolidadas de cierre</div>
      </div>
    </div>

    <div class="two-col" style="gap:10px">
      <div class="panel" style="padding:8px 12px">
        <h3 style="margin-bottom:4px; padding-bottom:3px; font-size:.68rem">${icon('shield')} Cuota Protegida Retail (Como vamos)</h3>
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

      <div class="panel" style="display:flex; flex-direction:column; justify-content:space-between; padding:8px 12px">
        <div>
          <h3 style="margin-bottom:4px; padding-bottom:3px; font-size:.68rem">${icon('bike')} Rueda Seguro Retail (Como vamos)</h3>
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
                ${(() => {
                  const maxRS = Math.max(...RETAIL_DATA.ventas.rs.map(x => x.efectivas));
                  return RETAIL_DATA.ventas.rs.map(v => {
                    const pct = v.cantadas > 0 ? (v.efectivas / v.cantadas * 100) : 0;
                    const bType = pct >= 65 ? 'g' : pct >= 50 ? 'y' : 'r';
                    const barW = maxRS > 0 ? (v.efectivas / maxRS * 100).toFixed(0) + '%' : '0%';
                    return `
                      <tr>
                        <td><strong>${v.mes}</strong></td>
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
                  <td>Total 1S</td>
                  <td class="r">${fmt(totalCantadasRS)}</td>
                  <td class="r">${fmt(totalEfectivasRS)}</td>
                  <td class="r">${badge(promEfectRS.toFixed(1).replace('.', ',') + '%', 'g')}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        <div class="alert alert-info" style="margin-top:6px; margin-bottom: 0; padding:6px 12px">
          <span class="ico">${icon('pin')}</span>
          <span style="font-size:.62rem"><strong>Marzo y Mayo representaron los picos</strong> del canal. La efectividad se mantiene en niveles altos (78 - 84%). Los cierres de Mayo y Junio confirman ventas efectivas consolidadas superiores a 2.100 por mes.</span>
        </div>
      </div>
    </div>
  `;
}

function renderCobertura() {
  const el = document.getElementById('cobertura-body');
  if (!el) return;

  // Cobertura de PDV visitados vs. activos (con gestión en CP) — datos en
  // data_retail.js como COBERTURA_PDV. Fusiona Cobertura + Geografía (mapa)
  // en un solo slide con pestañas, por pedido de Orlando (reunión 2026-07).

  el.innerHTML = `
    <div style="display:flex; flex-direction:column; gap:4px">
    <div class="kpi-grid" style="gap:8px; margin-bottom:4px">
      <div class="kpi-card" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">PDV con gestión promedio</div>
        <div class="kpi-val" style="font-size:.85rem">${(COBERTURA_PDV.reduce((s,d)=>s+d.gestion,0)/6).toFixed(0)}</div>
        <div class="kpi-sub" style="font-size:.5rem">Total PDV activos en CP</div>
      </div>
      <div class="kpi-card warn" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Cobertura Junio</div>
        <div class="kpi-val" style="font-size:.85rem">26,9 %</div>
        <div class="kpi-sub" style="font-size:.5rem">14 de 52 PDV activos visitados</div>
      </div>
      <div class="kpi-card" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Visitas de formación 1S</div>
        <div class="kpi-val" style="font-size:.85rem">373</div>
        <div class="kpi-sub" style="font-size:.5rem">Capacitando asesores de venta</div>
      </div>
      <div class="kpi-card" style="padding:5px 12px">
        <div class="kpi-label" style="font-size:.58rem">Zonas / municipios</div>
        <div class="kpi-val" style="font-size:.85rem">${RETAIL_DATA.mapa.length}</div>
        <div class="kpi-sub" style="font-size:.5rem">Con al menos una visita registrada</div>
      </div>
    </div>

    <div class="cob-tabs" style="display:flex; gap:8px; margin-bottom:-2px">
      <button class="cob-tab active" data-tab="pdv" onclick="coberturaTab('pdv')">${icon('store', {size:12})} Cobertura PDV</button>
      <button class="cob-tab" data-tab="mapa" onclick="coberturaTab('mapa')">${icon('map', {size:12})} Mapa de visitas</button>
    </div>

    <div class="cob-pane active" id="cob-pane-pdv">
    <div class="two-col" style="gap:10px">
      <div class="panel" style="padding:6px 12px">
        <h3 style="margin-bottom:2px; padding-bottom:2px; font-size:.68rem">${icon('map')} Cobertura de formación en Puntos de Venta (PDV)</h3>
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

      <div class="panel" style="padding:8px 16px">
        <h3 style="margin-bottom:4px; padding-bottom:4px">${icon('store')} Universo de PDV y cobertura real por aliado (1S)</h3>
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
                <td><strong>Almacenes Éxito</strong> <span class="pend" style="font-size:.58rem">aliado retirado</span></td>
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
                <td><strong>Olímpica</strong> <span class="pend" style="font-size:.58rem">solo ene · aliado retirado</span></td>
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
        <div style="font-size:.6rem; color:var(--gray3); margin-top:5px">* Universo = PDV físicos distintos observados en los 26 cortes semanales "Como vamos" del semestre. Coberturas &gt;100 % indican PDV que Formación visitó con nombre distinto al registrado en Como vamos ese corte, o puntos sin gestión comercial activa ese mes.</div>
      </div>
    </div>

    <div style="display:flex; flex-direction:column; gap:4px; margin-top:2px">
    <div class="alert alert-warn" style="margin-bottom: 0; padding:5px 14px">
      <span class="ico">${icon('search')}</span>
      <span style="font-size:.7rem"><strong>Hallazgo:</strong> el parque de PDV con gestión activa se contrajo 43 % (92→52) y la cobertura mensual cayó de 61 % a 27 %, pero Éxito (aliado retirado tras el semestre) y Cencosud mostraron cobertura acumulada &gt;100 % durante el 1S: Formación llegó a más puntos de los que en ese momento tenían venta activa.</span>
    </div>

    <div class="two-col" style="gap:10px">
      <div class="alert alert-info" style="margin-bottom: 0; padding:6px 14px">
        <span class="ico">${icon('building-2')}</span>
        <span style="font-size:.68rem"><strong>Sobre "Serdán" (90 visitas):</strong> empresa que provee promotores a ambos canales, no un aliado. De las 90: 33 puras Retail+Tradicional, 33 sedes/roles internos (no PDV) y 14 con cédula activa en ambos canales <strong>(contadas en los dos)</strong>. Total atribuido: <strong>24 a Retail</strong> y <strong>47 a Tradicional</strong>.</span>
      </div>
      <div class="panel" style="padding:5px 14px; box-shadow:none; border:1px solid var(--gray2)">
        <div style="font-size:.6rem; font-weight:800; color:var(--blue); letter-spacing:.05em; margin-bottom:4px">${icon('tag', { size: 13 })} TIPO DE PUNTO VISITADO EN LAS 90 "SERDÁN"</div>
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

    <div class="cob-pane" id="cob-pane-mapa">
      <div class="two-col" style="grid-template-columns: 1.5fr 1fr; gap: 14px;">
        <div class="panel" style="position: relative; height: 390px; padding: 0; overflow: hidden; border-radius: 12px; border: 1px solid var(--gray2); box-shadow: 0 4px 12px rgba(0,0,0,0.05)">
          <div id="map-container" style="width: 100%; height: 100%"></div>
        </div>
        <div class="panel" style="max-height: 390px; display: flex; flex-direction: column;">
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
          <div class="alert alert-info" style="margin-top: 10px; margin-bottom: 0;">
            <span class="ico">${icon('pin')}</span>
            <span>Bogotá Centro, Sur y Occidente concentran el 61% de las visitas. Tunja, Bucaramanga y Soacha lideran en cobertura regional.</span>
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
