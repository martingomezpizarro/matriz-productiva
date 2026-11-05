// ============================================================
// CIRCUITO GLOBAL – Qué pesa la Argentina dentro de cada empresa con proyectos RIGI
// Archivo de datos de Matriz Productiva. Ver README → «Circuito global».
//
// Cómo se calcula el peso proyectado (lo hace js/circuito.js)
//   ingreso atribuible de un proyecto = producción anual a régimen × precio de referencia × participación
//   total proyectado = base − hoy + Σ proyectos argentinos a régimen
//     base  = última cifra anual de la empresa (ingresos, producción o backlog, según «met»)
//     hoy   = lo que la Argentina ya aporta dentro de esa base (se reemplaza por los proyectos a régimen)
//   peso de cada proyecto = su valor ÷ total proyectado. El resto de la empresa queda fijo
//   (ceteris paribus): es una foto de escala, no un pronóstico de resultados.
//
// Campos de cada empresa
//   n nombre · sec mi|og · emp clave en EMP (empresas.js) · hq {c, ll} casa matriz
//   met  métrica: ing (US$ M de ingresos) | cu (kt de cobre) | oz (koz de oro) | kboe (miles boe/d) | bk (US$ mil M de backlog)
//   base {v, per, s, est} · hoy {v, t, s, est} · local true = la empresa ya es 100% argentina
//   ar   proyectos: { id (activo del mapa), n, part %, prod {cu t, au oz, ag oz, lce t, mo t, bbld, gnl Mtpa, urea t},
//                     m (valor directo en la métrica), fijo (US$ M), rigi aprobado|presentado|en_evaluacion|no,
//                     ini año de arranque, t nota, s fuente, est true si es estimación propia }
//   mundo  otros activos de la empresa: [nombre, [lat, lon], producto, nota]
//   claves  lectura en frases cortas
//   est  true marca cifras con estimación propia (se muestran con «≈»)
// ============================================================

const CIR_META = {
  actualizado: "2026-11-05",
  nota: "Pesos calculados con los precios de referencia elegidos y la producción a régimen de cada proyecto. Son órdenes de magnitud para entender la escala, no proyecciones de resultados de las empresas.",
  // Precios de referencia. «estudio»: los que usan los estudios técnicos; «2026»: los de este año.
  precios: {
    estudio: { n:"Precios de los estudios", cu:9900, au:3300, ag:40, lce:15000, mo:44000, brent:65, gnl:8, urea:400,
      t:"Cobre US$ 4,50/lb · oro US$ 3.300/oz · plata US$ 40/oz · carbonato de litio US$ 15.000/t · Brent US$ 65 · GNL US$ 8/MMBtu · urea US$ 400/t" },
    alto:    { n:"Precios 2026", cu:13200, au:5000, ag:80, lce:20141, mo:44000, brent:82, gnl:10, urea:400,
      t:"Cobre US$ 6,00/lb · oro US$ 5.000/oz · plata US$ 80/oz (spot usados en el estudio de Vicuña, feb-2026) · litio US$ 20.141/t (promedio ene–sep 2026) · Brent US$ 82 (guía de YPF) · GNL US$ 10/MMBtu" }
  },
  fx: "Monedas: RMB 7,19 y KRW 1.420 por dólar (promedios 2025)."
};

// Colores por producto: orden fijo validado (paleta categórica de 6 tonos, ΔE CVD ≥ 9 en claro y oscuro).
const CIR_PROD = {
  li:  { n:"Litio",               c:"#2a78d6", cd:"#3987e5" },
  cu:  { n:"Cobre",               c:"#eb6834", cd:"#d95926" },
  gas: { n:"Gas y GNL",           c:"#1baf7a", cd:"#199e70" },
  au:  { n:"Oro y plata",         c:"#eda100", cd:"#c98500" },
  ure: { n:"Urea",                c:"#e87ba4", cd:"#d55181" },
  oil: { n:"Petróleo",            c:"#6250d6", cd:"#9085e9" }
};

