# Mundo: ¿se puede mapear toda la dinámica mundial de los tres sectores?

Investigación del 16/17-nov-2026 para la página `mundo.html` (beta). Pregunta: un mapa mundial con foco en la Argentina, donde aparezcan todas las empresas de petróleo y gas, minería y agro, con el porcentaje de tenencia de cada una en cada proyecto, y rankings de tamaño y de eficiencia que permitan ubicar a los proyectos argentinos.

## Respuesta corta

**Se puede en gran parte, pero no con una sola API ni con fuentes de gobiernos solamente.** El grado de cobertura depende del sector:

| Sector / activo | ¿Hay base mundial abierta por activo? | ¿Dueños con %? | ¿Tamaño? | ¿Eficiencia? |
|---|---|---|---|---|
| Petróleo y gas – yacimientos | **Sí.** GEM GOGET, ≈ 7.300 yacimientos | Sí, hasta la casa matriz (en ≈ 40% de los yacimientos operativos el reparto está completo) | Producción anual (boe) | No hay medida abierta comparable (costos e intensidad de emisiones por campo son de Rystad / Wood Mackenzie, con licencia) |
| Petróleo y gas – refinerías | Sí. Climate TRACE, ≈ 700 | Nombres, sin % | Capacidad (bbl/d) | Emisiones por barril procesado |
| Minería – hierro y carbón | **Sí.** GEM GIOMT (≈ 900) y GCMT (≈ 5.100) | Sí, con % | Capacidad y producción | Uso de capacidad (hierro); toneladas por trabajador (carbón) |
| Minería – cobre y bauxita | Parcial. Climate TRACE (≈ 900 cobre, ≈ 270 bauxita) | Nombres, sin % (el CSV de propiedad de Climate TRACE sí trae %) | Mineral procesado | Emisiones por t de mineral (no corrige por ley) |
| Minería – litio, oro, plata, uranio | **No** hay base abierta mundial por mina con dueños | – | – | – |
| Agro | **No** hay registro mundial por establecimiento ni por empresa | – | Por país: producción, superficie y exportaciones | Por país: rendimiento (kg/ha) |

## Fuentes evaluadas

### Las que ya están conectadas (corren solas en GitHub Actions)

1. **Global Energy Monitor (GEM)** – trackers de yacimientos de petróleo y gas (GOGET), minas de hierro (GIOMT) y de carbón (GCMT). Licencia CC BY 4.0. Cada activo trae operador, dueño directo y casa matriz con porcentaje, producción o capacidad, estado y ficha en GEM.wiki con las fuentes primarias citadas. Se leen del repositorio público de mapas de GEM (`github.com/GlobalEnergyMonitor/maps`), porque la descarga oficial pide un formulario.
   - Versiones usadas: GOGET feb-2025, GIOMT nov-2024, GCMT 2025. En el CDN público de GEM hay versiones más nuevas (`Current_maps/giomt/giomt_map_2026-09.geojson`, `Current_maps/gcmt-smp/gcmt-smp_map_2026-08.geojson`): el próximo paso es leer esas.
   - GEM publica además el **Global Energy Ownership Tracker**: la cadena completa de propiedad (filiales, SPV, fondos, Estados) con %, ya vinculada al LEI de GLEIF. Es la fuente para pasar de "dueño" a "beneficiario final".
2. **Climate TRACE – API v6** (`api.climatetrace.org/v6/assets`), sin clave, CC BY 4.0. Por activo: ubicación, actividad (mineral procesado, barriles), capacidad, factor de emisión, dueños y puesto en su sector. La producción de yacimientos de petróleo y gas aparece como "license restricted" (viene de Rystad), por eso esa capa se toma de GEM. La API es beta: pide volumen bajo.
3. **FAOSTAT – QCL** (descarga masiva, CSV): producción, superficie cosechada y rendimiento por país para soja, maíz, trigo, girasol, cebada, carne vacuna y leche. Último año: 2024.
4. **USDA FAS – PSD** (descarga masiva, CSV): exportaciones por país de harina, aceite y poroto de soja, maíz, trigo y carne vacuna. Se usa la última campaña cerrada.

### Candidatas para sumar (no conectadas todavía)

- **Registros oficiales de cada país** (lo más cercano a "fuentes de gobierno"): no hay una API mundial única, pero varios países publican catastros con dueños y %. Los más útiles para comparar con la Argentina: Noruega (Sodir FactPages, socios por licencia con %), Reino Unido (NSTA), Brasil (ANP para petróleo; ANM para minería), Chile (Cochilco / Sernageomin), Perú (MINEM), Australia (Geoscience Australia), Canadá (NRCan), EE. UU. (EIA, BOEM, USGS). Cada uno tiene su formato: sumarlos es trabajo de a uno.
- **USGS Minerals Yearbook, vol. III (internacional)**: cada capítulo por país trae una tabla de "estructura de la industria" con dueños, ubicación y capacidad de las principales minas y plantas, en XLSX. Es oficial (gobierno de EE. UU.) y cubre oro, plata, litio y cobre, que hoy faltan. Desventaja: se publica con 2–4 años de atraso.
- **Presentaciones de las empresas cotizantes**: en EE. UU. la norma S-K 1300 obliga a informar cada mina material (reservas, producción, costos) en el 10-K; en Canadá, NI 43-101 (SEDAR+). No vienen en formato estructurado: hay que leer cada informe. Es la vía para litio, oro y plata con cifras citables.
- **EITI**: más de 50 países publican pagos por proyecto y beneficiarios finales de empresas extractivas (la Argentina es miembro).
- **GLEIF (LEI)**: API abierta con relaciones matriz–filial (sin %); sirve para unificar nombres de empresas entre fuentes.
- **Trase**: exportadores de soja por departamento y empresa (Argentina 2015–2019, Brasil hasta 2022). Única fuente abierta de "participación por empresa" en el agro, pero con atraso.

