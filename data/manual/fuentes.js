// Fuentes citadas: cada dato del sitio referencia una clave de SRC.
// Archivo de datos de Matriz Productiva. Ver README → «Datos».
const SRC = {
  seSIG:  { t: "Secretaría de Energía – Visor SIG de infraestructura energética", u: "https://www.argentina.gob.ar/node/385900" },
  seConc: { t: "Secretaría de Energía – Concesiones de explotación (SHP/CSV)", u: "https://datos.gob.ar/dataset/energia-produccion-hidrocarburos---concesiones-explotacion" },
  seCap4: { t: "Secretaría de Energía – Producción por pozo (Capítulo IV)", u: "https://datos.gob.ar/dataset/energia-produccion-petroleo-gas-por-pozo-capitulo-iv" },
  seRef:  { t: "Secretaría de Energía – Cargas de crudo por refinería", u: "https://datos.gob.ar/dataset/energia-elaboracion-combustibles" },
  seGLP:  { t: "Secretaría de Energía – Producción de GLP por planta", u: "https://www.datos.gob.ar/dataset/energia-produccion-glp-por-planta" },
  seDuct: { t: "Secretaría de Energía – Ductos troncales", u: "https://datos.gob.ar/dataset/energia-transporte-hidrocarburos---ductos-troncales---poliductos" },
  miCart: { t: "Secretaría de Minería – Cartera de proyectos mineros (tablero)", u: "https://public.tableau.com/app/profile/sec.mineria/viz/ProyectosMineros/Dashproyectos" },
  miLit:  { t: "SIACAM – Proyectos de litio en Argentina (CSV)", u: "https://datos.gob.ar/dataset/produccion-proyectos-mineros-litio-argentina-tablero-global-litio---siacam" },
  miComp: { t: "Secretaría de Minería – Compendio estadístico 1er sem. 2025", u: "https://www.argentina.gob.ar/sites/default/files/compendio_estadistico_de_la_actividad_minera_1er_semestre_2025.pdf" },
  bcrPto: { t: "Bolsa de Comercio de Rosario – Terminales portuarias del Gran Rosario", u: "https://www.bcr.com.ar/es/print/pdf/node/85541" },
  bcrCr:  { t: "Bolsa de Comercio de Rosario – Capacidad de industrialización de oleaginosas", u: "https://www.bcr.com.ar/es/print/pdf/node/88945" },
  senasa: { t: "SENASA – Registro de establecimientos habilitados", u: "https://www.argentina.gob.ar/node/104675" },
  ign:    { t: "IGN – Capas SIG", u: "http://www.ign.gob.ar/NuestrasActividades/InformacionGeoespacial/CapasSIG" },
  vmosAmb:{ t: "Ámbito – VMOS superó el 70% de avance (jul-2026)", u: "https://www.ambito.com/energia/vaca-muerta-oil-sur-supero-el-70-avance-ypf-apunta-exportar-principios-2027-n6304443" },
  lngNqn: { t: "Noticias NQN – El primer buque de GNL llegará a Río Negro en 2027 (5-ago-2026)", u: "https://www.noticiasnqn.com.ar/amp/noticias/2026/08/05/346705-el-primer-buque-del-proyecto-de-gnl-inicio-su-preparacion-final-y-llegara-a-rio-negro-en-2027" },
  cap4:   { t: "Secretaría de Energía – Producción por pozo (Capítulo IV), agosto 2026 (descarga del 14-oct-2026)", u: "http://datos.energia.gob.ar/dataset/produccion-de-petroleo-y-gas-por-pozo" },
  infPet: { t: "Infobae – Producción de petróleo récord: 916.000 bbl/d (27-ago-2026)", u: "https://www.infobae.com/economia/2026/08/27/la-produccion-de-petroleo-batio-otro-record-916000-barriles-diarios-y-exportaciones-por-mas-de-usd-5700-millones/" },
  rankAbr:{ t: "Minuto Neuquén – Ranking de áreas de Vaca Muerta, abril 2026 (20-jun-2026)", u: "https://www.minutoneuquen.com/energia/2026/6/20/vaca-muerta-redefine-su-mapa-productivo-loma-campana-pierde-el-primer-puesto-406813.html" },
  rankEM: { t: "Mejor Informado – Áreas más productivas de Vaca Muerta, ene–may 2026 (4-jul-2026)", u: "https://www.mejorinformado.com/energia/vaca-muerta-alcanzo-nuevos-records-estas-fueron-areas-productivas-primeros-cinco-meses-2026_1783171934" },
  ypf2T:  { t: "Infobae – Resultados de YPF del 2T 2026 (10-ago-2026)", u: "https://www.infobae.com/economia/2026/08/10/ypf-otra-vez-record-la-petrolera-anuncio-el-mayor-resultado-operativo-de-su-historia-y-una-utilidad-neta-de-usd-1200-millones/" },
  vist2T: { t: "Vista Energy – Conferencia de resultados 2T 2026 (17-jul-2026)", u: "https://www.webull.com/news/15242985534596096" },
  litLN:  { t: "La Nación – Informe de la Secretaría de Minería sobre el litio (12-oct-2026)", u: "https://www.lanacion.com.ar/economia/el-oro-blanco-el-informe-del-gobierno-que-revela-la-actualidad-del-mineral-estrella-nid12102026/" },
  minasLM:{ t: "LM Neuquén – Las minas que más exportan en Argentina (13-may-2026)", u: "https://mase.lmneuquen.com/mineria/explorando-el-exito-minero-que-minas-generan-mas-usd-4600-millones-argentina-n1238228" },
  expMin: { t: "LM Neuquén – Exportaciones mineras récord a agosto 2026 (30-sep-2026)", u: "https://mase.lmneuquen.com/mineria/record-historico-la-mineria-argentina-exporto-usd-6059-millones-agosto-n1255607" },
  maiz:   { t: "Expoagro – Finalizó la cosecha de maíz 2025/26 con 64 Mt (2-oct-2026)", u: "https://www.expoagro.com.ar/finalizo-la-cosecha-de-maiz-2025-26-con-un-record-de-64-millones-de-toneladas/" },
  trigo:  { t: "La Nación – BCR estima 27,7 Mt de trigo 2025/26 (11-dic-2025)", u: "https://www.lanacion.com.ar/economia/campo/nueva-estimacion-por-el-ano-inedito-ahora-calculan-en-277-millones-de-toneladas-la-supercosecha-de-nid11122025/" },
  soja:   { t: "Safras – BCR eleva la proyección de soja 2025/26 a 48 Mt (12-feb-2026)", u: "https://safras.com.br/es/bcr-soja-cosecha-2026/" },
  crush:  { t: "Bichos de Campo – Molienda 2025 y capacidad ociosa de la industria aceitera (31-ene-2026)", u: "https://bichosdecampo.com/buena-noticia-la-capacidad-ociosa-de-la-industria-aceitera-argentina-cayo-en-2025-al-nivel-mas-bajo-desde-2011/" },
  carne:  { t: "El Observador – Producción, consumo y exportación de carnes 2025, datos BCR (11-ene-2026)", u: "https://www.elobservador.com/argentina/economia/mayor-produccion-consumo-y-exportacion-carnes-y-lacteos-n6030707" },
  grosa:  { t: "Agrolatam – Puertos del Gran Rosario, datos BCR 2024", u: "https://www.agrolatam.com/actualidad/puertos-gran-rosario-segundo-nodo-exportador-mundial/" },
  yahoo:  { t: "Yahoo Finance vía MCP local \"mercados\" (no oficial), corte 14-oct-2026 02:34 UTC", u: "https://finance.yahoo.com" },
  ypfPlan:{ t: "Ámbito – YPF anunció inversiones por más de US$30.000 M en 5 años (11-abr-2025)", u: "https://www.ambito.com/economia/en-wall-street-ypf-anuncio-que-invertira-mas-us30000-millones-los-proximos-5-anos-n6133631" }
};

