// ============================================================
//  INFORME CANAL TELEVENTAS 2026 – data_televentas.js
//  Datos consolidados de: Manager_Performance_2026.md
//                         Liquidacion_Metas_2026.md
//                         Análisis_Data_Disponible.md
//  Última actualización: 2026-07-17 (base operativa 1S actualizada e
//  integrada en Power BI — tableros del 2026-07-16; liquidación de
//  junio ratificada como cifra oficial)
// ============================================================

const DATA = {
  meses: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
  registros:       [202777, 96493, 136044, 154848, 156200, 175118],
  rechazados:      [99241,  48185, 60998,  114123, 116691, 109130],
  aptos:           [103536, 48308, 75046,  40725,  39509,  65988],
  pctRechazo:      [48.94,  49.94, 44.84,  73.70,  74.71,  62.32],
  gestionados:     [103531, 47997, 71926,  40682,  39504,  61450],  // aptos efectivamente gestionados (Manager_Performance §2)
  contactados:     [22402,  21171, 32546,  24520,  25647,  28552],
  contactabilidad: [21.64,  44.11, 45.25,  60.27,  64.92,  46.46],
  efectividad:     [8.71,   10.85, 6.36,   5.68,   9.08,   7.83],
  ventasOp:        [1951,   2298,  2071,   1392,   2328,   2236],  // tablero operativo
  ventasLiq:       [2245,   2374,  2431,   2367,   2186,   2314],  // liquidación Martha (semestre completo)
  metaE1:          [2025,   2010,  2225,   2586,   2576,   2707],
  metaE2:          [2430,   2412,  2670,   3104,   3097,   1884],
  metaVanti:       [1695,   1391,  1568,   1818,   1452,   1520],  // metas por origen (= CP + VOL)
  metaXuma:        [2132,   2170,  2170,   3000,   2600,   2500],
  metaVantiCP:     [1197,   1197,  1197,   1197,   1231,   1231],  // meta Vanti por producto
  metaVantiVOL:    [498,    194,   371,    621,    221,    289],
  metaXumaCP:      [1703,   1670,  1670,   2500,   2100,   2000],  // meta Xuma por producto
  metaXumaVOL:     [429,    500,   500,    500,    500,    500],
  // Ventas reales por producto (Reporte Ilio, Televentas + ALTA TRANSACCIONAL,
  // pivot "Cuenta de asesor" — verificado: CP+VOL = ventasLiq exacto cada mes).
  ventasCP:        [1689,   1819,  1901,   1816,   1568,   1741],  // Cuota Protegida
  ventasVOL:       [556,    555,   530,    551,    618,    573],   // Plan Combo Vida
  cumplE1:         [110.9,  118.1, 109.3,  91.5,   84.9,   85.5],
  asesores:        [15,     17,    18,     20,      20,     21],
  promPolizas:     [149.7,  139.6, 135.1,  118.3,  109.3,  110.2],
};

/* ── EXTENSIÓN JUL-AGO 2026 (embudo = tablero operativo; ventas = liquidación OFICIAL) ──
   DATA de arriba es y sigue siendo la cifra OFICIAL de liquidación (Martha),
   Ene-Jun — no se toca. Este bloque aparte cubre jul-ago: registros/aptos/
   gestionados/contactados vienen del tablero operativo (Ilio, suma de las 5
   campañas recurrentes — ver context_Televentas/Reporte Ilio/capturas_campanas/),
   PERO "ventasLiq" ya es la cifra OFICIAL (LIQUIDACIÓN INCENTIVOS JULIO/
   AGOSTO 2026.xlsx, suma de pólizas de ASESORES) — llegó después y reemplazó
   al estimado operativo "ventasOp" (que se deja también, de referencia, pero
   ventasLiq es la que se usa en las slides, igual que ene-jun).
   Falta septiembre completo en este bloque: CP Stock y Masiva Voluntarios no
   tienen ese mes en la captura operativa (corte incompleto) — ver DATA_OP_SEP.
   recibidos de CP Stock y Masiva Voluntarios = aptos (su captura no trae
   un "recibidos" previo al filtro, a diferencia de Bienvenida/Autogestión/
   Microseguro) — por eso su "rechazados" aparece en 0, no es que no haya
   descarte real, es que el dashboard nuevo no lo desglosa para esas 2. */
const DATA_OP_JUL_AGO = {
  meses: ['Jul', 'Ago'],
  registros:       [54686, 58458],
  rechazados:      [12582, 21658],
  aptos:           [42104, 36800],
  pctRechazo:      [23.0,  37.1],
  gestionados:     [42592, 36493],
  contactados:     [18426, 24140],
  contactabilidad: [43.3,  66.2],
  efectividad:     [11.5,  6.5],
  ventasOp:        [2114,  1564],      // referencia: "venta exitosa" marcada en el tablero operativo (no oficial)
  ventasLiq:       [2775,  2131],      // OFICIAL: suma de pólizas de ASESORES en la liquidación de jul/ago
  asesores:        [23,    24],        // OFICIAL: asesores con pólizas liquidadas ese mes (de ASESORES)
  // Desglose por campaña (para "Desempeño por Campaña"): aptos entregados y ventas.
  porCampana: {
    'Bienvenidas CP':     { aptos: [7337, 6166],   ventas: [1100, 792] },
    'Autogestión':        { aptos: [1990, 2111],   ventas: [355,  224] },
    'CP Stock':           { aptos: [15362, 18068], ventas: [310,  357] },
    'Masiva Voluntarios': { aptos: [16011, 9366],  ventas: [98,   107] },
    'CP Clientes Satisf.*':  { aptos: [0, 0], ventas: [0, 0] },  // campaña de una sola vez (ene), sin más cortes
    'Volunt. Cancelaciones*':{ aptos: [0, 0], ventas: [0, 0] },  // ídem
    'Microseguro':         { aptos: [1404, 1089],  ventas: [251,  84] },
  }
};

