#!/usr/bin/env node
/**
 * PptxGenJS v10: Skeleton V3 mejorado con ajustes del híbrido V6
 * 
 * Base: v3 (skeleton screenshot + text overlays)
 * Ajustes de v6:
 *  - fontMultiplier = 0.75 (px→pt), max 14pt
 *  - cell Y offset = -0.0156"
 *  - valign: middle en celdas, top en otros textos
 *  - cell height exacta (sin *1.05)
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
const FM = 0.75;
const FMAX = 48;
const CELL_DY_IN = -0.0156;
const CELL_DY_PX = CELL_DY_IN / SY;

const SLIDES = [
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
];

function parseColor(str) {
  if (!str) return null;
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m ? { r:+m[1], g:+m[2], b:+m[3] } : null;
}
function colorHex(c) { return c ? `${c.r.toString(16).padStart(2,'0')}${c.g.toString(16).padStart(2,'0')}${c.b.toString(16).padStart(2,'0')}` : '120180'; }
function mapAlign(a) { return a==='right'?'right':a==='center'?'center':'left'; }

function startServer(dir, port = 0) {
  return new Promise(resolve => {
    const s = http.createServer((req, res) => {
      const pn = req.url.split('?')[0];
      let fp = path.join(dir, pn==='/'?'/televentas/index.html':pn);
      if (!path.extname(fp)) fp = path.join(fp, 'index.html');
      const ext = path.extname(fp);
      const types = { '.html':'text/html;charset=utf-8','.css':'text/css','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml' };
      fs.readFile(fp, (err, data) => {
        if (err) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'Content-Type': types[ext]||'application/octet-stream' });
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
  pptx.defineLayout({ name:'CUSTOM', width:PPT_W, height:PPT_H });
  pptx.layout = 'CUSTOM';

  const browser = await chromium.launch({ headless:true });
  const ctx = await browser.newContext({ viewport:{ width:1280, height:720 }, deviceScaleFactor:3 });
  const page = await ctx.newPage();

  for (const [num, label, tabs] of SLIDES) {
    try {
      await page.goto(`http://localhost:${port}/televentas/index.html?slide=${num}`, { waitUntil:'load', timeout:30000 });
      await page.waitForTimeout(900);

      await page.evaluate(() => {
        const s = document.getElementById('scaler');
        if (s) { s.style.position='relative'; s.style.transform='scale(1)'; s.style.top='0'; s.style.left='0'; }
        document.body.style.margin='0'; document.body.style.overflow='hidden';
        ['prev-btn','next-btn','home-btn','nav'].forEach(id => {
          const el = document.getElementById(id);
          if (el) el.style.display='none';
        });
      });
      await page.waitForTimeout(100);

      const variants = tabs || [null];
      for (const variant of variants) {
        const slideLabel = label + (variant ? ' '+variant[0] : '');
        if (variant) {
          await page.evaluate(variant[1]);
          await page.waitForTimeout(300);
        }

        // ── Extract text ──
        const textData = await page.evaluate(() => {
          const scaler = document.getElementById('scaler');
          if (!scaler) return [];
          const sRect = scaler.getBoundingClientRect();
          const sx = sRect.width/1280, sy = sRect.height/720;
          const active = document.querySelector('#scaler .slide.active')||scaler;
          const results = [];
          const seen = new Set();

          function cp(el) {
            const r = el.getBoundingClientRect();
            return { x:(r.left-sRect.left)/sx, y:(r.top-sRect.top)/sy, w:r.width/sx, h:r.height/sy };
          }

          const iconRects = [];
          active.querySelectorAll('svg,.lucide-ico,.ico').forEach(ico => {
            const r = ico.getBoundingClientRect();
            iconRects.push({ x:(r.left-sRect.left)/sx, y:(r.top-sRect.top)/sy, w:r.width/sx, h:r.height/sy });
          });
          function ovlIco(x,y,w,h,m=4) {
            for (const ir of iconRects) {
              if (x+w+m>ir.x && x<ir.x+ir.w+m && y+h+m>ir.y && y<ir.y+ir.h+m) return true;
            }
            return false;
          }

          const cellTexts = [];

          // 1) Table cells
          active.querySelectorAll('td, th').forEach(cell => {
            const p = cp(cell);
            if (p.w<3||p.h<3) return;
            const text = cell.textContent.trim();
            if (!text||text.length<2) return;
            const style = window.getComputedStyle(cell);
            cellTexts.push({
              text, x:p.x, y:p.y, w:p.w, h:p.h,
              fontSize: parseFloat(style.fontSize)||10,
              bold: style.fontWeight==='bold'||parseInt(style.fontWeight)>=600,
              color: style.color,
              textAlign: style.textAlign||'left',
              _cell: true
            });
          });

          // 2) Leaf text nodes
          const leafTexts = [];
          const skipTags = new Set(['svg','path','rect','circle','line','polyline','polygon','use','td','th']);
          active.querySelectorAll('*').forEach(el => {
            if (skipTags.has(el.tagName)) return;
            if (el.closest('.lucide-ico')||el.classList.contains('lucide-ico')||el.classList.contains('ico')) return;
            const style = window.getComputedStyle(el);
            if (style.display==='none'||style.visibility==='hidden') return;
            const hasBlockChildren = el.querySelector('div, p, table, tr, td, th, ul, li, h1, h2, h3, h4, h5, h6, section, article, nav, header, footer') !== null;
            let text = '';
            if (hasBlockChildren) {
              let dt = '';
              for (const c of el.childNodes) {
                if (c.nodeType===3) dt += c.textContent;
              }
              text = dt.replace(/\s+/g, ' ').trim();
            } else {
              text = el.textContent.replace(/\s+/g, ' ').trim();
            }
            if (!text||text.length<2) return;
            const p = cp(el);
            if (p.w<3||p.h<3) return;
            if (ovlIco(p.x,p.y,p.w,p.h)) return;
            let inCell = false;
            for (const ct of cellTexts) {
              if (p.x>=ct.x&&p.y>=ct.y&&p.x+p.w<=ct.x+ct.w&&p.y+p.h<=ct.y+ct.h) { inCell=true; break; }
            }
            if (inCell) return;
            const key = `${p.x.toFixed(0)},${p.y.toFixed(0)},${text}`;
            if (seen.has(key)) return;
            seen.add(key);
            leafTexts.push({
              text, x:p.x, y:p.y, w:p.w, h:p.h,
              fontSize: parseFloat(style.fontSize)||10,
              bold: style.fontWeight==='bold'||parseInt(style.fontWeight)>=600,
              color: style.color,
              textAlign: style.textAlign||'left',
            });
          });

          return [...cellTexts, ...leafTexts];
        });

        // Dedup by region
        textData.sort((a,b) => b.text.length - a.text.length);
        const filtered = [];
        const regions = [];
        for (const t of textData) {
          let contained = false;
          for (const [ux,uy,uw,uh] of regions) {
            if (t.x>=ux-1&&t.y>=uy-1&&t.x+t.w<=ux+uw+1&&t.y+t.h<=uy+uh+1) { contained=true; break; }
          }
          if (!contained) { filtered.push(t); regions.push([t.x,t.y,t.w,t.h]); }
        }

        // ── Screenshot SKELETON (text hidden, icons visible) ──
        await page.evaluate(() => {
          window._c = [];
          document.querySelectorAll('svg,.lucide-ico').forEach(el => window._c.push({el,color:getComputedStyle(el).color}));
          document.querySelectorAll('*').forEach(el => {
            if (!el.closest('svg')&&!el.classList.contains('lucide-ico')) el.style.setProperty('color','transparent','important');
          });
          window._c.forEach(({el,color}) => el.style.setProperty('color',color,'important'));
        });
        await page.waitForTimeout(100);
        const ssPath = path.join(OUT_DIR,`sk_${String(num).padStart(2,'0')}_${variant?variant[0]:'main'}.png`);
        await page.screenshot({ path:ssPath });
        await page.evaluate(() => { document.querySelectorAll('*').forEach(el => el.style.removeProperty('color')); });

        // ── PPT ──
        const slide = pptx.addSlide();
        if (fs.existsSync(ssPath)) slide.addImage({ path:ssPath, x:0, y:0, w:PPT_W, h:PPT_H });

        let cCount=0, tCount=0;
        for (const t of filtered) {
          if (t.w<5||t.h<3) continue;
          const isCell = t._cell;
          const xInch = t.x*SX;
          const yInch = t.y*SY + (isCell ? CELL_DY_IN : 0);
          const wInch = Math.max(t.w*SX*1.05, 0.3);
          // Cells: exact height. Others: 1.05x
          const hInch = isCell ? Math.max(t.h*SY, 0.12) : Math.max(t.h*SY*1.05, 0.12);
          const color = parseColor(t.color);
          const ch = colorHex(color);
          const fs_ = Math.min(t.fontSize * FM, FMAX);

          slide.addText(t.text, {
            x:xInch, y:yInch, w:wInch, h:hInch,
            fontSize:fs_, bold:t.bold, color:ch, fontFace:'Raleway',
            align:mapAlign(t.textAlign), margin:0,
            valign: isCell ? 'middle' : 'top',
            paraSpaceAfter:0, paraSpaceBefore:0, autoFit:false, wrap:true,
          });
          if (isCell) cCount++; else tCount++;
        }
        console.log(`  ${num} ${slideLabel.padEnd(25)} -> ${cCount} celdas, ${tCount} textos`);
      }
    } catch(err) { console.error(`  ${num} ${label}: ERROR ${err.message}`); }
  }

  await browser.close(); server.close();
  const outPath = path.join(DIR, 'INFORME_TELEVENTAS_ESQUELETO_V3.pptx');
  await pptx.writeFile({ fileName:outPath });
  console.log(`\nPPT: ${outPath}\n${pptx.slides.length} slides`);
}

main().catch(console.error);
