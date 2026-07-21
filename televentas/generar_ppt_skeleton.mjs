#!/usr/bin/env node
/**
 * ════════════════════════════════════════════════════════════════════
 *  GENERADOR PPT SKELETON UNIFICADO — Televentas · Tradicional · Retail
 * ════════════════════════════════════════════════════════════════════
 *
 *  Técnica: para cada slide se toma un screenshot del "esqueleto" visual
 *  (todo el texto oculto, íconos y fondos visibles) que se usa como imagen
 *  de fondo, y encima se reinsertan todos los textos como cajas de texto
 *  nativas de PowerPoint, 100 % editables.
 *
 *  Mejoras sobre generar_ppt_v6_skeleton.mjs:
 *   - Capturas en alta definición (deviceScaleFactor 3 → 3840×2160 px).
 *   - Extracción por "runs" de formato: cada tramo de texto conserva su
 *     color, negrita y tamaño reales aunque conviva con otros estilos en
 *     la misma celda o párrafo (badges, <strong>, spans coloreados…).
 *   - Un solo módulo para los tres decks.
 *
 *  Uso:   node generar_ppt_skeleton.mjs                  → los 3 decks
 *         node generar_ppt_skeleton.mjs televentas       → solo uno
 *         node generar_ppt_skeleton.mjs tradicional retail
 *
 *  Vive en televentas/ para reutilizar sus node_modules (playwright,
 *  pptxgenjs). Salidas: <deck>/ppt_slides/sk_*.png + <deck>/*.pptx
 */
import { chromium } from 'playwright';
import PptxGenJS from 'pptxgenjs';
import http from 'http'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DASH_DIR = path.resolve(__dirname, '..');
const PPT_W = 13.333, PPT_H = 7.5, SX = PPT_W / 1280, SY = PPT_H / 720;
const HIDPI = 3;               // deviceScaleFactor de las capturas
const FONT = 'Raleway';

/* ── Configuración de decks ─────────────────────────────────────────
   slides: [num, etiqueta, tabs|null]; cada tab = [sufijo, jsParaActivarla] */
const DECKS = {
  televentas: {
    dir: 'televentas',
    out: 'INFORME_TELEVENTAS.pptx',
    slides: [
      [0,'Portada',null],[1,'Cap. 1',null],
      [2,'Ventas',[['Vanti',"vtasTab('vanti')"],['Xuma',"vtasTab('xuma')"]]],
      [3,'Bases',null],[4,'Campanas',null],[5,'Autogestion',null],
      [6,'D. Bienvenida',null],[7,'D. Stock',null],[8,'D. Masiva',null],
      [9,'D. Satisfechos',null],[10,'D. Microseguro',null],[11,'D. Cancelaciones',null],
      [12,'Asesores',null],
      [13,'Iniciativas',null],[14,'Evidencias',null],[15,'Capacitaciones',null],
      [16,'Monitoreo',null],[17,'Cap. 2',null],
      [18,'Contactab.',[['Mes',"contactabTab('mes')"],['Campana',"contactabTab('campana')"]]],
      [19,'Telefonia',[['Resumen',"telefoniaTab('resumen')"],['Zonas',"telefoniaTab('zonas')"]]],
      [20,'Proyeccion',[['Calculo',"proyeccionTab('calc')"],['Escenario',"proyeccionTab('escenario')"]]],
      [21,'Estrategia',[['Iniciativas',"estrategiaTab('ini')"],['Cronograma',"estrategiaTab('cron')"],['KPIs',"estrategiaTab('kpi')"]]],
      [22,'Cierre',null],
    ],
  },
  tradicional: {
    dir: 'tradicional',
    out: 'INFORME_TRADICIONAL.pptx',
    slides: [[0,'Formacion',null],[1,'Cobertura',null],[2,'Ventas',null]],
  },
  retail: {
    dir: 'retail',
    out: 'INFORME_RETAIL.pptx',
    slides: [[0,'Formacion',null],[1,'Cobertura',null],[2,'Ventas',null]],
  },
  innovacion: {
    dir: 'innovacion',
    out: 'INFORME_INNOVACION.pptx',
    slides: [
      [0,'Portada',null],[1,'Resumen 1S',null],[2,'Estado Portafolio',null],
      [3,'Como Vamos',null],[4,'Linea de Tiempo',null],[5,'Detalle Proyectos',null],
      [6,'Trabajo Conjunto',null],[7,'Plan 2S',null],[8,'Cierre',null],
    ],
  },
};

