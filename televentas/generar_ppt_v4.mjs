#!/usr/bin/env node
/**
 * PptxGenJS v4: Tables as native PPT tables + skeleton overlays for other text
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

const PPT_W = 13.333, PPT_H = 7.5, SX = PPT_W/1280, SY = PPT_H/720;

const SLIDES = [
  [0,'Portada',null],[1,'Cap. 1',null],
  [2,'Ventas',[['Vanti',"vtasTab('vanti')"],['Xuma',"vtasTab('xuma')"]]],
  [3,'Bases',null],[4,'Campanas',null],[5,'Autogestion',null],
  [6,'D. Bienvenida',null],[7,'D. Stock',null],[8,'D. Masiva',null],
  [9,'D. Satisfechos',null],[10,'D. Microseguro',null],[11,'D. Cancelaciones',null],
  [12,'Asesores',[['Vanti',"asesoresTab('vanti')"],['Xuma',"asesoresTab('xuma')"]]],
  [13,'Iniciativas',null],[14,'Evidencias',null],[15,'Capacitaciones',null],
  [16,'Monitoreo',null],[17,'Cap. 2',null],
  [18,'Contactab.',[['Mes',"contactabTab('mes')"],['Campana',"contactabTab('campana')"]]],
  [19,'Telefonia',[['Resumen',"telefoniaTab('resumen')"],['Zonas',"telefoniaTab('zonas')"]]],
  [20,'Proyeccion',[['Calculo',"proyeccionTab('calc')"],['Escenario',"proyeccionTab('escenario')"]]],
  [21,'Estrategia',[['Iniciativas',"estrategiaTab('ini')"],['Cronograma',"estrategiaTab('cron')"],['KPIs',"estrategiaTab('kpi')"]]],
  [22,'Cierre',null],
];

function parseColor(str, fallback='120180') {
  if (!str) return fallback;
  const m = str.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) return fallback;
  return `${(+m[1]).toString(16).padStart(2,'0')}${(+m[2]).toString(16).padStart(2,'0')}${(+m[3]).toString(16).padStart(2,'0')}`;
}

function mapAlign(a) { return a==='right'?'right':a==='center'?'center':'left'; }

function startServer(dir, port=0) {
  return new Promise(r => {
    const s = http.createServer((req, res) => {
      const pn = req.url.split('?')[0];
      let fp = path.join(dir, pn==='/'?'/televentas/index.html':pn);
      if (!path.extname(fp)) fp = path.join(fp, 'index.html');
      const types = {'.html':'text/html;charset=utf-8','.css':'text/css','.js':'application/javascript','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
      fs.readFile(fp, (err, data) => {
        if (err) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, {'Content-Type': types[path.extname(fp)]||'application/octet-stream'});
        res.end(data);
      });
    });
    s.listen(port, () => r(s));
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
  const ctx = await browser.newContext({ viewport:{ width:1280, height:720 } });
  const page = await ctx.newPage();

  for (const [num, label, tabs] of SLIDES) {
    try {
      await page.goto(`http://localhost:${port}/televentas/index.html?slide=${num}`, { waitUntil:'networkidle', timeout:15000 });
      await page.waitForTimeout(900);

      await page.evaluate(() => {
        const s = document.getElementById('scaler');
        if (s) { s.style.position='relative'; s.style.transform='scale(1)'; s.style.top='0'; s.style.left='0'; }
        document.body.style.margin='0'; document.body.style.overflow='hidden';
        ['prev-btn','next-btn','home-btn','nav'].forEach(id => {
          const el = document.getElementById(id); if (el) el.style.display='none';
        });
      });
      await page.waitForTimeout(100);

      const variants = tabs || [null];
      for (const variant of variants) {
        const slideLabel = label + (variant ? ' '+variant[0] : '');
        if (variant) { await page.evaluate(variant[1]); await page.waitForTimeout(300); }

        // ══ Extract table data ══
        const tableData = await page.evaluate(() => {
          const scaler = document.getElementById('scaler');
          if (!scaler) return null;
          const sRect = scaler.getBoundingClientRect();
          const sx = sRect.width/1280, sy = sRect.height/720;
          const active = document.querySelector('#scaler .slide.active')||scaler;
          const tables = [];

          active.querySelectorAll('table').forEach((tbl, ti) => {
            const tRect = tbl.getBoundingClientRect();
            const rows = [];
            const numCols = 0;
            tbl.querySelectorAll('tr').forEach(tr => {
              const cells = [];
              tr.querySelectorAll('th, td').forEach(cell => {
                const style = window.getComputedStyle(cell);
                const cRect = cell.getBoundingClientRect();
                cells.push({
                  text: cell.textContent.trim(),
                  align: style.textAlign||'left',
                  bold: style.fontWeight==='bold'||parseInt(style.fontWeight)>=600,
                  color: style.color,
                  fontSize: parseFloat(style.fontSize)||10,
                  bgColor: style.backgroundColor,
                  colspan: cell.colSpan||1,
                });
              });
              if (cells.length) rows.push(cells);
            });

            tables.push({
              x: (tRect.left-sRect.left)/sx,
              y: (tRect.top-sRect.top)/sy,
              w: tRect.width/sx,
              h: tRect.height/sy,
              rows
            });
          });
          return tables.length ? tables : null;
        });

        // ══ Extract non-table text positions ══
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

          // Skip elements inside tables (they're handled separately)
          function insideTable(el) { return !!el.closest('table'); }

          // Icon positions
          const iconRects = [];
          active.querySelectorAll('svg,.lucide-ico,.ico').forEach(ico => {
            const r = ico.getBoundingClientRect();
            iconRects.push({ x:(r.left-sRect.left)/sx, y:(r.top-sRect.top)/sy, w:r.width/sx, h:r.height/sy });
          });
          function ovlIco(x,y,w,h,m=4) {
            for (const ir of iconRects) { if (x+w+m>ir.x && x<ir.x+ir.w+m && y+h+m>ir.y && y<ir.y+ir.h+m) return true; }
            return false;
          }

          const skip = new Set(['svg','path','rect','circle','line','polyline','polygon','use','td','th','tr','thead','tbody','tfoot','table','col','colgroup']);
          active.querySelectorAll('*').forEach(el => {
            if (skip.has(el.tagName)) return;
            if (insideTable(el)) return;
            if (el.closest('.lucide-ico')||el.classList.contains('lucide-ico')||el.classList.contains('ico')) return;
            const style = window.getComputedStyle(el);
            if (style.display==='none'||style.visibility==='hidden') return;
            let dt = '';
            for (const c of el.childNodes) { if (c.nodeType===3) dt += c.textContent; }
            const text = dt.trim();
            if (!text||text.length<2) return;
            const p = cp(el);
            if (p.w<3||p.h<3) return;
            if (ovlIco(p.x,p.y,p.w,p.h)) return;
            const key = `${p.x.toFixed(0)},${p.y.toFixed(0)},${text}`;
            if (seen.has(key)) return;
            seen.add(key);
            results.push({
              text, x:p.x, y:p.y, w:p.w, h:p.h,
              fontSize: parseFloat(style.fontSize)||10,
              bold: style.fontWeight==='bold'||parseInt(style.fontWeight)>=600,
              color: style.color,
              textAlign: style.textAlign||'left',
            });
          });
          return results;
        });

        // Dedup text
        textData.sort((a,b) => b.text.length-a.text.length);
        const filtered = [];
        const regions = [];
        for (const t of textData) {
          let contained = false;
          for (const [ux,uy,uw,uh] of regions) { if (t.x>=ux-1&&t.y>=uy-1&&t.x+t.w<=ux+uw+1&&t.y+t.h<=uy+uh+1) { contained=true; break; } }
          if (!contained) { filtered.push(t); regions.push([t.x,t.y,t.w,t.h]); }
        }

        // Also filter text that's inside a table region
        const finalText = [];
        if (tableData) {
          for (const t of filtered) {
            let inTable = false;
            for (const tbl of tableData) {
              if (t.x>=tbl.x && t.y>=tbl.y && t.x+t.w<=tbl.x+tbl.w && t.y+t.h<=tbl.y+tbl.h) { inTable=true; break; }
            }
            if (!inTable) finalText.push(t);
          }
        } else {
          finalText.push(...filtered);
        }

        // ══ Screenshot SKELETON ══
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

        // ══ PPT slide ══
        const slide = pptx.addSlide();
        if (fs.existsSync(ssPath)) slide.addImage({ path:ssPath, x:0, y:0, w:PPT_W, h:PPT_H });

        // Native PPT tables
        if (tableData) {
          for (const tbl of tableData) {
            const rows = tbl.rows.map(row => row.map(cell => ({
              text: cell.text,
              options: {
                fontSize: Math.min(cell.fontSize*0.75, 14),
                bold: cell.bold,
                color: parseColor(cell.color, '120180'),
                align: mapAlign(cell.align),
                fontFace: 'Raleway',
                fill: { color: parseColor(cell.bgColor, 'FFFFFF') },
                margin: [4, 6, 4, 6],
              }
            })));
            slide.addTable(rows, {
              x: tbl.x*SX, y: tbl.y*SY,
              w: tbl.w*SX, h: tbl.h*SY,
              colW: tbl.w*SX / (tbl.rows[0]?.length || 1),
              rowH: tbl.h*SY / tbl.rows.length,
              border: { type: 'solid', pt: 0.5, color: 'DDDDDD' },
              autoPage: false,
            });
          }
        }

        // Overlay text for non-table content
        for (const t of finalText) {
          if (t.w<5||t.h<3) continue;
          slide.addText(t.text, {
            x: t.x*SX, y: t.y*SY,
            w: Math.max(t.w*SX*1.05,0.3), h: Math.max(t.h*SY*1.05,0.12),
            fontSize: Math.min(t.fontSize*0.75, 14),
            bold: t.bold,
            color: parseColor(t.color),
            fontFace: 'Raleway',
            align: mapAlign(t.textAlign),
            margin: 0, valign: 'top',
            paraSpaceAfter:0, paraSpaceBefore:0,
            wrap: true, autoFit: false,
          });
        }

        const nTables = tableData ? tableData.reduce((a,t)=>a+t.rows.reduce((r,rr)=>r+rr.length,0),0) : 0;
        console.log(`  ${num} ${slideLabel.padEnd(25)} -> ${finalText.length} textos, ${nTables} celdas nativas`);
      }
    } catch(err) { console.error(`  ${num} ${label}: ERROR ${err.message}`); }
  }

  await browser.close(); server.close();
  const outPath = path.join(DIR, 'INFORME_TELEVENTAS_NATIVO.pptx');
  await pptx.writeFile({ fileName:outPath });
  console.log(`\nPPT: ${outPath}\n${pptx.slides.length} slides`);
}

main().catch(console.error);