Object.assign(SRC, {
  seFrac: { t:"Secretaría de Energía – Datos de fractura de pozos (Adjunto IV), fracturas terminadas ene-2025 a oct-2026 (descarga del 15-oct-2026)", u:"http://datos.energia.gob.ar/dataset/datos-de-fractura-de-pozos-adjunto-iv" },
  seRefP: { t:"Secretaría de Energía – Refinación: productos procesados por refinería (may-jul 2026)", u:"http://datos.energia.gob.ar/dataset/refinacion-y-comercializacion-de-petroleo-gas-y-derivados-tablas-dinamicas" },
  rtQ2:   { t:"Rio Tinto – Resultados 1S 2026 (SEC 6-K)", u:"https://www.sec.gov/Archives/edgar/data/0000863064/000086306426000035/ex991results.htm" },
  fenix1B:{ t:"MASE / LM Neuquén – Proyecto Fénix, fases 1A y 1B (abr-2025)", u:"https://mase.lmneuquen.com/mineria/proyecto-fenix-la-nueva-nave-insignia-del-litio-argentina-n1183671" },
  larQ2:  { t:"Lithium Argentina – Resultados 2T 2026", u:"https://investors.lithium-argentina.com/news-releases/news-release-details/lithium-argentina-reports-second-quarter-2026-results" },
  olarozS2:{ t:"Panorama Minero – Olaroz Etapa 2, decisión de inversión", u:"https://www.panorama-minero.com/es/news/olaroz-stage-2-expansion-final-investment-decision-approved-2" },
  eramet: { t:"Panorama Minero – Eramet: Centenario-Ratones a plena capacidad (ago-2026)", u:"https://www.panorama-minero.com/en/news/eramet-targets-full-production-at-centenario-ratones-and-expects-to-reach-100-capacity-before-year-end" },
  ganMar: { t:"S&P Global – Ganfeng pone en marcha Mariana (feb-2025)", u:"https://www.spglobal.com/energy/en/news-research/latest-news/metals/021425-chinas-ganfeng-lithium-starts-mariana-project-in-salta-expands-argentine-operations" },
  tresQ:  { t:"Sitio Andino – Tres Quebradas en marcha", u:"https://www.sitioandino.com.ar/economia/argentina-suma-una-nueva-operacion-litio-tres-quebradas-ya-esta-marcha-n5708211" },
  posco:  { t:"iProfesional – POSCO inaugura planta de 23.000 t (9-oct-2026)", u:"https://www.iprofesional.com/energia/466277-posco-inauguro-una-planta-de-litio-de-23000-toneladas-anuales" },
  galan:  { t:"Mining Reporters – Galan: primer cloruro de litio en HMW (may-2026)", u:"https://www.miningreporters.com/noticia/news/2026/05/galan-lithium-first-lithium-chloride-production-argentina" },
  vicPEA: { t:"Los Andes – Vicuña obtiene el RIGI: etapas y PEA (16-jun-2026)", u:"https://www.losandes.com.ar/vicuna-obtiene-el-rigi-y-despeja-un-paso-clave-la-decision-final-inversion-n5995015" },
  azulFS: { t:"McEwen – Estudio de factibilidad de Los Azules (oct-2025)", u:"https://www.mcewenmining.com/investor-relations/press-releases/press-release-details/2025/Los-Azules-Feasibility-Study-Confirms-Economically-Robust-Copper-Project-With-Leading-ESG-Performance" },
  glenMA: { t:"Forbes Argentina – Glencore: MARA, Alumbrera y El Pachón", u:"https://www.forbesargentina.com/negocios/el-gigante-glencore-reabre-unica-mina-cobre-tenia-argentina-une-rigi-us-4000-millones-n82793" },
  tacaT:  { t:"MASE / LM Neuquén – Taca Taca eleva su inversión a US$ 5.250 M (feb-2026)", u:"https://mase.lmneuquen.com/mineria/taca-taca-se-vuelve-mas-grande-y-eleva-su-inversion-us-5250-millones-n1228993" },
  psjDIA: { t:"Reporte Minero – Mendoza aprueba PSJ Cobre Mendocino (dic-2025)", u:"https://www.reporteminero.cl/noticia/noticias/2025/12/mendoza-aprueba-proyecto-cobre-mendocino-559-millones" },
  pmVel:  { t:"Panorama Minero – Compendio: Veladero", u:"https://www.panorama-minero.com/en/mining-compendium/argentina/project/veladero" },
  pmCN:   { t:"Panorama Minero – Compendio: Cerro Negro", u:"https://www.panorama-minero.com/en/mining-compendium/argentina/project/cerro-negro" },
  hocH1:  { t:"Hochschild – Reporte de producción 1S 2026", u:"https://www.investegate.co.uk/announcement/rns/hochschild-mining--hoc/production-report-for-6-months-ended-30-june-2026/9680678" },
  paasQ2: { t:"Pan American Silver – MD&A 2T 2026 (SEC 6-K)", u:"https://www.sec.gov/Archives/edgar/data/0000771992/000077199226000063/paas06-30x2026mdaex992.htm" },
  agaH1:  { t:"AngloGold Ashanti – Resultados 1S 2026 (SEC 6-K)", u:"https://www.sec.gov/Archives/edgar/data/0001973832/000197383226000123/au-20260630.htm" },
  cerrado:{ t:"Cerrado Gold – Producción 1T 2026 y guía 2026", u:"https://www.placera.se/telegram/cerrado-gold-inc-cerrado-gold-reports-higher-gold-equivalent-production-in-q1-maintains-2026-production-guidance-20260420" },
  fortuna:{ t:"Mining Reporters – Fortuna: Lindero, guía 2026 e inversión (jul-2026)", u:"https://www.miningreporters.com/noticia/news/2026/07/fortuna-mining-71-million-investment-argentina-peru-gold-production" },
  abraDFS:{ t:"AbraSilver – Estudio de factibilidad definitivo de Diablillos (jun-2026)", u:"https://www.newsfilecorp.com/release/302445" },
  gualca: { t:"MDZ – Gualcamayo Carbonatos Profundos en el RIGI", u:"https://www.mdzol.com/dinero/por-que-gualcamayo-ingresa-al-rigi-como-un-caso-singular-dentro-la-mineria-argentina-n1415054" },
  fenixTE:{ t:"TotalEnergies – Inicio de producción de Fénix (20-sep-2024)", u:"https://corporate.totalenergies.no/news-overview/argentina-production-start-fenix-offshore-gas-field" },
  tgsTra: { t:"MASE / LM Neuquén – Ampliación de Tratayén (TGS)", u:"https://mase.lmneuquen.com/gas/los-detalles-la-obra-tgs-que-es-vital-que-vaca-muerta-no-tenga-techo-n1231534" },
  tgsCer: { t:"El Economista – TGS restablece el Complejo Cerri (jun-2025)", u:"https://eleconomista.com.ar/energia/tgs-restablecio-operatividad-total-su-complejo-general-cerri-tras-historica-inundacion-n85530" },
  mega:   { t:"El Economista – Mega: plan de obras y nuevo tren de fraccionamiento", u:"https://eleconomista.com.ar/energia/midstream-modo-expansion-mega-invierte-fuerte-lidera-monetizacion-shale-n94238" },
  sesa:   { t:"MASE / LM Neuquén – Southern Energy y la capacidad de FLNG (2026)", u:"https://mase.lmneuquen.com/gas/con-sesa-argentina-concentra-el-316-la-capacidad-flng-aprobada-el-mundo-n1247195" },
  profer: { t:"iProfesional – Profertil: capacidad y ampliación (31-ago-2026)", u:"https://www.iprofesional.com/energia/463361-profertil-emite-on-por-90-millones-de-dolares-para-su-produccion-de-fertilizantes" },
  bcrCap: { t:"BCR – Capacidad de molienda del Gran Rosario por planta (encuesta oct-2021)", u:"https://www.bcr.com.ar/es/mercados/investigacion-y-desarrollo/informativo-semanal/noticias-informativo-semanal/el-gran-3" },
  bcrCap13:{ t:"BCR – Capacidad de molienda por planta (informe may-2013)", u:"https://www.bcr.com.ar/es/print/pdf/node/63982" },
  molTim: { t:"iProfesional – Molinos Agro y ACA: nueva planta de 15.000 t/día en Timbúes (8-jul-2026)", u:"https://www.iprofesional.com/negocios/459528-gigante-agricola-invirtio-500-millones-de-dolares-molera-15000-toneladas-de-soja-por-dia" }
});