### Eficiencia: qué existe y qué no

- Abierto y comparable: intensidad de emisiones por unidad producida (Climate TRACE), uso de la capacidad y productividad laboral (GEM), rendimiento por hectárea (FAO).
- Con licencia (no se puede publicar): costo de extracción por barril, *breakeven*, costo AISC/C1 por mina (Rystad, Wood Mackenzie, S&P Capital IQ). 
- Alternativa citable para empresas cotizantes: costos por boe y márgenes que las empresas informan en sus balances (10-K / 20-F / CNV). Se puede armar para las empresas con activos en la Argentina.

## Qué quedó hecho (rama `main`)

- **Arreglo del Circuito global**: los proyectos argentinos ya no se ven como puntos negros. Oil & Gas ● naranja, minería ▲ azul, agro ✚ verde, con referencia en la leyenda.
- **`mundo.html` (beta)**, enlazada desde la barra de vistas ("Mundo β"):
  - Mapa mundial con ≈ 15.000 activos; color y forma por sector; tamaño del punto según producción o capacidad; los activos argentinos con aro azul y por encima del resto.
  - Para cada tipo de activo: ranking por activo, por país y por empresa (producción atribuible según su participación), y ranking de eficiencia donde hay dato. La Argentina se intercala siempre aunque no esté en el top.
  - Ficha de cada activo con dueños y % (barras), operador, puesto mundial y link a GEM.wiki.
  - Ficha de empresa: todos sus activos en el mundo, su puesto y **qué parte de su producción está en la Argentina** (p. ej. TotalEnergies ≈ 3%, BP ≈ 2%, Chevron ≈ 2%, Tecpetrol ≈ 67%).
  - Agro por país: mapa coroplético y rankings de producción, rendimiento y exportaciones.
- **Datos automáticos**: `scripts/mundo/mundo.py` + workflow `mundo-datos.yml` (día 2 de cada mes y cuando cambia el script). Si una fuente falla, conserva lo anterior.

Algunos resultados (datos de las fuentes, no estimaciones propias):

| | Argentina en el total mundial | Puesto entre países |
|---|---|---|
| Producción de petróleo y gas (yacimientos) | 0,8% | 25° de 75 |
| Capacidad de refinación | 0,6% | 31° de 102 |
| Producción de soja (FAO 2024) | 12,1% | 3° |
| Exportación de harina y de aceite de soja (USDA, campaña 2024/25) | ≈ 30 Mt de harina y 7 Mt de aceite | 1° en ambas |

## Advertencias importantes

1. **GEM y Climate TRACE no son fuentes oficiales** según el criterio del proyecto (Boletín Oficial, Secretarías, empresas). Son compilaciones de organizaciones sin fines de lucro que citan, activo por activo, documentos de empresas y de gobiernos. Por eso la página está separada y marcada como beta: hay que decidir si se aceptan con su cita o si se reemplazan por registros oficiales país por país.
2. Las cifras de GEM de algunas capas tienen uno o dos años; la de Climate TRACE es un modelo (con nivel de confianza por activo).
3. Los nombres de empresas se unifican de forma automática ("BP", "BP P.L.C.", "Bp Plc"); puede quedar alguna empresa partida en dos o, más raro, dos empresas distintas unidas.
4. Cuando la fuente nombra dueños sin porcentaje, la página reparte en partes iguales y lo marca con "≈".

## Próximos pasos sugeridos (en orden)

1. Pasar GOGET/GIOMT/GCMT a las versiones 2026 del CDN de GEM y sumar el Ownership Tracker (beneficiario final).
2. Sumar los activos argentinos propios (litio, oro, plata, RIGI) como capa "sólo Argentina" en el mapa mundial.
3. Litio, oro y plata en el mundo: arrancar por las 30–50 minas más grandes de cada uno a partir de los 10-K / NI 43-101 de las empresas y del USGS Minerals Yearbook, con la misma estructura de dueños y %.
4. Eficiencia por empresa: costo de extracción por boe y margen EBITDA desde los balances de las empresas con activos en la Argentina.
5. Sumar registros oficiales de 3–4 países comparables (Brasil ANP, Noruega Sodir, Chile Cochilco, Australia GA).