/* ── EXTENSIÓN SEPTIEMBRE 2026 (embudo parcial, SOLO 3 de 5 campañas; ventas = OFICIAL) ──
   CP Stock y Masiva Voluntarios NO tienen septiembre en la captura operativa
   (corte incompleto) — no se inventa ese dato. El embudo (registros/aptos/
   gestionados/contactados) solo suma Bienvenidas CP + Autogestión +
   Microseguro, que sí tienen septiembre completo. Por eso septiembre en
   "Tipificación de aptos por mes" queda con una base más chica que un mes
   típico — no es que bajó la operación, es que faltan 2 de 5 campañas en
   la fuente. "ventasLiq" en cambio SÍ es la cifra OFICIAL completa del mes
   (LIQUIDACIÓN INCENTIVOS SEPTIEMBRE 2026.xlsx, todos los asesores, no solo
   los de estas 3 campañas) — no tiene el mismo problema de cobertura parcial
   que el resto de los campos de este bloque. */
const DATA_OP_SEP = {
  mes: 'Sep',
  parcial: true,  // true = no están todas las campañas en el embudo, usar nota aclaratoria
  registros: 16780, rechazados: 4257, aptos: 12523, pctRechazo: 25.4,
  gestionados: 12509, contactados: 9698, contactabilidad: 77.5, efectividad: 11.9,
  ventasOp: 1158,   // referencia: tablero operativo, solo 3 de 5 campañas
  ventasLiq: 2131,  // OFICIAL: suma de pólizas de ASESORES en la liquidación de septiembre (todas las campañas)
  asesores: 25,     // OFICIAL: asesores con pólizas liquidadas en septiembre
  porCampana: {
    'Bienvenidas CP': { aptos: 7979, ventas: 624 },
    'Autogestión':    { aptos: 2938, ventas: 324 },
    'Microseguro':    { aptos: 1606, ventas: 210 },
  }
};

/* ── MOTIVOS DE DESCARTE · Bienvenida CP + Autogestión combinadas (ene-sep) ──
   Fuente: panel "Detalle descartados" de las mismas capturas "auto <mes>"
   (vista del dashboard filtrada por Mes, que trae Autogestión + Base
   Bienvenidas Cuota Protegida juntas — mismo origen que DATA_OP_SEP).
   NO es el canal completo (eso sigue en DESCARTE_MOTIVOS, 1S, 548.368
   registros) — este bloque es solo esas 2 campañas. Cubre ene, abr-sep
   (7 de 9 meses): feb y mar se perdieron antes de poder guardarlos, no se
   inventan. Los totales por mes (8.606/11.929/14.497/16.650/12.582/21.658/
   4.257) cuadran exacto con rechazados de Bienvenida+Autogestión de
   DATA_OP_JUL_AGO/DATA_OP_SEP — confirma que es la misma fuente. */
const RECHAZO_BIENVENIDA_AUTOGESTION = {
  meses: 'Ene, Abr-Sep (faltan feb-mar)',
  total: 90179,
  motivos: [
    { motivo: 'Cuota Protegida Activa',              cant: 44771, pct: 49.6 },
    { motivo: 'Contrato Repetido',                    cant: 16923, pct: 18.8 },
    { motivo: 'Registro Enviado/Recibido Anteriorm.',cant: 13268, pct: 14.7 },
    { motivo: 'Microseguro Activo',                   cant: 5189,  pct: 5.8 },
    { motivo: 'Venta PDV en Mismo Archivo',           cant: 4790,  pct: 5.3 },
    { motivo: 'Otros (cédula/localidad/edad/etc.)',   cant: 5183,  pct: 5.7 },
  ]
};

/* ── CAMPAÑAS NUEVAS AGO-OCT 2026 (sin precedente en el 1S) ──
   Rueda Seguro SBS y Billetera Protegida. Mismo origen (capturas "TMK Vanti
   Annual Management Summary"), pero su propio rango de meses (ago-oct, no
   ene-ago) — ver detalle completo en los renderDetalleRuedaSBS/Billetera de
   app.js. Aquí solo el resumen usado en la tabla "Rendimiento por campaña". */
const CAMPANAS_NUEVAS_AGO_OCT = [
  { c: 'Rueda Seguro SBS',     reg: 16360, ventas: 254, contactab: '48 %', convSC: '5,3 %', perfil: 'y' },
  { c: 'Billetera Protegida',  reg: 15743, ventas: 57,  contactab: '48 %', convSC: '1,3 %', perfil: 'r' },
];

