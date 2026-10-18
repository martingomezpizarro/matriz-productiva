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
  "og-ltoldos": VM({ prod:OIL, nota:"Desarrollo en etapa de proyecto: los números de fractura y producción aparecerán cuando empiece a perforar en serie." }),
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
  "og-pc": { met:"Oleoducto + terminal de exportación de crudo (proyecto VMOS).", proc:["Oleoducto de ~437 km desde Allen (Río Negro)","Tanques en Punta Colorada","Monoboyas en aguas profundas","Buques VLCC"], prod:"Crudo Medanito de Vaca Muerta para exportación", src:["vmosAmb","ypf2T"] },
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
  "mi-sdo": {
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

  // ---------------- MINERÍA · COBRE ----------------
  "mi-vicuna": {
    met:"Pórfido de cobre-oro-plata a cielo abierto (Josemaría y Filo del Sol), en la alta cordillera de San Juan.",
    proc:["Mina a cielo abierto (Josemaría)","Planta concentradora de sulfuros","Etapa 2: planta de óxidos de Filo del Sol (Cu, Au, Ag)","Etapa 3: ampliación del concentrador + sulfuros de Filo del Sol, planta desaladora y transporte de concentrado"],
    prod:"Concentrado de cobre con oro y plata",
    nums:[["Producción promedio (PEA, 25 años)","395.000 t de cobre, 711.000 oz de oro y 22,2 Moz de plata por año","vicPEA"],["Procesamiento objetivo","≈ 293.000 t/día","vicPEA"],["Inversión RIGI","US$ 9.737 M (hasta US$ 18.000 M en la década)","vicRIGI"],["Etapa 1","≈ US$ 7.000 M, primera producción 2030","vicPEA"],["Vida útil","Más de 70 años","vicRIGI"]],
    hitos:[["jun-2026","RIGI aprobado"],["fin 2026","Decisión final de inversión esperada"],["2030","Primera producción (Josemaría)"]],
    src:["vicPEA","vicRIGI"]
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
    nums:[["Recursos","≈ 6.000 Mt con 0,43% Cu, 2,2 g/t Ag y 130 g/t Mo","glenMA"],["Inversión","US$ 9.500 M (presentado al RIGI)","glenMA"]],
    src:["glenMA"]
  },
  "mi-mara": {
    met:"Pórfido de cobre-oro-molibdeno a cielo abierto (Agua Rica) que usará la planta concentradora y la logística de La Alumbrera.",
    proc:["Mina Agua Rica","Planta concentradora de Alumbrera (flotación)","Concentrado Cu-Au y de molibdeno","Transporte a puerto"],
    prod:"Concentrado de cobre con oro; molibdeno",
    nums:[["Producción (primeros 10 años)","Más de 200.000 t/año de cobre en concentrado","glenMA"],["Recursos","≈ 1.200 Mt: 0,47% Cu, 0,20 g/t Au, 3,4 g/t Ag, 0,03% Mo","glenMA"],["Inversión","US$ 4.000 M (RIGI)","glenMA"],["Puente","Reapertura de Alumbrera: obras desde fines de 2026 y producción en el 1S 2028","glenMA"]],
    src:["glenMA"]
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
    nums:[["Reservas","2,45 Moz (recursos 3,5 Moz)","gualca"],["Inversión","Más de US$ 660 M (RIGI)","gualca"],["Vida útil","Al menos 30 años","gualca"],["Calendario","Construcción hacia fines de 2027; producción hacia fines de 2029","gualca"],["Energía","Parque solar de 50 MW","gualca"]],
    src:["gualca"]
  },
  "mi-diab": {
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
