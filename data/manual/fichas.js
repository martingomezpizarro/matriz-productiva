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
    nums:[["Producción (ago-2026)","64.737 bbl/d de petróleo y 4,76 MMm³/d de gas, sumando la parte de Chubut y la de Santa Cruz","cap4"],["Ranking","4ª área petrolera del país y primera convencional (ago-2026)","cap4"],["Operador","Pan American Energy","seConc"]],
    nota:"Es el mayor yacimiento convencional del país; produce más del 90% de su crudo sin fractura.", src:["cap4","seConc"]
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
  "og-tgsngl": {
    met:"Cadena de líquidos del gas natural (NGL): se separan del gas rico de Vaca Muerta en Neuquén, viajan por poliducto hasta la costa y se fraccionan en productos para exportar.",
    proc:["Gasoducto de segregación (≈ 100 km) que lleva gas rico a Tratayén","Ampliación de la planta Tratayén: extracción criogénica de líquidos","Poliducto de NGL hasta Bahía Blanca","Planta fraccionadora: separa propano, butano y gasolina natural","Almacenaje y terminal marítima para carga de buques"],
    prod:"Propano, butano y gasolina natural para exportación",
    nums:[["Inversión","≈ US$ 3.000 M (decisión final de inversión en el 2T 2026)","tgs2Q26"],["Exportaciones esperadas","≈ US$ 1.200 M por año","tgs2Q26"],["Inicio de operación","Marzo de 2030","tgs2Q26"],["Gasoducto de segregación","≈ 100 km","tgs2Q26"]],
    hitos:[["2T 2026","Decisión final de inversión"],["Oct-2026","Ministerio de Economía anuncia la aprobación del Comité Evaluador del RIGI (resolución pendiente)"],["Mar-2030","Puesta en marcha prevista"]],
    nota:"El RIGI se tramita con dos vehículos: Procesadora de Gas del Sur (Tratayén) y Midstream de Gas del Sur (poliducto y Bahía Blanca).", src:["tgs2Q26"]
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
    proc:["Etano de Mega y TGS","Crackers de vapor (steam cracking) → etileno","Polimerización (polietileno de alta y baja densidad)","Extrusión y pelletizado","Pellets de polietileno a mercado interno y exportación"],
    prod:"Etileno y polietileno (base de envases, films y caños)",
    nums:[["Plantas en Bahía Blanca","Seis: 2 de etileno y 4 de polietileno","dowAR"],["Escala","El complejo petroquímico más grande de América Latina, según la empresa","dowAR"],["Presencia de Dow en el país","Más de 60 años","dowAR"]],
    nota:"Dow es el principal comprador del etano argentino. Las capacidades en toneladas por año de cada planta siguen pendientes de una fuente oficial o de la empresa.", src:["dowAR","mega"]
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
  "mi-rincon-2": {
    met:"Salmuera con extracción directa de litio (DLE) en el Salar del Rincón: sin pozas de evaporación de largo plazo y con reinyección de la salmuera.",
    proc:["Bombeo de salmuera","Reactores DLE","Purificación y concentración","Planta de carbonato grado batería","Exportación"],
    prod:"Carbonato de litio grado batería",
    nums:[["Planta inicial","3.000 t/año (385 t en el 2T 2026, en estabilización)","rtQ2"],["Capacidad total","60.000 t/año (3k inicial + 50k planta grande + 7k optimización)","rtQ2"],["Inversión RIGI","US$ 2.744 M totales · US$ 2.299 M computables; US$ 1.294 M en los dos primeros años (Res. ME 735/2025)","bo735_25"],["Producción plena","Primera producción de la planta grande en 2028 y 3 años de rampa","rtQ2"]],
    hitos:[["2026","Planta inicial (3 kt) en rampa"],["2028","Primer litio de la planta de 50 kt"],["2031","Capacidad plena 60 kt (estimado por la rampa de 3 años)"]],
    src:["rtQ2","bo735_25"]
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


  // ---------------- Fichas completadas el 29-oct-2026 ----------------
  "ln-gsm": {
    met:"Gasoducto troncal dedicado a la exportación: lleva gas seco de Vaca Muerta a los buques de licuefacción flotante (FLNG) del Golfo San Matías, sin pasar por el sistema regulado.",
    proc:["Predio cabecera Tratayén (gas acondicionado)","Planta compresora de cabecera","Gasoducto troncal de 36\" (≈ 480 km)","Planta compresora San Antonio Oeste (repotenciada)","Entrega a los buques FLNG del Golfo San Matías"],
    prod:"Gas natural seco para licuefacción",
    nums:[["Longitud y diámetro","≈ 480 km · 36\"","bo873_26"],["Capacidad de transporte","27 MMm³/d","bo873_26"],["Compresión","Planta compresora nueva de 60.000 HP + repotenciación de San Antonio Oeste","bo873_26"],["Inversión RIGI","US$ 1.300 M totales; US$ 955 M computables en los dos primeros años","bo873_26"],["Vehículo","San Matías Pipeline S.A. (SMP)","bo873_26"]],
    src:["bo873_26"]
  },
  "ag-fertilpampa": {
    met:"Fertilizantes nitrogenados a partir de gas natural de Vaca Muerta, con escala de exportación.",
    proc:["Gas natural","Reformado con vapor → gas de síntesis (hidrógeno)","Síntesis de amoníaco (3.450 t/día)","Síntesis de urea en dos trenes gemelos","Granulación (2 × 3.000 t/día)","Almacenaje y despacho por buque en Ingeniero White"],
    prod:"Urea granulada (46% N) y amoníaco",
    nums:[["Urea","2 plantas de 3.000 t/día cada una","bo1468_26"],["Amoníaco","3.450 t/día","bo1468_26"],["Inversión RIGI","US$ 2.693 M en activos computables (etapa 1: US$ 1.105 M · etapa 2: US$ 1.588 M)","bo1468_26"],["Compromiso dos primeros años","US$ 1.666 M","bo1468_26"],["Predio","≈ 80 ha en el Puerto de Ingeniero White","bo1468_26"]],
    hitos:[["17-jul-2026","Contrato EPC firmado; arranca la etapa 1 (ingeniería y compras)"],["3-ago-2026","Adhesión al RIGI"],["7-sep-2026","Res. ME 1468/2026 en el Boletín Oficial"],["dic-2027","Fin de la etapa 1"],["1-dic-2029","Plazo para la inversión mínima RIGI"],["16-dic-2029","Fin de la etapa 2 (montaje, comisionado y puesta en marcha)"]],
    src:["bo1468_26"]
  },
  "ag-qq": {
    met:"Puerto de ultramar administrado por un consorcio público (Consorcio de Gestión del Puerto Quequén), en la desembocadura del río Quequén Grande; terminales de granos del sudeste bonaerense.",
    proc:["Llegada de camiones desde el sudeste bonaerense","Calado y clasificación","Acopio en silos y celdas de las terminales","Cinta y cargador de buques","Navegación por el canal de acceso al Atlántico"],
    prod:"Soja, maíz, trigo y cebada (forrajera y cervecera) a exportación",
    nums:[["Cargas 2025","9.009.768 t, récord histórico","pqq25"],["Buques 2025","370 (eslora promedio 208 m; máxima 235 m)","pqq25"],["Calado máximo operado","44,1 pies","pqq25"],["Principales granos 2025","Soja 2,41 Mt · maíz 2,04 Mt · trigo 1,53 Mt · cebada forrajera 1,30 Mt · cebada cervecera 0,70 Mt","pqq25"]],
    src:["pqq25","pqqEst"]
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
    nums:[["Producción","≈ 40.000 t/año de concentrado de cobre","psjDIA"],["Inversión inicial","US$ 559 M","psjDIA"],["Vida útil","16 años","psjDIA"],["Construcción","18–24 meses tras la factibilidad","psjDIA"],["RIGI (Res. ME 801/2026)","US$ 613 M en activos computables; US$ 189 M en los dos primeros años","bo801_26"]],
    hitos:[["13-may-2026","Adhesión al RIGI"],["28-may-2026","Res. ME 801/2026 en el Boletín Oficial"],["jun-2027","Inicio de construcción (según la resolución)"],["ene-2029","Inicio de operación (según la resolución)"]],
    src:["psjDIA","bo801_26"]
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
    nums:[["Producción años 1–5","13,9 Moz de plata y 89.000 oz de oro por año (~20 Moz AgEq)","abraDFS"],["Promedio vida útil","5,9 Moz de plata y 62.000 oz de oro por año","abraDFS"],["Inversión inicial","US$ 722 M","abraDFS"],["Inversión RIGI","US$ 482 M computables; US$ 352 M en los dos primeros años (Res. ME 562/2026)","bo562_26"],["VAN 5% / TIR","US$ 3.000 M · 41,9% (caso base)","abraDFS"],["Vida útil","25 años","abraDFS"]],
    hitos:[["3T 2026","Obras tempranas"],["2T 2027","Decisión de construcción"],["2029","Primera producción"]],
    src:["abraDFS"]
  },

  "mi-casposo": {
    met:"Oro y plata epitermal en Calingasta (San Juan), con planta de procesamiento propia. Reanudó operaciones en oct-2025 tras un período de parada.",
    proc:["Extracción del mineral","Chancado y molienda","Lixiviación con cianuro","Recuperación del metal","Fundición de barras doré"],
    prod:"Doré de oro y plata",
    nums:[["Guía 2026","11.000–13.000 oz de oro equivalente (seis meses con mineral propio)","agdG26"],["Reinicio","Operaciones reanudadas en oct-2025","agdG26"],["Plan 2026","1T y 3T: procesamiento a façon de mineral de Hualilán (Challenger); 2T y 4T: mineral propio","agdG26"],["Producción 1S 2026 (Austral Gold)","11.648 oz de oro equivalente sumando Casposo y Guanaco (Chile), casi el doble que el 1S 2025","agdH126"]],
    src:["agdG26","agdH126"]
  },
  "mi-hualilan": {
    met:"Oro-plata-zinc a cielo abierto en Ullum (San Juan): arranca con lixiviación en pilas y suma después una planta de flotación para el mineral sulfurado.",
    proc:["Mina a cielo abierto","Chancado","Lixiviación en pilas (8 Mt/año) para el mineral oxidado","Planta de flotación (1,5 Mt/año) para el sulfurado, unos dos años después","Doré de oro y concentrados"],
    prod:"Doré de oro (lixiviación) y concentrados con oro, plata y zinc (flotación)",
    nums:[["Producción","≈ 105.000 oz AuEq/año los primeros años; ≈ 135.000 oz AuEq/año el resto de la vida útil","celPFS26"],["Producción vida útil","1,84 Moz AuEq: 1,67 Moz de oro, 6,39 Moz de plata y 74.000 t de zinc","celPFS26"],["Reservas probables","62,9 Mt a 0,75 g/t Au: 1,51 Moz de oro, 7,73 Moz de plata y 170.000 t de zinc","celPFS26"],["Inversión","US$ 267 M iniciales con contingencia; US$ 604 M en toda la vida útil","celPFS26"],["VAN 5% / TIR","US$ 1.101 M después de impuestos · 45% antes de impuestos (oro a US$ 3.500/oz)","celPFS26"],["Vida útil","14,25 años de minería","celPFS26"]],
    hitos:[["18-may-2026","Actualización del estudio de prefactibilidad"],["≈ 18 meses de obra","Inicio de la lixiviación en pilas"],["+2 años","Arranque de la planta de flotación"]],
    src:["celPFS26"]
  },
  "mi-altar": {
    met:"Pórfido de cobre-oro en Calingasta (San Juan): tajo abierto que pasa a explotación subterránea por hundimiento de bloques (block caving).",
    proc:["Tajo abierto y luego block caving","Chancado y molienda","Flotación convencional (60.000 t/día)","Espesado y filtrado","Concentrado de cobre con oro y plata"],
    prod:"Concentrado de cobre con oro y plata",
    nums:[["Producción promedio años 1–20","108.579 t/año de cobre, 43.199 oz de oro y 570.217 oz de plata (121.445 t CuEq)","aldePEA25"],["Producción promedio vida útil","92.891 t/año de cobre (101.413 t CuEq)","aldePEA25"],["Inversión inicial","US$ 1.593 M","aldePEA25"],["VAN 8% / TIR","US$ 2.009 M · 20,5% después de impuestos (cobre a US$ 4,35/lb)","aldePEA25"],["Vida útil","48 años, incluidos 3 de construcción","aldePEA25"],["Participación","Aldebaran 80% (cifras al 100%)","aldePEA25"]],
    hitos:[["30-oct-2025","Evaluación económica preliminar (PEA), con recursos inferidos"]],
    src:["aldePEA25"]
  },
  "mi-navidad": {
    met:"Depósito de plata-plomo diseminado en la meseta central de Chubut, uno de los mayores recursos de plata sin desarrollar del mundo.",
    proc:["Extracción del mineral","Chancado y molienda","Flotación","Concentrado de plata-plomo"],
    prod:"Concentrado de plata y plomo (proyecto)",
    nums:[["Recursos medidos e indicados","155,2 Mt: 15,4 Mt a 137 g/t y 139,8 Mt a 126 g/t de plata (632,3 Moz)","paasRR26"],["Recursos inferidos","45,9 Mt a 81 g/t de plata (119,4 Moz)","paasRR26"],["Fecha de corte","30-jun-2026","paasRR26"]],
    src:["paasRR26"]
  },
  "mi-pozuelos-pastos-grandes": {
    met:"Litio en salmuera de los salares de Pastos Grandes y Pozuelos (Salta), con proceso híbrido: evaporación solar para concentrar y extracción directa (DLE) por solventes para purificar.",
    proc:["Pozos de bombeo de salmuera","Concentración en pozas de evaporación solar","Extracción directa (DLE) por extracción con solventes","Purificación","Precipitación de carbonato de litio"],
    prod:"Carbonato de litio (admite hidróxido o cloruro)",
    nums:[["Capacidad","150.000 t/año de carbonato de litio equivalente, en tres etapas de 50.000 t/año","larPPG25"],["Inversión","Etapa 1: US$ 1.124 M (16% de contingencia); total: US$ 3.301 M","larPPG25"],["VAN 8% / TIR","US$ 8.100 M · 32,7% después de impuestos (carbonato a US$ 18.000/t)","larPPG25"],["Recursos medidos e indicados","15,1 Mt de carbonato de litio equivalente (más 6,7 Mt inferidos)","larPPG25"],["Vida útil","30 años","larPPG25"],["Participación","Ganfeng 67% · Lithium Argentina 33%","larPPG25"]],
    hitos:[["7-nov-2025","Declaración de impacto ambiental de la etapa 1 (Salta)"],["10-nov-2025","Estudio de alcance (scoping study)"],["1S 2026","Solicitud RIGI prevista por las empresas"]],
    src:["larPPG25"]
  },

  "mi-bajo-de-la-alumbrera": {
    met:"Pórfido de cobre-oro a cielo abierto en Belén (Catamarca), con concentradora propia. Glencore reactiva la mina para alargar su vida útil y mantener la planta, la gente y la infraestructura que va a compartir con Agua Rica (MARA).",
    proc:["Perforación y voladura en el tajo","Chancado y molienda","Flotación","Espesado y filtrado","Concentrado de cobre con oro y molibdeno"],
    prod:"Concentrado de cobre con oro; molibdeno",
    nums:[["Producción prevista","≈ 75.000 t de cobre, 317.000 oz de oro y 1.000 t de molibdeno en total, en cuatro años de operación","glenCMD25"],["Reinicio de la mina","Junio de 2026, adelantado respecto del plan","glenH126"],["Primera producción","2S 2027 (la guía original era el 1S 2028)","glenH126"],["Vínculo con MARA","La infraestructura de Alumbrera se comparte con Agua Rica (MARA)","glenCMD25"]],
    hitos:[["dic-2025","Glencore anuncia la reactivación (Capital Markets Day)"],["2-jun-2026","Reinicio de la explotación minera"],["2S 2027","Primera producción prevista"]],
    src:["glenCMD25","glenH126"]
  },
  "mi-cap-oeste": {
    met:"Oro y plata epitermal en el Macizo del Deseado (Santa Cruz). Hoy produce con operaciones residuales sobre el material ya apilado mientras Patagonia Gold desarrolla el proyecto subterráneo.",
    proc:["Lixiviación residual del material en pilas","Recuperación del metal de la solución","Fundición de barras doré","Desarrollo subterráneo (proyecto)"],
    prod:"Doré de oro y plata",
    nums:[["Producción 1T 2026","390 oz de oro equivalente (173 oz de oro y 11.836 oz de plata), de operaciones residuales","pgdQ126"],["Ventas 1T 2026","432 oz de oro equivalente (211 oz de oro y 11.839 oz de plata)","pgdQ126"],["Proyecto","Desarrollo subterráneo de Cap-Oeste","pgdQ126"]],
    src:["pgdQ126"]
  },
  "mi-kachi": {
    met:"Litio en salmuera en Antofagasta de la Sierra (Catamarca) con extracción directa (DLE) por intercambio iónico y reinyección de casi toda la salmuera al acuífero: sin pozas de evaporación.",
    proc:["Pozos de producción de salmuera (11)","Extracción directa por intercambio iónico (Lilac Gen4)","Reinyección de la salmuera agotada (14 pozos)","Concentración y purificación del eluido","Carbonato de litio grado batería"],
    prod:"Carbonato de litio grado batería",
    nums:[["Capacidad","≈ 25.000 t/año de carbonato de litio equivalente","lkeAR25"],["Inversión","US$ 1.157 M (16% menos que el estudio anterior)","lkeAR25"],["Costo operativo","US$ 5.895/t LCE","lkeAR25"],["VAN 10% / TIR","US$ 1.011 M · 19,7% después de impuestos (carbonato a ≈ US$ 20.500/t)","lkeAR25"],["Reservas","626.760 t LCE (174.230 probadas y 452.540 probables)","lkeAR25"],["Recursos","11,1 Mt LCE (8,2 Mt medidos e indicados) en 275 km²","lkeAR25"],["Vida útil","25 años","lkeAR25"]],
    hitos:[["14-may-2025","Actualización de recursos"],["4-ago-2025","Adenda del estudio de factibilidad (DFS) y reservas"],["Pendiente","Decisión final de inversión, después de la aprobación ambiental y de sumar un socio"]],
    src:["lkeAR25"]
  },
  "mi-sierra-pintada": {
    met:"Uranio en San Rafael (Mendoza): el mayor depósito de uranio conocido del país, explotado por la CNEA en canteras a cielo abierto y procesado en el Complejo Minero Fabril Sierra Pintada. Hoy está en remediación ambiental y bajo licencia de parada prolongada.",
    proc:["Explotación en canteras (1975–1997)","Procesamiento en el complejo minero fabril","Remediación fase 1: tratamiento del agua de cantera (uranio, radio y arsénico)","Recuperación del uranio remanente de los residuos en tambores","Disposición final en dique de múltiples barreras"],
    prod:"Concentrado de uranio (producción histórica); hoy en remediación",
    nums:[["Producción histórica","1.600 t de uranio entre 1975 y 1997, ≈ 20% del recurso total","cneaSP"],["Agua de cantera a tratar","≈ 1.300.000 m³","mzaSP19"],["Uranio a recuperar de residuos y agua","≈ 14 t","mzaSP19"],["Plazo de la remediación","Entre 5 y 8 años (hasta 10 para el agua de cantera), según el anuncio de 2019","mzaSP19"]],
    hitos:[["1975–1997","Operación de la CNEA"],["oct-2019","Comienzan los trabajos de remediación"],["Fase 1","Licencia de parada prolongada de la ARN y ensayo industrial de la planta de tratamiento de uranio concluido; planta de radio y arsénico en obra"]],
    src:["cneaSP","mzaSP19"]
  },
  "mi-candelas": {
    met:"Litio en salmuera en el sistema del Salar del Hombre Muerto (Antofagasta de la Sierra, Catamarca), con pozas de evaporación solar para preconcentrar y una planta de carbonato.",
    proc:["Pozos de bombeo de salmuera","Pozas de evaporación solar (preconcentración y purificación)","Precipitación de impurezas en dos etapas","Pulido por intercambio iónico","Precipitación con carbonato de sodio a 85 °C"],
    prod:"Carbonato de litio grado batería (grado técnico los primeros tres años)",
    nums:[["Capacidad","14.000 t/año de carbonato de litio","galCanPEA"],["Inversión","US$ 408 M","galCanPEA"],["Costo operativo","US$ 4.277/t LCE","galCanPEA"],["VAN 8% / TIR","US$ 660 M · 20,9% después de impuestos","galCanPEA"],["Recursos indicados","685.000 t LCE a 672 mg/l de litio","galCanPEA"],["Recuperación de litio","61,6%","galCanPEA"],["Vida útil","25 años sin contar la rampa","galCanPEA"]],
    hitos:[["30-nov-2021","Evaluación económica preliminar (PEA)"],["feb-2023","Galan pasa al 100% del proyecto"]],
    src:["galCanPEA"]
  },

  // ---------------- MINERÍA · fichas agregadas el 2-nov-2026 ----------------
  "mi-taguas": {
    met:"Oro y plata diseminados de baja ley a cielo abierto, con lixiviación en pilas (estudio económico preliminar).",
    proc:["Mina a cielo abierto (camión y pala)","Chancado","Apilado en capas de 10 m sobre pila de lixiviación permanente","Lixiviación con cianuro","Recuperación por Merrill-Crowe","Fundición de barras doré"],
    prod:"Doré de oro y plata",
    nums:[["Ritmo de planta","15.000 t/día; mina de hasta 14 Mt/año (con remanejo)","orvTagPEA"],["Producción en la vida del proyecto","430.000 oz de oro y 7,6 Moz de plata","orvTagPEA"],["Recuperación","Oro 83% · plata 42%","orvTagPEA"],["Inversión inicial","US$ 141,2 M (US$ 147,8 M en la vida del proyecto)","orvTagPEA"],["AISC promedio","US$ 915/oz de oro pagable","orvTagPEA"],["VAN 8% / TIR","US$ 56,9 M · 20,2% después de impuestos (oro a US$ 1.700/oz, plata a US$ 22/oz)","orvTagPEA"],["Vida útil","9,2 años de producción más 1 de construcción","orvTagPEA"],["Recursos inferidos","55,0 Mt a 0,35 g/t Au y 12,1 g/t Ag: 619.000 oz de oro y 21,4 Moz de plata (a jun-2021)","orvTagPEA"]],
    hitos:[["29-dic-2021","Orvana anuncia la actualización de la evaluación económica preliminar (PEA)"]],
    src:["orvTagPEA"]
  },
  "mi-arizaro": {
    met:"Litio en salmuera del Salar de Arizaro con una etapa de extracción directa (DLE) en el esquema de proceso.",
    proc:["Pozos de bombeo de salmuera","Extracción directa de litio (DLE)","Ósmosis inversa y evaporación mecánica","Purificación","Planta química: precipitación de carbonato de litio","Secado y envasado"],
    prod:"Carbonato de litio grado batería",
    nums:[["Capacidad","25.000 t/año de carbonato de litio","lchArzPEA"],["Inversión inicial","US$ 823 M","lchArzPEA"],["Costo operativo","US$ 5.197/t LCE","lchArzPEA"],["VAN 8% / TIR","US$ 1.100 M · 24,1% después de impuestos","lchArzPEA"],["Vida útil","19,1 años","lchArzPEA"],["Recursos","1.737.000 t LCE indicados y 1.583.000 t LCE inferidos","lchArzPEA"]],
    hitos:[["8-ago-2023","Lithium Chile publica la evaluación económica preliminar (PEA)"]],
    src:["lchArzPEA"]
  },
  "mi-rio-grande-2": {
    met:"Litio en salmuera con pozas de evaporación solar convencionales (la DLE se evaluará en la próxima etapa).",
    proc:["Pozos de bombeo de salmuera","Pozas de evaporación solar","Remoción de impurezas (magnesio, boro, calcio)","Precipitación con carbonato de sodio","Secado y envasado"],
    prod:"Carbonato de litio grado batería",
    nums:[["Capacidad","Hasta 40.000 t/año LCE en dos etapas de 20.000 t/año","noaRGPEA"],["Inversión inicial","US$ 706,2 M la etapa 1; la etapa 2 suma US$ 639,7 M","noaRGPEA"],["Costo operativo","US$ 5.897/t LCE a capacidad de placa (20.000 t/año); US$ 6.012/t en la vida del proyecto","noaRGPEA"],["VAN 8% / TIR (20.000 t/año)","US$ 1.276 M · 22,6% después de impuestos (carbonato a US$ 24.000/t)","noaRGPEA"],["Vida útil","30 años","noaRGPEA"],["Recursos","≈ 2,66 Mt LCE medidos e indicados y ≈ 2,04 Mt LCE inferidos, con ley media de más de 520 mg/l de litio","noaRGPEA"]],
    hitos:[["6-oct-2025","NOA Lithium publica la evaluación económica preliminar (PEA)"]],
    src:["noaRGPEA"]
  },
  "mi-hombre-muerto-norte": {
    met:"Litio en salmuera en el norte del Salar del Hombre Muerto.",
    proc:["Pozos de bombeo de salmuera","Concentración de la salmuera","Purificación","Precipitación de carbonato de litio","Secado y envasado"],
    prod:"Carbonato de litio",
    nums:[["Capacidad potencial","15.600 t/año de carbonato de litio (PEA del 30-abr-2024)","lisHMN25"],["Recursos","1.583.200 t LCE (1.463.000 medidas y 120.000 indicadas) a 736 mg/l de litio, en tres de los cinco bloques","lisHMN25"],["Venta a POSCO Argentina","Due diligence sustancialmente completa; negociación del acuerdo definitivo (sep-2025)","lisHMN25"]],
    hitos:[["30-abr-2024","Evaluación económica preliminar (PEA) de Lithium South"],["22-sep-2025","Lithium South informa la due diligence de POSCO casi completa y negocia el acuerdo definitivo"]],
    src:["lisHMN25"]
  },
  "mi-ivana": {
    met:"Uranio y vanadio en sedimentos superficiales (proyecto Amarillo Grande): minería a cielo abierto poco profunda.",
    proc:["Desbroce y minería superficial","Concentración del mineral","Procesamiento y producción de concentrados de uranio y vanadio"],
    prod:"Concentrado de uranio (U₃O₈) y pentóxido de vanadio (V₂O₅)",
    nums:[["Vida útil","11 años de operación minera superficial","smCoy240223"],["VAN después de impuestos","US$ 227,7 M","smCoy240223"],["TIR después de impuestos","38,9%","smCoy240223"],["Recupero de la inversión","1,9 años después de impuestos","smCoy240223"],["Base del estudio","Evaluación económica preliminar sobre recursos indicados e inferidos","smCoy240223"]],
    hitos:[["22-feb-2024","Blue Sky Uranium presenta la nueva evaluación económica preliminar (PEA) de Ivana"]],
    src:["smCoy240223"]
  },

  // ---------------- OIL & GAS · fichas agregadas el 1-nov-2026 ----------------
  "og-bdt": VM({ prod:OIL,
    nums:[["Inversión total declarada","US$ 8.729 M (solicitud RIGI)","ypfBdT"],["Pozos","440 en la vida del proyecto","ypfBdT"],["Meseta de producción","≈ 80.000 bbl/d de petróleo y 3 MMm³/d de gas entre 2033 y 2040","ypfBdT"],["Exportaciones","≈ US$ 25.000 M entre 2027 y 2055","ypfBdT"],["Socios","YPF 65% (operador) · Vista 35%","ypfBdT"]],
    hitos:[["30-oct-2026","YPF presenta la solicitud de adhesión al RIGI, la primera del «Hub Norte»"]],
    nota:"Áreas Bajo del Toro y Bajo del Toro Norte, en el norte de Vaca Muerta.",
    src:["seFrac","ypfBdT"] }),
  "og-arglng": {
    met:"GNL integrado: gas de Vaca Muerta tratado en tierra, llevado por gasoductos dedicados a la costa y licuado a −162 °C en buques de licuefacción flotantes (FLNG) amarrados frente a la costa.",
    proc:["Perforación y terminación de pozos no convencionales en Neuquén","Plantas de tratamiento de gas","Trenes de fraccionamiento de líquidos","Gasoductos dedicados hasta el Golfo San Matías","Pretratamiento y licuefacción a bordo de los FLNG","Almacenaje a bordo y carga de buques metaneros (transferencia barco a barco)"],
    prod:"Gas natural licuado (GNL) para exportación; líquidos del gas natural",
    nums:[["Capacidad","12 MTPA de GNL entre dos unidades FLNG","ypfArgLNG"],["Inversión total","US$ 51.000 M en la vida del proyecto","ypfArgLNG"],["Inversión hasta el arranque","≈ US$ 29.000 M hasta 2031 (≈ US$ 5.000 M en upstream)","ypfArgLNG"],["Exportaciones","≈ US$ 10.000 M por año durante unas dos décadas","ypfArgLNG"],["Empleo","≈ 20.000 puestos por año en construcción (2026–2030), con picos de hasta 40.000; ≈ 8.000 en operación (directos e indirectos)","ypfArgLNG"]],
    hitos:[["13-ago-2026","Solicitud de adhesión al RIGI"],["2031","Arranque previsto de los dos FLNG"]],
    src:["ypfArgLNG"]
  },
  "og-co": {
    met:"Terminal marítima de despacho de crudo: el petróleo del Golfo San Jorge llega por ducto a la playa de tanques y se carga en buques tanque amarrados a una monoboya mar adentro.",
    proc:["Recepción de crudo por oleoducto desde los yacimientos","Playa de tanques (almacenaje y medición)","Bombeo por ducto submarino","Monoboya CALM a ≈ 3.500 m de la costa","Carga de buque tanque"],
    prod:"Crudo Escalante, de la cuenca del Golfo San Jorge, para exportación y cabotaje",
    nums:[["Buques","Hasta 160.000 t de porte bruto (DWT)","termapInst"],["Amarre","Monoboya de amarre a punto único (SPM/CALM) con seis líneas de cadenas, a ≈ 3.500 m de la costa","termapHist"],["Existencia de crudo en la terminal","Máxima diaria de 115.000 m³ y mínima de 20.000 m³; promedio no mayor a 90.000 m³","termapReg"],["Tiempo de carga previsto (cláusula de demoras)","36 h para 68.000 m³ y 48 h para 150.000 m³","termapReg"],["Termap (Caleta Córdova + Caleta Olivia)","450 millones de m³ embarcados en más de 7.100 operaciones (hito 2023)","termapOp"]],
    hitos:[["feb-1994","Termap empieza a operar las terminales de Caleta Córdova y Caleta Olivia"]],
    src:["termapInst","termapHist","termapReg","termapOp"]
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
  },
  // ---------------- Fichas completadas el 3-nov-2026 ----------------
  "ag-cofco": {
    met:"Complejo agroindustrial y portuario sobre el Paraná: la soja llega en camión, se muele en el mismo predio y la harina y el aceite salen por buque.",
    proc:["Recepción y descarga de camiones con plataformas hidráulicas","Calado y almacenaje en silos","Acondicionamiento, quebrado y laminado","Extracción del aceite por solvente","Desolventizado y tostado de la harina; pelletizado","Carga de buques en el muelle propio"],
    prod:"Harina y pellets de soja, y aceite de soja",
    nums:[["Procesamiento","≈ 2,3 Mt/año de soja","cofTim"],["Recepción","≈ 900 camiones de soja por día","cofTim"],["Descarga","Hasta 10 camiones por hora por plataforma hidráulica","cofTim"],["Almacenaje","≈ 90.000 t en silos","cofTim"],["Energía propia","Hasta el 60% de su electricidad con turbinas a vapor","cofTim"]],
    src:["cofTim"] },
  "ag-mag": {
    met:"Mercado concentrador de hacienda en pie: los consignatarios rematan la hacienda por cuenta de los productores y la compran frigoríficos y matarifes. Sucedió al histórico Mercado de Liniers.",
    proc:["Llegada de la hacienda en camión","Descarga, pesaje y encierre en corrales","Remate por lotes a cargo de las casas consignatarias","Formación del precio de referencia del ganado","Despacho de la hacienda a faena"],
    prod:"Comercialización de hacienda vacuna (novillos, novillitos, vaquillonas, vacas y toros) y precios de referencia del mercado",
    nums:[["Predio","110 ha en el km 88 de la Ruta Provincial 6","gbaMAG"],["Capacidad","12.000 cabezas por día, ampliable en 6.000 más","gbaMAG"],["Inversión privada","US$ 20 M","gbaMAG"],["Firmas que operan","45","gbaMAG"]],
    hitos:[["6-jun-2023","Presentación y habilitación formal con el gobierno bonaerense"]],
    src:["gbaMAG"] },
  "mi-rincon": {
    met:"Salmuera de litio en el Salar del Rincón: bombeo de salmuera y proceso con extracción por solventes (SX) para obtener cloruro de litio, base del carbonato.",
    proc:["Pozos de bombeo de salmuera","Concentración de la salmuera","Extracción por solventes (SX) → cloruro de litio","Evaporación y cristalización","Conversión a carbonato de litio grado batería"],
    prod:"Cloruro de litio sólido (etapa 1a) y carbonato de litio grado batería",
    nums:[["Proyecto comercial","12.000 t/año de carbonato de litio; DFS en curso; la empresa informa que tiene la aprobación regulatoria para desarrollarlo","agyQ226"],["Planta demostrativa","2.000 t/año, con la operación suspendida y equipos en conservación","agyQ226"],["Prueba piloto SX","Cloruro de litio de 99% de pureza y recuperación máxima de 94,4%","agyQ226"],["Energía","Estudio de EDESA para hasta 40 MW: línea de 33 kV de ≈ 8,6 km a la red de 500 kV","agyQ226"],["Participación","Argosy 77,5% en el joint venture, con opción al 90%","agyQ226"]],
    hitos:[["sep-2026","Fin previsto de la ingeniería básica del DFS"]],
    src:["agyQ226"] },
  "mi-sal-de-los-angeles": {
    met:"Litio en salmuera en el Salar de Diablillos, desarrollado por Tibet Summit Resources (Xizang Zhufeng).",
    proc:TEC_GEN["mi-li"].proc,
    prod:"Carbonato de litio grado batería",
    nums:[["Capacidad anunciada","≈ 50.000 t/año de carbonato de litio grado batería","cancTSR"],["Inversión anunciada","US$ 700 M","cancTSR"]],
    hitos:[["4-nov-2022","Anuncio de la inversión en Shanghái (CIIE), informado por Cancillería"]],
    src:["cancTSR"] },
  "mi-mina-martha": {
    met:"Mina subterránea de vetas epitermales de plata y oro en el Macizo del Deseado, con planta de flotación propia.",
    proc:["Extracción del mineral de vetas","Chancado","Molienda","Flotación","Concentrado de alta ley a la venta"],
    prod:"Concentrado de plata y oro de alta ley (relación Ag:Au histórica mayor a 900:1)",
    nums:[["Capacidad de planta","480 t/día máxima; 240 t/día probada; promedio actual informado de 120 t/día","pgdMar"],["Mineral de Hunt Mining","Más de 26.000 t con 1,01 g/t de oro y 771 g/t de plata","pgdMar"],["Leyes históricas","Plata de más de 2.500 g/t en los primeros años y de más de 400 g/t en los últimos","pgdMar"],["Recursos","Sin recursos ni reservas vigentes; último NI 43-101 de oct-2018","pgdMar"]],
    hitos:[["ene-2017","Reinicio de la producción tras reacondicionar la planta (Hunt Mining)"]],
    src:["pgdMar"] },
  // --- 4-nov-2026 ---
  "og-esc": {
    met:"Terminal de regasificación de GNL sobre el río Paraná: un buque regasificador (FSRU) amarrado al muelle recibe el GNL de los metaneros por transferencia barco a barco y lo devuelve al estado gaseoso para inyectarlo a la red del Gran Buenos Aires.",
    proc:["Llegada del buque metanero con GNL importado","Transferencia barco a barco (ship-to-ship) al buque regasificador amarrado al muelle","Regasificación en circuito cerrado (closed-loop) a bordo del FSRU","Descarga del gas por brazo de alta presión","Inyección al sistema de transporte de gas para cubrir los picos de invierno"],
    prod:"Gas natural regasificado para la demanda invernal del área metropolitana",
    nums:[["Puesta en servicio","2011, nueve meses después de firmados los acuerdos definitivos","excEsc"],["Configuración","Muelle tipo GasPort con transferencia barco a barco y regasificación en circuito cerrado","excEsc"],["Cliente de Excelerate","UTE GNL Escobar; Excelerate aporta el FSRU, la puesta en marcha y la operación","excEsc"],["Temporada 2026","Res. SE 33/2026: el comercializador privado adjudicado opera toda la capacidad de regasificación de la terminal entre abril y septiembre, con contrato de acceso por un año","se33_26"]],
    hitos:[["2011","Inicio de operación de la terminal"],["9-feb-2026","Res. SE 33/2026: licitación para que un comercializador privado importe el GNL por Escobar en lugar de ENARSA"]],
    src:["excEsc","se33_26"] },
  "mi-aguilar": {
    met:"Yacimiento polimetálico de plomo, zinc y plata en la Sierra de Aguilar, explotado a cielo abierto y por minería subterránea, con planta concentradora por flotación diferencial en la mina.",
    proc:["Extracción a cielo abierto (bancos de 5 m) y subterránea (corte y relleno; sub-level stoping)","Molienda SAG y clasificación en hidrociclones","Flotación diferencial: primero plomo, después zinc (rougher, scavenger y celdas columnares)","Espesado y filtrado de los concentrados","Concentrado de zinc a la refinería de Rosario; concentrado de plomo-plata a la fundición de Palpalá y a exportación"],
    prod:"Concentrado de zinc (≈ 50% Zn) y concentrado de plomo con plata (≈ 75% Pb y 1.300 g/t Ag); plomo y plata refinados en Palpalá",
    nums:[["Alimentación de planta","2.100 t secas por día, con leyes de cabeza de 2,5% Pb y 4,5% Zn","segAgu"],["Concentrado de zinc","190 t/día con 50% Zn y 100 g/t Ag; recuperación de zinc de 91%","segAgu"],["Concentrado de plomo","105 t/día con 75% Pb y 1.300 g/t Ag; recuperación de 82% del plomo y 80% de la plata","segAgu"],["Despachos de 2010","53.575 t secas de concentrado de zinc; 16.881 t de concentrado de plomo a Palpalá y 13.874 t exportadas","segAgu"],["Fundición de Palpalá","≈ 14.000 t/año de plomo refinado y 27 t/año de plata refinada","segAgu"]],
    hitos:[["nov-1928","Se constituye Minera Aguilar"],["1936","Comienza la producción continua de concentrados de plomo, zinc y plata"],["1999","Arranca la Fundición Aguilar en Palpalá"],["dic-2010","Relevamiento de campo del SEGEMAR"]],
    nota:"Los números son del relevamiento del SEGEMAR de dic-2010 (informe revisado en feb-2017); la operación actual, a cargo de otro controlante, puede diferir.",
    src:["segAgu"] },
  "ag-arre": {
    met:"Frigorífico exportador de ciclo completo (faena y desposte) habilitado por SENASA, en Pérez Millán (partido de Ramallo); la empresa tiene una segunda planta en Escobar.",
    proc:["Recepción de hacienda","Faena","Desposte","Enfriado o congelado y envasado","Exportación: cortes enfriados (cuota Hilton), congelados, cuartos y menudencias"],
    prod:"Cortes vacunos enfriados (Hilton) y congelados, cuartos y menudencias",
    nums:[["Capacidad de faena de la empresa","1.500 cabezas por día entre las plantas de Pérez Millán y Escobar","ipcvaArre"],["Establecimiento SENASA","N° 2082 (Pérez Millán)","ipcvaArre"],["Destinos de exportación","25 países, entre ellos China, Estados Unidos, Alemania, Israel y Brasil","ipcvaArre"],["Certificaciones","Halal, Kosher, Aberdeen Angus, HACCP, BRCGS y bienestar animal","ipcvaArre"]],
    src:["ipcvaArre"] },
  "ag-gorina": {
    met:"Frigorífico exportador de ciclo completo en Melchor Romero (La Plata), habilitado por SENASA, con faena, desposte y laboratorio propios.",
    proc:["Recepción de hacienda","Faena","Desposte (≈ 5.000 cuartos por día)","Enfriado o congelado y envasado","Exportación: cortes Hilton enfriados, congelados y huesos"],
    prod:"Cortes vacunos enfriados (Hilton) y congelados para exportación y mercado interno",
    nums:[["Faena","30.000 cabezas por mes; capacidad declarada de 1.600 por día","ipcvaGor"],["Desposte","5.000 cuartos por día","ipcvaGor"],["Capacidad de producción","75.000 t/año, de las que ≈ 60.000 t se exportan","ipcvaGor"],["Establecimiento SENASA","N° 2025","ipcvaGor"],["Personal","540 empleados (jun-2025)","gbaGor"],["Ranking 2024","Tercer frigorífico del país por animales faenados","gbaGor"]],
    hitos:[["17-feb-2025","Un incendio destruye gran parte de la planta"],["abr-2025","Se retoma la faena, dos meses después del incendio; la empresa estima dos años para la recuperación total"]],
    src:["ipcvaGor","gbaGor"] },
  // --- 5-nov-2026 ---
  "mi-salar-tolillar": {
    met:"Litio en salmuera en el Salar de Tolillar (Puna salteña): bombeo de salmuera y extracción directa de litio (DLE) en lugar de pozas de evaporación de largo plazo.",
    proc:["Pozos de bombeo de salmuera","Extracción directa de litio (DLE) por adsorción selectiva","Concentración y purificación del eluido (se quitan magnesio, boro y calcio)","Precipitación con carbonato de sodio","Secado, micronizado y envasado de carbonato grado batería","Reinyección de la salmuera agotada al salar"],
    prod:"Carbonato de litio grado batería",
    nums:[["Producción (fase 1 de la PEA)","25.000 t/año de carbonato de litio; una segunda fase de 25.000 t/año queda fuera del estudio","tolPEA23"],["Vida útil","35 años","tolPEA23"],["Inversión inicial","US$ 776,6 M, con US$ 179,2 M de contingencias","tolPEA23"],["Costo de producción","US$ 5.172/t (bombeo y proceso, sin transporte); costo en efectivo con transporte y regalías de US$ 5.980/t","tolPEA23"],["Valor presente neto (8%, después de impuestos)","US$ 1.739 M, con TIR de 25,6% y repago en 3,7 años","tolPEA23"],["Precio supuesto","Promedio de US$ 23.146/t de carbonato en la vida del proyecto","tolPEA23"]],
    nota:"Números de la evaluación económica preliminar (PEA) actualizada por Alpha Lithium en ago-2023; una PEA no demuestra viabilidad económica.",
    hitos:[["10-jul-2023","Alpha Lithium publica la PEA de Tolillar"],["14-ago-2023","PEA actualizada con los recursos nuevos"]],
    src:["tolPEA23"] },
  "mi-rio-grande-sur": {
    met:"Litio en salmuera en el Salar de Río Grande (Salta, cerca de Tolar Grande), con salmueras profundas de ley alta y proceso convencional por evaporación solar.",
    proc:["Perforación diamantina y pozos de bombeo de salmuera","Concentración en pozas de evaporación solar","Purificación (se quitan magnesio, boro y calcio)","Precipitación con carbonato de sodio (carbonato) o producción de cloruro de litio","Secado y envasado"],
    prod:"Carbonato de litio o cloruro de litio (ambas vías en estudio en las adendas de la prefactibilidad)",
    nums:[["Recurso mineral","1,264 Mt de carbonato de litio equivalente (LCE) con 424 mg/l de Li","purRGS26"],["Indicados","705.000 t de LCE con 443 mg/l de Li","purRGS26"],["Inferidos","559.000 t de LCE con 405 mg/l de Li","purRGS26"],["Pozo DDH-3 (Mito)","≈ 560 m de profundidad, terminado en salmuera mineralizada; máximo de 995 mg/l de Li entre 444,2 y 445,0 m","purRGS26"],["Escala inicial","Operación inicial de 5.000 t/año; las adendas de la prefactibilidad estudian una expansión","purRGS26"]],
    hitos:[["feb-2026","Actualización del recurso mineral"],["28-oct-2026","Resultados finales del pozo DDH-3"],["2027","Prueba de bombeo continuo de 30 días en el pozo PW-1 (María Magdalena)"]],
    src:["purRGS26"] },
  "mi-el-quevar": {
    met:"Plata epitermal de sulfuración alta a intermedia, con oro asociado, alojada en brechas y domos dacíticos (depósito Yaxtché), en la Puna de Salta.",
    proc:TEC_GEN["mi-au"].proc,
    prod:"Plata (con oro asociado)",
    nums:[["Recurso indicado (Yaxtché)","2,93 Mt con 482 g/t de plata: 45,3 Moz de plata","agagEQ26"],["Recurso inferido","0,31 Mt con 417 g/t de plata: 4,1 Moz de plata","agagEQ26"],["Fecha efectiva del recurso","30-sep-2024 (informe NI 43-101)","agagEQ26"],["Superficie","57.000 ha; menos del 3% con exploración completa","agagEQ26"],["Infraestructura","Campamento propio para 100 personas, más de 60 km de caminos internos; ferrocarril, gasoducto y camino de servicio a ≈ 3 km, y línea de alta tensión a ≈ 20 km","agagEQ26"]],
    src:["agagEQ26"] },
  "mi-el-dorado-monserrat": {
    met:"Oro y plata epitermal de baja ley en el Macizo del Deseado (Santa Cruz), con un plan conceptual a cielo abierto de gran escala.",
    proc:["Mina a cielo abierto con camiones y palas","Chancado","Lixiviación del mineral","Recuperación del metal","Fundición de doré"],
    prod:"Doré de oro y plata",
    nums:[["Producción promedio (PEA)","146.000 oz por año","frdEDM26"],["Vida útil","17 años","frdEDM26"],["Escala de mina","10 Mt/año de mineral","frdEDM26"],["Valor presente neto (10%)","US$ 1.500 M, con TIR de 65%","frdEDM26"],["Informe técnico","Fecha efectiva 17-ago-2026; presentado en SEDAR+ el 7-oct-2026","frdEDM26"]],
    nota:"Evaluación económica preliminar (PEA) basada en parte en recursos inferidos; no demuestra viabilidad económica.",
    hitos:[["17-ago-2026","Fecha efectiva del informe técnico de la PEA"],["7-oct-2026","Presentación del informe en SEDAR+"]],
    src:["frdEDM26"] },
  "mi-don-otto": {
    met:"Uranio sedimentario en margas de la Formación Coloradas Inferiores (distrito del Tonco, Valles Calchaquíes), explotado por la CNEA con labores subterráneas y lixiviación en pilas.",
    proc:["Labores subterráneas (galerías, piques y chimeneas)","Extracción del mineral friable, sin molienda previa","Lixiviación en pilas con ácido sulfúrico (5 a 10 g/l, pH ≈ 2)","Precipitación del uranio con cal","Secado del preconcentrado"],
    prod:"Preconcentrado de uranio con 5% a 10% de U₃O₈",
    nums:[["Reservas (mitad sur, hasta el nivel 0)","≈ 200.000 t con ley media de 0,15% de U₃O₈","cneaDO66"],["Extensión del yacimiento","2.100 m de corrida en el flanco este del sinclinal del Tonco","cneaDO66"],["Labores","3.200 m de galerías, piques y chimeneas; galería principal ≈ 100 m bajo el afloramiento","cneaDO66"],["Lixiviación","Extracción de más de 90% con 19 kg de ácido por tonelada; primera etapa prevista de 36.000 t","cneaDO66"]],
    nota:"Datos del informe de la CNEA de 1966, cuando el yacimiento estaba en preparación y explotación; fue el primero de Sudamérica en usar lixiviación en pilas para uranio. La cartera oficial lo lista hoy en factibilidad.",
    src:["cneaDO66"] },
  // --- 6-nov-2026 ---
  "mi-cauchari-jv": {
    met:"Litio en salmuera en el salar de Olaroz-Cauchari (Puna de Jujuy): la salmuera se extrae por pozos desde los acuíferos del salar.",
    proc:TEC_GEN["mi-li"].proc,
    prod:"Carbonato de litio",
    nums:[["Recurso medido + indicado","1.740 Mm³ de salmuera con 480 mg/l de litio: 4,5 Mt de carbonato de litio equivalente (LCE)","rtLi25"],["Recurso inferido","590 Mm³ con 470 mg/l: 1,5 Mt LCE","rtLi25"],["Recurso total","2.330 Mm³ con 480 mg/l: 6,0 Mt LCE","rtLi25"],["Reservas probadas + probables","420 Mm³ con 500 mg/l: 1,1 Mt LCE (ley de corte 350 mg/l)","rtLi25"],["Recuperación media de proceso","60%: 0,7 Mt LCE recuperables","rtLi25"],["Participación","100% Rio Tinto","rtLi25"]],
    nota:"Recursos y reservas al 30-jun-2025 informados por Rio Tinto (ex proyecto Cauchari de Allkem/Arcadium Lithium); cifras in situ.",
    src:["rtLi25"] },
  "mi-suyai": {
    met:"Oro y plata epitermal de baja sulfuración: vetas de cuarzo-adularia-sericita en andesitas jurásicas, con buzamiento de 25° a 35°, en un corredor de 5 × 2 km a 9 km en línea recta de Esquel (Chubut).",
    proc:["Mina subterránea por vetas","Chancado y molienda","Lixiviación del mineral","Recuperación del metal","Fundición de doré"],
    prod:"Doré de oro y plata",
    nums:[["Recurso indicado","4,7 Mt con 15,13 g/t de oro y 23 g/t de plata: 2,29 Moz de oro y 3,52 Moz de plata","smGold22"],["Recurso inferido","0,9 Mt con 9,9 g/t de oro y 21 g/t de plata: 274.000 oz de oro y 575.000 oz de plata","smGold22"],["Producción media prevista","250.000 oz de oro por año","smGold22"],["Inversión (capex)","US$ 220 M","smGold22"],["Vida útil","8 años","smGold22"],["Superficie","36.702 ha","smGold22"]],
    nota:"Datos de la ficha oficial de la Secretaría de Minería (portafolio de oro 2022), que compila informes de Yamana Gold y de Meridian Gold (2003). La cartera SIACAM lo lista hoy en factibilidad, con Pan American Silver (60%) y CAM (40%).",
    src:["smGold22"] },
  "mi-taron-cesium": {
    met:"Cesio en depósito epitermal de la Puna salteña, explotado a cielo abierto y tratado por lixiviación ácida a alta presión (HPAL).",
    proc:["Mina a cielo abierto (perforación, voladura, carga y acarreo con contratista)","Chancado giratorio con rechazo de ganga y molienda en molino de bolas con hidrociclones","Lixiviación en dos circuitos de autoclaves en paralelo (HPAL)","Cristalización de alumbre de cesio con sulfato de aluminio","Purificación con hidróxido de bario en dos etapas","Ácido fórmico sobre hidróxido de cesio: salmuera de formiato de cesio"],
    prod:"Salmuera de formiato de cesio al 80% (se usa como fluido de perforación de alta densidad)",
    nums:[["Recurso inferido (JORC, 31-ene-2024)","23,85 Mt con 2.131 ppm de cesio: 50.810 t de cesio contenido (ley de corte 1.239 ppm)","ccdTarPEA"],["Escala y vida útil (PEA)","Hasta 1,75 Mt/año de mineral durante 14 años","ccdTarPEA"],["Cesio recuperado en la vida útil","41.051 t","ccdTarPEA"],["Inversión (capex)","US$ 596 M en la vida útil: US$ 478 M iniciales, de ellos US$ 428 M para la planta HPAL","ccdTarPEA"],["Valor presente neto (10%, después de impuestos)","US$ 79 M, con TIR de 14% y repago en 5 años","ccdTarPEA"]],
    nota:"Evaluación económica preliminar (PEA) basada en recursos inferidos; no demuestra viabilidad económica. En la venta de Cascadero Minerals a Lumina Copper (First Quantum), acordada el 1-sep-2026, Cascadero Copper conserva las siete propiedades de Taron.",
    hitos:[["15-may-2024","Cascadero publica la PEA de Taron"],["1-sep-2026","Acuerdo de venta de Cascadero Minerals: Taron queda en Cascadero Copper"]],
    src:["ccdTarPEA","ccdCMC26"] },
  "mi-laguna-salada": {
    met:"Uranio y vanadio en gravas superficiales tipo caliche (y zonas ligadas a una discordancia) en la meseta de Chubut; mineralización a muy poca profundidad.",
    proc:["Minado a cielo abierto de muy baja profundidad (hasta 5–8 m en Buried Lake y Pampa de Arroqui)","Beneficio físico: concentración de la grava en una fracción fina de alta ley","Recuperación del uranio y el vanadio (método todavía no definido)","Concentrado de uranio (U₃O₈) y óxido de vanadio"],
    prod:"Concentrado de uranio (U₃O₈) con vanadio (V₂O₅) como coproducto",
    nums:[["Recurso indicado","21,1 Mt con 90 ppm de U₃O₈ y 665 ppm de V₂O₅: 4,2 Mlb de U₃O₈ y 31,1 Mlb de V₂O₅","jagLS26"],["Recurso inferido","34 Mt con 137 ppm de U₃O₈ y 755 ppm de V₂O₅: 10,1 Mlb de U₃O₈ y 57,3 Mlb de V₂O₅","jagLS26"],["Ley de corte","NSR de US$ 12,08/t (≈ 100 ppm de U₃O₈)","jagLS26"],["Recuperaciones supuestas","84,9% de U₃O₈ y 59,5% de V₂O₅","jagLS26"],["Superficie","210.284 ha en 28 concesiones; el recurso ocupa ≈ 4,3%","jagLS26"]],
    nota:"Primer recurso mineral del proyecto (NI 43-101 y S-K 1300, fecha efectiva 5-oct-2026). Los métodos de minería y de proceso todavía no están definidos.",
    hitos:[["5-oct-2026","Fecha efectiva del primer recurso mineral"],["19-oct-2026","Presentación de los informes técnicos en SEDAR+ y EDGAR"]],
    src:["jagLS26"] },
  "mi-rincon-salta-lithium": {
    met:"Litio en salmuera en el salar de Rincón (Puna de Salta), dentro del proyecto Salta de Power Minerals.",
    proc:TEC_GEN["mi-li"].proc,
    prod:"Carbonato de litio equivalente (LCE) de alta pureza, grado batería",
    nums:[["Recurso medido + indicado (JORC)","157.131 t de LCE con 258 mg/l de litio","pnnHY24"],["Recurso inferido","135.433 t de LCE con 276 mg/l de litio","pnnHY24"],["Producción prevista (PEA)","7.061 t/año de LCE","pnnHY24"],["Vida útil inicial","14 años","pnnHY24"],["Valor presente neto (antes de impuestos)","US$ 501,85 M, con TIR de 42% y repago en 3 años","pnnHY24"]],
    nota:"Evaluación económica preliminar (PEA) de noviembre de 2023; el recurso de Rincón es parte de las 714.872 t de LCE del proyecto Salta.",
    src:["pnnHY24"] },
  "ag-ramallo": {
    met:"Complejo industrial-portuario de Bunge sobre el Paraná (km 326, margen derecha), aguas abajo del Gran Rosario: terminal de granos, subproductos y aceites, planta de molienda de soja y planta de fertilizantes, con desvío ferroviario propio.",
    proc:["Descarga de camiones y trenes (desvío ferroviario, descargas simultáneas)","Calado, acondicionamiento y almacenaje en silos","Molienda de soja: extracción del aceite por solvente y harina/pellets","Almacenaje de fertilizantes sólidos y líquidos recibidos por barcaza","Carga de buques por cuatro torres en el muelle principal"],
    prod:"Granos, harina y aceite de soja para exportación; fertilizantes para el mercado interno",
    nums:[["Almacenaje","400.000 t de granos, 90.000 t de subproductos y 25.000 t de aceites","magPtos"],["Fertilizantes","250.000 t de sólidos y 25.000 t de líquidos","magPtos"],["Capacidad de molienda","3.000 t/día de soja","magAlm"],["Muelle principal","248 m; buques de hasta 270 m de eslora y 44 pies al pie del muelle (37 pies en la Hidrovía)","magPtos"],["Ritmo de embarque","3.000 t/h de granos y 550 t/h de aceites; segundo muelle de descarga de barcazas a 1.000 t/h","magPtos"]],
    hitos:[["2005","Inauguración de la terminal (Terminal Puerto Ramallo S.A.)"]],
    nota:"Las capacidades son de las tablas del Ministerio de Agricultura, que no indican fecha. La BCR registra que la planta de molienda arrancó con 3.000 t/24 h. Conviene verificar si la molienda sigue activa: el sitio no tiene todavía una fuente oficial sobre su estado actual.",
    src:["magPtos","magAlm","bcrRank18"] },
  "ag-swift": {
    met:"Planta de alimentos industrializados de Swift Argentina (Minerva Foods) en Villa Gobernador Gálvez, en el Gran Rosario: elabora productos cárnicos a partir de carne vacuna; la faena del grupo se hace en otras plantas.",
    proc:["Recepción de carne y materias primas de las plantas de faena","Picado, formulado y mezclado","Moldeado y cocción o conservación (hamburguesas, patés y conservas)","Congelado y envasado","Despacho al mercado interno y exportación"],
    prod:"Hamburguesas, patés y otros alimentos industrializados de carne vacuna",
    nums:[["Capacidad de procesamiento","162 t/día","mnvMapa"],["Minerva en Argentina","5 plantas de faena con 5.050 cabezas/día y 2 de industrializados (Rosario y Pilar)","mnvMapa"]],
    nota:"El informe de engajamento de Minerva para Argentina (2023/2024) ubica en Villa Gobernador Gálvez la producción de industrializados y en Venado Tuerto la faena y el desposte.",
    src:["mnvMapa","mnvEng25"] },
  "mi-farallon-negro": {
    met:"Mina de vetas de oro y plata en Catamarca, en producción según la cartera oficial; la explota YMAD, empresa interestadual de Catamarca y la Universidad Nacional de Tucumán.",
    proc:TEC_GEN["mi-au"].proc,
    prod:TEC_GEN["mi-au"].prod,
    nums:[["Accionistas de YMAD","Provincia de Catamarca 60% y Universidad Nacional de Tucumán 40% (DNU 2/2026)","dnu2_26"],["Directorio","Presidente y dos vocales designados por Catamarca; dos vocales por la UNT","dnu2_26"],["Origen","Acta de Farallón Negro (7-jun-1958) y Ley 14.771","dnu2_26"]],
    hitos:[["7-jun-1958","Acta de Farallón Negro entre la Nación, Catamarca y la UNT"],["15-dic-2025","Acuerdo Modificatorio del Acta"],["5-ene-2026","DNU 2/2026 en el Boletín Oficial: la Nación se retira de YMAD"]],
    nota:"No hay todavía una cifra de producción con fuente oficial o de la empresa; los kilos de oro por mes que circulan en la prensa no se cargan.",
    src:["dnu2_26"] },
  "mi-sierra-grande": {
    met:"Mina de hierro en Sierra Grande, Río Negro, con planta de concentración y embarque por Punta Colorada. La opera MCC Minera Sierra Grande S.A. (China Metallurgical Group, según la cartera oficial, que la ubica en etapa de reingeniería).",
    proc:["Extracción del mineral de hierro","Chancado y molienda","Concentración del mineral","Transporte del concentrado al puerto de Punta Colorada","Carga de buques para exportación"],
    prod:"Concentrado de hierro para exportación",
    nums:[["Producción","400.000 t de concentrado de hierro en 2012","rnSG13"],["Empleo","540 puestos directos (2013)","rnSG13"],["Inversión acumulada","$ 450 M (2013)","rnSG13"]],
    hitos:[["2012","400.000 t de concentrado"],["2021","Auditoría de procesos y muestreo del concentrado exportable por SEGEMAR y la Secretaría de Minería"]],
    nota:"Datos del gobierno de Río Negro de 2013; no hay cifras oficiales recientes de producción.",
    src:["rnSG13","segSG21"] },
  "mi-cauchari": {
    met:"Litio en salmuera en el salar de Caucharí (Puna de Jujuy, ≈ 250 km de San Salvador de Jujuy): la salmuera se bombea desde los acuíferos del salar y el litio se separa por extracción directa (DLE), sin pozas de evaporación.",
    proc:["Pozos de bombeo de salmuera","Extracción directa de litio (DLE): adsorción o intercambio iónico selectivo","Reinyección de la salmuera agotada","Purificación y concentración del eluido","Precipitación de carbonato de litio, secado y envasado"],
    prod:"Carbonato de litio (Li₂CO₃)",
    nums:[["Producción prevista","40.000 t/año de carbonato de litio equivalente (LCE) por extracción directa","smLi24"],["Vida útil prevista","30 años","smLi24"],["Ley de litio","493 mg/l (recurso medido, 2023)","smLi24"],["Superficie","3.980 ha","smLi24"],["Etapa","Prefactibilidad; inversión (capex) sin dato oficial","smLi24"],["Operador","Minerales Australes S.A.","smLi24"]],
    nota:"Ficha de la Secretaría de Minería (portafolio de litio 2024), que todavía atribuía el proyecto a Lake Resources; la cartera SIACAM lo lista hoy en prefactibilidad con Austroid Corp. como controlante (100%). No se carga el tonelaje de recursos porque la tabla oficial no indica unidad ni categoría con claridad.",
    src:["smLi24","siacam"] },
  "mi-martin-bronce": {
    met:"Cobre sedimentario estratoligado (tipo Kupferschiefer) en conglomerados y areniscas del extremo noroeste de la Sierra de Santa Bárbara (Palma Sola, Yungas jujeñas, ≈ 140 km al noreste de San Salvador de Jujuy). Mina a cielo abierto con arranque mecánico, sin voladuras, y beneficio hidrometalúrgico de los óxidos.",
    proc:["Destape y arranque mecánico del mineral (sin voladura)","Acopio del mineral oxidado","Lixiviación con ácido cítrico (proceso patentado; recuperación en ≈ 24 h)","Cementación del cobre de la solución","Secado, envasado y exportación vía Chile"],
    prod:"Cemento de cobre (> 80% Cu) con alto contenido de plata; la empresa apunta además a producir nanocobre de alta pureza",
    nums:[["Recurso estimado","2,43 Mt con 0,92% CuEq (corte 0,5% CuEq)","momMB26"],["Medido + indicado","1,79 Mt con 0,96% CuEq (0,70% Cu)","momMB26"],["Exploración","23 pozos y 1.302 m perforados","momMB26"],["Superficie","6.000 ha de área minera dentro de 40.000 ha de tenencia","momMB26"],["Inversión prevista","US$ 300 M en tres etapas: I US$ 25 M (ejecutada), II US$ 75 M y III US$ 200 M","momMB26"],["Comercialización","Acuerdo de compra (offtake) con Trafigura; exporta el 100% vía Chile","momMB26"]],
    hitos:[["2020","Fundación de MOM Mining para poner en marcha la mina"]],
    nota:"Datos del folleto institucional 2026 de MOM Mining, publicado por la Cancillería. La estimación de recursos es preliminar (firmada por persona calificada bajo CIM 2014) y la certificación NI 43-101 está en curso; no hay reservas declaradas ni una cifra de producción anual publicada.",
    src:["momMB26","siacam"] },
  "mi-la-providencia": {
    met:"Plata epitermal de alta sulfuración en la Puna de Jujuy, entre 4.200 y 4.700 m de altura (≈ 260 km de San Salvador de Jujuy). Mina en operación de Hanaq Argentina S.A. (Hanaq Group).",
    proc:TEC_GEN["mi-au"].proc,
    prod:"Plata (mineral principal según la cartera oficial)",
    nums:[["Etapa","En operación","smAg24"],["Tipo de depósito","Epitermal de alta sulfuración","smAg24"],["Inversión (capex)","US$ 10 M","smAg24"],["Superficie","Siete concesiones: 17.035 ha (el recuadro de la ficha indica 12.843 ha)","smAg24"],["Altura","4.200 a 4.700 m s. n. m.","smAg24"]],
    nota:"Ficha de la Secretaría de Minería (portafolio de plata 2024). No informa recursos, método de explotación ni producción, por lo que el proceso es el genérico de oro y plata y el producto debe confirmarse con la empresa.",
    src:["smAg24","siacam"] },
  "ag-sjorge": {
    met:"Frigorífico de ciclo completo de Quickfood S.A. en San Jorge (centro-oeste de Santa Fe): faena de hacienda vacuna, desposte y elaboración de hamburguesas congeladas de la marca Paty en la misma planta.",
    proc:["Recepción de hacienda en corrales","Faena (playa de matadero)","Desposte y selección de cortes y recortes","Picado, formulado y moldeado de hamburguesas (8 líneas)","Congelado, envasado y cámaras de frío","Despacho al mercado interno y exportación"],
    prod:"Hamburguesas vacunas congeladas Paty, además de los cortes y subproductos de la faena",
    nums:[["Capacidad de faena","1.100 cabezas por día","qfEPD24"],["Líneas de hamburguesas","8","qfEPD24"],["Producción de hamburguesas","3.250 t/mes (≈ 39.000 t/año)","qfEPD24"],["Período de los datos","Frigorífico: año 2021; ganadería: jul-2020 a jun-2021","qfEPD24"]],
    hitos:[["2-jul-2024","Publicación de la Declaración Ambiental de Producto de la hamburguesa Paty, verificada por el INTI (válida hasta jul-2029)"]],
    nota:"Hasta esta revisión el mapa atribuía la planta a Minerva Foods; según la declaración ambiental de la propia empresa, la opera Quickfood S.A. (grupo Marfrig, que en 2025 se fusionó con BRF en MBRF). El total anual es la cuenta mensual por 12.",
    src:["qfEPD24","senasa"] },
  "mi-canadon-del-moro": {
    met:"Proyecto de oro y plata en Cerro Mesa, en la Línea Sur de Río Negro (≈ 90 km de Ingeniero Jacobacci), de Southern Copper Argentina. Está en evaluación económica preliminar (PEA): todavía no hay método de explotación definido.",
    proc:["Campañas de perforación de exploración","Estimación de recursos","Evaluación económica preliminar (PEA)","Monitoreo ambiental: muestreos participativos de agua con la comunidad y el Estado provincial"],
    prod:"Oro y plata (la cartera SIACAM lo registra como proyecto de plata)",
    nums:[["Etapa","Evaluación económica preliminar (PEA)","rnCdM24"],["Ubicación","Cerro Mesa, ≈ 90 km de Ingeniero Jacobacci","rnCdM24"],["Campaña de perforación","Prevista para dic-2024; el segundo muestreo de agua (feb-2025) fue el último de esa campaña","rnCdM25"]],
    hitos:[["14-nov-2024","Primer muestreo participativo de agua"],["dic-2024","Campaña de perforación prevista por la empresa"],["feb-2025","Segundo muestreo participativo de agua, último de la campaña"]],
    nota:"El gobierno de Río Negro no publicó recursos, metros perforados ni inversión; la empresa no difundió todavía resultados del proyecto.",
    src:["rnCdM24","rnCdM25","siacam"] },
  "mi-ajedrez": {
    met:"Oro aluvial en la quebrada del río Ajedrez, distrito Orosmayo (departamento Rinconada, Puna de Jujuy): se explota la grava aurífera a cielo abierto y el oro se separa por gravedad, sin químicos.",
    proc:["Destape y extracción del aluvión (grava aurífera) con equipos de movimiento de suelos, tipo cantera","Clasificación y harneado de la grava","Concentración gravimétrica (canaletas, jigs) y por centrifugado, sin cianuro ni otros reactivos","Limpieza del concentrado y secado del oro","Restitución de la grava lavada y restauración del terreno"],
    prod:"Oro aluvial en concentrado gravimétrico",
    nums:[["Etapa","Explotación (en producción según la cartera provincial y SIACAM)","jujFol22"],["Expediente provincial","MT0655-026-2021, en evaluación (titular según la tabla provincial: Luis Losi S.A.)","jujFol22"],["Agua autorizada","5.105 m³ por mes de agua superficial del río Ajedrez para la explotación de oro aluvial (permiso precario de un año, retroactivo a ene-2021)","jujBO660"],["Mina en producción 2025","Figura entre las minas de oro con producción del país en 2025","smOro25"]],
    hitos:[["1-jul-2021","Res. 660-DPRH/2021: permiso de uso de agua para la etapa de explotación (proyecto Ajedrez, con la mina Catalina II)"],["3-feb-2026","Inspección ambiental del Ministerio de Minería de Jujuy a «Mina Nueva Ajedrez» (Luis Losi S.A.): exploración, restauración y un invernáculo de forrajes"]],
    nota:"La cartera SIACAM atribuye Ajedrez a Espíritu de los Andes S.A.; las tablas provinciales y la inspección de 2026 nombran a Luis Losi S.A. como titular de la mina. El folleto provincial grafica la producción de 2021 de Ajedrez y Córdoba (45 y 312 onzas), pero el texto no permite asignar cada valor a cada mina, así que no se carga. No hay datos oficiales de inversión ni de capacidad.",
    src:["jujFol22","jujBO660","smOro25","jujInsp26","siacam"] },
  "mi-mina-catalina-ii": {
    met:"Oro aluvial en el distrito Orosmayo (departamento Rinconada, Jujuy), dentro del proyecto Ajedrez de Espíritu de los Andes S.A.: explotación a cielo abierto de grava aurífera con concentración gravimétrica, sin químicos.",
    proc:["Destape y extracción del aluvión (grava aurífera) con equipos de movimiento de suelos, tipo cantera","Clasificación y harneado de la grava","Concentración gravimétrica (canaletas, jigs) y por centrifugado, sin cianuro ni otros reactivos","Limpieza del concentrado y secado del oro","Restitución de la grava lavada y restauración del terreno"],
    prod:"Oro aluvial en concentrado gravimétrico",
    nums:[["Etapa","Explotación vigente (expediente MT0655-146-2015) y una ampliación en evaluación (MT0655-166-2021)","jujFol22"],["Agua autorizada","5.105 m³ por mes de agua superficial del río Ajedrez, compartidos con el proyecto Ajedrez (permiso precario de un año, retroactivo a ene-2021)","jujBO660"],["Mina en producción 2025","Figura entre las minas de oro con producción del país en 2025","smOro25"]],
    hitos:[["2015","Expediente de explotación MT0655-146-2015"],["1-jul-2021","Res. 660-DPRH/2021: permiso de uso de agua para la explotación de oro aluvial"]],
    nota:"No hay cifras oficiales de producción, inversión ni empleo de la mina.",
    src:["jujFol22","jujBO660","smOro25","siacam"] },
  "mi-cordoba": {
    met:"Oro aluvial en el departamento Rinconada (Puna de Jujuy), a unos 15 km al norte de Ajedrez: extracción a cielo abierto de grava aurífera y concentración gravimétrica.",
    proc:["Destape y extracción del aluvión (grava aurífera) con equipos de movimiento de suelos, tipo cantera","Clasificación y harneado de la grava","Concentración gravimétrica (canaletas, jigs) y por centrifugado, sin cianuro ni otros reactivos","Limpieza del concentrado y secado del oro","Restitución de la grava lavada y restauración del terreno"],
    prod:"Oro aluvial en concentrado gravimétrico",
    nums:[["Etapa","Explotación vigente (expediente MT0655-119-2019) y un nuevo expediente en evaluación (MT0655-035-2022)","jujFol22"],["Titulares","Sociedad Minera Santa María S.A.; en la tabla de minas vigentes figura también Gasmarra Minería S.A.","jujFol22"],["Mina en producción 2025","Figura entre las minas de oro con producción del país en 2025 (controlante: Sociedad Minera Santa María, capital argentino)","smOro25"]],
    hitos:[["2019","Expediente de explotación MT0655-119-2019"],["2022","Nuevo expediente MT0655-035-2022 en evaluación"]],
    nota:"El folleto provincial grafica la producción de 2021 de Córdoba y Ajedrez (45 y 312 onzas) sin que el texto permita asignar cada valor; no se carga. La distancia a Ajedrez sale de las coordenadas oficiales.",
    src:["jujFol22","smOro25","siacam"] }
};