/* ── ESQUEMA DE INCENTIVOS (extraído de liquidaciones) ──────── */
const ESQUEMA_MESES = [
  { mes: 'Ene', e1meta: 135, e1pago: 675000,  e2meta: 162, e2pago: 972000,  e3meta: 189, e3pago: 1323000, telemed: 6, condicional: 25, volante: null,   novedades: 'Meta inicial del equipo' },
  { mes: 'Feb', e1meta: 135, e1pago: 675000,  e2meta: 162, e2pago: 972000,  e3meta: 189, e3pago: 1323000, telemed: 6, condicional: 25, volante: null,   novedades: 'Sin cambios' },
  { mes: 'Mar', e1meta: 135, e1pago: 675000,  e2meta: 162, e2pago: 972000,  e3meta: 189, e3pago: 1323000, telemed: 6, condicional: 25, volante: null,   novedades: 'Sin cambios' },
  { mes: 'Abr', e1meta: 140, e1pago: 700000,  e2meta: 168, e2pago: 1008000, e3meta: 196, e3pago: 1372000, telemed: 6, condicional: 25, volante: null,   novedades: 'Meta sube 3,7 % — equipo llega a 20 asesores' },
  { mes: 'May', e1meta: 140, e1pago: 700000,  e2meta: 168, e2pago: 1008000, e3meta: 196, e3pago: 1372000, telemed: 6, condicional: 25, volante: 120,    novedades: 'Meta Volante: +Bono por 120 pólizas extra' },
  { mes: 'Jun', e1meta: 140, e1pago: 700000,  e2meta: 168, e2pago: 1008000, e3meta: 196, e3pago: 1372000, telemed: 6, condicional: 25, volante: null,   novedades: 'Metas diferenciadas: top performers a 150 pólizas' },
];

/* ── INCENTIVOS EXTRAS PAGADOS (hoja INCENTIVOS SEGUROS) ───── */
const INCENTIVOS_EXTRAS = [
  { mes: 'Ene', total: 0,  eventos: 8,  nota: 'Incentivo destacado en torneo + varios incentivos menores' },
  { mes: 'Feb', total: 0,  eventos: 7,  nota: 'Incentivos de rendimiento destacado + varios menores' },
  { mes: 'Mar', total: 0,  eventos: 5,  nota: 'Incentivos de rendimiento medio' },
  { mes: 'Abr', total: 0,  eventos: 5,  nota: 'Patrón similar a marzo' },
  { mes: 'May', total: 0,  eventos: 7,  nota: 'Incentivo destacado + Meta Volante' },
  { mes: 'Jun', total: 0,  eventos: 9,  nota: 'Incentivos de rendimiento por cumplimiento de metas' },
];

/* ── EQUIPO: ROTACIÓN Y METAS INDIVIDUALES ───────────────────── */
const ROSTER = {
  estables:  14, // en todos los meses ene-may
  movimientos: [
    { periodo: 'Ene → Feb', entran: ['Cesar Barrera', 'Josue Zabaleta', 'Rhoymar Hdz.'], salen: ['Silvana Otero'] },
    { periodo: 'Feb → Mar', entran: ['Nayerlis Polo'], salen: [] },
    { periodo: 'Mar → Abr', entran: ['Ruddy Olmos', 'Yannecce Mejía'], salen: [] },
    { periodo: 'Abr → May', entran: ['Michelle Robles', 'Jean Guzmán'],  salen: ['Josue Zabaleta', 'Nayerlis Polo'] },
    { periodo: 'May → Jun', entran: [], salen: ['Ruddy Olmos', 'Michelle Robles'] },
  ],
  rosterPorMes: [15, 17, 18, 20, 20, 21],  // ene-jun
};

/* ── METAS INDIVIDUALES EN JUNIO (fuente: METAS ENERO A JUNIO.xlsx) */
const METAS_JUN = [
  { nombre: 'Jesús D. Cortés',       e1: 150, tendencia: 'top',    nota: 'Meta premium — mejor vendedor del canal' },
  { nombre: 'Melissa P. Orozco',     e1: 150, tendencia: 'top',    nota: 'Meta premium — consistente todo el semestre' },
  { nombre: 'Luisa L. Percy',        e1: 150, tendencia: 'top',    nota: 'Meta premium' },
  { nombre: 'Alan Hernández',        e1: 140, tendencia: 'estable', nota: 'Estable' },
  { nombre: 'Anderson Monterrosa',   e1: 140, tendencia: 'estable', nota: 'Estable' },
  { nombre: 'Rhoymar Hdz.',          e1: 140, tendencia: 'sube',    nota: 'Subió desde meta reducida (40) en feb' },
  { nombre: 'Santiago Chávez',       e1: 140, tendencia: 'estable', nota: 'Estable todo el semestre' },
  { nombre: 'Yulieth Pacheco',       e1: 140, tendencia: 'estable', nota: 'Estable' },
  { nombre: 'Dayana Guerrero',       e1: 132, tendencia: 'baja',    nota: 'Bajó 8 vs. mayo — leve ajuste' },
  { nombre: 'Jean J. Guzmán',        e1: 130, tendencia: 'sube',    nota: 'Nuevo asesor — escala rápido' },
  { nombre: 'Cesar Barrera',         e1: 130, tendencia: 'sube',    nota: 'Partió en 40, llegó a 130 en jun' },
  { nombre: 'Isabella Rueda',        e1: 130, tendencia: 'baja',    nota: 'Irregular — 135→80→140→130' },
  { nombre: 'Laura L. Herrera',      e1: 120, tendencia: 'riesgo',  nota: '⚠ Bajó de 140 a 120 — posible ausentismo' },
  { nombre: 'Yannecce Mejía',        e1: 120, tendencia: 'sube',    nota: 'Partió en 40, subió a 120' },
  { nombre: 'Julithza Padilla',      e1: 140, tendencia: 'estable', nota: 'Estable' },
  { nombre: 'Valentina Orozco',      e1: 140, tendencia: 'estable', nota: 'Recuperó tras baja en marzo' },
  { nombre: 'Nohelia H. Salas',      e1: 75,  tendencia: 'riesgo',  nota: '⚠ Bajó de 140 a 75 — posible incapacidad/reducción jornada' },
  { nombre: 'Joelis J. Barros',      e1: 140, tendencia: 'recupera',nota: 'Recuperó tras caída a 80 en mayo' },
];

