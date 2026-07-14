// ============================================================
//  INFORME INNOVACIÓN & TECNOLOGÍA 2026 – data_innovacion.js
//  Fuente: context_Innovacion_Optmizada/ (Semestre 1 y Semestre 2),
//  incluyendo ACLARACIONES_2026-07-12.md, PERFILES_Y_ATRIBUCION_INNOVACION.md
//  y los 27 reportes de estado (reportes_estado_2026-07-13/, generados
//  cruzando `git log` con timestamps NTFS CreationTime/LastWriteTime —
//  ver CONSOLIDADO_ESTADO_PROYECTOS.md). Cifras citadas por archivo
//  fuente en cada comentario. Capa transversal a los 3 canales
//  (Televentas, Retail, Tradicional), no exclusiva de un canal.
//  Construcción técnica: Jeam Paul Arcón Solano (JP), Analyst Data.
//  Reglas de negocio y análisis operativo OCM: Isaac Álvarez.
//  Guiones/criterios de auditoría: Kevin Guzmán.
// ============================================================

/* ── FUNDACIÓN · 1er semestre ────────────────────────────────
   Trabajo de diseño, análisis y prototipos con datos reales que
   sentó las bases técnicas ejecutadas en el 2S. */
const FUNDACION_1S = [
  {
    id: 'datacenter-diseno',
    familia: 'datacenter',
    zona: '1S · Fundación', categoria: 'fundacion', ico: 'compass',
    nombre: 'Arquitectura DataCenter Analítico Vanti',
    corto: 'DataCenter · Diseño',
    responsable: 'Jeam Paul Arcón Solano',
    estado: 'Diseño completado — se ideó antes de lo que parece: primera formalización el 12 Jun, cerrado en v2.0 el 18 Jun',
    estadoSimple: 'Se diseñó por completo el plano de la base de datos central de Vanti — dónde va cada dato y cómo se conecta. El plano ya está listo; ahora se está construyendo sobre él.',
    mes: 6.60, fecha: '18 Jun',
    etapas: [
      { fase: 'iniciacion', mes: 6.40, fecha: '12 Jun · primera formalización' },
      { fase: 'iniciacion', mes: 6.60, fecha: '18 Jun · versión final v2.0' },
    ],
    stack: ['PostgreSQL 16', 'Python 3.12', 'FastAPI', 'Nginx', 'Metabase', 'pg_cron'],
    metodologia: 'Arquitectura por schemas separados + particionado',
    volumen: '8 fuentes · 5,31 → 14,09 GB proyectado (3 años)',
    tiempo: null,
    resumen: 'Diseño de una base de datos PostgreSQL única, con schemas separados, para consolidar las 8 fuentes de datos de los 3 canales (OCM, Ilio, AuditorKevin, CRM, Como Vamos, Prospectos). La primera formalización fue el 12 Jun (arquitectura_analitica_vanti.md); la versión final (v2.0) se cerró el 18 Jun.',
    hitos: [
      'Análisis completo de 8 fuentes de datos con volumetría real: OCM ~22,7M filas (~2,75 GB), Ilio 50–100 MB, AuditorKevin 130–390 MB, CRM Twenty 420–550 MB',
      'Arquitectura decidida: 1 base de datos con schemas separados (no BDs independientes) + particionado obligatorio de ocm.log_calls',
      '4 ETLs definidos con frecuencia y fuente de verdad por tipo de dato',
      'Proyección a 3 años: la BD pasaría de 5,31 GB a 14,09 GB — solo 7,1 % de un disco de 200 GB',
    ],
    fuente: 'Semestre 1/datacenter_parcial/analisis_bd_completo.md (v2.0, 2026-06-18) + 07_DataCenter/context/reporte_estado_proyecto.md (2026-07-13)',
  },
  {
    id: 'autocarga-ocm',
    // Antes fusionado en la columna "DataCenter" (familia:'datacenter'). Se le
    // da su propia columna porque, a diferencia del resto del DataCenter (VM
    // montada, muchas fases aún en diseño), OCM Vanti es la pieza que ya está
    // realmente en producción: carga automática y directa a la base de datos,
    // sync cada 10 min verificado — se conecta al DataCenter con línea
    // punteada (vinculadoA), igual que los demás proyectos que alimentan el
    // núcleo, en vez de aparecer como una fase más del mismo.
    vinculadoA: 'datacenter-implementacion',
    activo: true, // sigue corriendo hoy (sync cada 10 min) — su línea se extiende hasta "Hoy", no se corta en su última fecha documentada
    zona: '1S → 2S · OCM Vanti', categoria: 'produccion', ico: 'repeat',
    nombre: 'OCM Vanti — Carga Histórica + Sincronización Incremental',
    corto: 'OCM Vanti',
    responsable: 'Jeam Paul Arcón Solano',
    estado: 'Producción activa — sincronización incremental cada 10 min en la VM (última verificación 09 Jul)',
    estadoSimple: 'Ya está funcionando solo: cada 10 minutos actualiza la información de llamadas, sin que nadie tenga que hacerlo a mano.',
    mes: 6.78, fecha: '23 Jun',
    hito: true, // producción real y verificada (carga automática directa a la BD, sync cada 10 min)
    etapas: [
      { fase: 'iniciacion', mes: 5.97, fecha: '30 May' },
      { fase: 'construccion', mes: 6.76, fecha: '23 Jun · carga histórica' },
      { fase: 'produccion', mes: 6.78, fecha: '23 Jun · sync activo' },
    ],
    stack: ['Python', 'PostgreSQL', 'psycopg2'],
    metodologia: 'Exploración + carga histórica por checkpoint + sincronización incremental (watermark por ID)',
    volumen: '23.582.745 filas históricas (7 tablas) + sincronización incremental en vivo (MariaDB → PostgreSQL)',
    tiempo: 'Carga histórica ~2 horas · sync incremental cada 10 min (horario laboral)',
    resumen: 'Arrancó el 30 May explorando la BD MySQL de OCM en Vanti y descargando el histórico de agentes; el 23 Jun se completó la carga histórica (23,58M filas) y, la misma tarde, se implementó la arquitectura de sincronización incremental que hoy mantiene el schema `ocm` del DataCenter actualizado cada 10 minutos — no fue un cargue único, es un pipeline vivo.',
    hitos: [
      '23.582.745 filas cargadas en 7 tablas (4 transaccionales + 3 maestras), 100 % de completitud verificada (CSV vs. PostgreSQL, diferencia cero en las 7)',
      '24 checks de validación automática, 0 errores: completitud, particiones, nulos, rangos de fechas y disco',
      'Arquitectura de sync incremental (23 Jun tarde): watermark por ID para tablas transaccionales, upsert para maestras, tablas de control `ocm.sync_log`/`ocm.sync_config`, desplegada en la VM con cron cada 10 min en horario laboral',
      'Actualización 09 Jul: nuevo módulo `src/sync_ocm/` con scripts de verificación de sync y de brecha histórica',
    ],
    pendiente: 'Generar los dashboards HTML sobre los datos ya cargados, ajustar índices según las consultas reales, y confirmar que el cron de sync siga activo más allá del 09 Jul (última evidencia disponible)',
    fuente: '07_DataCenter/01_OCMVanti/context/reporte_estado_proyecto.md (2026-07-13) + FASE_2_OCM_EJECUCION.md (2026-06-23)',
  },
  {
    id: 'autogps',
    vinculadoA: 'datacenter-implementacion',
    zona: '1S · Fundación', categoria: 'fundacion', ico: 'map-pin',
    nombre: 'Geocodificación masiva de Bogotá (autoGPS)',
    corto: 'autoGPS',
    responsable: 'Jeam Paul Arcón Solano',
    estado: 'Piloto validado (94,5 %) y escalado a proceso masivo local (250K+ registros) — en pausa desde el 24 Jun, pendiente de retomar',
    estadoSimple: 'Ya demostró que puede ubicar direcciones de Bogotá con 94,5 % de precisión, sin hacerlo a mano. Se dejó en pausa antes de terminar de aplicarlo a todas las direcciones.',
    mes: 6.73, fecha: '22 Jun',
    etapas: [
      { fase: 'iniciacion', mes: 6.13, fecha: '04 Jun' },
      { fase: 'construccion', mes: 6.17, fecha: '05 Jun' },
      { fase: 'piloto', mes: 6.33, fecha: '10 Jun · piloto validado' },
      { fase: 'piloto', mes: 6.73, fecha: '22 Jun · escalado a 250K' },
    ],
    pendiente: 'Retomar el procesamiento masivo (quedó incompleto) y luego integrar de forma automática con el Mapa de Contactabilidad y, más adelante, con el DataCenter',
    stack: ['Python', 'ArcGIS API', 'Nominatim'],
    metodologia: 'Orquestación por checkpoints y consolidación en cascada',
    volumen: '13.571 direcciones (piloto validado) → 250.000+ registros en proceso masivo (incompleto)',
    tiempo: 'Piloto: ~3h → 1,2–1,5h con paralelismo',
    resumen: 'Automatización para obtener latitud/longitud/barrio/localidad de miles de direcciones sin intervención manual, integrando catastro IGAC nacional y fuentes externas. Isaac entregó la base de direcciones a geocodificar. El piloto (13.571 registros, 94,5 %) se validó el 10 Jun; el 22 Jun se escaló a un lote de 250.000+ registros, que quedó en pausa el 24 Jun.',
    hitos: [
      '13.571 registros geocodificados en el piloto (94,50 % de efectividad, mejorada desde un 62,02 % inicial) — único commit de git, 10 Jun',
      'Integración del catastro IGAC nacional (171.288 manzanas, 1.391 barrios) + 8 catastros departamentales + fuentes externas (Soacha, Bucaramanga, Barrancabermeja, Tunja)',
      '"AutoGeoCod v3.0": orquestador con ArcGIS/Nominatim, checkpoints y consolidación en cascada',
      'Escalado el 22 Jun a un dataset completo de 250.000+ registros (scripts de producción nunca commiteados a git) — quedó en pausa el 24 Jun con meses de enero, febrero y abril procesados; falta confirmar mayo y consolidar marzo',
    ],
    fuente: 'Semestre 1/autoGPS/tareas.md (04–10/06/2026) + 02_AutoGPS/context/reporte_estado_proyecto.md (2026-07-13)',
  },
  {
    id: 'autocomovamos',
    vinculadoA: 'datacenter-implementacion',
    zona: '1S · Fundación', categoria: 'fundacion', ico: 'bar-chart-3',
    nombre: 'AutoComoVamos — Pipeline de Reportes Comerciales',
    corto: 'autoComovamos',
    responsable: 'Jeam Paul Arcón Solano',
    estado: 'Producción manual — operación periódica real por corte (cada 1–2 semanas), sin despliegue en VM/DataCenter',
    estadoSimple: 'Reemplaza el trabajo manual en Excel de los reportes "Como Vamos" — ya funciona bien y se usa de verdad, pero todavía se corre desde una computadora, no desde un servidor.',
    mes: 7.15, fecha: '08 Jul (corte más reciente)',
    etapas: [
      { fase: 'iniciacion', mes: 6.30, fecha: '09 Jun' },
      { fase: 'construccion', mes: 6.37, fecha: '11 Jun · pipeline completo' },
      { fase: 'piloto', mes: 6.60, fecha: '18 Jun · primer corte real' },
      { fase: 'piloto', mes: 7.15, fecha: '08 Jul · corte más reciente' },
    ],
    pendiente: 'Migrar su ejecución al DataCenter como fuente de datos central (hoy corre en local, por corte)',
    stack: ['Python', 'Pandas', 'openpyxl', 'PyYAML'],
    metodologia: 'Módulos por checkpoint, reglas de negocio 100 % parametrizadas en YAML',
    volumen: 'CP + RS · canales Retail y Tradicional, por corte',
    tiempo: null,
    resumen: 'Pipeline que reemplaza el procesamiento manual en PowerQuery/macros (arrancó el 09 Jun migrando ese proceso) de los reportes "Como Vamos" de Cuota Protegida y Rueda Seguro para Retail y Tradicional: clasifica Ilio, financiaciones y conciliación, y genera los reportes finales con validación automática de balance. Opera por corte desde el 18 Jun, con cortes reales hasta el 08 Jul.',
    hitos: [
      '8 módulos en producción: clasificación Ilio (CP/RS), financiaciones, conciliación CP/RS, y generación de plantillas finales por canal',
      'Regla de balance obligatoria validada en cada corte: Cantadas = Positivas + Anuladas + Pendientes',
      'Metas de Tradicional leídas por nombre desde YAML — agregar o cambiar un profesional VTL no requiere tocar código',
      'Cruza 6 fuentes distintas por corte: planta de agentes (Serdán), Ilio CP/RS, pre-conciliación CP/RS (Ing. Sindy Molina, Posventa), financiaciones (Jennys del Carmen Polo Pinto) y metas',
      'Cortes reales procesados: 16, 22 y 30 Jun, 07 y 08 Jul — sin evidencia de despliegue en VM/DataCenter; se ejecuta manualmente por corte',
    ],
    fuente: 'Semestre 1/autoComovamos/README.md (v. 2026-06-18) + 04_AutoComoVamos/context/reporte_estado_proyecto.md (2026-07-13)',
  },
  {
    id: 'mapa-contactabilidad',
    zona: '1S · Fundación', categoria: 'fundacion', ico: 'radio-tower',
    nombre: 'Mapa Interactivo de Contactabilidad Bogotá',
    corto: 'Mapa Contactabilidad',
    responsable: 'Jeam Paul Arcón Solano',
    estado: 'En Construcción / Piloto interno — funcional y listo para desplegar, sin confirmación de despliegue en producción; sin cambios de código desde el 25 Jun',
    estadoSimple: 'Mapa interactivo ya funcional que muestra qué tan bien se puede contactar a los clientes según el operador telefónico. Está listo para publicarse, pero no hay confirmación de que ya esté disponible en línea.',
    mes: 6.83, fecha: '25 Jun',
    etapas: [
      { fase: 'iniciacion', mes: 5.94, fecha: '29 May–04 Jun · insumos' },
      { fase: 'construccion', mes: 6.33, fecha: '10 Jun · pipeline + primer commit' },
      { fase: 'piloto', mes: 6.83, fecha: '25 Jun · segunda ola de datos' },
    ],
    stack: ['React 18', 'Vite', 'Leaflet', 'Netlify'],
    metodologia: 'Cruce geoespacial de base de clientes vs. logs de llamadas',
    volumen: '12.825 clientes × 3.021.403 llamadas (ene–may)',
    tiempo: null,
    resumen: 'Cruce de la base de clientes geocodificada con los logs de llamadas OCM, visualizado en un mapa web interactivo por barrio y localidad. Creado por JP con ayuda de Isaac Álvarez. El branding y los insumos de datos (maestras OCM, logs de llamadas, geografías) llegaron entre el 14 May y el 04 Jun, casi un mes antes del primer commit (10 Jun); el proyecto está preparado para desplegar (`vercel.json`/`netlify.toml`) pero no hay evidencia de que ese despliegue esté confirmado y activo hoy.',
    hitos: [
      '12.825 clientes geocodificados cruzados contra 3.021.403 llamadas (enero–mayo 2026): 8.643 teléfonos de Bogotá cruzados al 100 %, 110.314 llamadas cruzadas',
      'Mapa interactivo (React + Vite + Leaflet) y dashboard de asesores funcionales, con filtros por vista, métrica y operador, en colores de marca Xuma',
      'Hallazgo operativo clave: contactabilidad Tigo 71,2 % vs. Movistar 25,5 % · caída de troncal Tigo 1,1 % vs. Movistar 14,9 %',
      'Última actualización de código: 25 Jun (reproceso con geocodificación ArcGIS más reciente + stats por asesor); reporte de negocio entregado el 10 Jul sin cambios de aplicación',
    ],
    fuente: 'Semestre 1/Mapa contactabilidad/proyecto_completo.md (2026-06-10) + 03_MapaContactabilidad/context/reporte_estado_proyecto.md (2026-07-13)',
  },
];