/* ── Utilidades ─────────────────────────────────────────────────── */
function parseColor(s, fb = '120180') {
  if (!s) return fb;
  const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?/);
  if (m) {
    if (m[4] !== undefined && parseFloat(m[4]) === 0) return fb; // transparente
    return `${(+m[1]).toString(16).padStart(2,'0')}${(+m[2]).toString(16).padStart(2,'0')}${(+m[3]).toString(16).padStart(2,'0')}`;
  }
  const m2 = s.match(/#([0-9a-fA-F]{6})/);
  if (m2) return m2[1];
  return fb;
}

function startServer(dir, port = 0) {
  return new Promise(r => {
    const s = http.createServer((req, res) => {
      const pn = decodeURIComponent(req.url.split('?')[0]);
      let fp = path.join(dir, pn);
      if (!path.extname(fp)) fp = path.join(fp, 'index.html');
      const types = {'.html':'text/html;charset=utf-8','.css':'text/css','.js':'application/javascript','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.json':'application/json'};
      fs.readFile(fp, (e, d) => {
        if (e) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, {'Content-Type': types[path.extname(fp)] || 'application/octet-stream'});
        res.end(d);
      });
    });
    s.listen(port, () => r(s));
  });
}

/* ── Extracción de texto con runs de formato (corre en el navegador) ── */
async function extractText(page) {
  return page.evaluate(() => {
    const scaler = document.getElementById('scaler'); if (!scaler) return [];
    const active = document.querySelector('#scaler .slide.active') || scaler;
    const results = [], seen = new Set();
    const skipTags = new Set(['SVG','PATH','RECT','CIRCLE','LINE','POLYLINE','POLYGON','USE','DEFS','CLIPPATH','MASK','STYLE','SCRIPT']);

    const vp = el => { const r = el.getBoundingClientRect(); return {x:r.left, y:r.top, w:r.width, h:r.height}; };
    const mapAlign = (a, st) => {
      if (st.display === 'flex' && st.justifyContent === 'center') return 'center';
      return a === 'right' ? 'right' : a === 'center' ? 'center' : 'left';
    };
    const isBold = st => st.fontWeight === 'bold' || parseInt(st.fontWeight) >= 600;
    const isIcon = el => el.closest('.lucide-ico') || el.classList.contains('lucide-ico') || el.classList.contains('ico') || el.closest('svg');
    const hidden = st => st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity) === 0;

    /* Construye los runs de formato de un elemento: recorre sus nodos de
       texto conservando el estilo computado del ancestro inline más cercano.
       directOnly=true: solo los nodos de texto directos (para contenedores
       con hijos de bloque, cuyos hijos se procesan por separado). */
    /* Además de los runs, acumula la unión de los rects reales de los nodos
       de texto (via Range) — esa es la posición EXACTA del texto, excluyendo
       íconos y decoraciones que comparten el mismo contenedor. */
    function buildRuns(el, baseStyle, directOnly) {
      const runs = [];
      let tx1 = Infinity, ty1 = Infinity, tx2 = -Infinity, ty2 = -Infinity;
      function pushRun(node, st) {
        const text = node.textContent;
        if (!text) return;
        const norm = text.replace(/\s+/g, ' ');
        if (!norm.trim()) {
          // conservar separadores entre palabras de runs contiguos
          if (runs.length && !runs[runs.length-1].text.endsWith(' ')) runs[runs.length-1].text += ' ';
          return;
        }
        try {
          const range = document.createRange();
          range.selectNodeContents(node);
          const r = range.getBoundingClientRect();
          if (r.width > 0 && r.height > 0) {
            tx1 = Math.min(tx1, r.left); ty1 = Math.min(ty1, r.top);
            tx2 = Math.max(tx2, r.right); ty2 = Math.max(ty2, r.bottom);
          }
        } catch (e) { /* nodos raros: se ignora el rect, no el texto */ }
        const last = runs[runs.length - 1];
        const sig = st.color + '|' + isBold(st) + '|' + st.fontSize;
        if (last && last.sig === sig) { last.text += norm; return; }
        runs.push({ text: norm, sig, color: st.color, bold: isBold(st), fontSize: parseFloat(st.fontSize) || 10 });
      }
      function walk(node, st) {
        if (node.nodeType === 3) { pushRun(node, st); return; }
        if (node.nodeType !== 1) return;
        if (skipTags.has(node.tagName.toUpperCase()) || isIcon(node)) return;
        const cst = window.getComputedStyle(node);
        if (hidden(cst)) return;
        for (const c of node.childNodes) walk(c, cst);
      }
      for (const c of el.childNodes) {
        if (directOnly && c.nodeType === 1) continue;
        walk(c, baseStyle);
      }
      // recorte de espacios en los extremos
      if (runs.length) {
        runs[0].text = runs[0].text.replace(/^\s+/, '');
        runs[runs.length-1].text = runs[runs.length-1].text.replace(/\s+$/, '');
      }
      const textRect = tx2 > tx1 ? { x: tx1, y: ty1, w: tx2 - tx1, h: ty2 - ty1 } : null;
      return { runs: runs.filter(r => r.text.length > 0), textRect };
    }

    function pushResult(el, style, built, isCell) {
      // Texto en escritura vertical (etiquetas decorativas de eje): no se
      // extrae como caja — se conserva tal cual en la imagen de fondo.
      if ((style.writingMode || '').startsWith('vertical')) return;
      const { runs, textRect } = built;
      const joined = runs.map(r => r.text).join('');
      const trimmed = (joined || '').trim();
      if (!trimmed) return;
      // Textos de 1 carácter son válidos si son alfanuméricos o símbolo con
      // significado (números de ranking, valores de un dígito, %, *) — solo
      // se descarta puntuación decorativa suelta.
      if (trimmed.length === 1 && /[·•—–\-|:;,.]/.test(trimmed)) return;
      const ep = vp(el); if (ep.w < 3 || ep.h < 3) return;
      /* Celdas: caja horizontal de la celda (la alineación manda) pero
         posición VERTICAL exacta del texto — así el número no se centra
         sobre toda la celda pisando barras/decoraciones del esqueleto.
         Resto: la caja es la unión exacta de los rects de texto, para no
         pisar íconos del mismo contenedor. */
      let p;
      if (isCell) {
        p = textRect ? { x: ep.x, y: textRect.y, w: ep.w, h: textRect.h } : ep;
      } else {
        p = textRect || ep;
      }
      const key = `${ep.x.toFixed(0)},${ep.y.toFixed(0)},${joined}`;
      if (seen.has(key)) return; seen.add(key);
      results.push({
        runs: runs.map(({text, color, bold, fontSize}) => ({text, color, bold, fontSize})),
        text: joined,
        x: p.x, y: p.y, w: p.w, h: p.h,
        ex: ep.x, ey: ep.y, ew: ep.w, eh: ep.h,
        exactBox: (!isCell && !!textRect),
        exactV: (isCell && !!textRect),
        fontSize: parseFloat(style.fontSize) || 10,
        color: style.color,
        bold: isBold(style),
        textAlign: mapAlign(style.textAlign || 'left', style),
        lineHeight: parseFloat(style.lineHeight) || null,
        padL: parseFloat(style.paddingLeft) || 0,
        padR: parseFloat(style.paddingRight) || 0,
        padT: parseFloat(style.paddingTop) || 0,
        padB: parseFloat(style.paddingBottom) || 0,
        isCell,
      });
    }

    // 1) Celdas de tabla: un bloque por celda, con runs internos
    active.querySelectorAll('td,th').forEach(cell => {
      const style = window.getComputedStyle(cell);
      if (hidden(style)) return;
      pushResult(cell, style, buildRuns(cell, style, false), true);
    });

    // 2) Resto de elementos
    active.querySelectorAll('*').forEach(el => {
      if (skipTags.has(el.tagName.toUpperCase()) || isIcon(el)) return;
      if (el.closest('td,th')) return;
      const style = window.getComputedStyle(el);
      if (hidden(style)) return;
      const hasBlockChildren = el.querySelector('div, p, table, tr, td, th, ul, ol, li, h1, h2, h3, h4, h5, h6, section, article, nav, header, footer') !== null;
      pushResult(el, style, buildRuns(el, style, hasBlockChildren), false);
    });

    return results;
  });
}

