#!/usr/bin/env node
/**
 * PptxGenJS v9: Skeleton puro — sin screenshots.
 * Extrae paneles, tarjetas, tablas, textos e íconos del navegador
 * y construye todo con elementos PPT nativos.
 *
 * Ajustes de hoy:
 *  - fontMultiplier = 0.75 (px→pt)
 *  - cell Y offset = -0.0156"
 *  - valign: middle en celdas
 *  - Exclusión de títulos que solapan con iconos SVG
 */
import { chromium } from 'playwright';
import PptxGenJS from 'pptxgenjs';
import http from 'http'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = __dirname, DASH_DIR = path.resolve(DIR, '..');
const ICON_DIR = path.join(DIR, 'ppt_icons');
const PPT_W = 13.333, PPT_H = 7.5;
const SX = PPT_W / 1280, SY = PPT_H / 720;
const FM = 0.75; // font multiplier px→pt
const FMAX = 14; // max font pt
const CELL_DY = -1.5; // CSS px adjustment for cell Y (-0.0156")

const SLIDES = [
  [0, 'Portada', null], [1, 'Cap. 1', null],
  [2, 'Ventas', [['Vanti', "vtasTab('vanti')"], ['Xuma', "vtasTab('xuma')"]]],
  [3, 'Bases', null], [4, 'Campanas', null], [5, 'Autogestion', null],
  [6, 'D. Bienvenida', null], [7, 'D. Stock', null], [8, 'D. Masiva', null],
  [9, 'D. Satisfechos', null], [10, 'D. Microseguro', null], [11, 'D. Cancelaciones', null],
  [12, 'Asesores', [['Vanti', "asesoresTab('vanti')"], ['Xuma', "asesoresTab('xuma')"]]],
  [13, 'Iniciativas', null], [14, 'Evidencias', null], [15, 'Capacitaciones', null],
  [16, 'Monitoreo', null], [17, 'Cap. 2', null],
  [18, 'Contactab.', [['Mes', "contactabTab('mes')"], ['Campana', "contactabTab('campana')"]]],
  [19, 'Telefonia', [['Resumen', "telefoniaTab('resumen')"], ['Zonas', "telefoniaTab('zonas')"]]],
  [20, 'Proyeccion', [['Calculo', "proyeccionTab('calc')"], ['Escenario', "proyeccionTab('escenario')"]]],
  [21, 'Estrategia', [['Iniciativas', "estrategiaTab('ini')"], ['Cronograma', "estrategiaTab('cron')"], ['KPIs', "estrategiaTab('kpi')"]]],
  [22, 'Cierre', null],
];

function parseColor(s, fb = '120180') {
  if (!s) return fb;
  const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (m) return `${(+m[1]).toString(16).padStart(2, '0')}${(+m[2]).toString(16).padStart(2, '0')}${(+m[3]).toString(16).padStart(2, '0')}`;
  // hex already
  const h = s.replace('#', '');
  if (/^[0-9a-f]{6}$/i.test(h)) return h;
  return fb;
}

function isDarkColor(hex) {
  const c = parseInt(hex, 16);
  const r = (c >> 16) & 0xff, g = (c >> 8) & 0xff, b = c & 0xff;
  return (r * 0.299 + g * 0.587 + b * 0.114) < 128;
}

function mapAlign(a) { return a === 'right' ? 'right' : a === 'center' ? 'center' : 'left'; }

function startServer(dir, port = 0) {
  return new Promise(r => {
    const s = http.createServer((req, res) => {
      const pn = req.url.split('?')[0];
      let fp = path.join(dir, pn === '/' ? '/televentas/index.html' : pn);
      if (!path.extname(fp)) fp = path.join(fp, 'index.html');
      const types = { '.html': 'text/html;charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
      fs.readFile(fp, (e, d) => {
        if (e) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'Content-Type': types[path.extname(fp)] || 'application/octet-stream' });
        res.end(d);
      });
    });
    s.listen(port, () => r(s));
  });
}