const CIR_SRC = {
  rt25:    { t:"Rio Tinto – Resultados 2025: ingresos US$ 57.600 M, EBITDA subyacente US$ 25.400 M, 57 kt LCE (46 kt atribuibles)", u:"https://www.riotinto.com/en/invest/reports" },
  rtH126:  { t:"Rio Tinto – Resultados 1S 2026: 27,3 kt LCE (+53%), primera producción de Fénix 1B y Sal de Vida", u:"https://www.sec.gov/Archives/edgar/data/0000863064/000086306426000035/ex991results.htm" },
  rtRinc:  { t:"Rio Tinto – Financiamiento de US$ 1.175 M para Rincón (US$ 2.500 M de inversión, 60 kt/año, producción desde 2028)", u:"https://www.sec.gov/Archives/edgar/data/863064/000086306426000019/ex08d11mr_rinconfinancing.htm" },
  glen25:  { t:"Glencore – Resultados preliminares 2025: EBITDA ajustado US$ 13.511 M; 851.600 t de cobre propio", u:"https://www.glencore.com/media-and-insights/news/full-year-2025-production-report" },
  glenCMD: { t:"Glencore – Capital Markets Day (3-dic-2025): ≈ 1,6 Mt de cobre hacia 2035; reapertura de Alumbrera; MARA > 200 kt/año", u:"https://www.mining.com/web/glencore-targets-1mt-of-copper-in-argentina-over-coming-decade" },
  pachonPM:{ t:"Panorama Minero – Compendio: El Pachón, 0,338 Mt/año de cobre y 6.600 t de molibdeno; producción desde 2034", u:"https://www.panorama-minero.com/es/mining-compendium/argentina/project/el-pachon" },
  pachon34:{ t:"Diario de Cuyo – Glencore quiere tener El Pachón en producción en 2034 (decisión en 2029)", u:"https://www.diariodecuyo.com.ar/cuyominero/glencore-quiere-tener-en-produccion-el-pachon-en-2034-y-planea-construir-desde-2029-1808768.html" },
  bhp26:   { t:"BHP – Resultados del ejercicio al 30-jun-2026: EBITDA US$ 32.900 M (cobre 54%), 1.953 kt de cobre", u:"https://www.bhp.com/news/media-centre/releases/2026/08/bhp-results-for-the-full-year-ended-30-june-2026" },
  lun25:   { t:"Lundin Mining – Resultados 2025: ingresos de operaciones continuas US$ 4.053 M, EBITDA US$ 1.920 M", u:"https://lundinmining.com/news/lundin-mining-reports-fourth-quarter-and-full-year-2025-results" },
  lun26g:  { t:"Lundin Mining – Producción 2025 (331.232 t de cobre) y guía 2026", u:"https://lundinmining.mediaroom.com/2026-01-21-Lundin-Mining-Announces-2025-Production-Results-and-2026-Guidance?asPDF=1" },
  vicTR:   { t:"Lundin Mining – Informe técnico de Vicuña (mar-2026): VAN US$ 9.500 M; US$ 28.800 M a precios spot", u:"https://lundinmining.mediaroom.com/2026-03-30-Lundin-Mining-Files-Vicuna-Project-Technical-Report?asPDF=1" },
  mux25:   { t:"McEwen – Resultados 2025: ingresos US$ 197,6 M (excluye el 49% de San José); meta de 250–300 mil GEO en 2030", u:"https://seekingalpha.com/pr/20434345" },
  muxLA:   { t:"McEwen – Factibilidad de Los Azules (oct-2025) y participación de McEwen en McEwen Copper (≈ 46%)", u:"https://www.sec.gov/Archives/edgar/data/314203/000110465925098399/tm2528426d1_ex99-1.htm" },
  muxCap:  { t:"Capitalización bursátil de McEwen (MUX), 2026", u:"https://stockanalysis.com/stocks/mux/market-cap/" },
  brk25:   { t:"Barrick – Resultados 2025: ingresos US$ 16.960 M, 3,26 Moz de oro; Veladero 50%", u:"https://www.sec.gov/Archives/edgar/data/756894/000119312526039501/d10712dex991.htm" },
  brk40f:  { t:"Barrick – Formulario 40-F 2025: Veladero (50%) y guía 2026 de 180–200 mil oz atribuibles", u:"https://www.sec.gov/Archives/edgar/data/756894/000119312526079253/d833573dex994.htm" },
  gan25:   { t:"Ganfeng Lithium – Resultados 2025: ingresos RMB 23.080 M, ganancia neta RMB 1.613 M", u:"https://news.metal.com/en/newscontent/103834161-Ganfeng-Lithium-2025-Net-Profit-Reaches-1613-Billion-Yuan-Turning-Loss-into-Profit" },
  lar25:   { t:"Lithium Argentina – Resultados 2025: Cauchari-Olaroz 34.100 t; participaciones en Minera Exar y PPG", u:"https://lithiumargentina.gcs-web.com/news-releases/news-release-details/lithium-argentina-reports-fourth-quarter-and-full-year-2025" },
  zij25:   { t:"Zijin Mining – Resultados 2025: ingresos RMB 349.079 M; 25,5 kt LCE; metas de litio 2026 y 2028", u:"https://gna.org.gh/2026/03/zijin-posts-7-4b-profit-expands-global-output/" },
  zij28:   { t:"Zijin Mining – Metas 2028: 270–320 kt LCE", u:"https://filingreader.com/news-wire/hongkong/2026-02-09/zijin-mining-sets-2028-production-goals-and-2035-green-vision" },
  pos25:   { t:"POSCO Holdings – Ventas 2025 de KRW 69,1 billones; arranque comercial de POSCO Argentina", u:"https://newsroom.posco.com/en/posco-holdings-posts-krw-69-trillion-in-2025-sales-eyes-profit-rebound-with-lithium-production-and-overseas-steel-expansion/" },
  ypf25:   { t:"YPF – Resultados 2025: ingresos US$ 18.400 M, EBITDA ajustado ≈ US$ 5.000 M, shale 165 mil bbl/d", u:"https://www.sec.gov/Archives/edgar/data/904851/000119312526078200/d118508d6k.htm" },
  vis25:   { t:"Vista Energy – Formulario 20-F 2025: EBITDA ajustado ≈ US$ 1.600 M (margen 64%), 115.479 boe/d", u:"https://www.sec.gov/Archives/edgar/data/0001762506/000119312526187099/d936340d20f.htm" },
  pam25:   { t:"Pampa Energía – Resultados del ejercicio 2025 y 4T 2025", u:"https://seekingalpha.com/pr/20420436" },
  golArg:  { t:"Golar LNG – Backlog de US$ 13.700 M por los dos FLNG en Argentina (Hilli US$ 285 M/año, MK II US$ 400 M/año)", u:"https://www.oedigital.com/news/528965-golar-lng-locks-in-13-7b-flng-backlog-with-landmark-argentina-deals" },
  golCP:   { t:"Golar LNG – Condiciones cumplidas del contrato de 20 años del MK II con Southern Energy", u:"https://seekingalpha.com/pr/20276657-satisfaction-of-conditions-precedent-for-20-year-charter-of-mk-ii-flng-to-southern-energy-in" },
  sesaSoc: { t:"Enerdata – Southern Energy: PAE 30%, YPF 25%, Pampa 20%, Harbour 15%, Golar 10%", u:"https://www.enerdata.net/publications/daily-energy-news/southern-energy-flng-export-project-partners-reach-fid-argentina.html" },
  sefe:    { t:"El Litoral – Southern Energy y SEFE (Alemania): 2 Mt/año de GNL desde fines de 2027", u:"https://www.ellitoral.com/economia/acuerdo-exportacion-gnl-argentina-alemania-vacamuerta-southernenergy-sefe_0_jX0eXFdHU4.html" },
  gualcaE: { t:"Mineros S.A. vendió Minas Argentinas (Gualcamayo) a Eris LLC (2023)", u:"https://www.mining-technology.com/news/mineros-divest-gualcamayo-property" },
  caem26:  { t:"CAEM – Informe productivo 2026: oro 1,184 Moz y plata 22,1 Moz en 2025; litio 116 kt LCE", u:"https://caem.com.ar/storage/2026/05/informe-productivo-caem-2026.pdf" },
  usgs26:  { t:"USGS – Mineral Commodity Summaries 2026 (producción mundial de litio, cobre, oro y plata)", u:"https://pubs.usgs.gov/publication/mcs2026" },
  ei25:    { t:"Energy Institute – Statistical Review of World Energy (producción mundial de petróleo, gas y comercio de GNL)", u:"https://www.energyinst.org/statistical-review" }
};

