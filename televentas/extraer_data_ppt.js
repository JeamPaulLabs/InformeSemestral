// Extrae toda la data de televentas a JSON
const fs = require('fs');
const vm = require('vm');

const DIR = __dirname;
// Cargar core/icons.js en el sandbox (define icon())
const iconsCode = fs.readFileSync(DIR + '/../core/icons.js', 'utf8');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(iconsCode.replace('const ICONS', 'var ICONS'), sandbox);

// Cargar data_televentas.js y convertir const a var en el scope global
const dataCode = fs.readFileSync(DIR + '/data_televentas.js', 'utf8');
const wrappedCode = dataCode.replace(/^(const|let)\s+(?=\w+\s*=)/gm, 'var ');
vm.runInContext(wrappedCode, sandbox);

// Extraer NAV_LABELS y datos inline de app.js
const appContent = fs.readFileSync(DIR + '/app.js', 'utf8');

// NAV_LABELS
const navMatch = appContent.match(/const\s+NAV_LABELS\s*=\s*(\[[\s\S]*?\]);/);
const NAV_LABELS = navMatch ? JSON.parse(navMatch[1].replace(/'/g, '"')) : [];

// Extraer datos inline de renderDetalle*
function extraerDetalle(nombreFn) {
  // Find the function
  const fnStart = appContent.indexOf(`function ${nombreFn}(`);
  if (fnStart === -1) return null;
  
  // Find 'const data = {' after the function start
  const dataConstPos = appContent.indexOf('const data = {', fnStart);
  if (dataConstPos === -1) return null;
  
  // Extract balanced braces from the data object
  let depth = 0;
  let started = false;
  let dataStart = dataConstPos + 'const data = '.length;
  let endPos = dataStart;
  
  for (let i = dataStart; i < appContent.length; i++) {
    const ch = appContent[i];
    if (ch === '{') { depth++; started = true; }
    else if (ch === '}') { depth--; }
    if (started && depth === 0) { endPos = i + 1; break; }
  }
  
  const dataStr = appContent.substring(dataStart, endPos);
  
  // Find the renderCampanaDeepDive call to get campanaId
  const callPos = appContent.indexOf('renderCampanaDeepDive(', endPos);
  if (callPos === -1) return { campanaId: null, data: null, error: 'No renderCampanaDeepDive call found' };
  
  const idMatch = appContent.substring(callPos).match(/\('(\w+)'/);
  const campanaId = idMatch ? idMatch[1] : null;
  
  try {
    const ctx = vm.createContext({});
    const data = vm.runInContext(`"use strict"; (${dataStr})`, ctx);
    return { campanaId, data };
  } catch(e) {
    console.error(`${nombreFn}: parse error:`, e.message);
    return { campanaId, data: null, error: e.message };
  }
}

const detalleFns = [
  'renderDetalleBienvenida', 'renderDetalleStock', 'renderDetalleVoluntarios',
  'renderDetalleSatisfechos', 'renderDetalleMicroseguro', 'renderDetalleCancelaciones'
];

// Also extract renderCampanaDeepDive inline data for capacitaciones, etc
// Extract CAPACITACIONES_1S inline data from app.js
let CAPACITACIONES_1S = sandbox.CAPACITACIONES_1S || [];
if (!CAPACITACIONES_1S.length) {
  const capMatch = appContent.match(/const\s+CAPACITACIONES_1S\s*=\s*(\[[\s\S]*?\]);/);
  if (capMatch) {
    try { CAPACITACIONES_1S = vm.runInContext(`"use strict"; (${capMatch[1]})`, vm.createContext({})); }
    catch(e) { console.error('CAPACITACIONES_1S parse error:', e.message); }
  }
}

const output = {
  NAV_LABELS,
  DATA: sandbox.DATA || null,
  ASESORES: sandbox.ASESORES || [],
  CAMPANAS: sandbox.CAMPANAS || [],
  ROSTER: sandbox.ROSTER || null,
  VANTI_INCENTIVOS: sandbox.VANTI_INCENTIVOS || [],
  INCENTIVOS_EXTRAS: sandbox.INCENTIVOS_EXTRAS || [],
  AUTOGESTION_MESES: sandbox.AUTOGESTION_MESES || [],
  AUTOGESTION_ASESORES: sandbox.AUTOGESTION_ASESORES || [],
  AUTOGESTION_DESCARTES: sandbox.AUTOGESTION_DESCARTES || [],
  DESCARTE_MOTIVOS: sandbox.DESCARTE_MOTIVOS || [],
  INICIATIVAS_1S: sandbox.INICIATIVAS_1S || [],
  ESTRATEGIA_INICIATIVAS: sandbox.ESTRATEGIA_INICIATIVAS || [],
  EVIDENCIAS: sandbox.EVIDENCIAS || [],
  ESQUEMA_MESES: sandbox.ESQUEMA_MESES || [],
  METAS_JUN: sandbox.METAS_JUN || [],
  CAPACITACIONES_1S,
  detalles: Object.fromEntries(detalleFns.map(fn => [fn, extraerDetalle(fn)]))
};

fs.writeFileSync(DIR + '/data_ppt.json', JSON.stringify(output, null, 2), 'utf8');
console.log('data_ppt.json generado');
fs.writeFileSync(DIR + '/data_ppt.min.json', JSON.stringify(output), 'utf8');
