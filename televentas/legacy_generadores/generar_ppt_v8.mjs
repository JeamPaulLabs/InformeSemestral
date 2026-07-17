#!/usr/bin/env node
/**
 * PptxGenJS v8: Hybrid. Tables use mathematical positioning (table box + cell index).
 * Non-table text uses viewport coords + padding margin.
 */
import { chromium } from 'playwright';
import PptxGenJS from 'pptxgenjs';
import http from 'http'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = __dirname, DASH_DIR = path.resolve(DIR,'..'), OUT_DIR = path.join(DIR,'ppt_slides');
fs.mkdirSync(OUT_DIR,{recursive:true});
const PPT_W=13.333,PPT_H=7.5,SX=PPT_W/1280,SY=PPT_H/720;

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

function parseColor(s,fb='120180'){
  if(!s)return fb;const m=s.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  return m?`${(+m[1]).toString(16).padStart(2,'0')}${(+m[2]).toString(16).padStart(2,'0')}${(+m[3]).toString(16).padStart(2,'0')}`:fb;
}
function mapAlign(a){return a==='right'?'right':a==='center'?'center':'left';}
function startServer(dir,port=0){return new Promise(r=>{const s=http.createServer((req,res)=>{const pn=req.url.split('?')[0];let fp=path.join(dir,pn==='/'?'/televentas/index.html':pn);if(!path.extname(fp))fp=path.join(fp,'index.html');const types={'.html':'text/html;charset=utf-8','.css':'text/css','.js':'application/javascript','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};fs.readFile(fp,(e,d)=>{if(e){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':types[path.extname(fp)]||'application/octet-stream'});res.end(d);});});s.listen(port,()=>r(s));});}