// ---------------- EMPRESAS ----------------
const CIR_EMP = {
  // =================== MINERÍA ===================
  riotinto: { n:"Rio Tinto", sec:"mi", emp:"riotinto", hq:{c:"Londres / Melbourne", ll:[51.51,-0.13]},
    perfil:"Segunda minera del mundo. El hierro de Pilbara (Australia) sigue siendo el corazón del negocio; el cobre y el litio son la apuesta de crecimiento.",
    met:"ing", base:{v:57600, per:"2025", s:"rt25"}, hoy:{v:422, t:"46 kt LCE atribuibles × US$ 9.173/t (precio promedio 2025)", s:"rt25", est:true},
    ar:[
      { id:"mi-rincon-2", n:"Rincón", part:100, prod:{lce:60000}, rigi:"aprobado", ini:2028, t:"US$ 2.500 M; planta de 50 kt desde 2028 y 3 años de rampa", s:"rtRinc" },
      { id:"mi-fenix", n:"Fénix (con la ampliación 1B)", part:100, prod:{lce:38000}, rigi:"aprobado", ini:2026, t:"De 28.500 a 38.000 t/año (Res. ME 431/2026)", s:"bo431_26" },
      { id:"mi-olaroz", n:"Olaroz", part:66.5, prod:{lce:42500}, rigi:"no", ini:2015, t:"Rio Tinto 66,5%, Toyota Tsusho 25%, JEMSE 8,5%", s:"rtQ2" },
      { id:"mi-sdv", n:"Sal de Vida", part:100, prod:{lce:15000}, rigi:"presentado", ini:2026, t:"Primera producción en el 2T 2026", s:"rtH126" }
    ],
    mundo:[["Pilbara",[-22.6,117.8],"Mineral de hierro","Principal fuente de caja del grupo"],["Simandou",[8.6,-8.9],"Mineral de hierro","Guinea, arrancó en 2025"],["Oyu Tolgoi",[43.0,106.85],"Cobre","Mongolia, subterránea"],["Escondida (30%)",[-24.27,-69.07],"Cobre","Chile, operada por BHP"],["Kennecott",[40.52,-112.15],"Cobre","EE.UU."],["Saguenay",[48.42,-71.07],"Aluminio","Canadá"],["Nemaska / Bécancour",[51.68,-76.0],"Litio","Canadá; obra desacelerada en 2026"],["Jadar",[44.5,19.2],"Litio","Serbia, frenado"]],
    claves:[
      "La Argentina ya es casi todo el litio de Rio Tinto: con Mt Cattlin (Australia) parado, las 46 kt atribuibles de 2025 salieron de Fénix y Olaroz.",
      "Con Rincón, Fénix, Olaroz y Sal de Vida a régimen suma ≈ 141 kt LCE atribuibles: alrededor del 70% de su meta de 200 kt de capacidad hacia 2028.",
      "Aun así, el litio argentino pesa poco en el total: entre 3% y 5% de los ingresos del grupo, según el precio. El hierro sigue mandando.",
      "Además tiene una participación en McEwen Copper (Los Azules) a través de Nuton, su unidad de lixiviación de cobre."
    ] },

  glencore: { n:"Glencore", sec:"mi", emp:"glencore", hq:{c:"Baar, Suiza", ll:[47.2,8.53]},
    perfil:"Minera y comercializadora de materias primas: cobre, cobalto, zinc, níquel, carbón y un brazo de trading que mueve volúmenes de terceros.",
    met:"cu", metN:"cobre propio", base:{v:851.6, per:"2025", s:"glen25"}, hoy:{v:0, t:"Sin producción de cobre en la Argentina hoy (Alumbrera cerró en 2018 y vuelve hacia 2028)", s:"glenCMD"},
    meta:{v:1600, t:"Objetivo 2035: ≈ 1,6 Mt de cobre", s:"glenCMD"},
    ar:[
      { id:"mi-pachon", n:"El Pachón", part:100, prod:{cu:338000, mo:6600}, rigi:"en_evaluacion", ini:2034, t:"Decisión en 2029; Glencore busca un socio minoritario", s:"pachonPM" },
      { id:"mi-mara", n:"MARA (Agua Rica – Alumbrera)", part:100, prod:{cu:150000, au:101700, ag:1790000, mo:4340}, rigi:"aprobado", ini:2031, t:"Promedio de 23 años según la Res. ME 1854/2026; más de 200 kt en los mejores años. Glencore compró el 56,25% de Pan American Silver", s:"bo1854_26" }
    ],
    mundo:[["Collahuasi (44%)",[-20.98,-68.64],"Cobre","Chile"],["Antamina (33,75%)",[-9.54,-77.05],"Cobre y zinc","Perú"],["Antapaccay",[-14.97,-71.36],"Cobre","Perú"],["KCC y Mutanda",[-10.7,25.4],"Cobre y cobalto","RDC"],["Mount Isa",[-20.73,139.49],"Cobre y zinc","Australia"],["Cerrejón",[11.1,-72.6],"Carbón","Colombia"]],
    claves:[
      "Glencore no produce cobre en la Argentina hoy, pero el país es la base de su plan de crecimiento: El Pachón y MARA suman ≈ 490 kt/año.",
      "Eso equivale a un 30% de su objetivo de 1,6 Mt de cobre para 2035: ningún otro país le agrega tanto cobre nuevo.",
      "La reapertura de Alumbrera (producción desde 2028) funciona como puente y como planta para MARA."
    ] },

  bhp: { n:"BHP", sec:"mi", emp:"bhp", hq:{c:"Melbourne", ll:[-37.81,144.96]},
    perfil:"La mayor minera del mundo. El cobre ya aporta más de la mitad de su EBITDA (54% en el ejercicio 2026).",
    met:"cu", metN:"cobre", base:{v:1953, per:"ejercicio a jun-2026", s:"bhp26"}, hoy:{v:0, t:"Sin producción en la Argentina hoy", s:"bhp26"},
    ar:[
      { id:"mi-vicuna", n:"Vicuña (50%, con Lundin)", part:50, prod:{cu:395000, au:711000, ag:22200000}, rigi:"aprobado", ini:2030, t:"Promedio de los primeros 25 años (estudio de 2026). Decisión de construcción posible a fines de 2026", s:"vicPEA" }
    ],
    mundo:[["Escondida (57,5%)",[-24.27,-69.07],"Cobre","Chile: la mayor mina de cobre del mundo"],["Spence",[-22.8,-69.25],"Cobre","Chile"],["Olympic Dam",[-30.44,136.88],"Cobre, uranio y oro","Australia"],["Antamina (33,75%)",[-9.54,-77.05],"Cobre y zinc","Perú"],["Pilbara (WAIO)",[-23.36,119.73],"Mineral de hierro","Australia"],["Jansen",[51.8,-104.7],"Potasa","Canadá, en construcción"]],
    claves:[
      "Vicuña le agregaría ≈ 200 kt/año de cobre: cerca del 10% de su producción actual, y más a medida que baja la ley de Escondida (guía 2027: 1.650–1.800 kt).",
      "Es su principal proyecto de cobre nuevo fuera de Chile y Australia, en la misma franja andina que Escondida."
    ] },

  lundin: { n:"Lundin Mining", sec:"mi", emp:"lundin", hq:{c:"Vancouver / Toronto", ll:[49.28,-123.12]},
    perfil:"Productora mediana de cobre con minas en Chile y Brasil. Vicuña es su proyecto transformador.",
    met:"ing", base:{v:4053, per:"2025 (operaciones continuas)", s:"lun25"}, hoy:{v:0, t:"Sin ingresos en la Argentina hoy", s:"lun25"},
    ar:[
      { id:"mi-vicuna", n:"Vicuña (50%, con BHP)", part:50, prod:{cu:395000, au:711000, ag:22200000}, rigi:"aprobado", ini:2030, t:"Inversión de la etapa 1: US$ 7.100 M (100%)", s:"vicPEA" }
    ],
    mundo:[["Candelaria",[-27.51,-70.29],"Cobre y oro","Chile"],["Caserones",[-28.04,-69.55],"Cobre y molibdeno","Chile"],["Chapada",[-14.13,-49.38],"Cobre y oro","Brasil"]],
    claves:[
      "Es el caso más extremo de las grandes: la mitad de Vicuña generaría ingresos del mismo tamaño que toda la Lundin de hoy.",
      "En 2025 produjo 331 kt de cobre; su parte de Vicuña suma ≈ 198 kt de cobre, 355 mil oz de oro y 11 Moz de plata por año.",
      "A precios de 2026 el valor del proyecto se triplica (VAN de US$ 28.800 M contra US$ 9.500 M en el caso base): el precio del cobre define a la empresa."
    ] },

  mcewen: { n:"McEwen (McEwen Mining)", sec:"mi", emp:"mcewen", hq:{c:"Toronto", ll:[43.65,-79.38]},
    perfil:"Productora chica de oro y plata (Nevada, Ontario, México y el 49% de San José en Santa Cruz) que controla ≈ 46% de McEwen Copper, dueña de Los Azules.",
    met:"ing", base:{v:341, per:"2025: US$ 197,6 M consolidados + ≈ US$ 143 M del 49% de San José", s:"mux25", est:true},
    hoy:{v:143, t:"49% de San José (Santa Cruz, operada por Hochschild): ≈ 42 mil oz equivalentes × US$ 3.400", s:"hocH1", est:true},
    ar:[
      { id:"mi-azules", n:"Los Azules (vía McEwen Copper, ≈ 46,3%)", part:46.3, prod:{cu:148200}, rigi:"aprobado", ini:2030, t:"Cátodos de cobre SX-EW; 205 kt/año los primeros 5 años", s:"azulFS" },
      { id:"mi-sj", n:"San José (49%)", part:49, fijo:143, rigi:"no", ini:2008, t:"Oro y plata; se mantiene a la cifra de 2025", s:"hocH1", est:true }
    ],
    mundo:[["Gold Bar",[39.8,-116.3],"Oro","Nevada, EE.UU."],["Fox Complex y Stock",[48.48,-81.33],"Oro","Timmins, Canadá"],["El Gallo / Fénix",[25.7,-107.9],"Oro y plata","Sinaloa, México"]],
    claves:[
      "Los Azules convierte a una productora de oro chica en una empresa de cobre: su parte del proyecto generaría ≈ 2 veces los ingresos de todo el grupo hoy.",
      "Con San José, la Argentina pasaría a ser ≈ 80% del negocio económico de McEwen.",
      "El VAN atribuible de Los Azules (46,3% de US$ 2.940 M ≈ US$ 1.360 M) supera la capitalización bursátil de McEwen (≈ US$ 1.100–1.300 M en 2026): el mercado descuenta riesgo de ejecución y de financiamiento.",
      "Su parte de la inversión inicial (≈ US$ 1.470 M de US$ 3.168 M) es mayor que su valor de mercado: por eso el plan de salida a bolsa de McEwen Copper y el ingreso de socios (Stellantis, Nuton/Rio Tinto) diluyen su participación."
    ] },

  barrick: { n:"Barrick", sec:"mi", emp:"barrick", hq:{c:"Toronto", ll:[43.66,-79.40]},
    perfil:"Segunda productora de oro del mundo, con cobre creciente (Lumwana, Reko Diq).",
    met:"ing", base:{v:16960, per:"2025", s:"brk25"}, hoy:{v:790, t:"230 mil oz atribuibles de Veladero × ≈ US$ 3.430/oz", s:"brk40f", est:true},
    ar:[
      { id:"mi-vel", n:"Veladero (50%, con Shandong Gold)", part:50, prod:{au:380000}, rigi:"aprobado", ini:2005, t:"Guía 2026: 180–200 mil oz atribuibles. El RIGI cubre las fases 8 y 9 de lixiviación (+1,63 Moz)", s:"brk40f" }
    ],
    mundo:[["Nevada Gold Mines (61,5%)",[40.8,-116.5],"Oro","EE.UU."],["Pueblo Viejo",[18.95,-70.17],"Oro","Rep. Dominicana"],["Kibali",[3.12,29.58],"Oro","RDC"],["Loulo-Gounkoto",[13.0,-11.45],"Oro","Malí"],["Reko Diq",[29.12,62.07],"Cobre y oro","Pakistán, en construcción"],["Lumwana",[-12.25,25.83],"Cobre","Zambia"]],
    claves:[
      "Veladero aportó ≈ 7% de las onzas de Barrick en 2025 (230 mil de 3,26 Moz) y ≈ 5% de sus ingresos.",
      "El RIGI no es una mina nueva: extiende la vida de Veladero con nuevas pilas de lixiviación."
    ] },

  shandong: { n:"Shandong Gold", sec:"mi", emp:"shandong", hq:{c:"Jinan, China", ll:[36.65,117.0]}, conf:"baja",
    perfil:"Una de las mayores productoras de oro de China; la mayor parte de sus minas están en la península de Jiaodong.",
    met:"oz", metN:"oro", base:{v:1480, per:"producción minera anual, orden de magnitud", s:"brk40f", est:true}, hoy:{v:206, t:"50% de 412 mil oz de Veladero (2025)", s:"pmVel"},
    ar:[ { id:"mi-vel", n:"Veladero (50%, con Barrick)", part:50, m:190, rigi:"aprobado", ini:2005, t:"Mitad de la guía 2026", s:"brk40f", est:true } ],
    mundo:[["Minas de Jiaodong",[37.4,120.4],"Oro","Shandong, China"],["Namdini",[10.6,-0.63],"Oro","Ghana"]],
    claves:[ "Veladero es su principal activo fuera de China: del orden de una de cada siete onzas que produce (estimación con baja confianza: Shandong Gold no publica el desglose en inglés)." ] },

  ganfeng: { n:"Ganfeng Lithium", sec:"mi", emp:"ganfeng", hq:{c:"Xinyu, China", ll:[27.82,114.92]},
    perfil:"Integrada del salar a la batería: minas y salares en Argentina, Australia, Malí y China, plantas químicas y fábricas de baterías.",
    met:"ing", base:{v:3210, per:"2025 (RMB 23.080 M)", s:"gan25"}, hoy:{v:146, t:"46,7% de las 34.100 t de Cauchari-Olaroz × US$ 9.173 (no incluye Mariana, sin dato publicado)", s:"lar25", est:true},
    ar:[
      { id:"mi-co", n:"Cauchari-Olaroz (46,7%)", part:46.7, prod:{lce:85000}, rigi:"aprobado", ini:2023, t:"Ampliación de 40 a 85 kt/año desde dic-2028", s:"bo825_26" },
      { id:"mi-mariana", n:"Mariana (100%)", part:100, prod:{lce:17000}, rigi:"no", ini:2025, t:"20 kt de cloruro de litio ≈ 17 kt LCE", s:"ganMar", est:true }
    ],
    mundo:[["Goulamina",[11.3,-7.1],"Litio (espodumeno)","Malí"],["Mt Marion",[-31.13,121.47],"Litio (espodumeno)","Australia"],["Plantas de Xinyu",[27.82,114.92],"Químicos de litio y baterías","China"]],
    claves:[
      "Argentina es su base de salmuera: con la ampliación de Cauchari-Olaroz y Mariana sería ≈ 20% de sus ingresos a precios de referencia.",
      "Con Lithium Argentina planea además el polo Pozuelos-Pastos Grandes (hasta 150 kt/año en tres fases), todavía sin decisión de inversión."
    ] },

  lar: { n:"Lithium Argentina", sec:"mi", emp:"lar", hq:{c:"Zug, Suiza", ll:[47.17,8.52]}, local:true,
    perfil:"Empresa pura de litio argentino: 44,8% de Cauchari-Olaroz y la mayoría de los proyectos del polo PPG en Salta.",
    met:"ing", base:{v:140, per:"2025: 44,8% de Cauchari-Olaroz (valor económico, no consolidado)", s:"lar25", est:true}, hoy:{v:140, t:"Todo su negocio es argentino", s:"lar25", est:true},
    ar:[ { id:"mi-co", n:"Cauchari-Olaroz (44,8%)", part:44.8, prod:{lce:85000}, rigi:"aprobado", ini:2023, t:"Etapa 2: +45 kt/año", s:"larQ2" } ],
    mundo:[],
    claves:[ "100% Argentina. Su valor depende de dos variables: el precio del litio y la ejecución de la etapa 2 y de PPG." ] },

  zijin: { n:"Zijin Mining", sec:"mi", emp:"zijin", hq:{c:"Longyan / Xiamen, China", ll:[24.48,118.09]},
    perfil:"Gigante chino de cobre, oro y zinc con minas en cuatro continentes; el litio es su vertical más nueva.",
    met:"ing", base:{v:48550, per:"2025 (RMB 349.079 M)", s:"zij25"}, hoy:{v:0, t:"3Q entró en puesta en marcha a fines de 2025", s:"zij25"},
    ar:[ { id:"mi-3q", n:"Tres Quebradas – 3Q (Liex)", part:100, prod:{lce:40000}, rigi:"aprobado", ini:2026, t:"40 kt/año por extracción directa según la Res. ME 1153/2026", s:"bo1153_26" } ],
    mundo:[["Kamoa-Kakula (39,6%)",[-10.75,25.25],"Cobre","RDC"],["Bor y Čukaru Peki",[44.08,22.1],"Cobre y oro","Serbia"],["Julong",[29.6,91.2],"Cobre","Tíbet"],["Manono",[-7.3,27.4],"Litio","RDC"],["Lagocuo",[32.0,84.0],"Litio (salar)","Tíbet"],["Buriticá",[6.72,-75.9],"Oro","Colombia"]],
    claves:[
      "Para Zijin la Argentina es chica en ingresos (≈ 1%), pero 3Q es ≈ 13–15% de su meta de litio para 2028 (270–320 kt LCE).",
      "Es su única operación de salmuera fuera de China."
    ] },

  posco: { n:"POSCO Holdings", sec:"mi", emp:"posco", hq:{c:"Seúl / Pohang, Corea", ll:[36.02,129.37]},
    perfil:"Siderúrgica coreana que se integra hacia los materiales de batería (cátodos, ánodos, litio).",
    met:"ing", base:{v:48660, per:"2025 (KRW 69,1 billones)", s:"pos25"}, hoy:{v:0, t:"La planta 1 entró en producción comercial en 2026", s:"pos25"},
    ar:[
      { id:"mi-sal-de-oro", n:"Sal de Oro I (hidróxido en Güemes)", part:100, prod:{lce:22000}, rigi:"no", ini:2025, t:"25 kt/año de hidróxido ≈ 22 kt LCE", s:"posco", est:true },
      { id:"mi-sal-de-oro", n:"Sal de Oro II (carbonato)", part:100, prod:{lce:23000}, rigi:"aprobado", ini:2026, t:"Res. ME 1157/2026", s:"bo1157_26" }
    ],
    mundo:[["Pohang",[36.02,129.37],"Acero","Corea"],["Gwangyang",[34.9,127.7],"Acero e hidróxido de litio","Corea"],["Pilgangoora (participación)",[-21.0,118.9],"Litio (espodumeno)","Australia"]],
    claves:[ "En ingresos la Argentina es ≈ 1%, pero es la única fuente de litio de salmuera propia de POSCO y la base de su integración en materiales de batería." ] },

  galan: { n:"Galan Lithium", sec:"mi", emp:"galan", hq:{c:"Perth, Australia", ll:[-31.95,115.86]}, local:true,
    perfil:"Junior australiana con un solo activo productivo: Hombre Muerto Oeste.",
    met:"ing", base:{v:0, per:"2025", s:"galan"}, hoy:{v:0, t:"Primer concentrado en 2026", s:"galan"},
    ar:[ { id:"mi-hmo", n:"Hombre Muerto Oeste", part:100, prod:{lce:12000}, rigi:"aprobado", ini:2026, t:"12 kt LCE según la resolución; vende concentrado de cloruro, con descuento frente al carbonato (cota superior)", s:"bo1271_25" } ],
    mundo:[], claves:[ "100% Argentina: toda la empresa es este proyecto." ] },

  abra: { n:"AbraSilver", sec:"mi", emp:"abra", hq:{c:"Toronto", ll:[43.64,-79.37]}, local:true,
    perfil:"Desarrolladora canadiense con un solo proyecto: Diablillos (plata y oro).",
    met:"ing", base:{v:0, per:"2025", s:"abraDFS"}, hoy:{v:0, t:"Sin producción", s:"abraDFS"},
    ar:[ { id:"mi-diablillos", n:"Diablillos", part:100, prod:{ag:13900000, au:89000}, rigi:"aprobado", ini:2029, t:"Primeros 5 años", s:"abraDFS" } ],
    mundo:[], claves:[ "100% Argentina." ] },

  minasarg: { n:"Minas Argentinas (Eris LLC)", sec:"mi", emp:"minasarg", hq:{c:"Eris LLC (EE.UU.), con base en Mendoza", ll:[-32.89,-68.84]}, local:true,
    perfil:"Dueña de Gualcamayo desde 2023, cuando Mineros S.A. (Colombia) la vendió a Eris LLC.",
    met:null, ar:[ { id:"mi-gualca", n:"Nuevo Gualcamayo (Carbonatos Profundos)", part:100, rigi:"aprobado", ini:2029, t:"Reservas de 2,45 Moz; sin cifra anual publicada", s:"gualca" } ],
    mundo:[], claves:[ "Privada y 100% argentina en operaciones." ], fuentes:["gualcaE"] },

  psj: { n:"PSJ Cobre Mendocino", sec:"mi", emp:"psj", hq:{c:"Mendoza", ll:[-32.89,-68.84]}, local:true,
    perfil:"Proyecto de cobre y oro en Uspallata (Minera San Jorge).",
    met:null, ar:[ { id:"mi-psj", n:"PSJ Cobre Mendocino", part:100, rigi:"aprobado", ini:2029, t:"≈ 40 kt/año de concentrado de cobre; US$ 559 M de inversión inicial", s:"psjDIA" } ],
    mundo:[], claves:[ "Proyecto de un solo activo." ] },

  // =================== ENERGÍA ===================
  ypf: { n:"YPF", sec:"og", emp:"ypf", hq:{c:"Buenos Aires", ll:[-34.6,-58.38]}, local:true,
    perfil:"Petrolera integrada con control estatal. Todo su negocio está en la Argentina: el RIGI ordena su salto exportador.",
    met:"ing", base:{v:18400, per:"2025", s:"ypf25"}, hoy:{v:0, t:"Los proyectos se suman a la base: todo YPF es argentino", s:"ypf25"},
    ar:[
      { id:"og-bdt", n:"Bajo del Toro (65%)", part:65, prod:{bbld:80000}, rigi:"presentado", ini:2027, t:"Meseta de ≈ 80 mil bbl/d entre 2033 y 2040", s:"ypfBdT" },
      { id:"og-lng", n:"Southern Energy – FLNG (25%)", part:25, prod:{gnl:5.95}, rigi:"aprobado", ini:2027, t:"Hilli (2,45 Mtpa) + MK II (3,5 Mtpa)", s:"sesaSoc" },
      { id:"og-arglng", n:"Argentina LNG (con Eni y XRG)", part:null, prod:{gnl:12}, rigi:"presentado", ini:2031, t:"Participación de YPF no informada: se muestra el proyecto completo, fuera de la suma", s:"ypfArgLNG" },
      { id:"ln-vmos", n:"VMOS – oleoducto de exportación", part:null, rigi:"aprobado", ini:2027, t:"YPF es el accionista líder; el valor está en evacuar crudo, no en la tarifa", s:"bo302_25" }
    ],
    mundo:[], claves:[
      "Para YPF el RIGI no cambia el país sino el destino: Bajo del Toro y su parte de Southern Energy sumarían ≈ 9% a sus ingresos de 2025.",
      "Argentina LNG (US$ 51.000 M, ≈ US$ 10.000 M de exportaciones por año) es el proyecto más grande pedido al régimen; con él YPF pasaría a ser exportadora de gas a escala."
    ] },

  vista: { n:"Vista Energy", sec:"og", emp:"vista", hq:{c:"Ciudad de México (opera en Neuquén)", ll:[19.43,-99.13]}, local:true,
    perfil:"Petrolera de shale fundada por Miguel Galuccio; cotiza en Nueva York y México, y opera sólo en Vaca Muerta.",
    met:"ing", base:{v:2480, per:"2025 (estimado: EBITDA de US$ 1.600 M con margen de 64–65%)", s:"vis25", est:true}, hoy:{v:0, t:"Los proyectos se suman a la base", s:"vis25"},
    ar:[ { id:"og-bdt", n:"Bajo del Toro (35%, con YPF)", part:35, prod:{bbld:80000}, rigi:"presentado", ini:2027, t:"Su parte de la meseta: ≈ 28 mil bbl/d", s:"ypfBdT" } ],
    mundo:[], claves:[ "Su 35% de Bajo del Toro equivale a ≈ 20% de sus ingresos proyectados; además es accionista de VMOS, que le da salida exportadora." ] },

  pampa: { n:"Pampa Energía", sec:"og", emp:"pampa", hq:{c:"Buenos Aires", ll:[-34.61,-58.36]}, local:true,
    perfil:"Generación eléctrica, gas y petróleo, petroquímica y participación en TGS y Transener. El RIGI la empuja a ser exportadora.",
    met:"ing", base:{v:1800, per:"2025 (orden de magnitud)", s:"pam25", est:true}, hoy:{v:300, t:"Rincón de Aranda en 2025 (≈ 12 mil bbl/d promedio)", s:"pam25", est:true},
    ar:[
      { id:"og-rda", n:"Rincón de Aranda", part:100, prod:{bbld:45000}, rigi:"aprobado", ini:2025, t:"Meta de 45 mil bbl/d en 2027; 20.117 bbl/d en ago-2026", s:"bo1025_26" },
      { id:"ag-fertilpampa", n:"Fértil Pampa – urea", part:100, prod:{urea:1980000}, rigi:"aprobado", ini:2030, t:"Dos plantas de 3.000 t/día (330 días al año)", s:"bo1468_26", est:true },
      { id:"og-lng", n:"Southern Energy – FLNG (20%)", part:20, prod:{gnl:5.95}, rigi:"aprobado", ini:2027, t:"", s:"sesaSoc" }
    ],
    mundo:[], claves:[
      "Es la empresa local más transformada por el RIGI: los tres proyectos serían más de la mitad de sus ingresos proyectados.",
      "Pasa de vender electricidad y gas en el mercado interno a exportar petróleo, GNL y urea."
    ] },

  pluspetrol: { n:"Pluspetrol", sec:"og", emp:"pluspetrol", hq:{c:"Buenos Aires", ll:[-34.59,-58.39]}, local:true, localT:"La base es sólo lo que opera en la Argentina; Perú (Camisea) queda afuera",
    perfil:"Petrolera privada de origen argentino que opera Camisea (Perú) y compró los activos de ExxonMobil en Vaca Muerta.",
    met:"kboe", metN:"producción operada en la Argentina", base:{v:192, per:"ago-2026: 94,9 mil bbl/d + 16,5 MMm³/d de gas", s:"cap4"}, hoy:{v:62, t:"Bajo del Choique – La Invernada en ago-2026 (46,6 mil bbl/d + 2,55 MMm³/d)", s:"cap4"},
    ar:[ { id:"og-bdc", n:"Bajo del Choique – La Invernada", part:100, m:85, rigi:"aprobado", ini:2025, t:"Etapa 1: hasta 50 mil bbl/d + 6 MMm³/d (≈ 85 mil boe/d) a 100% del área", s:"bo1808_26" } ],
    mundo:[["Camisea",[-11.8,-72.8],"Gas y líquidos","Perú (operadora)"]],
    claves:[ "La etapa 1 de Bajo del Choique sería ≈ 40% de lo que opera en la Argentina; Perú (Camisea) queda fuera de este cálculo." ] },

  golar: { n:"Golar LNG", sec:"og", emp:"golar", hq:{c:"Hamilton, Bermudas", ll:[32.29,-64.78]},
    perfil:"Dueña y operadora de buques de licuefacción (FLNG). Tiene tres: Gimi (Mauritania-Senegal), Hilli y MK II, los dos últimos para la Argentina.",
    met:"bk", metN:"backlog de EBITDA de sus FLNG", base:{v:3.3, per:"Gimi (resto del backlog de US$ 17.000 M)", s:"golArg", est:true}, hoy:{v:0, t:"Hilli llega desde Camerún", s:"golArg"},
    ar:[
      { id:"og-lng", n:"Hilli Episeyo (20 años)", part:100, m:5.7, rigi:"aprobado", ini:2027, t:"≈ US$ 285 M de EBITDA por año", s:"golArg" },
      { id:"og-lng", n:"MK II (20 años)", part:100, m:8.0, rigi:"aprobado", ini:2028, t:"≈ US$ 400 M de EBITDA por año; más 10% de Southern Energy", s:"golCP" }
    ],
    mundo:[["Gimi",[14.9,-17.5],"GNL","Mauritania-Senegal (BP)"],["Hilli (hoy)",[2.6,9.6],"GNL","Camerún, sale hacia la Argentina"]],
    claves:[
      "La Argentina es ≈ 80% del backlog de EBITDA de Golar: es, proporcionalmente, la empresa global más expuesta al RIGI.",
      "Además cobra un extra cuando el GNL vale más de US$ 8/MMBtu: ≈ US$ 100 M por año por cada dólar por encima."
    ] },

  // ---- sin cálculo: participaciones sin cifra pública suficiente ----
  tecpetrol: { n:"Tecpetrol (Grupo Techint)", sec:"og", emp:"tecpetrol", hq:{c:"Buenos Aires", ll:[-34.6,-58.37]}, met:null,
    perfil:"Petrolera del Grupo Techint (también Tenaris y Ternium). Opera en Argentina, Colombia, Ecuador, Perú, Bolivia y México.",
    ar:[ { id:"og-ltoldos", n:"Los Toldos II Este", part:null, rigi:"aprobado", ini:2027, t:"US$ 6.432 M, 380 pozos, programa hasta 2054", s:"bo1771_26" } ],
    mundo:[["Llanos",[4.5,-72.5],"Petróleo","Colombia"],["Camisea (10%)",[-11.8,-72.8],"Gas","Perú"],["Ipati-Aquío",[-20.4,-63.6],"Gas","Bolivia"]],
    claves:[ "Fortín de Piedra (gas) y Los Toldos II Este (petróleo) hacen de Vaca Muerta su núcleo; Tenaris le provee tubos y Techint construye: el circuito queda dentro del grupo." ] },

  pae: { n:"Pan American Energy", sec:"og", emp:"pae", hq:{c:"Buenos Aires", ll:[-34.59,-58.37]}, met:null,
    perfil:"Privada: 50% BP y 50% Bridas (familia Bulgheroni y CNOOC). Opera en Argentina, Bolivia y México.",
    ar:[
      { id:"og-lng", n:"Southern Energy – FLNG (30%)", part:30, rigi:"aprobado", ini:2027, t:"Socio mayor del consorcio", s:"sesaSoc" },
      { id:"ln-gsm", n:"Gasoducto dedicado San Matías (SMP)", part:null, rigi:"aprobado", ini:2028, t:"US$ 1.300 M, 27 MMm³/d", s:"bo873_26" }
    ],
    mundo:[["Caipipendi",[-20.6,-63.4],"Gas","Bolivia"],["Hokchi",[18.6,-92.6],"Petróleo","México"]],
    claves:[ "A través de PAE, BP tiene exposición indirecta al GNL argentino: es dueña de la mitad del mayor socio de Southern Energy." ] },

  harbour: { n:"Harbour Energy", sec:"og", emp:"harbour", hq:{c:"Londres", ll:[51.49,-0.1]}, met:null,
    perfil:"Petrolera británica que heredó los activos argentinos de Wintershall Dea (Aguada Pichana Este, San Roque, Cuenca Marina Austral).",
    ar:[ { id:"og-lng", n:"Southern Energy – FLNG (15%)", part:15, rigi:"aprobado", ini:2027, t:"", s:"sesaSoc" } ],
    mundo:[["Mar del Norte",[57.5,1.5],"Petróleo y gas","Reino Unido"],["Noruega",[61.0,2.5],"Petróleo y gas","Noruega"],["Zama",[18.8,-93.6],"Petróleo","México"]],
    claves:[ "Aporta gas de sus áreas en Neuquén y Tierra del Fuego y queda expuesta al precio internacional del GNL." ] },

  eni: { n:"Eni", sec:"og", emp:"eni", hq:{c:"Roma / San Donato Milanese", ll:[45.42,9.27]}, met:null,
    perfil:"Petrolera italiana con experiencia en FLNG (Coral Sul en Mozambique, Congo LNG).",
    ar:[ { id:"og-arglng", n:"Argentina LNG (con YPF y XRG)", part:null, rigi:"presentado", ini:2031, t:"12 Mtpa en dos FLNG", s:"ypfArgLNG" } ],
    mundo:[["Coral Sul FLNG",[-10.9,40.9],"GNL","Mozambique"],["Congo LNG",[-4.8,11.8],"GNL","Congo"],["Zohr",[31.9,31.5],"Gas","Egipto"]],
    claves:[ "Aporta la tecnología y la experiencia en licuefacción flotante que el proyecto necesita." ] },

  xrg: { n:"XRG (ADNOC)", sec:"og", emp:"xrg", hq:{c:"Abu Dabi", ll:[24.45,54.38]}, met:null,
    perfil:"Brazo inversor internacional de la petrolera estatal de Abu Dabi, enfocado en gas y química.",
    ar:[ { id:"og-arglng", n:"Argentina LNG (con YPF y Eni)", part:null, rigi:"presentado", ini:2031, t:"", s:"ypfArgLNG" } ],
    mundo:[["Rio Grande LNG",[25.95,-97.3],"GNL","EE.UU."],["Área 4 de Mozambique",[-10.8,40.6],"GNL","Mozambique"]],
    claves:[ "Capital del Golfo Pérsico entrando al GNL de Vaca Muerta: diversificación del portafolio de gas de ADNOC." ] },

  tgs: { n:"TGS", sec:"og", emp:"tgs", hq:{c:"Buenos Aires", ll:[-34.62,-58.4]}, local:true, met:null,
    perfil:"Transporta el 60% del gas del país y procesa líquidos en Bahía Blanca.",
    ar:[ { id:"ln-gpm", n:"Ampliación del Gasoducto Perito Moreno", part:100, rigi:"aprobado", ini:2027, t:"US$ 550 M", s:"bo676_26" } ],
    mundo:[], claves:[ "100% argentina: el RIGI financia más capacidad para sacar gas de Vaca Muerta hacia el consumo y la exportación." ] }
};

