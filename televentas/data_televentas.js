// ============================================================
//  INFORME CANAL TELEVENTAS 2026 – data_televentas.js
//  Datos consolidados de: Manager_Performance_2026.md
//                         Liquidacion_Metas_2026.md
//                         Análisis_Data_Disponible.md
//  Última actualización: 2026-07-08 (semestre completo ene–jun,
//  liquidación de junio integrada y ratificada como cifra oficial)
// ============================================================

const DATA = {
  meses: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
  registros:       [201409, 94918, 134897, 153111, 154335, 173413],
  rechazados:      [99241,  48185, 60998,  114123, 116691, 109130],
  aptos:           [102168, 46733, 73899,  38988,  37644,  64283],
  pctRechazo:      [49.27,  50.76, 45.22,  74.54,  75.61,  62.93],
  gestionados:     [102168, 46426, 60402,  31039,  37642,  43410],  // aptos efectivamente gestionados (Manager_Performance §2)
  contactados:     [21204,  19832, 27138,  16200,  24031,  21291],
  contactabilidad: [20.75,  42.72, 44.93,  52.19,  63.84,  49.05],
  efectividad:     [7.96,   10.31, 6.73,   9.56,   8.49,   9.39],
  ventasOp:        [1687,   2044,  1827,   1548,   2041,   1999],  // tablero operativo
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
   de registros (912.083) y ventas (11.146) cuadra exacto con DATA. Los conteos crudos
   por campaña no se guardan aquí (solo % ya calculados de la fuente); por eso
   validateData() no puede recalcular este total automáticamente — si DATA cambia,
   estos porcentajes deben revisarse a mano contra Manager_Performance_2026.md. */
const CAMPANAS = [
  { nombre: 'Bienvenidas Cuota Protegida', contactab: '79 %', conv: '19,5 %', perfil: 'Excelente' },
  { nombre: 'Autogestión',                 contactab: '71 %', conv: '26,6 %', perfil: 'Excelente' },
  { nombre: 'Cuota Protegida Stock',       contactab: '49 %', conv: '4,6 %',  perfil: 'Moderado' },
  { nombre: 'Masiva Voluntarios',          contactab: '17 %', conv: '1,9 %',  perfil: 'Bajo' },
];

/* ── AUTOGESTIÓN · histórico mensual (Manager_Performance_2026.md §2) ──
   Base: clientes que solicitan financiación por la plataforma de Vanti,
   la mayoría sin intervención de un asesor. Meta ideal Vanti: 20 % de
   conversión sobre contacto mes a mes. efect = ventas/contactados.
   Estrategia de cargue en la OCM: hasta el 25 mar todos los asesores
   gestionaban esta base; desde el 26 mar se focalizó en 3 asesores
   dedicados, y a mediados de jun se sumó un 4°. */
const AUTOGESTION_MESES = [
  { mes: 'Ene', registros: 294,   aptos: 173,   contactados: 140, contactab: 80.92, efect: 30.71, ventas: 43  },
  { mes: 'Feb', registros: 406,   aptos: 171,   contactados: 139, contactab: 81.29, efect: 32.37, ventas: 45  },
  { mes: 'Mar', registros: 1865,  aptos: 676,   contactados: 506, contactab: 74.85, efect: 17.19, ventas: 87  },
  { mes: 'Abr', registros: 1950,  aptos: 813,   contactados: 564, contactab: 71.03, efect: 20.74, ventas: 117 },
  { mes: 'May', registros: 2203,  aptos: 872,   contactados: 661, contactab: 75.80, efect: 32.98, ventas: 218 },
  { mes: 'Jun', registros: 4968,  aptos: 1521,  contactados: 962, contactab: 63.25, efect: 29.21, ventas: 281 },
];
const AUTOGESTION_META_IDEAL = 20; // % conversión sobre contacto, meta ideal Vanti

/* ── TOP ASESORES (pólizas por mes, tablero operativo) ─────── */
/* Todos los asesores del semestre (liquidación ene–may; jun pendiente).
   meses = pólizas liquidadas · metas = meta Escala 1 del mes. Orden: total desc.
   validateData() verifica que la suma mensual cuadre contra DATA.ventasLiq/asesores. */
const ASESORES = [
  { nombre: 'Jesús David Cortés Ortega', meses: [205,234,208,197,210,222], metas: [135,135,135,140,140,150], metaJun: 150 },
  { nombre: 'Melissa Paola Orozco Jinete', meses: [144,195,189,157,161,175], metas: [135,135,135,140,140,150], metaJun: 150 },
  { nombre: 'Luisa L. Percy Jaraba', meses: [155,175,178,147,144,153], metas: [135,135,135,140,140,150], metaJun: 150 },
  { nombre: 'Dayana D. Guerrero Hernández', meses: [151,188,169,148,144,135], metas: [135,135,135,140,140,132], metaJun: 132 },
  { nombre: 'Anderson Monterrosa Castilla', meses: [167,149,169,146,149,145], metas: [135,135,135,140,140,140], metaJun: 140 },
  { nombre: 'Joelis J. Barros B.', meses: [154,180,168,136,81,167], metas: [135,135,135,126,80,140], metaJun: 140 },
  { nombre: 'Yulieth Pacheco', meses: [163,176,149,145,123,129], metas: [135,135,135,140,140,140], metaJun: 140 },
  { nombre: 'Alan José Hernández Loaiza', meses: [163,137,152,141,140,132], metas: [135,135,135,140,140,140], metaJun: 140 },
  { nombre: 'Santiago Elí Chávez Carmona', meses: [136,136,156,138,140,123], metas: [135,135,135,140,140,140], metaJun: 140 },
  { nombre: 'Julithza Milagros Padilla Mejía', meses: [138,140,148,143,119,81], metas: [135,135,135,140,140,140], metaJun: 140 },
  { nombre: 'Nohelia H. Salas Monterrosa', meses: [131,142,142,141,100,76], metas: [135,135,135,140,126,75], metaJun: 75 },
  { nombre: 'Isabella Sofía Rueda Caserta', meses: [135,129,27,135,99,122], metas: [135,135,80,140,140,130], metaJun: 130 },
  { nombre: 'Laura L. Herrera Palomino', meses: [140,149,147,85,78,34], metas: [135,135,135,140,140,120], metaJun: 120 },
  { nombre: 'Valentina Orozco', meses: [127,142,20,139,99,95], metas: [135,135,80,140,140,140], metaJun: 140 },
  { nombre: 'Rhoymar Hernández Albarrán', meses: [null,39,157,140,129,137], metas: [null,40,135,140,140,140], metaJun: 140 },
  { nombre: 'César Barrera Pájaro', meses: [null,33,134,75,104,105], metas: [null,40,135,140,140,130], metaJun: 130 },
  { nombre: 'Jean J. Guzmán', meses: [null,null,null,null,101,119], metas: [null,null,null,null,120,130], metaJun: 130 },
  { nombre: 'Josué Zabaleta Bethel', meses: [null,30,109,59,null,null], metas: [null,40,135,140,null,null], metaJun: null },
  { nombre: 'Yannecce Mejía Gómez', meses: [null,null,null,19,45,76], metas: [null,null,null,40,120,120], metaJun: 120 },
  { nombre: 'Silvana Otero', meses: [136,null,null,null,null,null], metas: [135,null,null,null,null,null], metaJun: null },
  { nombre: 'Nayerlis Polo Marrugo', meses: [null,null,9,73,null,null], metas: [null,null,40,140,null,null], metaJun: null },
  { nombre: 'KARINA YISELL MARQUEZ HERNANDEZ', meses: [null,null,null,null,null,54], metas: [null,null,null,null,null,60], metaJun: 60 },
  { nombre: 'Ruddy Olmos Simanca', meses: [null,null,null,3,18,13], metas: [null,null,null,40,120,120], metaJun: 120 },
  { nombre: 'ROSALINDA RIVERA SENIOR', meses: [null,null,null,null,null,21], metas: [null,null,null,null,null,120], metaJun: 120 },
  { nombre: 'Michelle Paola Robles Becerra', meses: [null,null,null,null,2,null], metas: [null,null,null,null,50,null], metaJun: null },
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
