// ============================================================
// FICHA TÉCNICA por activo: cómo se extrae/procesa, producto y
// calidad, números clave (capacidad, producción, proyección,
// inversión, vida útil) e hitos. Cada número lleva su fuente.
// Para actualizar: editar el bloque del activo (clave = id del punto).
// ============================================================

// --- Procesos típicos por eslabón (se usan cuando el activo no tiene ficha propia) ---
const TEC_GEN = {
  "og-up":  { met:"Producción de hidrocarburos por pozos.", proc:["Perforación","Terminación (fractura en no convencional)","Producción","Separación petróleo / gas / agua","Despacho por ducto"], prod:"Petróleo crudo y gas natural" },
  "og-proc":{ met:"Tratamiento de gas: se acondiciona el gas de pozo y se le extraen los líquidos.", proc:["Recepción de gas rico","Deshidratación y endulzado","Enfriamiento criogénico","Separación de etano, propano, butano y gasolina","Gas seco a gasoducto"], prod:"Gas apto para transporte + líquidos del gas natural (NGL)" },
  "og-ref": { met:"Refinación: el crudo se separa por destilación y se convierte en combustibles.", proc:["Destilación atmosférica (topping)","Destilación al vacío","Conversión (craqueo catalítico, coque)","Hidrotratamiento (quita azufre)","Mezcla y despacho"], prod:"Naftas, gasoil, jet, fueloil, GLP, asfaltos" },
  "og-exp": { met:"Terminal de almacenaje y carga de buques.", proc:["Llegada por ducto","Tanques de almacenaje","Monoboya o muelle","Carga de buque tanque"], prod:"Crudo, GNL o derivados para exportación o cabotaje" },
  "mi-li":  { met:"Litio en salmuera: se bombea agua salada rica en litio desde debajo del salar.", proc:["Pozos de bombeo de salmuera","Concentración: pozas de evaporación solar (12–18 meses) o extracción directa (DLE, horas)","Purificación (se quitan magnesio, boro y calcio)","Precipitación con carbonato de sodio","Secado y envasado"], prod:"Carbonato de litio (grado técnico >99,0% o grado batería ≥99,5%) o cloruro de litio" },
  "mi-cu":  { met:"Pórfido de cobre a cielo abierto.", proc:["Perforación y voladura","Chancado y molienda","Flotación (sulfuros) o lixiviación + SX-EW (óxidos)","Espesado y filtrado","Transporte del concentrado o cátodo"], prod:"Concentrado de cobre (~25–30% Cu, con oro, plata o molibdeno) o cátodos de cobre 99,99%" },
  "mi-au":  { met:"Oro y plata epitermal: cielo abierto o subterráneo por vetas.", proc:["Extracción del mineral","Chancado (y molienda en planta)","Lixiviación con cianuro (en pilas o en tanques)","Recuperación del metal (carbón activado o Merrill-Crowe)","Fundición en barras"], prod:"Doré: barras de oro y plata de alta pureza, que se refinan afuera" },
  "mi-ot":  { met:"Depende del mineral (uranio, potasio, plata-plomo-zinc, boratos, etc.).", proc:["Extracción","Concentración","Producto intermedio"], prod:"Concentrados o sales minerales" },
  "ag-crush":{ met:"Industria aceitera: molienda de soja (y girasol) con extracción por solvente.", proc:["Recepción de camiones/trenes y acondicionamiento","Quebrado y laminado del grano","Extracción del aceite con hexano","Desolventizado y tostado de la harina","Aceite crudo (y biodiésel) + pellets a buque"], prod:"Harina/pellets de soja (~46–47% proteína), aceite crudo y biodiésel. Argentina es el primer exportador mundial de harina y aceite de soja." },
  "ag-port": { met:"Terminal portuaria de granos y subproductos.", proc:["Descarga de camión/tren","Calado y clasificación","Silos y celdas","Cinta y cargador de buques"], prod:"Granos, harinas y aceites a exportación" },
  "ag-carne":{ met:"Industria frigorífica.", proc:["Recepción de hacienda","Faena","Desposte","Enfriado/congelado y envasado","Mercado interno o exportación (China, UE cuota Hilton)"], prod:"Cortes vacunos enfriados y congelados, menudencias, cueros" },
  "og-duct":{ met:"Transporte por ducto: el gas o el crudo se mueve por presión, impulsado por plantas compresoras o estaciones de bombeo.", proc:["Cabecera (planta de tratamiento)","Plantas compresoras o de bombeo cada cientos de km","Puntos de entrega a distribuidoras, refinerías o terminales"], prod:"Gas natural o petróleo crudo en tránsito" },
  "ag-log": { met:"Corredor logístico de cargas agrícolas (ferrocarril, hidrovía o rutas).", proc:["Origen en zona productora","Transporte troncal","Llegada a puertos del Gran Rosario o del sur bonaerense"], prod:"Granos y subproductos en tránsito" },
  "ag-ins":  { met:"Insumos agrícolas a partir de gas natural.", proc:["Gas natural","Reformado → amoníaco","Síntesis de urea","Granulado y despacho"], prod:"Urea granulada y amoníaco" }
};

// --- Bloque común Vaca Muerta (se completa con números por área) ---
const VM = (o) => Object.assign({
  met:"No convencional (shale) en la formación Vaca Muerta: pozos horizontales con fractura hidráulica multietapa (técnica «tapón y disparo»).",
  proc:["Perforación vertical (~2.500–3.000 m) y giro a horizontal","Rama horizontal dentro de la roca generadora","Fractura por etapas: agua + arena a muy alta presión","Flowback y puesta en producción","Planta de tratamiento: separa petróleo, gas y agua","Oleoducto / gasoducto troncal"],
  src:["seFrac"]
}, o);
const fr = (p, L, e, esp, a, w) => [
  ["Pozos fracturados (ene-2025 a oct-2026)", p+" pozos", "seFrac"],
  ["Rama horizontal promedio", L.toLocaleString("es-AR")+" m", "seFrac"],
  ["Etapas de fractura por pozo", e+" (una cada ~"+esp+" m)", "seFrac"],
  ["Arena por pozo", a.toLocaleString("es-AR")+" t", "seFrac"],
  ["Agua por pozo", w.toLocaleString("es-AR")+" m³", "seFrac"]
];
const OIL = "Crudo liviano y dulce que se comercializa como «Medanito» (alrededor de 40° API, bajo azufre); gas asociado.";