/* ── CAMPAÑAS ─────────────────────────────────────────────── */
/* Consolidado ene–jun (semestre completo). Suma de registros/contactados/gestionados/
   ventas de las 6 campañas mensuales de Manager_Performance_2026.md §2 — el total
   de registros (921.480) y ventas (12.276) cuadra exacto con DATA. Los conteos crudos
   por campaña no se guardan aquí (solo % ya calculados de la fuente); por eso
   validateData() no puede recalcular este total automáticamente — si DATA cambia,
   estos porcentajes deben revisarse a mano contra Manager_Performance_2026.md.
   conv = efectividad / contactados (Distribution Performance v2). */
const CAMPANAS = [
  { nombre: 'Bienvenidas Cuota Protegida', contactab: '79 %', conv: '19,6 %', perfil: 'Excelente' },
  { nombre: 'Autogestión',                 contactab: '73 %', conv: '26,3 %', perfil: 'Excelente' },
  { nombre: 'Cuota Protegida Stock',       contactab: '52 %', conv: '3,6 %',  perfil: 'Moderado' },
  { nombre: 'Masiva Voluntarios',          contactab: '19 %', conv: '1,5 %',  perfil: 'Bajo' },
];

/* ── AUTOGESTIÓN · histórico mensual (Manager_Performance_2026.md §2) ──
   Base: clientes que solicitan financiación por la plataforma de Vanti,
   la mayoría sin intervención de un asesor. Meta ideal Vanti: 20 % de
   conversión sobre contacto mes a mes. efect = ventas/contactados.
   Estrategia de cargue en la OCM: hasta el 25 mar todos los asesores
   gestionaban esta base; desde el 26 mar se focalizó en 3 asesores
   dedicados, y a mediados de jun se sumó un 4°. */
const AUTOGESTION_MESES = [
  { mes: 'Ene', registros: 294,   aptos: 173,   contactados: 140, contactab: 80.92, efect: 30.71, ventas: 43,  rechazo: 121, pctRechazo: 41.16 },
  { mes: 'Feb', registros: 406,   aptos: 171,   contactados: 139, contactab: 81.29, efect: 32.37, ventas: 45,  rechazo: 235, pctRechazo: 57.88 },
  { mes: 'Mar', registros: 1864,  aptos: 675,   contactados: 515, contactab: 76.30, efect: 18.45, ventas: 95,  rechazo: 1189, pctRechazo: 63.79 },
  { mes: 'Abr', registros: 1950,  aptos: 813,   contactados: 564, contactab: 71.03, efect: 20.39, ventas: 115, rechazo: 1137, pctRechazo: 58.31 },
  { mes: 'May', registros: 2203,  aptos: 872,   contactados: 661, contactab: 75.80, efect: 32.98, ventas: 218, rechazo: 1331, pctRechazo: 60.42 },
  { mes: 'Jun', registros: 4968,  aptos: 1521,  contactados: 1040, contactab: 68.38, efect: 27.60, ventas: 287, rechazo: 3447, pctRechazo: 69.38 },
  // Jul-Sep: capturas "Resumen Anual TMK Vanti" filtradas por Mes (ver context_Televentas/Reporte Ilio/campanas_ene_sep_2026.md).
  // Mismo origen de datos que ene-jun (ventas/rechazo cuadran exacto contra el histórico ya publicado; registros/aptos
  // difieren en ±1 por redondeo del dashboard entre refrescos — no se ajustan a mano).
  { mes: 'Jul', registros: 5412,  aptos: 1990,  contactados: 1440, contactab: 72.36, efect: 24.65, ventas: 355, rechazo: 3422, pctRechazo: 63.23 },
  { mes: 'Ago', registros: 7827,  aptos: 2111,  contactados: 1134, contactab: 54.39, efect: 19.75, ventas: 224, rechazo: 5716, pctRechazo: 73.03 },
  { mes: 'Sep', registros: 4130,  aptos: 2938,  contactados: 2144, contactab: 73.07, efect: 15.11, ventas: 324, rechazo: 1192, pctRechazo: 28.86 },
];

/* ── AUTOGESTIÓN · ventas por asesor (fuente: reporte de ventas.xlsx) ── */
/* Los 4 asesores focalizados en la base de autogestión. Desde el 26 mar se
   asignaron 3 asesores dedicados (Jesús, Melissa, Luisa); a mediados de jun
   se sumó Joelis como 4ª. cuarto = true marca quién ingresó después. */
