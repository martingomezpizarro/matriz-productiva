// ============================================================
// RIGI – Régimen de Incentivo para Grandes Inversiones (Ley 27.742)
// Registro de proyectos con FUENTE OFICIAL: resoluciones del Ministerio de Economía
// publicadas en el Boletín Oficial. Si todavía no hay resolución, sólo se cita a la empresa.
//
// Cómo se actualiza
//   - La tarea diaria de Claude revisa el Boletín Oficial y suma o corrige entradas acá.
//   - A mano: copiar un bloque, completar con lo que dice la resolución y subir.
//   - Clave = id del activo en el mapa (data/manual/activos.js o el id SIACAM en minería).
//     Si el proyecto todavía no tiene punto en el mapa, agregar `n`, `prov`, `s` y `e`
//     y cargar el punto en activos.js.
//
// Campos (montos en millones de US$)
//   st     aprobado | presentado | en_evaluacion
//   res    número de resolución del Ministerio de Economía; bo = fecha de publicación (AAAA-MM-DD)
//   vpu    vehículo de proyecto único o sucursal dedicada que figura en la resolución
//   total  inversión total declarada · comp = inversión en activos computables
//   min2a  inversión computable comprometida en los dos primeros años
//   adh    fecha de adhesión · limite = plazo para alcanzar el monto mínimo
//   obra   inicio de construcción · op = inicio de operación
//   cap    alcance o capacidad según la resolución
//   verif  bo_texto (texto completo leído) | bo_extracto (resumen/extracto) | empresa | pendiente
//   src    claves de RIGI_SRC (abajo) o de fuentes.js
//   ref    el activo comparte el proyecto único de otra entrada
// ============================================================

const RIGI_META = {
  actualizado: "2026-10-28",
  nota: "Montos de las resoluciones del Boletín Oficial. Cuando la resolución informa activos computables y total, se muestran ambos.",
  portal: "https://www.argentina.gob.ar/economia/rigi"
};

const BO = (fecha, aviso) => aviso
  ? `https://www.boletinoficial.gob.ar/detalleAviso/primera/${aviso}/${fecha.replace(/-/g, "")}`
  : `https://www.boletinoficial.gob.ar/seccion/primera/${fecha.replace(/-/g, "")}`;