const TEC = {
  // ---------------- OIL & GAS · UPSTREAM ----------------
  "og-lc":  VM({ prod:OIL, nums: fr(58,3714,64,58,14077,93796), nota:"Primer desarrollo masivo de Vaca Muerta (YPF–Chevron desde 2013). Sus ramas son las más largas del país." }),
  "og-lac": VM({ prod:OIL, nums: fr(85,3205,54,60,12179,76489), nota:"Área con más pozos fracturados del país en 2025–2026." }),
  "og-bs":  VM({ prod:OIL, nums: fr(80,2898,50,58,11517,75040) }),
  "og-bdpo":VM({ prod:OIL, nums: fr(52,2969,51,58,11506,77532) }),
  "og-bdc": VM({ prod:OIL, nums: fr(26,3222,56,58,9685,78476) }),
  "og-rda": VM({ prod:OIL, nums: fr(51,2532,45,57,9889,61320) }),
  "og-fp":  VM({ prod:"Gas seco (metano) de la ventana gasífera de Vaca Muerta y algo de condensado.", nums: fr(16,2493,49,51,10621,83998), nota:"Desarrollado para abastecer el gasoducto Perito Moreno (ex GPNK)." }),
  "og-ape": VM({ prod:"Gas y condensado de la ventana gasífera de Vaca Muerta.", nums: fr(12,2992,49,61,9717,71899) }),
  "og-lll": VM({ prod:"Gas convencional (yacimiento histórico, descubierto en 1977) y nuevos pozos de Vaca Muerta.", nums: fr(3,3100,51,61,12087,70770), nota:"Fue el mayor yacimiento de gas del país; hoy declina y se reconvierte a shale." }),
  "og-ltoldos": VM({ prod:OIL,
    nums:[["Inversión total RIGI","US$ 6.432 M","bo1771_26"],["Desarrollo","380 pozos horizontales en 78 km²","bo1771_26"],["Horizonte del programa","Hasta 2054, en tres tramos","bo1771_26"],["Vehículo RIGI","UT RIGI Los Toldos (Tecpetrol + Gas y Petróleo del Neuquén)","bo1771_26"]],
    nota:"Aprobado en el RIGI en oct-2026. Los números de fractura y producción aparecerán cuando empiece a perforar en serie.", src:["bo1771_26","seConc"] }),
  "og-cd": {
    met:"Convencional, cuenca del Golfo San Jorge: miles de pozos verticales con recuperación secundaria (inyección de agua para empujar el crudo) y pilotos de recuperación terciaria con polímeros.",
    proc:["Pozos verticales con bombeo mecánico","Inyección de agua en capas productoras","Baterías y planta de tratamiento","Oleoducto a terminal Caleta Córdova","Exportación o refinerías locales"],
    prod:"Crudo Escalante: mediano-pesado (~24° API), muy demandado por refinerías de Asia y EE.UU.",
    nota:"Es el mayor yacimiento convencional del país; produce más del 90% de su crudo sin fractura.", src:["cap4"]
  },
  "og-fenix": {
    met:"Gas convencional costa afuera: plataforma fija no tripulada en 70 m de agua, conectada a las instalaciones existentes de Cuenca Marina Austral 1.",
    proc:["Pozos submarinos desde la plataforma","Gasoducto submarino de 35 km a la plataforma Vega Pléyade","Tratamiento en tierra (Río Cullen y Cañadón Alfa, Tierra del Fuego)","Inyección al gasoducto San Martín"],
    prod:"Gas natural seco",
    nums:[["Capacidad","10 MMm³/d (~70.000 boe/d)","fenixTE"],["Inicio de producción","20-sep-2024","fenixTE"],["Socios","TotalEnergies 37,5% (operador) · Harbour 37,5% · PAE 25%","fenixTE"]],
    src:["fenixTE","cap4"]
  },
  // ---------------- OIL & GAS · MIDSTREAM ----------------
  "og-tra": {
    met:"Planta de acondicionamiento de gas de Vaca Muerta (TGS), cabecera del gasoducto Perito Moreno.",
    proc:["Gas de los yacimientos","Separación de líquidos y agua","Compresión","Inyección al gasoducto Perito Moreno"],
    prod:"Gas apto para transporte",
    nums:[["Capacidad tras la ampliación","43 MMm³/d (cuatro módulos)","tgsTra"],["Inversión del proyecto NGL de TGS","US$ 3.000 M","tgsTra"],["Obra","Inicio 1S 2026 · fin 1S 2030 (45 meses)","tgsTra"]],
    src:["tgsTra"]
  },
  "og-mega1": {
    met:"Planta separadora criogénica: extrae del gas los componentes más pesados que el metano.",
    proc:["Gas rico de Loma La Lata","Enfriamiento criogénico","Separación de etano, GLP y gasolina","Poliducto de 600 km a Bahía Blanca"],
    prod:"Líquidos del gas natural (NGL)",
    nums:[["Poliducto a Bahía Blanca","600 km","mega"],["Plan de inversión 2023–2028","US$ 650 M (US$ 360 M en el RIGI); +27% de producción","mega"],["Accionistas","YPF 38% · Petrobras 34% · Dow 28%","mega"]],
    src:["mega"]
  },
  "og-mega2": {
    met:"Planta fraccionadora: separa los líquidos que llegan por el poliducto en productos puros.",
    proc:["Recepción de NGL","Torres de fraccionamiento","Etano → Dow (petroquímica)","Propano, butano y gasolina → buques de exportación"],
    prod:"Etano, propano, butano y gasolina natural",
    nums:[["Nuevo tren (2026)","+2.500 t/día, inversión ~US$ 250 M","mega"],["Techo previsto","7.000–7.200 t/día","mega"],["Destino del volumen nuevo","80% exportación · 20% mercado interno (etano)","mega"]],
    src:["mega"]
  },
  "og-cerri": {
    met:"Complejo de extracción de líquidos de TGS a la entrada del sistema troncal de gas del sur.",
    proc:["Gas de los gasoductos troncales","Extracción criogénica de líquidos","Fraccionamiento","Almacenaje en Puerto Galván","Mercado interno y exportación"],
    prod:"Etano, propano, butano y gasolina natural",
    nums:[["Capacidad de producción","Más de 1.050.000 t/año de líquidos","tgsCer"],["Hito","Restablecido al 100% tras la inundación de Bahía Blanca (jun-2025)","tgsCer"]],
    src:["tgsCer"]
  },
  "og-pbb": {
    met:"Petroquímica: craqueo del etano a muy alta temperatura para obtener etileno, y polimerización.",
    proc:["Etano de Mega y TGS","Crackers de vapor → etileno","Polimerización","Pellets de polietileno"],
    prod:"Etileno y polietileno (base de envases, films y caños)",
    nota:"Dow es el principal comprador del etano argentino. Capacidades de planta pendientes de cargar con fuente oficial.", src:["mega"]
  },
  // ---------------- OIL & GAS · REFINACIÓN ----------------
  "og-rlp": { met:TEC_GEN["og-ref"].met, proc:["Destilación atmosférica y al vacío","Craqueo catalítico (FCC)","Coque","Hidrotratamiento de gasoil y naftas","Despacho a la zona AMBA"], prod:TEC_GEN["og-ref"].prod,
    nums:[["Crudo procesado (may–jul 2026)","≈ 211.000 bbl/d, la mayor del país","seRefP"]], src:["seRefP"] },
  "og-rlc": { met:TEC_GEN["og-ref"].met, proc:TEC_GEN["og-ref"].proc, prod:TEC_GEN["og-ref"].prod, nums:[["Crudo procesado (may–jul 2026)","≈ 124.000 bbl/d","seRefP"]], src:["seRefP"] },
  "og-rph": { met:TEC_GEN["og-ref"].met, proc:TEC_GEN["og-ref"].proc, prod:TEC_GEN["og-ref"].prod, nums:[["Crudo procesado (may–jul 2026)","≈ 25.000 bbl/d","seRefP"]], src:["seRefP"] },
  "og-rds": { met:TEC_GEN["og-ref"].met, proc:TEC_GEN["og-ref"].proc, prod:TEC_GEN["og-ref"].prod, nums:[["Crudo procesado (may–jul 2026)","≈ 80.000 bbl/d (informado como Shell C.A.P.S.A., hoy Raízen)","seRefP"]], src:["seRefP"] },
  "og-rbb": { met:TEC_GEN["og-ref"].met, proc:TEC_GEN["og-ref"].proc, prod:TEC_GEN["og-ref"].prod, nums:[["Crudo procesado (may–jul 2026)","≈ 27.000 bbl/d (planta Elicabe, Trafigura)","seRefP"]], src:["seRefP"] },
  "og-rcd": { met:TEC_GEN["og-ref"].met, proc:TEC_GEN["og-ref"].proc, prod:TEC_GEN["og-ref"].prod, nums:[["Crudo procesado (may–jul 2026)","0 bbl/d: la Secretaría no registra crudo procesado en el período","seRefP"]], nota:"La caída de la producción del Noroeste dejó a la refinería sin crudo propio de la cuenca.", src:["seRefP"] },
  "og-rcamp": { met:TEC_GEN["og-ref"].met, proc:TEC_GEN["og-ref"].proc, prod:TEC_GEN["og-ref"].prod, nums:[["Crudo procesado (may–jul 2026)","≈ 94.000 bbl/d, la tercera del país","seRefP"]], src:["seRefP"] },
  // ---------------- OIL & GAS · EXPORTACIÓN ----------------
  "og-pc": { met:"Terminal de exportación de crudo en aguas profundas, cabecera marítima del oleoducto VMOS: playa de tanques en tierra y monoboyas mar adentro.",
    proc:["Llegada del oleoducto VMOS desde Allen (437 km)","Playa de tanques en Punta Colorada","Bombeo a líneas submarinas","Monoboyas mar adentro","Carga de buques de gran porte"],
    prod:"Crudo Medanito de Vaca Muerta para exportación",
    nums:[["Almacenaje","6 tanques de 120.000 m³ cada uno","rnVmos"],["Capacidad del sistema","390.000 bbl/d iniciales, ampliable a 550.000 bbl/d en 2027","rnVmos"],["Capacidad base en la resolución RIGI","377.400 bbl/d","bo302_25"],["Inversión computable RIGI (oleoducto + terminal)","US$ 2.486 M","bo302_25"]],
    src:["rnVmos","bo302_25","vmosAmb"] },
  "og-lng": {
    met:"Licuefacción flotante (FLNG): el gas se enfría a –162 °C dentro de un buque y se carga en metaneros.",
    proc:["Gas de Vaca Muerta","Gasoducto dedicado al Golfo San Matías","Pretratamiento en el buque","Licuefacción a –162 °C","Carga en metaneros para exportar"],
    prod:"Gas natural licuado (GNL)",
    nums:[["Hilli Episeyo","2,45 Mtpa (≈2,5)","sesa"],["MK II","3,5 Mtpa","sesa"],["Inicio","Hilli 2S 2027 (el World LNG Report lo ubica a comienzos de 2028) · MK II 2S 2028","sesa"],["Socios","PAE 30% · YPF 25% · Pampa 20% · Harbour 15% · Golar 10%","sesa"]],
    src:["sesa","lngNqn"]
  },

  // ---------------- MINERÍA · LITIO ----------------
  "mi-fenix": {
    met:"Salmuera con extracción directa por adsorción selectiva (DLE): el litio se captura con un adsorbente sin pasar por pozas largas. Es la tecnología pionera de Livent, hoy Rio Tinto.",
    proc:["Bombeo de salmuera del Salar del Hombre Muerto","Columnas de adsorción selectiva (DLE)","Pozas cortas de concentración","Planta de carbonato en el salar","Cloruro de litio a Güemes (Salta) y a conversión a hidróxido"],
    prod:"Carbonato y cloruro de litio",
    nums:[["Fase 1A","+10.000 t/año de carbonato (terminada en 2024)","fenix1B"],["Fase 1B","+10.000 t/año LCE, primera producción 2T 2026","rtQ2"],["Inversión Fase 1B","US$ 0,7 mil M","rtQ2"]],
    src:["rtQ2","fenix1B"]
  },
  "mi-sdv": {
    met:"Salmuera con pozas de evaporación solar y planta de carbonato.",
    proc:["Pozos de salmuera","Pozas de evaporación","Planta de carbonato de litio","Exportación por Chile"],
    prod:"Carbonato de litio",
    nums:[["Capacidad etapa 1","15.000 t/año LCE","rtQ2"],["Inicio","Primera producción 2T 2026; en puesta en marcha","rtQ2"],["Inversión","US$ 0,7 mil M","rtQ2"]],
    src:["rtQ2"]
  },
  "mi-rincon": {
    met:"Salmuera con extracción directa de litio (DLE) en el Salar del Rincón: sin pozas de evaporación de largo plazo y con reinyección de la salmuera.",
    proc:["Bombeo de salmuera","Reactores DLE","Purificación y concentración","Planta de carbonato grado batería","Exportación"],
    prod:"Carbonato de litio grado batería",
    nums:[["Planta inicial","3.000 t/año (385 t en el 2T 2026, en estabilización)","rtQ2"],["Capacidad total","60.000 t/año (3k inicial + 50k planta grande + 7k optimización)","rtQ2"],["Inversión","US$ 2,5 mil M (RIGI)","rtQ2"],["Producción plena","Primera producción de la planta grande en 2028 y 3 años de rampa","rtQ2"]],
    hitos:[["2026","Planta inicial (3 kt) en rampa"],["2028","Primer litio de la planta de 50 kt"],["2031","Capacidad plena 60 kt (estimado por la rampa de 3 años)"]],
    src:["rtQ2"]
  },
  "mi-olaroz": {
    met:"Salmuera con pozas de evaporación solar y planta de carbonato (la primera operación de litio de Jujuy).",
    proc:["Pozos de salmuera en el Salar de Olaroz","Pozas de evaporación (~12–18 meses)","Planta: purificación y precipitación con carbonato de sodio","Secado y despacho"],
    prod:"Carbonato de litio: etapa 1 grado batería; etapa 2 grado técnico (>99,0%), una parte va a la planta de hidróxido de Naraha (Japón)",
    nums:[["Capacidad","≈ 42.500 t/año (etapa 1 17.500 + etapa 2 25.000)","olarozS2"],["Accionistas","Rio Tinto 66,5% (y JEMSE)","rtQ2"]],
    src:["olarozS2","rtQ2"]
  },
  "mi-co": {
    met:"Salmuera con pozas de evaporación y planta de carbonato (Minera Exar). La etapa 2 suma extracción directa (DLE) modular.",
    proc:["Pozos de salmuera en Cauchari-Olaroz","Pozas de evaporación","Planta de carbonato","Exportación por Chile"],
    prod:"Carbonato de litio para baterías",
    nums:[["Producción 2T 2026","9.280 t (con parada programada en mayo)","larQ2"],["Ritmo 1S 2026","95% de la capacidad de diseño","larQ2"],["Guía 2026","35.000–40.000 t","larQ2"],["Etapa 2","+45.000 t/año LCE; primer módulo DLE de 10.000 t/año; RIGI aprobado may-2026","larQ2"]],
    src:["larQ2","minasLM"]
  },
  "mi-cr": {
    met:"Salmuera con extracción directa (DLE) con adsorbente propio de Eramet: el primer DLE a escala industrial de una empresa europea.",
    proc:["Pozos de salmuera (Salar de Centenario)","Planta DLE","Concentración y purificación","Carbonato de litio"],
    prod:"Carbonato de litio grado batería",
    nums:[["Ritmo","90% de la capacidad nominal en junio de 2026","eramet"],["Guía 2026","17.000–20.000 t LCE","eramet"],["Expansión","+11.000 t/año (prefactibilidad terminada; decisión posible a fines de 2027; apta para RIGI)","eramet"]],
    src:["eramet"]
  },
  "mi-mariana": {
    met:"Salmuera con pozas de evaporación en el Salar de Llullaillaco y planta de cloruro de litio.",
    proc:["Pozos de salmuera","Pozas de evaporación solar","Planta de cloruro de litio","Despacho para conversión"],
    prod:"Cloruro de litio",
    nums:[["Capacidad fase 1","20.000 t de cloruro de litio","ganMar"],["Recursos","8,12 Mt LCE","ganMar"],["Puesta en marcha","feb-2025","ganMar"]],
    src:["ganMar","litLN"]
  },
  "mi-3q": {
    met:"Salmuera procesada en pozas de evaporación, en el Salar de Laguna Verde (más de 4.300 m de altura).",
    proc:["Pozos de salmuera","Pozas de evaporación","Planta de carbonato"],
    prod:"Carbonato de litio",
    nums:[["Fase 1","20.000 t/año","tresQ"],["Fase 2","30.000 t/año","tresQ"],["Fase 3","50.000 t/año","tresQ"],["Vida útil","Hasta 2043","tresQ"]],
    src:["tresQ"]
  },
  "mi-sal-de-oro": {
    met:"Salmuera del Salar del Hombre Muerto con pozas de evaporación. La conversión se hace en dos plantas: fosfato de litio en el salar e hidróxido en Güemes (Salta).",
    proc:["Pozos de salmuera","Pozas de evaporación","Planta de fosfato de litio (salar)","Planta de hidróxido de litio (Parque Industrial de Güemes)","Planta II: carbonato de litio"],
    prod:"Hidróxido de litio (el primero producido en el país) y carbonato de litio",
    nums:[["Hidróxido (Güemes, 2024)","25.000 t/año","posco"],["Planta II de carbonato (inaugurada oct-2026)","≈ 23.000 t/año","posco"],["Fases III y IV (MoU)","Hasta 100.000 t/año de productos de litio","posco"]],
    src:["posco"]
  },
  "mi-hmo": {
    met:"Salmuera con nanofiltración y pozas de evaporación (unos 3 meses) para obtener un concentrado de cloruro de litio.",
    proc:["Pozos de salmuera (0,5% Li)","Nanofiltración: separa impurezas","Pozas de evaporación finales","Concentrado de cloruro de litio al 6% Li"],
    prod:"Concentrado de cloruro de litio (6% Li)",
    nums:[["Fase 1","4.000 t/año LCE estabilizado","galan"],["Ampliación","+5.200 t/año (1S 2027)","galan"],["Fase 2","21.000 t/año (permisos aprobados); plan de 4 fases hasta 60.000 t/año","galan"],["Offtake","Authium (EE.UU.): 45.000 t de concentrado en 6–12 años","galan"]],
    src:["galan"]
  },


  // ---------------- Fichas completadas el 28-oct-2026 ----------------
  "ln-vmos": { met:"Oleoducto troncal de exportación: el crudo de Vaca Muerta se impulsa con estaciones de bombeo hasta una terminal de aguas profundas con monoboyas.",
    proc:["Cabecera en Allen (Río Negro)","Oleoducto troncal de 437 km hasta Punta Colorada","4 estaciones de bombeo y 28 válvulas de bloqueo","Playa de tanques en Punta Colorada","Monoboyas mar adentro y carga de buques"],
    prod:"Crudo Medanito de Vaca Muerta para exportación",
    nums:[["Longitud","437 km (Allen – Punta Colorada)","rnVmos"],["Capacidad","390.000 bbl/d iniciales, ampliable a 550.000 bbl/d en 2027","rnVmos"],["Capacidad base en la resolución RIGI","377.400 bbl/d","bo302_25"],["Bombeo","4 estaciones de bombeo y 28 válvulas de bloqueo","rnVmos"],["Almacenaje en destino","6 tanques de 120.000 m³","rnVmos"],["Inversión computable RIGI","US$ 2.486 M","bo302_25"]],
    src:["rnVmos","bo302_25"] },
  "ln-gpm": { met:"Gasoducto troncal de alta presión: el gas acondicionado en Tratayén se impulsa con plantas compresoras hasta el nodo Saturno (Salliqueló), donde empalma con el sistema troncal de TGS.",
    proc:["Acondicionamiento del gas en Tratayén (Neuquén)","Planta compresora cabecera Tratayén","Ducto de 36\" por Río Negro y La Pampa","Planta compresora Saturno (Salliqueló, Buenos Aires)","Entrega al sistema troncal"],
    prod:"Gas natural de Vaca Muerta",
    nums:[["Longitud","573 km (Tratayén – Saturno)","crGpnk"],["Diámetro","36 pulgadas","crGpnk"],["Capacidad con compresión","21 MMm³/d","crGpnk"],["Construcción","10 meses, a cargo de ENARSA: UT Techint-Sacde (440 km) y BTU (133 km)","crGpnk"],["Ampliación RIGI (TGS)","US$ 550 M totales · US$ 513 M computables","bo676_26"]],
    src:["crGpnk","bo676_26","seSIG"] },
  "ag-tmult": { met:"Terminal portuaria multipropósito sobre la Vía Navegable Troncal (río Paraná): granel sólido, granos, carga general y líquidos en un mismo predio.",
    proc:["Ingreso de camiones y balanza","Depósito fiscal para graneles bajo control aduanero","Almacenaje en celdas, silos y tanques","Muelle sobre el Paraná","Carga y descarga de buques (importación y exportación)"],
    prod:"Graneles sólidos (fertilizantes y granos), carga general y líquidos",
    nums:[["Inversión computable RIGI","US$ 277 M","bo1842_25"],["Predio","186 ha","bo1842_25"],["Tanques de líquidos","Hasta 120.000 m³","bo1842_25"],["Depósito fiscal habilitado por ARCA","≈ 29.450 m² (celda techada y plazoleta descubierta) para graneles sólidos","arcaTim"]],
    src:["bo1842_25","arcaTim","bcrPto"] },
  // ---------------- Fichas completadas el 27-oct-2026 ----------------
  "ln-tgnn": { met:"Gasoducto troncal de alta presión operado por TGN; el gas avanza impulsado por plantas compresoras a lo largo del trazado.",
    proc:["Ingreso de gas en Campo Durán (Salta) y, con la reversión, desde la cuenca Neuquina","Plantas compresoras a lo largo del trazado","Medición y entrega a distribuidoras, usinas e industrias","Llegada al nodo San Jerónimo (Santa Fe)"],
    prod:"Gas natural en tránsito (servicio de transporte firme e interrumpible)",
    nums:[["Longitud del trazado","1.454 km (4.586 km de cañerías con los paralelos)","tgnSis"],["Capacidad de transporte","28 MMm³/d","tgnSis"],["Plantas compresoras","12, con 204.620 HP instalados","tgnSis"]],
    src:["tgnSis"] },
  "ln-tgnco": { met:"Gasoducto troncal de alta presión operado por TGN, de la cuenca Neuquina al centro del país.",
    proc:["Cabecera en Loma La Lata (Neuquén)","Plantas compresoras en Mendoza, San Luis y Córdoba","Entregas a distribuidoras e industrias de Cuyo y el centro","Llegada al nodo San Jerónimo (Santa Fe)"],
    prod:"Gas natural en tránsito",
    nums:[["Longitud del trazado","1.121 km (2.256 km de cañerías con los paralelos)","tgnSis"],["Capacidad de transporte","32 MMm³/d","tgnSis"],["Plantas compresoras","8, con 171.000 HP instalados","tgnSis"]],
    src:["tgnSis"] },
  "ln-neuba": { met:"Gasoductos troncales Neuba I y Neuba II, operados por TGS, que llevan el gas neuquino a Bahía Blanca y al Gran Buenos Aires.",
    proc:["Recepción de gas tratado en la cuenca Neuquina","Plantas compresoras","Complejo Cerri (Bahía Blanca): separación de líquidos del gas","Entrega a distribuidoras del sur bonaerense y el AMBA"],
    prod:"Gas natural en tránsito; en Cerri se extraen etano, propano, butano y gasolina",
    nums:[["Red total de TGS (todos sus gasoductos)","9.248 km","tgsTr"],["Plantas compresoras de TGS","32, con 772.100 HP instalados","tgsTr"]],
    nota:"TGS publica las cifras de su red completa; las de cada gasoducto por separado se cargan cuando haya fuente oficial.",
    src:["tgsTr"] },
  "ln-sm": { met:"Gasoducto troncal operado por TGS que trae el gas de la cuenca Austral por la costa patagónica.",
    proc:["Cabecera en San Sebastián (Tierra del Fuego) y cruce del Estrecho de Magallanes","Plantas compresoras en Santa Cruz, Chubut y Río Negro","Llegada a Bahía Blanca y empalme con el resto de la red de TGS","Entrega a distribuidoras patagónicas y bonaerenses"],
    prod:"Gas natural en tránsito",
    nums:[["Red total de TGS (todos sus gasoductos)","9.248 km","tgsTr"],["Plantas compresoras de TGS","32, con 772.100 HP instalados","tgsTr"]],
    nota:"TGS publica las cifras de su red completa; las de este gasoducto por separado se cargan cuando haya fuente oficial.",
    src:["tgsTr"] },
  "ln-dup": { met:"Oleoducto troncal de crudo, de la cuenca Neuquina a la costa atlántica; el crudo se impulsa con estaciones de bombeo y se almacena en cabecera (Allen) y en destino (Puerto Rosales).",
    proc:["Recepción de crudo de los yacimientos en Allen (Río Negro)","Estaciones de bombeo (Chichinales, Zorrilla, Río Colorado, Salitral y otras)","Oleoducto troncal y paralelo Duplicar (525 km)","Entrega en Puerto Rosales a refinerías y a la terminal de exportación"],
    prod:"Petróleo crudo Medanito",
    nums:[["Capacidad con Duplicar Plus","86.000 m³/d (≈ 540.000 bbl/d)","oldDup"],["Capacidad previa","36.000 m³/d","oldDup"],["Nuevo ducto","525 km, de los cuales 455 km en 24 pulgadas","oldDup"],["Inversión de Duplicar","US$ 1.200 M, 79% financiado con contratos ship-or-pay a 15 años","oldDup"],["Concesión","Prorrogada hasta 2037 (Res. 643/22)","oldDup"]],
    hitos:[["sep-2022","Inicio de obra de Duplicar"],["oct-2023","Primer hito: +20.000 bbl/d"],["2025","Habilitación completa prevista por la empresa"]],
    src:["oldDup"] },
  "og-pr": { met:"Terminal marítima de almacenaje y carga de crudo con monoboyas en aguas profundas, alimentada por los oleoductos de Oldelval.",
    proc:["Recepción de crudo por oleoducto","Tanques de almacenaje","Bombeo a monoboyas (Punta Ancla y Punta Cigüeña)","Carga de buques tanque para cabotaje y exportación"],
    prod:"Crudo de la cuenca Neuquina para refinerías del país y exportación",
    nums:[["Almacenaje","479.994 m³ en 18 tanques","oteInv"],["Monoboyas","2, con 2.400 m³/h de bombeo","oteInv"],["Ampliación","6 tanques de 50.000 m³, muelle de dos sitios y monoboya para buques de 150.000 TPM; diseñada para recibir 86.000 m³/d","oteInv"],["Inversión de la ampliación","US$ 572 M","oteInv"],["Accionistas","Oiltanking 70% · YPF 30%","oteInv"]],
    src:["oteInv"] },
  "ln-hidro": { met:"Vía navegable troncal dragada y balizada del río Paraná y el Río de la Plata; por ella salen los buques graneleros de los puertos del Gran Rosario.",
    proc:["Carga en terminales del Gran Rosario (hasta el km 470, 34 pies)","Navegación por el Paraná inferior y el Paraná de las Palmas","Canales del Río de la Plata","Salida al océano y completamiento de carga en puertos de aguas profundas"],
    prod:"Granos, harinas y aceites; también combustibles, contenedores y minerales",
    nums:[["Longitud en Argentina","1.477 km (3.681 km todo el sistema)","vntAGP"],["Profundidad","34 pies hasta Puerto San Martín (km 470); 15 pies hasta Santa Fe; 10 pies hasta Confluencia","vntAGP"],["Alcance","7 provincias, 4 países y 79 puertos","vntAGP"]],
    src:["vntAGP"] },
  "ln-nca": { met:"Ferrocarril de cargas concesionado (Grupo AGD), de trocha ancha, que une el centro del país con los puertos del Gran Rosario.",
    proc:["Carga de granos en acopios y plantas de Córdoba y Santa Fe","Formación de trenes","Transporte troncal","Descarga en terminales portuarias del Gran Rosario"],
    prod:"Granos, subproductos y otras cargas",
    nums:[["Carga transportada (2T 2024)","1.750.356 t, la mayor de los operadores ferroviarios del período","cnrt24"],["Tráfico (2T 2024)","663,9 millones de t-km","cnrt24"]],
    src:["cnrt24"] },
  "ln-belg": { met:"Red estatal de cargas (Trenes Argentinos Cargas, líneas Belgrano, San Martín y Urquiza) que baja la producción del norte a los puertos del Gran Rosario.",
    proc:["Carga en el NOA y el NEA","Transporte por la línea Belgrano (trocha métrica)","Llegada a terminales de Timbúes y el Gran Rosario"],
    prod:"Granos del NOA y NEA, y otras cargas",
    nums:[["Línea Belgrano (2T 2024)","668.693 t y 490 millones de t-km","cnrt24"],["Línea San Martín (2T 2024)","1.111.967 t","cnrt24"],["Línea Urquiza (2T 2024)","124.504 t","cnrt24"]],
    src:["cnrt24"] },
  "ag-bb": { met:"Puerto de aguas profundas administrado por un consorcio público; terminales de granos, combustibles, gases y petroquímicos en el estuario de Bahía Blanca.",
    proc:["Llegada de granos por camión y tren","Terminales de embarque de granos (Ingeniero White y Galván)","Muelles de combustibles, gases y petroquímicos","Carga de buques de ultramar"],
    prod:"Granos, combustibles, gases, fertilizantes, aceites y petroquímicos",
    nums:[["Movimiento total 2025","18,76 Mt (80% exportación)","pbb25"],["Granos 2025","12,62 Mt","pbb25"],["Combustibles y gases 2025","2,13 Mt de combustibles y 1,78 Mt de gases","pbb25"],["Fertilizantes 2025","1,19 Mt","pbb25"]],
    src:["pbb25"] },
  "mi-puna-operation-chinchillas-pirquitas": { met:"Mina de plata-plomo-zinc a cielo abierto (Chinchillas) cuyo mineral se procesa en la planta de Pirquitas, a 40 km.",
    proc:["Perforación y voladura en Chinchillas","Acarreo de 40 km a la planta de Pirquitas","Molienda y flotación","Concentrado de plata-plomo y concentrado de zinc"],
    prod:"Concentrados de plata-plomo y de zinc",
    nums:[["Reservas (31-dic-2025)","18,1 Moz de plata con 119,6 g/t","ssrPuna"],["Recursos medidos e indicados","22,3 Moz de plata con 184,9 g/t","ssrPuna"],["Recursos inferidos","24,1 Moz de plata con 239,7 g/t","ssrPuna"]],
    hitos:[["2009","Producción comercial en la planta de Pirquitas"],["dic-2018","Producción comercial en Chinchillas"]],
    src:["ssrPuna"] },
  "mi-las-calandrias": { met:"Oro y plata epitermal a cielo abierto, procesado por lixiviación en pilas; el mineral de mayor ley va a la planta CIL de Martinetas (Minera Don Nicolás, Cerrado Gold).",
    proc:["Mina a cielo abierto","Chancado","Pila de lixiviación (mineral de baja ley)","Planta CIL de Martinetas (mineral de más de 2,5 g/t)","Doré"],
    prod:"Doré de oro y plata",
    nums:[["Producción de Minera Don Nicolás (3T 2026)","16.685 oz de oro equivalente (9.649 de pila y 7.036 de CIL)","cerrQ3"],["Ritmo de la pila (3T 2026)","9.250 t/día","cerrQ3"],["Guía 2026","50.000–60.000 oz de oro equivalente, hacia el extremo superior","cerrQ3"]],
    hitos:[["fin 1T 2027","Nueva pila de lixiviación con 12 Mt de capacidad"]],
    src:["cerrQ3"] },
  "mi-calcatreu": { met:"Oro y plata epitermal en Ingeniero Jacobacci (Río Negro), con lixiviación y recuperación a doré.",
    proc:["Mina a cielo abierto","Chancado","Lixiviación","Recuperación y fundición a doré"],
    prod:"Doré de oro y plata",
    nums:[["Inicio de la lixiviación","15-abr-2026","pgCalc"],["Despachos de doré","518 oz AuEq (jun-2026) · tercer despacho de ≈ 996 oz AuEq (ago-2026)","pgCalc"]],
    hitos:[["15-abr-2026","Comienza la lixiviación"],["jun-2026","Primer despacho de doré"],["27-ago-2026","Se levanta la suspensión parcial y sale el tercer despacho"]],
    src:["pgCalc"] },

  // ---------------- MINERÍA · COBRE ----------------
  "mi-vicuna": {
    met:"Pórfido de cobre-oro-plata a cielo abierto (Josemaría y Filo del Sol), en la alta cordillera de San Juan.",
    proc:["Mina a cielo abierto (Josemaría)","Planta concentradora de sulfuros","Etapa 2: planta de óxidos de Filo del Sol (Cu, Au, Ag)","Etapa 3: ampliación del concentrador + sulfuros de Filo del Sol, planta desaladora y transporte de concentrado"],
    prod:"Concentrado de cobre con oro y plata",
    nums:[["Producción promedio (PEA, 25 años)","395.000 t de cobre, 711.000 oz de oro y 22,2 Moz de plata por año","vicPEA"],["Procesamiento objetivo","≈ 293.000 t/día","vicPEA"],["Inversión RIGI","US$ 9.737 M totales · US$ 9.025 M computables (Res. ME 1154/2026)","bo1154_26"],["Cronograma de inversión RIGI","Etapa 1 hasta dic-2026 · etapa 2 de 2027 a 2031","bo1154_26"],["Primera producción","2030 (Josemaría, según el estudio de la empresa)","vicPEA"]],
    hitos:[["jun-2026","Adhesión al RIGI"],["30-jul-2026","Res. ME 1154/2026 en el Boletín Oficial"],["dic-2028","Plazo para la inversión mínima RIGI"],["2030","Primera producción (Josemaría)"]],
    src:["vicPEA","bo1154_26"]
  },
  "mi-azules": {
    met:"Pórfido de cobre a cielo abierto con lixiviación en pilas y SX-EW: produce cátodos en la mina, sin fundición ni concentrado.",
    proc:["Mina a cielo abierto","Chancado","Pilas de lixiviación con ácido","Extracción por solventes (SX)","Electro-obtención (EW): cátodos"],
    prod:"Cátodos de cobre 99,99% (grado A de la LME)",
    nums:[["Producción años 1–5","≈ 204.800 t/año de cobre","azulFS"],["Promedio vida útil","≈ 148.200 t/año","azulFS"],["Ley media","0,45% Cu total","azulFS"],["Inversión inicial","US$ 3.168 M","azulFS"],["VAN / TIR (después de impuestos)","US$ 2.940 M al 8% · 19,8%","azulFS"],["Vida útil","21 años","azulFS"]],
    hitos:[["2029","Arranque de la planta SX-EW"],["2030","Primer cobre"]],
    src:["azulFS"]
  },
  "mi-pachon": {
    met:"Pórfido de cobre-molibdeno a cielo abierto (Glencore).",
    proc:TEC_GEN["mi-cu"].proc, prod:"Concentrado de cobre y de molibdeno",
    nums:[["Recursos","≈ 6.000 Mt con 0,43% Cu, 2,2 g/t Ag y 130 g/t Mo","glenMA"],["Inversión fase 1","US$ 9.500 M (rango 8.500–10.500 M), solicitud RIGI en evaluación","glc_ago25"]],
    src:["glenMA","glc_ago25"]
  },
  "mi-mara": {
    met:"Pórfido de cobre-oro-plata-molibdeno a cielo abierto (Agua Rica, a unos 3.300 m s. n. m.) que usará la planta concentradora y la logística de La Alumbrera.",
    proc:["Mina Agua Rica (cielo abierto)","Chancado y transporte a la planta de Alumbrera","Molienda y flotación","Concentrado de cobre con oro y plata + concentrado de molibdeno","Transporte a puerto y exportación"],
    prod:"Concentrado de cobre con oro y plata; concentrado de molibdeno",
    nums:[["Mineral a extraer","780 Mt en 23 años de vida útil","bo1854_26"],["Producción total prevista","3,46 Mt de cobre, 2,34 Moz de oro, 41,2 Moz de plata y 99.854 t de molibdeno","bo1854_26"],["Exportaciones previstas","10,8 Mt de concentrado de cobre-oro-plata y 239.455 t de concentrado de molibdeno","bo1854_26"],["Inversión RIGI","US$ 6.394 M totales · US$ 3.311 M computables (Res. ME 1854/2026)","bo1854_26"],["Compromiso de los dos primeros años","US$ 771,5 M (111,6 + 659,9)","bo1854_26"],["Proveedores locales","54% de la inversión (mínimo exigido: 20%)","bo1854_26"],["Recursos","≈ 1.200 Mt: 0,47% Cu, 0,20 g/t Au, 3,4 g/t Ag, 0,03% Mo","glenMA"]],
    hitos:[["18-ago-2025","Solicitud de adhesión al RIGI"],["30-sep-2026","El Comité Evaluador recomienda aprobarlo (adhesión)"],["27-oct-2026","Res. ME 1854/2026 en el Boletín Oficial"],["nov-2027","Inicio de la construcción"],["dic-2028","Plazo para la inversión mínima RIGI"],["oct-2031","Inicio de la operación"]],
    src:["bo1854_26","glenMA"]
  },
  "mi-taca": {
    met:"Pórfido de cobre-oro-molibdeno a cielo abierto en la Puna salteña (First Quantum).",
    proc:TEC_GEN["mi-cu"].proc, prod:"Concentrado de cobre; oro y molibdeno como subproductos",
    nums:[["Producción (primeros 10 años)","291.000 t/año de cobre","tacaT"],["Inversión","US$ 5.250 M (antes US$ 3.600 M)","tacaT"],["Vida útil","35 años","tacaT"]],
    src:["tacaT"]
  },
  "mi-psj": {
    met:"Yacimiento de cobre-oro en Uspallata, con flotación convencional.",
    proc:["Mina","Chancado y molienda","Flotación","Concentrado de cobre"],
    prod:"Concentrado de cobre",
    nums:[["Producción","≈ 40.000 t/año de concentrado de cobre","psjDIA"],["Inversión inicial","US$ 559 M","psjDIA"],["Vida útil","16 años","psjDIA"],["Construcción","18–24 meses tras la factibilidad","psjDIA"]],
    src:["psjDIA"]
  },

  // ---------------- MINERÍA · ORO Y PLATA ----------------
  "mi-vel": {
    met:"Oro-plata a cielo abierto, a más de 4.000 m de altura, con lixiviación en pilas (valley fill) con solución cianurada.",
    proc:["Mina a cielo abierto","Chancado","Pila de lixiviación (fase 8 al 60%)","Recuperación del oro de la solución","Fundición: barras doré"],
    prod:"Doré de oro y plata",
    nums:[["Producción 2025","412.000 oz de oro (100%)","pmVel"],["Producción 2024","504.000 oz","pmVel"],["Vida útil remanente","8 años","pmVel"],["Ampliación","Nuevas fases de lixiviación: +89 Mt de capacidad","pmVel"]],
    src:["pmVel","minasLM"]
  },
  "mi-cn": {
    met:"Oro-plata en vetas epitermales, principalmente subterráneo, con planta de lixiviación por agitación.",
    proc:["Mina subterránea por vetas","Chancado y molienda","Lixiviación por agitación con cianuro","Decantación en contracorriente","Merrill-Crowe (precipitación con zinc)","Fundición: barras doré"],
    prod:"Doré de oro y plata",
    nums:[["Producción proyectada 2026","220.000 oz de oro","pmCN"],["Promedio 2023","269.000 oz","pmCN"],["Inversión 2026","US$ 95 M sostenimiento + US$ 120 M desarrollo","pmCN"],["Vida útil remanente","10 años","pmCN"]],
    src:["pmCN","minasLM"]
  },
  "mi-cv": {
    met:"Oro-plata epitermal a cielo abierto y subterráneo.",
    proc:TEC_GEN["mi-au"].proc, prod:"Doré de oro y plata",
    nums:[["Producción 1S 2026","95.000 oz de oro (+1% interanual)","agaH1"],["Costo total sostenido (AISC)","US$ 1.288/oz","agaH1"],["Accionistas","AngloGold Ashanti 92,5% · Fomicruz 7,5%","agaH1"]],
    src:["agaH1"]
  },
  "mi-sj": {
    met:"Oro-plata en vetas epitermales, mina subterránea.",
    proc:TEC_GEN["mi-au"].proc, prod:"Oro y plata (doré y concentrado)",
    nums:[["Producción 1S 2026","38.570 oz de oro y 1,56 Moz de plata (58.800 oz equivalentes)","hocH1"],["Mineral tratado 1S 2026","366.912 t","hocH1"],["Accionistas","Hochschild 51% · McEwen 49%","hocH1"]],
    src:["hocH1"]
  },
  "mi-cm": {
    met:"Plata-oro epitermal: mina subterránea y rajo a cielo abierto (Naty Condor desde 2026).",
    proc:TEC_GEN["mi-au"].proc, prod:"Doré de plata y oro",
    nums:[["Producción 1S 2026","1,26 Moz de plata y 47.500 oz de oro","paasQ2"],["2T 2026 vs 2T 2025","Plata +22% y oro +61% por mayores leyes (zona Martina)","paasQ2"]],
    src:["paasQ2"]
  },
  "mi-dn": {
    met:"Oro-plata epitermal en el Macizo del Deseado, con desarrollo subterráneo en rampa.",
    proc:TEC_GEN["mi-au"].proc, prod:"Doré de oro y plata",
    nums:[["Producción 1T 2026","12.842 oz de oro equivalente","cerrado"],["Guía 2026","50.000–60.000 oz equivalentes","cerrado"]],
    src:["cerrado"]
  },
  "mi-lin": {
    met:"Oro a cielo abierto en la Puna salteña con lixiviación en pilas.",
    proc:["Mina a cielo abierto","Chancado en tres etapas","Apilado en la pila de lixiviación","Planta de recuperación","Barras doré"],
    prod:"Doré de oro",
    nums:[["Guía 2026","92.000–102.000 oz de oro","fortuna"],["Producción 1S 2026","42.374 oz","fortuna"],["Producción 2025","87.489 oz","fortuna"],["Inversión 2026","US$ 41 M (sostenimiento y exploración)","fortuna"]],
    src:["fortuna"]
  },
  "mi-gualca": {
    met:"Oro refractario en carbonatos profundos, mina subterránea. Requiere oxidación a presión (POX), la primera planta de ese tipo en Sudamérica.",
    proc:["Mina subterránea","Molienda","Oxidación a presión en autoclave (POX)","Lixiviación con cianuro","Barras doré"],
    prod:"Doré de oro",
    nums:[["Reservas","2,45 Moz (recursos 3,5 Moz)","gualca"],["Inversión RIGI","US$ 520 M computables · US$ 665 M totales (Res. ME 6/2026)","bo6_26"],["Vida útil","Al menos 30 años","gualca"],["Calendario","Construcción hacia fines de 2027; producción hacia fines de 2029","gualca"],["Energía","Parque solar de 50 MW","gualca"]],
    src:["gualca"]
  },
  "mi-diablillos": {
    met:"Plata-oro a cielo abierto con lixiviación en tanques (Puna salteña-catamarqueña).",
    proc:["Mina a cielo abierto (relación estéril/mineral 5,9)","Chancado y molienda","Lixiviación en tanques: 9.000 t/día","Recuperación de plata y oro","Barras doré"],
    prod:"Doré de plata y oro",
    nums:[["Producción años 1–5","13,9 Moz de plata y 89.000 oz de oro por año (~20 Moz AgEq)","abraDFS"],["Promedio vida útil","5,9 Moz de plata y 62.000 oz de oro por año","abraDFS"],["Inversión inicial","US$ 722 M","abraDFS"],["VAN 5% / TIR","US$ 3.000 M · 41,9% (caso base)","abraDFS"],["Vida útil","25 años","abraDFS"]],
    hitos:[["3T 2026","Obras tempranas"],["2T 2027","Decisión de construcción"],["2029","Primera producción"]],
    src:["abraDFS"]
  },

  // ---------------- AGRO ----------------
  "ag-renova": { nums:[["Capacidad de molienda","≈ 33.000 t/día, la mayor del país","bcrCap"]], src:["bcrCap"] },
  "ag-t6":     { nums:[["Capacidad de molienda","20.000 t/día","bcrCap"],["Accionistas","Bunge + AGD","bcrCap"]], src:["bcrCap"] },
  "ag-molinos":{ nums:[["Capacidad de molienda","20.000 t/día (Muelle San Benito)","bcrCap"],["Proyecto nuevo","Planta de 15.000 t/día en Timbúes con ACA, más de US$ 500 M (jul-2026)","molTim"]], src:["bcrCap","molTim"] },
  "ag-cargill":{ nums:[["Capacidad de molienda","13.000 t/día","bcrCap"]], src:["bcrCap"] },
  "ag-lagos":  { nums:[["Capacidad de molienda","12.000 t/día","bcrCap"]], src:["bcrCap"] },
  "ag-ldc":    { nums:[["Capacidad de molienda","≈ 7.000 t/día","molTim"]], src:["molTim"] },
  "ag-deheza": { nums:[["Capacidad de molienda","≈ 17.000 t/día (dato de 2013; verificar)","bcrCap13"]], src:["bcrCap13"] },
  "ag-prof": {
    met:"Fertilizantes nitrogenados a partir de gas natural de Vaca Muerta y la Cuenca Neuquina.",
    proc:["Gas natural","Reformado con vapor → hidrógeno","Síntesis de amoníaco","Síntesis de urea","Granulado y despacho por buque y camión"],
    prod:"Urea granulada (46% N) y amoníaco",
    nums:[["Urea","≈ 1.320.000 t/año","profer"],["Amoníaco","≈ 790.000 t/año","profer"],["Mercado","Abastece más de la mitad de la urea que usa el país","profer"],["Ampliación en estudio","Duplicar la urea: US$ 1.500–2.000 M","profer"],["Accionistas","Adecoagro 90% · ACA 10% (desde dic-2025)","profer"]],
    src:["profer"]
  }
};