const AUTOGESTION_ASESORES = [
  { nombre: 'Jesús D. Cortés',     meses: [5,3,13,36,101,97], total: 255, cuarto: false },
  { nombre: 'Melissa P. Orozco',   meses: [5,3,7,18,58,74],  total: 165, cuarto: false },
  { nombre: 'Luisa L. Percy',      meses: [1,3,7,18,45,64],  total: 138, cuarto: false },
  { nombre: 'Joelis J. Barros',    meses: [3,6,4,3,0,31],    total: 47,  cuarto: true  },
];

/* ── AUTOGESTIÓN · tipificación de contactos (reporte de ventas.xlsx) ── */
/* Top 8 motivos de no-venta + ventas por mes. Ordenado por total descendente. */
const AUTOGESTION_TIPOS = [
  { nombre: 'Venta exitosa',          meses: [43,45,95,115,218,287], total: 803 },  // alineado al tablero operativo actualizado (2026-07-16)
  { nombre: 'No interesado producto', meses: [40,33,165,202,213,382], total: 1035 },
  { nombre: 'Contestador',            meses: [21,29,127,74,69,442],  total: 762 },
  { nombre: 'Cuelga llamada',         meses: [16,22,69,83,69,106],   total: 365 },
  { nombre: 'No contesta',            meses: [10,3,33,119,60,89],    total: 314 },
  { nombre: 'No resp. pago servicio', meses: [13,7,38,34,57,73],     total: 222 },
  { nombre: 'Teléfono apagado',       meses: [1,0,10,37,82,26],      total: 156 },
  { nombre: 'No interesado precio',   meses: [3,4,47,29,21,2],       total: 106 },
];

/* ── AUTOGESTIÓN · motivos de descarte (transcripcion_autogestion.md §2) ── */
/* 7.460 registros rechazados antes de gestión. */
const AUTOGESTION_DESCARTES = [
  { motivo: 'Cuota Protegida Activa',          pct: 62.3, registros: 4648 },
  { motivo: 'Registro Recibido Anteriormente', pct: 14.2, registros: 1056 },
  { motivo: 'Contrato Repetido',               pct: 8.2,  registros: 615 },
  { motivo: 'Registro Enviado Anteriormente',  pct: 6.2,  registros: 461 },
  { motivo: 'Localidad Errónea',               pct: 4.6,  registros: 344 },
  { motivo: 'Microseguro Activo',              pct: 1.1,  registros: 83 },
  { motivo: 'Otros (<1% c/u)',                 pct: 3.4,  registros: 253 },
];

/* ── TOP ASESORES (pólizas por mes, LIQUIDACIÓN OFICIAL) ─────── */
/* Ene-jun: liquidación ene-jun. Jul-sep: LIQUIDACIÓN INCENTIVOS
   JULIO/AGOSTO/SEPTIEMBRE 2026.xlsx (hoja "LIQUIDACION SEGUROS", columna
   "POLIZAS" — ojo: el archivo de julio trae una columna extra "POLIZAS
   JUNIO" antes, así que "POLIZAS" quedó en la posición C ese mes en vez
   de la B habitual; se ubicó por nombre de columna, no por índice fijo).
   meses = pólizas liquidadas · metas = meta Escala 1 del mes (NO extendida
   a jul-sep: requeriría cruzar por nombre contra "ESQUEMA SEGUROS" de cada
   archivo, no se hizo todavía — por eso metas solo tiene 6 valores, el
   semáforo de "bajo meta" simplemente no aplica en jul-sep).
   Orden: total desc. validateData() verifica que la suma mensual cuadre
   contra DATA.ventasLiq/asesores — por eso DATA.ventasLiq/asesores de
   jul-sep ahora también son oficiales (ver bloque DATA arriba). */