/* ── EN PRODUCCIÓN · 2do semestre ────────────────────────────
   Automatizaciones ya construidas, desplegadas y corriendo con
   datos reales al cierre de los documentos revisados. */
const EN_PRODUCCION = [
  {
    id: 'autoreport-ilio',
    zona: '2S · En Producción', categoria: 'produccion', ico: 'file-text',
    nombre: 'AutoReport_Ilio',
    corto: 'AutoReport_Ilio',
    responsable: 'Jeam Paul Arcón Solano',
    resumen: 'Automatiza la descarga (scraping con Playwright) y carga a PostgreSQL de los reportes del portal Ilio (Cuota Protegida y Rueda Seguro), eliminando el descargue manual diario. Arrancó el 01 Jun con la exploración del portal; el desarrollo masivo (fases 4–8) fue el 30 Jun, y entró en producción en la VM el 08 Jul.',
    estado: 'Producción activa · cron cada 15 min · solo requiere ajustes',
    estadoSimple: 'Ya está en producción: descarga y carga automáticamente los reportes de Ilio cada 15 minutos, sin que nadie tenga que entrar a bajarlos a mano.',
    mes: 7.27, fecha: '08 Jul',
    hito: true, // producción real y verificada (cron cada 15 min en VM), no solo diseño
    etapas: [
      { fase: 'iniciacion', mes: 6.03, fecha: '01 Jun' },
      { fase: 'construccion', mes: 6.97, fecha: '30 Jun · desarrollo masivo' },
      { fase: 'produccion', mes: 7.27, fecha: '08 Jul' },
    ],
    stack: ['Python', 'Playwright', 'PostgreSQL'],
    metodologia: 'RPA/web scraping + pruebas automatizadas (TDD)',
    volumen: '197.142 filas cargadas y balanceadas',
    tiempo: 'cron cada 15 min · 13/13 tests en 146s',
    hitos: [
      '10 de 10 fases completadas (75/75 tareas) al 2026-06-30 — 13/13 tests automatizados pasando',
      'Bug crítico corregido: el portal esperaba fechas DD/MM/YYYY, no YYYY-MM-DD — "todas las descargas ignoraban las fechas reales hasta este fix"',
      'Carga histórica completa: 197.142 filas (Cuota Protegida 188.429 histórico + 7.241 corriente; Rueda Seguro 1.314 histórico + 158 corriente), 100 % con balance verificado',
      'Desplegado y corriendo en la máquina virtual, con cron cada 15 minutos verificado en producción real (primera corrida automática 2026-07-08); 3 bugs post-deploy resueltos el 09–10 Jul',
    ],
    pendiente: 'Ya no es construcción faltante, son ajustes: 36 hallazgos técnicos priorizados en revisión post-producción, 3 de alta prioridad inmediata (ej. fallo silencioso si no se selecciona el filtro de aseguradora)',
    fuente: 'Semestre 2/ilio/seguimiento_clickup.md y plan_mejoras.md (2026-07-08) + 01_AutoReport_Ilio/context/reporte_estado_proyecto.md',
  },
  {
    id: 'actixuma',
    zona: '2S · En Producción', categoria: 'produccion', ico: 'laptop',
    nombre: 'actiXuma — Portal de Consulta de Activos',
    corto: 'actiXuma',
    responsable: 'Jeam Paul Arcón Solano',
    resumen: 'Portal web (FastAPI) para que los asesores consulten el estado de pólizas activas (Vanti) y ventas recientes (Ilio), con interfaz de marca Xuma. Los primeros insumos de datos llegaron el 12 Jun; el schema y el primer cargue real (226.963 filas) se hicieron el 25 Jun, y entró en producción en la VM el 09 Jul.',
    estado: 'Producción activa — desplegado en VM (Nginx + systemd) desde el 09 Jul, 27 usuarios confirmados; desarrollo adicional (envío de tokens) en curso sin commitear',
    estadoSimple: 'Portal web ya en uso real por 27 personas para consultar el estado de las pólizas — funcionando en el servidor de la empresa, no solo en una prueba.',
    mes: 7.30, fecha: '09 Jul',
    hito: true, // ya está realmente en producción (no solo montado como el DataCenter) — el resplandor de "hito" se movió aquí
    etapas: [
      { fase: 'iniciacion', mes: 6.40, fecha: '12 Jun' },
      { fase: 'construccion', mes: 6.83, fecha: '25 Jun · schema + primer cargue' },
      { fase: 'produccion', mes: 7.30, fecha: '09 Jul' },
    ],
    stack: ['Python', 'FastAPI', 'Nginx', 'systemd'],
    metodologia: 'Despliegue en VM con saneamiento de seguridad',
    volumen: '226.963 filas de activos (cargue inicial) + 161.318 filas verificadas + ventana móvil 3 meses Ilio',
    tiempo: null,
    hitos: [
      'Diseño del schema PostgreSQL (25 Jun): 6 tablas + vista unificada `v_polizas` + tablas de soporte; primer cargue real 226.963 filas',
      'Integración del esquema Ilio en tiempo real con ventana móvil de 3 meses',
      'Rediseño de interfaz estilo Apple con el manual de marca Xuma 2026',
      'Desplegado en producción (Nginx + FastAPI + systemd) el 09 Jul, con saneamiento de seguridad (reescritura de historial Git para eliminar credenciales expuestas); 27 usuarios confirmados con acceso',
    ],
    pendiente: 'Habilitar usuarios para Retail y Tradicional (hoy solo Televentas está en prueba y uso); habilitar acceso web fuera de la empresa (hoy es solo intranet); terminar de commitear y desplegar el envío/rotación automática de tokens de acceso (desarrollado el 10 Jul, aún no versionado)',
    fuente: 'Semestre 2/actiXuma/resumen_cambios.md y fase_despliegue_seguridad.md (julio 2026) + 14_ActiXuma/context/reporte_estado_proyecto.md',
  },
  {
    id: 'depuracion',
    vinculadoA: 'datacenter-implementacion',
    zona: '2S · En Producción', categoria: 'produccion', ico: 'sparkles',
    nombre: 'Depuración automatizada · base nueva (pre-venta, Televentas)',
    corto: 'Depuración',
    responsable: 'Jeam Paul Arcón Solano',
    resumen: 'Automatiza la depuración de la base de "Potenciales" cuando llegan registros nuevos para Televentas (Cuota Protegida contra activas, histórico e Ilio) — reemplaza un proceso manual con macros Excel. Isaac Álvarez define las reglas de negocio. Nació y maduró en una sola jornada intensa (07 Jul), y desde entonces corre a diario en local.',
    estado: 'Producción operativa real — local, sin VM ni scheduler; corridas diarias del 07 al 10 Jul',
    estadoSimple: 'Automatiza la limpieza de bases de datos nuevas antes de contactar al cliente — ya se usa todos los días, aunque todavía corre desde una computadora, no desde un servidor.',
    mes: 7.33, fecha: '10 Jul (última corrida)',
    etapas: [
      { fase: 'iniciacion', mes: 7.23, fecha: '07 Jul · análisis' },
      { fase: 'piloto', mes: 7.33, fecha: '10 Jul · operación diaria' },
    ],
    stack: ['Python', 'YAML (config-driven)'],
    metodologia: '12 reglas Fase I + 4 cruces Fase II + informativos + cobertura',
    volumen: '213.507 filas acumulado 2026',
    tiempo: 'Manual 1,5–3h → automatizado ~30 seg (~90–95 % reducción)',
    hitos: [
      'Todo el proyecto (análisis + pipeline + validación + documentación) nació y maduró en una sola jornada, el 07 Jul',
      'Corrida real 2026-07-07: 710 recibidos → 263 descartados → 447 aptos',
      'Comparación registro a registro contra el proceso manual (2026-07-09, misma base de 685 registros): la automatización recuperó 108 registros aptos adicionales al aplicar correctamente las ventanas de tiempo del instructivo oficial',
      'Se detectó y corrigió un defecto de datos real: 25 % del acumulado 2026 (53.171 de 213.507 filas) tenía fechas corruptas ("1905")',
      'Corridas reales consecutivas los días 7, 8, 9 y 10 de julio, con entregas a negocio y carga a los motores OCM',
    ],
    pendiente: 'Envío de correo automatizado, carga automática al motor OCM, suite de pruebas y programación automática (Task Scheduler) — aún sin versionar en git',
    fuente: 'Semestre 2/Depuracion/estimacion_tiempos.md y comparacion_isaac_09072026.md (jul. 2026) + 12_Depuracion/context/reporte_estado_proyecto.md',
  },
  {
    id: 'autoconciliacion',
    vinculadoA: 'datacenter-implementacion',
    zona: '2S · En Producción', categoria: 'produccion', ico: 'scale',
    nombre: 'autoConciliación · posventa (Base Bienvenida CP + RS)',
    corto: 'autoConciliación',
    responsable: 'Jeam Paul Arcón Solano',
    resumen: 'Automatiza el proceso de posventa que confirma la venta y carga las ventas cerradas de Cuota Protegida y Rueda Seguro, con 11 pasos de validación (duplicidad, cruces Ilio, cruces activos, edad, aliado). Reglas de negocio originales definidas por la Ing. Sindy Molina; JP las ajusta por ingeniería inversa (prueba y error) para capturar mejoras del sistema que no estaban documentadas.',
    estado: 'Piloto validado en 2 cortes reales (16 y 22 Jun) — en pausa desde el 30 Jun, pendiente de retomar',
    estadoSimple: 'Automatiza la confirmación de ventas ya cerradas — se probó con éxito dos veces seguidas, pero quedó en pausa desde finales de junio, esperando retomarse.',
    mes: 6.97, fecha: '30 Jun',
    etapas: [
      { fase: 'iniciacion', mes: 5.71, fecha: '22 May · criterios de negocio' },
      { fase: 'construccion', mes: 6.40, fecha: '12 Jun · pipeline (11 pasos)' },
      { fase: 'piloto', mes: 6.53, fecha: '16 Jun · primera corrida real' },
      { fase: 'piloto', mes: 6.97, fecha: '30 Jun · en pausa' },
    ],
    stack: ['Python', 'Pandas', 'YAML (config-driven)'],
    metodologia: '11 pasos de validación secuencial, arquitectura modular',
    volumen: null,
    tiempo: null,
    hitos: [
      'Arquitectura modular completa con 11 módulos de validación y configuración 100 % externalizada, construida en una sola jornada (12 Jun)',
      'Dos cortes reales validados de punta a punta: 16 Jun (con un bug de permisos detectado) y 22 Jun (corrida limpia)',
      '"El 100 % de los requerimientos de los diagramas lógicos han sido migrados a rutinas vectorizadas de Pandas" (conclusión del propio equipo)',
      'Es un proceso de negocio distinto a la Depuración: esta es posventa (confirmar y cargar ventas), la Depuración es pre-venta (limpiar base nueva)',
      'Llegó un insumo nuevo el 30 Jun pero nunca se procesó — el corte quedó pendiente y el proyecto en pausa desde entonces',
    ],
    pendiente: 'Retomar y procesar el corte pendiente desde el 30 Jun; resolver el error de permisos al exportar si el Excel de salida está abierto; decidir qué archivo Ilio de origen usar cuando hay ventanas de tiempo solapadas',
    fuente: 'Semestre 2/autoConciliacion/actualizacion_detallada.md (2026-06-16) + 05_AutoConciliacion/context/reporte_estado_proyecto.md (2026-07-13)',
  },
];

