#!/usr/bin/env node
/**
 * Diagnóstico de desfases: compara posiciones PPT vs navegador
 * Genera reporte_desfases.md
 */
import { chromium } from 'playwright';
import http from 'http'; import fs from 'fs'; import path from 'path';
import { fileURLToPath } from 'url';
import JSZip from 'jszip';
import { XMLParser } from 'fast-xml-parser';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIR = __dirname, DASH_DIR = path.resolve(DIR,'..');
const PPT_PATH = path.join(DIR,'INFORME_TELEVENTAS_HIBRIDO_V2.pptx');
const REPORT_PATH = path.join(DIR,'reporte_desfases.md');
const PPT_W=13.333, PPT_H=7.5;
const SX=PPT_W/1280, SY=PPT_H/720;
const EMU_PER_IN=914400;

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

function startServer(dir,port=0){return new Promise(r=>{const s=http.createServer((req,res)=>{const pn=req.url.split('?')[0];let fp=path.join(dir,pn==='/'?'/televentas/index.html':pn);if(!path.extname(fp))fp=path.join(fp,'index.html');const types={'.html':'text/html;charset=utf-8','.css':'text/css','.js':'application/javascript','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};fs.readFile(fp,(e,d)=>{if(e){res.writeHead(404);return res.end('Not found');}res.writeHead(200,{'Content-Type':types[path.extname(fp)]||'application/octet-stream'});res.end(d);});});s.listen(port,()=>r(s));});}

/* ── Leer PPTX ── */
async function readPPTX(filePath){
  const data=fs.readFileSync(filePath);
  const zip=await JSZip.loadAsync(data);
  const parser=new XMLParser({ignoreAttributes:false,attributeNamePrefix:'@_',textNodeName:'#text'});

  const slides=[];
  for(let i=0;;i++){
    const fn=`ppt/slides/slide${i+1}.xml`;
    if(!zip.files[fn]) break;
    const xml=await zip.file(fn).async('string');
    const json=parser.parse(xml);
    const texts=[];

    // Walk shapes
    const sld=json['p:sld'];
    if(!sld) continue;
    const cSld=sld['p:cSld'];
    if(!cSld) continue;
    const spTree=cSld['p:spTree'];
    if(!spTree) continue;

    const allSps=[];
    if(spTree['p:sp']) allSps.push(...(Array.isArray(spTree['p:sp'])?spTree['p:sp']:[spTree['p:sp']]));

    for(const sp of allSps){
      const txBody=sp['p:txBody'];
      if(!txBody) continue;

      // Skip non-text shapes
      const nv=sp['p:nvSpPr']; if(nv&&nv['p:cNvSp']&&nv['p:cNvSp']['@_txBox']==='0') continue;

      const xfrm=sp['p:spPr']?.['a:xfrm']||sp['p:xfrm'];
      if(!xfrm) continue;
      const off=xfrm['a:off'], ext=xfrm['a:ext'];
      if(!off||!ext) continue;
      const x=(parseInt(off['@_x']||'0')||0)/EMU_PER_IN;
      const y=(parseInt(off['@_y']||'0')||0)/EMU_PER_IN;
      const w=(parseInt(ext['@_cx']||'0')||0)/EMU_PER_IN;
      const h=(parseInt(ext['@_cy']||'0')||0)/EMU_PER_IN;

      const pList=txBody['a:p']||[];
      const pars=Array.isArray(pList)?pList:[pList];
      let fullText='';
      let fontSize=0, bold=false;
      for(const p of pars){
        const rList=p['a:r']||[];
        const rs=Array.isArray(rList)?rList:[rList];
        for(const r of rs){
          if(r['a:t']!==undefined&&r['a:t']!==null) fullText+=r['a:t'];
          if(!fontSize&&r['a:rPr']?.['@_sz']){const sz=parseInt(r['a:rPr']['@_sz']);if(sz&&sz>0)fontSize=sz/100;}
          if(!bold&&r['a:rPr']?.['@_b']==='1') bold=true;
        }
      }
      const text=fullText.trim();
      if(text.length>=2){
        texts.push({text,x,y,w,h,fontSize:fontSize||10,bold,source:'shape'});
      }
    }
    slides.push(texts);
  }
  return slides;
}

/* ── Extraer textos del navegador (PPTs coords ya convertidas) ── */
async function extractBrowserTexts(page,slideNum,variant){
  await page.goto(`http://localhost:${port}/televentas/index.html?slide=${slideNum}`,{waitUntil:'networkidle',timeout:15000});
  await page.waitForTimeout(900);
  await page.evaluate(()=>{
    const s=document.getElementById('scaler');
    if(s){
      s.style.position='fixed';
      s.style.top='0'; s.style.left='0';
      s.style.transform='scale(1)';
      s.style.margin='0';
    }
    document.body.style.margin='0';document.body.style.overflow='hidden';
    ['prev-btn','next-btn','home-btn','nav'].forEach(id=>{const el=document.getElementById(id);if(el)el.style.display='none';});
  });await page.waitForTimeout(100);
  if(variant) await page.evaluate(variant[1]);
  await page.waitForTimeout(300);

  // Get scaler offset to convert viewport→slide coords
  const offset=await page.evaluate(()=>{
    const s=document.getElementById('scaler');
    if(!s) return {ox:0,oy:0};
    const r=s.getBoundingClientRect();
    return {ox:r.left,oy:r.top};
  });

  const results=await page.evaluate(({ox,oy})=>{
    const SX=13.333/1280, SY=7.5/720;
    function vp(el){const r=el.getBoundingClientRect();return{x:(r.left-ox)*SX,y:(r.top-oy)*SY,w:r.width*SX,h:r.height*SY};}
    const scaler=document.getElementById('scaler');if(!scaler)return[];
    const active=document.querySelector('#scaler .slide.active')||scaler;
    const results=[],seen=new Set();
    function mapAlign(a,st){if(st.display==='flex'&&st.justifyContent==='center')return'center';return a==='right'?'right':a==='center'?'center':'left';}
    const skipTags=new Set(['svg','path','rect','circle','line','polyline','polygon','use','defs','clipPath','mask']);

    // Table cells as blocks
    active.querySelectorAll('td,th').forEach(cell=>{
      const text=cell.textContent.trim();
      if(!text||text.length<2) return;
      const p=vp(cell);if(p.w<0.01||p.h<0.01) return;
      const style=window.getComputedStyle(cell);
      const cellBold=style.fontWeight==='bold'||parseInt(style.fontWeight)>=600||cell.querySelector('strong')!==null;
      const key=text.substring(0,40);
      if(seen.has(key)) return; seen.add(key);
      results.push({
        text:cell.textContent.trim(), x:p.x, y:p.y, w:p.w, h:p.h,
        fontSize:parseFloat(style.fontSize)||10, bold:cellBold,
        padL:parseFloat(style.paddingLeft)||0, padR:parseFloat(style.paddingRight)||0,
        padT:parseFloat(style.paddingTop)||0, padB:parseFloat(style.paddingBottom)||0,
        isCell:true,
      });
    });

    // Regular text elements
    active.querySelectorAll('*').forEach(el=>{
      if(skipTags.has(el.tagName)) return;
      if(el.closest('.lucide-ico')||el.classList.contains('lucide-ico')||el.classList.contains('ico')) return;
      if(el.closest('td,th')) return;
      const style=window.getComputedStyle(el);
      if(style.display==='none'||style.visibility==='hidden') return;
      let dt='';
      for(const c of el.childNodes){if(c.nodeType===3)dt+=c.textContent;}
      const text=dt.trim();
      if(!text||text.length<2) return;
      const p=vp(el);if(p.w<0.01||p.h<0.01) return;
      const key=text.substring(0,40);
      if(seen.has(key)) return; seen.add(key);
      results.push({
        text, x:p.x, y:p.y, w:p.w, h:p.h,
        fontSize:parseFloat(style.fontSize)||10,
        bold:style.fontWeight==='bold'||parseInt(style.fontWeight)>=600,
        padL:0,padR:0,padT:0,padB:0,
        isCell:false,
      });
    });
    return results;
  },{ox:offset.ox,oy:offset.oy});

  return results;
}

/* ── Comparar textos usando solo contenido (sin posición) ── */
function compareTexts(pptTexts,browserTexts,slideLabel){
  const issues=[];
  const usedBrowser=new Set();

  for(const pt of pptTexts){
    const pc=pt.text.replace(/\s+/g,' ').trim();

    // Find browser text with exact content match
    let best=null, bestIdx=-1;
    for(let i=0;i<browserTexts.length;i++){
      if(usedBrowser.has(i)) continue;
      const bt=browserTexts[i];
      const bc=bt.text.replace(/\s+/g,' ').trim();
      if(pc===bc){
        best=bt; bestIdx=i; break;
      }
    }
    // Fallback: partial match if no exact match
    if(!best){
      for(let i=0;i<browserTexts.length;i++){
        if(usedBrowser.has(i)) continue;
        const bt=browserTexts[i];
        const bc=bt.text.replace(/\s+/g,' ').trim();
        if(pc.includes(bc)||bc.includes(pc)){
          best=bt; bestIdx=i; break;
        }
      }
    }
      if(best&&bestIdx>=0){
        usedBrowser.add(bestIdx);
        // Known PPT generator adjustments
        const cellYAdj=best.isCell?-0.0156:0; // cells shifted up 1.5px for Raleway metrics
        // Compare: PPT inches vs browser inches (accounting for known adjustments)
        const pt_fs=pt.fontSize;
        const bt_fs=Math.round(best.fontSize*0.75*10)/10;
        const dx=Math.round((pt.x-best.x)*1000)/1000;
        const dy=Math.round((pt.y-(best.y+cellYAdj))*1000)/1000;
        const dw=Math.round((pt.w-best.w)*1000)/1000;
        const dh=Math.round((pt.h-best.h)*1000)/1000;
        const dFont=Math.round(pt_fs-bt_fs);
        const isBad=Math.abs(dx)>0.01||Math.abs(dy)>0.01||Math.abs(dFont)>1.5;
        // Recompute with raw browser.y for the report
        const dyRaw=Math.round((pt.y-best.y)*1000)/1000;
      issues.push({
        text:pt.text.substring(0,60),
        ppt:{x:pt.x,y:pt.y,w:pt.w,h:pt.h,fs:pt_fs},
        browser:{x:best.x,y:best.y,w:best.w,h:best.h,fs:bt_fs},
        dx,dy:dyRaw,dw,dh,dFont,isCell:best.isCell,mismatch:isBad,
      });
    }else{
      issues.push({
        text:pt.text.substring(0,60),
        ppt:{x:pt.x,y:pt.y,w:pt.w,h:pt.h,fs:pt.fontSize},
        browser:null,dx:null,dy:null,isCell:false,mismatch:true,note:'Sin match en navegador'
      });
    }
  }
  return issues;
}

/* ── Generar reporte ── */
function generateReport(allIssues){
  let md='# Reporte de Desfases — INFORME_TELEVENTAS_HIBRIDO_V2.pptx\n\n';
  md+=`Generado: ${new Date().toISOString()}\n\n`;
  md+='## Resumen\n\n';

  let totalMatch=0,totalMismatch=0,totalNoMatch=0;
  const cellDYs=[];
  for(const [label,issues] of allIssues){
    for(const i of issues){
      if(i.note) totalNoMatch++;
      else if(i.mismatch){totalMismatch++;if(i.isCell&&i.dy!==null)cellDYs.push(i.dy);}
      else totalMatch++;
    }
  }
  md+=`| Estado | Cantidad |\n|--------|----------|\n`;
  md+=`| Correctos | ${totalMatch} |\n`;
  md+=`| Con desfase | ${totalMismatch} |\n`;
  md+=`| Sin match en navegador | ${totalNoMatch} |\n`;
  md+=`| **Total textos PPT** | **${totalMatch+totalMismatch+totalNoMatch}** |\n\n`;

  if(cellDYs.length){
    const avgDY=cellDYs.reduce((a,b)=>a+b,0)/cellDYs.length;
    md+=`### Desplazamiento vertical en celdas\n\n`;
    md+=`- Promedio dy: **${avgDY.toFixed(3)}"** (${(avgDY/SY).toFixed(1)} CSS px)\n`;
    md+=`- Celdas con desfase >0.02": ${cellDYs.filter(d=>Math.abs(d)>0.02).length}/${cellDYs.length}\n`;
    const neg=cellDYs.filter(d=>d<0); const pos=cellDYs.filter(d=>d>0);
    if(neg.length>pos.length*2) md+=`- **Dirección**: las celdas están más ARRIBA en PPT que en el navegador (dy negativo)\n`;
    else if(pos.length>neg.length*2) md+=`- **Dirección**: las celdas están más ABAJO en PPT que en el navegador (dy positivo)\n`;
    md+='\n';
  }

  md+='---\n\n';

  for(const [label,issues] of allIssues){
    const mismatches=issues.filter(i=>i.mismatch);
    if(mismatches.length===0&&issues.length<=5){
      continue;
    }
    const okCount=issues.filter(i=>!i.mismatch).length;
    md+=`## ${label} — ${mismatches.length}/${issues.length} con desfase (${okCount} correctos)\n\n`;
    if(mismatches.length>0&&mismatches.length<30){
      md+='| Texto | PPT x,y | PPT fs | Nav x,y | Nav fs | dx" | dy" | dw" | dh" | dFont(pt) | Tipo |\n';
      md+='|-------|---------|--------|---------|--------|-----|-----|-----|-----|-----------|------|\n';
      for(const i of mismatches){
        if(i.note){
          md+=`| ${i.text} | ${i.ppt.x.toFixed(3)},${i.ppt.y.toFixed(3)} | ${i.ppt.fs} | — | — | — | — | — | — | — | ❌ ${i.note} |\n`;
        }else{
          md+=`| ${i.text} | ${i.ppt.x.toFixed(3)},${i.ppt.y.toFixed(3)} | ${i.ppt.fs} | ${i.browser.x.toFixed(3)},${i.browser.y.toFixed(3)} | ${i.browser.fs} | ${i.dx>0?'+':''}${i.dx.toFixed(3)} | ${i.dy>0?'+':''}${i.dy.toFixed(3)} | ${i.dw>0?'+':''}${i.dw.toFixed(3)} | ${i.dh>0?'+':''}${i.dh.toFixed(3)} | ${i.dFont>0?'+':''}${i.dFont} | ${i.isCell?'celda':'texto'} |\n`;
        }
      }
    }else if(mismatches.length>=30){
      // Too many to list individually; show summary stats
      const cellM=issues.filter(i=>i.isCell&&!i.note);
      const textM=issues.filter(i=>!i.isCell&&!i.note);
      if(cellM.length){
        const dY=cellM.map(i=>i.dy);
        const avgDY=dY.reduce((a,b)=>a+b,0)/dY.length;
        const maxDY=Math.max(...dY.map(Math.abs));
        md+=`- **Celdas**: ${cellM.length}/${cellM.filter(i=>i.mismatch).length} con desfase, dy promedio=${avgDY.toFixed(3)}", max|dy|=${maxDY.toFixed(3)}"\n`;
      }
      if(textM.length){
        const tDY=textM.filter(i=>i.dy!==null).map(i=>i.dy);
        if(tDY.length){
          const avgTDY=tDY.reduce((a,b)=>a+b,0)/tDY.length;
          const maxTDY=Math.max(...tDY.map(Math.abs));
          md+=`- **Textos regulares**: ${textM.filter(i=>i.mismatch).length}/${textM.length} con desfase, dy promedio=${avgTDY.toFixed(3)}", max|dy|=${maxTDY.toFixed(3)}"\n`;
        }
      }
      const nomatch=issues.filter(i=>i.note).length;
      if(nomatch) md+=`- **Sin match**: ${nomatch} textos PPT sin correspondencia en navegador\n`;
    }
    md+='\n';
  }

  fs.writeFileSync(REPORT_PATH,md,'utf-8');
  console.log(`Reporte: ${REPORT_PATH}`);
}

/* ── Main ── */
let port;
const server=await startServer(DASH_DIR);
port=server.address().port;
console.log(`Server: http://localhost:${port}`);

console.log('Leyendo PPTX...');
const pptSlides=await readPPTX(PPT_PATH);
console.log(`  ${pptSlides.length} slides en PPTX`);

const browser=await chromium.launch({headless:true});
const ctx=await browser.newContext({viewport:{width:1280,height:720}});
const page=await ctx.newPage();

const allIssues=[];

let pptxIdx=0;
for(const [num,label,tabs] of SLIDES){
  const variants=tabs||[null];
  for(const variant of variants){
    const slideLabel=label+(variant?' '+variant[0]:'');
    const pptSlide=pptSlides[pptxIdx];
    if(!pptSlide){
      console.log(`  ${num} ${slideLabel}: sin datos PPTX (idx ${pptxIdx})`);
      pptxIdx++; continue;
    }
    try{
      const browserTexts=await extractBrowserTexts(page,num,variant);
      const issues=compareTexts(pptSlide,browserTexts,slideLabel);
      allIssues.push([slideLabel,issues]);
      const mism=issues.filter(i=>i.mismatch).length;
      const nom=issues.filter(i=>i.note).length;
      console.log(`  ${num} ${slideLabel.padEnd(25)}: pptx=${pptSlide.length} nav=${browserTexts.length} match=${issues.length} desf=${mism} no-match=${nom}`);
    }catch(err){
      console.error(`  ${num} ${slideLabel}: ERROR ${err.message}`);
    }
    pptxIdx++;
  }
}

await page.close();await browser.close();server.close();
generateReport(allIssues);
console.log('Diagnóstico completo.');