const ASESORES = [
  { nombre: 'Jesús David Cortés Ortega', meses: [205,234,208,197,210,222,219,181,168], metas: [135,135,135,140,140,150], metaJun: 150 },
  { nombre: 'Melissa Paola Orozco Jinete', meses: [144,195,189,157,161,175,190,151,148], metas: [135,135,135,140,140,150], metaJun: 150 },
  { nombre: 'Luisa L. Percy Jaraba', meses: [155,175,178,147,144,153,160,127,115], metas: [135,135,135,140,140,150], metaJun: 150 },
  { nombre: 'Dayana D. Guerrero Hernández', meses: [151,188,169,148,144,135,66,145,127], metas: [135,135,135,140,140,132], metaJun: 132 },
  { nombre: 'Anderson Monterrosa Castilla', meses: [167,149,169,146,149,145,162,121,122], metas: [135,135,135,140,140,140], metaJun: 140 },
  { nombre: 'Joelis J. Barros B.', meses: [154,180,168,136,81,167,181,143,116], metas: [135,135,135,126,80,140], metaJun: 140 },
  { nombre: 'Yulieth Pacheco', meses: [163,176,149,145,123,129,142,118,69], metas: [135,135,135,140,140,140], metaJun: 140 },
  { nombre: 'Alan José Hernández Loaiza', meses: [163,137,152,141,140,132,145,111,114], metas: [135,135,135,140,140,140], metaJun: 140 },
  { nombre: 'Santiago Elí Chávez Carmona', meses: [136,136,156,138,140,123,143,85,89], metas: [135,135,135,140,140,140], metaJun: 140 },
  { nombre: 'Julithza Milagros Padilla Mejía', meses: [138,140,148,143,119,81,110,null,null], metas: [135,135,135,140,140,140], metaJun: 140 },
  { nombre: 'Nohelia H. Salas Monterrosa', meses: [131,142,142,141,100,76,140,123,95], metas: [135,135,135,140,126,75], metaJun: 75 },
  { nombre: 'Isabella Sofía Rueda Caserta', meses: [135,129,27,135,99,122,117,78,84], metas: [135,135,80,140,140,130], metaJun: 130 },
  { nombre: 'Laura L. Herrera Palomino', meses: [140,149,147,85,78,34,56,110,100], metas: [135,135,135,140,140,120], metaJun: 120 },
  { nombre: 'Valentina Orozco', meses: [127,142,20,139,99,95,139,76,88], metas: [135,135,80,140,140,140], metaJun: 140 },
  { nombre: 'Rhoymar Hernández Albarrán', meses: [null,39,157,140,129,137,144,112,106], metas: [null,40,135,140,140,140], metaJun: 140 },
  { nombre: 'César Barrera Pájaro', meses: [null,33,134,75,104,105,123,83,96], metas: [null,40,135,140,140,130], metaJun: 130 },
  { nombre: 'Jean J. Guzmán', meses: [null,null,null,null,101,119,139,78,106], metas: [null,null,null,null,120,130], metaJun: 130 },
  { nombre: 'Josué Zabaleta Bethel', meses: [null,30,109,59,null,null,null,null,null], metas: [null,40,135,140,null,null], metaJun: null },
  { nombre: 'Yannecce Mejía Gómez', meses: [null,null,null,19,45,76,116,47,null], metas: [null,null,null,40,120,120], metaJun: 120 },
  { nombre: 'Silvana Otero', meses: [136,null,null,null,null,null,null,null,null], metas: [135,null,null,null,null,null], metaJun: null },
  { nombre: 'Nayerlis Polo Marrugo', meses: [null,null,9,73,null,null,null,null,null], metas: [null,null,40,140,null,null], metaJun: null },
  { nombre: 'KARINA YISELL MARQUEZ HERNANDEZ', meses: [null,null,null,null,null,54,139,98,59], metas: [null,null,null,null,null,60], metaJun: 60 },
  { nombre: 'Ruddy Olmos Simanca', meses: [null,null,null,3,18,13,null,null,null], metas: [null,null,null,40,120,120], metaJun: 120 },
  { nombre: 'ROSALINDA RIVERA SENIOR', meses: [null,null,null,null,null,21,72,null,null], metas: [null,null,null,null,null,120], metaJun: 120 },
  { nombre: 'Michelle Paola Robles Becerra', meses: [null,null,null,null,2,null,null,null,null], metas: [null,null,null,null,50,null], metaJun: null },
  // Nuevos asesores (ingresaron jul-sep, sin histórico ene-jun):
  { nombre: 'BREINER STEVEN CATAÑO SALAZAR', meses: [null,null,null,null,null,null,10,22,37], metas: [], metaJun: null },
  { nombre: 'KONNY JORLANO ARGUMEDO PACHECO', meses: [null,null,null,null,null,null,50,21,49], metas: [], metaJun: null },
  { nombre: 'MARISELLA VIZCAINO GUTIERREZ', meses: [null,null,null,null,null,null,12,87,109], metas: [], metaJun: null },
  { nombre: 'GUILLERMO DE JESUS GONZALEZ', meses: [null,null,null,null,null,null,null,4,49], metas: [], metaJun: null },
  { nombre: 'GUSTAVO ANDRES HERRERA ESTRADA', meses: [null,null,null,null,null,null,null,8,49], metas: [], metaJun: null },
  { nombre: 'ISRAEL DAVID OLMOS', meses: [null,null,null,null,null,null,null,2,5], metas: [], metaJun: null },
  { nombre: 'BREINER BARRERA RUDAS', meses: [null,null,null,null,null,null,null,null,16], metas: [], metaJun: null },
  { nombre: 'CAMILA ANDREA CUELLO MORAN', meses: [null,null,null,null,null,null,null,null,15], metas: [], metaJun: null },
];

/* ── MOTIVOS DE DESCARTE ────────────────────────────────────── */
const DESCARTE_MOTIVOS = [   // % del descarte total del semestre (548.368 registros)
  { motivo: 'Registro enviado anteriormente', pct: 49 },
  { motivo: 'Producto ya activo (CP / MS)',   pct: 29 },
  { motivo: 'Dirección repetida/errónea',     pct: 4  },
  { motivo: 'Contrato / cédula repetida',     pct: 4  },
  { motivo: 'Supera edad',                    pct: 3  },
  { motivo: 'Teléfono errado',                pct: 3  },
  { motivo: 'Otros',                          pct: 8  },
];

