import json, time, threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from functools import partial
from playwright.sync_api import sync_playwright

class H(SimpleHTTPRequestHandler):
    def log_message(self, *a): pass

server = HTTPServer(('localhost', 0), partial(H, directory=r'C:\01_Repositorios\13_Presentaciones\dash'))
port = server.server_address[1]
t = threading.Thread(target=server.serve_forever, daemon=True); t.start()
time.sleep(0.5)

with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True)
    ctx = browser.new_context(viewport={'width': 1280, 'height': 720})
    page = ctx.new_page()
    page.goto(f'http://localhost:{port}/televentas/index.html?slide=2', wait_until='networkidle', timeout=15000)
    time.sleep(1)

    page.evaluate('''() => {
        const s = document.getElementById('scaler');
        if (s) { s.style.position = 'relative'; s.style.transform = 'scale(1)'; s.style.top = '0'; s.style.left = '0'; }
        document.body.style.margin = '0'; document.body.style.overflow = 'hidden';
    }''')
    time.sleep(0.5)

    data = page.evaluate("""() => {
        const scaler = document.getElementById('scaler');
        const sRect = scaler.getBoundingClientRect();
        const results = [];
        const all = document.querySelectorAll('#scaler .slide.active *');
        let count = 0;
        for (const el of all) {
            if (count >= 30) break;
            const style = window.getComputedStyle(el);
            if (style.display === 'none') continue;
            let dt = '';
            for (const c of el.childNodes) {
                if (c.nodeType === 3) dt += c.textContent;
            }
            const text = dt.trim();
            if (!text || text.length < 2) continue;
            const r = el.getBoundingClientRect();
            results.push({
                tag: el.tagName,
                text: text.substring(0, 50),
                elLeft: Math.round(r.left * 100) / 100,
                elTop: Math.round(r.top * 100) / 100,
                scalerLeft: Math.round(sRect.left * 100) / 100,
                scalerTop: Math.round(sRect.top * 100) / 100,
                canvasX: Math.round((r.left - sRect.left) * 100) / 100,
                canvasY: Math.round((r.top - sRect.top) * 100) / 100,
                w: Math.round(r.width * 100) / 100,
                h: Math.round(r.height * 100) / 100,
                classes: (el.className || '').substring(0, 40)
            });
            count++;
        }
        return { scaler: { left: sRect.left, top: sRect.top, w: sRect.width, h: sRect.height }, elements: results };
    }()""")

    for el in data['elements'][:15]:
        print(f"  {el['tag']:8s} x={el['canvasX']:6.1f} y={el['canvasY']:6.1f}  w={el['w']:5.1f} h={el['h']:4.1f}  {el['text'][:50]}")
    print(f"\nScaler rect: {data['scaler']}")
    browser.close()