const RIGI_SRC = {
  bo302_25:  { t: "Boletín Oficial – Res. ME 302/2025 (VMOS), 21-mar-2025", u: BO("2025-03-21", 322830) },
  bo559_25:  { t: "Boletín Oficial – Res. ME 559/2025 (Southern Energy, FLNG), 5-may-2025", u: "https://www.boletinoficial.gob.ar/detalleAviso/primera/324772/1" },
  bo735_25:  { t: "Boletín Oficial – Res. ME 735/2025 (Rincón, Rio Tinto), jun-2025", u: "https://www.argentina.gob.ar/economia/rigi" },
  bo1271_25: { t: "Boletín Oficial – Res. ME 1271/2025 (Hombre Muerto Oeste, Galan), ago-2025", u: "https://www.argentina.gob.ar/economia/rigi" },
  bo1553_25: { t: "Boletín Oficial – Res. ME 1553/2025 (Los Azules), 14-oct-2025", u: BO("2025-10-14") },
  bo1842_25: { t: "Boletín Oficial – Res. ME 1842/2025 (Terminal Timbúes), 20-nov-2025", u: BO("2025-11-20", 334814) },
  bo6_26:    { t: "Boletín Oficial – Res. ME 6/2026 (Nuevo Gualcamayo), 15-ene-2026", u: BO("2026-01-15", 337468) },
  bo413_26:  { t: "Boletín Oficial – Res. ME 413/2026 (Veladero, fases 8 y 9), 1-abr-2026", u: "https://www.boletinoficial.gob.ar/pdf/aviso/primera/340249/20260401" },
  bo431_26:  { t: "Boletín Oficial – Res. ME 431/2026 (Fénix, expansión 1B), 6-abr-2026", u: BO("2026-04-06", 340329) },
  bo562_26:  { t: "Boletín Oficial – Res. ME 562/2026 (Diablillos), may-2026", u: "https://www.argentina.gob.ar/economia/rigi" },
  bo676_26:  { t: "Boletín Oficial – Res. ME 676/2026 (ampliación Gasoducto Perito Moreno, TGS), 13-may-2026", u: BO("2026-05-13") },
  bo801_26:  { t: "Boletín Oficial – Res. ME 801/2026 (PSJ Cobre Mendocino), 28-may-2026", u: "https://www.boletinoficial.gob.ar/pdf/aviso/primera/342483/20260528" },
  bo825_26:  { t: "Boletín Oficial – Res. ME 825/2026 (ampliación Cauchari-Olaroz), 5-jun-2026", u: BO("2026-06-05", 342818) },
  bo873_26:  { t: "Boletín Oficial – Res. ME 873/2026 (gasoducto dedicado, SMP), 26-jun-2026", u: "https://www.boletinoficial.gob.ar/pdf/aviso/primera/343613/20260626" },
  bo1025_26: { t: "Boletín Oficial – Res. ME 1025/2026 (Rincón de Aranda, Pampa), 21-jul-2026", u: BO("2026-07-21") },
  bo1153_26: { t: "Boletín Oficial – Res. ME 1153/2026 (Liex – Tres Quebradas), 29-jul-2026", u: "https://www.boletinoficial.gob.ar/pdf/aviso/primera/345075/20260729" },
  bo1154_26: { t: "Boletín Oficial – Res. ME 1154/2026 (Vicuña), 30-jul-2026", u: "https://www.boletinoficial.gob.ar/pdf/aviso/primera/345167/20260730" },
  bo1157_26: { t: "Boletín Oficial – Res. ME 1157/2026 (Sal de Oro II, POSCO), 31-jul-2026", u: "https://www.boletinoficial.gob.ar/pdf/aviso/primera/345279/20260731" },
  bo1381_26: { t: "Boletín Oficial – Res. ME 1381/2026 (ampliación Mega), 26-ago-2026", u: "https://www.boletinoficial.gob.ar/pdf/aviso/primera/346397/20260826" },
  bo1771_26: { t: "Boletín Oficial – Res. ME 1771/2026 (Los Toldos II Este), 9-oct-2026", u: BO("2026-10-09") },
  bo1808_26: { t: "Boletín Oficial – Res. ME 1808/2026 (Bajo del Choique – La Invernada), 19-oct-2026", u: BO("2026-10-19") },
  bo1854_26: { t: "Boletín Oficial – Res. ME 1854/2026 (Agua Rica, Glencore), 27-oct-2026", u: BO("2026-10-27") },
  glc_ago25: { t: "Glencore – solicitudes RIGI de El Pachón y Agua Rica (ago-2025)", u: "https://www.glencore.com/media-and-insights/news/glencore-submits-RIGI-applications-in-respect-of-its-argentine-copper-projects" },
  rtQ2rigi:  { t: "Rio Tinto – reporte de operaciones 2T 2026 (Sal de Vida, solicitud RIGI)", u: "https://www.riotinto.com/en/invest/reports" },
  portalRIGI:{ t: "Ministerio de Economía – Portal oficial del RIGI", u: "https://www.argentina.gob.ar/economia/rigi" }
};

