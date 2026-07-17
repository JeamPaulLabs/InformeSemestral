#!/usr/bin/env node
/**
 * PptxGenJS generator v2: SKELETON (text hidden) + editable overlays
 * Fixes: font size 1:1, SVG text extraction, icon-aware positioning
 */
import { chromium } from 'playwright';
import PptxGenJS from 'pptxgenjs';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = __dirname;
const DASH_DIR = path.resolve(DIR, '..');
const OUT_DIR = path.join(DIR, 'ppt_slides');
fs.mkdirSync(OUT_DIR, { recursive: true });

const PPT_W = 13.333;
const PPT_H = 7.5;
const CANVAS_W = 1280;
const CANVAS_H = 720;
const SX = PPT_W / CANVAS_W;
const SY = PPT_H / CANVAS_H;

const SLIDES = [
  [0, 'Portada', null], [1, 'Cap. 1', null],
  [2, 'Ventas', [['Vanti',"vtasTab('vanti')"],['Xuma',"vtasTab('xuma')"]]],
  [3, 'Bases', null], [4, 'Campanas', null], [5, 'Autogestion', null],
  [6, 'D. Bienvenida', null], [7, 'D. Stock', null], [8, 'D. Masiva', null],
  [9, 'D. Satisfechos', null], [10, 'D. Microseguro', null], [11, 'D. Cancelaciones', null],
  [12, 'Asesores',[['Vanti',"asesoresTab('vanti')"],['Xuma',"asesoresTab('xuma')"]]],
  [13, 'Iniciativas', null], [14, 'Evidencias', null], [15, 'Capacitaciones', null],
  [16, 'Monitoreo', null], [17, 'Cap. 2', null],
  [18, 'Contactab.',[['Mes',"contactabTab('mes')"],['Campana',"contactabTab('campana')"]]],
  [19, 'Telefonia',[['Resumen',"telefoniaTab('resumen')"],['Zonas',"telefoniaTab('zonas')"]]],
  [20, 'Proyeccion',[['Calculo',"proyeccionTab('calc')"],['Escenario',"proyeccionTab('escenario')"]]],
  [21, 'Estrategia',[['Iniciativas',"estrategiaTab('ini')"],['Cronograma',"estrategiaTab('cron')"],['KPIs',"estrategiaTab('kpi')"]]],
  [22, 'Cierre', null],
];

function parseColor(str) {
  if (!str) return null;
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? { r: +m[1], g: +m[2], b: +m[3] } : null;
}

function mapAlign(a) {
  if (a === 'right') return 'right';
  if (a === 'center') return 'center';
  return 'left';
}