/* ── EN DESARROLLO ────────────────────────────────────────── */
const EN_DESARROLLO = [
  {
    id: 'auditor-ia',
    zona: '2S · En Desarrollo', categoria: 'desarrollo', ico: 'brain',
    nombre: 'Auditor de Llamadas con IA',
    corto: 'Auditor IA',
    responsable: 'Jeam Paul Arcón Solano',
    resumen: 'Transcribe llamadas comerciales (Whisper) y las evalúa contra el guion oficial con 10 criterios de cumplimiento, usando un modelo de IA local (Ollama/Qwen). Construido con Kevin Guzmán, quien aporta los guiones y criterios de auditoría. El backend y la transcripción se construyeron y validaron con llamadas reales entre el 10 y el 19 Jun.',
    estado: 'Piloto validado con llamadas reales (transcripción) — en pausa desde el 19 Jun, pendiente ejecutar la evaluación con IA (Qwen), aún no probada',
    estadoSimple: 'Escucharía y calificaría automáticamente las llamadas de venta. Ya convierte llamadas reales en texto sin problema; falta probar la parte que realmente califica con inteligencia artificial.',
    mes: 6.63, fecha: '19 Jun',
    etapas: [
      { fase: 'iniciacion', mes: 6.33, fecha: '10 Jun · hardware + arquitectura v6' },
      { fase: 'construccion', mes: 6.37, fecha: '10–11 Jun · backend + transcripción' },
      { fase: 'piloto', mes: 6.63, fecha: '19 Jun · llamadas reales transcritas' },
    ],
    stack: ['Electron', 'React 18', 'TypeScript', 'Whisper', 'Ollama/Qwen'],
    metodologia: 'Sistema de puntaje: 100 pts, 10 criterios, 4 causales de rechazo',
    volumen: null,
    tiempo: 'F1–F6 estimadas: ~10–15 horas de construcción',
    hitos: [
      'Arquitectura v6.0 definida en un día (10 Jun): cada auditor en su laptop, servidor backend+IA+BD centralizado',
      'Motor de transcripción (faster-whisper) validado con grabaciones reales de la central telefónica el 19 Jun — 8+ transcripciones reales generadas ese día',
      'Sistema de puntaje diseñado: 100 puntos, 10 criterios, 4 causales de rechazo automático, umbral de aprobación ≥ 80',
      'La evaluación automática con IA (Qwen 2.5 14B vía Ollama) — el eslabón central del producto — no tiene evidencia de haberse ejecutado ni una vez con datos reales',
    ],
    pendiente: 'Ejecutar por primera vez la evaluación con IA (Qwen 2.5 14B), terminar el frontend Electron/React y retomar el proyecto (en pausa desde el 19 Jun)',
    fuente: 'Semestre 2/auditorKevin/plan/PLAN_AUDITOR_VENTAS_v6.md (2026-06-10) + 06_Auditoria_Audio/context/reporte_estado_proyecto.md (2026-07-13)',
  },
  {
    id: 'notebookevin',
    zona: '2S · En Desarrollo', categoria: 'desarrollo', ico: 'book',
    nombre: 'notebooKevin — Asistente de Guiones y Auditoría',
    corto: 'notebooKevin',
    responsable: 'Jeam Paul Arcón Solano',
    resumen: 'Cuaderno de NotebookLM con un perfil de personalidad de Kevin Guzmán que responde preguntas sobre los guiones comerciales (Cuota Protegida, Plan Combo Vida) y los parámetros de auditoría de calidad, citando siempre de forma textual las cláusulas normativas — sin inventar respuestas fuera de esos documentos. Construido con Kevin Guzmán, quien aporta el conocimiento de guiones y criterios.',
    estado: 'Piloto — material y perfil completos, listos para NotebookLM; sin evidencia de uso real posterior',
    estadoSimple: 'Un asistente que responde preguntas sobre los guiones de venta citando siempre la regla exacta, sin inventar. El material ya está listo; falta confirmar que el equipo ya lo esté usando.',
    mes: 6.86, fecha: '25 Jun',
    etapas: [
      { fase: 'iniciacion', mes: 6.85, fecha: '25 Jun · plantilla de perfil' },
      { fase: 'construccion', mes: 6.855, fecha: '25 Jun · perfil diligenciado' },
      { fase: 'piloto', mes: 6.86, fecha: '25 Jun · perfil + fuentes listos' },
    ],
    stack: ['NotebookLM'],
    metodologia: 'Persona de IA con respuestas ancladas estrictamente a documentos fuente',
    volumen: '3 documentos fuente: 2 guiones + parámetros de auditoría',
    tiempo: null,
    hitos: [
      'Todo el flujo (plantilla → perfil diligenciado → perfil final + 3 documentos fuente) se completó en una sola tarde, el 25 Jun',
      'Responde solo con base en GUION_CUOTA_PROTEGIDA, GUION_PLAN_COMBO_VIDA y PARAMETROS_DE_AUDITORIA',
      'Transcribe textualmente y sin modificar las cláusulas normativas (Habeas Data, cláusula de cobro, frase de cierre) — no se parafrasean',
      'Sin evidencia posterior al 25 Jun de que se haya cargado y usado dentro de NotebookLM (herramienta externa, sin rastro local de uso)',
    ],
    fuente: 'Semestre 2/notebooKevin/perfil_kevin_guzman.md + 10_Notebookllm/context/reporte_estado_proyecto.md (2026-07-13)',
  },
  {
    id: 'crm-twenty',
    vinculadoA: 'datacenter-implementacion',
    zona: '2S · En Desarrollo', categoria: 'desarrollo', ico: 'users',
    nombre: 'CRM Twenty (Xuma Insurance)',
    corto: 'CRM Twenty',
    responsable: 'Jeam Paul Arcón Solano',
    resumen: 'Capa de gestión comercial (CRM) para los agentes, mostrando datos ya procesados de OCM, Ilio y auditorías, sin integrar IA directamente.',
    estado: 'En Construcción — instalación local en pausa desde el 12 Jun (falta reiniciar tras configurar WSL), pendiente de retomar',
    estadoSimple: 'Sistema para que los agentes gestionen su relación con los clientes en un solo lugar. La instalación quedó a medias desde mediados de junio, pendiente de retomarse.',
    mes: 6.40, fecha: '12 Jun',
    etapas: [
      { fase: 'iniciacion', mes: 6.39, fecha: '12 Jun · análisis comparativo' },
      { fase: 'construccion', mes: 6.40, fecha: '12 Jun · instalación Docker/WSL' },
    ],
    stack: ['React', 'NestJS', 'PostgreSQL', 'Docker'],
    metodologia: 'Evaluación comparativa de opciones (Twenty vs. SuiteCRM/Odoo/EspoCRM)',
    volumen: null,
    tiempo: null,
    hitos: [
      'Twenty CRM elegido (open source, self-hosted) sobre SuiteCRM/Odoo/EspoCRM, por costo: self-hosted ~US$20–50/mes vs. cloud US$225–625/mes para 25 agentes',
      'Docker Desktop instalado; al arrancar, Windows exigió habilitar la Plataforma de Máquina Virtual y WSL — se ejecutó `wsl --install` con éxito',
      'Quedó pendiente reiniciar la máquina para completar la instalación — no hay evidencia de que se haya hecho, ni de `docker compose up`, ni de acceso al CRM, desde el mismo 12 Jun',
    ],
    pendiente: 'Reiniciar la máquina para completar la instalación de WSL, levantar el stack con Docker Compose y configurar el usuario administrador',
    fuente: 'Semestre 2/crm_XumaIns/twenty-crm-analisis.md (2026-06-12) + 08_CRMXumaIns/context/reporte_estado_proyecto.md (2026-07-13)',
  },
  {
    id: 'datacenter-implementacion',
    familia: 'datacenter',
    activo: true, // la VM sigue montada y en operación parcial hoy — línea extendida hasta "Hoy"
    hitoHorizontal: true, // destello horizontal en su primera etapa (18 Jun): desde ahí parte la integración hacia OCM Vanti y el resto de proyectos vinculados
    zona: '2S · En Desarrollo', categoria: 'desarrollo', ico: 'wrench',
    nombre: 'DataCenter Analítico Vanti · Implementación',
    corto: 'DataCenter · Implementación',
    responsable: 'Jeam Paul Arcón Solano',
    resumen: 'Ejecución del plan maestro de infraestructura diseñado en el 1S: base de datos, ETLs, dashboards y acceso remoto. La implementación se da por completa solo cuando las 8 fuentes de datos (OCM, Ilio, Directorio, Conciliación, ComoVamos, Auditor, Prospectos, CRM) estén cargadas y sincronizadas en el DataCenter — hoy corren en su VM el subsistema OCM y, además, actiXuma y AutoReport_Ilio, ya en producción real.',
    estado: 'En implementación — la VM (bdvanti) ya aloja en producción real el subsistema OCM (desde el 23 Jun), AutoReport_Ilio (08 Jul) y actiXuma (09 Jul); no se da por terminada hasta cargar el 100 % de las 8 fuentes planeadas',
    estadoSimple: 'La máquina donde vive toda la información de Vanti ya está funcionando de verdad — hoy sostiene 3 sistemas reales (llamadas, activos, reportes de Ilio), aunque todavía faltan varias fuentes de datos por conectar.',
    mes: 7.30, fecha: '09 Jul',
    etapas: [
      { fase: 'construccion', mes: 6.65, fecha: '18 Jun · arranque de la implementación' },
      { fase: 'construccion', mes: 7.06, fecha: '03 Jul · acceso remoto Tailscale VPN' },
      { fase: 'construccion', mes: 7.30, fecha: '09 Jul · misma VM ya sirve a AutoReport_Ilio y actiXuma en producción' },
    ],
    stack: ['PostgreSQL', 'FastAPI', 'Nginx'],
    metodologia: 'Ejecución del plan maestro por fases (16 fases documentadas)',
    volumen: null,
    tiempo: null,
    hitos: [
      '09 Jul: la misma VM (bdvanti) ya aloja en producción real a AutoReport_Ilio y actiXuma, además del subsistema OCM — la infraestructura sostiene 3 servicios reales, aunque la implementación en sí sigue en construcción',
      'La máquina virtual ya está montada y funcionando (el checklist formal del PLAN_MAESTRO.md quedó desactualizado frente al avance real)',
      'Fase 1 (18–19 Jun): seguridad y fundación — UFW, Fail2ban, PostgreSQL 16 instalado',
      'Fases 2–3 (23 Jun): carga histórica OCM completa (23,58M filas) y sincronización incremental activa — el propio documento lo declara "Sistema en producción: ACTIVO"',
      'Fase 11 (03 Jul): acceso remoto vía Tailscale VPN (SSH + PostgreSQL sin exponer puertos a internet), completada y verificada',
      'De 16 fases planeadas, solo 0–3 y 11 están completadas — Ilio, Directorio, Conciliación, ComoVamos, Auditor, Prospección, dashboards (Metabase) y CRM Twenty en VM separada siguen pendientes',
    ],
    pendiente: 'Cargar y sincronizar en el DataCenter las 7 fuentes que aún faltan (Ilio, Directorio, Conciliación, ComoVamos, Auditor, Prospectos, CRM Twenty) — fases 4–10 y 12–15 del plan maestro, más dashboards (Metabase). La implementación no se considera terminada hasta que toda la data esté cargada, no solo OCM.',
    fuente: 'Semestre 2/maquinavirtual/PLAN_MAESTRO.md (act. 2026-06-18) + 09_MV/context/reporte_estado_proyecto.md (2026-07-13)',
  },
];