// ---------------- ARGENTINA EN EL MUNDO ----------------
// hoy = participación de la Argentina en la producción mundial; proy = lo que agregaría la cartera, contra el mundo de hoy.
const CIR_PAIS = [
  { k:"li", n:"Litio", hoy:7.6, proy:null, hoyT:"≈ 116–120 kt LCE en 2025 (≈ 22 kt de litio contenido) contra ≈ 290 kt de litio en el mundo", proyT:"573 kt LCE en 2035 si avanzan 15 proyectos: casi 5 veces lo de hoy", s:["caem26","usgs26","litLN"] },
  { k:"cu", n:"Cobre", hoy:0, proy:4.5, hoyT:"Sin producción desde el cierre de Alumbrera (2018)", proyT:"Vicuña, El Pachón, MARA y Los Azules suman ≈ 1 Mt/año: ≈ 4–5% del cobre de mina actual (≈ 23 Mt)", s:["usgs26","vicPEA","pachonPM","bo1854_26","azulFS"] },
  { k:"au", n:"Oro", hoy:1.1, proy:null, hoyT:"1,18 Moz (≈ 37 t) en 2025 contra ≈ 3.300 t en el mundo; la producción cae 42% en una década", proyT:"Nuevas minas (Gualcamayo, Diablillos) compensan sobre todo la caída", s:["caem26","usgs26"] },
  { k:"ag", n:"Plata", hoy:2.7, proy:null, hoyT:"22,1 Moz (≈ 690 t) en 2025 contra ≈ 25.000 t en el mundo", proyT:"Diablillos sumaría ≈ 14 Moz/año en sus primeros años", s:["caem26","usgs26","abraDFS"] },
  { k:"oil", n:"Petróleo", hoy:0.9, proy:null, hoyT:"939 mil bbl/d (ago-2026) contra ≈ 105 millones de bbl/d de líquidos en el mundo", proyT:"La meta de la industria de duplicar el shale hacia 2030 la acercaría a ≈ 1,5%", s:["cap4","ei25","ypfPlan"] },
  { k:"gas", n:"GNL", hoy:0, proy:4.3, hoyT:"Sin exportación de GNL hoy", proyT:"Southern Energy (≈ 6 Mtpa) + Argentina LNG (12 Mtpa) ≈ 4% del comercio mundial actual (≈ 420 Mt)", s:["sesaSoc","ypfArgLNG","ei25"] }
];