/* ── Genera un deck completo ────────────────────────────────────── */
async function buildDeck(page, port, deckKey) {
  const deck = DECKS[deckKey];
  const OUT_DIR = path.join(DASH_DIR, deck.dir, 'ppt_slides');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'CUSTOM', width: PPT_W, height: PPT_H });
  pptx.layout = 'CUSTOM';
  console.log(`\n══ Deck: ${deckKey} ══`);

  for (const [num, label, tabs] of deck.slides) {
    try {
      await page.goto(`http://localhost:${port}/${deck.dir}/index.html?slide=${num}`, { waitUntil: 'load', timeout: 30000 });
      await page.waitForTimeout(900);
      await page.evaluate(() => {
        const s = document.getElementById('scaler');
        if (s) { s.style.position = 'relative'; s.style.transform = 'scale(1)'; s.style.top = '0'; s.style.left = '0'; }
        document.body.style.margin = '0'; document.body.style.overflow = 'hidden';
        ['prev-btn','next-btn','home-btn','nav'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
      });
      await page.waitForTimeout(100);

      const variants = tabs || [null];
      for (const variant of variants) {
        const slideLabel = label + (variant ? ' ' + variant[0] : '');
        if (variant) { await page.evaluate(variant[1]); await page.waitForTimeout(300); }

        const textData = await extractText(page);

        // Dedup por contención sobre las cajas de los ELEMENTOS (los hijos
        // siempre caen dentro de su contenedor aunque la caja de texto sea
        // más ajustada): los bloques más largos reclaman su región.
        textData.sort((a, b) => b.text.length - a.text.length);
        const filtered = [], regions = [];
        for (const t of textData) {
          let contained = false;
          for (const [ux, uy, uw, uh] of regions) {
            if (t.ex >= ux - 1 && t.ey >= uy - 1 && t.ex + t.ew <= ux + uw + 1 && t.ey + t.eh <= uy + uh + 1) { contained = true; break; }
          }
          if (!contained) { filtered.push(t); regions.push([t.ex, t.ey, t.ew, t.eh]); }
        }

        // ── Screenshot SKELETON en alta definición (texto oculto) ──
        await page.evaluate(() => {
          window._c = [];
          document.querySelectorAll('svg,.lucide-ico').forEach(el => window._c.push({ el, color: getComputedStyle(el).color }));
          document.querySelectorAll('*').forEach(el => {
            if (el.closest('svg') || el.classList.contains('lucide-ico')) return;
            // texto vertical decorativo: se queda visible en el fondo (no se extrae como caja)
            if ((getComputedStyle(el).writingMode || '').startsWith('vertical')) return;
            el.style.setProperty('color', 'transparent', 'important');
          });
          window._c.forEach(({ el, color }) => el.style.setProperty('color', color, 'important'));
        });
        await page.waitForTimeout(100);
        const ssPath = path.join(OUT_DIR, `sk_${String(num).padStart(2,'0')}_${variant ? variant[0] : 'main'}.png`);
        await page.screenshot({ path: ssPath });
        await page.evaluate(() => { document.querySelectorAll('*').forEach(el => el.style.removeProperty('color')); });

        // ── Slide PPT: fondo skeleton + cajas de texto con runs ──
        const slide = pptx.addSlide();
        if (fs.existsSync(ssPath)) slide.addImage({ path: ssPath, x: 0, y: 0, w: PPT_W, h: PPT_H });

        for (const t of filtered) {
          if (t.w < 5 || t.h < 3) continue;
          // Cajas exactas de texto: sin margen interno (el padding del
          // contenedor ya quedó excluido del rect). Celdas con posición
          // vertical exacta: solo padding horizontal. Resto: padding real.
          const margin = t.exactBox ? 0
            : t.exactV ? [0, t.padR * 0.75, 0, t.padL * 0.75]
            : [t.padT * 0.75, t.padR * 0.75, t.padB * 0.75, t.padL * 0.75];
          // El ajuste fijo de -1,5px solo aplica a celdas SIN rect exacto
          // (corría los encabezados respecto a las bandas azules del fondo)
          const yAdj = (t.isCell && !t.exactV) ? Math.max(t.y * SY - 0.0156, 0) : t.y * SY;
          const runs = (t.runs && t.runs.length ? t.runs : [{ text: t.text, color: t.color, bold: t.bold, fontSize: t.fontSize }])
            .map(r => ({
              text: r.text,
              options: {
                bold: r.bold,
                color: parseColor(r.color, parseColor(t.color)),
                fontSize: Math.min((r.fontSize || t.fontSize) * 0.75, 48),
                fontFace: FONT,
              },
            }));
          // pequeño colchón horizontal: las métricas de fuente de PowerPoint
          // no son idénticas a las del navegador y un ancho exacto forzaría
          // saltos de línea prematuros. Se expande respetando la alineación.
          const extraW = t.exactBox ? t.w * SX * 0.06 + 0.02 : t.w * SX * 0.03;
          const xAdj = t.textAlign === 'right' ? t.x * SX - extraW
                     : t.textAlign === 'center' ? t.x * SX - extraW / 2
                     : t.x * SX;
          slide.addText(runs, {
            x: Math.max(xAdj, 0), y: yAdj,
            w: Math.max(t.w * SX + extraW, 0.3),
            h: t.isCell ? t.h * SY : Math.max(t.h * SY * 1.03, 0.14),
            align: t.textAlign,
            margin, valign: t.isCell ? 'middle' : 'top',
            wrap: true,
            paraSpaceAfter: 0, paraSpaceBefore: 0,
          });
        }
        console.log(`  ${num} ${slideLabel.padEnd(25)} -> ${filtered.length} bloques`);
      }
    } catch (err) { console.error(`  ${num} ${label}: ERROR ${err.message}`); }
  }

  let outPath = path.join(DASH_DIR, deck.dir, deck.out);
  try {
    await pptx.writeFile({ fileName: outPath });
  } catch (e) {
    if (e.code === 'EBUSY') {
      // el .pptx está abierto en PowerPoint: se guarda con sufijo _nuevo
      outPath = outPath.replace(/\.pptx$/i, '_nuevo.pptx');
      console.warn(`  AVISO: el archivo original está abierto en PowerPoint; guardando como ${path.basename(outPath)}`);
      await pptx.writeFile({ fileName: outPath });
    } else throw e;
  }
  console.log(`  PPT: ${outPath} (${pptx.slides.length} slides)`);
}

/* ── Main ───────────────────────────────────────────────────────── */
async function main() {
  const args = process.argv.slice(2).map(a => a.toLowerCase()).filter(a => DECKS[a]);
  const keys = args.length ? args : Object.keys(DECKS);

  const server = await startServer(DASH_DIR); const port = server.address().port;
  console.log(`Server: http://localhost:${port}  ·  HiDPI x${HIDPI}  ·  decks: ${keys.join(', ')}`);
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: HIDPI });
  const page = await ctx.newPage();

  for (const k of keys) await buildDeck(page, port, k);

  await browser.close(); server.close();
}
main().catch(e => { console.error(e); process.exit(1); });