async function extractSlide(page) {
  return await page.evaluate(() => {
    function mAlign(a) { return a === 'right' ? 'right' : a === 'center' ? 'center' : 'left'; }
    function pColor(s, fb = '120180') {
      if (!s) return fb;
      const m = s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      if (m) return `${(+m[1]).toString(16).padStart(2, '0')}${(+m[2]).toString(16).padStart(2, '0')}${(+m[3]).toString(16).padStart(2, '0')}`;
      const h = s.replace('#', '');
      if (/^[0-9a-f]{6}$/i.test(h)) return h;
      return fb;
    }
    const scaler = document.getElementById('scaler');
    if (!scaler) return null;
    const sRect = scaler.getBoundingClientRect();
    const sx = sRect.width / 1280, sy = sRect.height / 720;
    const active = document.querySelector('#scaler .slide.active') || scaler;

    function cp(el) { const r = el.getBoundingClientRect(); return { x: (r.left - sRect.left) / sx, y: (r.top - sRect.top) / sy, w: r.width / sx, h: r.height / sy }; }
    function visible(el) { if (!el) return false; const s = window.getComputedStyle(el); return s.display !== 'none' && s.visibility !== 'hidden'; }

    // ── Slide type ──
    const isCover = active.classList.contains('slide-cover');
    const isSection = active.classList.contains('slide-section');
    const isContent = active.classList.contains('slide-content');
    const slideType = isCover ? 'cover' : isSection ? 'section' : 'content';

    // ── Background color ──
    const bgStyle = window.getComputedStyle(active);
    let bgColor = bgStyle.backgroundColor;
    // if transparent, use body bg
    if (!bgColor || bgColor === 'rgba(0,0,0,0)' || bgColor === 'transparent') {
      const bodyBg = window.getComputedStyle(document.body).backgroundColor;
      bgColor = bodyBg || 'rgb(10,0,82)';
    }

    // ── Title text (slide-level) ──
    let slideTitle = '';
    if (isContent) {
      const h2 = active.querySelector('.s-header h2');
      if (h2) slideTitle = h2.textContent.trim();
    } else if (isCover) {
      const ct = active.querySelector('.cover-title');
      if (ct) slideTitle = ct.textContent.trim();
    } else if (isSection) {
      const st = active.querySelector('.section-title');
      if (st) slideTitle = st.textContent.trim();
    }

    // ── Header bar (content slides) ──
    let header = null;
    if (isContent) {
      const hEl = active.querySelector('.s-header');
      if (hEl && visible(hEl)) {
        const hp = cp(hEl);
        const tagEl = hEl.querySelector('.s-tag');
        header = { x: hp.x, y: hp.y, w: hp.w, h: hp.h, tag: tagEl ? tagEl.textContent.trim() : '' };
      }
    }

    // ── Panels (white content cards) ──
    const panels = [];
    active.querySelectorAll('.panel').forEach(el => {
      if (!visible(el)) return;
      const p = cp(el); if (p.w < 5 || p.h < 5) return;
      const s = window.getComputedStyle(el);
      panels.push({ x: p.x, y: p.y, w: p.w, h: p.h, bg: pColor(s.backgroundColor, 'FFFFFF'), radius: parseFloat(s.borderRadius) || 0 });
    });

    // ── KPI cards ──
    const kpis = [];
    active.querySelectorAll('.kpi-card').forEach(el => {
      if (!visible(el)) return;
      const p = cp(el); if (p.w < 5 || p.h < 5) return;
      const s = window.getComputedStyle(el);
      kpis.push({ x: p.x, y: p.y, w: p.w, h: p.h, bg: pColor(s.backgroundColor, 'FFFFFF'), borderColor: pColor(s.borderLeftColor, '120180') });
    });

    // ── Alert boxes ──
    const alerts = [];
    active.querySelectorAll('.alert-warn, .alert-info, .alert').forEach(el => {
      if (!visible(el)) return;
      const p = cp(el); if (p.w < 5 || p.h < 5) return;
      const s = window.getComputedStyle(el);
      const isWarn = el.classList.contains('alert-warn');
      alerts.push({ x: p.x, y: p.y, w: p.w, h: p.h, bg: pColor(s.backgroundColor, 'FFF3E0'), borderColor: pColor(s.borderLeftColor, isWarn ? 'FF6B35' : '120180'), warn: isWarn });
    });

    // ── Icon rects (for overlap detection) ──
    const iconRects = [];
    active.querySelectorAll('svg.lucide-ico, .lucide-ico svg, .ico svg, .lucide-ico, .ico').forEach(ico => {
      const r = ico.getBoundingClientRect(); if (r.width < 3 || r.height < 3) return;
      iconRects.push({ x: (r.left - sRect.left) / sx, y: (r.top - sRect.top) / sy, w: r.width / sx, h: r.height / sy });
    });
    function ovlIco(x, y, w, h, m = 4) { for (const ir of iconRects) { if (x + w + m > ir.x && x < ir.x + ir.w + m && y + h + m > ir.y && y < ir.y + ir.h + m) return true; } return false; }

    // ── Icons (name + position) ──
    const icons = [];
    active.querySelectorAll('.lucide-ico, .ico').forEach(el => {
      if (!visible(el)) return;
      const svg = el.tagName === 'svg' ? el : el.querySelector('svg');
      if (!svg || !visible(svg)) return;
      const p = cp(svg); if (p.w < 3 || p.h < 3) return;
      // get icon name from class
      const cls = Array.from(svg.classList).find(c => c.startsWith('lucide-'));
      if (cls) {
        icons.push({ x: p.x, y: p.y, w: p.w, h: p.h, name: cls.replace('lucide-', '') });
      }
    });

    // ── Chips (cover slide) ──
    const chips = [];
    if (isCover) {
      active.querySelectorAll('.cover-chips span, .cover-chips .chip').forEach(el => {
        if (!visible(el)) return;
        const p = cp(el); if (p.w < 5 || p.h < 5) return;
        chips.push({ x: p.x, y: p.y, w: p.w, h: p.h, text: el.textContent.trim() });
      });
    }

    // ── Tables ──
    const tables = [];
    const skipTags = new Set(['svg', 'path', 'rect', 'circle', 'line', 'polyline', 'polygon', 'use', 'defs', 'clipPath', 'mask']);
    active.querySelectorAll('table').forEach(tbl => {
      if (!visible(tbl)) return;
      const tvp = tbl.getBoundingClientRect();
      if (tvp.width < 5 || tvp.height < 5) return;
      const rows = [];
      let maxCols = 0;
      tbl.querySelectorAll('tr').forEach(tr => {
        if (!visible(tr)) return;
        const cells = [];
        tr.querySelectorAll('th, td').forEach(cell => {
          if (!visible(cell)) return;
          const style = window.getComputedStyle(cell);
          cells.push({
            text: cell.textContent.trim().replace(/\s+/g, ' '),
            align: style.textAlign || 'left',
            bold: style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 600,
            color: pColor(style.color, '120180'),
            fontSize: parseFloat(style.fontSize) || 10,
            bg: pColor(style.backgroundColor, 'FFFFFF'),
            isHeader: cell.tagName === 'TH',
          });
        });
        if (cells.length > maxCols) maxCols = cells.length;
        if (cells.length) rows.push(cells);
      });
      if (rows.length) {
        const tPos = cp(tbl);
        tables.push({ x: tPos.x, y: tPos.y, w: tPos.w, h: tPos.h, rows, numCols: maxCols });
      }
    });

    // ── Non-table text ──
    const texts = [], seen = new Set();
    const textSkipTags = new Set(['svg', 'path', 'rect', 'circle', 'line', 'polyline', 'polygon', 'use', 'defs', 'clipPath', 'mask', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'col', 'colgroup', 'script', 'style']);

    active.querySelectorAll('*').forEach(el => {
      if (textSkipTags.has(el.tagName.toLowerCase())) return;
      if (el.closest('.lucide-ico') || el.classList.contains('lucide-ico') || el.classList.contains('ico')) return;
      if (!visible(el)) return;
      if (el.closest('table')) return;

      let dt = '';
      for (const c of el.childNodes) { if (c.nodeType === 3) dt += c.textContent; }
      const text = dt.trim();
      if (!text || text.length < 2) return;

      const p = cp(el); if (p.w < 3 || p.h < 3) return;
      if (ovlIco(p.x, p.y, p.w, p.h)) return;
      const key = `${p.x.toFixed(0)},${p.y.toFixed(0)},${text}`;
      if (seen.has(key)) return; seen.add(key);

      const style = window.getComputedStyle(el);
      texts.push({
        text, x: p.x, y: p.y, w: p.w, h: p.h,
        fontSize: parseFloat(style.fontSize) || 10,
        bold: style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 600,
        color: pColor(style.color, '120180'),
        textAlign: mAlign(style.textAlign),
      });
    });

    // ── Cover credits ──
    let coverCredits = null;
    if (isCover) {
      const cr = active.querySelector('.cover-credits');
      if (cr && visible(cr)) {
        const cp2 = cp(cr);
        coverCredits = { x: cp2.x, y: cp2.y, w: cp2.w, h: cp2.h, text: cr.textContent.trim() };
      }
    }

    return { slideType, bgColor, slideTitle, header, panels, kpis, alerts, icons, chips, coverCredits, tables, texts };
  });
}

