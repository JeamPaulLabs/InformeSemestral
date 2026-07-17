import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DASH_DIR = path.resolve(__dirname, '..');

const server = await new Promise(resolve => {
  const MIME = { '.html':'text/html', '.css':'text/css', '.js':'application/javascript', '.json':'application/json', '.png':'image/png', '.svg':'image/svg+xml' };
  const s = http.createServer((req, res) => {
    const fp = path.join(DASH_DIR, req.url.split('?')[0] === '/' ? '/televentas/index.html' : req.url.split('?')[0]);
    fs.readFile(fp, (err, data) => {
      if (err) { res.writeHead(404); return res.end('Not found'); }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(fp)] || 'text/plain' });
      res.end(data);
    });
  });
  s.listen(0, () => resolve(s));
});
const port = server.address().port;

const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();

await page.goto(`http://localhost:${port}/televentas/index.html?slide=2`, { waitUntil: 'networkidle' });
await page.waitForTimeout(800);

// Hide nav
await page.evaluate(() => {
  ['next-btn','prev-btn','home-btn','nav','counter','progress'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.setProperty('display', 'none', 'important');
  });
  document.querySelectorAll('.progress-bar').forEach(el => el.style.setProperty('display', 'none', 'important'));
});

// Diagnose: where is the scaler?
const info = await page.evaluate(() => {
  const s = document.getElementById('scaler');
  const sr = s?.getBoundingClientRect();
  const appEl = document.getElementById('app');
  const appR = appEl?.getBoundingClientRect();
  return {
    scalerRect: sr ? { left: sr.left, top: sr.top, width: sr.width, height: sr.height } : null,
    appRect: appR ? { left: appR.left, top: appR.top, width: appR.width, height: appR.height } : null,
    scalerTransform: s ? window.getComputedStyle(s).transform : null,
    scalerPosition: s ? window.getComputedStyle(s).position : null,
  };
});
console.log(JSON.stringify(info, null, 2));

// Also check first few text elements in viewport coords vs canvas coords
const coords = await page.evaluate(() => {
  const s = document.getElementById('scaler');
  const sr = s.getBoundingClientRect();
  const active = document.querySelector('#scaler .slide.active') || s;
  const items = [];
  active.querySelectorAll('*').forEach(el => {
    if (el.closest('svg')) return;
    let dt = '';
    for (const c of el.childNodes) if (c.nodeType === 3) dt += c.textContent;
    dt = dt.trim();
    if (!dt || dt.length < 2) return;
    const r = el.getBoundingClientRect();
    if (r.width < 5 || r.height < 3) return;
    items.push({
      text: dt.substring(0, 30),
      // Raw viewport coords
      vpLeft: r.left, vpTop: r.top,
      // Relative to scaler
      relLeft: r.left - sr.left, relTop: r.top - sr.top,
    });
  });
  return items.slice(0, 10);
});
console.log('\nFirst 10 text elements:');
coords.forEach(c => console.log(`  "${c.text}" | vp:(${c.vpLeft.toFixed(0)},${c.vpTop.toFixed(0)}) | rel:(${c.relLeft.toFixed(0)},${c.relTop.toFixed(0)})`));

await browser.close();
server.close();
