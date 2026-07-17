#!/usr/bin/env node
/**
 * PptxGenJS v6-skeleton para los decks de canal (Tradicional y Retail).
 *
 * Misma técnica que generar_ppt_v6_skeleton.mjs de Televentas: screenshot
 * del esqueleto visual (texto oculto, iconos visibles) como fondo de cada
 * slide + todo el texto reinsertado como cajas de texto nativas editables.
 *
 * Vive en televentas/ para reutilizar sus node_modules (playwright, pptxgenjs).
 *
 * Uso:  node generar_ppt_v6_skeleton_canales.mjs [tradicional|retail]
 *       (sin argumento genera ambos)
 */
import { chromium } from 'playwright';
import PptxGenJS from 'pptxgenjs';
import http from 'http'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DASH_DIR = path.resolve(__dirname, '..');
const PPT_W=13.333,PPT_H=7.5,SX=PPT_W/1280,SY=PPT_H/720;

const DECKS = {
  tradicional: {
    dir: 'tradicional',
    out: 'INFORME_TRADICIONAL_SKELETON.pptx',
    slides: [[0,'Formacion'],[1,'Cobertura'],[2,'Ventas']],
  },
  retail: {
    dir: 'retail',
    out: 'INFORME_RETAIL_SKELETON.pptx',
    slides: [[0,'Formacion'],[1,'Cobertura'],[2,'Ventas']],
  },
};

function parseColor(s,fb='120180'){if(!s)return fb;const m=s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);if(m)return`${(+m[1]).toString(16).padStart(2,'0')}${(+m[2]).toString(16).padStart(2,'0')}${(+m[3]).toString(16).padStart(2,'0')}`;const m2=s.match(/#([0-9a-fA-F]{6})/);if(m2)return m2[1];return fb;}
function startServer(dir,port=0){return new Promise(r=>{const s=http.createServer((req,res)=>{const pn=req.url.split('?')[0];let fp=path.join(dir,pn);if(!path.extname(fp))fp=path.join(fp,'index.html');const types={'.html':'text/html;charset=utf-8','.css':'text/css','.js':'application/javascript','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};fs.readFile(fp,(e,d)=>{if(e){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':types[path.extname(fp)]||'application/octet-stream'});res.end(d);});});s.listen(port,()=>r(s));});}