const RIGI = {
  // ---------------- OIL & GAS ----------------
  "ln-vmos": { st:"aprobado", res:"302/2025", bo:"2025-03-21", vpu:"VMOS S.A.", tipo:"Proyecto estratégico de exportación de largo plazo",
    comp:2486, cap:"Capacidad base de 377.400 bbl/d según la resolución (la ampliación a 550.000 bbl/d es anuncio de la empresa)",
    verif:"bo_extracto", src:["bo302_25"] },
  "og-pc": { ref:"ln-vmos" },

  "og-lng": { st:"aprobado", res:"559/2025", bo:"2025-05-05", vpu:"Southern Energy S.A.", tipo:"Proyecto estratégico de exportación de largo plazo",
    total:6878, comp:2825, adh:"2025-04-28", min2a:459, limite:"2035-12-31",
    cap:"1,5 MTPA de GNL de capacidad de placa; hasta 2,2 MTPA con gas todo el año. Etapa 1: US$ 1.603 M computables; etapa 2: US$ 1.222 M",
    verif:"bo_texto", src:["bo559_25"] },
  "ln-gsm": { st:"aprobado", res:"873/2026", bo:"2026-06-26", vpu:"SMP S.A.", total:1300,
    cap:"Gasoducto dedicado desde Vaca Muerta hasta los buques de licuefacción del Golfo San Matías",
    verif:"bo_extracto", src:["bo873_26"] },

  "ln-gpm": { st:"aprobado", res:"676/2026", bo:"2026-05-13", vpu:"TGS S.A. (sucursal dedicada)", total:550, comp:513, adh:"2026-04-30", limite:"2026-12-31",
    cap:"Ampliación del tramo I del Gasoducto Perito Moreno", verif:"bo_extracto", src:["bo676_26"] },
  "og-tra": { ref:"ln-gpm" },

  "og-mega1": { st:"aprobado", res:"1381/2026", bo:"2026-08-26", vpu:"Compañía Mega S.A. (sucursal dedicada)", tipo:"Ampliación de proyecto existente",
    total:365, comp:359, adh:"2026-07-28", limite:"2027-10-01", op:"2029-02-28",
    cap:"+1.500 t/día de líquidos del gas natural; los beneficios alcanzan sólo a la ampliación", verif:"bo_extracto", src:["bo1381_26"] },

  "og-rda": { st:"aprobado", res:"1025/2026", bo:"2026-07-21", vpu:"Pampa Energía S.A. – Sucursal dedicada Proyecto RDA", tipo:"Proyecto estratégico de exportación de largo plazo",
    comp:4521, adh:"2026-06-25", cap:"259 pozos en un bloque de 237 km² en Añelo; sólo los pozos nuevos quedan alcanzados",
    verif:"bo_extracto", src:["bo1025_26"] },
  "og-ltoldos": { st:"aprobado", res:"1771/2026", bo:"2026-10-09", vpu:"UT RIGI Los Toldos (Tecpetrol + Gas y Petróleo del Neuquén)", tipo:"Proyecto estratégico de exportación de largo plazo",
    total:6432, adh:"2026-09-09", limite:"2027-08-31",
    cap:"380 pozos horizontales en 78 km²; programa de inversión hasta 2054 en tres tramos", verif:"bo_extracto", src:["bo1771_26"] },
  "og-bdc": { st:"aprobado", res:"1808/2026", bo:"2026-10-19", vpu:"UT Gas y Petróleo del Neuquén + Pluspetrol Cuenca Neuquina", tipo:"Proyecto estratégico de exportación de largo plazo",
    total:12240, limite:"2029-04-30",
    cap:"620 pozos y 4 plantas de tratamiento. Etapa 1 (2025–2037): 206 pozos, US$ 4.175 M, hasta 50.000 bbl/d de petróleo y 6 MMm³/d de gas",
    verif:"bo_extracto", src:["bo1808_26"] },

  // ---------------- MINERÍA · LITIO ----------------
  "mi-3q": { st:"aprobado", res:"1153/2026", bo:"2026-07-29", vpu:"Liex S.A. – Sucursal dedicada",
    comp:594, adh:"2026-07-03", min2a:416, limite:"2027-11-30", obra:"2026-06-01", op:"2029-04-01",
    cap:"40.000 t/año de carbonato de litio por extracción directa (DLE)", verif:"bo_texto", src:["bo1153_26"] },
  "mi-fenix": { st:"aprobado", res:"431/2026", bo:"2026-04-06", vpu:"Minera del Altiplano S.A. – Sucursal dedicada", tipo:"Ampliación de proyecto existente",
    comp:251, adh:"2026-03-25", limite:"2026-12-01",
    cap:"De 28.500 a 38.000 t/año de carbonato de litio: planta de adsorción selectiva y planta de carbonato nuevas", verif:"bo_extracto", src:["bo431_26"] },
  "mi-sal-de-oro": { st:"aprobado", res:"1157/2026", bo:"2026-07-31", vpu:"Posco Argentina SAU – Sucursal dedicada (Sal de Oro II)",
    comp:208, adh:"2026-06-12", min2a:98, limite:"2029-07-31", obra:"2024-07-10", op:"2026-07-01",
    cap:"23.000 t/año de carbonato de litio (pozas de evaporación y tratamiento con cal). La solicitud original «Sal de Oro» fue desistida en nov-2025",
    verif:"bo_texto", src:["bo1157_26"] },
  "mi-hmo": { st:"aprobado", res:"1271/2025", bo:"2025-08", vpu:"Galan Litio S.A. – Sucursal dedicada",
    comp:217, cap:"12.000 t/año de carbonato de litio equivalente según la resolución", verif:"bo_extracto", src:["bo1271_25"] },
  "mi-co": { st:"aprobado", res:"825/2026", bo:"2026-06-05", vpu:"Minera Exar S.A. – Sucursal dedicada", tipo:"Ampliación de proyecto existente",
    total:1166, adh:"2026-05-09", limite:"2030-07-01", obra:"2026-07", op:"2028-12",
    cap:"De 40.000 a 85.000 t/año de carbonato de litio equivalente; 90 meses de obra desde jul-2026", verif:"bo_extracto", src:["bo825_26"] },
  "mi-rincon": { st:"aprobado", res:"735/2025", bo:"2025-06", vpu:"Rincón Mining Pty Ltd (Rio Tinto)", tipo:"Proyecto estratégico de exportación de largo plazo",
    cap:"60.000 t/año de carbonato grado batería por extracción directa (planta inicial de 3.000 t + ampliación)", verif:"pendiente", src:["bo735_25"] },
  "mi-sdv": { st:"presentado", vpu:"Rio Tinto (Sal de Vida)", total:638, verif:"empresa", src:["rtQ2rigi"] },

  // ---------------- MINERÍA · COBRE ----------------
  "mi-vicuna": { st:"aprobado", res:"1154/2026", bo:"2026-07-30", vpu:"Vicuña Argentina S.A.", tipo:"Proyecto estratégico de exportación de largo plazo",
    total:9737, comp:9025, adh:"2026-06-03", min2a:2009, limite:"2028-12-31",
    cap:"Mina a cielo abierto (Josemaría y Filo del Sol), concentradora, lixiviación, energía, agua y caminos. Etapa 1 hasta dic-2026 (US$ 1.129 M); etapa 2 de 2027 a 2031 (US$ 7.896 M)",
    verif:"bo_texto", src:["bo1154_26"] },
  "mi-azules": { st:"aprobado", res:"1553/2025", bo:"2025-10-14", vpu:"Andes Corporación Minera S.A.", tipo:"Proyecto estratégico de exportación de largo plazo",
    total:2672, comp:2354, adh:"2025-09-25", min2a:415, limite:"2027-12-31",
    cap:"Mina, lixiviación en pilas y planta SX-EW para cátodos de cobre; 61% de proveedores locales comprometidos", verif:"bo_extracto", src:["bo1553_25"] },
  "mi-psj": { st:"aprobado", res:"801/2026", bo:"2026-05-28", vpu:"Minera San Jorge S.A.", comp:613, op:"2029-01",
    verif:"bo_extracto", src:["bo801_26"] },
  "mi-mara": { st:"aprobado", res:"1854/2026", bo:"2026-10-27", vpu:"Minera Agua Rica LLC, Sucursal Argentina (Glencore)", tipo:"Proyecto Único «Agua Rica»",
    total:6394, comp:3311, adh:"2026-09-30", min2a:772, limite:"2028-12-31", obra:"2027-11-01", op:"2031-10-01",
    cap:"780 Mt de mineral en 23 años (≈ 160.000 t/año). Producción total prevista: 3,46 Mt de cobre, 2,34 Moz de oro, 41,2 Moz de plata y 99.854 t de molibdeno; 54% de la inversión con proveedores locales",
    verif:"bo_extracto", src:["bo1854_26"] },
  "mi-pachon": { st:"en_evaluacion", vpu:"Glencore (El Pachón, fase 1)", total:9500, verif:"empresa", src:["glc_ago25"] },

  // ---------------- MINERÍA · ORO Y PLATA ----------------
  "mi-vel": { st:"aprobado", res:"413/2026", bo:"2026-04-01", vpu:"Minera Andina del Sol S.R.L. – Sucursal dedicada 1", tipo:"Ampliación de proyecto existente",
    comp:380, adh:"2026-01-28", min2a:162, limite:"2028-12-31", op:"2026-12",
    cap:"+1,63 Moz de oro lixiviables en las nuevas pilas (fases 8 y 9); los beneficios alcanzan sólo a esas onzas", verif:"bo_texto", src:["bo413_26"] },
  "mi-gualca": { st:"aprobado", res:"6/2026", bo:"2026-01-15", vpu:"Minas Argentinas S.A. – Sucursal dedicada Nuevo Gualcamayo",
    comp:520, total:665, adh:"2025-11-27", min2a:91,
    cap:"Carbonatos Profundos: exploración de las concesiones Gualcamayo 1 y 2 y nueva planta de procesamiento", verif:"bo_extracto", src:["bo6_26"] },
  "mi-diablillos": { st:"aprobado", res:"562/2026", bo:"2026-05", vpu:"Pacific Rim Mining Argentina (AbraSilver)",
    comp:482, total:764, limite:"2027-11-30", obra:"2026-07", op:"2029-07",
    cap:"Mina a cielo abierto y planta de 3,15 Mt/año (≈ 9.000 t/día)", verif:"bo_extracto", src:["bo562_26"] },

  // ---------------- AGRO / LOGÍSTICA ----------------
  "ag-tmult": { st:"aprobado", res:"1842/2025", bo:"2025-11-20", vpu:"Terminal Timbúes S.A.", comp:277, limite:"2027-04-01",
    cap:"Terminal multipropósito sobre el Paraná: muelle, tanques hasta 120.000 m³ y depósito fiscal en un predio de 186 ha", verif:"bo_texto", src:["bo1842_25"] }
};