function startServer(dir, port = 0) {
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      const pathname = req.url.split('?')[0];
      let filePath = path.join(dir, pathname === '/' ? '/televentas/index.html' : pathname);
      if (!path.extname(filePath)) filePath = path.join(filePath, 'index.html');
      const ext = path.extname(filePath);
      const types = { '.html':'text/html;charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml' };
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    s.listen(port, () => resolve(s));
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
  const ctx = await browser.newContext({ viewport: { width: CANVAS_W, height: CANVAS_H } });
  const page = await ctx.newPage();

  for (const [num, label, tabs] of SLIDES) {
    try {
      await page.goto(`http://localhost:${port}/televentas/index.html?slide=${num}`, { waitUntil: 'networkidle', timeout: 15000 });
      await page.waitForTimeout(900);

      // Force canvas to exact position
      await page.evaluate(() => {
        const s = document.getElementById('scaler');
        if (s) { s.style.position = 'relative'; s.style.transform = 'scale(1)'; s.style.top = '0'; s.style.left = '0'; }
        document.body.style.margin = '0'; document.body.style.overflow = 'hidden';
        ['prev-btn','next-btn','home-btn','nav'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.style.display = 'none';
        });
      });
      await page.waitForTimeout(100);

      const variants = tabs || [null];
      for (const variant of variants) {
        const slideLabel = label + (variant ? ' ' + variant[0] : '');
        if (variant) {
          await page.evaluate(variant[1]);
          await page.waitForTimeout(300);
        }

        // ── Extract text positions (including SVG text) ──
        const textData = await page.evaluate(() => {
          const scaler = document.getElementById('scaler');
          if (!scaler) return [];
          const sRect = scaler.getBoundingClientRect();
          const scaleX = sRect.width / 1280;
          const scaleY = sRect.height / 720;
          const active = document.querySelector('#scaler .slide.active') || scaler;
          const results = [];
          const seen = new Set();

          function canvasPos(el) {
            const r = el.getBoundingClientRect();
            return { x: (r.left - sRect.left) / scaleX, y: (r.top - sRect.top) / scaleY, w: r.width / scaleX, h: r.height / scaleY };
          }

          // Collect positions of all icons/SVGs for overlap detection
          const iconRects = [];
          active.querySelectorAll('svg, .lucide-ico, .ico').forEach(ico => {
            const r = ico.getBoundingClientRect();
            iconRects.push({ x: (r.left - sRect.left) / scaleX, y: (r.top - sRect.top) / scaleY, w: r.width / scaleX, h: r.height / scaleY });
          });

          function overlapsIcon(cx, cy, cw, ch) {
            const margin = 4; // px tolerance
            for (const ir of iconRects) {
              if (cx + cw + margin > ir.x && cx < ir.x + ir.w + margin && cy + ch + margin > ir.y && cy < ir.y + ir.h + margin) return true;
            }
            return false;
          }

          const all = active.querySelectorAll('*');
          all.forEach(el => {
            // Skip non-text SVG elements (but allow text/tspan inside SVG)
            if (el.tagName === 'svg' || el.tagName === 'path' || el.tagName === 'rect' || el.tagName === 'circle' || el.tagName === 'line' || el.tagName === 'polyline' || el.tagName === 'polygon' || el.tagName === 'use') return;
            if (el.closest('.lucide-ico') || el.classList.contains('lucide-ico') || el.classList.contains('ico')) return;

            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') return;

            let dt = '';
            for (const c of el.childNodes) {
              if (c.nodeType === 3) dt += c.textContent;
            }
            const text = dt.trim();
            if (!text || text.length < 2) return;

            const cp = canvasPos(el);
            if (cp.w < 3 || cp.h < 3) return;

            // Skip if overlaps with an icon
            if (overlapsIcon(cp.x, cp.y, cp.w, cp.h)) return;

            const key = `${cp.x.toFixed(0)},${cp.y.toFixed(0)},${text}`;
            if (seen.has(key)) return;
            seen.add(key);

            results.push({
              text, x: cp.x, y: cp.y, w: cp.w, h: cp.h,
              fontSize: parseFloat(style.fontSize) || 10,
              bold: style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 600,
              color: style.color,
              textAlign: style.textAlign || 'left',
            });
          });
          return results;
        });

        // Deduplicate by region containment (longest first)
        textData.sort((a, b) => b.text.length - a.text.length);
        const filtered = [];
        const regions = [];
        for (const t of textData) {
          let contained = false;
          for (const [ux, uy, uw, uh] of regions) {
            if (t.x >= ux - 1 && t.y >= uy - 1 && t.x + t.w <= ux + uw + 1 && t.y + t.h <= uy + uh + 1) {
              contained = true; break;
            }
          }
          if (!contained) {
            filtered.push(t);
            regions.push([t.x, t.y, t.w, t.h]);
          }
        }

        // ── Screenshot SKELETON (text hidden, icons preserved) ──
        await page.evaluate(() => {
          window._pptColors = [];
          document.querySelectorAll('svg, .lucide-ico').forEach(el => {
            window._pptColors.push({ el, color: window.getComputedStyle(el).color });
          });
          document.querySelectorAll('*').forEach(el => {
            if (el.closest('svg') || el.classList.contains('lucide-ico')) return;
            el.style.setProperty('color', 'transparent', 'important');
          });
          window._pptColors.forEach(({ el, color }) => {
            el.style.setProperty('color', color, 'important');
          });
        });
        await page.waitForTimeout(100);

        const ssPath = path.join(OUT_DIR, `sk_${String(num).padStart(2,'0')}_${variant ? variant[0] : 'main'}.png`);
        await page.screenshot({ path: ssPath });

        // Restore text
        await page.evaluate(() => {
          document.querySelectorAll('*').forEach(el => el.style.removeProperty('color'));
        });

        // ── PPT slide ──
        const slide = pptx.addSlide();
        if (fs.existsSync(ssPath)) {
          slide.addImage({ path: ssPath, x: 0, y: 0, w: PPT_W, h: PPT_H });
        }

        for (const t of filtered) {
          if (t.w < 5 || t.h < 3) continue;

          const xInch = t.x * SX;
          const yInch = t.y * SY;
          // Slightly expand box to account for render differences
          const wInch = Math.max(t.w * SX * 1.05, 0.25);
          const hInch = Math.max(t.h * SY * 1.05, 0.12);

          const color = parseColor(t.color);
          // Use 1:1 px→pt ratio for font size that matches browser rendering
          const fontSize = Math.min(t.fontSize, 32);
          const colorHex = color ? `${color.r.toString(16).padStart(2,'0')}${color.g.toString(16).padStart(2,'0')}${color.b.toString(16).padStart(2,'0')}` : '120180';

          slide.addText(t.text, {
            x: xInch, y: yInch, w: wInch, h: hInch,
            fontSize: fontSize,
            bold: t.bold,
            color: colorHex,
            fontFace: 'Raleway',
            align: mapAlign(t.textAlign),
            margin: 0,
            valign: 'top',
            paraSpaceAfter: 0, paraSpaceBefore: 0,
            autoFit: false,
            wrap: true,
          });
        }

        console.log(`  ${num} ${slideLabel.padEnd(25)} -> ${filtered.length} textos`);
      }
    } catch (err) {
      console.error(`  ${num} ${label}: ERROR ${err.message}`);
    }
  }

  await browser.close();
  server.close();
  const outPath = path.join(DIR, 'INFORME_TELEVENTAS_ESQUELETO_V2.pptx');
  await pptx.writeFile({ fileName: outPath });
  console.log(`\nPPT: ${outPath}\n${pptx.slides.length} slides`);
}

main().catch(console.error);