async function main(){
  const server=await startServer(DASH_DIR); const port=server.address().port;
  console.log(`Server: http://localhost:${port}`);
  const pptx=new PptxGenJS(); pptx.defineLayout({name:'CUSTOM',width:PPT_W,height:PPT_H}); pptx.layout='CUSTOM';
  const browser=await chromium.launch({headless:true});
  const ctx=await browser.newContext({viewport:{width:1280,height:720}});
  const page=await ctx.newPage();

  for(const [num,label,tabs] of SLIDES){
    try{
      await page.goto(`http://localhost:${port}/televentas/index.html?slide=${num}`,{waitUntil:'networkidle',timeout:15000});
      await page.waitForTimeout(900);
      await page.evaluate(()=>{
        const s=document.getElementById('scaler');if(s){s.style.position='relative';s.style.transform='scale(1)';s.style.top='0';s.style.left='0';}
        document.body.style.margin='0';document.body.style.overflow='hidden';
        ['prev-btn','next-btn','home-btn','nav'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
      });await page.waitForTimeout(100);

      const variants=tabs||[null];
      for(const variant of variants){
        const slideLabel=label+(variant?' '+variant[0]:'');
        if(variant){await page.evaluate(variant[1]);await page.waitForTimeout(300);}

        // ══ Extract tables (mathematical) + non-table text (viewport) ══
        const extract=await page.evaluate(()=>{
          const scaler=document.getElementById('scaler');if(!scaler)return null;
          const sRect=scaler.getBoundingClientRect();
          const active=document.querySelector('#scaler .slide.active')||scaler;

          function vp(el){const r=el.getBoundingClientRect();return{x:r.left,y:r.top,w:r.width,h:r.height};}
          function visible(el){const s=window.getComputedStyle(el);return s.display!=='none'&&s.visibility!=='hidden';}

          // ── Tables: extract structure + calculate cell positions mathematically ──
          const tables=[];
          active.querySelectorAll('table').forEach(tbl=>{
            if(!visible(tbl))return;
            const tvp=vp(tbl);
            if(tvp.w<5||tvp.h<5)return;

            const rows=[];
            let maxCols=0;

            tbl.querySelectorAll('tr').forEach(tr=>{
              if(!visible(tr))return;
              const cells=[];
              tr.querySelectorAll('th,td').forEach(cell=>{
                if(!visible(cell))return;
                const style=window.getComputedStyle(cell);
                const cp=vp(cell);
                cells.push({
                  text: cell.textContent.trim().replace(/\s+/g,' '),
                  align: style.textAlign||'left',
                  bold: style.fontWeight==='bold'||parseInt(style.fontWeight)>=600,
                  color: style.color,
                  fontSize: parseFloat(style.fontSize)||10,
                  bg: style.backgroundColor,
                  colspan: cell.colSpan||1,
                  padL: parseFloat(style.paddingLeft)||0,
                  padR: parseFloat(style.paddingRight)||0,
                  padT: parseFloat(style.paddingTop)||0,
                  padB: parseFloat(style.paddingBottom)||0,
                });
              });
              if(cells.length>maxCols)maxCols=cells.length;
              if(cells.length) rows.push(cells);
            });

            if(rows.length&&maxCols){
              // Calculate cell dimensions mathematically
              const colW=tvp.w/maxCols;
              const rowH=tvp.h/rows.length;
              tables.push({
                x:tvp.x,y:tvp.y,w:tvp.w,h:tvp.h,
                rows, numCols:maxCols,
                colW, rowH,
              });
            }
          });

          // ── Non-table text (viewport coords + padding) ──
          const texts=[],seen=new Set();
          const skipTags=new Set(['svg','path','rect','circle','line','polyline','polygon','use','defs','clipPath','mask','table','thead','tbody','tfoot','tr','td','th','col','colgroup']);

          const iconRects=[];
          active.querySelectorAll('svg,.lucide-ico,.ico').forEach(ico=>{
            const r=ico.getBoundingClientRect();if(r.width>0&&r.height>0)iconRects.push({x:r.left,y:r.top,w:r.width,h:r.height});
          });
          function ovlIco(x,y,w,h,m=4){for(const ir of iconRects){if(x+w+m>ir.x&&x<ir.x+ir.w+m&&y+h+m>ir.y&&y<ir.y+ir.h+m)return true;}return false;}

          active.querySelectorAll('*').forEach(el=>{
            if(skipTags.has(el.tagName))return;
            if(el.closest('.lucide-ico')||el.classList.contains('lucide-ico')||el.classList.contains('ico'))return;
            if(!visible(el))return;
            if(el.closest('table'))return;

            let dt='';for(const c of el.childNodes){if(c.nodeType===3)dt+=c.textContent;}
            const text=dt.trim();
            if(!text||text.length<2)return;

            const p=vp(el);if(p.w<3||p.h<3)return;
            if(ovlIco(p.x,p.y,p.w,p.h))return;
            const key=`${p.x.toFixed(0)},${p.y.toFixed(0)},${text}`;
            if(seen.has(key))return;seen.add(key);

            const style=window.getComputedStyle(el);
            texts.push({
              text,x:p.x,y:p.y,w:p.w,h:p.h,
              fontSize:parseFloat(style.fontSize)||10,
              bold:style.fontWeight==='bold'||parseInt(style.fontWeight)>=600,
              color:style.color,textAlign:style.textAlign||'left',
              padL:parseFloat(style.paddingLeft)||0,
              padR:parseFloat(style.paddingRight)||0,
              padT:parseFloat(style.paddingTop)||0,
              padB:parseFloat(style.paddingBottom)||0,
            });
          });
          return {tables,texts};
        });

        if(!extract)continue;
        const {tables,texts}=extract;

        // Dedup texts
        texts.sort((a,b)=>b.text.length-a.text.length);
        const fTexts=[],regs=[];
        for(const t of texts){
          let c=false;
          for(const [ux,uy,uw,uh] of regs){if(t.x>=ux-1&&t.y>=uy-1&&t.x+t.w<=ux+uw+1&&t.y+t.h<=uy+uh+1){c=true;break;}}
          if(!c){fTexts.push(t);regs.push([t.x,t.y,t.w,t.h]);}
        }

        // ══ Screenshot HYBRID (text visible) ══
        const ssPath=path.join(OUT_DIR,`sk_${String(num).padStart(2,'0')}_${variant?variant[0]:'main'}.png`);
        await page.screenshot({path:ssPath});

        // ══ PPT slide ══
        const slide=pptx.addSlide();
        if(fs.existsSync(ssPath)) slide.addImage({path:ssPath,x:0,y:0,w:PPT_W,h:PPT_H});

        // Native transparent tables (mathematical position)
        for(const tbl of tables){
          const pptRows=tbl.rows.map(row=>row.map(cell=>({
            text:cell.text,
            options:{
              fontSize:Math.min(cell.fontSize*0.75,12),
              bold:cell.bold,
              color:parseColor(cell.color),
              align:mapAlign(cell.align),
              fontFace:'Raleway',
              fill:{color:'FFFFFF',transparency:100}, // fully transparent
              margin:[cell.padT*0.75,cell.padR*0.75,cell.padB*0.75,cell.padL*0.75],
              border:false,
            }
          })));

          slide.addTable(pptRows,{
            x:tbl.x*SX,y:tbl.y*SY,
            w:tbl.w*SX,h:tbl.h*SY,
            colW:tbl.colW*SX,
            rowH:tbl.rowH*SY,
            border:{type:'solid',pt:0,color:'FFFFFF',transparency:100},
            autoPage:false,
            margin:0,
          });
        }

        // Non-table text overlays (viewport + padding)
        for(const t of fTexts){
          if(t.w<5||t.h<3)continue;
          const margin=[t.padT*0.75,t.padR*0.75,t.padB*0.75,t.padL*0.75];
          slide.addText(t.text,{
            x:t.x*SX,y:t.y*SY,
            w:Math.max(t.w*SX*1.03,0.3),h:Math.max(t.h*SY*1.03,0.14),
            fontSize:Math.min(t.fontSize*0.75,14),
            bold:t.bold,color:parseColor(t.color),fontFace:'Raleway',
            align:mapAlign(t.textAlign),
            margin,valign:'top',wrap:true,
            paraSpaceAfter:0,paraSpaceBefore:0,
          });
        }
        console.log(`  ${num} ${slideLabel.padEnd(25)} -> ${fTexts.length} textos, ${tables.length} tablas nativas`);
      }
    }catch(err){console.error(`  ${num} ${label}: ERROR ${err.message}`);}
  }
  await browser.close();server.close();
  const outPath=path.join(DIR,'INFORME_TELEVENTAS_MATEMATICO.pptx');
  await pptx.writeFile({fileName:outPath});
  console.log(`\nPPT: ${outPath}\n${pptx.slides.length} slides`);
}
main().catch(console.error);