Object.assign(SRC, {
  cap4hist:{ t:"Secretaría de Energía – Serie histórica de producción de petróleo por cuenca y sub tipo de recurso (Capítulo IV), a ago-2026", u:"http://datos.energia.gob.ar/dataset/produccion-de-petroleo-y-gas-por-pozo" },
  cap4ant: { t:"Secretaría de Energía – Producción de Capítulo IV por yacimiento y antigüedad de pozo productivo (actualizado feb-2026)", u:"http://datos.energia.gob.ar/dataset/produccion-de-petroleo-y-gas-por-pozo" },
  se363:   { t:"Secretaría de Energía – Producción y ventas de petróleo y derivados, ene–nov 2025 (Series de Tiempo, dataset 363)", u:"https://apis.datos.gob.ar/series/api/series/?ids=363.3_PETROLEO_CADO__24,363.3_PRODUCCIONUDO__28&format=csv" },
  icaQ:    { t:"INDEC – Intercambio Comercial Argentino, valores trimestrales (Series de Tiempo, dataset 74)", u:"https://apis.datos.gob.ar/series/api/series/?ids=74.2_IECE_0_T_35,74.2_IICL_0_T_42&format=csv" },
  avBrent: { t:"Alpha Vantage – Precio mensual del Brent (consulta del 15-oct-2026)", u:"https://www.alphavantage.co/documentation/#brent" },
  avGold:  { t:"Alpha Vantage – Precio histórico del oro, cierre mensual (consulta del 15-oct-2026)", u:"https://www.alphavantage.co/documentation/#gold-silver-history" },
  avCopper:{ t:"Alpha Vantage – Precio mensual del cobre (consulta del 15-oct-2026)", u:"https://www.alphavantage.co/documentation/#copper" },
  caem26:  { t:"CAEM – Informe productivo 2026 (may-2026): exportaciones y empleo minero", u:"https://caem.com.ar/storage/2026/05/informe-productivo-caem-2026.pdf" },
  yahooM:  { t:"Yahoo Finance vía servidor local «mercados» (no oficial), cierres mensuales al 15-oct-2026", u:"https://finance.yahoo.com" },
  cbot:    { t:"Futuros CBOT de soja, maíz y trigo (ZS=F, ZC=F, ZW=F) vía Yahoo Finance, cierres mensuales", u:"https://finance.yahoo.com/quote/ZS=F" },
  magypEst:{ t:"MAGyP – Estimaciones agrícolas por departamento, campaña 2024/25 (archivo de mar-2026)", u:"https://datos.magyp.gob.ar/dataset/estimaciones-agricolas" },
  bcbaOct: { t:"Bolsa de Cereales de Buenos Aires vía Infobae – Panorama agrícola semanal (14-oct-2026)", u:"https://www.infobae.com/revista-chacra/2026/10/14/el-trigo-proyecta-rindes-superiores-al-promedio-de-las-ultimas-cinco-campanas-pese-a-las-heladas/" },
  bcbaMz:  { t:"Bolsa de Cereales de Buenos Aires vía Ruralnet – Siembra de maíz 2026/27 (9-oct-2026)", u:"https://ruralnet.com.ar/siembra-maiz-2026-27-29-9/" },
  faenaSt: { t:"SAGyP – Faena de cabezas vacunas (Series de Tiempo, dataset 40)", u:"https://apis.datos.gob.ar/series/api/series/?ids=40.2_VC_0_T_15&format=csv" },
  stockBov:{ t:"MAGyP – Cierre de existencias bovinas al 31-12-2025", u:"https://www.magyp.gob.ar/sitio/areas/bovinos/informacion_interes/informes/_archivos/000001=Series%20de%20stock%20bovino%20y%20mapas/000000_Stock/251231_Informe%20cierre%20de%20existencias%20bovinas%20al%2031-12-2025.pdf" },
  rosganH: { t:"ROSGAN / BCR – Faena de hembras: menor oferta, mayor retención (19-jun-2026)", u:"https://www.bcr.com.ar/es/print/pdf/node/116246" },
  bcrPto:  { t:"BCR vía La Capital – El Gran Rosario volvió a ser el principal nodo agroexportador del mundo (30-may-2026)", u:"https://www.lacapital.com.ar/economia/el-gran-rosario-volvio-ser-el-principal-nodo-agroexportador-del-mundo-n10262055.html" },
  indecCx: { t:"INDEC – Complejos exportadores, año 2025", u:"https://www.indec.gob.ar/uploads/informesdeprensa/complejos_03_2686A1604947.pdf" },
  emae:    { t:"INDEC – EMAE, apertura sectorial, base 2004 (Series de Tiempo, datasets 11 y 143)", u:"https://apis.datos.gob.ar/series/api/series/?ids=11.3_ISOM_2004_M_39,11.3_ISD_2004_M_26,143.3_NO_PR_2004_A_31&format=csv" },
  expProv: { t:"INDEC / Subsecretaría de Programación Macroeconómica – Exportaciones por provincia y rubro, 2024", u:"https://infra.datos.gob.ar/catalog/sspm/dataset/350/distribution/350.1/download/exportaciones-provincia-rubro.csv" }
});

