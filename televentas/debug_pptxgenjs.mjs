#!/usr/bin/env node
import { chromium } from 'playwright';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DASH_DIR = path.resolve(__dirname, '..');

function startServer(dir, port = 0) {
  return new Promise((resolve) => {
    const s = http.createServer((req, res) => {
      let filePath = path.join(dir, req.url === '/' ? '/televentas/index.html' : req.url);
      if (!path.extname(filePath)) filePath = path.join(filePath, 'index.html');
      const ext = path.extname(filePath);
      const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'application/javascript', '.json': 'application/json', '.png': 'image/png' };
      fs.readFile(filePath, (err, data) => {
        if (err) { res.writeHead(404); return res.end('Not found'); }
        res.writeHead(200, { 'Content-Type': types[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    s.listen(port, () => resolve(s));
  });
}

const server = await startServer(DASH_DIR);
const port = server.address().port;
const browser = await chromium.launch({ headless: true });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await ctx.newPage();

await page.goto(`http://localhost:${port}/televentas/index.html?slide=0`, { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(1000);

// Check what's visible
const info = await page.evaluate(() => {
  const scaler = document.getElementById('scaler');
  if (!scaler) return { error: 'no scaler' };
  const sRect = scaler.getBoundingClientRect();
  const active = document.querySelector('#scaler .slide.active');
  const activeCount = document.querySelectorAll('#scaler .slide.active').length;
  const allSlides = document.querySelectorAll('#scaler .slide');
  const slideDisplays = Array.from(allSlides).map(s => [s.id, s.style.display, s.classList.contains('active')]);
  
  // Check specific elements
  const coverTitle = document.querySelector('.cover-title');
  const coverTag = document.querySelector('.cover-tag');
  const coverLogo = document.querySelector('.cover-logo');
  
  // Try finding any text node
  let texts = [];
  const walker = document.createTreeWalker(active || scaler, 4, null, Infinity);
  let node;
  while (node = walker.nextNode()) {
    const t = node.textContent.trim();
    if (t && t.length > 3) { texts.push(t.substring(0, 60)); if (texts.length >= 10) break; }
  }
  
  return {
    scalerRect: { left: sRect.left, top: sRect.top, width: sRect.width, height: sRect.height },
    activeSlide: active ? active.id : 'none',
    activeCount,
    slideDisplays: slideDisplays.slice(0, 5),
    coverTitle: coverTitle?.textContent?.trim() || 'not found',
    coverTag: coverTag?.textContent?.trim() || 'not found',
    texts,
  };
});

console.log(JSON.stringify(info, null, 2));

// Now try to call vtasTab
await page.goto(`http://localhost:${port}/televentas/index.html?slide=2`, { waitUntil: 'networkidle', timeout: 15000 });
await page.waitForTimeout(1000);

const tabCheck = await page.evaluate(() => {
  return {
    hasVtasTab: typeof vtasTab === 'function',
    hasVtasTabGlobal: typeof window.vtasTab === 'function',
    hasAppJs: !!document.querySelector('script[src*="app"]'),
    scripts: Array.from(document.scripts).map(s => s.src || s.textContent.substring(0, 80)).filter(Boolean),
  };
});
console.log(JSON.stringify(tabCheck, null, 2));

await browser.close();
server.close();