/* ── MOTIVOS DE DESCARTE · TOTAL ENE-SEP (canal 1S + incremental jul-sep) ──
   DESCARTE_MOTIVOS de arriba (1S, 548.368 registros, TODAS las campañas) +
   el incremental real de jul-ago-sep (38.497 registros) que SÍ se pudo
   tipificar por motivo — que es únicamente la porción de Bienvenida CP +
   Autogestión (ver RECHAZO_BIENVENIDA_AUTOGESTION; esas 2 campañas aportan
   el 100% del "rechazados" de jul-ago-sep que se tiene cargado en DATA_OP_
   JUL_AGO/DATA_OP_SEP — CP Stock/Masiva/Microseguro no traen motivo en la
   fuente nueva, así que no suman aquí; el total de registros SÍ cuadra
   exacto contra el rechTotal de "Desempeño por Campaña": 548.368 + 38.497 =
   586.865). Motivos re-agrupados a la misma taxonomía: "Cuota Protegida/
   Microseguro Activo" ⊂ "Producto ya activo"; "Contrato/Cédula Repetida" ⊂
   "Contrato/cédula repetida"; "Registro Recibido Anteriormente" ⊂
   "Registro enviado anteriormente"; "Excede Edad" ⊂ "Supera edad"; "Venta
   PDV en Mismo Archivo" es categoría nueva (no existía en el 1S). */
const DESCARTE_MOTIVOS_TOTAL = [
  { motivo: 'Registro enviado/recibido anteriormente', pct: 46.8 },
  { motivo: 'Producto ya activo (CP / MS)',            pct: 30.3 },
  { motivo: 'Contrato / cédula repetida',               pct: 5.3 },
  { motivo: 'Dirección repetida/errónea',               pct: 3.7 },
  { motivo: 'Supera edad',                              pct: 2.9 },
  { motivo: 'Teléfono errado',                          pct: 2.8 },
  { motivo: 'Venta en mismo archivo (PDV)',             pct: 0.8 },
  { motivo: 'Otros',                                    pct: 7.4 },
];

/* ── Datos reales de Martha (respuestasmatha.md) ─────────────────────
   Iniciativas comerciales del 1S, etiquetadas por quién las impulsó
   (Vanti/Xuma) — Orlando pidió verlo separado. */
const INICIATIVAS_1S = [
  { nombre: 'Semanas Ganadoras', origen: 'Vanti', mes: 'Enero', ventas: 1292, meta: 950,
    nota: 'Meta por trío y gasera (LIQUIDACIÓN ACELERADOR ENERO.xlsx): 5 tríos/semana × meta combinada por gasera (Vanti/Cundi/Oriente/Nacer) ≈ 950 pólizas totales → 1.292 logradas (136 %). 3 semanas: 340 + 409 + 543. Premio: bono $100K/semana por trío según cumplimiento.' },
  { nombre: 'Semana Burger', origen: 'Xuma', mes: 'Febrero', ventas: 659, meta: 600,
    nota: 'Meta semanal de 600 ventas (9–14 feb) → 659 logradas (110 %).' },
  { nombre: 'La Gran Jugada', origen: 'Vanti', mes: 'Mar–Abr', ventas: 4798, meta: 4200,
    nota: 'Meta de 4.200 pólizas positivas en 2 meses → 4.798 (114 %). Premio: $7.000.000 al equipo.' },
  { nombre: 'Semana Burger', origen: 'Xuma', mes: 'Abril', ventas: 607, meta: 600,
    nota: 'Segunda edición: meta 600 → 607 ventas (101 %).' },
  { nombre: 'Feria Vanti', origen: 'Xuma', mes: 'Abril', ventas: 517, meta: 500,
    nota: 'KPI de 12 ventas/día por asesor para participar del premio; meta 500 → 517 ventas en 4 días (103 %).' },
  { nombre: 'Feria Vanti', origen: 'Xuma', mes: 'Mayo', ventas: 556, meta: 500,
    nota: 'Meta semanal 500 (23–28 may) → 556 logradas, con KPI diario por asesor.' },
  { nombre: 'Feria Mundialista', origen: 'Xuma', mes: 'Junio', ventas: 1520, meta: 1200,
    nota: 'KPI de 9 ventas/día para participar del premio (16–30 jun); meta 1.200 → 1.520 ventas en 2 semanas (127 %).' },
  { nombre: 'Acelerador Mayo', origen: 'Vanti', mes: 'Mayo', ventas: 560, meta: 650,
    nota: 'Bono $300.000 por meta de 650 ventas (4–8 may). Logrado: 560 ventas (86 %).' },
];

/* ── INCENTIVOS VANTI (para slide Asesores, pestaña Vanti) ──── */
const VANTI_INCENTIVOS = [
  { mes: 'Ene', eventos: 6, nota: 'Semanas Ganadoras: 1.292/950 ventas (136 %) · Bono $100K/semana × trío' },
  { mes: 'Mar<br>Abr', eventos: 1, nota: 'La Gran Jugada: 4.798/4.200 ventas (114 %) · $7.000.000 al equipo' },
  { mes: 'May', eventos: 1, nota: 'Acelerador Mayo: 560/650 ventas (86 %) · Bono $300.000' },
];

/* Sin fotos reales de las capacitaciones (solo existen fotos de las campañas
   comerciales, ya usadas en "Evidencias"). Cada tema lleva un ícono representativo
   de su contenido — no es una foto del evento, es una identidad visual por tema. */