/* ── LÍNEA DE TIEMPO ──────────────────────────────────────────
   Todos los proyectos en orden cronológico/lógico: Fundación 1S →
   En Producción 2S → En Desarrollo 2S. Usada por el slide único
   de línea de tiempo interactiva (renderTimeline en app_innovacion.js). */
const TIMELINE = [...FUNDACION_1S, ...EN_PRODUCCION, ...EN_DESARROLLO];

/* ── RELACIÓN ISAAC ÁLVAREZ ↔ JP POR PROYECTO ────────────────
   Fuente: PERFILES_Y_ATRIBUCION_INNOVACION.md (2026-07-12). Solo se listan
   los proyectos donde hay una relación real y documentada entre la
   actividad de Isaac y la construcción de JP — no se repite en cada fila
   "sin rol de Isaac" para los proyectos donde JP trabajó en solitario. */
const RELACION_ISAAC_JP = [
  {
    proyecto: 'Mapa de Contactabilidad',
    isaac: 'Co-creador: aporta conocimiento operativo de troncales y llamadas, participa en la creación conjunta.',
    jp: 'Construye el mapa interactivo (React + Vite + Leaflet), el cruce geoespacial y el despliegue.',
  },
  {
    proyecto: 'autoGPS (geocodificación Bogotá)',
    isaac: 'Entrega la base de direcciones a geocodificar — conocimiento de qué datos existen y dónde.',
    jp: 'Construye el orquestador de geocodificación (ArcGIS/Nominatim), 94,5 % de efectividad sobre 13.571 direcciones.',
  },
  {
    proyecto: 'Depuración (pre-venta, Televentas)',
    isaac: 'Define las reglas de negocio: qué constituye un registro válido para depurar y las ventanas de tiempo aceptadas.',
    jp: 'Construye el pipeline Python (12 reglas Fase I + 4 cruces Fase II), lo valida contra el proceso manual y lo despliega.',
  },
  {
    proyecto: 'Lógica OCM — seguimiento operativo de llamadas',
    isaac: 'Responsable directo: construye y opera él mismo el análisis de la operación telefónica — la única iniciativa donde su rol no es solo de reglas de negocio.',
    jp: 'No interviene en la construcción de esta lógica específica.',
  },
  {
    proyecto: 'reporte_isaac.md (narrativa del canal)',
    isaac: 'Redacta parte de la narrativa ejecutiva del canal: migración a PostgreSQL, evolución de Power BI, indicadores de productividad.',
    jp: 'Construye la infraestructura de datos que esas narrativas describen (DataCenter, ETLs, automatizaciones).',
  },
];

/* ── LÍNEAS ESTRATÉGICAS DECLARADAS PARA EL 2S ───────────────
   Textual del reporte narrativo de Isaac sobre el canal. */
const LINEAS_2S = [
  'Tablero ejecutivo consolidado del canal',
  'Reportería especializada (bases, productividad individual, campaña, posventa, financiera)',
  'Proyecciones mensuales, semestrales y anuales',
  'Automatización de cargues y flujos de datos',
  'Gobierno de datos por estación, categoría, campaña, tipo de base y filial',
  'Evaluación de nuevos CRM, switcheo automático de troncales y agentes automáticos de barrido de registros sin contacto',
];