SRC.siacam = { t:"Secretaría de Minería – Cartera de proyectos mineros (SIACAM), actualizada 24-jun-2026", u:"https://www.mecon.gob.ar/dataset/Cartera-de-Proyectos-Mineros-Metaliferos-y-Litio-del-SIACAM.xlsx" };

// Claves que completa el script automático (acá queda el valor inicial).
Object.assign(SRC, {
  yfBrent: { t:"Alpha Vantage – Precio mensual del Brent (consulta del 15-oct-2026)", u:"https://www.alphavantage.co/documentation/#brent" },
  yfFut:   { t:"Alpha Vantage y Yahoo Finance – Brent, oro, cobre y soja, cierres mensuales (consulta del 15-oct-2026)", u:"https://finance.yahoo.com" }
});

// --- Fuentes de fichas completadas el 27-oct-2026 (empresas y organismos oficiales) ---
Object.assign(SRC, {
  tgnSis: { t:"TGN – Sistema TGN: gasoductos Norte y Centro Oeste", u:"https://www.tgn.com.ar/en/operations-and-services/tgn-system/" },
  tgsTr:  { t:"TGS – Negocio de transporte de gas natural", u:"https://www.tgs.com.ar/Businesses/Transportation" },
  oldDup: { t:"Oldelval – Diario Oldelval: sistema y proyecto Duplicar (feb-2024)", u:"https://www.oldelval.com/wp-content/uploads/2024/02/DIARIO-OLDELVAL.pdf" },
  oteInv: { t:"Oiltanking Ebytem – Presentación a inversores (2024)", u:"https://www.bancoprovincia.com.ar/CDN/Get/OTE_Presentacion_Inversores_30" },
  vntAGP: { t:"Ministerio de Economía – La Vía Navegable Troncal en Argentina", u:"https://www.argentina.gob.ar/transporte/administracion-general-puertos-se/via-navegable-troncal/la-via-navegable-troncal-en-argentina" },
  cnrt24: { t:"CNRT – Reporte estadístico trimestral de cargas ferroviarias, 2T 2024", u:"https://argentina.gob.ar/sites/default/files/2024_-_segundo_trimestre_-_carga.pdf" },
  ssrPuna:{ t:"SSR Mining – Puna Operations (reservas y recursos al 31-dic-2025)", u:"https://ssrmining.com/operations/production/puna/" },
  cerrQ3: { t:"Cerrado Gold – Producción del 3T 2026 en Minera Don Nicolás (comunicado del 19-oct-2026)", u:"https://www.taiwannews.com.tw/en/news/6460759" },
  pbb25:  { t:"Consorcio de Gestión del Puerto de Bahía Blanca – Estadísticas de tráfico, diciembre 2025", u:"https://puertobahiablanca.com/estadisticaspuerto/2025/12/trafico1225.pdf" },
  pgCalc: { t:"Patagonia Gold – Calcatreu: fin de la suspensión y tercer despacho de doré (27-ago-2026)", u:"https://www.bnnbloomberg.ca/press-releases/2026/08/27/patagonia-gold-announces-lifting-of-temporary-suspension-at-calcatreu-and-third-dore-dispatch/" }
  ,
  // --- 28-oct-2026 ---
  rnVmos: { t:"Gobierno de Río Negro – Continúa la obra del VMOS tras completarse la última soldadura automática (3-nov-2025)", u:"https://rionegro.gov.ar/articulo/56495/continua-la-obra-del-vmos-tras-completarse-la-ultima-soldadura-automatica" },
  crGpnk: { t:"Casa Rosada – Gasoducto Presidente Néstor Kirchner (hoy Perito Moreno), tramo I: ficha de la obra", u:"https://www.casarosada.gob.ar/pdf/Brief%20GPNK.pdf" },
  arcaTim:{ t:"Boletín Oficial – ARCA, Res. 32/2026: depósito fiscal de Terminal Timbúes S.A. (2-oct-2026)", u:"https://www.boletinoficial.gob.ar/seccion/primera/20261002" }
  ,
  // --- 29-oct-2026 ---
  pqq25:  { t:"Consorcio de Gestión del Puerto Quequén – Cerramos 2025 con récord histórico (cierre anual de cargas)", u:"https://puertoquequen.com/en/we-closed-2025-with-a-historic-record-and-a-safe-and-predictable-port-system/" },
  pqqEst: { t:"Consorcio de Gestión del Puerto Quequén – Estadísticas anuales", u:"https://puertoquequen.com/en/annual-statistics/" },
  // --- 30-oct-2026 ---
  agdG26:  { t:"Austral Gold – Guía de producción 2026 (comunicado del 5-dic-2025)", u:"https://www.newsfilecorp.com/release/277053/Austral-Gold-Provides-2026-Production-Guidance" },
  agdH126: { t:"Austral Gold – Informe semestral 2026 (comunicado del 27-ago-2026)", u:"https://wwww.stockwatch.com/News/Item/Z-C!AGLD-3857249/C/AGLD" },
  celPFS26:{ t:"Challenger Gold – Hualilán: actualización del estudio de prefactibilidad (ASX, 18-may-2026)", u:"https://announcements.asx.com.au/asxpdf/20260518/pdf/06zpms1stxbw15.pdf" },
  aldePEA25:{ t:"Aldebaran Resources – Evaluación económica preliminar (PEA) de Altar (30-oct-2025)", u:"https://www.stockwatch.com/News/Item/Z-C!ALDE-3746897/C/ALDE" },
  paasRR26:{ t:"Pan American Silver – Reservas y recursos minerales al 30-jun-2026 (SEC 6-K, 16-sep-2026)", u:"https://www.sec.gov/Archives/edgar/data/0000771992/000077199226000065/nr2026reservesupdate.htm" },
  larPPG25:{ t:"Lithium Argentina y Ganfeng – Estudio de alcance de PPG y aprobación ambiental de la etapa 1 (10-nov-2025)", u:"https://www.itiger.com/news/2582878858" }
});