const CAPACITACIONES_1S = [
  { tema: 'Socialización y Alineación de Estándares de Calidad Comercial', mes: 'Ene', ico: icon('compass', { size: 20 }) },
  { tema: 'Estandarización del Protocolo de Cierre Comercial ("Gracias por la información")', mes: 'Feb', ico: icon('handshake', { size: 20 }) },
  { tema: 'Fortalecimiento de Conocimientos del Producto Cuota Protegida', mes: 'Feb', ico: icon('shield', { size: 20 }) },
  { tema: 'Aplicación Correcta de la Cláusula de Cobro y Autorizaciones', mes: 'Mar', ico: icon('file-text', { size: 20 }) },
  { tema: 'Implementación de Herramientas de Apoyo para la Gestión Comercial', mes: 'Abr', ico: icon('wrench', { size: 20 }) },
  { tema: 'Estandarización del Guion Comercial Aprobado', mes: 'Abr', ico: icon('scroll-text', { size: 20 }) },
  { tema: 'Actualización Comercial del Producto Plan Combo Vida', mes: 'May', ico: icon('heart', { size: 20 }) },
  { tema: 'Técnicas Efectivas para el Manejo de Objeciones Comerciales', mes: 'May', ico: icon('target', { size: 20 }) },
  { tema: 'Lineamientos para la Correcta Aplicación del Guion Comercial y Control de Modificaciones', mes: 'May', ico: icon('clipboard-list', { size: 20 }) },
  { tema: 'Fortalecimiento del Cumplimiento de los Lineamientos Operativos y de Calidad', mes: 'Jun', ico: icon('circle-check', { size: 20 }) },
];

/* ── Estrategia 2S: iniciativas propuestas (slide Estrategia) ─── */
const ESTRATEGIA_INICIATIVAS = [
  { color: 'teal', ico: icon('graduation-cap', { size: 20 }), titulo: 'School Master Comercial', resumen: 'Acompañamiento 1-a-1 para baja conversión en CP.',
    detalle: 'Diagnóstico individual de dificultades, talleres guiados en la Universidad ILAO y seguimiento cercano por asesor.' },
  { color: 'blue', ico: icon('trophy', { size: 20 }), titulo: 'Modelado de Top Performers', resumen: 'Replicar las técnicas de Jesús, Melissa y Luisa.',
    detalle: 'Documentar sus argumentos de manejo de objeciones y transferir esas habilidades al resto del equipo vía sesiones cortas.' },
  { color: 'warn', ico: icon('brain', { size: 20 }), titulo: 'Desarrollo Emocional (Gestión Humana)', resumen: 'Resiliencia y manejo del estrés del equipo.',
    detalle: 'Talleres presenciales y dinámicas fuera de la oficina en habilidades blandas, tolerancia a la frustración y manejo de objeciones.' },
];

/* Slide: Evidencias fotográficas — tarjetas estilo Instagram (carrusel de 3 fotos c/u).
   Imágenes reales cargadas en context_Televentas/evidencias/. Solo 3 por campaña,
   elegidas para no sobrecargar la slide (grid 2x2, sin scroll). Rutas relativas a
   televentas/index.html (que es donde se resuelven, no a este archivo). */
const EVIDENCIAS = [
  {
    grupo: 'Semanas Ganadoras', mes: 'Enero', stat: '1.292 ventas logradas', tag: '#SemanasGanadoras',
    carpeta: '../assets/evidencias/enero/',
    fotos: ['Imagen2.jpg', 'Imagen3.jpg', 'Imagen4.jpg'],
  },
  {
    grupo: 'Semana Burger & Feria Vanti', mes: 'Abril', stat: '1.266 ventas logradas', tag: '#SemanaBurger',
    carpeta: '../assets/evidencias/abril/',
    fotos: ['Imagen5.jpg', 'Imagen6.jpg', 'Imagen8.jpg'],
  },
  {
    grupo: 'Feria Vanti', mes: 'Mayo', stat: 'Parte de La Gran Jugada · 114% meta', tag: '#FeriaVanti',
    carpeta: '../assets/evidencias/mayo/',
    fotos: ['Imagen10.jpg', 'Imagen11.jpg', 'Imagen12.jpg'],
  },
  {
    grupo: 'Feria Mundialista', mes: 'Junio', stat: '1.520 ventas en dos semanas', tag: '#FeriaMundialista',
    carpeta: '../assets/evidencias/junio/',
    fotos: ['Imagen13.jpg', 'Imagen15.jpg', 'Imagen17.jpg'],
  },
];

/* ── Validación de congruencia (Fase 0): avisa en consola si alguien
   actualiza DATA o ASESORES sin mantener la otra en sync. ──────── */
function validateData() {
  const sumAsesores = m => ASESORES.reduce((a, x) => a + (x.meses[m] || 0), 0);
  const countAsesores = m => ASESORES.reduce((a, x) => a + (x.meses[m] != null ? 1 : 0), 0);
  DATA.meses.forEach((mes, i) => {
    const sumaVentas = sumAsesores(i);
    if (sumaVentas !== DATA.ventasLiq[i]) {
      console.warn(`[validateData] ${mes}: suma de ASESORES (${sumaVentas}) ≠ DATA.ventasLiq (${DATA.ventasLiq[i]}). Revisa si se actualizó una tabla sin la otra.`);
    }
    const conteoAsesores = countAsesores(i);
    if (conteoAsesores !== DATA.asesores[i]) {
      console.warn(`[validateData] ${mes}: asesores activos en ASESORES (${conteoAsesores}) ≠ DATA.asesores (${DATA.asesores[i]}). Revisa si se actualizó una tabla sin la otra.`);
    }
  });
}
validateData();