// ---------------- CIRCUITO PRODUCTIVO ----------------
// Cadena de valor de cada producto: dónde se agrega valor y quién captura cada eslabón.
const CIR_CADENA = [
  { k:"li", pasos:[
      ["Salmuera en la Puna","Catamarca, Salta, Jujuy · Rio Tinto, Ganfeng, Zijin, POSCO, Galan"],
      ["Carbonato, cloruro o hidróxido","Pozas de evaporación o extracción directa (DLE) en el salar; hidróxido en Güemes (POSCO)"],
      ["Exportación","Por puertos del norte de Chile y por Buenos Aires"],
      ["Cátodos y celdas","China, Corea y Japón (POSCO, Ganfeng); EE.UU. para el concentrado de Galan"],
      ["Batería y auto eléctrico","El mayor margen queda fuera del país"] ],
    dest:[["China",[31.2,121.5]],["Corea",[34.9,127.7]],["Japón",[37.28,141.0]],["EE.UU.",[35.2,-81.3]]], orig:[-24.6,-67.0] },
  { k:"cu", pasos:[
      ["Pórfidos de alta cordillera","San Juan, Catamarca, Mendoza · BHP, Lundin, Glencore, McEwen"],
      ["Concentrado o cátodo","Flotación (Vicuña, MARA, El Pachón) o lixiviación SX-EW con cátodo listo (Los Azules)"],
      ["Exportación","Puertos del Pacífico o del Paraná, según el proyecto"],
      ["Fundición y refinería","El concentrado se funde en China, Japón, Corea, India o Alemania"],
      ["Cables, redes y electrificación","Demanda empujada por redes eléctricas, centros de datos y autos eléctricos"] ],
    dest:[["China",[31.2,121.5]],["Japón",[34.7,135.2]],["Alemania",[53.55,9.99]],["India",[22.3,70.0]]], orig:[-29.5,-69.6] },
  { k:"au", pasos:[
      ["Vetas y diseminados","San Juan, Santa Cruz, Salta · Barrick, Shandong, AbraSilver, McEwen"],
      ["Barras doré","Lixiviación y fundición en la mina"],
      ["Refinación","Refinerías de Suiza y de América del Norte"],
      ["Bancos centrales, inversión y joyería","El oro es el primer producto minero exportado por la Argentina"] ],
    dest:[["Suiza",[46.0,8.95]],["Canadá",[43.65,-79.38]]], orig:[-29.4,-69.9] },
  { k:"oil", pasos:[
      ["Shale de Vaca Muerta","Neuquén · YPF, Vista, Pampa, Pluspetrol, Tecpetrol, Chevron, Shell"],
      ["Tratamiento y transporte","VMOS (437 km) hasta Punta Colorada; oleoducto trasandino a Chile"],
      ["Exportación de crudo","Buques desde Río Negro y Bahía Blanca"],
      ["Refinación en destino","EE.UU., Chile, Brasil, China e India"] ],
    dest:[["EE.UU.",[29.7,-95.0]],["Chile",[-36.8,-73.1]],["Brasil",[-22.9,-43.2]],["China",[22.5,114.0]]], orig:[-38.4,-68.6] },
  { k:"gas", pasos:[
      ["Gas de Vaca Muerta","Neuquén · PAE, YPF, Pampa, Harbour, Tecpetrol"],
      ["Gasoductos dedicados","Perito Moreno (TGS) y el gasoducto a San Matías (SMP)"],
      ["Licuefacción flotante","FLNG de Golar (Southern Energy) y de Eni (Argentina LNG) en el Golfo San Matías"],
      ["Regasificación y consumo","Alemania (SEFE, 2 Mt/año) y Asia"] ],
    dest:[["Alemania",[53.6,8.1]],["Asia",[35.5,139.8]]], orig:[-41.0,-64.9] },
  { k:"ure", pasos:[
      ["Gas natural","Vaca Muerta, por gasoducto a Bahía Blanca"],
      ["Amoníaco y urea","Fértil Pampa en Ingeniero White (≈ 2 Mt/año)"],
      ["Exportación","Puerto de Bahía Blanca"],
      ["Fertilizante para el agro","Brasil, EE.UU. y el propio mercado argentino"] ],
    dest:[["Brasil",[-25.5,-48.5]],["EE.UU.",[29.95,-90.07]]], orig:[-38.78,-62.27] }
];