async function buildDeck(page, port, deckKey){
  const deck = DECKS[deckKey];
  const OUT_DIR = path.join(DASH_DIR, deck.dir, 'ppt_slides');
  fs.mkdirSync(OUT_DIR,{recursive:true});
  const pptx=new PptxGenJS(); pptx.defineLayout({name:'CUSTOM',width:PPT_W,height:PPT_H}); pptx.layout='CUSTOM';
  console.log(`\n══ Deck: ${deckKey} ══`);

  for(const [num,label] of deck.slides){
    try{
      await page.goto(`http://localhost:${port}/${deck.dir}/index.html?slide=${num}`,{waitUntil:'load',timeout:30000});
      await page.waitForTimeout(900);
      await page.evaluate(()=>{
        const s=document.getElementById('scaler');if(s){s.style.position='relative';s.style.transform='scale(1)';s.style.top='0';s.style.left='0';}
        document.body.style.margin='0';document.body.style.overflow='hidden';
        ['prev-btn','next-btn','home-btn','nav'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
      });await page.waitForTimeout(100);

      // ══ Extract text: cells as blocks (td/th) + other elements ══
      const textData=await page.evaluate(()=>{
        const scaler=document.getElementById('scaler');if(!scaler)return[];
        const active=document.querySelector('#scaler .slide.active')||scaler;
        const results=[],seen=new Set();

        function vp(el){const r=el.getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height};}
        function mapAlign(a,st){if(st.display==='flex'&&st.justifyContent==='center')return'center';return a==='right'?'right':a==='center'?'center':'left';}
        const skipTags=new Set(['svg','path','rect','circle','line','polyline','polygon','use','defs','clipPath','mask']);

        // 1) Table cells
        active.querySelectorAll('td,th').forEach(cell=>{
          const text=cell.textContent.trim();
          if(!text||text.length<2) return;
          const p=vp(cell);if(p.w<3||p.h<3) return;
          const style=window.getComputedStyle(cell);
          const key=`${p.x.toFixed(0)},${p.y.toFixed(0)},${text}`;
          if(seen.has(key)) return;seen.add(key);
          const cellBold=style.fontWeight==='bold'||parseInt(style.fontWeight)>=600||cell.querySelector('strong')!==null;
          results.push({
            text, x:p.x, y:p.y, w:p.w, h:p.h,
            fontSize:parseFloat(style.fontSize)||10,
            bold:cellBold, color:style.color,
            textAlign:mapAlign(style.textAlign||'left',style),
            padL:parseFloat(style.paddingLeft)||0,
            padR:parseFloat(style.paddingRight)||0,
            padT:parseFloat(style.paddingTop)||0,
            padB:parseFloat(style.paddingBottom)||0,
            isCell:true,
          });
        });

        // 2) Regular text
        active.querySelectorAll('*').forEach(el=>{
          if(skipTags.has(el.tagName)) return;
          if(el.closest('.lucide-ico')||el.classList.contains('lucide-ico')||el.classList.contains('ico')) return;
          if(el.closest('td,th')) return;

          const style=window.getComputedStyle(el);
          if(style.display==='none'||style.visibility==='hidden') return;

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
          if(!text||text.length<2) return;

          const p=vp(el);if(p.w<3||p.h<3) return;

          const key=`${p.x.toFixed(0)},${p.y.toFixed(0)},${text}`;
          if(seen.has(key)) return;seen.add(key);

          results.push({
            text,x:p.x,y:p.y,w:p.w,h:p.h,
            fontSize:parseFloat(style.fontSize)||10,
            bold:style.fontWeight==='bold'||parseInt(style.fontWeight)>=600,
            color:style.color,
            textAlign:mapAlign(style.textAlign||'left',style),
            padL:parseFloat(style.paddingLeft)||0,
            padR:parseFloat(style.paddingRight)||0,
            padT:parseFloat(style.paddingTop)||0,
            padB:parseFloat(style.paddingBottom)||0,
            isCell:false,
          });
        });
        return results;
      });

      // Dedup
      textData.sort((a,b)=>b.text.length-a.text.length);
      const filtered=[],regions=[];
      for(const t of textData){
        let c=false;
        for(const [ux,uy,uw,uh] of regions){if(t.x>=ux-1&&t.y>=uy-1&&t.x+t.w<=ux+uw+1&&t.y+t.h<=uy+uh+1){c=true;break;}}
        if(!c){filtered.push(t);regions.push([t.x,t.y,t.w,t.h]);}
      }

      // ══ Screenshot SKELETON (text hidden, icons visible) ══
      await page.evaluate(()=>{
        window._c=[];
        document.querySelectorAll('svg,.lucide-ico').forEach(el=>window._c.push({el,color:getComputedStyle(el).color}));
        document.querySelectorAll('*').forEach(el=>{
          if(!el.closest('svg')&&!el.classList.contains('lucide-ico')) el.style.setProperty('color','transparent','important');
        });
        window._c.forEach(({el,color})=>el.style.setProperty('color',color,'important'));
      });
      await page.waitForTimeout(100);
      const ssPath=path.join(OUT_DIR,`sk_${String(num).padStart(2,'0')}_${label}.png`);
      await page.screenshot({path:ssPath});
      await page.evaluate(()=>{document.querySelectorAll('*').forEach(el=>el.style.removeProperty('color'));});

      // ══ PPT ══
      const slide=pptx.addSlide();
      if(fs.existsSync(ssPath)) slide.addImage({path:ssPath,x:0,y:0,w:PPT_W,h:PPT_H});

      for(const t of filtered){
        if(t.w<5||t.h<3) continue;
        const margin=[t.padT*0.75,t.padR*0.75,t.padB*0.75,t.padL*0.75];
        const yAdj=t.isCell?Math.max(t.y*SY-0.0156,0):t.y*SY;
        slide.addText(t.text,{
          x:t.x*SX,y:yAdj,
          w:Math.max(t.w*SX*1.03,0.3),h:t.isCell?t.h*SY:Math.max(t.h*SY*1.03,0.14),
          fontSize:Math.min(t.fontSize*0.75,48),
          bold:t.bold,color:parseColor(t.color),fontFace:'Raleway',
          align:t.textAlign,
          margin:margin,valign:t.isCell?'middle':'top',
          wrap:true,
          paraSpaceAfter:0,paraSpaceBefore:0,
        });
      }
      console.log(`  ${num} ${label.padEnd(15)} -> ${filtered.length} textos`);
    }catch(err){console.error(`  ${num} ${label}: ERROR ${err.message}`);}
  }

  const outPath=path.join(DASH_DIR, deck.dir, deck.out);
  await pptx.writeFile({fileName:outPath});
  console.log(`  PPT: ${outPath} (${pptx.slides.length} slides)`);
}

async function main(){
  const arg=(process.argv[2]||'').toLowerCase();
  const keys=arg&&DECKS[arg]?[arg]:Object.keys(DECKS);

  const server=await startServer(DASH_DIR); const port=server.address().port;
  console.log(`Server: http://localhost:${port}`);
  const browser=await chromium.launch({headless:true});
  const ctx=await browser.newContext({viewport:{width:1280,height:720},deviceScaleFactor:2});
  const page=await ctx.newPage();

  for(const k of keys) await buildDeck(page, port, k);

  await browser.close();server.close();
}
main().catch(console.error);