async function main() {
  const server = await startServer(DASH_DIR);
  const port = server.address().port;
  console.log(`Server: http://localhost:${port}`);

  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: 'CUSTOM', width: PPT_W, height: PPT_H });
  pptx.layout = 'CUSTOM';

  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await ctx.newPage();

  for (const [num, label, tabs] of SLIDES) {
    try {
      await page.goto(`http://localhost:${port}/televentas/index.html?slide=${num}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(900);
      await page.evaluate(() => {
        const s = document.getElementById('scaler'); if (s) { s.style.position = 'relative'; s.style.transform = 'scale(1)'; s.style.top = '0'; s.style.left = '0'; }
        document.body.style.margin = '0'; document.body.style.overflow = 'hidden';
        ['prev-btn', 'next-btn', 'home-btn', 'nav'].forEach(id => { const el = document.getElementById(id); if (el) el.style.display = 'none'; });
      });
      await page.waitForTimeout(100);

      const variants = tabs || [null];
      for (const variant of variants) {
        const slideLabel = label + (variant ? ' ' + variant[0] : '');
        if (variant) { await page.evaluate(variant[1]); await page.waitForTimeout(300); }

        const data = await extractSlide(page);
        if (!data) continue;
        const { slideType, bgColor, slideTitle, header, panels, kpis, alerts, icons, chips, coverCredits, tables, texts } = data;

        const slide = pptx.addSlide();
        const bg = parseColor(bgColor, '0a0052');

        // ── Background ──
        slide.background = { color: bg };

        // ── Header bar (content slides) ──
        if (header) {
          slide.addShape(pptx.ShapeType.rect, {
            x: header.x * SX, y: header.y * SY, w: header.w * SX, h: header.h * SY,
            fill: { color: '120180' }, line: { color: '120180', width: 0 },
          });
          if (header.tag) {
            slide.addShape(pptx.ShapeType.roundRect, {
              x: header.x * SX + header.w * SX - 190 * SX, y: header.y * SY + 8 * SY,
              w: 190 * SX, h: (header.h * SY - 16 * SY),
              fill: { color: '5AE280', transparency: 85 },
              rectRadius: 0.12,
            });
            slide.addText(header.tag, {
              x: header.x * SX + header.w * SX - 190 * SX, y: header.y * SY + 8 * SY,
              w: 190 * SX, h: (header.h * SY - 16 * SY),
              fontSize: 11, bold: true, color: '5AE280', fontFace: 'Raleway',
              align: 'center', valign: 'middle',
            });
          }
          // Slide title
          if (slideTitle) {
            slide.addText(slideTitle, {
              x: header.x * SX + 24, y: header.y * SY,
              w: header.w * SX * 0.6, h: header.h * SY,
              fontSize: 15, bold: true, color: 'FFFFFF', fontFace: 'Raleway',
              valign: 'middle', wrap: false,
            });
          }
        }

        // ── Section/cover slides: full widths ──
        if (slideType === 'section') {
          const sectionNum = num === 1 ? '01' : '02';
          const sectionLabel = num === 1 ? 'Capítulo 1' : 'Capítulo 2';
          slide.addText(sectionLabel, {
            x: 0.8, y: 1.5, w: 4, h: 0.6,
            fontSize: 12, bold: true, color: '5AE280', fontFace: 'Raleway', letterSpacing: 4,
          });
          slide.addText(slideTitle || label, {
            x: 0.8, y: 2.2, w: 8, h: 1.2,
            fontSize: 28, bold: true, color: 'FFFFFF', fontFace: 'Raleway',
          });
        }

        // ── Cover slide ──
        if (slideType === 'cover') {
          slide.addText('Televentas', {
            x: 1.042 * SX, y: 3.031 * SX, w: 3, h: 0.8,
            fontSize: 20, bold: true, color: 'FFFFFF', fontFace: 'Raleway',
          });
          slide.addText('Canal 2026', {
            x: 1.042 * SX, y: 2.392 * SY, w: 3, h: 0.8,
            fontSize: 20, bold: true, color: '00CD93', fontFace: 'Raleway',
          });
          if (coverCredits) {
            slide.addText(coverCredits.text, {
              x: coverCredits.x * SX, y: coverCredits.y * SY,
              w: coverCredits.w * SX, h: coverCredits.h * SY,
              fontSize: 11, color: 'FFFFFF', fontFace: 'Raleway',
            });
          }
          for (const chip of chips) {
            slide.addShape(pptx.ShapeType.roundRect, {
              x: chip.x * SX, y: chip.y * SY, w: chip.w * SX, h: chip.h * SY,
              fill: { color: 'FFFFFF', transparency: 90 },
              rectRadius: 0.1,
            });
            slide.addText(chip.text, {
              x: chip.x * SX, y: chip.y * SY, w: chip.w * SX, h: chip.h * SY,
              fontSize: 9, color: 'FFFFFF', fontFace: 'Raleway', align: 'center', valign: 'middle',
            });
          }
        }

        // ── Panels (white cards) ──
        for (const p of panels) {
          slide.addShape(pptx.ShapeType.roundRect, {
            x: p.x * SX, y: p.y * SY, w: p.w * SX, h: p.h * SY,
            fill: { color: p.bg || 'FFFFFF' },
            rectRadius: 0.15,
            shadow: { type: 'outer', blur: 8, offset: 2, color: '000000', opacity: 0.1 },
            line: { color: 'FFFFFF', width: 0 },
          });
        }

        // ── KPI cards (accent border-left) ──
        for (const k of kpis) {
          // accent bar on left
          slide.addShape(pptx.ShapeType.rect, {
            x: k.x * SX, y: k.y * SY, w: 4 / 1280 * PPT_W, h: k.h * SY,
            fill: { color: k.borderColor || '120180' },
          });
          // white card body
          slide.addShape(pptx.ShapeType.rect, {
            x: (k.x * SX + 4 / 1280 * PPT_W), y: k.y * SY,
            w: k.w * SX - 4 / 1280 * PPT_W, h: k.h * SY,
            fill: { color: k.bg || 'FFFFFF' },
          });
        }

        // ── Alerts ──
        for (const a of alerts) {
          slide.addShape(pptx.ShapeType.rect, {
            x: a.x * SX, y: a.y * SY, w: a.w * SX, h: a.h * SY,
            fill: { color: a.bg || (a.warn ? 'FFF3E0' : 'E3F2FD') },
          });
        }

        // ── Icons ──
        for (const ico of icons) {
          const icoPath = path.join(ICON_DIR, `${ico.name}.png`);
          if (fs.existsSync(icoPath)) {
            slide.addImage({ path: icoPath, x: ico.x * SX, y: ico.y * SY, w: ico.w * SX, h: ico.h * SY });
          }
        }

        // ── Tables ──
        for (const tbl of tables) {
          const numCols = tbl.numCols || (tbl.rows[0] ? tbl.rows[0].length : 1);
          const colW = tbl.w / numCols;
          const rowH = tbl.h / tbl.rows.length;
          const pptRows = tbl.rows.map(row => row.map(cell => ({
            text: cell.text,
            options: {
              fontSize: Math.min(cell.fontSize * FM, FMAX),
              bold: cell.bold,
              color: cell.isHeader ? 'FFFFFF' : cell.color,
              align: mapAlign(cell.align),
              fontFace: 'Raleway',
              fill: cell.isHeader ? { color: '120180' } : { color: cell.bg === 'ffffff' ? 'FFFFFF' : cell.bg || 'FFFFFF' },
              margin: [2, 4, 2, 4],
              border: { type: 'solid', pt: 0.5, color: 'E0E0E0' },
            },
          })));
          slide.addTable(pptRows, {
            x: tbl.x * SX, y: tbl.y * SY,
            w: tbl.w * SX, h: tbl.h * SY,
            colW: colW * SX,
            rowH: rowH * SY,
            border: { type: 'solid', pt: 0.5, color: 'E0E0E0' },
            autoPage: false,
          });
        }

        // ── Non-table text ──
        // Dedup: longer text first, skip contained
        const sorted = [...texts].sort((a, b) => b.text.length - a.text.length);
        const filtered = [], regions = [];
        for (const t of sorted) {
          let contained = false;
          for (const [ux, uy, uw, uh] of regions) {
            if (t.x >= ux - 1 && t.y >= uy - 1 && t.x + t.w <= ux + uw + 1 && t.y + t.h <= uy + uh + 1) { contained = true; break; }
          }
          if (!contained) { filtered.push(t); regions.push([t.x, t.y, t.w, t.h]); }
        }

        for (const t of filtered) {
          // Skip text that's already covered by table cells or panels
          let inTable = false;
          for (const tbl of tables) {
            if (t.x >= tbl.x && t.y >= tbl.y && t.x + t.w <= tbl.x + tbl.w && t.y + t.h <= tbl.y + tbl.h) { inTable = true; break; }
          }
          if (inTable) continue;
          if (t.w < 5 || t.h < 3) continue;

          // Check if this text overlaps with a chip (already rendered)
          let inChip = false;
          for (const chip of chips) {
            if (t.x >= chip.x && t.y >= chip.y && t.x + t.w <= chip.x + chip.w && t.y + t.h <= chip.y + chip.h) { inChip = true; break; }
          }
          if (inChip) continue;

          slide.addText(t.text, {
            x: t.x * SX, y: t.y * SY,
            w: Math.max(t.w * SX, 0.3),
            h: Math.max(t.h * SY, 0.14),
            fontSize: Math.min(t.fontSize * FM, FMAX),
            bold: t.bold,
            color: t.color,
            fontFace: 'Raleway',
            align: t.textAlign,
            valign: 'top',
            wrap: true,
            margin: 0,
            paraSpaceAfter: 0,
            paraSpaceBefore: 0,
          });
        }

        const elCount = panels.length + tables.length + filtered.length + icons.length + kpis.length + alerts.length;
        console.log(`  ${num} ${slideLabel.padEnd(25)} -> ${elCount} elementos (${tables.length} tablas, ${filtered.length} textos, ${icons.length} iconos, ${panels.length} paneles)`);
      }
    } catch (err) {
      console.error(`  ${num} ${label}: ERROR ${err.message}`);
    }
  }

  await browser.close();
  server.close();
  const outPath = path.join(DIR, 'INFORME_TELEVENTAS_ESQUELETO.pptx');
  await pptx.writeFile({ fileName: outPath });
  console.log(`\nPPT: ${outPath}\n${pptx.slides.length} slides`);
}

main().catch(console.error);
